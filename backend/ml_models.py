

import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestClassifier
from sklearn.preprocessing import LabelEncoder
import joblib
import os
import json


# Robust path detection for local vs. Docker
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
# If we are in the 'backend' folder, the data is right here. 
# If we were in the root, it would be in 'backend/data'.
if os.path.exists(os.path.join(BASE_DIR, "data")):
    MODEL_DIR = os.path.join(BASE_DIR, "data")
else:
    MODEL_DIR = os.path.join(os.path.dirname(BASE_DIR), "backend", "data")
RANDOM_FOREST_MODEL_PATH = os.path.join(MODEL_DIR, "medpred_rf_model.pkl")
LABEL_ENCODER_PATH = os.path.join(MODEL_DIR, "label_encoder.pkl")

def get_disease_classes():
    """Loads disease classes from the label encoder."""
    try:
        le = joblib.load(LABEL_ENCODER_PATH)
        return list(le.classes_)
    except:
        
        return ["Healthy", "Fungal infection", "Allergy", "GERD", "Chronic cholestasis", "Drug Reaction", "Peptic ulcer diseae", "AIDS", "Diabetes Mellitus", "Gastroenteritis", "Bronchial Asthma", "Hypertension", "Migraine", "Cervical spondylosis", "Paralysis (brain hemorrhage)", "Jaundice", "Malaria", "Chicken pox", "Dengue", "Typhoid", "hepatitis A", "Hepatitis B", "Hepatitis C", "Hepatitis D", "Hepatitis E", "Alcoholic hepatitis", "Tuberculosis", "Common Cold", "Pneumonia", "Dimorphic hemmorhoids(piles)", "Heart attack", "Varicose veins", "Hypothyroidism", "Hyperthyroidism", "Hypoglycemia", "Osteoarthristis", "Arthritis", "(vertigo) Paroymsal  Positional Vertigo", "Acne", "Urinary tract infection", "Psoriasis", "Impetigo"]

DISEASE_CLASSES = get_disease_classes()

def get_slot_mapping():
    """Builds a mapping from (slot_num, symptom_name) to feature index."""
    try:
        
        model = joblib.load(RANDOM_FOREST_MODEL_PATH)
        feature_names = list(model.feature_names_in_)
        
        mapping = {} 
        for i, name in enumerate(feature_names):
            
            if '_ ' in name:
                parts = name.split('_ ')
                slot_prefix = parts[0]
                symptom_val = parts[1].strip()
            else:
                
                parts = name.split('_')
                if len(parts) >= 3:
                    slot_prefix = f"Symptom_{parts[1]}"
                    symptom_val = "_".join(parts[2:])
                else:
                    continue
                    
            try:
                slot_num = int(slot_prefix.split('_')[1])
                if slot_num not in mapping:
                    mapping[slot_num] = {}
                mapping[slot_num][symptom_val] = i
            except:
                continue
        return mapping, len(feature_names)
    except Exception as e:
        print(f"Warning: Could not build slot mapping: {e}")
        return {}, 408

SLOT_MAPPING, TOTAL_FEATURES = get_slot_mapping()

def extract_features(feature_data: dict) -> np.ndarray:
    """
    Extracts features for the 408-feature model.
    Maps patient symptoms into the 17 slots expected by the model.
    """
    vector = np.zeros(TOTAL_FEATURES)
    
   
    raw_symptoms = feature_data.get("symptoms", [])
    if not isinstance(raw_symptoms, list):
        raw_symptoms = []
    
   
    clean_symptoms = []
    for s in raw_symptoms:
        
        s_clean = s.lower().strip().replace(" ", "_").replace("/", "_")
        clean_symptoms.append(s_clean)
        
   
    for symptom in clean_symptoms:
        found_at_least_one = False
        for slot_num, slot_map in SLOT_MAPPING.items():
            if symptom in slot_map:
                vector[slot_map[symptom]] = 1.0
                found_at_least_one = True
            else:
               
                for model_sym, idx in slot_map.items():
                    if symptom in model_sym or model_sym in symptom:
                        vector[idx] = 1.0
                        found_at_least_one = True
                        break
                        
    
    for slot_num, slot_map in SLOT_MAPPING.items():
       
        slot_indices = list(slot_map.values())
        if not any(vector[idx] == 1.0 for idx in slot_indices):
            if 'none' in slot_map:
                vector[slot_map['none']] = 1.0
                
    return vector.reshape(1, -1)
                
    return vector.reshape(1, -1)

def load_models():
    """Loads the Random Forest model and Label Encoder."""
    try:
        
        if not os.path.exists(RANDOM_FOREST_MODEL_PATH) or not os.path.exists(LABEL_ENCODER_PATH):
            return None, None
            
        rf_model = joblib.load(RANDOM_FOREST_MODEL_PATH)
        label_encoder = joblib.load(LABEL_ENCODER_PATH)
        return rf_model, label_encoder
    except:
        return None, None

def load_specialized_models():
    """
    Scans for additional trained models (e.g., Diabetes, Heart) 
    and loads them into a dictionary. Skips files larger than 100MB to prevent hangs.
    """
    specialized_models = {}
    try:
        if not os.path.exists(MODEL_DIR):
            return {}
            
        all_files = os.listdir(MODEL_DIR)
        
        for f in all_files:
            if f.endswith("_model.pkl") and "medpred_" in f and "medpred_rf_model" not in f:
                
                model_key = f.replace("medpred_", "").replace("_model.pkl", "")
                
                if any(x in model_key for x in ['symptom', 'description', 'precaution', 'severity']):
                    continue
                
                model_path = os.path.join(MODEL_DIR, f)
                
                # Critical: Skip massive files that cause startup hangs
                file_size_mb = os.path.getsize(model_path) / (1024 * 1024)
                if file_size_mb > 100:
                    print(f"Skipping specialized model {f} (Size: {file_size_mb:.1f}MB is > 100MB limit)")
                    continue

                feature_path = os.path.join(MODEL_DIR, f"medpred_{model_key}_features.pkl")
                
                try:
                    loaded_model = joblib.load(model_path)
                    loaded_features = []
                    if os.path.exists(feature_path):
                        loaded_features = joblib.load(feature_path)
                        
                    specialized_models[model_key] = {
                        "model": loaded_model,
                        "features": loaded_features
                    }
                    print(f"Loaded Specialized Model: {model_key} ({len(loaded_features)} features)")
                except Exception as e:
                    print(f"Failed to load specialized model {f}: {e}")
                    
        return specialized_models
    except Exception as e:
        print(f"Error loading specialized models: {e}")
        return {}

def predict_with_ml_ensemble(feature_data: dict) -> dict:
    """
    Primary prediction entry point.
    Handles extraction, prediction, and formatting.
    """
    rf_model, label_encoder = load_models()
    
    if not rf_model or not label_encoder:
        return {
            "ml_prediction": "Error: Models not loaded",
            "ml_confidence": 0.0,
            "error": "Model files missing in backend/data/"
        }
        
    try:
       
        X = extract_features(feature_data)
        
        
        rf_proba = rf_model.predict_proba(X)[0]
        
        
        classes = label_encoder.classes_
        proba_dict = {classes[i]: round(float(rf_proba[i]), 4) for i in range(len(classes))}
        sorted_proba = dict(sorted(proba_dict.items(), key=lambda x: x[1], reverse=True))
        
        predicted_class = max(proba_dict, key=proba_dict.get)
        confidence = proba_dict[predicted_class]
        
        return {
            "ml_prediction": predicted_class,
            "ml_confidence": float(confidence),
            "random_forest_prediction": predicted_class,
            "top_5_probabilities": dict(list(sorted_proba.items())[:5]),
            "model_contributions": {
                "random_forest": 1.0
            },
            "specialized_predictions": evaluate_specialized_models(feature_data)
        }
        
    except Exception as e:
        print(f"Prediction Error: {e}")
        return {
            "ml_prediction": "Prediction Failed",
            "ml_confidence": 0.0,
            "error": str(e)
        }

_SPECIALIZED_MODELS = None

def get_specialized_models():
    """Lazily loads specialized models to avoid startup hangs."""
    global _SPECIALIZED_MODELS
    if _SPECIALIZED_MODELS is None:
        _SPECIALIZED_MODELS = load_specialized_models()
    return _SPECIALIZED_MODELS

def evaluate_specialized_models(feature_data: dict) -> dict:
    """
    Runs available specialized models (Diabetes, Heart, etc.) 
    if sufficient matching features are found in feature_data.
    """
    results = {}
    
    # Lazily get the models
    models_to_use = get_specialized_models()
    
    # Input normalization
    input_data = {k.lower().strip(): v for k, v in feature_data.items()}
    
    # Glue code for common field names
    if 'glucose' not in input_data and 'blood_sugar' in input_data:
        input_data['glucose'] = input_data['blood_sugar']

    for name, model_info in models_to_use.items():
        try:
            model = model_info['model']
            required_features = model_info['features']
            
            # Prepare feature vector
            vector = []
            present_features = 0
            
            for feature in required_features:
                key = feature.lower().strip()
                val = 0.0
                
                if key in input_data:
                    try:
                        val = float(input_data[key])
                        present_features += 1
                    except:
                        pass
                
                vector.append(val)
            
            # Only predict if we have at least some data
            if present_features > 0:
                pred = model.predict([vector])[0]
                
                # Format response string based on model type
                if isinstance(pred, (int, np.integer, float)):
                    # Binary classifiers often return 0/1
                    if pred == 1:
                        if "heart" in name.lower() or "risk" in name.lower():
                            pred_str = "High Risk"
                        else:
                            pred_str = "Positive"
                    else:
                        if "heart" in name.lower() or "risk" in name.lower():
                            pred_str = "Low Risk"
                        else:
                            pred_str = "Negative"
                else:
                    pred_str = str(pred)
                    
                results[name] = pred_str
                
        except Exception as e:
            print(f"Error evaluating specialized model {name}: {e}")
            
    return results

# Remove the global trigger
# SPECIALIZED_MODELS = load_specialized_models()


def train_and_save_models():
    """Stubs out legacy training; users provide pre-trained models."""
    return {"status": "skipped", "message": "Using pre-trained MedPred models"}
