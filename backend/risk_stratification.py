

from typing import Dict, List, Tuple
from enum import Enum
import math


class RiskLevel(Enum):
    
    CRITICAL = "Critical"
    HIGH = "High"
    MODERATE = "Moderate"
    LOW = "Low"



EMERGENCY_CONDITIONS = {
    "cardiac": {
        "symptoms": ["chest pain", "chest discomfort", "heart attack", "cardiac arrest", "severe chest tightness"],
        "alert": "CARDIAC EMERGENCY - Immediate cardiac evaluation required",
        "action": "Activate cardiac emergency protocol. Consider ECG and troponin levels.",
        "response_time_minutes": 10,
        "clinical_reference": "Chest pain is a key indicator of acute coronary syndrome (ACS). Time to treatment directly affects mortality.",
        "diagnostics": ["ECG (12-lead)", "Troponin I/T", "Complete Blood Count", "Blood Pressure Monitoring", "Chest X-ray"],
        "escalation_warning": "Risk may escalate to cardiac arrest within 30-60 minutes if untreated"
    },
    "respiratory": {
        "symptoms": ["difficulty breathing", "severe breathlessness", "respiratory distress", "choking", "airway obstruction"],
        "alert": "RESPIRATORY EMERGENCY - Airway assessment needed",
        "action": "Check oxygen saturation. Prepare for possible intubation.",
        "response_time_minutes": 5,
        "clinical_reference": "Acute respiratory distress can lead to hypoxia and organ failure. SpO2 below 90% is critical.",
        "diagnostics": ["Pulse Oximetry", "Arterial Blood Gas", "Chest X-ray", "Peak Flow Measurement"],
        "escalation_warning": "Hypoxic brain injury possible within 4-6 minutes without intervention"
    },
    "neurological": {
        "symptoms": ["stroke", "sudden paralysis", "severe headache", "loss of consciousness", "unconscious", "seizure", "convulsion"],
        "alert": "NEUROLOGICAL EMERGENCY - Stroke protocol consideration",
        "action": "Assess FAST criteria. Consider CT scan. Time-sensitive intervention.",
        "response_time_minutes": 15,
        "clinical_reference": "Stroke patients lose 1.9 million neurons per minute. 'Time is brain' - door-to-needle time critical.",
        "diagnostics": ["CT Head (non-contrast)", "Blood Glucose", "Coagulation Panel", "FAST Assessment", "NIH Stroke Scale"],
        "escalation_warning": "Permanent neurological damage increases significantly after 4.5 hours"
    },
    "hemorrhagic": {
        "symptoms": ["severe bleeding", "hemorrhage", "blood loss", "vomiting blood", "blood in stool"],
        "alert": "HEMORRHAGIC EMERGENCY - Bleeding control required",
        "action": "Apply pressure. Check blood type. Prepare transfusion.",
        "response_time_minutes": 10,
        "clinical_reference": "Class III/IV hemorrhage (>30% blood loss) causes tachycardia, hypotension, and altered consciousness.",
        "diagnostics": ["Complete Blood Count", "Type and Crossmatch", "Coagulation Panel", "Hemoglobin Level"],
        "escalation_warning": "Hemorrhagic shock possible with continued blood loss; mortality increases rapidly"
    },
    "anaphylactic": {
        "symptoms": ["severe allergic reaction", "anaphylaxis", "throat swelling", "difficulty swallowing"],
        "alert": "ANAPHYLACTIC EMERGENCY - Epinephrine may be required",
        "action": "Prepare epinephrine. Monitor airway. IV access.",
        "response_time_minutes": 3,
        "clinical_reference": "Anaphylaxis progresses rapidly. Epinephrine is first-line treatment; delay increases fatality risk.",
        "diagnostics": ["Vital Signs Monitoring", "Airway Assessment", "IV Access", "Tryptase Level (if available)"],
        "escalation_warning": "Complete airway obstruction and cardiovascular collapse within minutes"
    },
    "sepsis": {
        "symptoms": ["sepsis", "severe infection", "septic shock"],
        "alert": "SEPSIS ALERT - Rapid intervention needed",
        "action": "Blood cultures. Broad-spectrum antibiotics. Fluid resuscitation.",
        "response_time_minutes": 60,
        "clinical_reference": "Sepsis mortality increases 7.6% per hour antibiotic delay. Follow Surviving Sepsis Campaign guidelines.",
        "diagnostics": ["Blood Cultures (x2)", "Lactate Level", "Procalcitonin", "Complete Blood Count", "Urinalysis"],
        "escalation_warning": "Septic shock and multi-organ failure can develop within hours"
    }
}


CRITICAL_LAB_THRESHOLDS = {
    "glucose": {
        "critical_low": 40, "critical_high": 400, "unit": "mg/dL",
        "reference": "Hypoglycemia <40 causes neuroglycopenia; >400 indicates diabetic emergency"
    },
    "hemoglobin": {
        "critical_low": 7.0, "critical_high": 20.0, "unit": "g/dL",
        "reference": "Hb <7 typically requires transfusion; >20 suggests polycythemia"
    },
    "blood_pressure": {
        "critical_low": 60, "critical_high": 180, "unit": "mmHg",
        "reference": "SBP <60 indicates shock; >180 is hypertensive urgency"
    },
    "cholesterol": {
        "critical_high": 300, "unit": "mg/dL",
        "reference": "Total cholesterol >300 significantly increases cardiovascular risk"
    },
}


RISK_WEIGHTS = {
    "emergency_symptom": {"points": 50, "description": "Emergency symptom detected"},
    "critical_lab": {"points": 40, "description": "Critical lab value"},
    "high_risk_disease": {"points": 30, "description": "High-risk condition predicted"},
    "multiple_comorbidities": {"points": 20, "description": "Multiple comorbidities present"},
    "age_factor": {"points": 15, "description": "Age-related risk factor"},
    "lifestyle_factors": {"points": 10, "description": "Lifestyle risk factors"}
}


TRIAGE_STANDARDS = {
    "Critical": {"ai_triage": "P1", "clinical_standard": "P1 (Resuscitation)", "description": "Immediate life-threatening"},
    "High": {"ai_triage": "P2", "clinical_standard": "P1-P2 (Emergency)", "description": "Potentially life-threatening"},
    "Moderate": {"ai_triage": "P3", "clinical_standard": "P3 (Urgent)", "description": "Needs attention within hours"},
    "Low": {"ai_triage": "P4", "clinical_standard": "P4-P5 (Non-urgent)", "description": "Can wait safely"}
}


def classify_risk_level(risk_score: int) -> RiskLevel:
   
    if risk_score >= 80:
        return RiskLevel.CRITICAL
    elif risk_score >= 50:
        return RiskLevel.HIGH
    elif risk_score >= 25:
        return RiskLevel.MODERATE
    else:
        return RiskLevel.LOW


def calculate_emergency_confidence(emergencies: List[Dict], critical_labs: List[Dict], risk_score: int) -> Dict:
    
    base_confidence = 0
    
    
    if emergencies:
        base_confidence += 40 + (len(emergencies) * 15)
    
    
    if critical_labs:
        base_confidence += 20 + (len(critical_labs) * 10)
    
    
    if risk_score >= 80:
        base_confidence += 25
    elif risk_score >= 50:
        base_confidence += 15
    elif risk_score >= 25:
        base_confidence += 5
    
    
    confidence = min(99, max(0, base_confidence))
    
   
    if confidence >= 85:
        level = "Very High"
    elif confidence >= 70:
        level = "High"
    elif confidence >= 50:
        level = "Moderate"
    else:
        level = "Low"
    
    return {
        "percentage": confidence,
        "level": level,
        "explanation": f"Based on {len(emergencies)} emergency indicators and {len(critical_labs)} critical lab values"
    }


def detect_emergency_conditions(symptoms: List[str]) -> List[Dict]:
   
    detected_emergencies = []
    symptom_text = " ".join([s.lower() for s in symptoms])
    
    for condition_type, condition_data in EMERGENCY_CONDITIONS.items():
        for emergency_symptom in condition_data["symptoms"]:
            if emergency_symptom in symptom_text:
                detected_emergencies.append({
                    "type": condition_type,
                    "trigger": emergency_symptom,
                    "alert": condition_data["alert"],
                    "action": condition_data["action"],
                    "severity": "CRITICAL",
                    "response_time_minutes": condition_data["response_time_minutes"],
                    "clinical_reference": condition_data["clinical_reference"],
                    "diagnostics": condition_data["diagnostics"],
                    "escalation_warning": condition_data["escalation_warning"]
                })
                break
    
    return detected_emergencies


def detect_critical_lab_values(lab_values: Dict[str, float]) -> List[Dict]:
    
    critical_labs = []
    
    for lab_name, value in lab_values.items():
        lab_key = lab_name.lower().replace(" ", "_")
        
        if lab_key in CRITICAL_LAB_THRESHOLDS:
            threshold = CRITICAL_LAB_THRESHOLDS[lab_key]
            
            if "critical_low" in threshold and value < threshold["critical_low"]:
                critical_labs.append({
                    "test": lab_name,
                    "value": value,
                    "threshold": threshold["critical_low"],
                    "status": "CRITICALLY LOW",
                    "unit": threshold.get("unit", ""),
                    "alert": f"CRITICAL: {lab_name} is dangerously low at {value} {threshold.get('unit', '')}",
                    "clinical_reference": threshold.get("reference", "")
                })
            elif "critical_high" in threshold and value > threshold["critical_high"]:
                critical_labs.append({
                    "test": lab_name,
                    "value": value,
                    "threshold": threshold["critical_high"],
                    "status": "CRITICALLY HIGH",
                    "unit": threshold.get("unit", ""),
                    "alert": f"CRITICAL: {lab_name} is dangerously high at {value} {threshold.get('unit', '')}",
                    "clinical_reference": threshold.get("reference", "")
                })
    
    return critical_labs


def calculate_risk_score_with_trace(
    symptoms: List[str],
    lab_values: Dict[str, float],
    predicted_disease: str,
    disease_probability: float,
    age: int,
    comorbidities: List[str],
    lifestyle_factors: Dict[str, bool]
) -> Tuple[int, List[Dict]]:
    
    risk_score = 0
    score_breakdown = []
    
    
    emergencies = detect_emergency_conditions(symptoms)
    if emergencies:
        points = RISK_WEIGHTS["emergency_symptom"]["points"] * len(emergencies)
        risk_score += points
        for e in emergencies:
            score_breakdown.append({
                "factor": f"{e['trigger'].title()} present",
                "points": RISK_WEIGHTS["emergency_symptom"]["points"],
                "category": "Emergency Symptom",
                "icon": "🚨"
            })
    
   
    critical_labs = detect_critical_lab_values(lab_values)
    if critical_labs:
        points = RISK_WEIGHTS["critical_lab"]["points"] * len(critical_labs)
        risk_score += points
        for lab in critical_labs:
            score_breakdown.append({
                "factor": f"{lab['test']} {lab['status'].lower()}",
                "points": RISK_WEIGHTS["critical_lab"]["points"],
                "category": "Critical Lab",
                "icon": "🧪"
            })
    
   
    high_risk_diseases = ["Heart Disease Risk", "Stroke", "Pneumonia Risk", "Sepsis"]
    if predicted_disease in high_risk_diseases and disease_probability > 0.3:
        points = RISK_WEIGHTS["high_risk_disease"]["points"]
        risk_score += points
        score_breakdown.append({
            "factor": f"{predicted_disease} predicted ({int(disease_probability*100)}%)",
            "points": points,
            "category": "Disease Prediction",
            "icon": "⚕️"
        })
    
    
    if len(comorbidities) >= 2:
        points = RISK_WEIGHTS["multiple_comorbidities"]["points"]
        risk_score += points
        score_breakdown.append({
            "factor": f"{len(comorbidities)} comorbidities present",
            "points": points,
            "category": "Medical History",
            "icon": "📋"
        })
    
    
    if age >= 65:
        points = RISK_WEIGHTS["age_factor"]["points"]
        risk_score += points
        score_breakdown.append({
            "factor": f"Advanced age ({age} years)",
            "points": points,
            "category": "Demographics",
            "icon": "👤"
        })
    elif age >= 55:
        points = RISK_WEIGHTS["age_factor"]["points"] // 2
        risk_score += points
        score_breakdown.append({
            "factor": f"Age risk factor ({age} years)",
            "points": points,
            "category": "Demographics",
            "icon": "👤"
        })
    
    
    active_lifestyle_risks = []
    if lifestyle_factors.get("smoking"):
        active_lifestyle_risks.append("Smoking")
    if lifestyle_factors.get("alcohol"):
        active_lifestyle_risks.append("Alcohol consumption")
    if lifestyle_factors.get("obesity"):
        active_lifestyle_risks.append("Obesity")
    
    if len(active_lifestyle_risks) >= 2:
        points = RISK_WEIGHTS["lifestyle_factors"]["points"]
        risk_score += points
        score_breakdown.append({
            "factor": f"Lifestyle: {', '.join(active_lifestyle_risks)}",
            "points": points,
            "category": "Lifestyle",
            "icon": "🏃"
        })
    elif len(active_lifestyle_risks) == 1:
        points = RISK_WEIGHTS["lifestyle_factors"]["points"] // 2
        risk_score += points
        score_breakdown.append({
            "factor": f"Lifestyle: {active_lifestyle_risks[0]}",
            "points": points,
            "category": "Lifestyle",
            "icon": "🏃"
        })
    
    return risk_score, score_breakdown


def generate_triage_comparison(risk_level: RiskLevel) -> Dict:
    
    level = risk_level.value
    standard = TRIAGE_STANDARDS.get(level, TRIAGE_STANDARDS["Moderate"])
    
    return {
        "ai_triage": standard["ai_triage"],
        "clinical_standard": standard["clinical_standard"],
        "description": standard["description"],
        "alignment": "Aligned" if level in ["Critical", "Low"] else "Borderline",
        "note": f"AI classification aligns with hospital triage protocols for {level.lower()}-risk patients"
    }


def generate_alert_message(
    risk_level: RiskLevel,
    emergencies: List[Dict],
    critical_labs: List[Dict],
    risk_score: int
) -> Dict:
   
    alert = {
        "risk_level": risk_level.value,
        "requires_immediate_attention": risk_level in [RiskLevel.CRITICAL, RiskLevel.HIGH],
        "message": "",
        "recommended_actions": []
    }
    
    
    if risk_level == RiskLevel.CRITICAL:
        alert["message"] = "⚠️ CRITICAL PATIENT - Immediate intervention required"
        alert["color"] = "red"
        alert["priority"] = 1
    elif risk_level == RiskLevel.HIGH:
        alert["message"] = "🔴 HIGH RISK - Urgent attention needed"
        alert["color"] = "orange"
        alert["priority"] = 2
    elif risk_level == RiskLevel.MODERATE:
        alert["message"] = "🟡 MODERATE RISK - Close monitoring advised"
        alert["color"] = "yellow"
        alert["priority"] = 3
    else:
        alert["message"] = "🟢 LOW RISK - Routine care recommended"
        alert["color"] = "green"
        alert["priority"] = 4
    
    
    if emergencies:
        for emergency in emergencies:
            alert["recommended_actions"].append({
                "action": emergency["action"],
                "priority": "IMMEDIATE",
                "category": emergency["type"].upper(),
                "response_time": f"Within {emergency['response_time_minutes']} minutes"
            })
    
    if critical_labs:
        alert["recommended_actions"].append({
            "action": "Review and confirm critical lab values immediately",
            "priority": "URGENT",
            "category": "LABORATORY",
            "response_time": "Within 15 minutes"
        })
    
    if risk_level in [RiskLevel.CRITICAL, RiskLevel.HIGH]:
        alert["recommended_actions"].append({
            "action": "Notify attending physician immediately",
            "priority": "URGENT",
            "category": "NOTIFICATION",
            "response_time": "Immediately"
        })
    
    return alert


def perform_risk_stratification(feature_data: Dict, prediction_result: Dict) -> Dict:
   
   
    symptoms = feature_data.get("symptoms", [])
    age = feature_data.get("age", 30)
    
    
    lab_values = {
        "glucose": feature_data.get("glucose", 90),
        "hemoglobin": feature_data.get("hemoglobin", 14.0),
        "blood_pressure": feature_data.get("blood_pressure", 120),
        "cholesterol": feature_data.get("cholesterol", 180),
    }
    
    
    comorbidities = []
    if feature_data.get("diabetes"):
        comorbidities.append("Diabetes")
    if feature_data.get("hypertension"):
        comorbidities.append("Hypertension")
    
   
    lifestyle_factors = {
        "smoking": feature_data.get("smoking", False),
        "alcohol": feature_data.get("alcohol_consumption", False),
        "obesity": feature_data.get("bmi", 22) >= 30
    }
    
   
    emergencies = detect_emergency_conditions(symptoms)
    critical_labs = detect_critical_lab_values(lab_values)
    
    
    risk_score, score_breakdown = calculate_risk_score_with_trace(
        symptoms=symptoms,
        lab_values=lab_values,
        predicted_disease=prediction_result.get("disease", "Healthy"),
        disease_probability=prediction_result.get("probability", 0),
        age=age,
        comorbidities=comorbidities,
        lifestyle_factors=lifestyle_factors
    )
    
   
    risk_level = classify_risk_level(risk_score)
    
   
    alert = generate_alert_message(risk_level, emergencies, critical_labs, risk_score)
    
   
    emergency_confidence = calculate_emergency_confidence(emergencies, critical_labs, risk_score)
    
    
    triage_comparison = generate_triage_comparison(risk_level)
    
    
    all_diagnostics = []
    for emergency in emergencies:
        all_diagnostics.extend(emergency.get("diagnostics", []))
    all_diagnostics = list(dict.fromkeys(all_diagnostics))  # Remove duplicates
    
    
    escalation_warnings = [e.get("escalation_warning") for e in emergencies if e.get("escalation_warning")]
    
    
    response_times = [e.get("response_time_minutes", 60) for e in emergencies]
    min_response_time = min(response_times) if response_times else None
    
   
    primary_emergency = emergencies[0]["type"].title() if emergencies else None
    
    return {
        "risk_score": risk_score,
        "risk_level": risk_level.value,
        "risk_percentage": min(100, int(risk_score * 1.2)),  
        "alert": alert,
        "emergencies": emergencies,
        "critical_labs": critical_labs,
        "requires_immediate_attention": risk_level in [RiskLevel.CRITICAL, RiskLevel.HIGH],
        "triage_priority": alert["priority"],
        
        
        "clinical_reason_trace": {
            "score_breakdown": score_breakdown,
            "total_score": risk_score,
            "threshold_crossed": "Emergency threshold (≥50)" if risk_score >= 50 else "Moderate threshold (≥25)" if risk_score >= 25 else "Below threshold",
            "explanation": f"Total Risk Score of {risk_score} points triggered {risk_level.value} classification"
        },
        
        "time_to_action": {
            "response_time_minutes": min_response_time,
            "primary_condition": primary_emergency,
            "urgency_label": f"Within {min_response_time} minutes ({primary_emergency} Risk)" if min_response_time else None,
            "golden_minutes": min_response_time <= 10 if min_response_time else False
        },
        
        "triage_comparison": triage_comparison,
        
        "risk_escalation": {
            "warnings": escalation_warnings,
            "has_escalation_risk": len(escalation_warnings) > 0,
            "primary_warning": escalation_warnings[0] if escalation_warnings else None
        },
        
        "diagnostic_checklist": {
            "tests": all_diagnostics,
            "count": len(all_diagnostics),
            "priority": "IMMEDIATE" if emergencies else "ROUTINE"
        },
        
        "emergency_confidence": emergency_confidence
    }
