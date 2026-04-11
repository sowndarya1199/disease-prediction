

SYMPTOM_CATEGORIES = {
    "General": [
        "Fatigue / weakness",
        "Fever",
        "Chills",
        "Weight loss",
        "Weight gain",
        "Excessive sweating",
        "Low energy levels"
    ],
    
    "Respiratory": [
        "Shortness of breath",
        "Wheezing",
        "Cough",
        "Persistent cough",
        "Productive cough",
        "Chronic cough",
        "Chest tightness",
        "Breathing difficulty after exercise",
        "Mucus production"
    ],
    
    "Cardiovascular": [
        "Chest pain",
        "Chest pressure",
        "Chest discomfort",
        "Palpitations",
        "Rapid heartbeat",
        "Slow heart rate",
        "Swelling of legs",
        "Cold hands and feet",
        "Cold extremities",
        "Leg pain while walking"
    ],
    
    "Gastrointestinal": [
        "Nausea",
        "Vomiting",
        "Heartburn",
        "Regurgitation",
        "Sour taste in mouth",
        "Upper abdominal pain",
        "Lower abdominal pain",
        "Bloating",
        "Loss of appetite",
        "Difficulty swallowing",
        "Black stools",
        "Constipation",
        "Diarrhea",
        "Increased hunger"
    ],
    
    "Neurological": [
        "Headache",
        "Severe headache",
        "Dizziness",
        "Sensitivity to light and sound",
        "Visual disturbances",
        "Blurred vision",
        "Tingling or numbness in hands & feet",
        "Memory problems",
        "Difficulty walking",
        "Difficulty concentrating",
        "Confusion",
        "Tremors",
        "Trembling"
    ],
    
    "Skin": [
        "Pale skin",
        "Pale or yellowish skin",
        "Dry skin",
        "Hair loss",
        "Brittle nails",
        "Fatty deposits on skin"
    ],
    
    "Urinary": [
        "Frequent urination",
        "Burning sensation during urination",
        "Frequent urge to urinate",
        "Cloudy or foul-smelling urine",
        "Blood in urine"
    ],
    
    "Metabolic/Endocrine": [
        "Excessive thirst",
        "Increased thirst",
        "Slow wound healing",
        "Recurrent infections",
        "Cold intolerance",
        "Heat intolerance",
        "Increased appetite"
    ],
    
    "Musculoskeletal": [
        "Joint pain",
        "Muscle cramps",
        "Weakness and fatigue",
        "Numbness or weakness"
    ],
    
    "Psychological": [
        "Mood changes",
        "Depression",
        "Irritability",
        "Anxiety",
        "Excessive worry",
        "Restlessness",
        "Sleep problems"
    ],
    
    "Oral/Throat": [
        "Glossitis (smooth, red tongue)",
        "Difficulty swallowing"
    ],
    
    "Other": [
        "Breathlessness on exertion",
        "Snoring / sleep apnea",
        "Nosebleeds",
        "Pica (craving ice/clay)"
    ]
}


COMMON_SYMPTOMS = [
    "Fever",
    "Headache",
    "Cough",
    "Fatigue / weakness",
    "Nausea",
    "Dizziness",
    "Chest pain",
    "Shortness of breath",
    "Abdominal pain",
    "Sore throat"
]


ALL_SYMPTOMS = sorted(list(set([
    symptom 
    for category_symptoms in SYMPTOM_CATEGORIES.values() 
    for symptom in category_symptoms
])))


def get_symptom_categories():
    """Get all symptom categories with their symptoms."""
    return SYMPTOM_CATEGORIES


def get_common_symptoms():
    """Get list of common symptoms for quick-add."""
    return COMMON_SYMPTOMS


def get_all_symptoms():
    """Get all unique symptoms as a sorted list."""
    return ALL_SYMPTOMS


def search_symptoms(query: str, limit: int = 10):
    """
    Search symptoms by query string (case-insensitive).
    
    Args:
        query: Search string
        limit: Maximum number of results to return
        
    Returns:
        List of matching symptom names
    """
    if not query or len(query) < 2:
        return []
    
    query_lower = query.lower()
    matches = []
    
    
    for symptom in ALL_SYMPTOMS:
        if symptom.lower() == query_lower:
            matches.append(symptom)
    
    
    for symptom in ALL_SYMPTOMS:
        if symptom.lower().startswith(query_lower) and symptom not in matches:
            matches.append(symptom)
    
    
    for symptom in ALL_SYMPTOMS:
        if query_lower in symptom.lower() and symptom not in matches:
            matches.append(symptom)
    
    return matches[:limit]


def get_category_for_symptom(symptom: str):
    """
    Find which category a symptom belongs to.
    
    Args:
        symptom: Symptom name
        
    Returns:
        Category name or None if not found
    """
    for category, symptoms in SYMPTOM_CATEGORIES.items():
        if symptom in symptoms:
            return category
    return None
