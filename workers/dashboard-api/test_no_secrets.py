import os, re

HERE = os.path.dirname(os.path.abspath(__file__))
PATTERNS = [r"sk-[A-Za-z0-9_-]{12,}", r"CWA-[0-9A-F]{8}-", r"\b[0-9a-f]{40}\b"]


def test_no_hardcoded_secrets_in_server_or_wrangler():
    for name in ("server.py", "wrangler.toml"):
        text = open(os.path.join(HERE, name), encoding="utf-8").read()
        for p in PATTERNS:
            assert not re.search(p, text), f"{name} matches {p}"


def test_server_reads_secrets_from_environment():
    text = open(os.path.join(HERE, "server.py"), encoding="utf-8").read()
    for var in ("CWA_KEY", "WAQI_TOKEN", "TH_KEY"):
        assert f'os.environ.get("{var}"' in text or f"os.environ['{var}']" in text, var
