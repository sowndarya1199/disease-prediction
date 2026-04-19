

from xai_module import ExplanationTracker, generate_prediction_explanation
from ml_models import predict_with_ml_ensemble, DISEASE_CLASSES
from disease_symptoms import match_symptoms_to_disease


DISEASE_CATEGORIES = {
    "General": ["Healthy", "Fungal infection", "Drug Reaction", "Acne", "AIDS"],
    "Gastrointestinal": ["GERD", "Chronic cholestasis", "Peptic ulcer diseae", "Gastroenteritis", "Jaundice", "Hepatitis A", "Hepatitis B", "Hepatitis C", "Hepatitis D", "Hepatitis E", "Alcoholic hepatitis"],
    "Respiratory": ["Bronchial Asthma", "Pneumonia", "Common Cold", "Tuberculosis"],
    "Neurological": ["Migraine", "Cervical spondylosis", "Paralysis (brain hemorrhage)", "(vertigo) Paroymsal  Positional Vertigo"],
    "Cardiovascular": ["Hypertension", "Heart attack", "Varicose veins"],
    "Metabolic": ["Diabetes Mellitus", "Hypoglycemia", "Hypothyroidism", "Hyperthyroidism"],
    "Infectious": ["Malaria", "Chicken pox", "Dengue", "Typhoid", "Urinary tract infection"],
    "Musculoskeletal": ["Osteoarthristis", "Arthritis"],
    "Dermatological": ["Psoriasis", "Impetigo"]
}

ALL_DISEASES = DISEASE_CLASSES


def get_risk_level(confidence: float, disease: str) -> str:
    
    high_risk_diseases = [
        "Heart Disease Risk", "Diabetes Mellitus", "Hypertension",
        "Pneumonia Risk", "Atherosclerosis Risk"
    ]
    
    if disease == "Healthy":
        return "Low"
    
    if disease in high_risk_diseases:
        if confidence >= 0.7:
            return "High"
        elif confidence >= 0.4:
            return "Medium"
        else:
            return "Low"
    else:
        if confidence >= 0.8:
            return "High"
        elif confidence >= 0.5:
            return "Medium"
        else:
            return "Low"


def predict_disease(feature_data: dict) -> dict:
    
    ml_result = predict_with_ml_ensemble(feature_data)
    
    predicted_disease = ml_result.get("ml_prediction", "Healthy")
    confidence = ml_result.get("ml_confidence", 0.0)
    top_5 = ml_result.get("top_5_probabilities", {})
    
  
    glucose = feature_data.get("glucose", 0)
    hemoglobin = feature_data.get("hemoglobin", 14.0)
    iron = feature_data.get("iron", 100)
    tsh = feature_data.get("tsh", 2.5)
    bilirubin = feature_data.get("bilirubin", 0.5)
    blood_pressure = feature_data.get("blood_pressure", 120)
    cholesterol = feature_data.get("cholesterol", 180)
    age = feature_data.get("age", 30)
    symptoms = feature_data.get("symptoms", [])
    detected_diagnoses = feature_data.get("detected_diagnoses", [])
    
    patient_id = feature_data.get("patient_id", "Unknown")
    with open("d:\\disease prediction\\backend\\engine_debug.txt", "a", encoding="utf-8") as f:
        f.write(f"ID: {patient_id}, TSH: {tsh}, Glucose: {glucose}, Detected: {detected_diagnoses}\n")
    
    
    if detected_diagnoses:
       
        predicted_disease = detected_diagnoses[0]
        confidence = 0.98
        with open("d:\\disease prediction\\backend\\engine_debug.txt", "a", encoding="utf-8") as f:
            f.write(f"OVERRIDE TRIGGERED: {predicted_disease}\n")
        return {
            "disease": predicted_disease.strip(),
            "probability": confidence,
            "risk": get_risk_level(confidence, predicted_disease),
            "all_probabilities": ml_result.get("top_5_probabilities", {}),
            "prediction_method": "direct_clinical_finding"
        }

   
    if feature_data.get("malaria_positive"):
        predicted_disease = "Malaria"
        confidence = 0.98
        return {
            "disease": predicted_disease,
            "probability": confidence,
            "risk": "High",
            "all_probabilities": {predicted_disease: confidence},
            "prediction_method": "malaria_safety_net"
        }

    crp = feature_data.get("crp", 0.0)
    
    
    is_lab_normal = (
        hemoglobin >= 12.0 and 
        glucose <= 100 and 
        tsh >= 0.4 and tsh <= 4.0 and
        bilirubin <= 1.2 and
        blood_pressure < 130 and
        crp <= 10.0
    )
    
    
    symptom_set = {s.lower().replace("_", " ") for s in symptoms}
    diabetes_symptoms = {"frequent urination", "excessive thirst", "increased hunger", "polyuria", "polydipsia", "polyphagia", "blurred vision"}
    hypertension_symptoms = {"headache", "dizziness", "blurred vision", "palpitations", "nosebleeds"}
    
    has_diabetes_symptoms = len(symptom_set.intersection(diabetes_symptoms)) >= 2
    has_hypertension_symptoms = len(symptom_set.intersection(hypertension_symptoms)) >= 2

    if not symptoms and is_lab_normal:
        predicted_disease = "Healthy"
        confidence = 0.99
    
    
    # HEART DISEASE TRIAGE (ULTIMATE PRIORITY)
    troponin = feature_data.get("troponin", 0.0)
    hscrp = feature_data.get("hscrp", 0.0)
    lp_a = feature_data.get("lipoprotein_a", 0.0)
    ldl_small = feature_data.get("ldl_small", 0.0)
    
    is_heart_risk = (
        troponin > 0.04 or 
        hscrp > 3.0 or 
        lp_a > 30 or 
        ldl_small > 162 or
        "heart disease" in str(detected_diagnoses).lower() or 
        "ischemia" in str(detected_diagnoses).lower() or
        "cardiovascular" in str(detected_diagnoses).lower()
    )

    if is_heart_risk:
        predicted_disease = "Heart Disease Risk"
        # Calibrate confidence based on severity
        if troponin > 0.1 or (hscrp > 4.0 and ldl_small > 200):
            confidence = 0.98
        else:
            confidence = 0.95
            
        return {
            "disease": predicted_disease,
            "probability": confidence,
            "risk": "High",
            "all_probabilities": {predicted_disease: confidence},
            "prediction_method": "cardiovascular_risk_assessment"
        }

    # HYPERTENSION TRIAGE (PRIORITY 1)
    # If Blood Pressure is Stage 2 (>= 140), it MUST be the primary diagnosis 
    # even if pre-diabetic glucose is present.
    if blood_pressure >= 140 or (blood_pressure >= 130 and has_hypertension_symptoms) or "hypertension" in str(detected_diagnoses).lower():
        predicted_disease = "Hypertension"
        if "stage 2" in str(detected_diagnoses).lower() or blood_pressure >= 150:
             confidence = 0.98  # Stage 2 explicit or very high numbers
        elif blood_pressure >= 140:
             confidence = 0.96 
        else:
             confidence = max(confidence, 0.92)
             
    # HYPOGLYCEMIA TRIAGE (PRIORITY 1.5)
    elif 0 < glucose < 70:
        predicted_disease = "Hypoglycemia"
        confidence = 0.95
        
    # DIABETES TRIAGE (PRIORITY 2)
    elif glucose > 126 or (glucose > 100 and has_diabetes_symptoms):
        predicted_disease = "Diabetes Mellitus"
        confidence = max(confidence, 0.95 if glucose > 126 else 0.85)
    elif glucose > 100 and (predicted_disease == "Healthy" or predicted_disease == "Diabetes Mellitus"):
        predicted_disease = "Diabetes Mellitus"
        confidence = max(confidence, 0.65)

    
    mch = feature_data.get("mch", 30.0)
    mchc = feature_data.get("mchc", 34.0)
    
    if hemoglobin < 10.0:
        predicted_disease = "Severe Anemia"
        confidence = max(confidence, 0.98)
    elif hemoglobin <= 12.0 and (mch < 26.0 or mchc < 31.0):
        predicted_disease = "Iron Deficiency Anemia"
        confidence = max(confidence, 0.95)
    elif hemoglobin <= 12.5:
        predicted_disease = "Anemia"
        confidence = max(confidence, 0.92)
    elif iron < 50 and hemoglobin >= 13.0:
        predicted_disease = "Iron Deficiency Disorder"
        confidence = max(confidence, 0.75)

    
    elif bilirubin > 2.0:
        predicted_disease = "Jaundice"
        confidence = max(confidence, 0.90)

    
    ft3 = feature_data.get("ft3", 3.0)
    ft4 = feature_data.get("ft4", 1.2)
    
    
    if tsh > 4.5:
        if tsh > 10.0:
            predicted_disease = "Hypothyroidism"
            confidence = 0.98
        else:
            predicted_disease = "Subclinical Hypothyroidism"
            confidence = 0.88
            
    
    elif tsh < 0.4:
        if ft3 > 4.2 or ft4 > 1.8:
            predicted_disease = "Hyperthyroidism"
            confidence = 0.98
        else:
            predicted_disease = "Subclinical Hyperthyroidism"
            confidence = 0.88

   
    b12 = feature_data.get("b12", 400)
    vitamin_d = feature_data.get("vitamin_d", 80)
    
    if b12 < 180:
        predicted_disease = "Vitamin B12 Deficiency"
        confidence = max(confidence, 0.96)
    
    if vitamin_d < 50:
        
        if predicted_disease == "Healthy" or confidence < 0.90:
             predicted_disease = "Vitamin D Deficiency"
             confidence = max(confidence, 0.95)
        elif predicted_disease == "Vitamin B12 Deficiency":
             predicted_disease = "Multiple Vitamin Deficiencies (B12 & D)"
             confidence = 0.98

   
    lipid_triglycerides = feature_data.get("triglycerides", 150)
    lipid_cholesterol = feature_data.get("cholesterol", 180)
    
    if lipid_triglycerides > 200 or lipid_cholesterol > 240:
        if (predicted_disease == "Healthy" or confidence < 0.90) and predicted_disease not in ["Diabetes Mellitus", "Hypertension"]:
            predicted_disease = "Hyperlipidemia"
            confidence = max(confidence, 0.94)

    
    creatinine = feature_data.get("creatinine", 0.9)
    egfr = feature_data.get("egfr", 90)
    if creatinine > 1.4 or egfr < 60:
        if predicted_disease == "Healthy" or confidence < 0.85:
            predicted_disease = "Chronic Kidney Disease Risk"
            confidence = max(confidence, 0.90)

   
    alt = feature_data.get("alt", 25)
    ast = feature_data.get("ast", 25)
    if (alt > 100 or ast > 100) or (bilirubin > 1.5 and (alt > 50 or ast > 50)):
        if predicted_disease == "Healthy" or confidence < 0.85:
            predicted_disease = "Hepatitis / Liver Dysfunction"
            confidence = max(confidence, 0.94)

    
    crp = (feature_data.get("crp") or 0.0)
    if crp >= 10.0:
        if predicted_disease == "Healthy" or confidence < 0.80:
            predicted_disease = "Acute Inflammatory State"
            confidence = max(confidence, 0.85)
        if crp >= 100:
            predicted_disease = "Severe Infection / Sepsis Risk"
            confidence = 0.98

    
    wbc = feature_data.get("wbc", 7.0)
    platelets = feature_data.get("platelets", 250.0)
    
    if wbc < 4.0 and platelets <= 155.0:
        if predicted_disease == "Healthy" or confidence < 0.95:
            predicted_disease = "Malaria"
            confidence = max(confidence, 0.96)

    
    if "urinary tract infection" in [d.lower() for d in detected_diagnoses]:
        predicted_disease = "Urinary tract infection"
        confidence = 0.98

   
    symptom_matches = match_symptoms_to_disease(symptoms)
    if symptom_matches:
        
        top_matches = list(symptom_matches.items())[:3]
        for disease_name, match_info in top_matches:
            match_pct = match_info.get("match_percentage", 0)
            
            
            if match_pct >= 85 and predicted_disease == "Healthy":
                predicted_disease = disease_name
                confidence = max(0.90, confidence)
                break
            
           
            if match_pct >= 75 and disease_name in top_5:
                
                if confidence < 0.75 or predicted_disease != disease_name:
                    predicted_disease = disease_name
                    confidence = max(0.92, confidence)
                    break
            
           
            if match_pct >= 60 and disease_name in ["Heart Disease Risk", "Pneumonia Risk", "Sepsis"]:
                if confidence < 0.85:
                    predicted_disease = disease_name
                    confidence = max(0.85, confidence)
                    break

   
    specialized = ml_result.get("specialized_predictions", {})
    for name, pred in specialized.items():
        if pred in ["Positive", "High Risk"]:
            model_display_name = name.replace("medpred_", "").replace("_model", "").title()
            
            is_clinical_emergency = (
                predicted_disease in ["Severe Infection/Inflammation", "Anemia", "Iron Deficiency Anemia", "Hypoglycemia", "Heart attack"] and 
                confidence >= 0.85
            )

            if not is_clinical_emergency:
                
                if predicted_disease == "Healthy":
                    has_supporting_labs = False
                    if "heart" in name.lower() and (blood_pressure >= 140 or cholesterol > 240 or age > 60):
                        has_supporting_labs = True
                    elif "diabetes" in name.lower() and (glucose > 110):
                        has_supporting_labs = True
                    
                    
                    if has_supporting_labs or symptoms:
                        predicted_disease = model_display_name
                        confidence = 0.90
                        ml_result["specialized_source"] = model_display_name
                
                elif confidence < 0.8 or predicted_disease == "Dimorphic hemmorhoids(piles)":
                    predicted_disease = model_display_name
                    confidence = 0.95
                    ml_result["specialized_source"] = model_display_name
    
    risk_level = get_risk_level(confidence, predicted_disease)
    
    return {
        "disease": predicted_disease.strip(),
        "probability": round(confidence, 4), 
        "risk": risk_level,
        "all_probabilities": top_5,
        "logistic_regression_prediction": ml_result.get("logistic_regression_prediction"),
        "random_forest_prediction": ml_result.get("random_forest_prediction"),
        "model_contributions": ml_result.get("model_contributions", {
            "logistic_regression": 0.4,
            "random_forest": 0.6
        }),
        "prediction_method": "clinical_analysis"
    }


def predict_with_explanation(feature_data: dict, target_disease: str = None) -> dict:
    
    prediction = predict_disease(feature_data)
    
    # Use target_disease if provided (doctor override), otherwise use AI prediction
    effective_disease = target_disease if target_disease else prediction["disease"]
    
    # If we are explaining an override, we should indicate it
    if target_disease and target_disease != prediction["disease"]:
        prediction["original_ai_disease"] = prediction["disease"]
        prediction["disease"] = target_disease
        prediction["prediction_method"] = "Clinically Modified by Physician"
        prediction["probability"] = 1.0  # Certified
    
    tracker = ExplanationTracker()
    
    age = feature_data.get("age", 30)
    bmi = feature_data.get("bmi", 22)
    hemoglobin = feature_data.get("hemoglobin", 14.0)
    glucose = feature_data.get("glucose", 90)
    cholesterol = feature_data.get("cholesterol", 180)
    blood_pressure = feature_data.get("blood_pressure", 120)
    iron = feature_data.get("iron", 100)
    b12 = feature_data.get("b12", 400)
    tsh = feature_data.get("tsh", 2.5)
    triglycerides = feature_data.get("triglycerides", 150)
    ldl = feature_data.get("ldl", 100)
    
    diabetes_history = feature_data.get("diabetes", False)
    hypertension_history = feature_data.get("hypertension", False)
    smoking = feature_data.get("smoking", False)
    alcohol = feature_data.get("alcohol_consumption", False)
    
    # Define disease-factor associations to make explanation smarter
    # Only show factors that are clinically relevant to the effective_disease
    # OR are significant abnormalities that MUST be shown regardless
    
    def add_if_relevant(factor_name, points, reason, disease_list=None):
        # Always add if points are very high (severe abnormality)
        # Or if the disease is in the relevance list
        if points >= 40 or not disease_list or any(d.lower() in effective_disease.lower() for d in disease_list):
            tracker.add_contribution(effective_disease, factor_name, points, reason)

    # HEMOGLOBIN / ANEMIA
    if hemoglobin < 12.0:
        add_if_relevant("Low Hemoglobin", 40, f"Anemia marker indicating reduced oxygen-carrying capacity, a primary driver for fatigue-related pathology.", 
                        ["Anemia", "Malaria", "Thalassema", "Iron Deficiency"])
    
    # GLUCOSE / DIABETES
    if glucose > 126:
        add_if_relevant("High Glucose", 45, f"Hyperglycemia (high blood sugar) causes chronic metabolic stress, directly indicating Diabetic progression.",
                        ["Diabetes", "Metabolic", "Healthy"]) # Healthy is here so a doctor can see why they might be wrong if they pick healthy
    elif glucose > 100:
        add_if_relevant("Elevated Glucose", 30, f"Prediabetic range glucose ({glucose} mg/dL) acts as a foundational metabolic risk factor.",
                        ["Diabetes", "Prediabetes", "Metabolic"])
    
    # CHOLESTEROL / HEART
    if cholesterol > 240:
        add_if_relevant("High Cholesterol", 35, f"increased cardiovascular strain from high total cholesterol ({cholesterol} mg/dL)",
                        ["Heart", "Cardio", "Hypertension", "Hyperlipidemia"])
    
    # BLOOD PRESSURE / HYPERTENSION
    if blood_pressure >= 140:
        add_if_relevant("High Blood Pressure", 40, f"Hypertension (systolic > 140) causes vascular tension, a critical risk factor for cardiovascular complications.",
                        ["Hypertension", "Heart", "Cardio"])
    
    # IRON / ANEMIA
    if iron < 60:
        add_if_relevant("Low Iron", 40, f"depleted iron stores ({iron} mcg/dL) affecting red blood cell production",
                        ["Anemia", "Iron", "Fatigue"])
    
    # B12 / DEFICIENCY
    if b12 < 200:
        add_if_relevant("Low B12", 40, f"vitamin B12 deficiency ({b12} pg/mL) impacting nerve function and blood health",
                        ["B12", "Deficiency", "Neurological"])
    
    # TSH / THYROID
    if tsh > 4.0:
        add_if_relevant("High TSH", 40, f"overactive pituitary stimulation ({tsh} mIU/L) suggesting underactive thyroid",
                        ["Hypothyroidism", "Thyroid"])
    elif tsh < 0.4:
        add_if_relevant("Low TSH", 40, f"suppressed pituitary response ({tsh} mIU/L) suggesting thyroid overactivity",
                        ["Hyperthyroidism", "Thyroid"])
    
    # LIPIDS / CARDIO IQ
    if ldl > 160:
        add_if_relevant("High LDL", 35, f"elevated 'bad' cholesterol ({ldl} mg/dL) posing arterial risks",
                        ["Heart", "Cardio", "Hyperlipidemia"])
    
    ldl_small = feature_data.get("ldl_small", 0)
    if ldl_small > 162:
        add_if_relevant("Small Dense LDL", 45, f"Highly atherogenic small LDL particles ({ldl_small} nmol/L) that easily penetrate arterial walls.",
                        ["Heart", "Cardio", "Atherosclerosis"])

    lp_a = feature_data.get("lipoprotein_a", 0)
    if lp_a > 30:
        add_if_relevant("Lipoprotein(a)", 40, f"Elevated Lp(a) level ({lp_a}) which is an independent genetic risk factor for cardiovascular disease.",
                        ["Heart", "Cardio"])

    hscrp = feature_data.get("hscrp", 0.0)
    if hscrp > 3.0:
        add_if_relevant("High HS-CRP", 45, f"High-sensitivity C-reactive protein ({hscrp} mg/L) indicates chronic vascular inflammation and high cardiac risk.",
                        ["Heart", "Cardio"])

    if triglycerides > 200:
        add_if_relevant("High Triglycerides", 30, f"elevated blood fats ({triglycerides} mg/dL) linked to metabolic risk",
                        ["Metabolic", "Heart", "Diabetes", "Hyperlipidemia"])
    
    # LIVER
    alt = feature_data.get("alt", 25)
    ast = feature_data.get("ast", 25)
    if alt > 100 or ast > 100:
        add_if_relevant("High Liver Enzymes", 45, f"elevated ALT ({alt}) or AST ({ast}) suggesting hepatic stress or inflammation",
                        ["Hepatitis", "Liver", "Jaundice"])
    elif alt > 40:
        add_if_relevant("Elevated ALT", 20, f"mildly elevated liver enzymes ({alt} U/L)",
                        ["Hepatitis", "Liver", "Jaundice"])

    # KIDNEY
    creatinine = feature_data.get("creatinine", 0.9)
    egfr = feature_data.get("egfr", 90)
    if creatinine > 1.4:
        add_if_relevant("High Creatinine", 40, f"reduced kidney filtration capacity indicated by creatinine of {creatinine} mg/dL",
                        ["Kidney", "Renal", "CKD"])
    if egfr < 60:
        add_if_relevant("Low eGFR", 45, f"decreased renal function (Stage 3 CKD or lower) with eGFR of {egfr} mL/min",
                        ["Kidney", "Renal", "CKD"])

    # INFLAMMATION / CRP
    crp = feature_data.get("crp", 0.0)
    if crp >= 10.0:
        importance = 45 if crp >= 100 else 25
        level = "Severely High" if crp >= 100 else "Elevated"
        add_if_relevant(f"{level} CRP", importance, f"C-Reactive Protein is an inflammation marker; high levels ({crp} mg/L) signify an acute systemic immune response.",
                        ["Infection", "Inflammation", "Sepsis", "Arthritis", "Fever"])

    # BLOOD CELLS
    wbc = feature_data.get("wbc", 7.0)
    platelets = feature_data.get("platelets", 250.0)
    
    if wbc < 4.0:
        add_if_relevant("Leucopenia (Low WBC)", 40, f"Low white blood cell count ({wbc}) suggests viral infection or bone marrow suppression.",
                        ["Malaria", "Dengue", "Infection", "Aids"])
    elif wbc > 11.0:
        add_if_relevant("High WBC", 35, f"Elevated white blood cell count ({wbc}) indicates active infection or inflammation.",
                        ["Infection", "Pneumonia", "Sepsis", "Appendicitis"])
        
    if platelets < 150.0:
        add_if_relevant("Thrombocytopenia (Low Platelets)", 45, f"Low platelet count ({platelets}) greatly increases bleeding risk.",
                        ["Malaria", "Dengue", "Hepatitis", "Alcoholic"])
    elif platelets <= 155.0:
        add_if_relevant("Borderline Low Platelets", 30, f"Platelet count ({platelets}) is near the lower threshold, indicating potential viral or parasitic infection.",
                        ["Malaria", "Dengue", "Infection"])

    # HISTORY & LIFESTYLE
    if bmi >= 30:
        add_if_relevant("Obesity", 35, f"metabolic load associated with a high BMI ({bmi})", ["Metabolic", "Diabetes", "Heart", "Hypertension"])
    elif bmi >= 25:
        add_if_relevant("Overweight", 20, f"mild metabolic elevation from BMI of {bmi}", ["Metabolic", "Diabetes", "Heart"])
    
    if diabetes_history:
        add_if_relevant("Diabetes History", 35, "established history of metabolic disorder", ["Diabetes", "Kidney", "Heart"])
    
    if hypertension_history:
        add_if_relevant("Hypertension History", 30, "existing chronic hypertensive condition", ["Hypertension", "Heart", "Stroke"])
    
    if smoking:
        add_if_relevant("Smoking", 25, "oxidative stress and vascular damage from persistent smoking", ["Heart", "Cardio", "Lungs", "Pneumonia", "Bronchial"])
    
    if alcohol:
        add_if_relevant("Alcohol Use", 15, "potential hepatic and metabolic impact of alcohol consumption", ["Liver", "Hepatitis", "Gastro", "GERD"])
    
    if age > 55:
        add_if_relevant("Age Factor", 20, f"physiological changes associated with age ({age})", None)
    
    # SPECIALIZED MODELS
    specialized_source = prediction.get("specialized_source")
    if specialized_source:
        tracker.add_contribution(effective_disease, f"{specialized_source} Model", 50, f"Detected by specialized {specialized_source} screening model")

    # If effective_disease is Healthy, we might want to explain WHY (mostly absence of high-point factors)
    if effective_disease.lower() == "healthy" and not tracker.contributions.get(effective_disease):
         tracker.add_contribution(effective_disease, "Optimal Labs", 10, "All major clinical markers (Glucose, BP, Hemoglobin) are within standard physiological ranges.")

    explanation = generate_prediction_explanation(effective_disease, feature_data, tracker)
    prediction["explanation"] = explanation
    prediction["prediction_method"] = prediction.get("prediction_method", "clinical_analysis")
    
    return prediction


def load_model():
   
    return None
