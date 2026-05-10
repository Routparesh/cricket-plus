import os
from supabase import create_client, Client
from dotenv import load_dotenv

load_dotenv()

url: str = os.environ.get("SUPABASE_URL", "http://localhost:8000")
key: str = os.environ.get("SUPABASE_KEY", "dummy_key")

supabase: Client = create_client(url, key)

def get_supabase() -> Client:
    return supabase
