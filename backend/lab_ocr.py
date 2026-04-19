

import re
from PIL import Image
import io
import pytesseract
import os
tesseract_path = r"C:\Program Files\Tesseract-OCR\tesseract.exe"
if os.path.exists(tesseract_path):
    pytesseract.pytesseract.tesseract_cmd = tesseract_path

LAB_TEST_PATTERNS = {
    
    'hemoglobin': {
        'patterns': [r'h[ae]moglobin[\(\)\s:\|\-]*(\d+\.?\d*)', r'hgb[\(\)\s:\|\-]*(\d+\.?\d*)', r'hb[\(\)\s:\|\-]*(\d+\.?\d*)'],
        'keywords': ['hemoglobin', 'haemoglobin', 'hgb', 'hb', 'hemoglobin level'],
        'unit': 'g/dL',
        'unit_variations': ['gm%', 'g/dl', 'g%', 'g/100ml'],
        'normal_range': '12.0-18.0'
    },
    'rbc': {
        'patterns': [r'rbc[:\s]*(\d+\.?\d*)', r'red\s*blood\s*cells?[:\s]*(\d+\.?\d*)'],
        'keywords': ['rbc', 'red blood cell', 'rbc count'],
        'unit': 'M/uL',
        'unit_variations': ['mil/cumm', 'm/ul', 'million/ul'],
        'normal_range': '4.5-5.5'
    },
    'hematocrit': {
        'patterns': [r'hematocrit[\(\)\s:\|\-]*(\d+\.?\d*)', r'hct[\(\)\s:\|\-]*(\d+\.?\d*)', r'pcv[\(\)\s:\|\-]*(\d+\.?\d*)'],
        'keywords': ['hematocrit', 'hct', 'pcv', 'packed cell volume'],
        'unit': '%',
        'normal_range': '36.0-50.0'
    },
    'mcv': {
        'patterns': [r'mcv[\(\)\s:\|\-]*(\d+\.?\d*)', r'cv[\(\)\s:\|\-]*(\d+\.?\d*)', r'mean\s*corpuscular\s*volume[\(\)\s:\|\-]*(\d+\.?\d*)'],
        'keywords': ['mcv', 'cv', 'mean corpuscular volume'],
        'unit': 'fL',
        'normal_range': '80.0-100.0'
    },
    'mch': {
        'patterns': [r'mch[\(\)\s:\|\-]*(\d+\.?\d*)', r'mean\s*corpuscular\s*hemoglobin[\(\)\s:\|\-]*(\d+\.?\d*)'],
        'keywords': ['mch', 'mean corpuscular hemoglobin'],
        'unit': 'pg',
        'unit_variations': ['pgm'],
        'normal_range': '27.0-33.0'
    },
    'mchc': {
        'patterns': [r'mchc[\(\)\s:\|\-]*(\d+\.?\d*)', r'mean\s*corpuscular\s*hb\s*conc[\(\)\s:\|\-]*(\d+\.?\d*)'],
        'keywords': ['mchc', 'mean corpuscular hemoglobin concentration'],
        'unit': 'g/dL',
        'normal_range': '32.0-36.0'
    },
    'rdw': {
        'patterns': [r'rdw[:\s]*(\d+\.?\d*)', r'red\s*cell\s*distribution[:\s]*(\d+\.?\d*)'],
        'keywords': ['rdw', 'red cell distribution width'],
        'unit': '%',
        'normal_range': '11.0-15.0'
    },
    'aec': {
        'patterns': [r'aec[:\s]*(\d+)', r'absolute\s*eosinophil[:\s]*(\d+)'],
        'keywords': ['aec', 'absolute eosinophil count'],
        'unit': 'cells/mcL',
        'normal_range': '30-350'
    },
    'esr': {
        'patterns': [r'esr[:\s]*(\d+)', r'sedimentation\s*rate[:\s]*(\d+)'],
        'keywords': ['esr', 'erythrocyte sedimentation rate'],
        'unit': 'mm/hr',
        'normal_range': '0-20'
    },
    'wbc': {
        'patterns': [r'wbc[:\s]*(\d+\.?\d*)', r'white\s*blood\s*cells?[:\s]*(\d+\.?\d*)', r'tlc[:\s]*(\d+\.?\d*)', r'leukocyte\s*count[:\s]*(\d+\.?\d*)'],
        'keywords': ['wbc', 'white blood cell', 'white blood cells', 'tc wbc', 'wbc count', 'tlc', 'total leukocyte count'],
        'unit': 'K/uL',
        'unit_variations': ['/cumm', 'k/ul', 'cells/ul', 'thou/mm3'],
        'normal_range': '4.5-11.0'
    },
    'platelets': {
        'patterns': [r'platelets?[:\s]*(\d+\.?\d*)', r'plt[:\s]*(\d+\.?\d*)', r'platelet\s*count[:\s]*(\d+\.?\d*)'],
        'keywords': ['platelet', 'platelets', 'plt', 'platelets count', 'platelet count', 'total count', 'tc'],
        'unit': 'K/uL',
        'unit_variations': ['/cumm', 'k/ul', 'lakhs/cmm', 'lakhs/cumm', 'lakhs', 'thou/mm3'],
        'normal_range': '150-400'
    },
    'neutrophils': {
        'patterns': [r'neutrophils?[:\s]*(\d+)', r'polymorphs[:\s]*(\d+)'],
        'keywords': ['neutrophil', 'neutrophils', 'polymorphs'],
        'unit': '%',
        'normal_range': '40-75'
    },
    'lymphocytes': {
        'patterns': [r'lymphocytes?[:\s]*(\d+)'],
        'keywords': ['lymphocyte', 'lymphocytes'],
        'unit': '%',
        'normal_range': '20-45'
    },
    'monocytes': {
        'patterns': [r'monocytes?[:\s]*(\d+)'],
        'keywords': ['monocyte', 'monocytes'],
        'unit': '%',
        'normal_range': '2-10'
    },
    'eosinophils': {
        'patterns': [r'eosinophils?[:\s]*(\d+)'],
        'keywords': ['eosinophil', 'eosinophils'],
        'unit': '%',
        'normal_range': '1-6'
    },
    'basophils': {
        'patterns': [r'basophils?[:\s]*(\d+)'],
        'keywords': ['basophil', 'basophils'],
        'unit': '%',
        'normal_range': '0-1'
    },
   
    'hba1c': {
        'patterns': [r'hba1c[:\s]*(\d+\.?\d*)', r'glycated\s*hemoglobin[:\s]*(\d+\.?\d*)'],
        'keywords': ['hba1c', 'hb a1c', 'glycated hemoglobin'],
        'unit': '%',
        'normal_range': '4.0-5.6'
    },
    'fbs': {
        'patterns': [r'fbs[:\s]*(\d+\.?\d*)', r'fasting\s*glucose[:\s]*(\d+\.?\d*)'],
        'keywords': ['fbs', 'fasting blood sugar', 'fasting glucose'],
        'unit': 'mg/dL',
        'normal_range': '70.0-100.0'
    },
    'ppbs': {
        'patterns': [r'ppbs[:\s]*(\d+\.?\d*)', r'post\s*prandial[:\s]*(\d+\.?\d*)'],
        'keywords': ['ppbs', 'post-prandial blood sugar', 'post prandial'],
        'unit': 'mg/dL',
        'normal_range': '100.0-140.0'
    },
    'glucose': {
        'patterns': [r'glucose[:\s]*(\d+\.?\d*)', r'blood\s*sugar[:\s]*(\d+\.?\d*)'],
        'keywords': ['glucose', 'blood sugar', 'sugar'],
        'unit': 'mg/dL',
        'normal_range': '70.0-140.0'
    },

    
    'cholesterol': {
        'patterns': [r'total\s*cholesterol[:\s\-\|]*(\d+\.?\d*)', r'cholesterol[:\s\-\|]*(\d+\.?\d*)'],
        'keywords': ['cholesterol', 'chole', 'lipid'],
        'unit': 'mg/dL',
        'normal_range': '10.0-200.0'
    },
    'ldl': {
        'patterns': [r'ldl\s*[a-z]*[:\s\-\|]*(\d+\.?\d*)', r'ldl\s*cholesterol[:\s\-\|]*(\d+\.?\d*)'],
        'keywords': ['ldl', 'bad cholesterol'],
        'unit': 'mg/dL',
        'normal_range': '0.0-100.0'
    },
    'hdl': {
        'patterns': [r'hdl\s*[a-z]*[:\s\-\|]*(\d+\.?\d*)', r'hdl\s*cholesterol[:\s\-\|]*(\d+\.?\d*)'],
        'keywords': ['hdl', 'good cholesterol'],
        'unit': 'mg/dL',
        'normal_range': '40.0-60.0'
    },
    'triglycerides': {
        'patterns': [r'trigly[a-z]*[:\s\-\|]*(\d+\.?\d*)', r'tg[:\s\-\|]*(\d+\.?\d*)'],
        'keywords': ['triglyceride', 'triglycerides', 'serum triglycerides', 'tg', 'triglyc'],
        'unit': 'mg/dL',
        'normal_range': '0.0-150.0'
    },
    'vldl': {
        'patterns': [r'vldl[:\s]*(\d+\.?\d*)'],
        'keywords': ['vldl'],
        'unit': 'mg/dL',
        'normal_range': '2.0-30.0'
    },

   
    'ferritin': {
        'patterns': [r'ferritin[:\s\|]*(\d+\.?\d*)', r'serum\s*ferritin[:\s\|]*(\d+\.?\d*)'],
        'keywords': ['ferritin', 'serum ferritin'],
        'unit': 'ng/mL',
        'normal_range': '30.0-400.0'
    },
    'iron': {
        'patterns': [r'iron[:\s]*(\d+\.?\d*)', r'serum\s*iron[:\s]*(\d+\.?\d*)'],
        'keywords': ['iron', 'serum iron'],
        'unit': 'mcg/dL',
        'normal_range': '60.0-170.0'
    },
    'tibc': {
        'patterns': [r'tibc[:\s]*(\d+\.?\d*)', r'total\s*iron\s*binding[:\s]*(\d+\.?\d*)'],
        'keywords': ['tibc', 'total iron binding capacity'],
        'unit': 'mcg/dL',
        'normal_range': '250.0-450.0'
    },
    'b12': {
        'patterns': [r'b12[\(\)\s:\|\-]*(\d+\.?\d*)', r'vitamin\s*b12[\(\)\s:\|\-]*(\d+\.?\d*)', r'cobalamin[\(\)\s:\|\-]*(\d+\.?\d*)'],
        'keywords': ['b12', 'vitamin b12', 'cobalamin'],
        'unit': 'pg/mL',
        'normal_range': '200.0-900.0'
    },
    'vitamin_d': {
        'patterns': [r'vitamin\s*d[\(\)\s:\|\-]*(\d+\.?\d*)', r'25\s*-\s*hydroxy[\(\)\s:\|\-]*(\d+\.?\d*)', r'calcidiol[\(\)\s:\|\-]*(\d+\.?\d*)'],
        'keywords': ['vitamin d', '25-hydroxy', 'calcidiol', 'vitamin d total'],
        'unit': 'nmol/L',
        'unit_variations': ['ng/ml'],
        'normal_range': '75.0-250.0'
    },

   
    'tsh': {
        'patterns': [r'tsh[\(\)\s:\|\-,]*serum[\(\)\s:\|\-,]*(\d+\.?\d*)', r'tsh[\(\)\s:\|\-,]*(\d+\.?\d*)', r'thyroid\s*stimulating\s*hormone[\(\)\s:\|\-,]*(\d+\.?\d*)'],
        'keywords': ['tsh', 'thyroid stimulating hormone', 'serum tsh', 'ultra tsh', 's.tsh', 'tsh, serum'],
        'unit': 'mIU/L',
        'unit_variations': ['mciu/ml', 'uiu/ml', 'uiu/l', 'miu/ml', 'miu/l', 'ulu/mu', 'ulu/ml'],
        'normal_range': '0.4-4.5'
    },
    't3': {
        'patterns': [r't3[:\s]*(\d+\.?\d*)', r'triiodothyronine[:\s]*(\d+\.?\d*)'],
        'keywords': ['t3', 'triiodothyronine', 'total t3'],
        'unit': 'ng/dL',
        'normal_range': '80-200'
    },
    't4': {
        'patterns': [r't4[:\s]*(\d+\.?\d*)', r'thyroxine[:\s]*(\d+\.?\d*)'],
        'keywords': ['t4', 'thyroxine', 'total t4'],
        'unit': 'ug/dL',
        'normal_range': '4.5-12.0'
    },
    'ft3': {
        'patterns': [r'free\s*t3[:\s]*(\d+\.?\d*)', r'ft3[:\s]*(\d+\.?\d*)'],
        'keywords': ['free t3', 'ft3'],
        'unit': 'pg/mL',
        'unit_variations': ['pmol/l'],
        'normal_range': '2.3-4.2'
    },
    'ft4': {
        'patterns': [r'free\s*t4[:\s]*(\d+\.?\d*)', r'ft4[:\s]*(\d+\.?\d*)'],
        'keywords': ['free t4', 'ft4'],
        'unit': 'ng/dL',
        'unit_variations': ['pmol/l'],
        'normal_range': '0.8-1.8'
    },

   
    'direct_bilirubin': {
        'patterns': [r'[:\s\-\|]*(\d+\.?\d*)'],
        'keywords': ['direct bilirubin', 'direct billirubin', 'bilirubin direct', 'billirubin direct'],
        'unit': 'mg/dL',
        'normal_range': '0.0-0.3'
    },
    'indirect_bilirubin': {
        'patterns': [r'[:\s\-\|]*(\d+\.?\d*)'],
        'keywords': ['indirect bilirubin', 'indirect billirubin', 'bilirubin indirect', 'billirubin indirect'],
        'unit': 'mg/dL',
        'normal_range': '0.2-0.8'
    },
    'bilirubin': {
        'patterns': [r'[:\s\-\|]*(\d+\.?\d*)'],
        'keywords': ['total bilirubin', 'total billirubin', 'bilirubin total', 'billirubin total', 's. bilirubin', 's. billirubin', 'bilirubin', 'billirubin'],
        'unit': 'mg/dL',
        'normal_range': '0.1-1.2'
    },
    'alt': {
        'patterns': [r'[:\s\-\|]*(\d+\.?\d*)'],
        'keywords': ['alt', 'sgpt', 's.g.p.t', 'alanine aminotransferase'],
        'unit': 'U/L',
        'normal_range': '7.0-55.0'
    },
    'ast': {
        'patterns': [r'[:\s\-\|]*(\d+\.?\d*)'],
        'keywords': ['ast', 'sgot', 's.g.o.t', 's.g.0.t', 'aspartate aminotransferase'],
        'unit': 'U/L',
        'normal_range': '8.0-48.0'
    },
    'creatinine': {
        'patterns': [r'creatinine[:\s]*(\d+\.?\d*)', r'sr\s*creatinine[:\s]*(\d+\.?\d*)'],
        'keywords': ['creatinine', 'creat', 'sr creatinine'],
        'unit': 'mg/dL',
        'normal_range': '0.7-1.3'
    },
    'urea': {
        'patterns': [r'urea[:\s]*(\d+\.?\d*)', r'blood\s*urea[:\s]*(\d+\.?\d*)'],
        'keywords': ['urea', 'blood urea'],
        'unit': 'mg/dL',
        'normal_range': '7.0-20.0'
    },

    
    'sodium': {
        'patterns': [r'sodium[:\s]*(\d+\.?\d*)', r'na\+?[:\s]*(\d+\.?\d*)'],
        'keywords': ['sodium', 'serum sodium', 'na+'],
        'unit': 'mEq/L',
        'normal_range': '135.0-145.0'
    },
    'potassium': {
        'patterns': [r'potassium[:\s]*(\d+\.?\d*)', r'k\+?[:\s]*(\d+\.?\d*)'],
        'keywords': ['potassium', 'serum potassium', 'k+'],
        'unit': 'mEq/L',
        'normal_range': '3.6-5.2'
    },
    'crp': {
        'patterns': [
            r'crp[\(\)\s:\|\-]*(\d+\.?\d*)', 
            r'c-reactive\s*protein[\(\)\s:\|\-]*(\d+\.?\d*)',
            r'protein\s*\(crp\)[\(\)\s:\|\-]*(\d+\.?\d*)'
        ],
        'keywords': ['crp', 'c-reactive protein', 'protein (crp)', 'c reactive protein'],
        'unit': 'mg/L',
        'normal_range': '0.0-10.0'
    },
    'hscrp': {
        'patterns': [r'hs-crp[:\s]*(\d+\.?\d*)', r'hs\s*crp[:\s]*(\d+\.?\d*)'],
        'keywords': ['hs-crp', 'hs crp', 'high sensitivity crp'],
        'unit': 'mg/L',
        'normal_range': '0.0-1.0'
    },

    
    'spo2': {
        'patterns': [r'spo2[:\s]*(\d+)', r'oxygen\s*saturation[:\s]*(\d+)'],
        'keywords': ['spo2', 'oxygen saturation'],
        'unit': '%',
        'normal_range': '95.0-100.0'
    },
    'bmi': {
        'patterns': [r'bmi[:\s]*(\d+\.?\d*)', r'body\s*mass\s*index[:\s]*(\d+\.?\d*)'],
        'keywords': ['bmi', 'body mass index'],
        'unit': 'kg/m2',
        'normal_range': '18.5-24.9'
    },
    'systolic': {
        'patterns': [r'(?:systolic|sys|syato|pressure)[\.\(\)\s:\|\-]*(\d+\.?\d*)', r'(\d{2,3})\s*/\s*\d{2,3}'],
        'keywords': ['systolic', 'sys', 'sbp', 'syatotie', 'blood pressure', 'bp'],
        'unit': 'mmHg',
        'normal_range': '90-120'
    },
    'diastolic': {
        'patterns': [r'(?:diastolic|dia|diasto|pressure)[\.\(\)\s:\|\-]*(\d+\.?\d*)', r'\d{2,3}\s*/\s*(\d{2,3})'],
        'keywords': ['diastolic', 'dia', 'dbp', 'diastolie', 'blood pressure', 'bp'],
        'unit': 'mmHg',
        'normal_range': '60-80'
    },
    'blood pressure': {
        'patterns': [r'(\d{2,3})\s*/\s*(\d{2,3})'],
        'keywords': ['reading', 'bp', 'blood pressure'],
        'unit': 'mmHg',
        'normal_range': '90-140' 
    },
    
    
    'rbs': {
        'patterns': [r'rbs[:\s]*(\d+\.?\d*)', r'random\s*blood\s*sugar[:\s]*(\d+\.?\d*)'],
        'keywords': ['rbs', 'random blood sugar'],
        'unit': 'mg/dL',
        'normal_range': '70.0-140.0'
    },
    'ogtt': {
        'patterns': [r'ogtt[:\s]*(\d+\.?\d*)', r'oral\s*glucose\s*tolerance[:\s]*(\d+\.?\d*)'],
        'keywords': ['ogtt', 'oral glucose tolerance'],
        'unit': 'mg/dL',
        'normal_range': '0.0-140.0'
    },

   
    'transferrin_saturation': {
        'patterns': [r'transferrin\s*saturation[:\s]*(\d+\.?\d*)', r'tsat[:\s]*(\d+\.?\d*)'],
        'keywords': ['transferrin saturation', 'tsat'],
        'unit': '%',
        'normal_range': '20.0-50.0'
    },
    'homocysteine': {
        'patterns': [r'homocysteine[:\s]*(\d+\.?\d*)'],
        'keywords': ['homocysteine'],
        'unit': 'umol/L',
        'normal_range': '5.0-15.0'
    },
    'methylmalonic_acid': {
        'patterns': [r'methylmalonic\s*acid[:\s]*(\d+\.?\d*)', r'mma[:\s]*(\d+\.?\d*)'],
        'keywords': ['methylmalonic acid', 'mma'],
        'unit': 'nmol/L',
        'normal_range': '0.0-270.0'
    },

   
    'anti_tpo': {
        'patterns': [r'anti\s*tpo[:\s]*(\d+\.?\d*)', r'thyroid\s*peroxidase\s*antibody[:\s]*(\d+\.?\d*)'],
        'keywords': ['anti-tpo', 'anti tpo', 'thyroid peroxidase'],
        'unit': 'IU/mL',
        'normal_range': '0.0-34.0'
    },
    'trab': {
        'patterns': [r'trab[:\s]*(\d+\.?\d*)', r'thyroid\s*receptor\s*antibody[:\s]*(\d+\.?\d*)'],
        'keywords': ['trab', 'thyroid receptor antibody'],
        'unit': 'IU/L',
        'normal_range': '0.0-1.75'
    },

    
    'non_hdl': {
        'patterns': [r'non\s*[-\s]?hdl[:\s]*(\d+\.?\d*)'],
        'keywords': ['non-hdl', 'non hdl'],
        'unit': 'mg/dL',
        'normal_range': '0.0-130.0'
    },
    'lipoprotein_a': {
        'patterns': [r'lipoprotein\s*\(?a\)?[:\s]*(\d+\.?\d*)', r'lp\s*\(?a\)?[:\s]*(\d+\.?\d*)'],
        'keywords': ['lipoprotein a', 'lipoprotein (a)', 'lp(a)'],
        'unit': 'mg/dL',
        'normal_range': '0.0-30.0'
    },
    'ldl_hdl_ratio': {
        'patterns': [r'ldl\s*/\s*hdl\s*ratio[:\s]*(\d+\.?\d*)', r'risk\s*ratio[:\s]*(\d+\.?\d*)'],
        'keywords': ['ldl/hdl ratio', 'risk ratio'],
        'unit': 'Ratio',
        'normal_range': '0.0-3.5'
    },
    'ldl_small': {
        'patterns': [r'ldl\s*small[:\s\-\|]*(\d+\.?\d*)'],
        'keywords': ['ldl small', 'small ldl', 'small dense ldl'],
        'unit': 'nmol/L',
        'normal_range': '0-162'
    },
    'ldl_medium': {
        'patterns': [r'ldl\s*medium[:\s\-\|]*(\d+\.?\d*)'],
        'keywords': ['ldl medium', 'medium ldl'],
        'unit': 'nmol/L',
        'normal_range': '0-201'
    },

    
    'magnesium': {
        'patterns': [r'magnesium[:\s]*(\d+\.?\d*)', r'mg[:\s]*(\d+\.?\d*)'],
        'keywords': ['magnesium', 'serum magnesium'],
        'unit': 'mg/dL',
        'normal_range': '1.7-2.2'
    },

   
    'ige': {
        'patterns': [r'ige[:\s]*(\d+\.?\d*)', r'immunoglobulin\s*e[:\s]*(\d+\.?\d*)'],
        'keywords': ['ige', 'immunoglobulin e'],
        'unit': 'IU/mL',
        'normal_range': '0.0-100.0'
    },
    'procalcitonin': {
        'patterns': [r'procalcitonin[:\s]*(\d+\.?\d*)', r'pct[:\s]*(\d+\.?\d*)'],
        'keywords': ['procalcitonin', 'pct'],
        'unit': 'ng/mL',
        'normal_range': '0.0-0.5'
    },
    'troponin': {
        'patterns': [r'troponin[:\s]*[it][:\s]*(\d+\.?\d*)', r'troponin[:\s]*(\d+\.?\d*)'],
        'keywords': ['troponin', 'troponin-i', 'troponin-t'],
        'unit': 'ng/mL',
        'normal_range': '0.0-0.04'
    },

   
    'urine_sugar': {
        'keywords': ['urine sugar', 'urine glucose'],
        'result_type': 'qualitative',
        'normal_range': 'Nil'
    },
    'urine_ketones': {
        'keywords': ['urine ketones', 'urine acetone'],
        'result_type': 'qualitative',
        'normal_range': 'Nil'
    },
    'urine_nitrite': {
        'keywords': ['urine nitrite'],
        'result_type': 'qualitative',
        'normal_range': 'Negative'
    },
    'leukocyte_esterase': {
        'keywords': ['leukocyte esterase'],
        'result_type': 'qualitative',
        'normal_range': 'Negative'
    },
    'blood_culture': {
        'keywords': ['blood culture'],
        'result_type': 'qualitative',
        'normal_range': 'No Growth'
    },
    'sputum_culture': {
        'keywords': ['sputum culture'],
        'result_type': 'qualitative',
        'normal_range': 'No Growth'
    },
    'h_pylori': {
        'keywords': ['h. pylori', 'helicobacter pylori'],
        'result_type': 'qualitative',
        'normal_range': 'Negative'
    },
    'lead': {
        'patterns': [r'lead[\s\(\)a-z]*[:\s\-\|]*(\d+\.?\d*)', r'pb[:\s\-\|]*(\d+\.?\d*)'],
        'keywords': ['lead', 'pb'],
        'unit': 'mg/Kg',
        'normal_range': '0.0-2.5'
    },
    'mercury': {
        'patterns': [r'mercury[\s\(\)a-z]*[:\s\-\|]*(\d+\.?\d*)', r'hg[:\s\-\|]*(\d+\.?\d*)'],
        'keywords': ['mercury', 'hg'],
        'unit': 'mg/Kg',
        'normal_range': '0.0-1.0'
    },
    'copper': {
        'patterns': [r'copper[\s\(\)a-z]*[:\s\-\|]*(\d+\.?\d*)', r'cu[:\s\-\|]*(\d+\.?\d*)'],
        'keywords': ['copper', 'cu'],
        'unit': 'mg/Kg',
        'normal_range': '0.0-30.0'
    },
    'cadmium': {
        'patterns': [r'cadmium[\s\(\)a-z]*[:\s\-\|]*(\d+\.?\d*)', r'cd[:\s\-\|]*(\d+\.?\d*)'],
        'keywords': ['cadmium', 'cd'],
        'unit': 'mg/Kg',
        'normal_range': '0.0-1.5'
    },
    'tin': {
        'patterns': [r'tin[\s\(\)a-z]*[:\s\-\|]*(\d+\.?\d*)', r'sn[:\s\-\|]*(\d+\.?\d*)'],
        'keywords': ['tin', 'sn'],
        'unit': 'mg/Kg',
        'normal_range': '0.0-250.0'
    },
    'arsenic': {
        'patterns': [r'arsenic[\s\(\)a-z]*[:\s\-\|]*(\d+\.?\d*)', r'as[:\s\-\|]*(\d+\.?\d*)'],
        'keywords': ['arsenic', 'as'],
        'unit': 'mg/Kg',
        'normal_range': '0.0-1.1'
    },
    'methyl_mercury': {
        'patterns': [r'methyl\s*mercury[:\s\-\|]*(\d+\.?\d*)'],
        'keywords': ['methyl mercury'],
        'unit': 'mg/Kg',
        'normal_range': '0.0-0.25'
    }
}

LAB_TEST_PROFILES = {
    'Complete Blood Count (CBC)': ['hemoglobin', 'rbc', 'hematocrit', 'mcv', 'mch', 'mchc', 'rdw', 'aec', 'esr', 'wbc', 'platelets'],
    'Diabetes Panel': ['fbs', 'ppbs', 'glucose', 'hba1c'],
    'Lipid Profile': ['cholesterol', 'ldl', 'hdl', 'triglycerides', 'vldl'],
    'Iron & Vitamins': ['ferritin', 'iron', 'tibc', 'b12'],
    'Thyroid & Hormones': ['tsh', 'ft3', 'ft4'],
    'Liver & Kidney': ['bilirubin', 'direct_bilirubin', 'indirect_bilirubin', 'alt', 'ast', 'creatinine', 'urea'],
    'Electrolytes & Inflammation': ['sodium', 'potassium', 'crp', 'hscrp'],
    'Physical Markers': ['spo2', 'bmi'],
    'Heavy Metals': ['lead', 'mercury', 'copper', 'cadmium', 'tin', 'arsenic', 'methyl_mercury']
}


DIAGNOSIS_KEYWORDS = {
    'Dimorphic hemmorhoids(piles)': ['piles', 'hemorrhoids', 'haemorrhoids', 'fissure', 'anal canal'],
    'Anemia': ['anemia', 'anaemia', 'low hb', 'pallor'],
    'Diabetes ': ['diabetes', 'dm type', 'hyperglycemia', 'high sugar'],
    'Jaundice': ['jaundice', 'icterus', 'hyperbilirubinemia'],
    'Hypertension ': ['hypertension', 'htn', 'high bp'],
    'Urinary tract infection': ['uti', 'urinary infection', 'cystitis', 'urinary tract infection'],
    'Hypothyroidism': ['hypothyroidism', 'low thyroid'],
    'Acute Inflammatory State': ['inflammatory state', 'active inflammation', 'sepsis'],
    'Severe Infection/Inflammation': ['severe infection', 'systemic inflammation'],
    'Hyperlipidemia': ['hyperlipidemia', 'high cholesterol', 'high triglycerides', 'dyslipidemia', 'lipid panel abnormal'],
    'Malaria': ['malaria', 'mp seen', 'plasmodium', 'malaria parasite', 'falciparum', 'vivax'],
    'Heart Disease Risk': ['heart disease', 'cardio', 'coronary', 'myocardial', 'ischemia', 'st-segment', 'troponin high']
}


def extract_text_from_image(image_bytes: bytes) -> str:
    """Extracts text from an image with advanced pre-processing to improve accuracy."""
    try:
        from PIL import Image, ImageOps, ImageFilter
        image = Image.open(io.BytesIO(image_bytes))
        
        
        if image.mode != 'RGB':
            image = image.convert('RGB')
            
       
        width, height = image.size
        image = image.resize((width * 2, height * 2), Image.Resampling.LANCZOS)
        
       
        image = ImageOps.grayscale(image)
        
        
        image = ImageOps.autocontrast(image)
        image = image.filter(ImageFilter.SHARPEN)
        
       
        text = ""
        for psm in [3, 6]:
            custom_config = f'--oem 3 --psm {psm}'
            try:
                current_text = pytesseract.image_to_string(image, config=custom_config)
                if len(current_text.strip()) > 50: 
                    text = current_text
                    break
                if not text:
                    text = current_text
            except:
                continue
                
        return text.lower()
    except Exception as e:
        print(f"OCR Error (Image): {e}")
        return ""


def extract_text_from_pdf(pdf_bytes: bytes) -> str:
    """Extracts text from a PDF with fallback to pypdf if Poppler is missing."""
    full_text = ""
    
    
    try:
        from pdf2image import convert_from_bytes
        from pdf2image.exceptions import PDFInfoNotInstalledError
        images = convert_from_bytes(pdf_bytes)
        
        for image in images:
            img_byte_arr = io.BytesIO()
            image.save(img_byte_arr, format='PNG')
            page_text = extract_text_from_image(img_byte_arr.getvalue())
            full_text += page_text + "\n"
        return full_text.lower()
        
    except (ImportError, Exception) as e:
       
        is_poppler_error = "Poppler not installed" in str(e) or "PDFInfoNotInstalledError" in str(type(e))
        
        if is_poppler_error:
            print("Warning: Poppler not found. Falling back to pypdf.")
        else:
            print(f"Warning: pdf2image failed ({e}). Falling back to pypdf.")

   
    try:
        import pypdf
        reader = pypdf.PdfReader(io.BytesIO(pdf_bytes))
        
       
        for page in reader.pages:
            text = page.extract_text()
            if text:
                full_text += text + "\n"
        
       
        if len(full_text.strip()) < 50:
             print("Low text content in PDF. Attempting to extract images via pypdf...")
             for page in reader.pages:
                 for image_file_object in page.images:
                     data = image_file_object.data
                     ocr_text = extract_text_from_image(data)
                     full_text += ocr_text + "\n"
                     
        return full_text.lower() if full_text else "[ERROR: PDF_READ_FAILED]"
        
    except Exception as e:
        print(f"OCR Error (Fallback pypdf): {e}")
        return ""


def normalize_numeric_string(s: str) -> str:
    """Corrects common OCR misreads in numeric strings."""
    if not s:
        return ""
        
   
    s = s.strip().lower()
    for noise in ['|', ':', '=', '[', ']', '(', ')', '/', '\\', '_']:
        s = s.replace(noise, '')
    
    if not any(char.isdigit() for char in s):
        return ""

   
    replacements = {
        's': '5', 'b': '8',
        'i': '1', 'l': '1',
        'o': '0'
    }
    
    # Specific fix for 'o' being a '9' (often happens in 90, 94)
    if s.startswith('o') and len(s) > 1 and s[1].isdigit():
        s = '9' + s[1:]
    
    # NEW: Handle lead digit misreads (4->1, 3->1) common in some fonts for BP
    # If we have a 3-digit number starting with 4 or 3 followed by 2 or 3, it's likely 12x or 13x
    if len(s) == 3:
        if s.startswith('4') and s[1] in '23':
            s = '1' + s[1:]
        elif s.startswith('3') and s[1] in '23':
            s = '1' + s[1:]
            
    digit_count = sum(1 for c in s if c.isdigit())
    if digit_count > 0:
        for old, new in replacements.items():
            s = s.replace(old, new)
            
    return s

    
    
    # OCR Noise Cleanup - handle common misreads in numbers
    # If a string has letters/noise between digits, it's likely a decimal (e.g., '3-32' -> '3.32', '2a5' -> '2.5')
    if re.search(r'\d+[^\d\.]\d+', result):
         result = re.sub(r'(\d+)[^\d\.](\d+)', r'\1.\2', result)
    
    # Generic cleanup of leading/trailing non-numeric noise
    match = re.search(r'(\d+\.?\d*)', result)
    if match:
        return match.group(1)
    
    return ""

def mask_reference_ranges(text: str) -> str:
    # 1. Mask Dates (common source of misreads like the '22' in '22/Apr')
    # More aggressive for numeric dates like 24/12/2012 - completely remove them
    date_pattern = r'\d{1,2}[\/\-\.\s](?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec|[a-z]{3,10})[\/\-\.\s]\d{2,4}'
    iso_date_pattern = r'\d{4}[\/\-\.\s]\d{1,2}[\/\-\.\s]\d{1,2}'
    numeric_date_pattern = r'\d{1,4}[\/\-\.]\d{1,2}[\/\-\.]\d{1,4}'
    
    text = re.sub(date_pattern, ' [DATE_MASKED] ', text, flags=re.IGNORECASE)
    text = re.sub(iso_date_pattern, ' [DATE_MASKED] ', text)
    text = re.sub(numeric_date_pattern, ' ', text) # Completely remove numeric dates
    
    range_pattern = r'(\d+\.?\d*)\s*(?:[:\-\u2013\u2014]| to )\s*(\d+\.?\d*)'
    
    
    ref_keywords = ['range', 'reference', 'biological', 'ref', 'limit', 'normal', 'interval']
    
    lines = text.split('\n')
    masked_lines = []
    
    for line in lines:
        line_lower = line.lower()
        processed_line = line
        
       
        processed_line = re.sub(range_pattern, ' [RANGE_MASKED] ', processed_line)
        
       
        for kw in ref_keywords:
            kw_match = re.search(r'(?<![a-z])' + re.escape(kw) + r'(?![a-z])', line_lower)
            if kw_match:
                start = kw_match.start()
               
                tail = processed_line[start:]
                masked_tail = re.sub(r'(\d+\.?\d*)', '[REF_VAL]', tail)
                processed_line = processed_line[:start] + masked_tail
                break
                
        masked_lines.append(processed_line)
        
    return "\n".join(masked_lines)

def parse_lab_values(text: str) -> list:
    
    results = []
    text_lower = text.lower()
    
   
    for disease, keywords in DIAGNOSIS_KEYWORDS.items():
        for kw in keywords:
          
            if re.search(r'(?<![a-z])' + re.escape(kw) + r'(?![a-z])', text_lower):
                results.append({
                    'test_name': 'Clinical Finding',
                    'value': disease.strip(),
                    'unit': 'Detected',
                    'reference_range': 'Nil',
                    'is_abnormal': True,
                    'is_diagnosis': True  
                })
                break

    
    cleaned_text = text.replace('|', ' ').replace('[', ' ').replace(']', ' ')
    with open("d:\\disease prediction\\backend\\ocr_debug.txt", "w", encoding="utf-8") as f:
        f.write(cleaned_text)
    lines = [line.strip() for line in cleaned_text.split('\n') if line.strip()]
    
    found_tests = set()
    debug_log = []

    for i, line in enumerate(lines):
        line_lower = line.lower()
        
        for test_key, config in LAB_TEST_PATTERNS.items():
            if test_key in found_tests:
                continue
            
           
            if test_key == 'glucose' and ('fbs' in found_tests or 'ppbs' in found_tests):
                continue

            match_found = False
            found_keyword = ""
            for keyword in config.get("keywords", []):
                keyword = keyword.lower()
                # Use word boundaries to avoid matching keywords inside other words (e.g., 'ast' in 'east')
                if re.search(r'\b' + re.escape(keyword) + r'\b', line_lower):
                    # TRACE: Match found
                    with open("d:\\disease prediction\\backend\\engine_debug.txt", "a", encoding="utf-8") as f:
                        f.write(f"  MATCH FOUND: {test_key} | kw: {keyword} | line: {line}\n")
                        
                    # NEVER skip BP as a header, it's often in table headers
                    if test_key not in ["systolic", "diastolic", "blood pressure"]:
                        header_indicators = ["profile", "panel", "lab", "report", "history", "summary", "metadata", "date"]
                        if any(ind in line_lower for ind in header_indicators if ind not in keyword) and len(line_lower.split()) > 5:
                            continue # Skip likely header line
                        
                    match_found = True
                    found_keyword = keyword
                    break
            
            if match_found:
                # Get next 6 lines (increased range for tables)
                context_lines = lines[i:min(i+7, len(lines))]
                search_area = " ".join(context_lines).lower()
                
                # PRE-PROCESSING: Normalize common OCR noise in search area to help regexes
                # Handle '3-32' -> '3.32', '2a5' -> '2.5'
                search_area = re.sub(r'(\d+)[^0-9\.](\d+)', r'\1.\2', search_area)
                
                search_area_masked = mask_reference_ranges(search_area)
                
               
                keyword_match_raw = re.search(re.escape(found_keyword.lower()), search_area)
                keyword_match_masked = re.search(re.escape(found_keyword.lower()), search_area_masked)
                
                if not keyword_match_raw or not keyword_match_masked:
                    continue
                
                remaining_text_masked = search_area_masked[keyword_match_masked.end():]
                remaining_text_raw = search_area[keyword_match_raw.end():]
                
               
                if config.get('result_type') == 'qualitative':
                   
                    qual_terms = ['sensitive', 'resistant', 'negative', 'positive', 'nil', 
                                 'trace', 'detected', 'not detected', 'reactive', 'non reactive', 
                                 'normal', 'abnormal', 'present', 'absent', 'growth', 'no growth']
                    qual_terms.sort(key=len, reverse=True)
                    
                   
                    search_scope = remaining_text_raw.split('\n')[0]
                    
                    found_term = None
                    for term in qual_terms:
                        
                        pattern = r'(?<![a-z])' + re.escape(term) + r'(?![a-z])'
                        match = re.search(pattern, search_scope)
                        
                       
                        if match and match.start() < 10:
                            found_term = term.title()
                            break
                            
                    if found_term:
                      
                        normal_val = config.get('normal_range', '').lower()
                        is_abnormal = found_term.lower() != normal_val and normal_val != ''
                        
                        results.append({
                            'test_name': test_key.replace('_', ' ').title(),
                            'value': found_term, 
                            'unit': '',
                            'reference_range': config.get('normal_range', ''),
                            'is_abnormal': is_abnormal
                        })
                        found_tests.add(test_key)
                    continue

               
                base_unit = config.get('unit', '').lower()
                all_units = [base_unit] + [v.lower() for v in config.get('unit_variations', [])]
                all_units = [u for u in all_units if u] 
                
                unit_found = False
                for unit in all_units:
                    if unit_found: break
                    
                   
                    unit_pattern = r'(\d+\.?\d*)\s*[a-z/]*\s*' + re.escape(unit)
                   
                    unit_match = re.search(unit_pattern, remaining_text_masked[:50])
                   
                    if not unit_match:
                        unit_match = re.search(unit_pattern, remaining_text_raw[:50])
                        
                    if unit_match:
                        
                        if '[RANGE_MASKED]' not in unit_match.group(0):
                            try:
                                value = float(unit_match.group(1))
                                if 0 <= value < 10000:
                                    res_obj = create_result_object(test_key, value, config)
                                    if res_obj:
                                        results.append(res_obj)
                                        found_tests.add(test_key)
                                        unit_found = True
                                        continue
                            except:
                                pass
                
                if unit_found:
                    continue

               
                value_found = False
                generic_patterns = [
                    r'^[:\s\-\|=\|]*(\d+\.?\d*)',  
                    r'[:\s\-\|=\|]+(\d+\.?\d*)',   
                ]
                
               
                for pattern in config.get('patterns', []):
                   
                    match = re.search(pattern, remaining_text_masked[:50])
                    if match:
                        try:
                            raw_val = match.group(1) if match.groups() else match.group(0)
                           
                            if 'MASKED' in raw_val or 'REF' in raw_val:
                                continue
                            norm_string = normalize_numeric_string(raw_val)
                            if norm_string:
                                value = float(norm_string)
                                # Sanity check: Lab values (except maybe some large counts) are rarely > 1,000,000
                                # This prevents phone numbers or long IDs from being read as lab results
                                if 0 <= value < 1000000:
                                    res_obj = create_result_object(test_key, value, config)
                                    if res_obj:
                                        results.append(res_obj)
                                    found_tests.add(test_key)
                                    value_found = True
                                    break
                        except:
                            continue
                
                if value_found: continue

              
                for pattern in generic_patterns:
                    match = re.search(pattern, remaining_text_masked[:50])
                    if match:
                        try:
                           
                            if 'MASKED' in match.group(1) or 'REF' in match.group(1):
                                continue
                            value = float(match.group(1))
                            if 0 <= value < 10000:
                                res_obj = create_result_object(test_key, value, config)
                                if res_obj:
                                    results.append(res_obj)
                                found_tests.add(test_key)
                                value_found = True
                                break
                        except:
                            continue
                
                if value_found: continue

               
                tokens = re.split(r'[:\s;|=,\*\(\)\[\]]+', remaining_text_masked)
                valid_values = []
                for token in tokens:
                    token = token.strip()
                    if not token: continue
                    norm_string = normalize_numeric_string(token)
                    if not norm_string: continue
                    try:
                        val = float(norm_string)
                        if 0 <= val < 10000 and val not in [2025, 2026]:
                            valid_values.append(val)
                    except:
                        continue
                
                # DEBUG LOG
                debug_log.append(f"Test: {test_key}, Found at: {line}, Context numbers: {valid_values}")
                with open("d:\\disease prediction\\backend\\engine_debug.txt", "a", encoding="utf-8") as debug_f:
                    debug_f.write(f"OCR TRACE: {test_key} | context: {line} | nums: {valid_values}\n")

                if valid_values:
                    # HEURISTIC: Choose the most plausible value
                    chosen_val = valid_values[0]
                    
                    # BP HEURISTIC: Definitive table logic for [Systolic, Diastolic, Pulse]
                    if (test_key == 'systolic' or test_key == 'diastolic') and len(valid_values) >= 2:
                        sy = valid_values[0]
                        di = valid_values[1]
                        
                        # Correct Systolic if it's in the 400s/200s (OCR common error)
                        if sy > 220:
                            s_str = str(int(sy))
                            if s_str.startswith('4') or s_str.startswith('2'):
                                sy = float('1' + s_str[1:])
                        
                        # Correct Diastolic if it's a single digit (misread 70, 80, 90)
                        if di < 20 and sy > 100:
                            if di == 7: di = 70.0
                            elif di == 8: di = 80.0
                            elif di == 9: di = 90.0

                        if test_key == 'systolic':
                            chosen_val = sy
                        else:
                            chosen_val = di
                    
                    elif test_key == 'diastolic' and 'systolic' in found_tests and len(valid_values) > 1:
                        chosen_val = valid_values[1]
                    elif test_key == 'systolic' and len(valid_values) > 1:
                        if 90 <= valid_values[1] <= 200 and valid_values[0] < 90:
                            chosen_val = valid_values[1]

                    res_obj = create_result_object(test_key, chosen_val, config)
                    if res_obj:
                        results.append(res_obj)
                        found_tests.add(test_key)
                        continue

               
                if not value_found:
                    vertical_limit = min(i + 150, len(lines))
                    for j in range(i + 1, vertical_limit):
                        next_line = lines[j].lower()
                        
                        found_in_v = False
                        for unit in all_units:
                          
                            v_pattern = r'(\d+\.?\d*)\s*(?:[a-z/]*\s*)?' + re.escape(unit)
                            v_match = re.search(v_pattern, next_line)
                            
                            if v_match:
                                try:
                                    value = float(v_match.group(1))
                                    if 0 <= value < 10000:
                                        res_obj = create_result_object(test_key, value, config)
                                        if res_obj:
                                            results.append(res_obj)
                                        found_tests.add(test_key)
                                        found_in_v = True
                                        break
                                except: pass
                                
                          
                            if not found_in_v:
                                unit_only_pattern = r'(?<![a-z0-9])' + re.escape(unit) + r'(?![a-z0-9])'
                                if re.search(unit_only_pattern, next_line):
                                    prev_line = lines[j-1] if j > 0 else ""
                                   
                                    n_match = re.search(r'(\d+\.?\d*)', prev_line)
                                    if n_match:
                                        try:
                                            value = float(n_match.group(1))
                                            res_obj = create_result_object(test_key, value, config)
                                            if res_obj:
                                                results.append(res_obj)
                                            found_tests.add(test_key)
                                            found_in_v = True
                                            break
                                        except: pass

                        if found_in_v:
                            value_found = True
                            break

    return results

def create_result_object(test_key, value, config):
    """Helper to build a standardized result object."""
    
    # Strict range check for Blood Pressure
    if test_key in ['systolic', 'blood pressure', 'diastolic']:
        # Allow values down to 10 so recovery rules can handle them
        if value < 10 or value > 250:
            return None

    if test_key == 'hba1c' and value > 20:
        value = value / 10.0

    normal_range = config.get('normal_range', '0-1000')
    is_abnormal = False
    try:
        parts = normal_range.split('-')
        min_val = float(parts[0])
        max_val = float(parts[1])
        is_abnormal = value < min_val or value > max_val
    except:
        pass
        
    return {
        'test_name': test_key.replace('_', ' ').title(),
        'value': value,
        'unit': config.get('unit', ''),
        'reference_range': f"{normal_range} {config.get('unit', '')}",
        'is_abnormal': is_abnormal
    }


def process_lab_report(file_bytes: bytes, content_type: str) -> dict:
    
    extracted_text = ""
    
    if 'pdf' in content_type.lower():
        extracted_text = extract_text_from_pdf(file_bytes)
    elif 'image' in content_type.lower() or 'jpeg' in content_type.lower() or 'png' in content_type.lower():
        extracted_text = extract_text_from_image(file_bytes)
    
    if not extracted_text:
        return {
            'success': False,
            'is_simulated': False,
            'message': 'Could not extract text from the report. Please ensure the file is a clear image.',
            'results': []
        }
    
    if "[ERROR: POPPLER_MISSING]" in extracted_text.upper():
        return {
            'success': False,
            'is_simulated': False,
            'message': 'PDF extraction is unavailable because Poppler is not installed on the server. Please upload JPEG/PNG images instead.',
            'results': []
        }
    
    results = parse_lab_values(extracted_text)
    
    if not results:
        return {
            'success': False,
            'is_simulated': False,
            'message': 'No lab values could be detected in the uploaded file. Try manual entry.',
            'results': [],
            'raw_text': extracted_text[:500]  
        }
    
    return {
        'success': True,
        'is_simulated': False,
        'message': f'Successfully extracted {len(results)} lab values',
        'results': results
    }


def simulate_lab_report_processing(filename: str, file_bytes: bytes = None) -> dict:
    """
    Simulates OCR processing by generating pseudo-random but consistent values 
    based on the file content if OCR is not available.
    """
    import hashlib
    import random
    
    
    if file_bytes:
        seed = int(hashlib.md5(file_bytes).hexdigest(), 16) % (2**32)
        random.seed(seed)
    else:
        
        seed = int(hashlib.md5(filename.encode()).hexdigest(), 16) % (2**32)
        random.seed(seed)
    
   
    profile_names = list(LAB_TEST_PROFILES.keys())
    num_profiles = random.randint(1, 2)
    selected_profiles = random.sample(profile_names, num_profiles)
    
    selected_keys = []
    for profile in selected_profiles:
        selected_keys.extend(LAB_TEST_PROFILES[profile])
    
   
    selected_keys = list(set(selected_keys))
    
    results = []
    for test_key in selected_keys:
        config = LAB_TEST_PATTERNS[test_key]
        norm_range = config['normal_range']
        try:
            min_norm, max_norm = map(float, norm_range.split('-'))
        except:
            min_norm, max_norm = 0, 100
       
        is_abnormal_roll = random.random() < 0.3
        
        if is_abnormal_roll:
           
            if random.random() < 0.5:
                
                factor = random.uniform(0.7, 0.95)
                value = round(min_norm * factor, 1 if min_norm < 10 else 0)
            else:
               
                factor = random.uniform(1.05, 1.4)
                value = round(max_norm * factor, 1 if max_norm < 10 else 0)
        else:
           
            value = round(random.uniform(min_norm, max_norm), 1 if max_norm < 10 else 0)
            
        is_abnormal = value < min_norm or value > max_norm
        
        results.append({
            'test_name': test_key.replace('_', ' ').title(),
            'value': value,
            'unit': config['unit'],
            'reference_range': f"{min_norm} - {max_norm} {config['unit']}",
            'is_abnormal': is_abnormal
        })
    
    return {
        'success': True,
        'is_simulated': True,
        'message': f'OCR failed for "{filename}". Showing simulated values for system validation.',
        'results': results,
        'demo_mode': True
    }
