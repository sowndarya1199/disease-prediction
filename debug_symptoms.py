import sqlite3
import os

base_dir = r"d:\disease prediction\backend"
db_path = os.path.join(base_dir, "patients.db")

conn = sqlite3.connect(db_path)
cursor = conn.cursor()

patient_id = 9 # Rajesh based on screenshot

print(f"Checking symptoms for patient {patient_id}...")
cursor.execute("SELECT id, patient_id, raw_text, processed_data, severity, duration FROM symptoms WHERE patient_id = ?", (patient_id,))
rows = cursor.fetchall()

for row in rows:
    print(f"ID: {row[0]}")
    print(f"Patient ID: {row[1]}")
    print(f"Raw Text: {row[2]}")
    print(f"Processed Data: {row[3]}")
    print(f"Severity: {row[4]}")
    print(f"Duration: {row[5]}")
    print("-" * 20)

if not rows:
    print("No symptoms found in 'symptoms' table for this patient.")

print("\nChecking patient profile for 'other_medical_history'...")
cursor.execute("SELECT name, other_medical_history FROM patients WHERE id = ?", (patient_id,))
p = cursor.fetchone()
if p:
    print(f"Name: {p[0]}")
    print(f"History: {p[1]}")

conn.close()
