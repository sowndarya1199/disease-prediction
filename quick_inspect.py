import joblib
import sys


print("Loading Label Encoder...")
le = joblib.load(r"d:\disease prediction\backend\data\label_encoder.pkl")
print(f"\nTotal Diseases: {len(le.classes_)}\n")
print("Disease List:")
for i, disease in enumerate(le.classes_):
    print(f"  {i:2d}. {disease}")


print("\n" + "="*60)
print("Loading Random Forest Model...")
rf = joblib.load(r"d:\disease prediction\backend\data\medpred_rf_model.pkl")

print(f"\nModel Type: {type(rf).__name__}")
print(f"Number of Trees: {rf.n_estimators}")
print(f"Max Depth: {rf.max_depth}")
print(f"Input Features: {rf.n_features_in_}")
print(f"Output Classes: {rf.n_classes_}")

print("\n" + "="*60)
print("SUMMARY:")
print(f"  Diseases: {len(le.classes_)}")
print(f"  Features: {rf.n_features_in_}")
print(f"  Trees: {rf.n_estimators}")
