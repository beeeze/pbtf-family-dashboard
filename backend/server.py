from fastapi import FastAPI, APIRouter, HTTPException
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
import uuid
from datetime import datetime
import requests
from collections import defaultdict

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Virtuous API Configuration
VIRTUOUS_API_KEY = os.environ.get('VIRTUOUS_API_KEY', '')
VIRTUOUS_BASE_URL = 'https://api.virtuouscrm.com/api'

# Create the main app without a prefix
app = FastAPI()

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# ==================== Models ====================

class StatusCheck(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    client_name: str
    timestamp: datetime = Field(default_factory=datetime.utcnow)

class StatusCheckCreate(BaseModel):
    client_name: str

class VirtuousAPIRequest(BaseModel):
    endpoint: str
    method: str = 'GET'
    body: Optional[Dict[str, Any]] = None
    queryParams: Optional[Dict[str, str]] = None

class SyncRequest(BaseModel):
    action: str
    fiscalYearStart: Optional[str] = None
    fiscalYearEnd: Optional[str] = None
    reset: Optional[bool] = False
    offset: Optional[int] = 0
    batchSize: Optional[int] = 50
    selectedStaff: Optional[List[str]] = None

class ContactNotesRequest(BaseModel):
    action: str
    fiscalYearStart: str
    fiscalYearEnd: str
    selectedStaff: Optional[List[str]] = None

# ==================== Virtuous API Helper ====================

def call_virtuous_api(endpoint: str, method: str = 'GET', body: Optional[Dict] = None, query_params: Optional[Dict[str, str]] = None):
    """Helper function to call Virtuous API"""
    if not VIRTUOUS_API_KEY:
        raise HTTPException(status_code=500, detail="Virtuous API key not configured")
    
    url = f"{VIRTUOUS_BASE_URL}{endpoint}"
    headers = {
        'Authorization': f'Bearer {VIRTUOUS_API_KEY}',
        'Content-Type': 'application/json'
    }
    
    try:
        if method == 'GET':
            response = requests.get(url, headers=headers, params=query_params)
        elif method == 'POST':
            response = requests.post(url, headers=headers, json=body, params=query_params)
        elif method == 'PUT':
            response = requests.put(url, headers=headers, json=body, params=query_params)
        elif method == 'DELETE':
            response = requests.delete(url, headers=headers, params=query_params)
        else:
            raise HTTPException(status_code=400, detail=f"Unsupported HTTP method: {method}")
        
        response.raise_for_status()
        return response.json()
    except requests.exceptions.RequestException as e:
        logger.error(f"Virtuous API error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Virtuous API error: {str(e)}")

# ==================== Routes ====================

@api_router.get("/")
async def root():
    return {"message": "PBTF Family Reporting API"}

@api_router.post("/status", response_model=StatusCheck)
async def create_status_check(input: StatusCheckCreate):
    status_dict = input.dict()
    status_obj = StatusCheck(**status_dict)
    _ = await db.status_checks.insert_one(status_obj.dict())
    return status_obj

@api_router.get("/status", response_model=List[StatusCheck])
async def get_status_checks():
    status_checks = await db.status_checks.find().to_list(1000)
    return [StatusCheck(**status_check) for status_check in status_checks]

# ==================== Virtuous API Proxy ====================

@api_router.post("/virtuous-api")
async def virtuous_api_proxy(request: VirtuousAPIRequest):
    """Proxy endpoint for Virtuous API calls"""
    try:
        data = call_virtuous_api(
            endpoint=request.endpoint,
            method=request.method,
            body=request.body,
            query_params=request.queryParams
        )
        return data
    except Exception as e:
        logger.error(f"Virtuous API proxy error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

# ==================== Sync Patient Families ====================

@api_router.post("/sync-patient-families")
async def sync_patient_families(request: SyncRequest):
    """Handle patient family sync operations"""
    try:
        action = request.action
        
        if action == 'get-state':
            # Get sync state
            sync_state = await db.sync_state.find_one({'_id': 'patient_families_sync'})
            total_contacts = await db.patient_families_cache.count_documents({})
            
            return {
                'success': True,
                'syncState': sync_state or {},
                'totalContacts': total_contacts
            }
        
        elif action == 'sync':
            # Sync patient families from Virtuous
            tag_id = 25  # Patient Families tag
            
            if request.reset:
                # Reset sync state
                await db.sync_state.update_one(
                    {'_id': 'patient_families_sync'},
                    {'$set': {'last_synced_contact_count': 50}},
                    upsert=True
                )
                return {
                    'success': True,
                    'nextSkip': 50,
                    'cachedCount': await db.patient_families_cache.count_documents({})
                }
            
            # Get current state
            sync_state = await db.sync_state.find_one({'_id': 'patient_families_sync'}) or {}
            skip = sync_state.get('last_synced_contact_count', 0)
            take = 50
            
            # Fetch from Virtuous API
            virtuous_data = call_virtuous_api(
                endpoint=f'/Contact/ByTag/{tag_id}',
                method='GET',
                query_params={'skip': str(skip), 'take': str(take)}
            )
            
            total = virtuous_data.get('total', 0)
            contacts = virtuous_data.get('list', [])
            
            # Cache contacts in MongoDB
            for contact in contacts:
                await db.patient_families_cache.update_one(
                    {'id': contact['id']},
                    {'$set': {
                        'id': contact['id'],
                        'name': contact.get('name', ''),
                        'contactType': contact.get('contactType'),
                        'created_date': contact.get('createdDate'),
                        'tags': contact.get('tags', []),
                        'updated_at': datetime.utcnow()
                    }},
                    upsert=True
                )
            
            next_skip = skip + len(contacts)
            complete = next_skip >= total
            
            # Update sync state
            await db.sync_state.update_one(
                {'_id': 'patient_families_sync'},
                {'$set': {'last_synced_contact_count': next_skip if not complete else total}},
                upsert=True
            )
            
            cached_count = await db.patient_families_cache.count_documents({})
            
            return {
                'success': True,
                'nextSkip': next_skip,
                'totalContacts': total,
                'complete': complete,
                'cachedCount': cached_count
            }
        
        elif action == 'refresh-dates':
            # Refresh engagement dates for cached families
            offset = request.offset or 0
            batch_size = request.batchSize or 50
            
            # Get batch of families
            families = await db.patient_families_cache.find().skip(offset).limit(batch_size).to_list(batch_size)
            total_cached = await db.patient_families_cache.count_documents({})
            
            # Fetch latest engagement data for each family
            for family in families:
                try:
                    engagements = call_virtuous_api(
                        endpoint=f"/Contact/{family['id']}/CustomCollections/Family Engagement",
                        method='GET'
                    )
                    
                    # Update cached family with latest engagement date
                    if engagements:
                        latest_date = max([e.get('date') for e in engagements if e.get('date')], default=None)
                        if latest_date:
                            await db.patient_families_cache.update_one(
                                {'id': family['id']},
                                {'$set': {'last_engagement_date': latest_date}}
                            )
                except Exception as e:
                    logger.error(f"Error refreshing dates for family {family['id']}: {str(e)}")
            
            next_offset = offset + len(families)
            complete = next_offset >= total_cached
            
            return {
                'success': True,
                'nextOffset': next_offset,
                'totalCached': total_cached,
                'complete': complete
            }
        
        elif action == 'dashboard':
            # Generate dashboard metrics
            fiscal_year_start = datetime.fromisoformat(request.fiscalYearStart.replace('Z', '+00:00'))
            fiscal_year_end = datetime.fromisoformat(request.fiscalYearEnd.replace('Z', '+00:00'))
            
            # Get all families
            total_families = await db.patient_families_cache.count_documents({})
            
            # Families created in fiscal year
            total_in_fiscal_year = await db.patient_families_cache.count_documents({
                'created_date': {
                    '$gte': fiscal_year_start.isoformat(),
                    '$lte': fiscal_year_end.isoformat()
                }
            })
            
            # For now, return basic metrics - you can expand this based on your engagement data structure
            return {
                'success': True,
                'totalFamilies': total_families,
                'analyzedFamilies': total_families,
                'totalInFiscalYear': total_in_fiscal_year,
                'engagedCount': 0,
                'newlyDiagnosedCount': 0,
                'newFamiliesCount': 0,
                'firstTimeEngagedCount': 0,
                'reEngagedCount': 0,
                'engagementTypes': {},
                'monthlyData': [],
                'engagedFamilies': [],
                'newlyDiagnosedFamilies': [],
                'newFamilies': [],
                'firstTimeEngagedFamilies': [],
                'reEngagedFamilies': []
            }
        
        elif action == 'yoy-comparison':
            # Year-over-year comparison data
            # This would require historical data analysis
            return {
                'success': True,
                'data': []
            }
        
        else:
            raise HTTPException(status_code=400, detail=f"Unknown action: {action}")
    
    except Exception as e:
        logger.error(f"Sync error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

# ==================== Contact Notes Query ====================

@api_router.post("/query-contact-notes")
async def query_contact_notes(request: ContactNotesRequest):
    """Query contact notes for support calls"""
    try:
        action = request.action
        
        if action == 'query-support-calls':
            fiscal_year_start = datetime.fromisoformat(request.fiscalYearStart.replace('Z', '+00:00'))
            fiscal_year_end = datetime.fromisoformat(request.fiscalYearEnd.replace('Z', '+00:00'))
            selected_staff = request.selectedStaff or []
            
            # For now, return mock data
            # In production, you'd query actual contact notes from Virtuous or your cache
            return {
                'success': True,
                'totalCalls': 0,
                'callsByStaff': {},
                'staffList': []
            }
        
        else:
            raise HTTPException(status_code=400, detail=f"Unknown action: {action}")
    
    except Exception as e:
        logger.error(f"Contact notes query error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

# ==================== Patient Families Cache Query ====================

@api_router.get("/patient-families")
async def get_patient_families(
    skip: int = 0,
    limit: int = 100,
    search: Optional[str] = None
):
    """Get patient families from cache"""
    try:
        query = {}
        if search:
            query['name'] = {'$regex': search, '$options': 'i'}
        
        families = await db.patient_families_cache.find(query).sort('name').skip(skip).limit(limit).to_list(limit)
        total = await db.patient_families_cache.count_documents(query)
        
        return {
            'families': families,
            'total': total
        }
    except Exception as e:
        logger.error(f"Error fetching families: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

# ==================== Clear Cache ====================

@api_router.post("/clear-cache")
async def clear_cache():
    """Clear all cached data"""
    try:
        # Clear patient families cache
        result1 = await db.patient_families_cache.delete_many({})
        
        # Clear sync state
        result2 = await db.sync_state.delete_many({})
        
        logger.info(f"Cache cleared: {result1.deleted_count} families, {result2.deleted_count} sync states")
        
        return {
            'success': True,
            'message': 'Cache cleared successfully',
            'deleted': {
                'families': result1.deleted_count,
                'sync_states': result2.deleted_count
            }
        }
    except Exception as e:
        logger.error(f"Error clearing cache: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

# ==================== App Setup ====================

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
