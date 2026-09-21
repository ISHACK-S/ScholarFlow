import os
import warnings
from pathlib import Path

from dotenv import load_dotenv

load_dotenv(dotenv_path=Path(__file__).resolve().parents[3] / '.env')

_PLACEHOLDER_VALUES = {
    'your-project.supabase.co',
    'your-anon-key',
    'your-service-role-key',
    'your-gemini-key',
    'replace-me',
    'placeholder',
}


def _is_placeholder_value(value: str) -> bool:
    normalized = value.strip().lower()
    return normalized in _PLACEHOLDER_VALUES or normalized.startswith('your-')


def validate_runtime_configuration() -> bool:
    missing = []
    invalid = []

    required = {
        'SUPABASE_URL': os.getenv('SUPABASE_URL', ''),
        'SUPABASE_ANON_KEY': os.getenv('SUPABASE_ANON_KEY', ''),
        'SUPABASE_SERVICE_ROLE_KEY': os.getenv('SUPABASE_SERVICE_ROLE_KEY', ''),
        'GEMINI_API_KEY': os.getenv('GEMINI_API_KEY', ''),
    }

    for name, value in required.items():
        if not value or not value.strip():
            missing.append(name)
        elif _is_placeholder_value(value):
            invalid.append(name)

    if missing or invalid:
        issues = []
        if missing:
            issues.append('Missing required environment variables: ' + ', '.join(missing))
        if invalid:
            issues.append(
                'Placeholder credentials detected; replace them with live values: '
                + ', '.join(invalid)
            )

        warnings.warn(' | '.join(issues), RuntimeWarning, stacklevel=2)

        strict_mode = os.getenv('SCHOLARFLOW_STRICT_RUNTIME_CONFIG', '').strip().lower() in {
            '1',
            'true',
            'yes',
            'on',
        }
        if strict_mode:
            raise RuntimeError(' | '.join(issues))

        return False

    return True
