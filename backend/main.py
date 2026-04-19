from fastapi import FastAPI, Depends, HTTPException, status, UploadFile, File, Form, Request
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
import models, schemas, database, auth, ml_utils, ml_engine, lab_ocr, risk_stratification, diet_recommendation, symptom_categories
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordRequestForm
from fastapi.staticfiles import StaticFiles
import shutil
import uuid
import os
import json
from sqlalchemy import func

# Simplified path detection
BACKEND_DIR = os.path.dirname(os.path.abspath(__file__))

UPLOAD_DIR = os.path.join(BACKEND_DIR, "uploads", "lab_reports")
DIET_UPLOAD_DIR = os.path.join(BACKEND_DIR, "uploads", "diets")
SIGNATURE_DIR = os.path.join(BACKEND_DIR, "uploads", "signatures")

os.makedirs(UPLOAD_DIR, exist_ok=True)
os.makedirs(DIET_UPLOAD_DIR, exist_ok=True)
os.makedirs(SIGNATURE_DIR, exist_ok=True)


models.Base.metadata.create_all(bind=database.engine)

app = FastAPI()



app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.mount("/uploads", StaticFiles(directory=os.path.join(BACKEND_DIR, "uploads")), name="uploads")


@app.post("/register")
def register_user(user: schemas.UserCreate, db: Session = Depends(database.get_db)):
    db_user = db.query(models.User).filter(models.User.username == user.username).first()
    if db_user:
        raise HTTPException(status_code=400, detail="Username already registered")
    
    hashed_password = auth.get_password_hash(user.password)
    new_user = models.User(username=user.username, password_hash=hashed_password, role=user.role)
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return {"msg": "User created successfully"}

@app.post("/token")
def login_for_access_token(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(database.get_db)):
    user = db.query(models.User).filter(models.User.username == form_data.username).first()
    if not user or not auth.verify_password(form_data.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    access_token = auth.create_access_token(data={"sub": user.username, "role": user.role})
    return {"access_token": access_token, "token_type": "bearer", "role": user.role}

@app.post("/signatures/upload")
async def upload_signature(file: UploadFile = File(...)):
    """Upload a doctor's signature image."""
    file_ext = file.filename.split(".")[-1] if "." in file.filename else "png"
    file_name = f"sig_{uuid.uuid4().hex}.{file_ext}"
    file_path = os.path.join(SIGNATURE_DIR, file_name)
    
    with open(file_path, "wb") as buffer:
        content = await file.read()
        buffer.write(content)
    
    return {"signature_url": f"/uploads/signatures/{file_name}", "signature_path": file_path}

@app.post("/patients/", response_model=schemas.Patient)
def create_patient(patient: schemas.PatientCreate, db: Session = Depends(database.get_db)):
    db_patient = models.Patient(**patient.dict())
    db.add(db_patient)
    db.commit()
    db.refresh(db_patient)
    return db_patient

@app.get("/patients/", response_model=list[schemas.Patient])
def read_patients(skip: int = 0, limit: int = 100, db: Session = Depends(database.get_db)):
    patients = db.query(models.Patient).offset(skip).limit(limit).all()
    return patients

@app.get("/patients/{patient_id}", response_model=schemas.Patient)
def read_patient(patient_id: int, db: Session = Depends(database.get_db)):
    db_patient = db.query(models.Patient).filter(models.Patient.id == patient_id).first()
    if db_patient is None:
        raise HTTPException(status_code=404, detail="Patient not found")
    return db_patient

@app.delete("/patients/{patient_id}")
def delete_patient(patient_id: int, db: Session = Depends(database.get_db)):
    db_patient = db.query(models.Patient).filter(models.Patient.id == patient_id).first()
    if db_patient is None:
        raise HTTPException(status_code=404, detail="Patient not found")
    
    
    db.query(models.Symptom).filter(models.Symptom.patient_id == patient_id).delete()
    
    db.query(models.LabResult).filter(models.LabResult.patient_id == patient_id).delete()
    
    db.delete(db_patient)
    db.commit()
    
    return {"message": f"Patient {patient_id} deleted successfully"}

@app.post("/symptoms/process")
def process_symptoms(data: dict):
    
    symptoms_list = data.get("symptoms", [])
    text = data.get("text", "")
    
    
    if symptoms_list:
        text = ", ".join(symptoms_list).lower()
    else:
        text = text.lower()
    
    
    high_severity_keywords = ["chest pain", "difficulty breathing", "severe pain", "unconscious", 
                              "bleeding", "seizure", "stroke", "heart attack", "paralysis", "severe"]
    moderate_severity_keywords = ["fever", "vomiting", "dizziness", "persistent pain", "infection",
                                   "swelling", "high blood pressure", "shortness of breath", "weakness"]
    low_severity_keywords = ["headache", "cough", "cold", "fatigue", "nausea", "mild pain", 
                             "runny nose", "sore throat", "flu", "tiredness"]
    
    
    all_keywords = ["fever", "cough", "headache", "pain", "nausea", "fatigue", "dizziness", 
                    "vomiting", "cold", "flu", "chest pain", "breathing", "weakness", "swelling",
                    "infection", "bleeding", "seizure", "sore throat", "runny nose"]
    
    
    if symptoms_list:
        found_symptoms = [s.lower() for s in symptoms_list]
    else:
        found_symptoms = [word for word in all_keywords if word in text]
    
    
    severity_level = "Low"
    severity_score = 3
    
    
    for keyword in high_severity_keywords:
        if keyword in text:
            severity_level = "High"
            severity_score = 9
            break
    
    
    if severity_level == "Low":
        for keyword in moderate_severity_keywords:
            if keyword in text:
                severity_level = "Moderate"
                severity_score = 6
                break
    
    
    if len(found_symptoms) >= 4 and severity_level == "Low":
        severity_level = "Moderate"
        severity_score = 5
    elif len(found_symptoms) >= 3 and severity_level == "Moderate":
        severity_level = "High"
        severity_score = 8
    
    return {
        "symptoms": found_symptoms,
        "severity_level": severity_level,
        "severity_score": severity_score
    }

@app.get("/symptoms/categories")
def get_symptom_categories():
    """Get all symptom categories organized by body system."""
    return {
        "categories": symptom_categories.get_symptom_categories(),
        "all_symptoms": symptom_categories.get_all_symptoms()
    }

@app.get("/symptoms/common")
def get_common_symptoms():
    """Get list of common symptoms for quick-add buttons."""
    return {
        "common_symptoms": symptom_categories.get_common_symptoms()
    }

@app.get("/symptoms/search")
def search_symptoms(q: str = "", limit: int = 10):
    """Search symptoms by query string."""
    if not q or len(q) < 2:
        return {"results": []}
    
    results = symptom_categories.search_symptoms(q, limit)
    return {"results": results}

@app.post("/symptoms/", response_model=schemas.Symptom)
def create_symptom(log: schemas.SymptomCreate, db: Session = Depends(database.get_db)):
    import json
    
    all_keywords = ["fever", "cough", "headache", "pain", "nausea", "fatigue", "dizziness", 
                    "vomiting", "cold", "flu", "chest pain", "breathing", "weakness", "swelling",
                    "infection", "bleeding", "seizure", "sore throat", "runny nose"]
    
   
    raw_lower = log.raw_text.lower()
    
    provided_symptoms = [s.strip().lower() for s in log.raw_text.split(",") if s.strip()]
    
    
    found_symptoms = list(set(provided_symptoms + [word for word in all_keywords if word in raw_lower]))
    processed_json = json.dumps(found_symptoms)
    
    db_log = models.Symptom(
        patient_id=log.patient_id, 
        raw_text=log.raw_text,
        processed_data=processed_json,
        severity=log.severity, 
        duration=log.duration
    )
    db.add(db_log)
    db.commit()
    db.refresh(db_log)
    return db_log

@app.get("/symptoms/{patient_id}", response_model=list[schemas.Symptom])
def get_patient_symptoms(patient_id: int, db: Session = Depends(database.get_db)):
    logs = db.query(models.Symptom).filter(
        models.Symptom.patient_id == patient_id
    ).all()
    return logs

@app.delete("/symptoms/{log_id}")
def delete_symptom(log_id: int, db: Session = Depends(database.get_db)):
    log = db.query(models.Symptom).filter(models.Symptom.id == log_id).first()
    if not log:
        raise HTTPException(status_code=404, detail="Symptom not found")
    
    db.delete(log)
    db.commit()
    return {"message": "Symptom deleted successfully"}



@app.delete("/labs/{result_id}")
def delete_lab_result(result_id: int, db: Session = Depends(database.get_db)):
    result = db.query(models.LabResult).filter(models.LabResult.id == result_id).first()
    if not result:
        raise HTTPException(status_code=404, detail="Lab result not found")
    
    db.delete(result)
    db.commit()
    return {"message": "Lab result deleted successfully"}

@app.post("/labs/delete-batch")
def delete_lab_results_bulk(result_ids: list[int], db: Session = Depends(database.get_db)):
    results = db.query(models.LabResult).filter(models.LabResult.id.in_(result_ids)).all()
    if not results:
        raise HTTPException(status_code=404, detail="No matching lab results found")
    
    for result in results:
        db.delete(result)
    
    db.commit()
    return {"message": f"Deleted {len(results)} lab results successfully"}

@app.get("/labs/{patient_id}", response_model=list[schemas.LabResult])
def get_patient_labs(patient_id: int, db: Session = Depends(database.get_db)):
    results = db.query(models.LabResult).filter(
        models.LabResult.patient_id == patient_id
    ).order_by(models.LabResult.recorded_at.desc()).all()
    return results

@app.post("/labs/upload")
async def upload_lab_report(
    file: UploadFile = File(...),
    patient_id: str = Form(None),
    db: Session = Depends(database.get_db)
):
    if not file:
        raise HTTPException(status_code=400, detail="No file uploaded")
    
    
    content = await file.read()
    content_type = file.content_type or ""
    

    try:
        result = lab_ocr.process_lab_report(content, content_type)
        print(f"DEBUG: OCR result success={result.get('success')}, count={len(result.get('results', []))}")
    except Exception as e:
        print(f"DEBUG: OCR ERROR: {str(e)}")
        result = lab_ocr.simulate_lab_report_processing(file.filename or "report", content)
    
    
    if not result.get('success') or not result.get('results'):
        print(f"DEBUG: OCR matched nothing or failed. Falling back to simulation.")
        result = lab_ocr.simulate_lab_report_processing(file.filename or "report", content)
    
    
    patient_id_int = None
    if patient_id:
        try:
            patient_id_int = int(patient_id)
        except:
            pass

    if patient_id_int:
       
        file_ext = file.filename.split(".")[-1] if "." in file.filename else "png"
        file_name = f"patient_{patient_id_int}_{uuid.uuid4().hex}.{file_ext}"
        file_path = os.path.join(UPLOAD_DIR, file_name)
        
        with open(file_path, "wb") as buffer:
            buffer.write(content)
        
        
        db_patient = db.query(models.Patient).filter(models.Patient.id == patient_id_int).first()
        if db_patient:
            db_patient.lab_report_path = f"/uploads/lab_reports/{file_name}"
            db.commit()

    if patient_id_int and result.get('results'):
        try:
            db_results = []

            for lab_result in result['results']:
                db_result = models.LabResult(
                    patient_id=patient_id_int,
                    test_name=lab_result['test_name'],
                    value=lab_result['value'],
                    unit=lab_result['unit'],
                    is_abnormal=lab_result['is_abnormal'],
                    reference_range=lab_result['reference_range']
                )
                db.add(db_result)
                db_results.append(db_result)
            
            db.commit()
            
           
            final_results = []
            for db_res in db_results:
                db.refresh(db_res)
                final_results.append({
                    "id": db_res.id,
                    "test_name": db_res.test_name,
                    "value": db_res.value,
                    "unit": db_res.unit,
                    "is_abnormal": db_res.is_abnormal,
                    "reference_range": db_res.reference_range
                })
            
            result['results'] = final_results
            result['saved_to_patient'] = patient_id_int
            result['message'] = f"Extracted and saved {len(final_results)} lab results"
        except Exception as db_err:
            db.rollback()
            result['success'] = False
            result['message'] = f"Database error: {str(db_err)}"
    return {
        **result,
        "is_simulated": result.get("is_simulated", False)
    }

@app.get("/patients/{patient_id}/features")
def get_patient_features(patient_id: int, db: Session = Depends(database.get_db)):
    features = ml_utils.get_patient_feature_vector(patient_id, db)
    if not features:
        raise HTTPException(status_code=404, detail="Patient not found")
    return features

@app.post("/patients/{patient_id}/predict")
def predict_patient_disease(patient_id: int, db: Session = Depends(database.get_db)):
    feature_data = ml_utils.get_patient_feature_vector(patient_id, db)
    if not feature_data:
        raise HTTPException(status_code=404, detail="Patient not found")
    
    try:
        actual_features = feature_data.get("feature_vector", feature_data)
        result = ml_engine.predict_with_explanation(actual_features)
    except Exception as e:
        import traceback
        err_msg = f"CRITICAL ENGINE ERROR: {str(e)}\n{traceback.format_exc()}"
        print(err_msg)
        with open("d:\\disease prediction\\backend\\engine_debug.txt", "a", encoding="utf-8") as f:
            f.write(err_msg + "\n")
        raise HTTPException(status_code=500, detail=f"AI Engine Error: {str(e)}")
    
   
    db_validation = db.query(models.ClinicalValidation).filter(
        models.ClinicalValidation.patient_id == patient_id,
        models.ClinicalValidation.is_draft == False
    ).order_by(models.ClinicalValidation.timestamp.desc()).first()
    
    if db_validation:
        if db_validation.final_diagnosis:
            result["disease"] = db_validation.final_diagnosis
            result["probability"] = 1.0
        
        result["prediction_method"] = f"Clinically Certified by Doctor (Decision: {db_validation.decision})"
        
        if "explanation" not in result:
            result["explanation"] = {"clean_explanation": {}}
        if "clean_explanation" not in result["explanation"]:
            result["explanation"]["clean_explanation"] = {}
            
       
        if db_validation.decision == 'Modify Diagnosis':
            result["explanation"]["summary"] = f"Modified by physician. Clinical Findings: {db_validation.observations or 'None recorded.'}"
            result["explanation"]["clean_explanation"]["key_reason"] = db_validation.observations or "This case was clinically modified by a medical professional."
            result["explanation"]["clean_explanation"]["factors"] = []
        else:
           
            if db_validation.observations:
                result["explanation"]["summary"] = f"Accepted & Verified by physician. Notes: {db_validation.observations}"
        
        if db_validation.prescription_notes:
            result["prescription"] = db_validation.prescription_notes
    
    
    db_patient = db.query(models.Patient).filter(models.Patient.id == patient_id).first()
    
    result["patient_name"] = db_patient.name if db_patient else "Unknown"
    result["data_summary"] = feature_data.get("raw_data_summary", {})
    result["lab_report_url"] = db_patient.lab_report_path if db_patient and db_patient.lab_report_path else None
    
    
    risk_result = risk_stratification.perform_risk_stratification(
        feature_data["feature_vector"],
        result
    )
    result["risk_stratification"] = risk_result
    
    
    if db_patient and db_patient.approval_status not in ["Approved", "Modified"]:
        db_patient.approval_status = "Pending Approval"
    
    
    if db_patient:
        notif = models.Notification(
            patient_id=patient_id,
            patient_name=db_patient.name,
            risk_level=result.get("risk", "Low"),
            message=f"New analysis result: {result.get('disease')} ({result.get('risk')} Risk)"
        )
        db.add(notif)
        db.commit()
        
    return result

@app.get("/patients/{patient_id}/explain")
def get_patient_explanation(patient_id: int, disease: str = None, db: Session = Depends(database.get_db)):
    """Generate an explanation for a patient, optionally for a specific disease (for doctor overrides)."""
    feature_data = ml_utils.get_patient_feature_vector(patient_id, db)
    if not feature_data:
        raise HTTPException(status_code=404, detail="Patient not found")
    
    try:
        actual_features = feature_data.get("feature_vector", feature_data)
       
        result = ml_engine.predict_with_explanation(actual_features, target_disease=disease)
        
       
        db_patient = db.query(models.Patient).filter(models.Patient.id == patient_id).first()
        result["patient_name"] = db_patient.name if db_patient else "Unknown"
        result["data_summary"] = feature_data.get("raw_data_summary", {})
        result["lab_report_url"] = f"http://localhost:8000{db_patient.lab_report_path}" if db_patient and db_patient.lab_report_path else None
        
        return result
    except Exception as e:
        import traceback
        print(f"EXPLAIN ERROR: {str(e)}\n{traceback.format_exc()}")
        raise HTTPException(status_code=500, detail=str(e))




@app.get("/patients/{patient_id}/risk-assessment")
def get_patient_risk_assessment(patient_id: int, db: Session = Depends(database.get_db)):
   
    feature_data = ml_utils.get_patient_feature_vector(patient_id, db)
    if not feature_data:
        raise HTTPException(status_code=404, detail="Patient not found")
    
    try:
       
        prediction = ml_engine.predict_with_explanation(feature_data["feature_vector"])
        
        
        risk_result = risk_stratification.perform_risk_stratification(
            feature_data["feature_vector"],
            prediction
        )
        
        risk_result["patient_name"] = feature_data.get("patient_name", "Unknown")
        risk_result["predicted_condition"] = prediction.get("disease", "Unknown")
        
        return risk_result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/patients/{patient_id}/diet-recommendation")
def get_diet_recommendation(
    patient_id: int,
    food_preference: str = "none",
    db: Session = Depends(database.get_db)
):
   
    feature_data = ml_utils.get_patient_feature_vector(patient_id, db)
    if not feature_data:
        raise HTTPException(status_code=404, detail="Patient not found")
    
    try:
        
        prediction = ml_engine.predict_with_explanation(feature_data["feature_vector"])
        
        
        risk_result = risk_stratification.perform_risk_stratification(
            feature_data["feature_vector"],
            prediction
        )
        
        
        diet_result = diet_recommendation.generate_diet_recommendation(
            predicted_disease=prediction.get("disease", "Healthy"),
            abnormal_labs=risk_result.get("critical_labs", []),
            food_preference=food_preference,
            patient_name=feature_data.get("patient_name", "Patient")
        )
        
        return diet_result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))



@app.get("/notifications", response_model=list[schemas.Notification])
def get_notifications(db: Session = Depends(database.get_db)):
   
    notifications = db.query(models.Notification).limit(50).all()
    return notifications


@app.put("/notifications/{notification_id}/read")
def mark_notification_read(notification_id: int, db: Session = Depends(database.get_db)):
   
    notification = db.query(models.Notification).filter(
        models.Notification.id == notification_id
    ).first()
    if not notification:
        raise HTTPException(status_code=404, detail="Notification not found")
    
    notification.is_read = True
    db.commit()
    return {"message": "Notification marked as read"}

@app.delete("/notifications/{notification_id}")
def delete_notification(notification_id: int, db: Session = Depends(database.get_db)):
    notification = db.query(models.Notification).filter(
        models.Notification.id == notification_id
    ).first()
    if not notification:
        raise HTTPException(status_code=404, detail="Notification not found")
    
    db.delete(notification)
    db.commit()
    return {"message": "Notification deleted successfully"}


@app.get("/notifications/unread-count")
def get_unread_count(db: Session = Depends(database.get_db)):
    
    count = db.query(models.Notification).filter(
        models.Notification.is_read == False
    ).count()
    return {"count": count}

@app.get("/analytics/summary")
def get_analytics_summary(db: Session = Depends(database.get_db)):
    """Fetch aggregated data for dashboard charts."""
    # 1. Total Patients
    total_patients = db.query(models.Patient).count()
    
    # 2. Gender Distribution
    gender_counts = db.query(models.Patient.gender, func.count(models.Patient.id)).group_by(models.Patient.gender).all()
    gender_dist = [{"name": (g[0] or "Unknown"), "value": g[1]} for g in gender_counts]
    
    # 3. Age Distribution
    age_groups = {
        "0-20": 0,
        "21-40": 0,
        "41-60": 0,
        "61+": 0
    }
    patients = db.query(models.Patient.age).all()
    for p in patients:
        age = p[0]
        if age is None: continue
        if age <= 20: age_groups["0-20"] += 1
        elif age <= 40: age_groups["21-40"] += 1
        elif age <= 60: age_groups["41-60"] += 1
        else: age_groups["61+"] += 1
    age_dist = [{"name": k, "value": v} for k, v in age_groups.items()]
    
    # 4. Disease Distribution (from ClinicalValidation)
    disease_counts = db.query(models.ClinicalValidation.final_diagnosis, func.count(models.ClinicalValidation.id))\
        .filter(models.ClinicalValidation.final_diagnosis != None)\
        .group_by(models.ClinicalValidation.final_diagnosis).all()
    disease_dist = [{"name": d[0], "count": d[1]} for d in disease_counts]
    
    # 5. Risk Level Distribution (from Notifications)
    risk_counts = db.query(models.Notification.risk_level, func.count(models.Notification.id))\
        .group_by(models.Notification.risk_level).all()
    risk_dist = [{"name": r[0], "value": r[1]} for r in risk_counts]
    
    return {
        "total_patients": total_patients,
        "gender_dist": gender_dist,
        "age_dist": age_dist,
        "disease_dist": disease_dist,
        "risk_dist": risk_dist
    }

@app.post("/patients/{patient_id}/validation", response_model=schemas.ClinicalValidation)
def create_clinical_validation(
    patient_id: int, 
    validation: schemas.ClinicalValidationCreate, 
    db: Session = Depends(database.get_db)
):
    
    validation_data = validation.dict()
    validation_data["patient_id"] = patient_id
    
    db_validation = models.ClinicalValidation(
        **validation_data
    )
    db.add(db_validation)
    
    
    if not validation.is_draft:
        db_patient = db.query(models.Patient).filter(models.Patient.id == patient_id).first()
        if db_patient:
            if validation.decision == 'Accept AI Prediction':
                db_patient.approval_status = "Approved"
            else:
                db_patient.approval_status = "Modified"
            
    db.commit()
    db.refresh(db_validation)
    return db_validation

@app.get("/patients/{patient_id}/finalized-diet")
def get_finalized_diet(patient_id: int, regenerate: bool = False, preference: str = "none", db: Session = Depends(database.get_db)):
    """Fetch the latest finalized diet for a patient with fallback to AI generation or forced regeneration."""
    print(f"DEBUG: get_finalized_diet called for patient {patient_id} (regenerate={regenerate}, preference={preference})")
    try:
        db_validation = None
        if not regenerate:
            db_validation = db.query(models.ClinicalValidation).filter(
                models.ClinicalValidation.patient_id == patient_id,
                models.ClinicalValidation.is_draft == False,
                models.ClinicalValidation.diet_plan != None
            ).order_by(models.ClinicalValidation.timestamp.desc()).first()
        
        if not db_validation:
            
            feature_data = ml_utils.get_patient_feature_vector(patient_id, db)
            if not feature_data:
                raise HTTPException(status_code=404, detail=f"Patient ID {patient_id} not found")
            
            try:
                prediction = ml_engine.predict_with_explanation(feature_data["feature_vector"])
                risk_result = risk_stratification.perform_risk_stratification(
                    feature_data["feature_vector"],
                    prediction
                )
                
                db_patient = db.query(models.Patient).filter(models.Patient.id == patient_id).first()
                diet_result = diet_recommendation.generate_diet_recommendation(
                    predicted_disease=prediction.get("disease", "Healthy"),
                    abnormal_labs=risk_result.get("critical_labs", []),
                    food_preference=preference,
                    patient_name=feature_data.get("patient_name", "Patient"),
                    age=db_patient.age if db_patient else 40,
                    gender=db_patient.gender if db_patient else "other",
                    height=db_patient.height if db_patient and db_patient.height else 170.0,
                    weight=db_patient.weight if db_patient and db_patient.weight else 70.0
                )
                diet_result["is_finalized"] = False
                return diet_result
            except Exception as ml_err:
                print(f"ML Processing error: {str(ml_err)}")
                raise HTTPException(status_code=500, detail=f"Error processing medical logic: {str(ml_err)}")

        import json
        try:
            diet_data = json.loads(db_validation.diet_plan)
            diet_data["is_finalized"] = True
            diet_data["doctor_name"] = "Medical Professional"
            return diet_data
        except Exception as json_err:
            print(f"JSON Parsing error: {str(json_err)}")
            raise HTTPException(status_code=500, detail=f"Failed to parse stored diet plan: {str(json_err)}")
            
    except HTTPException:
        raise
    except Exception as e:
        print(f"Generic error in get_finalized_diet: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")


@app.get("/patients/{patient_id}/download-diet-pdf")
def download_diet_pdf(patient_id: int, preference: str = "none", db: Session = Depends(database.get_db)):
    """Generate and return a PDF of the finalized diet."""
    import traceback
    try:
        from fpdf import FPDF
        import json
        import os
        import uuid

        db_validation = db.query(models.ClinicalValidation).filter(
            models.ClinicalValidation.patient_id == patient_id,
            models.ClinicalValidation.is_draft == False,
            models.ClinicalValidation.diet_plan != None
        ).order_by(models.ClinicalValidation.timestamp.desc()).first()

        if not db_validation:
            raise HTTPException(status_code=404, detail="No finalized diet plan found for this patient.")

        try:
            diet = json.loads(db_validation.diet_plan)
        except:
            raise HTTPException(status_code=500, detail="Invalid diet plan data")

        db_patient = db.query(models.Patient).filter(models.Patient.id == patient_id).first()
        patient_name = db_patient.name if db_patient else "Patient"

        def safe_text(text):
            if not text: return ""
            if not isinstance(text, str): text = str(text)
            replacements = {
                '•': '-', '✓': 'v', '✅': 'v', '🥗': '', '📅': '', '🚫': 'X', 
                '💡': '!', '💧': 'o', '🚰': 'o', '⚕️': '+', '🩺': '+', '💊': '*',
                '🍎': '*', '🍚': '*', '🥛': '*', '🥣': '*', '🥚': '*', '🍗': '*',
                '🥦': '*', '🥕': '*', '🍞': '*', '🥜': '*', '🥑': '*'
            }
            for char, sub in replacements.items():
                text = text.replace(char, sub)
            try:
                return text.encode('latin-1', 'replace').decode('latin-1')
            except:
                return "".join(c if ord(c) < 256 else '?' for c in text)

        import requests
        from io import BytesIO

        class PremiumDietPDF(FPDF):
            def header(self):
                
                self.set_fill_color(5, 150, 105) 
                self.rect(0, 0, 210, 35, 'F')
                
                self.set_y(10)
                self.set_text_color(255, 255, 255)
                self.set_font('helvetica', 'B', 18)
                self.cell(0, 10, 'PERSONALIZED NUTRITION PROTOCOL', align='C', new_x="LMARGIN", new_y="NEXT")
                self.set_font('helvetica', 'I', 9)
                self.cell(0, 6, 'Clinically Tailored Meal Plan & Dietary Guidelines', align='C', new_x="LMARGIN", new_y="NEXT")
                self.ln(10)

            def footer(self):
                self.set_y(-15)
                self.set_fill_color(248, 250, 252)
                self.rect(0, 282, 210, 15, 'F')
                
                self.set_font('helvetica', 'I', 7)
                self.set_text_color(150)
                self.cell(0, 5, f'CONFIDENTIAL DIET PLAN | MedPred AI System | Page {self.page_no()}', align='C')

        pdf = PremiumDietPDF()
        pdf.add_page()
        pdf.set_auto_page_break(auto=True, margin=30)

        info = diet.get('patient_info', {})
        bmi_val = info.get("bmi", "N/A")
        bmi_cat = info.get("bmi_category", "Normal")
        
        if bmi_val == "N/A" and db_patient and db_patient.height and db_patient.weight:
            h_m = db_patient.height / 100
            calc_bmi = db_patient.weight / (h_m ** 2)
            bmi_val = f"{calc_bmi:.1f}"
            if calc_bmi < 18.5: bmi_cat = "Underweight"
            elif calc_bmi < 25.0: bmi_cat = "Normal"
            elif calc_bmi < 30.0: bmi_cat = "Overweight"
            else: bmi_cat = "Obese"

        pdf.set_text_color(0, 0, 0)
        pdf.set_font('helvetica', 'B', 14)
        pdf.cell(pdf.epw, 10, f'Patient Information', new_x="LMARGIN", new_y="NEXT")
        pdf.set_font('helvetica', '', 11)
        
        col_width = pdf.epw / 2
        pdf.cell(col_width, 7, safe_text(f'Name: {patient_name}'), border=0)
        pdf.cell(col_width, 7, f'Date: {info.get("date", db_validation.timestamp.strftime("%Y-%m-%d") if db_validation.timestamp else "N/A")}', new_x="LMARGIN", new_y="NEXT")
        pdf.cell(col_width, 7, safe_text(f'Condition: {diet.get("target_condition", "General Health")}'), border=0)
        pdf.cell(col_width, 7, f'BMI: {bmi_val} ({bmi_cat})', new_x="LMARGIN", new_y="NEXT")
        pdf.cell(col_width, 7, f'Calories: {diet.get("calorie_requirement", {}).get("total_kcal", diet.get("total_daily_calories", "N/A"))} kcal/day', border=0)
        pdf.ln(10)

        if diet.get('nutritional_goals'):
            pdf.set_font('helvetica', 'B', 12)
            pdf.cell(pdf.epw, 10, ' Nutritional Goals', new_x="LMARGIN", new_y="NEXT")
            pdf.set_font('helvetica', '', 11)
            for goal in diet['nutritional_goals']:
                pdf.cell(pdf.epw, 7, safe_text(f"  - {goal}"), new_x="LMARGIN", new_y="NEXT")
            pdf.ln(5)

        def render_meal_track(track_name, track_data):
            if not track_data: return
            pdf.ln(5)
            pdf.set_font('helvetica', 'B', 12)
            pdf.set_text_color(5, 150, 105) if "Vegetarian" in track_name else pdf.set_text_color(180, 83, 9)
            pdf.cell(pdf.epw, 10, f' {track_name}', new_x="LMARGIN", new_y="NEXT", border='B')
            pdf.set_text_color(0, 0, 0)
            
            for meal_name, meal_data in track_data.items():
                title = safe_text(meal_name.replace('_', ' ').title())
                time = safe_text(meal_data.get('time', ''))
                
                pdf.set_fill_color(248, 250, 252)
                pdf.set_font('helvetica', 'B', 11)
                pdf.cell(pdf.epw * 0.75, 8, f' {title} ({time})', fill=True)
                pdf.cell(pdf.epw * 0.25, 8, f'{meal_data.get("total_calories", 0)} cal', fill=True, new_x="LMARGIN", new_y="NEXT", align='R')
                
                pdf.set_font('helvetica', '', 10)
                items = meal_data.get('items', [])
                for idx, item in enumerate(items):
                    name = safe_text(item.get('name', ''))
                    portion = safe_text(item.get('portion', ''))
                    benefit = safe_text(item.get('benefits', ''))
                    pdf.set_font('helvetica', 'B', 10)
                    pdf.cell(pdf.epw, 5, f'   Option {idx + 1}: {name}', new_x="LMARGIN", new_y="NEXT")
                    pdf.set_font('helvetica', '', 9)
                    pdf.multi_cell(pdf.epw, 5, f'     Portion: {portion} | Benefit: {benefit}', new_x="LMARGIN", new_y="NEXT")
                pdf.ln(2)

        if preference == "vegetarian":
            veg_track = diet.get('vegetarian_diet_plan')
            if veg_track:
                render_meal_track("Pure Vegetarian Diet Plan", veg_track)
        else:
            mixed_track = diet.get('mixed_diet_plan')
            if mixed_track:
                render_meal_track("Non-Vegetarian Diet Plan", mixed_track)
            
        if diet.get('foods_to_avoid'):
            pdf.ln(5)
            pdf.set_text_color(185, 28, 28)
            pdf.set_font('helvetica', 'B', 12)
            pdf.cell(pdf.epw, 10, ' Foods to Avoid', new_x="LMARGIN", new_y="NEXT")
            pdf.set_font('helvetica', '', 10)
            pdf.set_text_color(0, 0, 0)
            for food in diet.get('foods_to_avoid', []):
                pdf.cell(pdf.epw, 6, safe_text(f'  X {food}'), new_x="LMARGIN", new_y="NEXT")

        pdf.ln(10)
        pdf.set_font('helvetica', 'I', 8)
        pdf.set_text_color(120)
        disclaimer = safe_text(diet.get('disclaimer', "Consult a doctor before starting this diet plan."))
        pdf.multi_cell(pdf.epw, 4, f"NOTE: {disclaimer}", ln=1)

        file_name = f"diet_{patient_id}_{uuid.uuid4().hex}.pdf"
        file_path = os.path.join(DIET_UPLOAD_DIR, file_name)
        pdf.output(file_path)

        from fastapi.responses import FileResponse
        return FileResponse(file_path, filename=f"{safe_text(patient_name)}_Diet_Plan.pdf", media_type='application/pdf')
    except Exception as e:
        print(f"PDF Error: {str(e)}")
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"PDF Error: {str(e)}")


@app.get("/patients/{patient_id}/download-health-report")
def download_health_report(patient_id: int, request: Request, db: Session = Depends(database.get_db)):
    
    import traceback
    import datetime
    import json
    import os
    import uuid
    import re
    from fpdf import FPDF
    from fastapi.responses import FileResponse

    try:
        
        db_patient = db.query(models.Patient).filter(models.Patient.id == patient_id).first()
        if not db_patient:
            raise HTTPException(status_code=404, detail="Patient Not Found")

        db_validation = db.query(models.ClinicalValidation).filter(
            models.ClinicalValidation.patient_id == patient_id,
            models.ClinicalValidation.is_draft == False,
        ).order_by(models.ClinicalValidation.id.desc()).first()

        feature_data = ml_utils.get_patient_feature_vector(patient_id, db)
        actual_features = feature_data.get("feature_vector", feature_data)
        prediction = ml_engine.predict_with_explanation(actual_features)
        risk_result = risk_stratification.perform_risk_stratification(actual_features, prediction)

       
        def get_lab_status(val_str, range_str, is_abn):
            if not is_abn: return "Normal"
            if not val_str or not range_str: return "ABNORMAL"
            try:
                val_nums = re.findall(r"[-+]?\d*\.\d+|\d+", str(val_str))
                ref_nums = re.findall(r"[-+]?\d*\.\d+|\d+", str(range_str))
                if val_nums and ref_nums:
                    val = float(val_nums[0])
                    if len(ref_nums) >= 2:
                        low, high = float(ref_nums[0]), float(ref_nums[1])
                        if val < low: return "LOW"
                        if val > high: return "HIGH"
                    elif len(ref_nums) == 1:
                        ref = float(ref_nums[0])
                        if ">" in range_str and val <= ref: return "LOW"
                        if "<" in range_str and val >= ref: return "HIGH"
                        if val > ref: return "HIGH"
                        if val < ref: return "LOW"
            except: pass
            return "ABNORMAL"

        def safe_text(text):
            if not text: return ""
            if not isinstance(text, str): text = str(text)
            
            text = text.replace('•', '-').replace('✓', 'v').replace('✅', 'v').replace('⚠️', '!').replace('👉', '>')
            text = text.replace('⭐', '*').replace('📈', '+').replace('🔍', '?').replace('🩸', 'o').replace('💊', '*')
            text = text.replace('🩺', '+').replace('🔬', '!').replace('🥗', '').replace('📅', '').replace('🚫', 'X')
            text = "".join(c if ord(c) < 128 else ' ' for c in text)
            return text.strip()

        class ClinicalReportPDF(FPDF):
            def header(self):
                if self.page_no() == 1:
                    self.set_fill_color(15, 23, 42) 
                    self.rect(0, 0, 210, 30, 'F')
                    self.set_y(10)
                    self.set_text_color(255, 255, 255)
                    self.set_font('helvetica', 'B', 18)
                    self.cell(0, 10, 'CLINICAL HEALTH ASSESSMENT REPORT', align='C', new_x="LMARGIN", new_y="NEXT")
                    self.ln(5)
                else:
                    self.set_fill_color(15, 23, 42)
                    self.rect(0, 0, 210, 10, 'F')
                    self.ln(8)

            def footer(self):
                self.set_y(-15)
                self.set_fill_color(248, 250, 252)
                self.rect(0, 282, 210, 15, 'F')
                self.set_y(-12)
                self.set_font('helvetica', 'I', 7)
                self.set_text_color(100, 116, 139) if hasattr(self, 'set_test_color') else self.set_text_color(100)
                self.cell(0, 5, f'Page {self.page_no()}', align='C')

        pdf = ClinicalReportPDF()
        pdf.add_page()
        pdf.set_auto_page_break(auto=True, margin=30)
        
       
        pdf.set_fill_color(241, 245, 249)
        pdf.set_font('helvetica', 'B', 11)
        pdf.cell(0, 8, " 1. PATIENT PROFILE", fill=True, new_x="LMARGIN", new_y="NEXT")
        pdf.ln(3)
        pdf.set_font('helvetica', '', 10)
        pdf.set_text_color(30, 41, 59)
        col_w = pdf.epw / 2
        pdf.cell(col_w, 7, safe_text(f"Name: {db_patient.name}"))
        pdf.cell(col_w, 7, safe_text(f"Patient ID: #{db_patient.id:04d}"), new_x="LMARGIN", new_y="NEXT")
        pdf.cell(col_w, 7, safe_text(f"Age / Gender: {db_patient.age} / {db_patient.gender}"))
        pdf.cell(col_w, 7, safe_text(f"Date: {datetime.datetime.now().strftime('%Y-%m-%d')}"), new_x="LMARGIN", new_y="NEXT")
        pdf.ln(5)

       
        bmi_val = "N/A"
        if db_patient.height and db_patient.weight and db_patient.height > 0:
            bmi_val = f"{(db_patient.weight / ((db_patient.height / 100) ** 2)):.1f}"
        
        pdf.set_font('helvetica', 'B', 11)
        pdf.cell(0, 8, " 2. VITAL SIGNS SUMMARY", fill=True, new_x="LMARGIN", new_y="NEXT")
        pdf.ln(3)
        pdf.set_font('helvetica', '', 10)
        pdf.cell(col_w, 7, safe_text(f"Blood Pressure: {actual_features.get('blood_pressure', 'N/A')} mmHg"))
        pdf.cell(col_w, 7, safe_text(f"Heart Rate: {actual_features.get('heart_rate', '72.0')} bpm"), new_x="LMARGIN", new_y="NEXT")
        pdf.cell(col_w, 7, safe_text(f"Blood Glucose: {actual_features.get('glucose', 'N/A')} mg/dL"))
        pdf.cell(col_w, 7, safe_text(f"BMI: {bmi_val}"), new_x="LMARGIN", new_y="NEXT")
        pdf.ln(4)

        
        risk_level = risk_result.get("risk_level", "Low")
        risk_colors = {"Low": (16, 185, 129), "Medium": (245, 158, 11), "Moderate": (245, 158, 11), "High": (239, 68, 68), "Critical": (127, 29, 29)}
        r_color = risk_colors.get(risk_level, (100, 100, 100))
        
        pdf.set_font('helvetica', 'B', 11)
        pdf.cell(0, 8, " 3. CLINICAL RISK STATUS", fill=True, new_x="LMARGIN", new_y="NEXT")
        pdf.ln(2)
        pdf.set_text_color(*r_color)
        pdf.set_font('helvetica', 'B', 12)
        pdf.cell(0, 8, f"STATUS: {risk_level.upper()}", new_x="LMARGIN", new_y="NEXT")
        pdf.set_text_color(30, 41, 59)
        pdf.ln(2)

       
        disease_name = prediction.get("disease", "Healthy").title()
        if db_validation and db_validation.final_diagnosis:
            disease_name = db_validation.final_diagnosis.title()

        pdf.set_font('helvetica', 'B', 11)
        pdf.cell(0, 8, " 4. Predicted Disease", fill=True, new_x="LMARGIN", new_y="NEXT")
        pdf.ln(2)
        pdf.set_font('helvetica', 'B', 12)
        pdf.cell(0, 8, safe_text(f"Condition: {disease_name}"), new_x="LMARGIN", new_y="NEXT")
        pdf.ln(2)

       
        pdf.set_font('helvetica', 'B', 11)
        pdf.cell(0, 8, " 5. CLINICAL INTERPRETATION", fill=True, new_x="LMARGIN", new_y="NEXT")
        pdf.ln(2)
        pdf.set_font('helvetica', '', 10)
        
        symptoms = db.query(models.Symptom).filter(models.Symptom.patient_id == patient_id).all()
        interpretation = prediction.get("explanation", {}).get("summary", "")
        if not interpretation:
            interpretation = f"The patient profile and markers suggest {disease_name}. "
            if not symptoms:
                interpretation += "Diagnosis is based on laboratory findings only."
            else:
                interpretation += "Correlation noted between lab findings and reported symptoms."
        
        pdf.multi_cell(0, 6, safe_text(interpretation))
        pdf.ln(4)

       
        pdf.set_font('helvetica', 'B', 11)
        pdf.cell(0, 8, " 6. SYMPTOM ANALYSIS", fill=True, new_x="LMARGIN", new_y="NEXT")
        pdf.ln(2)
        pdf.set_font('helvetica', '', 10)
        
        has_symptoms = False
        if symptoms:
            has_symptoms = True
            for sym in symptoms:
                sym_text = sym.raw_text if sym.raw_text else "General Symptoms"
                pdf.cell(0, 6, safe_text(f"- {sym_text} (Severity: {sym.severity}/10, Duration: {sym.duration})"), new_x="LMARGIN", new_y="NEXT")
        
        
        if db_patient.other_medical_history:
            has_symptoms = True
            pdf.set_font('helvetica', 'I', 10)
            pdf.cell(0, 6, safe_text(f"- Reported History: {db_patient.other_medical_history}"), new_x="LMARGIN", new_y="NEXT")

        if not has_symptoms:
            pdf.set_font('helvetica', 'I', 10)
            pdf.cell(0, 6, "No symptoms or medical history reported.", new_x="LMARGIN", new_y="NEXT")
        pdf.ln(4)

       
        pdf.set_font('helvetica', 'B', 11)
        pdf.cell(0, 8, " 7. LABORATORY RESULTS TABLE", fill=True, new_x="LMARGIN", new_y="NEXT")
        pdf.ln(2)
        labs = db.query(models.LabResult).filter(models.LabResult.patient_id == patient_id).all()
        if labs:
            pdf.set_font('helvetica', 'B', 9)
            pdf.cell(pdf.epw*0.35, 8, " TEST NAME", border=1, fill=True)
            pdf.cell(pdf.epw*0.2, 8, " RESULT", border=1, fill=True)
            pdf.cell(pdf.epw*0.3, 8, " NORMAL RANGE", border=1, fill=True)
            pdf.cell(pdf.epw*0.15, 8, " STATUS", border=1, fill=True, new_x="LMARGIN", new_y="NEXT")
            
            pdf.set_font('helvetica', '', 9)
            for lab in labs:
                
                if lab.test_name == "Clinical Finding":
                    continue
                
                
                val_str = str(lab.value)
                
                
                try:
                    num_val = float(val_str)
                    if num_val >= 1000000:
                        continue 
                except:
                    pass

                if lab.test_name.lower() == 'bmi':
                    try:
                        if float(val_str) > 50: 
                            val_str = bmi_val 
                    except: pass

                status = get_lab_status(val_str, lab.reference_range, lab.is_abnormal)
                if status != "Normal":
                    pdf.set_text_color(185, 28, 28)
                    pdf.set_font('helvetica', 'B', 9)
                
                pdf.cell(pdf.epw*0.35, 7, safe_text(f" {lab.test_name}"), border=1)
                pdf.cell(pdf.epw*0.2, 7, safe_text(f" {val_str} {lab.unit}"), border=1)
                pdf.cell(pdf.epw*0.3, 7, safe_text(f" {lab.reference_range}"), border=1)
                pdf.cell(pdf.epw*0.15, 7, safe_text(f" {status}"), border=1, new_x="LMARGIN", new_y="NEXT")
                pdf.set_text_color(30, 41, 59)
                pdf.set_font('helvetica', '', 9)
        else:
            pdf.cell(0, 6, "No laboratory results available.", new_x="LMARGIN", new_y="NEXT")
        pdf.ln(4)

       
        pdf.set_font('helvetica', 'B', 11)
        pdf.cell(0, 8, " 8. KEY ABNORMAL FINDINGS", fill=True, new_x="LMARGIN", new_y="NEXT")
        pdf.ln(2)
        abnormalities = [f"{l.test_name} ({l.value} {l.unit}) is {get_lab_status(l.value, l.reference_range, l.is_abnormal)}" for l in labs if l.is_abnormal]
        if not abnormalities:
            pdf.set_font('helvetica', 'I', 10)
            pdf.cell(0, 6, "No major clinical abnormalities identified from laboratory panel.", new_x="LMARGIN", new_y="NEXT")
        else:
            pdf.set_font('helvetica', '', 10)
            for ab in abnormalities:
                pdf.cell(0, 6, safe_text(f"* {ab}"), new_x="LMARGIN", new_y="NEXT")
        pdf.ln(4)

       
        pdf.set_font('helvetica', 'B', 11)
        pdf.cell(0, 8, " 9. POSSIBLE CAUSES / RISK FACTORS", fill=True, new_x="LMARGIN", new_y="NEXT")
        pdf.ln(2)
        r_factors = []
        if db_patient.smoking: r_factors.append("Active Smoking")
        if db_patient.alcohol_consumption: r_factors.append("Moderate/High Alcohol Consumption")
        if bmi_val != "N/A" and float(bmi_val) >= 25: r_factors.append(f"Elevated BMI ({bmi_val})")
        if db_patient.diabetes: r_factors.append("Existing Diabetic Profile")
        if db_patient.hypertension: r_factors.append("Hypertension History")
        
        pdf.set_font('helvetica', '', 10)
        for rf in (r_factors or ["General lifestyle and environmental factors."]):
            pdf.cell(0, 6, safe_text(f"- {rf}"), new_x="LMARGIN", new_y="NEXT")
        pdf.ln(4)

       
        pdf.set_font('helvetica', 'B', 11)
        pdf.cell(0, 8, " 10. RECOMMENDATIONS", fill=True, new_x="LMARGIN", new_y="NEXT")
        pdf.ln(2)
        pdf.set_font('helvetica', '', 10)
        recos = risk_result.get("recommendations", [])
        if not recos:
            recos = ["Standard Clinical Follow-up", "Balanced Low-Glycemic Nutrition", "Increased Physical Activity"]
        
        for r in recos:
            pdf.multi_cell(0, 6, safe_text(f"> {r}"))
            pdf.ln(1)
        pdf.ln(4)

       
        pdf.set_font('helvetica', 'B', 11)
        pdf.cell(0, 8, " 11. FOLLOW-UP ADVICE", fill=True, new_x="LMARGIN", new_y="NEXT")
        pdf.ln(2)
        pdf.set_font('helvetica', '', 10)
        advice = [
            "Review these results with your Primary Care Physician.",
            "Re-test abnormal laboratory markers in 30-90 days as advised.",
            "Monitor vitals (BP/Glucose) weekly if categorized as Moderate or High risk."
        ]
        for a in advice:
            pdf.cell(0, 6, safe_text(f"* {a}"), new_x="LMARGIN", new_y="NEXT")

        
        pdf.ln(10)
        # Robust Signature Loading
        if db_validation and db_validation.signature_path:
            sig_p = db_validation.signature_path
            # If stored path doesn't exist (e.g. moved from Local to Cloud), try current SIGNATURE_DIR
            if not os.path.exists(sig_p):
                sig_p = os.path.join(SIGNATURE_DIR, os.path.basename(sig_p))
            
            if os.path.exists(sig_p):
                pdf.image(sig_p, x=150, w=30)
        
        pdf.set_x(140)
        pdf.set_font('helvetica', 'B', 9)
        doctor_name = db_validation.doctor_name if db_validation else "MedPred AI Diagnostic Engine"
        pdf.cell(60, 5, safe_text(f"Certified By: {doctor_name}"), align='R', new_x="LMARGIN", new_y="NEXT")
        pdf.set_x(140)
        pdf.set_font('helvetica', 'I', 8)
        pdf.cell(60, 5, f"Date: {datetime.datetime.now().strftime('%Y-%m-%d %H:%M')}", align='R')

        
        file_name = f"health_report_{patient_id}_{uuid.uuid4().hex}.pdf"
        file_path = os.path.join(DIET_UPLOAD_DIR, file_name)
        pdf.output(file_path)
        
        return FileResponse(file_path, media_type='application/pdf', filename=f"{safe_text(db_patient.name)}_Health_Report.pdf")

    except Exception as e:
        print(f"PDF GENERATION ERROR: {str(e)}")
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Failed to generate clinical report: {str(e)}")

