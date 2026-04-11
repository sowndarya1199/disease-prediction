
import re
import os
from backend.lab_ocr import LAB_TEST_PATTERNS, normalize_numeric_string, create_result_object

def trace_parse_lab_values(text: str):
    print("--- DEEP TRACE: parse_lab_values ---")
    results = []
    cleaned_text = text.replace('|', ' ').replace('[', ' ').replace(']', ' ')
    lines = [line.strip() for line in cleaned_text.split('\n') if line.strip()]
    found_tests = set()

    for i, line in enumerate(lines):
        line_lower = line.lower()
        print(f"\n[Line {i}] processing: '{line_lower}'")
        
        for test_key, config in LAB_TEST_PATTERNS.items():
            if test_key in found_tests:
                continue
                
            match_found = False
            found_keyword = ""
            for keyword in config.get('keywords', []):
                pattern = r'(?<![a-z0-9])' + re.escape(keyword.lower()) + r'(?![a-z0-9])'
                if re.search(pattern, line_lower):
                    match_found = True
                    found_keyword = keyword
                    print(f"  - MATCH: Keyword '{keyword}' found for test '{test_key}'")
                    break
            
            if match_found:
                context_lines = lines[i:min(i+3, len(lines))]
                search_area = " ".join(context_lines).lower()
                keyword_match = re.search(re.escape(found_keyword.lower()), search_area)
                if not keyword_match:
                    print(f"  - ERROR: Keyword match disappeared in search_area?")
                    continue
                
                keyword_end_pos = keyword_match.end()
                remaining_text = search_area[keyword_end_pos:]
                print(f"  - Remaining text: '{remaining_text}'")
                
                
                unit = config.get('unit', '').lower()
                if unit:
                    unit_pattern = r'(\d+\.?\d*)\s*[a-z/]*\s*' + re.escape(unit)
                    unit_match = re.search(unit_pattern, remaining_text)
                    if unit_match:
                        print(f"  - Phase 1 (Unit) SUCCESS: {unit_match.group(1)} {unit}")
                        val = float(unit_match.group(1))
                        results.append(create_result_object(test_key, val, config))
                        found_tests.add(test_key)
                        continue
                    else:
                        print(f"  - Phase 1 (Unit '{unit}') FAILED")

                
                value_found_p2 = False
                for pattern in config['patterns']:
                    match = re.search(pattern, remaining_text)
                    if match:
                        print(f"  - Phase 2 (Regex '{pattern}') SUCCESS")
                        raw_val = match.group(1) if match.groups() else match.group(0)
                        norm_string = normalize_numeric_string(raw_val)
                        if norm_string:
                            val = float(norm_string)
                            results.append(create_result_object(test_key, val, config))
                            found_tests.add(test_key)
                            value_found_p2 = True
                            break
                
                if value_found_p2:
                    continue
                else:
                    print(f"  - Phase 2 (Regex) FAILED")

                
                tokens = re.split(r'[:\s;|=,]+', remaining_text)
                print(f"  - Phase 3 Tokens: {tokens}")
                valid_values = []
                for token in tokens:
                    token = token.strip()
                    if not token: continue
                    norm_string = normalize_numeric_string(token)
                    if not norm_string: continue
                    try:
                        v = float(norm_string)
                        if 0 <= v < 10000 and v not in [2025, 2026]:
                            valid_values.append(v)
                    except: continue
                
                if valid_values:
                    chosen_val = valid_values[0]
                    multi_digit = [v for v in valid_values if v >= 10 or '.' in str(v)]
                    print(f"  - Valid values: {valid_values}, Multi-digit candidates: {multi_digit}")
                    if multi_digit:
                        chosen_val = multi_digit[0]
                    
                    print(f"  - Phase 3 (Token) SUCCESS: {chosen_val}")
                    results.append(create_result_object(test_key, chosen_val, config))
                    found_tests.add(test_key)
                else:
                    print(f"  - Phase 3 (Token) FAILED")
    
    print("\n--- FINAL RESULTS ---")
    for r in results:
        print(f"{r['test_name']}: {r['value']} {r['unit']}")

if __name__ == "__main__":
    raw_path = "ocr_debug.txt"
    if os.path.exists(raw_path):
        with open(raw_path, "r", encoding="utf-8") as f:
            trace_parse_lab_values(f.read())
    else:
        print("ocr_debug.txt not found")
