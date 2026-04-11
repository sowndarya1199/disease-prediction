import os
import time
import requests
from duckduckgo_search import DDGS

diseases = [
    "Diabetes",
    "Anemia",
    "Jaundice",
    "Hypothyroidism",
    "Vitamin B12 Deficiency",
    "Vitamin D Deficiency",
    "Malaria"
]

base_dir = r"d:\disease prediction\real_lab_reports"
os.makedirs(base_dir, exist_ok=True)

HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
}

ddgs = DDGS()

for disease in diseases:
    disease_dir = os.path.join(base_dir, disease)
    os.makedirs(disease_dir, exist_ok=True)
    
    print(f"Searching for {disease} lab reports...")
    query = f"real patient {disease} blood test lab report filetype:jpg"
    
    try:
        results = list(ddgs.images(
            keywords=query,
            max_results=3
        ))
        
        count = 0
        for i, res in enumerate(results):
            if count >= 2: break
            img_url = res.get('image')
            if not img_url: continue
            
            try:
                print(f"  Downloading from {img_url[:60]}...")
                response = requests.get(img_url, headers=HEADERS, timeout=10)
                if response.status_code == 200 and 'image' in response.headers.get('Content-Type', ''):
                    ext = img_url.split('.')[-1][:4] if '.' in img_url else 'jpg'
                    if not ext.isalpha(): ext = 'jpg'
                    
                    filename = os.path.join(disease_dir, f"report_{count+1}.{ext}")
                    with open(filename, 'wb') as f:
                        f.write(response.content)
                    print(f"  -> Saved {filename}")
                    count += 1
            except Exception as e:
                print(f"  -> Error downloading: {e}")
                
        time.sleep(1) # Be nice to DDG
    except Exception as e:
        print(f"Error searching {disease}: {e}")

print("Done downloading real lab reports!")
