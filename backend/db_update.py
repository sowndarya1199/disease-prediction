import sqlite3
import os

db_path = 'd:/disease prediction/backend/patients.db'
if not os.path.exists(db_path):
    # Try root
    db_path = 'd:/disease prediction/patients.db'
    if not os.path.exists(db_path):
        print("Database not found")
        exit()

print(f"Updating database: {db_path}")
conn = sqlite3.connect(db_path)
cursor = conn.cursor()

# 1. Update clinical_validations
cursor.execute("PRAGMA table_info(clinical_validations)")
cv_cols = [row[1] for row in cursor.fetchall()]
if 'timestamp' not in cv_cols:
    print("Adding timestamp to clinical_validations")
    cursor.execute("ALTER TABLE clinical_validations ADD COLUMN timestamp DATETIME DEFAULT CURRENT_TIMESTAMP")

# 2. Update notifications
cursor.execute("PRAGMA table_info(notifications)")
notif_cols = [row[1] for row in cursor.fetchall()]
for col, ctype in [('message', 'TEXT'), ('is_read', 'BOOLEAN DEFAULT 0'), ('created_at', 'DATETIME DEFAULT CURRENT_TIMESTAMP')]:
    if col not in notif_cols:
        print(f"Adding {col} to notifications")
        cursor.execute(f"ALTER TABLE notifications ADD COLUMN {col} {ctype}")

conn.commit()
conn.close()
print("Database schema updated successfully.")
