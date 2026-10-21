import json
import pytest
from app.llm.providers import get_provider
from app.llm.ollama import OllamaProvider


def test_ollama_provider_selection(monkeypatch):
    monkeypatch.setenv('LLM_PROVIDER', 'ollama')
    monkeypatch.setenv('OLLAMA_MODEL', 'qwen2.5:3b')
    provider = get_provider()
    assert isinstance(provider, OllamaProvider)
    assert provider.name == 'ollama'
    assert provider.model_name == 'qwen2.5:3b'
    assert provider.status == 'not_loaded'


def test_ollama_port_validation(monkeypatch):
    monkeypatch.setenv('OLLAMA_PORT', '99999')
    with pytest.raises(ValueError, match='OLLAMA_PORT must be between 1024 and 65535'):
        OllamaProvider()


def test_ollama_generate_mocked(monkeypatch):
    provider = OllamaProvider()
    provider.status = 'ready'

    expected_narrative = {
        'summary': "An account named 'service-user' at IP 192.0.2.21 had failed logins.",
        'why_it_matters': "Potential brute force attempt.",
        'verify_first': ["Review auth logs.", "Verify user authorization."],
        'next_steps': ["Investigate logs.", "Confirm credentials.", "Respond by locking account."]
    }

    def fake_request(path, timeout, body=None):
        if path == '/api/chat':
            return {
                'model': 'qwen2.5:3b',
                'message': {'role': 'assistant', 'content': json.dumps(expected_narrative)},
                'done': True,
                'done_reason': 'stop',
                'prompt_eval_count': 40,
                'eval_count': 120,
                'total_duration': 500000000,
                'eval_duration': 400000000
            }
        return {}

    monkeypatch.setattr(provider, '_request', fake_request)
    raw = provider.generate([{'role': 'user', 'content': 'Explain alert'}], 9999999999.0)
    data = json.loads(raw)
    assert data['summary'] == expected_narrative['summary']
    assert provider.last_timings['prompt_eval_count'] == 40
    assert provider.progress['generated_tokens'] == 120


def test_ollama_generate_plan_mocked(monkeypatch):
    provider = OllamaProvider()
    provider.status = 'ready'

    expected_plan = {
        'next_steps': [
            'Investigate: check failed logins',
            'Confirm: verify with user',
            'Respond if confirmed: reset password'
        ]
    }

    def fake_request(path, timeout, body=None):
        if path == '/api/chat':
            return {
                'model': 'qwen2.5:3b',
                'message': {'role': 'assistant', 'content': json.dumps(expected_plan)},
                'done': True,
                'done_reason': 'stop',
                'prompt_eval_count': 30,
                'eval_count': 60
            }
        return {}

    monkeypatch.setattr(provider, '_request', fake_request)
    raw = provider.generate_plan([{'role': 'user', 'content': 'Provide plan'}], 9999999999.0)
    data = json.loads(raw)
    assert data['next_steps'] == expected_plan['next_steps']
