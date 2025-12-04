import sqlite3
import os

DB_PATH = 'backend/pbtf_database.db'

if not os.path.exists(DB_PATH):
    print(f"Database file not found at {DB_PATH}")
else:
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    # Check patient_families_cache count
    cursor.execute('SELECT COUNT(*) FROM patient_families_cache')
    count = cursor.fetchone()[0]
    print(f"Total families in cache: {count}")
    
    if count > 0:
        cursor.execute('SELECT * FROM patient_families_cache LIMIT 5')
        rows = cursor.fetchall()
        print("First 5 rows:")
        for row in rows:
            print(row)
            
    conn.close()
