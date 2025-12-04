# Deployment Guide

## Deploy to Your Own Infrastructure

This application is designed to be deployed on your own infrastructure - no third-party platforms required.

## Deployment Options

### Option 1: Traditional Server Deployment

#### Frontend (Static Files)
```bash
cd frontend
yarn build
# Deploy the 'build/' folder to:
# - Apache/Nginx web server
# - AWS S3 + CloudFront
# - Azure Static Web Apps
# - Your organization's web hosting
```

#### Backend (FastAPI)
```bash
cd backend
# Use production ASGI server
pip install gunicorn
gunicorn server:app -w 4 -k uvicorn.workers.UvicornWorker --bind 0.0.0.0:8001
```

### Option 2: Docker Deployment

Create `docker-compose.yml`:
```yaml
version: '3.8'

services:
  mongodb:
    image: mongo:latest
    ports:
      - "27017:27017"
    volumes:
      - mongodb_data:/data/db

  backend:
    build: ./backend
    ports:
      - "8001:8001"
    environment:
      - MONGO_URL=mongodb://mongodb:27017
      - DB_NAME=pbtf_database
    depends_on:
      - mongodb

  frontend:
    build: ./frontend
    ports:
      - "80:80"
    depends_on:
      - backend

volumes:
  mongodb_data:
```

### Option 3: Cloud Deployment

#### AWS
- Frontend: S3 + CloudFront
- Backend: EC2 or ECS
- Database: MongoDB Atlas or DocumentDB

#### Azure
- Frontend: Azure Static Web Apps
- Backend: Azure App Service
- Database: Azure Cosmos DB (MongoDB API)

#### Google Cloud
- Frontend: Cloud Storage + Cloud CDN
- Backend: Cloud Run or Compute Engine
- Database: MongoDB Atlas

## Environment Configuration

### Production Backend (.env)
```env
MONGO_URL="your_production_mongodb_url"
DB_NAME="pbtf_production"
CORS_ORIGINS="https://your-domain.com"
VIRTUOUS_API_KEY="your_production_key"
```

### Production Frontend (.env)
```env
REACT_APP_BACKEND_URL=https://api.your-domain.com
```

## Security Checklist

- [ ] Use HTTPS for all connections
- [ ] Restrict CORS to your domain only
- [ ] Use strong MongoDB credentials
- [ ] Keep Virtuous API key secure
- [ ] Enable MongoDB authentication
- [ ] Use firewall rules to restrict access
- [ ] Regular security updates
- [ ] Backup database regularly

## Monitoring

Set up monitoring for:
- Application uptime
- API response times
- Database performance
- Error rates
- User activity

## Backup Strategy

1. **Database**: Daily MongoDB backups
2. **Code**: Git repository
3. **Configuration**: Secure env file backups
4. **User Data**: Regular exports

## Maintenance

- Update dependencies monthly
- Monitor API usage and limits
- Review application logs
- Test backup restoration
- Update documentation

## Your Data, Your Control

This application:
- Runs on YOUR infrastructure
- Stores data in YOUR database
- No third-party platform dependencies
- Complete ownership and control
