from supabase import create_client
from app.config.settings import SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY

supabase = None
supabase_auth = None

if SUPABASE_URL:
    if SUPABASE_ANON_KEY:
        supabase_auth = create_client(SUPABASE_URL, SUPABASE_ANON_KEY)
    if SUPABASE_SERVICE_ROLE_KEY:
        supabase = create_client(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)


def get_supabase_client():
    return supabase


def get_supabase_auth_client():
    return supabase_auth
