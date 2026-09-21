import sys
import uuid
from datetime import datetime, timezone
sys.path.insert(0, 'backend')
from dotenv import load_dotenv
load_dotenv(dotenv_path='.env')
from app.database.supabase_client import get_supabase_client

client = get_supabase_client()
print('client created')

try:
    resp = client.table('notes').select('id').limit(1).execute()
    print('table query ok', resp.data)
except Exception as exc:
    print('TABLE_ERROR', type(exc).__name__, exc)

try:
    payload = {
        'id': str(uuid.uuid4()),
        'user_id': str(uuid.uuid4()),
        'title': 'probe',
        'file_name': 'probe.pdf',
        'file_url': 'https://example.com/probe.pdf',
        'created_at': datetime.now(timezone.utc).isoformat(),
    }
    resp = client.table('notes').insert(payload).execute()
    print('insert ok', resp.data)
except Exception as exc:
    print('INSERT_ERROR', type(exc).__name__, exc)

try:
    resp = client.storage.from_('notes').upload('probe/test.txt', b'hello', file_options={'content-type': 'text/plain', 'upsert': 'false'})
    print('storage upload ok', resp)
except Exception as exc:
    print('STORAGE_ERROR', type(exc).__name__, exc)
