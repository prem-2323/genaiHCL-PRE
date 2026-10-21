"""Managed local Ollama inference using Python standard library."""
import json
import logging
import os
import shutil
import subprocess
import tempfile
from threading import Lock
import time
from urllib.error import URLError
from urllib.request import build_opener, HTTPRedirectHandler, ProxyHandler, Request
from app.llm.schema import SCHEMA
from app.models import ActionPlan

logger = logging.getLogger(__name__)


class NoRedirects(HTTPRedirectHandler):
    def redirect_request(self, req, fp, code, msg, headers, newurl):
        return None


class OllamaProvider:
    name = 'ollama'

    def __init__(self):
        env_model = os.getenv('OLLAMA_MODEL', '').strip()
        model_path = os.getenv('MODEL_PATH', '').strip()
        if env_model:
            self.model_name = env_model
        elif model_path and not model_path.lower().endswith('.gguf') and '\\' not in model_path and '/' not in model_path:
            self.model_name = model_path
        else:
            self.model_name = 'qwen2.5:3b'

        host = os.getenv('OLLAMA_HOST', '127.0.0.1')
        port = int(os.getenv('OLLAMA_PORT', '11434'))
        if not 1024 <= port <= 65535:
            raise ValueError('OLLAMA_PORT must be between 1024 and 65535.')
        self.port = port
        self.host = host
        self.base_url = os.getenv('OLLAMA_URL', f'http://{host}:{port}').rstrip('/')
        self._opener = build_opener(ProxyHandler({}), NoRedirects())
        self._process = None
        self._log = None
        self._load_lock = Lock()
        self.status, self.error = 'not_loaded', None
        self.progress = {'phase': 'idle', 'input_tokens': 0, 'generated_tokens': 0}
        self.last_timings = {}

    def _request(self, path, timeout, body=None):
        data = json.dumps(body).encode('utf-8') if body is not None else None
        request = Request(
            self.base_url + path,
            data=data,
            headers={'Content-Type': 'application/json'}
        )
        with self._opener.open(request, timeout=max(.001, timeout)) as response:
            return json.load(response)

    def _load(self, deadline=None):
        if deadline is None:
            deadline = time.monotonic() + max(1, min(300, float(os.getenv('GENERATION_TIMEOUT', '90'))))
        with self._load_lock:
            if self.status == 'ready':
                return
            if self.status == 'error':
                raise RuntimeError(self.error or 'Restart the backend after fixing the Ollama runtime.')
            self.status = 'loading'
            try:
                # 1. Probe Ollama health / tags
                reachable = False
                while time.monotonic() < deadline:
                    try:
                        self._request('/api/version', min(2, max(0.1, deadline - time.monotonic())))
                        reachable = True
                        break
                    except (URLError, TimeoutError, OSError):
                        if self._process is None and shutil.which('ollama'):
                            try:
                                self._log = tempfile.TemporaryFile()
                                self._process = subprocess.Popen(
                                    ['ollama', 'serve'],
                                    stdin=subprocess.DEVNULL,
                                    stdout=self._log,
                                    stderr=subprocess.STDOUT,
                                    creationflags=subprocess.CREATE_NO_WINDOW if os.name == 'nt' else 0
                                )
                            except Exception as exc:
                                logger.warning('Failed to auto-start ollama serve: %s', exc)
                    time.sleep(0.2)

                if not reachable:
                    raise RuntimeError(f'Could not connect to Ollama at {self.base_url}. Ensure Ollama is running (`ollama serve`).')

                # 2. Check if model is pulled
                tags = self._request('/api/tags', min(5, max(0.1, deadline - time.monotonic())))
                models = [m.get('name', '') for m in tags.get('models', [])] + [m.get('model', '') for m in tags.get('models', [])]
                model_base = self.model_name.split(':')[0]
                matched = any(
                    self.model_name == m or self.model_name == m.split(':')[0] or m.startswith(self.model_name + ':') or m.startswith(model_base + ':')
                    for m in models
                )
                if not matched and models:
                    raise RuntimeError(f"Ollama model '{self.model_name}' not found. Available models: {', '.join(set(models))}. Run 'ollama pull {self.model_name}'.")

                self.status, self.error = 'ready', None
            except Exception as exc:
                self.status, self.error = 'error', str(exc)[:300]
                raise

    def generate(self, messages, deadline):
        return self._generate_json(messages, deadline, SCHEMA, 400)

    def generate_plan(self, messages, deadline):
        return self._generate_json(messages, deadline, ActionPlan.model_json_schema(), 240)

    def _generate_json(self, messages, deadline, schema, token_limit):
        if time.monotonic() >= deadline:
            raise TimeoutError('Generation deadline exceeded.')
        self._load(deadline)
        remaining = deadline - time.monotonic()
        if remaining <= 0:
            raise TimeoutError('Generation deadline exceeded.')
        self.progress = {'phase': 'generating', 'input_tokens': 0, 'generated_tokens': 0}
        try:
            body = {
                'model': self.model_name,
                'messages': messages,
                'format': schema,
                'stream': False,
                'options': {
                    'temperature': 0,
                    'num_predict': max(32, min(token_limit, int(os.getenv('MAX_NEW_TOKENS', '300'))))
                }
            }
            result = self._request('/api/chat', remaining, body)
            if time.monotonic() >= deadline:
                raise TimeoutError('Local generation timed out.')
            if result.get('done_reason') == 'length':
                raise ValueError('Local model output was truncated; retry with a focused alert.')
            msg = result.get('message', {})
            content = msg.get('content')
            if not isinstance(content, str) or not content.strip():
                raise ValueError('Local model returned no text.')
            self.last_timings = {
                'prompt_eval_count': result.get('prompt_eval_count', 0),
                'eval_count': result.get('eval_count', 0),
                'total_duration': result.get('total_duration', 0),
                'eval_duration': result.get('eval_duration', 0),
            }
            self.progress.update(
                input_tokens=result.get('prompt_eval_count', 0),
                generated_tokens=result.get('eval_count', 0)
            )
            return content
        finally:
            self.progress['phase'] = 'idle'

    def close(self):
        process, self._process = self._process, None
        if process is not None and process.poll() is None:
            process.terminate()
            try:
                process.wait(timeout=3)
            except subprocess.TimeoutExpired:
                process.kill()
                process.wait(timeout=1)
        if self._log is not None:
            self._log.close()
            self._log = None
