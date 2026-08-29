from __future__ import annotations

from urllib.parse import urlsplit


def valid_public_source(url: str) -> bool:
    parts = urlsplit(url)
    return parts.scheme == "https" and bool(parts.netloc) and parts.hostname not in {"localhost", "127.0.0.1"}
