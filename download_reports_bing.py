import os, urllib.request, urllib.parse, re, ssl, time

ctx = ssl.create_default_context()
ctx.check_hostname = False
ctx.verify_mode = ssl.CERT_NONE

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

def get_images(query):
    url = 'https://www.bing.com/images/search?q=' + urllib.parse.quote_plus(query)
    req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'})
    try:
        html = urllib.request.urlopen(req, context=ctx, timeout=10).read().decode('utf-8', errors='ignore')
        urls = re.findall(r'\"murl\":\"(https?://[^\"]+?\.(?:jpg|png|jpeg))\"', html)
        return urls
    except Exception as e:
        print(f"Failed search {query}: {e}")
        return []

for disease in diseases:
    disease_dir = os.path.join(base_dir, disease)
    os.makedirs(disease_dir, exist_ok=True)
    
    print(f"Searching for {disease} lab reports...")
    query = f"patient {disease} blood test report filetype:jpg"
    
    urls = get_images(query)
    count = 0
    for img_url in urls:
        if count >= 3: break
        try:
            print(f"  Downloading from {img_url[:60]}...")
            req = urllib.request.Request(img_url, headers={'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'})
            img_data = urllib.request.urlopen(req, context=ctx, timeout=10).read()
            ext = img_url.split('.')[-1][:4]
            if not ext.isalpha(): ext = 'jpg'
            
            filename = os.path.join(disease_dir, f"report_{count+1}.{ext}")
            with open(filename, 'wb') as f:
                f.write(img_data)
            print(f"  -> Saved {filename}")
            count += 1
        except Exception as e:
            print(f"  -> Error downloading: {e}")
    time.sleep(1)

print("Done downloading real lab reports!")
