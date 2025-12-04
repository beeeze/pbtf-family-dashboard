# PBTF Family Reporting Platform

A comprehensive family engagement reporting and analytics platform for the Pediatric Brain Tumor Foundation.

## Features

- **Main Dashboard**: Family engagement metrics, KPIs, and year-over-year comparisons
- **Direct Services & Support**: Track support calls, peer programs, and webinars
- **Geographic Mapping**: Visualize patient family distribution across the United States
- **Custom Widgets**: Create unlimited custom engagement widgets for specific tracking
- **Settings**: Cache management and application configuration

## Technology Stack

- **Frontend**: React + TypeScript + Vite
- **Backend**: FastAPI (Python)
- **Database**: MongoDB
- **UI Components**: Radix UI + Tailwind CSS
- **Charts**: Recharts
- **Maps**: Leaflet

## Prerequisites

- Node.js 18+ and Yarn
- Python 3.9+
- MongoDB 5.0+
- Virtuous CRM API Key (optional for testing)

## Local Development Setup

### 1. Clone the Repository

```bash
git clone <your-repo-url>
cd pbtf-reporting-platform
```

### 2. Backend Setup

```bash
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Copy environment file and configure
cp .env.example .env
# Edit .env and add your Virtuous API key

# Start the backend server
uvicorn server:app --reload --host 0.0.0.0 --port 8001
```

Backend will be available at: `http://localhost:8001`

### 3. Frontend Setup

```bash
cd frontend

# Install dependencies
yarn install

# Copy environment file
cp .env.example .env

# Start the development server
yarn dev
```

Frontend will be available at: `http://localhost:3000`

### 4. MongoDB Setup

**Option A: Local MongoDB**
```bash
# Install MongoDB Community Edition
# https://www.mongodb.com/docs/manual/installation/

# Start MongoDB
mongod --dbpath /path/to/data
```

**Option B: MongoDB Docker**
```bash
docker run -d -p 27017:27017 --name mongodb mongo:latest
```

**Option C: MongoDB Atlas (Cloud)**
1. Create free account at https://www.mongodb.com/cloud/atlas
2. Create cluster and get connection string
3. Update `MONGO_URL` in `backend/.env`

## Configuration

### Backend Environment Variables

Edit `backend/.env`:

```env
MONGO_URL="mongodb://localhost:27017"
DB_NAME="pbtf_database"
CORS_ORIGINS="http://localhost:3000"
VIRTUOUS_API_KEY="your_actual_api_key"
```

### Frontend Environment Variables

Edit `frontend/.env`:

```env
REACT_APP_BACKEND_URL=http://localhost:8001
```

## API Endpoints

### Backend API (http://localhost:8001)

- `GET /api/` - Health check
- `POST /api/virtuous-api` - Proxy for Virtuous CRM API
- `POST /api/sync-patient-families` - Patient family sync operations
- `POST /api/query-contact-notes` - Query contact notes for support calls
- `GET /api/patient-families` - Get cached patient families
- `POST /api/clear-cache` - Clear cached data

## Project Structure

```
/
├── backend/
│   ├── server.py           # FastAPI application
│   ├── requirements.txt    # Python dependencies
│   └── .env               # Environment variables (not in git)
├── frontend/
│   ├── src/
│   │   ├── components/    # React components
│   │   ├── hooks/         # Custom React hooks
│   │   ├── lib/           # Utilities and helpers
│   │   └── pages/         # Page components
│   ├── public/            # Static assets
│   ├── package.json       # Node dependencies
│   └── .env              # Environment variables (not in git)
└── README.md              # This file
```

## Development Workflow

1. **Start MongoDB** (if running locally)
2. **Start Backend**: `cd backend && uvicorn server:app --reload --port 8001`
3. **Start Frontend**: `cd frontend && yarn dev`
4. **Open Browser**: http://localhost:3000

## Building for Production

### Frontend
```bash
cd frontend
yarn build
# Output in: frontend/build/
```

### Backend
```bash
cd backend
# Backend is ready for production deployment
# Use: uvicorn server:app --host 0.0.0.0 --port 8001
```

## Features Guide

### Custom Widgets

1. Navigate to "Custom Widgets" tab
2. Click "Add Widget"
3. Select engagement type from dropdown
4. Optionally add custom title
5. Widget appears in Custom Widgets tab AND Main Dashboard
6. Widget is included in Engagement Breakdown chart

### Clear Cache

1. Navigate to "Settings" tab
2. Scroll to "Cache Management"
3. Click "Clear Cache"
4. Confirm action
5. All cached data is cleared (custom widgets are preserved)

### Fiscal Year Selection

Use the fiscal year selector in the header to filter data by fiscal year. All dashboards and metrics update automatically.

## Troubleshooting

### Backend won't start
- Check MongoDB is running: `mongosh` or `mongo`
- Verify `MONGO_URL` in `backend/.env`
- Check Python version: `python --version` (should be 3.9+)

### Frontend won't start
- Clear node_modules: `rm -rf node_modules && yarn install`
- Check Node version: `node --version` (should be 18+)
- Verify `REACT_APP_BACKEND_URL` in `frontend/.env`

### API errors
- Verify backend is running on port 8001
- Check CORS settings in `backend/.env`
- Verify Virtuous API key is valid

### No data showing
- Run initial sync from "Main Dashboard" (click sync button)
- Check browser console for errors
- Verify Virtuous API key is configured

## Database Collections

- `patient_families_cache` - Cached patient family data
- `sync_state` - Sync progress tracking
- `status_checks` - Health check logs

## License

Proprietary - Pediatric Brain Tumor Foundation

## Support

For issues or questions, contact your organization's IT support.
