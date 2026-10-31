import re
from trustlens_security import analyze_security
from detection_stub import run_detection as stub_detection

URL_PATTERN = re.compile(r"(?:https?://|www\.)[^\s<>\"']+", re.IGNORECASE)

HIGH_RULES = {"credential_request", "financial_request"}
HIGH_URL_FLAGS = {
    "ip_address_host", "embedded_credentials", "possible_lookalike_domain",
    "visible_destination_mismatch", "at_symbol_authority",
}
LEVEL_MAP = {"LOW": "LOW", "MEDIUM": "MODERATE", "HIGH": "HIGH",
             "INCONCLUSIVE": "INCONCLUSIVE"}


def extract_urls(message: str) -> list:
    found = []
    for raw in URL_PATTERN.findall(message or ""):
        url = raw.rstrip(".,;:!?)]}'\"")
        if url and url not in found:
            found.append(url)
    return [{"url": u, "visible_text": ""} for u in found]


def run_detection(message: str, channel: str, claimed_identity=None, nlp_result=None):
    try:
        result = analyze_security(
            message=message,
            urls=extract_urls(message),
            nlp_result=nlp_result or {},
        )
    except Exception as e:
        print("Detection error, using stub:", e)
        return stub_detection(message, channel, claimed_identity)

    signals = []
    for item in result["evidence"]:
        if item["source"] == "rule_engine":
            signals.append({
                "type": item["rule"].upper(),
                "evidence": ", ".join(str(m) for m in item["matched_text"]),
                "severity": "HIGH" if item["rule"] in HIGH_RULES else "MEDIUM",
            })
    for u in result["url_analysis"]:
        for flag in u.get("findings", []):
            signals.append({
                "type": flag.upper(),
                "evidence": u.get("url", ""),
                "severity": "HIGH" if flag in HIGH_URL_FLAGS else "MEDIUM",
            })

    score = int(result["score"])
    level = result["risk_level"]
    if level == "INCONCLUSIVE":
        classification = "UNCERTAIN"
    elif score >= 70:
        classification = "PHISHING"
    elif score < 35:
        classification = "LEGITIMATE"
    else:
        classification = "UNCERTAIN"

    return {
        "risk_score": score,
        "risk_level": LEVEL_MAP.get(level, level),
        "classification": classification,
        "language": "auto",
        "signals": signals,
        "assessment_status": result["assessment_status"],
        "components": result["components"],
        "link_status": result["link_status"],
        "recommendations": result["recommendations"],
    }