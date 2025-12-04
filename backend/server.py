from fastapi import FastAPI, APIRouter, HTTPException
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
import uuid
from datetime import datetime
import requests
from collections import defaultdict
import sqlite3
import json

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# SQLite connection
DB_PATH = ROOT_DIR / 'pbtf_database.db'

def get_db():
    conn = sqlite3.connect(str(DB_PATH))
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    conn = get_db()
    cursor = conn.cursor()
    # Create tables
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS status_checks (
            id TEXT PRIMARY KEY,
            client_name TEXT,
            timestamp TEXT
        )
    ''')
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS patient_families_cache (
            id INTEGER PRIMARY KEY,
            name TEXT,
            contact_type TEXT,
            created_date TEXT,
            tags TEXT,
            updated_at TEXT,
            last_engagement_date TEXT
        )
    ''')
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS sync_state (
            id TEXT PRIMARY KEY,
            last_synced_contact_count INTEGER DEFAULT 0
        )
    ''')
    conn.commit()
    conn.close()

# Initialize database on startup
init_db()

# Virtuous API Configuration
VIRTUOUS_API_KEY = os.environ.get('VIRTUOUS_API_KEY', '')
VIRTUOUS_BASE_URL = 'https://api.virtuoussoftware.com/api'

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
    status_obj = StatusCheck(client_name=input.client_name)
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute(
        'INSERT INTO status_checks (id, client_name, timestamp) VALUES (?, ?, ?)',
        (status_obj.id, status_obj.client_name, status_obj.timestamp.isoformat())
    )
    conn.commit()
    conn.close()
    return status_obj

@api_router.get("/status", response_model=List[StatusCheck])
async def get_status_checks():
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute('SELECT id, client_name, timestamp FROM status_checks LIMIT 1000')
    rows = cursor.fetchall()
    conn.close()
    return [StatusCheck(id=row['id'], client_name=row['client_name'], timestamp=datetime.fromisoformat(row['timestamp'])) for row in rows]

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
        conn = get_db()
        cursor = conn.cursor()
        
        if action == 'get-state':
            # Get sync state
            cursor.execute('SELECT last_synced_contact_count FROM sync_state WHERE id = ?', ('patient_families_sync',))
            row = cursor.fetchone()
            sync_state = {'last_synced_contact_count': row['last_synced_contact_count']} if row else {}
            
            cursor.execute('SELECT COUNT(*) as count FROM patient_families_cache')
            total_contacts = cursor.fetchone()['count']
            conn.close()
            
            return {
                'success': True,
                'syncState': sync_state,
                'totalContacts': total_contacts
            }
        
        elif action == 'sync':
            # Sync patient families from Virtuous
            tag_id = 25  # Patient Families tag
            
            if request.reset:
                # Reset sync state
                cursor.execute(
                    'INSERT OR REPLACE INTO sync_state (id, last_synced_contact_count) VALUES (?, ?)',
                    ('patient_families_sync', 50)
                )
                conn.commit()
                cursor.execute('SELECT COUNT(*) as count FROM patient_families_cache')
                cached_count = cursor.fetchone()['count']
                conn.close()
                return {
                    'success': True,
                    'nextSkip': 50,
                    'cachedCount': cached_count
                }
            
            # Get current state
            cursor.execute('SELECT last_synced_contact_count FROM sync_state WHERE id = ?', ('patient_families_sync',))
            row = cursor.fetchone()
            skip = row['last_synced_contact_count'] if row else 0
            take = 50
            
            # Fetch from Virtuous API
            virtuous_data = call_virtuous_api(
                endpoint=f'/Contact/ByTag/{tag_id}',
                method='GET',
                query_params={'skip': str(skip), 'take': str(take)}
            )
            
            total = virtuous_data.get('total', 0)
            contacts = virtuous_data.get('list', [])
            
            # Cache contacts in SQLite
            for contact in contacts:
                cursor.execute('''
                    INSERT OR REPLACE INTO patient_families_cache 
                    (id, name, contact_type, created_date, tags, updated_at) 
                    VALUES (?, ?, ?, ?, ?, ?)
                ''', (
                    contact['id'],
                    contact.get('name', ''),
                    contact.get('contactType'),
                    contact.get('createdDate'),
                    json.dumps(contact.get('tags', [])),
                    datetime.utcnow().isoformat()
                ))
            
            next_skip = skip + len(contacts)
            complete = next_skip >= total
            
            # Update sync state
            cursor.execute(
                'INSERT OR REPLACE INTO sync_state (id, last_synced_contact_count) VALUES (?, ?)',
                ('patient_families_sync', next_skip if not complete else total)
            )
            conn.commit()
            
            cursor.execute('SELECT COUNT(*) as count FROM patient_families_cache')
            cached_count = cursor.fetchone()['count']
            conn.close()
            
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
            cursor.execute('SELECT id, name FROM patient_families_cache LIMIT ? OFFSET ?', (batch_size, offset))
            families = [dict(row) for row in cursor.fetchall()]
            
            cursor.execute('SELECT COUNT(*) as count FROM patient_families_cache')
            total_cached = cursor.fetchone()['count']
            
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
                            cursor.execute(
                                'UPDATE patient_families_cache SET last_engagement_date = ? WHERE id = ?',
                                (latest_date, family['id'])
                            )
                except Exception as e:
                    logger.error(f"Error refreshing dates for family {family['id']}: {str(e)}")
            
            conn.commit()
            conn.close()
            
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
            cursor.execute('SELECT COUNT(*) as count FROM patient_families_cache')
            total_families = cursor.fetchone()['count']
            
            # Families created in fiscal year
            cursor.execute(
                'SELECT COUNT(*) as count FROM patient_families_cache WHERE created_date >= ? AND created_date <= ?',
                (fiscal_year_start.isoformat(), fiscal_year_end.isoformat())
            )
            total_in_fiscal_year = cursor.fetchone()['count']
            conn.close()
            
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
        conn = get_db()
        cursor = conn.cursor()
        
        if search:
            cursor.execute(
                'SELECT * FROM patient_families_cache WHERE name LIKE ? ORDER BY name LIMIT ? OFFSET ?',
                (f'%{search}%', limit, skip)
            )
            families = [dict(row) for row in cursor.fetchall()]
            cursor.execute('SELECT COUNT(*) as count FROM patient_families_cache WHERE name LIKE ?', (f'%{search}%',))
        else:
            cursor.execute('SELECT * FROM patient_families_cache ORDER BY name LIMIT ? OFFSET ?', (limit, skip))
            families = [dict(row) for row in cursor.fetchall()]
            cursor.execute('SELECT COUNT(*) as count FROM patient_families_cache')
        
        total = cursor.fetchone()['count']
        conn.close()
        
        # Parse tags JSON for each family
        for family in families:
            if family.get('tags'):
                try:
                    family['tags'] = json.loads(family['tags'])
                except:
                    family['tags'] = []
        
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
        conn = get_db()
        cursor = conn.cursor()
        
        # Count before deleting
        cursor.execute('SELECT COUNT(*) as count FROM patient_families_cache')
        families_count = cursor.fetchone()['count']
        cursor.execute('SELECT COUNT(*) as count FROM sync_state')
        sync_count = cursor.fetchone()['count']
        
        # Clear patient families cache
        cursor.execute('DELETE FROM patient_families_cache')
        
        # Clear sync state
        cursor.execute('DELETE FROM sync_state')
        
        conn.commit()
        conn.close()
        
        logger.info(f"Cache cleared: {families_count} families, {sync_count} sync states")
        
        return {
            'success': True,
            'message': 'Cache cleared successfully',
            'deleted': {
                'families': families_count,
                'sync_states': sync_count
            }
        }
    except Exception as e:
        logger.error(f"Error clearing cache: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

# ==================== App Setup ====================

# Add CORS middleware first (before routes)
app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],  # Allow all origins for development
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include the router in the main app
app.include_router(api_router)
