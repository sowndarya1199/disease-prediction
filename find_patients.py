import sqlite3
import os

db_files = [
    "backend/patients.db",
    "patients.db",
    "backend/database.db",
    "backend/medical_app.db",
    "backend/medpred.db",
    "disease_prediction.db"
]

for db in db_files:
    if os.path.exists(db):
        try:
            conn = sqlite3.connect(db)
            cursor = conn.cursor()
            cursor.execute("SELECT name FROM patients")
            names = [row[0] for row in cursor.fetchall()]
            print(f"File: {db} -> Patients: {names}")
            conn.close()
        except Exception as e:
            print(f"File: {db} -> Error: {e}")
    else:
        print(f"File: {db} -> Not found")
