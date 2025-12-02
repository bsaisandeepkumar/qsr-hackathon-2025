def init_user_table():
    conn = sqlite3.connect(DB_FILE)
    cur = conn.cursor()
    cur.execute("""
    CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        phone TEXT UNIQUE,
        profile TEXT
    )
    """)
    conn.commit()
    conn.close()

init_user_table()

class LoginRequest(BaseModel):
    phone: str

@app.post("/auth/login")
def login(req: LoginRequest):
    conn = sqlite3.connect(DB_FILE)
    cur = conn.cursor()
    cur.execute("SELECT phone, profile FROM users WHERE phone = ?", (req.phone,))
    row = cur.fetchone()
    conn.close()

    if row:
        return {"exists": True, "phone": row[0], "profile": row[1]}

    return {"exists": False}
class RegisterRequest(BaseModel):
    phone: str
    profile: str

@app.post("/auth/register")
def register(req: RegisterRequest):
    conn = sqlite3.connect(DB_FILE)
    cur = conn.cursor()

    cur.execute("INSERT INTO users (phone, profile) VALUES (?, ?)",
        (req.phone, req.profile))

    conn.commit()
    conn.close()

    return {"status": "success", "phone": req.phone, "profile": req.profile}
