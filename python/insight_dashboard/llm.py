from __future__ import annotations

import json
import os
from typing import TypeVar

import httpx
from pydantic import BaseModel, ValidationError
from tenacity import retry, retry_if_exception_type, stop_after_attempt, wait_exponential

T = TypeVar("T", bound=BaseModel)


class LLMClient:
    def __init__(self) -> None:
        self.api_key = os.getenv("LLM_API_KEY", "")
        self.base_url = os.getenv("LLM_BASE_URL", "https://api.openai.com/v1").rstrip("/")
        self.model = os.getenv("LLM_MODEL", "")
        self.timeout = float(os.getenv("LLM_TIMEOUT", "60"))
        self.max_retries = int(os.getenv("LLM_MAX_RETRIES", "3"))
        self.temperature = float(os.getenv("LLM_TEMPERATURE", "0.2"))

    @property
    def configured(self) -> bool:
        return bool(self.api_key and self.model)

    @retry(retry=retry_if_exception_type((httpx.HTTPError, TimeoutError)), wait=wait_exponential(min=1, max=8), stop=stop_after_attempt(3), reraise=True)
    def _request(self, messages: list[dict[str, str]], schema: type[T]) -> dict:
        if not self.configured:
            raise RuntimeError("LLM_API_KEY and LLM_MODEL are required for live generation")
        with httpx.Client(timeout=self.timeout) as client:
            response = client.post(
                f"{self.base_url}/chat/completions",
                headers={"Authorization": f"Bearer {self.api_key}", "Content-Type": "application/json"},
                json={"model": self.model, "temperature": self.temperature, "messages": messages, "response_format": {"type": "json_schema", "json_schema": {"name": schema.__name__, "strict": True, "schema": schema.model_json_schema()}}},
            )
            response.raise_for_status()
            return response.json()

    def structured(self, messages: list[dict[str, str]], schema: type[T]) -> T:
        repair_messages = list(messages)
        last_error: Exception | None = None
        for attempt in range(3):
            payload = self._request(repair_messages, schema)
            content = payload["choices"][0]["message"]["content"]
            try:
                return schema.model_validate(json.loads(content))
            except (ValidationError, json.JSONDecodeError) as exc:
                last_error = exc
                if attempt < 2:
                    repair_messages.append({"role": "user", "content": f"上一次 JSON 未通过 Schema：{exc}. 只返回修复后的 JSON，不补充新事实。"})
        raise RuntimeError(f"LLM output failed validation after two repairs: {last_error}")
