

from sqlalchemy.orm import Session
from . import models
import json

def safe_float(v, default=0.0):
    if v is None: return default
    if isinstance(v, (int, float)): return float(v)
    try:
        
        import re
        numeric_match = re.search(r"(\d+\.?\d*)", str(v))
        if numeric_match:
            return float(numeric_match.group(1))
        return float(v)
    except:
        return default

def get_patient_feature_vector(patient_id: int, db: Session) -> dict:
    
    

    patient = db.query(models.Patient).filter(models.Patient.id == patient_id).first()
    if not patient:
        return None
    
    
    bmi = 22.0  
    if patient.height and patient.weight and patient.height > 0:
        height_m = patient.height / 100
        bmi = round(patient.weight / (height_m ** 2), 1)
    
    
    symptom_log = db.query(models.Symptom).filter(
        models.Symptom.patient_id == patient_id
    ).order_by(models.Symptom.id.desc()).first()
    
    symptoms = []
    symptom_severity = 3  
    if symptom_log:
        
        try:
            symptoms = json.loads(symptom_log.processed_data or "[]")
        except:
            symptoms = []
        symptom_severity = symptom_log.severity or 3
        
        
        raw_text = (symptom_log.raw_text or "").lower()
        symptom_keywords = [
            "fever", "cough", "headache", "pain", "nausea", "fatigue", 
            "dizziness", "vomiting", "cold", "flu", "chest pain", 
            "breathing", "weakness", "swelling", "sore throat", "runny nose"
        ]
        for kw in symptom_keywords:
            if kw in raw_text and kw not in symptoms:
                symptoms.append(kw)
    

    lab_results = db.query(models.LabResult).filter(
        models.LabResult.patient_id == patient_id
    ).order_by(models.LabResult.recorded_at.desc()).all()
    
    results_count = len(lab_results)
    with open("d:\\disease prediction\\backend\\engine_debug.txt", "a", encoding="utf-8") as f:
        f.write(f"DEBUG [ml_utils]: Patient {patient_id} query found {results_count} results.\n")
    
    lab_values = {}
    all_findings = []
    for result in lab_results:
        test_name = result.test_name.lower().strip()
        if "finding" in test_name:
            if result.value not in all_findings:
                all_findings.append(result.value)
        lab_values[test_name] = result.value
    
    # Store aggregated findings
    lab_values["all_clinical_findings"] = all_findings
    
    
    with open("d:\\disease prediction\\backend\\engine_debug.txt", "a", encoding="utf-8") as f:
        f.write(f"FULL LAB DICT: {lab_values}\n")
    
    feature_data = {
        "patient_id": patient_id,
        "age": patient.age or 30,
        "bmi": bmi,
        "height": patient.height or 170.0,
        "weight": patient.weight or 70.0,
        "gender": patient.gender or "Male",
        
        
        "diabetes": patient.diabetes or False,
        "hypertension": patient.hypertension or False,
        
    
        "smoking": patient.smoking or False,
        "alcohol_consumption": patient.alcohol_consumption or False,
        
        
       
        "hemoglobin": safe_float(lab_values.get("hemoglobin", lab_values.get("hb", 14.0))),
        "glucose": max(
            safe_float(lab_values.get("glucose", 0)),
            safe_float(lab_values.get("fbs", 0)),
            safe_float(lab_values.get("ppbs", 0)),
            safe_float(lab_values.get("sugar", 0))
        ) or 90.0,

        "cholesterol": safe_float(lab_values.get("cholesterol", 180.0)),
        "blood_pressure": safe_float(
            lab_values.get("systolic", 
            lab_values.get("blood pressure", 
            lab_values.get("bp", 120.0)))
        ),
        
        
        "iron": safe_float(lab_values.get("iron", 100.0)),
        "b12": safe_float(lab_values.get("b12", 400.0)),
        "vitamin_d": safe_float(lab_values.get("vitamin d", 80.0)),
        "tsh": safe_float(next((v for k,v in lab_values.items() if "tsh" in k or "stimulating" in k), 2.5)),
        "triglycerides": safe_float(lab_values.get("triglycerides", 150.0)),
        "ldl": safe_float(lab_values.get("ldl", 100.0)),
        "crp": safe_float(lab_values.get("crp", 0.0)),
        "bilirubin": safe_float(lab_values.get("bilirubin", 0.5)),
        "mch": safe_float(lab_values.get("mch", 30.0)),
        "mchc": safe_float(lab_values.get("mchc", 34.0)),
        "ft3": safe_float(lab_values.get("ft3", 3.0)),
        "ft4": safe_float(lab_values.get("ft4", 1.2)),
        "t3": safe_float(next((v for k,v in lab_values.items() if "t3" in k and "ft" not in k), 120.0)),
        "t4": safe_float(next((v for k,v in lab_values.items() if "t4" in k and "ft" not in k), 8.0)),
        
        
        "wbc": safe_float(lab_values.get("wbc", lab_values.get("tlc", lab_values.get("total leukocyte count", 7.0)))),
        "platelets": safe_float(lab_values.get("platelets", lab_values.get("platelet count", 250.0))),
        
       
        "heart_rate": safe_float(lab_values.get("heart rate", lab_values.get("pulse", 72.0))),
        "creatinine": safe_float(lab_values.get("creatinine", 0.9)),
        "alt": safe_float(lab_values.get("alt", 25.0)),
        "ast": safe_float(lab_values.get("ast", 25.0)),
        "egfr": safe_float(lab_values.get("egfr", 90.0)),
        "troponin": safe_float(lab_values.get("troponin", 0.0)),
        "crp": safe_float(lab_values.get("crp", 2.0)),
        
        
        "detected_diagnoses": lab_values.get("all_clinical_findings", []),
        
       
        "malaria_positive": any("malaria" in str(v).lower() for k,v in lab_values.items()),
        
        "symptoms": symptoms,
        "symptom_severity": symptom_severity
    }
    
    return {
        "patient_id": patient_id,
        "patient_name": patient.name,
        "feature_vector": feature_data,
        "raw_data_summary": {
            "symptoms_found": symptoms,
            "lab_tests_found": list(lab_values.keys()),
            "lab_values": lab_values,
            "has_medical_history": patient.diabetes or patient.hypertension
        }
    }
