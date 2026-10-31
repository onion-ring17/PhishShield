# TrustLens (PhishShield)

**Check it before you trust it.**

TrustLens is an explainable phishing detector delivered as the **PhishShield** Chrome side-panel extension. Instead of a bare "safe" or "dangerous" label, every verdict is backed by named evidence from a fine-tuned BERT model, a rule engine, offline URL forensics and the Gemini API.

---

## Why TrustLens?

| A typical checker | TrustLens |
| --- | --- |
| A bare "safe" or "dangerous" label | Every verdict backed by named evidence |
| One black-box model decides alone | Model, rules and URL checks weigh in together |
| Links are visited or scanned remotely | Read-only: links are analysed offline, never opened or clicked |
| Messages are logged to the cloud | Private mode: nothing stored by default |

## Key Features

- **Explainable verdicts:** a risk score, the evidence behind it and clear next steps.
- **Hybrid detection:** three independent signals combined into one score.
- **Read-only by design:** TrustLens only reads content. It never clicks, replies, presses buttons or opens links.
- **Gemini API explanations:** plain-language reasons in English, Hindi and Kannada. Gemini explains only the detected evidence and never says to click or reply.
- **Private by default:** emails, phone numbers and long account numbers are masked before the LLM sees them. Nothing is stored unless the user opts in, and logs hold metadata only, never the message.
- **Resilient:** retries, a backup model and offline explanation text, so the panel always returns something useful.

## How It Works

```
Extension  ->  FastAPI  ->  Detection  ->  Gemini API  ->  Verdict
```

1. **Extension:** the user selects text or right-clicks a link in Chrome.
2. **FastAPI:** the `/analyze` endpoint masks personal data and extracts links.
3. **Detection:** the NLP model, rule engine and URL analyzer are scored together.
4. **Gemini API:** generates plain-language reasons (EN, HI, KN) from the evidence only.
5. **Verdict:** the side panel shows the score, evidence and next steps.

Supporting services:
- **Hugging Face:** hosts the BERT model, which returns a label and a confidence.
- **Supabase:** opt-in, metadata-only storage, plus false-positive feedback.
- **Fallbacks:** a stub detector if the engine errors, and offline text if Gemini is down.

## Scoring

Three signals are blended into a final score out of 100:

| Signal | Weight | What it does |
| --- | --- | --- |
| NLP model | 40% | BERT fine-tuned on about 20k datapoints returns phishing, legitimate or uncertain, with a confidence |
| Rule engine | 30% | Detects six scam tactics: urgency, OTP asks, money asks, impersonation, bait and threats |
| URL analyzer | 30% | 11 offline checks, including lookalike brands, IP hosts, punycode, shorteners and link mismatch |

**Risk levels**

| Level | Final score |
| --- | --- |
| Low | below 35 |
| Medium | 35 to 69 |
| High | 70 and above |

- A **+15 bonus** applies when all three signals agree strongly.
- If a signal is missing, the remaining weights are re-weighted.
- If there is no evidence at all, the result is **INCONCLUSIVE** instead of a false "safe".

> The weights are prototype values and still need calibration on labelled data.

## Tech Stack

- **Extension:** Chrome side panel (PhishShield)
- **Backend:** FastAPI
- **NLP model:** BERT, hosted on Hugging Face
- **LLM explanations:** Gemini API
- **Database:** Supabase

## Getting Started

> Adjust the commands, paths and variable names below to match your repository layout.

```bash
# 1. Clone the repo
git clone <your-repo-url>
cd <your-repo-name>

# 2. Start the backend
cd backend
pip install -r requirements.txt
uvicorn main:app --reload
```

Example environment variables:

```bash
GEMINI_API_KEY=your-key
SUPABASE_URL=your-supabase-url
SUPABASE_KEY=your-supabase-key
```

To load the extension: open `chrome://extensions`, enable **Developer mode**, click **Load unpacked** and select the extension folder.

## Usage

1. Select suspicious text on a page, or right-click a link.
2. Open the PhishShield side panel.
3. Read the risk score, the evidence behind it and the suggested next steps.

## Team

| Name | Role |
| --- | --- |
| Arav | NLP model, datasets and labels, hosted on Hugging Face |
| Avirath | Rule engine, URL analyzer, risk scoring and levels |
| Haider | PhishShield extension, side panel, risk meter and UX |
| Arnav | FastAPI backend, Gemini integration, redaction and Supabase |

## Roadmap

- [ ] Wire the BERT model into `/analyze` so all three signals contribute
- [ ] Calibrate scoring weights on labelled data
- [ ] Grow brand coverage and Hindi/Kannada rules
- [ ] Host and publish

## License

Add a license for your project here (for example, MIT).
