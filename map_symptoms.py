
import pandas as pd
import os
import glob


base_dir = r"d:\disease prediction\backend\data\Medpred dataset"

def analyze_all_datasets():
    if not os.path.exists(base_dir):
        print(f"Directory not found: {base_dir}")
        return

    csv_files = glob.glob(os.path.join(base_dir, "*.csv"))
    
    print("# Comprehensive Disease & Symptom Mapping\n")
    print("This document details the features (symptoms or lab values) used to predict each disease across all datasets.\n")

    for file_path in csv_files:
        filename = os.path.basename(file_path).lower()
        
       
        if any(x in filename for x in ['description', 'precaution', 'severity']):
            continue
            
        try:
            df = pd.read_csv(file_path)
            
            
            if 'dataset' in filename and not 'xlsx' in filename:
                print("## General Diseases (From Main Dataset)")
                print("*Source: dataset.csv*")
                
                
                if 'Disease' in df.columns:
                    diseases = df['Disease'].unique()
                    diseases.sort()
                    
                    for disease in diseases:
                        
                        disease_rows = df[df['Disease'] == disease]
                        all_symptoms = set()
                        for _, row in disease_rows.iterrows():
                            for col in df.columns:
                                if col != 'Disease':
                                    val = row[col]
                                    if isinstance(val, str) and val.strip() and val != '0':
                                         all_symptoms.add(val.strip().replace('_', ' '))
                        
                        symptoms_list = list(all_symptoms)
                        symptoms_list.sort()
                        if symptoms_list:
                            print(f"\n### {disease}")
                            print(f"- **Symptoms:** {', '.join(symptoms_list)}")
                print("\n---\n")

            
            else:
                
                title = filename.replace('.csv', '').replace('(1)', '').strip().title()
                if title == 'Uti': title = 'Urinary Tract Infection (UTI)'
                if 'Thyroid' in title: title = 'Thyroid Disorders'
                
                print(f"## {title}")
                print(f"*Source: {os.path.basename(file_path)}*")
                
                
                target_col = df.columns[-1]
                feature_cols = [c for c in df.columns if c != target_col]
                
                
                clean_features = [f.replace('_', ' ').title() for f in feature_cols]
                
                print(f"- **Risk Factors / Lab Values:** {', '.join(clean_features)}")
                
                
                try:
                    conditions = df[target_col].unique()
                    
                    if len(conditions) < 20: 
                         
                         cond_list = sorted([str(c) for c in conditions])
                         print(f"- **Conditions Predicted:** {', '.join(cond_list)}")
                except:
                    pass
                
                print("\n")
                
        except Exception as e:
           
            pass

if __name__ == "__main__":
    analyze_all_datasets()
