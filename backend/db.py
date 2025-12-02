# backend/db.py
import sqlite3
import os

DB_FILE = os.path.join(os.path.dirname(__file__), "smartserve.db")

def get_conn():
    # check_same_thread False for multi-threaded FastAPI calls
    return sqlite3.connect(DB_FILE, check_same_thread=False)

def init_db():
    conn = get_conn()
    cur = conn.cursor()
    # tickets table (if not already)
    cur.execute("""
    CREATE TABLE IF NOT EXISTS tickets (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        created_at TEXT,
        profile TEXT,
        items TEXT,
        status TEXT
    );
    """)

    # users table for phone-based login
    cur.execute("""
    CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        phone TEXT UNIQUE NOT NULL,
        name TEXT,
        profile TEXT
    );
    """)

    conn.commit()
    conn.close()
