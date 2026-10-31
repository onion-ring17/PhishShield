# TrustLens API

FastAPI backend: detection, Gemini explanations, Supabase storage.

## Run locally
```
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
copy .env.example .env      (then fill in the keys)
uvicorn main:app --reload
```
Open http://127.0.0.1:8000/docs to test.

## Endpoints
- POST /analyze: analyze a message (send "private_mode": true to store nothing)
- POST /feedback: report a false positive
- GET /health: status check