import sqlite3
import os

db_path = os.path.join("backend", "saapos.db")
if os.path.exists(db_path):
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    try:
        cursor.execute("PRAGMA table_info(transactions)")
        columns = cursor.fetchall()
        print("Columns in 'transactions' table:")
        for col in columns:
            print(col)
        
        type_exists = any(col[1] == 'type' for col in columns)
        if type_exists:
            print("\nSUCCESS: 'type' column exists.")
        else:
            print("\nFAILURE: 'type' column DOES NOT exist.")
            
    except Exception as e:
        print(f"Error checking database: {e}")
    finally:
        conn.close()
else:
    print(f"Database not found at {db_path}")
