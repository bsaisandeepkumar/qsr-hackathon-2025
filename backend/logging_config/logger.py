# logging_config/logger.py

import logging
import logging.config
import json
import os
import uuid
from fastapi import Request
from starlette.middleware.base import BaseHTTPMiddleware

LOG_CONFIG_PATH = os.path.join(os.path.dirname(__file__), "config.json")

def init_logging():
    with open(LOG_CONFIG_PATH, "r") as f:
        config = json.load(f)
        logging.config.dictConfig(config)

def get_logger(name: str):
    return logging.getLogger(name)

# Middleware to inject correlation_id per request
class CorrelationIdMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        correlation_id = request.headers.get("X-Correlation-ID", str(uuid.uuid4()))
        request.state.correlation_id = correlation_id

        # Add correlation_id to logs for this request
        logger = logging.getLogger("backend")
        logger.info(f"Incoming request: {request.method} {request.url.path}", extra={"correlation_id": correlation_id})

        response = await call_next(request)
        response.headers["X-Correlation-ID"] = correlation_id

        logger.info(f"Response completed: {request.url.path} status={response.status_code}",
            extra={"correlation_id": correlation_id})

        return response
