# NeuroSense-AI-Mental-Wellness-Monitoring-Application

A cross-platform AI mental wellness analytics platform that integrates with wearable and sensor devices to estimate stress level, recovery state, and emotional wellness trends.

## Tech Stack

- Frontend: React Native (Expo) + TypeScript
- Backend: FastAPI (Python)
- Database: SQLite (dev) / PostgreSQL (prod)
- Analytics: Rule-based stress, recovery, and burnout engines
- State Management: Redux Toolkit

## Getting Started

### Backend
```bash
cd backend
pip install -r requirements.txt
uvicorn app.main:app --reload
```

### Frontend (Web)
````bash
cd frontend
npm install
npm run web
````

## Features

- Real-time stress detection
- Burnout risk prediction
- Recovery score analysis
- Mood analytics and journaling
- Universal device onboarding and management
