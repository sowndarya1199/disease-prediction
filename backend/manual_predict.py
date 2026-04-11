
import sys
import os


sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from backend.ml_engine import predict_disease


feature_data = {
    "sodium": 135.0,
    
    "hemoglobin": 14.0, 
    "glucose": 90,
    "creatinine": 0.9,
    "symptoms": [] 
}

print("--- Running Prediction (Sodium 135) ---")
result = predict_disease(feature_data)
print(f"Predicted Disease: {result['disease']}")
print(f"Confidence: {result['probability']}")
print(f"Risk: {result['risk']}")
print(f"Method: {result['prediction_method']}")
print("-" * 30)
