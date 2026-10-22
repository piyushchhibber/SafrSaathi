#!/bin/bash
python -m app.seed || python -m backend.app.seed || true
python -m uvicorn app.main:app --host 0.0.0.0 --port $PORT
