# Download and Setup Instructions

## 📦 What's Included

A complete, standalone PBTF Family Reporting Platform with:
- ✅ React + TypeScript frontend
- ✅ FastAPI Python backend
- ✅ MongoDB database integration
- ✅ Custom widgets system
- ✅ All documentation
- ✅ Your custom PBTF logo
- ✅ Clean, professional favicon
- ✅ **NO third-party platform dependencies**

## 📥 Download the Package

Download file: `pbtf-reporting-platform.tar.gz` (250 KB)

## 🚀 Setup in 5 Minutes

### Step 1: Extract Files

**On macOS/Linux:**
```bash
tar -xzf pbtf-reporting-platform.tar.gz
cd pbtf-reporting-platform
code .
```

**On Windows:**
- Right-click `pbtf-reporting-platform.tar.gz`
- Extract using 7-Zip or WinRAR
- Open folder in VS Code

### Step 2: Install Prerequisites

1. **Node.js 18+**: https://nodejs.org/
2. **Python 3.9+**: https://www.python.org/downloads/
3. **MongoDB**: https://www.mongodb.com/try/download/community
4. **Yarn**: 
   ```bash
   npm install -g yarn
   ```

### Step 3: Setup Backend (Terminal 1)

```bash
cd backend

# Create virtual environment
python -m venv venv

# Activate it
source venv/bin/activate  # macOS/Linux
# OR
venv\Scripts\activate     # Windows

# Install dependencies
pip install -r requirements.txt

# Setup environment
cp .env.example .env
# Edit .env if you have Virtuous API key

# Start backend
uvicorn server:app --reload --host 127.0.0.1 --port 8001
```

✅ Backend running at: http://localhost:8001

### Step 4: Setup Frontend (Terminal 2)

```bash
cd frontend

# Install dependencies
yarn install

# Setup environment
cp .env.example .env

# Start frontend
yarn dev
```

✅ Frontend running at: http://localhost:3000

### Step 5: Setup MongoDB (Terminal 3)

**Option A - Local MongoDB:**
```bash
mongod --dbpath ./data
```

**Option B - Docker:**
```bash
docker run -d -p 27017:27017 --name pbtf-mongo mongo:latest
```

**Option C - MongoDB Atlas (Free Cloud):**
1. Create account: https://www.mongodb.com/cloud/atlas
2. Create free cluster
3. Get connection string
4. Update `MONGO_URL` in `backend/.env`

## 🎉 You're Done!

Open browser: **http://localhost:3000**

## 📁 What's Inside

```
pbtf-reporting-platform/
├── backend/
│   ├── server.py              # FastAPI application
│   ├── requirements.txt       # Python dependencies
│   └── .env.example          # Configuration template
│
├── frontend/
│   ├── src/
│   │   ├── components/       # React components
│   │   ├── hooks/           # Custom hooks
│   │   ├── lib/             # Utilities
│   │   └── pages/           # Page components
│   ├── public/
│   │   ├── logo.jpeg        # Your PBTF logo
│   │   └── favicon.svg      # Browser tab icon
│   ├── package.json         # Node dependencies
│   └── .env.example         # Configuration template
│
├── README.md                 # Full project documentation
├── LOCAL_SETUP.md            # Detailed setup guide
├── DEPLOYMENT.md             # Production deployment
├── QUICK_START.md            # This guide
└── .gitignore               # Git configuration
```

## 🎨 Features Overview

### Main Dashboard
- Family engagement metrics
- KPI cards
- Engagement charts
- Monthly trends
- Year-over-year comparisons

### Custom Widgets
- Create unlimited custom engagement tracking
- Integrated in all charts and metrics
- Real-time updates
- Persistent across sessions

### Direct Services
- Support call tracking
- Peer program metrics
- Webinar statistics

### Geographic Mapping
- Interactive US map
- Family distribution by state
- Clickable states with family lists

### Settings
- Cache management
- Clear stale data
- View last sync information

## 🔧 Configuration Files

### Backend (.env)
```env
MONGO_URL="mongodb://localhost:27017"
DB_NAME="pbtf_database"
CORS_ORIGINS="http://localhost:3000"
VIRTUOUS_API_KEY="your_key_here"
```

### Frontend (.env)
```env
REACT_APP_BACKEND_URL=http://localhost:8001
```

## ❓ Common Issues

### Backend won't start
```bash
# Check Python version
python --version  # Should be 3.9+

# Check MongoDB is running
mongosh
```

### Frontend won't start
```bash
# Check Node version
node --version  # Should be 18+

# Clear and reinstall
rm -rf node_modules
yarn install
```

### Port conflicts
```bash
# Kill process on port 8001
lsof -ti:8001 | xargs kill -9

# Kill process on port 3000
lsof -ti:3000 | xargs kill -9
```

## 📚 Documentation

- **README.md** - Complete project overview
- **LOCAL_SETUP.md** - VS Code setup with extensions
- **DEPLOYMENT.md** - Deploy to production
- **QUICK_START.md** - Fast setup guide

## ✨ What Makes This Special

- ✅ **100% Yours**: No third-party platform dependencies
- ✅ **Standalone**: Runs entirely on your machine
- ✅ **Professional**: Production-ready code
- ✅ **Customizable**: Your logo, your branding
- ✅ **Deployable**: Deploy anywhere you want
- ✅ **Documented**: Comprehensive guides included

## 🚀 Next Steps

1. **Explore the Application**: Click through all the tabs
2. **Create Custom Widgets**: Add your own engagement tracking
3. **Configure Virtuous API**: Add your API key to `backend/.env`
4. **Sync Data**: Use the sync button on Main Dashboard
5. **Customize**: Modify colors, add features, make it yours!

## 🆘 Need Help?

Check the detailed documentation files:
- Issues? See **README.md** troubleshooting section
- Setup help? See **LOCAL_SETUP.md**
- Deployment? See **DEPLOYMENT.md**

## 🏢 Your Application, Your Control

This is **your** application:
- No external platforms
- No third-party dependencies
- Complete control over code and data
- Deploy to your infrastructure
- Modify as needed

Enjoy your PBTF Family Reporting Platform! 🎉
