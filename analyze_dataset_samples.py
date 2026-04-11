
import sys
import os
import io
import json
import glob


sys.path.append(os.path.join(os.getcwd(), 'backend'))

from lab_ocr import process_lab_report

data_dir = r"d:\disease prediction\backend\data\lbmaske"

def run_diagnostic():
    if not os.path.exists(data_dir):
        print(f"Directory not found: {data_dir}")
        return

    
    png_files = glob.glob(os.path.join(data_dir, "*.png"))
    if not png_files:
        print("No PNG files found in directory.")
        return
        
    print(f"Found {len(png_files)} images. Analyzing first 5...\n")
    
    for i, file_path in enumerate(png_files[:5]):
        sample_file = os.path.basename(file_path)
        print(f"--- Analyzing {sample_file} ({i+1}/5) ---")
        
        with open(file_path, 'rb') as f:
            content = f.read()
        
        result = process_lab_report(content, "image/png")
        
        if result.get('success'):
            print(f"SUCCESS: Extracted {len(result.get('results', []))} values.")
            for res in result.get('results', []):
                print(f"  - {res['test_name']}: {res['value']} {res['unit']}")
        else:
            print(f"FAILED: {result.get('message')}")
        
        print("-" * 30)

if __name__ == "__main__":
    run_diagnostic()
