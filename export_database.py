import sqlite3
import pandas as pd
import os

def export_db_to_csv(db_path, output_dir="db_export"):
    if not os.path.exists(db_path):
        print(f"Database not found at {db_path}")
        return

    if not os.path.exists(output_dir):
        os.makedirs(output_dir)

    try:
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        
        # Get all table names
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table';")
        tables = cursor.fetchall()

        print(f"Exporting tables from {db_path} to '{output_dir}/'...")
        
        for table_name in tables:
            table_name = table_name[0]
            if table_name == 'sqlite_sequence':
                continue
                
            df = pd.read_sql_query(f"SELECT * FROM {table_name}", conn)
            file_path = os.path.join(output_dir, f"{table_name}.csv")
            df.to_csv(file_path, index=False)
            print(f"  - {table_name} -> {file_path}")

        conn.close()
        print("\nSuccess! You can now show these CSV files to your guide.")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    # The primary database is in the backend folder
    db_file = os.path.join("backend", "patients.db")
    export_db_to_csv(db_file)
