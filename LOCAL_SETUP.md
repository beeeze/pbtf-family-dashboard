# Local Development Setup for VS Code

## Quick Start Guide

This guide will help you run the PBTF Family Reporting Platform entirely on your local machine using VS Code.

## Step 1: Install Prerequisites

### Required Software:

1. **VS Code**: https://code.visualstudio.com/
2. **Node.js 18+**: https://nodejs.org/
3. **Python 3.9+**: https://www.python.org/downloads/
4. **MongoDB**: https://www.mongodb.com/try/download/community
5. **Yarn**: `npm install -g yarn`

## Step 2: Open Project in VS Code

```bash
code /path/to/pbtf-reporting-platform
```

## Step 3: Setup Backend

### Terminal 1 (Backend):

```bash
# Navigate to backend
cd backend

# Create virtual environment
python -m venv venv

# Activate virtual environment
# On macOS/Linux:
source venv/bin/activate
# On Windows:
venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Copy and configure environment
cp .env.example .env
# Edit .env file - add your Virtuous API key if you have one

# Start backend server
uvicorn server:app --reload --host 127.0.0.1 --port 8001
```

✅ Backend running at: http://localhost:8001

## Step 4: Setup Frontend

### Terminal 2 (Frontend):

```bash
# Navigate to frontend
cd frontend

# Install dependencies
yarn install

# Copy environment file
cp .env.example .env
# .env should have: REACT_APP_BACKEND_URL=http://localhost:8001

# Start frontend
yarn dev
```

✅ Frontend running at: http://localhost:3000

## Step 5: Setup MongoDB

### Terminal 3 (MongoDB):

**Option A: Local MongoDB**
```bash
# Start MongoDB (after installation)
mongod --dbpath ./data
```

**Option B: Docker MongoDB**
```bash
docker run -d -p 27017:27017 --name pbtf-mongo mongo:latest
```

**Option C: MongoDB Atlas (Cloud - Free Tier)**
1. Go to https://www.mongodb.com/cloud/atlas
2. Create free account
3. Create cluster
4. Get connection string
5. Update `MONGO_URL` in `backend/.env`

## VS Code Configuration

### Recommended Extensions:

1. **Python** (ms-python.python)
2. **Pylance** (ms-python.vscode-pylance)
3. **ES7+ React/Redux/React-Native snippets**
4. **Tailwind CSS IntelliSense**
5. **MongoDB for VS Code**
6. **GitLens**

### Workspace Settings:

Create `.vscode/settings.json`:

```json
{
  "python.defaultInterpreterPath": "${workspaceFolder}/backend/venv/bin/python",
  "python.formatting.provider": "black",
  "python.linting.enabled": true,
  "python.linting.pylintEnabled": false,
  "python.linting.flake8Enabled": true,
  "editor.formatOnSave": true,
  "editor.codeActionsOnSave": {
    "source.organizeImports": true
  },
  "[python]": {
    "editor.defaultFormatter": "ms-python.python"
  },
  "[typescript]": {
    "editor.defaultFormatter": "esbenp.prettier-vscode"
  },
  "[typescriptreact]": {
    "editor.defaultFormatter": "esbenp.prettier-vscode"
  }
}
```

### Launch Configuration:

Create `.vscode/launch.json`:

```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "Python: FastAPI",
      "type": "python",
      "request": "launch",
      "module": "uvicorn",
      "args": [
        "server:app",
        "--reload",
        "--host",
        "127.0.0.1",
        "--port",
        "8001"
      ],
      "jinja": true,
      "cwd": "${workspaceFolder}/backend"
    }
  ]
}
```

## Environment Variables

### Backend (.env):
```env
MONGO_URL="mongodb://localhost:27017"
DB_NAME="pbtf_database"
CORS_ORIGINS="http://localhost:3000"
VIRTUOUS_API_KEY="your_key_here"
```

### Frontend (.env):
```env
REACT_APP_BACKEND_URL=http://localhost:8001
```

## Testing the Setup

1. **Check Backend**: Open http://localhost:8001/api/ in browser
   - Should see: `{"message": "PBTF Family Reporting API"}`

2. **Check Frontend**: Open http://localhost:3000
   - Should see the PBTF dashboard

3. **Check MongoDB**: 
   ```bash
   mongosh
   > show dbs
   ```

## Common Issues

### Port Already in Use
```bash
# Kill process on port 8001
lsof -ti:8001 | xargs kill -9

# Kill process on port 3000
lsof -ti:3000 | xargs kill -9
```

### Python Virtual Environment Issues
```bash
# Remove and recreate
rm -rf backend/venv
cd backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

### Node Module Issues
```bash
# Clear and reinstall
cd frontend
rm -rf node_modules
yarn cache clean
yarn install
```

## Development Workflow

1. Open VS Code
2. Open 3 integrated terminals (Terminal → New Terminal)
3. Terminal 1: Start MongoDB
4. Terminal 2: Start Backend (`cd backend && source venv/bin/activate && uvicorn server:app --reload --port 8001`)
5. Terminal 3: Start Frontend (`cd frontend && yarn dev`)
6. Open http://localhost:3000 in browser
7. Make changes in VS Code - both frontend and backend have hot reload!

## No Third-Party Platforms Required

This application runs 100% locally:
- ✅ No Emergent platform needed
- ✅ No Lovable dependencies
- ✅ No external hosting required
- ✅ Complete control over your data
- ✅ Runs entirely on your machine

## Production Deployment

When ready to deploy:

1. **Frontend**: `yarn build` → Deploy `build/` folder to your web server
2. **Backend**: Deploy FastAPI app to your server
3. **Database**: Use your organization's MongoDB instance
4. **Update URLs**: Change `REACT_APP_BACKEND_URL` to your production backend URL

## Support

All code is yours to modify and deploy as needed for your organization.
