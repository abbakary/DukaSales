
import sqlite3
import os

db_path = os.path.join("backend", "saapos.db")
if os.path.exists(db_path):
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    try:
        cursor.execute("ALTER TABLE transactions ADD COLUMN type TEXT DEFAULT 'sale'")
        conn.commit()
        print("Added 'type' column to 'transactions' table.")
    except sqlite3.OperationalError as e:
        print(f"Error or already exists: {e}")
    finally:
        conn.close()
else:
    print(f"Database not found at {db_path}")
