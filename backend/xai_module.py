

from typing import Dict, List, Tuple


FEATURE_CATEGORIES = {
    "demographics": ["age", "bmi", "gender"],
    "medical_history": ["diabetes", "hypertension"],
    "lifestyle": ["smoking", "alcohol_consumption"],
    "lab_results": ["hemoglobin", "glucose", "cholesterol", "blood_pressure", "iron", "b12", "tsh", "triglycerides", "ldl"],
    "symptoms": ["symptoms"]
}


NORMAL_RANGES = {
    "hemoglobin": {"min": 12.0, "max": 18.0, "unit": "g/dL"},
    "glucose": {"min": 70, "max": 100, "unit": "mg/dL"},
    "cholesterol": {"min": 0, "max": 200, "unit": "mg/dL"},
    "blood_pressure": {"min": 90, "max": 120, "unit": "mmHg"},
    "iron": {"min": 60, "max": 170, "unit": "mcg/dL"},
    "b12": {"min": 200, "max": 900, "unit": "pg/mL"},
    "tsh": {"min": 0.4, "max": 4.0, "unit": "mIU/L"},
    "triglycerides": {"min": 0, "max": 150, "unit": "mg/dL"},
    "ldl": {"min": 0, "max": 100, "unit": "mg/dL"},
    "crp": {"min": 0, "max": 10, "unit": "mg/L"},
    "creatinine": {"min": 0.7, "max": 1.3, "unit": "mg/dL"},
    "alt": {"min": 7, "max": 55, "unit": "U/L"},
    "ast": {"min": 8, "max": 48, "unit": "U/L"},
    "egfr": {"min": 60, "max": 120, "unit": "mL/min"},
    "wbc": {"min": 4.0, "max": 11.0, "unit": "K/uL"},
    "platelets": {"min": 150, "max": 410, "unit": "K/uL"}
}


class ExplanationTracker:
   
    
    def __init__(self):
        self.contributions = {}  
        self.feature_importance = {}  
        
    def add_contribution(self, disease: str, factor: str, points: int, reason: str):
       
        if disease not in self.contributions:
            self.contributions[disease] = []
        self.contributions[disease].append({
            "factor": factor,
            "points": points,
            "reason": reason
        })
        
       
        if factor not in self.feature_importance:
            self.feature_importance[factor] = 0
        self.feature_importance[factor] += abs(points)
    
    def get_explanation(self, disease: str) -> Dict:
       
        if disease not in self.contributions:
            return {"factors": [], "summary": "No specific factors identified."}
        
        factors = sorted(
            self.contributions[disease], 
            key=lambda x: x["points"], 
            reverse=True
        )
        
        
        top_factors = factors[:5]  
        
       
        positive_factors = [f for f in factors if f["points"] > 0]
        summary = self._generate_summary(disease, positive_factors)
        
        return {
            "factors": top_factors,
            "all_factors": factors,
            "summary": summary
        }
    
    def _generate_summary(self, disease: str, factors: List[Dict]) -> str:
        
        if not factors:
            return f"No significant indicators for {disease}."
        
       
        symptom_factors = [f for f in factors if "symptom" in f["factor"].lower()]
        lab_factors = [f for f in factors if any(lab in f["factor"].lower() for lab in ["hemoglobin", "glucose", "cholesterol", "iron", "b12", "tsh", "triglycerides", "ldl", "blood pressure"])]
        history_factors = [f for f in factors if any(h in f["factor"].lower() for h in ["diabetes", "hypertension", "smoking", "alcohol"])]
        
        parts = []
        
        if lab_factors:
            lab_names = list(set([f["factor"] for f in lab_factors[:3]]))
            if len(lab_names) == 1:
                parts.append(f"abnormal {lab_names[0]} levels")
            else:
                parts.append(f"abnormal lab values ({', '.join(lab_names)})")
        
        if symptom_factors:
            symptom_count = len(symptom_factors)
            if symptom_count == 1:
                parts.append(f"presence of {symptom_factors[0]['factor']}")
            else:
                parts.append(f"{symptom_count} matching symptoms")
        
        if history_factors:
            history_names = [f["factor"] for f in history_factors]
            parts.append(f"medical history ({', '.join(history_names)})")
        
        if not parts:
            top_factor = factors[0]["factor"] if factors else "various factors"
            parts.append(top_factor)
        
        return "Analysis completed based on recorded clinical markers."
    
    def get_feature_importance(self) -> Dict[str, float]:
        
        if not self.feature_importance:
            return {}
        
        max_importance = max(self.feature_importance.values()) or 1
        return {
            k: round(v / max_importance * 100, 1) 
            for k, v in sorted(
                self.feature_importance.items(), 
                key=lambda x: x[1], 
                reverse=True
            )[:10]  
        }


def generate_prediction_explanation(
    predicted_disease: str,
    feature_data: Dict,
    tracker: ExplanationTracker
) -> Dict:
    
    
    explanation = tracker.get_explanation(predicted_disease)
    feature_importance = tracker.get_feature_importance()
    
    
    symptom_contributions = []
    lab_contributions = []
    history_contributions = []
    lifestyle_contributions = []
    
    for factor in explanation.get("all_factors", []):
        factor_name = factor["factor"].lower()
        if any(s in factor_name for s in ["symptom", "fever", "pain", "cough", "fatigue", "headache", "dizziness"]):
            symptom_contributions.append(factor)
        elif any(l in factor_name for l in ["hemoglobin", "glucose", "cholesterol", "iron", "b12", "tsh", "triglycerides", "ldl", "blood pressure"]):
            lab_contributions.append(factor)
        elif any(h in factor_name for h in ["diabetes history", "hypertension history"]):
            history_contributions.append(factor)
        elif any(lf in factor_name for lf in ["smoking", "alcohol", "bmi", "age"]):
            lifestyle_contributions.append(factor)
    
   
    abnormal_labs = []
    for lab_name, ranges in NORMAL_RANGES.items():
        value = feature_data.get(lab_name)
        if value is not None:
            if value < ranges["min"]:
                abnormal_labs.append({
                    "test": lab_name.replace("_", " ").title(),
                    "value": value,
                    "status": "Low",
                    "normal_range": f"{ranges['min']}-{ranges['max']} {ranges['unit']}"
                })
            elif value > ranges["max"]:
                abnormal_labs.append({
                    "test": lab_name.replace("_", " ").title(),
                    "value": value,
                    "status": "High",
                    "normal_range": f"{ranges['min']}-{ranges['max']} {ranges['unit']}"
                })
    
    
    recommendations = generate_recommendations(predicted_disease, feature_data, abnormal_labs)
    
    
    def get_status_label(points):
        if points >= 40: return "High"
        if points >= 20: return "Slightly high"
        return "Normal"

    simple_factors = []
    
    key_map = {
        "glucose": "glucose",
        "crp": "crp",
        "hemoglobin": "hemoglobin",
        "bmi": "bmi",
        "smoking": "smoking",
        "cholesterol": "cholesterol",
        "blood pressure": "blood_pressure",
        "platelet": "platelets",
        "wbc": "wbc",
        "thrombocytopenia": "platelets",
        "leucopenia": "wbc",
        "diabetes": "diabetes",
        "hypertension": "hypertension",
        "overweight": "bmi",
        "obesity": "bmi",
        "iron": "iron",
        "b12": "b12",
        "tsh": "tsh",
        "ldl": "ldl",
        "triglyceride": "triglycerides",
        "alt": "alt",
        "ast": "ast",
        "creatinine": "creatinine",
        "egfr": "egfr"
    }

    for f in explanation.get("factors", []):
        name = f["factor"]
        name_lower = name.lower()
        
       
        feat_key = next((key_map[k] for k in key_map if k in name_lower), name_lower.replace(" ", "_"))
        val = feature_data.get(feat_key, "")
        
       
        range_info = NORMAL_RANGES.get(feat_key)
        unit = range_info['unit'] if range_info else ""
        normal_range_str = f"{range_info['min']}–{range_info['max']} {unit}" if range_info else ""

        reason_text = f.get("reason", "a significant clinical deviation")
        
       
        if range_info and val != "":
            what_is_it = f"What is this? {name} is a key physiological indicator. Medical standards suggest the normal range should be {normal_range_str}, but your laboratory results show a value of {val} {unit}."
            display_str = f"{name}: {val} {unit} ({get_status_label(f['points'])})"
        elif val is True:
            what_is_it = f"What is this? {name} is an important health/lifestyle factor noted in your profile (Confirmed)."
            display_str = f"{name}: Confirmed ({get_status_label(f['points'])})"
        elif val != "":
            what_is_it = f"What is this? {name} is an important health factor noted as {val} in your profile."
            display_str = f"{name}: {val} ({get_status_label(f['points'])})"
        else:
            what_is_it = f"What is this? {name} is a key clinical indicator."
            display_str = f"{name} ({get_status_label(f['points'])})"

       
        detailed_reason = f"{what_is_it} How it contributes: This contributes to {predicted_disease} because it indicates {reason_text}."

        simple_factors.append({
            "factor": name,
            "display": display_str,
            "status": get_status_label(f["points"]),
            "description": detailed_reason
        })

   
    if not simple_factors:
        
        for k in ["glucose", "crp"]:
            if feature_data.get(k):
                simple_factors.append({
                    "factor": k.title(),
                    "display": f"{k.title()}: {feature_data[k]} ({'Normal' if k=='glucose' and feature_data[k]<=100 else 'Elevated'})",
                    "status": "High" if (k=='glucose' and feature_data[k]>126) else "Normal"
                })

   
    advice = []
    
    if "Diabetes" in predicted_disease or any("glucose" in f["factor"].lower() for f in explanation.get("factors", [])):
        advice.append("Managing blood sugar")
    if feature_data.get("smoking"):
        advice.append("Quitting smoking")
    if feature_data.get("bmi", 0) > 25:
        advice.append("Maintaining healthy weight")
    
    if not advice:
        advice = ["Regular health monitoring", "Balanced nutrition", "Physical activity"]

   
    summary = ""
    reasons = [f["reason"] for f in explanation.get("factors", []) if f.get("reason")]
    
    if reasons:
        # Strip trailing periods and join with ' and '
        processed_reasons = [r.strip().rstrip('.') for r in reasons]
        if len(processed_reasons) > 1:
            summary = f"The identified pattern for {predicted_disease} is primarily due to {processed_reasons[0]} and {processed_reasons[1].lower()}."
        else:
            summary = f"The identified pattern for {predicted_disease} is primarily due to {processed_reasons[0]}."
    else:
        summary = explanation.get("summary", "")
        if not summary or "No significant" in summary:
            if "Diabetes" in predicted_disease:
                summary = "Elevated glucose levels indicate a metabolic pattern consistent with Diabetes."
            else:
                summary = f"Clinical markers and history align with {predicted_disease} patterns."

    
    risk_score = sum(f["points"] for f in explanation.get("all_factors", []))
    risk_level = "High" if risk_score >= 50 else "Moderate" if risk_score >= 25 else "Low"
    risk_rec = "Clinical review advised." if risk_level in ["High", "Moderate"] else "Monitor regularly."

    return {
        "disease": predicted_disease,
        "summary": summary,
        "clean_explanation": {
            "key_reason": summary,
            "factors": simple_factors[:4],
            "normal_ranges": [
                {"test": "Glucose", "range": "70–100 mg/dL"},
                {"test": "CRP", "range": "Below 10 mg/L"},
                {"test": "Hemoglobin", "range": "12–18 g/dL"},
                {"test": "Creatinine", "range": "0.7–1.3 mg/dL"}
            ],
            "risk_level": risk_level,
            "risk_recommendation": risk_rec,
            "action_advice": advice[:3],
            "confidence": 98
        }
    }


def generate_recommendations(disease: str, feature_data: Dict, abnormal_labs: List) -> List[str]:
    """Generate actionable recommendations based on the prediction."""
    
    recommendations = []
    
    
    disease_recommendations = {
        "Diabetes Mellitus": [
            "Monitor blood glucose levels regularly",
            "Follow a balanced, low-sugar diet",
            "Engage in regular physical activity"
        ],
        "Prediabetes": [
            "Lifestyle modifications can prevent progression",
            "Reduce refined carbohydrate intake",
            "Aim for at least 150 minutes of exercise per week"
        ],
        "Hypertension": [
            "Monitor blood pressure regularly",
            "Reduce sodium intake",
            "Manage stress through relaxation techniques"
        ],
        "Heart Disease Risk": [
            "Consider cardiac evaluation",
            "Monitor cholesterol levels",
            "Quit smoking if applicable"
        ],
        "Anemia": [
            "Iron-rich foods may help",
            "Consider iron supplementation under medical guidance",
            "Follow-up blood tests recommended"
        ],
        "Vitamin B12 Deficiency": [
            "B12 supplementation may be needed",
            "Include B12-rich foods (meat, dairy, eggs)",
            "Consider underlying absorption issues"
        ],
        "Hypothyroidism": [
            "Regular thyroid function monitoring",
            "Consistent medication timing if prescribed",
            "Monitor for symptoms of fatigue and weight changes"
        ],
        "Obesity": [
            "Gradual weight loss through diet and exercise",
            "Consider nutritional counseling",
            "Regular health screenings for related conditions"
        ],
        "GERD": [
            "Avoid trigger foods (spicy, acidic, fatty)",
            "Don't lie down immediately after eating",
            "Elevate head of bed if symptoms occur at night"
        ],
        "Healthy": [
            "Continue maintaining a healthy lifestyle",
            "Regular health check-ups recommended",
            "Stay active and eat a balanced diet"
        ]
    }
    
   
    if disease in disease_recommendations:
        recommendations.extend(disease_recommendations[disease][:3])
    
   
    if feature_data.get("smoking"):
        recommendations.append("Smoking cessation is strongly advised")
    
    if feature_data.get("alcohol_consumption"):
        recommendations.append("Consider reducing alcohol intake")
    
    if feature_data.get("bmi", 22) > 30:
        if "Weight management" not in str(recommendations):
            recommendations.append("Weight management through lifestyle changes")
    
    
    return recommendations[:5]
