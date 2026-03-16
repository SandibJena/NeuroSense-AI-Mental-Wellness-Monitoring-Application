# NeuroSense – AI Mental Wellness Monitoring Application

A cross-platform AI mental wellness analytics platform that integrates with wearable devices to estimate stress level, recovery state, and emotional wellness trends.

## Tech Stack

- **Frontend**: React Native (Expo) + TypeScript
- **Backend**: FastAPI (Python)
- **Database**: SQLite (dev) / PostgreSQL (prod)
- **ML**: Scikit-learn, TensorFlow
- **State Management**: Redux Toolkit
- **UI**: Material Design 3

## Getting Started

### Backend
```bash
cd backend
pip install -r requirements.txt
uvicorn app.main:app --reload
```

### Frontend
```bash
cd frontend
npm install
npx expo start
```

## Features

- Real-time stress detection
- Burnout risk prediction
- Recovery score analysis
- Mood analytics & journaling
- Wearable device integration (Apple Watch, Fitbit, Oura, Samsung, Garmin)
