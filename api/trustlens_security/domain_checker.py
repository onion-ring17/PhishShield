
from difflib import SequenceMatcher
import re


# Small prototype reference list.
# This should eventually be replaced with maintained brand-domain data.
TRUSTED_DOMAINS = {
    "google": "google.com",
    "paypal": "paypal.com",
    "amazon": "amazon.com",
    "microsoft": "microsoft.com",
    "apple": "apple.com",
    "facebook": "facebook.com",
    "instagram": "instagram.com",
    "netflix": "netflix.com",
}


# Common character substitutions used in lookalike domains.
CHARACTER_SUBSTITUTIONS = str.maketrans({
    "0": "o",
    "1": "l",
    "3": "e",
    "5": "s",
    "8": "b",
})


def normalize_domain_for_comparison(domain: str) -> str:
    """Normalize a domain for consistent comparison."""

    if not isinstance(domain, str):
        return ""

    domain = domain.lower().strip().rstrip(".")

    if domain.startswith("www."):
        domain = domain[4:]

    # Convert internationalized domains into ASCII representation.
    try:
        domain = domain.encode("idna").decode("ascii")
    except UnicodeError:
        return ""

    return domain


def get_registered_label(domain: str) -> str:
    """Extract the main label from a registered domain."""

    parts = domain.split(".")

    if len(parts) < 2:
        return parts[0]

    return parts[-2]


def normalize_lookalike_label(label: str) -> str:
    """Normalize common character substitutions."""

    label = label.translate(CHARACTER_SUBSTITUTIONS)

    # A common homoglyph pattern: rn can resemble m.
    label = label.replace("rn", "m")

    # Remove hyphens for comparison.
    label = label.replace("-", "")

    return label


def analyze_lookalike_domain(domain: str) -> dict:
    """
    Compare a domain against known brand domains.

    This detects possible lookalikes, not confirmed impersonation.
    """

    domain = normalize_domain_for_comparison(domain)

    if not domain:
        return {
            "suspicious": False,
            "matched_brand": None,
            "similarity": 0.0,
        }

    # Exact trusted domains and their subdomains should not
    # be classified as lookalikes.
    for trusted_domain in TRUSTED_DOMAINS.values():
        if domain == trusted_domain or domain.endswith("." + trusted_domain):
            return {
                "suspicious": False,
                "matched_brand": None,
                "similarity": 1.0,
        }

    # Only compare the registered-domain label.
    domain_label = get_registered_label(domain)

    if not domain_label or not re.fullmatch(r"[a-z0-9-]+", domain_label):
        return {
            "suspicious": False,
            "matched_brand": None,
            "similarity": 0.0,
        }

    comparison_label = normalize_lookalike_label(domain_label)

    best_match = None
    best_similarity = 0.0

    for brand, trusted_domain in TRUSTED_DOMAINS.items():

        trusted_label = get_registered_label(trusted_domain)

        similarity = SequenceMatcher(
            None,
            comparison_label,
            trusted_label
        ).ratio()

        if similarity > best_similarity:
            best_similarity = similarity
            best_match = brand

    # Avoid flagging short or unrelated domains.
    suspicious = (
    best_similarity >= 0.80
    and len(comparison_label) >= 5
    )

    return {
        "suspicious": suspicious,
        "matched_brand": best_match if suspicious else None,
        "similarity": round(best_similarity, 2),
    }
