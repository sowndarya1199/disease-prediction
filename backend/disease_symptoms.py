
DISEASE_SYMPTOMS = {
    "Anemia": [
        "Fatigue / weakness",
        "Pale skin",
        "Shortness of breath",
        "Dizziness",
        "Headache",
        "Cold hands and feet",
        "Palpitations"
    ],
    
    "Vitamin B12 Deficiency": [
        "Extreme tiredness",
        "Tingling or numbness in hands & feet",
        "Memory problems",
        "Difficulty walking",
        "Pale or yellowish skin",
        "Glossitis (smooth, red tongue)",
        "Mood changes (depression, irritability)"
    ],
    
    "Iron Deficiency Disorder": [
        "Weakness and fatigue",
        "Pale skin",
        "Hair loss",
        "Brittle nails",
        "Shortness of breath",
        "Headache",
        "Pica (craving ice/clay)"
    ],
    
    "Diabetes Mellitus": [
        "Frequent urination",
        "Excessive thirst",
        "Increased hunger",
        "Weight loss",
        "Fatigue",
        "Blurred vision",
        "Slow wound healing",
        "Recurrent infections"
    ],
    
    "Prediabetes": [
        "Often no symptoms",
        "Mild fatigue",
        "Increased thirst (sometimes)",
        "Frequent urination (sometimes)"
    ],
    
    "Obesity": [
        "Excess body weight",
        "Breathlessness on exertion",
        "Joint pain (knees, back)",
        "Excessive sweating",
        "Snoring / sleep apnea",
        "Low energy levels"
    ],
    
    "Hyperlipidemia": [
        "Usually no symptoms",
        "Chest pain (if advanced)",
        "Leg pain during walking (atherosclerosis)",
        "Fatty deposits on skin (xanthomas – rare)"
    ],
    
    "Hypertension": [
        "Often asymptomatic",
        "Headache",
        "Dizziness",
        "Blurred vision",
        "Nosebleeds (rare)",
        "Chest discomfort (advanced)"
    ],
    
    "Heart Disease Risk": [
        "Chest pain or pressure",
        "Shortness of breath",
        "Fatigue",
        "Palpitations",
        "Swelling of legs",
        "Dizziness"
    ],
    
    "Atherosclerosis Risk": [
        "Chest pain",
        "Leg pain while walking (claudication)",
        "Numbness or weakness",
        "Cold extremities",
        "Fatigue"
    ],
    
    "Asthma": [
        "Wheezing",
        "Shortness of breath",
        "Chest tightness",
        "Coughing (especially at night)",
        "Breathing difficulty after exercise"
    ],
    
    "Bronchitis": [
        "Persistent cough",
        "Mucus production",
        "Chest discomfort",
        "Shortness of breath",
        "Mild fever",
        "Fatigue"
    ],
    
    "Pneumonia Risk": [
        "High fever",
        "Chills",
        "Productive cough",
        "Shortness of breath",
        "Chest pain",
        "Fatigue",
        "Confusion (elderly)"
    ],
    
    "Gastritis": [
        "Upper abdominal pain",
        "Nausea",
        "Vomiting",
        "Bloating",
        "Loss of appetite",
        "Black stools (if bleeding)"
    ],
    
    "GERD": [
        "Heartburn",
        "Regurgitation",
        "Sour taste in mouth",
        "Chest discomfort",
        "Difficulty swallowing",
        "Chronic cough"
    ],
    
    "Migraine": [
        "Severe headache (one-sided)",
        "Nausea and vomiting",
        "Sensitivity to light and sound",
        "Visual disturbances (aura)",
        "Dizziness"
    ],
    
    "Anxiety Disorder": [
        "Excessive worry",
        "Restlessness",
        "Rapid heartbeat",
        "Sweating",
        "Trembling",
        "Difficulty concentrating",
        "Sleep problems"
    ],
    
    "Hypothyroidism": [
        "Fatigue",
        "Weight gain",
        "Cold intolerance",
        "Dry skin",
        "Hair loss",
        "Constipation",
        "Depression",
        "Slow heart rate"
    ],
    
    "Hyperthyroidism": [
        "Weight loss",
        "Heat intolerance",
        "Increased appetite",
        "Palpitations",
        "Anxiety",
        "Tremors",
        "Excessive sweating",
        "Diarrhea"
    ],
    
    "Urinary Tract Infection": [
        "Burning sensation during urination",
        "Frequent urge to urinate",
        "Cloudy or foul-smelling urine",
        "Lower abdominal pain",
        "Fever (if severe)",
        "Blood in urine"
    ],
    
    "Healthy": [
        "No significant symptoms"
    ]
}



SYMPTOM_KEYWORDS = {
   
    "fatigue": ["fatigue", "tired", "exhausted", "weakness", "weak", "tiredness", "extreme tiredness"],
    
   
    "pale_skin": ["pale", "pallor", "pale skin", "yellowish skin"],
    
   
    "shortness_of_breath": ["short of breath", "breathless", "breathing difficulty", "breathlessness", "wheezing"],
    
   
    "dizziness": ["dizzy", "dizziness", "lightheaded", "vertigo"],
    
    
    "headache": ["headache", "head pain", "severe headache"],
    
    
    "cold_extremities": ["cold hands", "cold feet", "cold extremities"],
    
    
    "palpitations": ["palpitation", "racing heart", "rapid heartbeat", "heart racing"],
    
    
    "tingling": ["tingling", "numbness", "pins and needles", "numb"],
    
   
    "memory_problems": ["memory problems", "forgetful", "confusion", "difficulty concentrating"],
    
   
    "difficulty_walking": ["difficulty walking", "walking problems", "unsteady gait"],
    
   
    "glossitis": ["smooth tongue", "red tongue", "sore tongue", "glossitis"],
    
   
    "mood_changes": ["mood changes", "depression", "irritability", "anxiety", "mood swings"],
    
    
    "hair_loss": ["hair loss", "thinning hair", "baldness"],
    "brittle_nails": ["brittle nails", "weak nails", "nail problems"],
    
   
    "pica": ["craving ice", "craving clay", "pica", "unusual cravings"],
    
    
    "frequent_urination": ["frequent urination", "urinating often", "polyuria", "urinary frequency"],
    
   
    "excessive_thirst": ["excessive thirst", "very thirsty", "polydipsia", "increased thirst"],
    "increased_hunger": ["increased hunger", "excessive hunger", "polyphagia", "always hungry"],
    
   
    "weight_loss": ["weight loss", "losing weight", "unintentional weight loss"],
    "weight_gain": ["weight gain", "gaining weight"],
    
   
    "blurred_vision": ["blurred vision", "blurry vision", "vision problems"],
    
   
    "slow_wound_healing": ["slow healing", "wounds not healing", "delayed healing"],
    
   
    "recurrent_infections": ["recurrent infections", "frequent infections", "repeated infections"],
    
    
    "joint_pain": ["joint pain", "knee pain", "back pain", "arthralgia"],
    
   
    "excessive_sweating": ["excessive sweating", "sweating", "perspiration", "night sweats"],
    
   
    "sleep_apnea": ["snoring", "sleep apnea", "sleep problems", "insomnia"],
    
    
    "chest_pain": ["chest pain", "chest pressure", "chest discomfort", "chest tightness"],
    
   
    "leg_pain": ["leg pain", "claudication", "leg cramps"],
    "swelling_legs": ["swelling of legs", "leg swelling", "edema"],
    
   
    "wheezing": ["wheezing", "wheeze"],
    "cough": ["cough", "coughing", "persistent cough", "productive cough"],
    
   
    "fever": ["fever", "high fever", "chills", "temperature"],
    
    
    "nausea": ["nausea", "nauseous", "vomiting", "throwing up"],
    "heartburn": ["heartburn", "acid reflux", "reflux", "burning sensation"],
    "abdominal_pain": ["abdominal pain", "stomach pain", "belly pain", "upper abdominal pain", "lower abdominal pain"],
    "bloating": ["bloating", "bloated", "gas"],
    "loss_of_appetite": ["loss of appetite", "no appetite", "not hungry"],
    "black_stools": ["black stools", "dark stools", "tarry stools"],
    "regurgitation": ["regurgitation", "food coming back up"],
    "sour_taste": ["sour taste", "bitter taste", "acid taste"],
    "difficulty_swallowing": ["difficulty swallowing", "dysphagia", "trouble swallowing"],
    "chronic_cough": ["chronic cough", "persistent cough"],
    "constipation": ["constipation", "hard stools", "difficulty passing stools"],
    "diarrhea": ["diarrhea", "loose stools", "frequent bowel movements"],
    
    
    "sensitivity_to_light": ["sensitivity to light", "photophobia", "light sensitivity"],
    "visual_disturbances": ["visual disturbances", "aura", "seeing lights"],
    "tremors": ["tremors", "trembling", "shaking", "shakes"],
    "restlessness": ["restlessness", "restless", "agitated"],
    
    
    "cold_intolerance": ["cold intolerance", "sensitive to cold", "always cold"],
    "heat_intolerance": ["heat intolerance", "sensitive to heat", "always hot"],
    "dry_skin": ["dry skin", "skin dryness"],
    "slow_heart_rate": ["slow heart rate", "bradycardia"],
    
    
    "burning_urination": ["burning sensation during urination", "painful urination", "dysuria"],
    "cloudy_urine": ["cloudy urine", "foul-smelling urine"],
    "blood_in_urine": ["blood in urine", "hematuria", "red urine"],
    
    
    "mucus_production": ["mucus production", "phlegm", "sputum"],
    "confusion": ["confusion", "confused", "disoriented"],
    "nosebleeds": ["nosebleeds", "nose bleeding"],
    "numbness": ["numbness", "weakness", "numb"],
    "excessive_worry": ["excessive worry", "worrying", "anxious"]
}


def get_disease_symptoms(disease: str) -> list:
    """Get the list of symptoms for a specific disease."""
    return DISEASE_SYMPTOMS.get(disease, [])


def get_all_diseases() -> list:
    """Get list of all diseases in the database."""
    return list(DISEASE_SYMPTOMS.keys())


def match_symptoms_to_disease(user_symptoms: list) -> dict:
    """
    Match user-provided symptoms to diseases and return match scores.
    
    Args:
        user_symptoms: List of symptom strings from user input
        
    Returns:
        Dictionary with disease names as keys and match scores as values
    """
    user_symptoms_lower = [s.lower() for s in user_symptoms]
    disease_scores = {}
    
    for disease, symptoms in DISEASE_SYMPTOMS.items():
        match_count = 0
        total_symptoms = len(symptoms)
        
        for disease_symptom in symptoms:
            disease_symptom_lower = disease_symptom.lower()
            
            
            for user_symptom in user_symptoms_lower:
                if disease_symptom_lower in user_symptom or user_symptom in disease_symptom_lower:
                    match_count += 1
                    break
        
       
        if total_symptoms > 0:
            match_percentage = (match_count / total_symptoms) * 100
            disease_scores[disease] = {
                "matched_symptoms": match_count,
                "total_symptoms": total_symptoms,
                "match_percentage": round(match_percentage, 2)
            }
    
   
    sorted_scores = dict(sorted(disease_scores.items(), key=lambda x: x[1]["match_percentage"], reverse=True))
    
    return sorted_scores
