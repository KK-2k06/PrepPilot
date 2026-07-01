import os
from supabase import create_client, Client
from dotenv import load_dotenv

load_dotenv()

url: str = os.environ.get("SUPABASE_URL", "")
key: str = os.environ.get("SUPABASE_KEY", "")

# Initialize client only if keys are present
supabase: Client | None = None
if url and key and url != "your-supabase-url":
    supabase = create_client(url, key)

def save_topics(topics: list):
    if not supabase:
        print("Supabase client not configured.")
        return
    # TODO: Create a 'topics' table in Supabase to insert this
    # supabase.table("topics").insert(topics).execute()
    pass

def save_schedule(schedule: list):
    if not supabase:
        print("Supabase client not configured.")
        return
    # TODO: Create a 'schedules' table in Supabase to insert this
    # supabase.table("schedules").insert(schedule).execute()
    pass
