# PBTF Family Reporting Platform - Quick Start

## 📦 What You Downloaded

A complete, standalone family engagement reporting application for PBTF.

## 📋 Prerequisites

Before starting, install:
1. **Node.js 18+**: https://nodejs.org/
2. **Python 3.9+**: https://www.python.org/downloads/
3. **MongoDB**: https://www.mongodb.com/try/download/community
4. **Yarn**: `npm install -g yarn`
5. **VS Code**: https://code.visualstudio.com/

## 🚀 Quick Start (5 Steps)

### Step 1: Extract the Files
```bash
tar -xzf pbtf-reporting-platform.tar.gz
cd pbtf-reporting-platform
```

### Step 2: Open in VS Code
```bash
code .
```

### Step 3: Start MongoDB
**Option A - Local:**
```bash
mongod --dbpath ./data
```

**Option B - Docker:**
```bash
docker run -d -p 27017:27017 --name pbtf-mongo mongo:latest
```

### Step 4: Start Backend (New Terminal in VS Code)
```bash
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env
# Edit .env and add your Virtuous API key if you have one
uvicorn server:app --reload --host 127.0.0.1 --port 8001
```

### Step 5: Start Frontend (New Terminal in VS Code)
```bash
cd frontend
yarn install
cp .env.example .env
yarn dev
```

### Step 6: Open Your Browser
Go to: http://localhost:3000

## ✅ What You'll See

- **Main Dashboard**: Family engagement metrics and KPIs
- **Custom Widgets**: Create unlimited custom tracking widgets
- **Direct Services**: Support calls, peer programs, webinars
- **Geographic Mapping**: Family distribution across US states
- **Settings**: Cache management and configuration

## 🎨 Features

### Custom Widgets
1. Click "Custom Widgets" in sidebar
2. Click "Add Widget"
3. Select engagement type (Educational Programs, Workshops, etc.)
4. Widget appears everywhere: Main Dashboard, Charts, Trends

### Cache Management
1. Click "Settings" in sidebar
2. Scroll to "Cache Management"
3. Click "Clear Cache" to refresh data

## 🔧 Configuration

### Backend (.env)
```env
MONGO_URL="mongodb://localhost:27017"
DB_NAME="pbtf_database"
CORS_ORIGINS="http://localhost:3000"
VIRTUOUS_API_KEY="your_virtuous_api_key_here"
```

### Frontend (.env)
```env
REACT_APP_BACKEND_URL=http://localhost:8001
```

## 📁 Project Structure

```
pbtf-reporting-platform/
├── backend/              # FastAPI backend
│   ├── server.py        # Main API server
│   ├── requirements.txt # Python dependencies
│   └── .env            # Backend configuration
├── frontend/            # React frontend
│   ├── src/            # Source code
│   ├── public/         # Static assets (including your logo)
│   ├── package.json    # Node dependencies
│   └── .env           # Frontend configuration
├── README.md           # Full documentation
├── LOCAL_SETUP.md      # Detailed setup guide
└── DEPLOYMENT.md       # Production deployment guide
```

## 🐛 Troubleshooting

### Port Already in Use
```bash
# Kill process on port 8001 (backend)
lsof -ti:8001 | xargs kill -9

# Kill process on port 3000 (frontend)
lsof -ti:3000 | xargs kill -9
```

### MongoDB Connection Error
Make sure MongoDB is running:
```bash
mongosh  # Should connect successfully
```

### Module Not Found Errors
```bash
# Frontend
cd frontend && rm -rf node_modules && yarn install

# Backend
cd backend && rm -rf venv && python -m venv venv && pip install -r requirements.txt
```

## 📚 Full Documentation

- **README.md** - Complete project overview
- **LOCAL_SETUP.md** - Detailed VS Code setup
- **DEPLOYMENT.md** - Production deployment guide

## 🎯 Your Application

- ✅ 100% Standalone (no third-party platforms)
- ✅ Your custom PBTF logo
- ✅ Complete control over your data
- ✅ Runs entirely on your local machine
- ✅ Ready to deploy to your infrastructure

## 🆘 Need Help?

Check the detailed documentation files included in the package!
