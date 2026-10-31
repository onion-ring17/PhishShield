import os
from dotenv import load_dotenv
from supabase import create_client

load_dotenv()

_client = create_client(os.getenv("SUPABASE_URL"), os.getenv("SUPABASE_KEY"))


def save_feedback(is_false_positive: bool, risk_level: str, comment: str = "") -> bool:
    try:
        _client.table("feedback").insert({
            "is_false_positive": is_false_positive,
            "risk_level": risk_level,
            "comment": comment,
        }).execute()
        return True
    except Exception as e:
        print("Supabase error:", e)
        return False


def save_analysis(channel: str, language: str, risk_score: int,
                  risk_level: str, classification: str,
                  signal_types: list) -> bool:
    try:
        _client.table("analysis_log").insert({
            "channel": channel,
            "language": language,
            "risk_score": risk_score,
            "risk_level": risk_level,
            "classification": classification,
            "signal_types": signal_types,
        }).execute()
        return True
    except Exception as e:
        print("Supabase error:", e)
        return False