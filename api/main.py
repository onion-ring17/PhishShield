import json, time
from typing import Optional
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

from redaction import redact
from detection import run_detection
from gemini_explainer import explain
from db import save_feedback, save_analysis

app = FastAPI(title="TRUSTLENS API")
app.add_middleware(CORSMiddleware, allow_origins=["*"],
                   allow_methods=["*"], allow_headers=["*"])

class AnalyzeRequest(BaseModel):
    message: str = Field(max_length=5000)
    channel: str = "SMS"
    language: str = "auto"
    claimed_identity: Optional[str] = None
    private_mode: bool = True

class FeedbackRequest(BaseModel):
    is_false_positive: bool
    risk_level: str
    comment: Optional[str] = None

@app.get("/health")
def health():
    return {"status": "ok"}

LANGUAGE_NAMES = {
    "en": "English",
    "hi": "Hindi",
    "kn": "Kannada",
}

@app.post("/analyze")
def analyze(req: AnalyzeRequest):
    detection = run_detection(req.message, req.channel, req.claimed_identity)
    safe_text = redact(req.message)
    lang_name = LANGUAGE_NAMES.get(
    req.language, "the same language as the message (English if unsure)"
    )
    explanation = explain(safe_text, detection, lang_name)

    if not req.private_mode:
        save_analysis(
            channel=req.channel,
            language=req.language,
            risk_score=int(detection.get("risk_score", 0)),
            risk_level=str(detection.get("risk_level", "")),
            classification=str(detection.get("classification", "")),
            signal_types=[s.get("type", "") for s in detection.get("signals", [])],
        )

    return {**detection, **explanation}

@app.post("/feedback")
def feedback(req: FeedbackRequest):
    data = req.model_dump()
    saved = save_feedback(
        is_false_positive=bool(data.get("is_false_positive", False)),
        risk_level=str(data.get("risk_level", "")),
        comment=redact(str(data.get("comment", "") or ""))[:500],
    )
    return {"status": "received" if saved else "saved_failed"}