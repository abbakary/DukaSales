@echo off
echo Starting Backend Server...
cd /d "c:\New folder\new\v6saaspos\backend"
python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
pause
