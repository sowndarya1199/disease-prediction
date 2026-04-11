
import datetime
from typing import Dict, List, Optional
from dataclasses import dataclass


@dataclass
class MealItem:
    name: str
    portion: str
    calories: int
    benefits: str


@dataclass 
class DailyMealPlan:
    early_morning: List[MealItem]
    breakfast: List[MealItem]
    mid_morning_snack: List[MealItem]
    lunch: List[MealItem]
    evening_snack: List[MealItem]
    dinner: List[MealItem]


DISEASE_DIET_GUIDELINES = {
    "Diabetes Mellitus": {
        "focus": "Stable glycemic control with high-fiber vegetarian variety",
        "meal_pattern": "Choice-based healthy interval eating",
        "key_nutrients": ['Fiber', 'Chromium', 'Magnesium', 'Complex Carbs'],
        "early_morning": [
            MealItem("Methi (Fenugreek) water", "1 glass", 10, "Blood sugar regulation"),
            MealItem("Cinnamon water", "1 glass", 5, "Insulin sensitivity support"),
            MealItem("Warm lemon water", "1 glass", 10, "Metabolic wake-up")
        ],
        "breakfast": [
            MealItem("Oats vegetable upma", "1 bowl", 190, "High fiber and steady energy"),
            MealItem("Ragi dosa + chutney", "2 medium", 210, "Complex carbohydrates"),
            MealItem("Vegetable poha (low oil)", "1 plate", 180, "Light and nutritious")
        ],
        "mid_morning_snack": [
            MealItem("Guava (Low GI)", "1 medium", 60, "Fiber and Vitamin C"),
            MealItem("Apple (with skin)", "1 medium", 80, "Pectin and slow glucose release"),
            MealItem("Papaya", "1 bowl", 70, "Digestive health")
        ],
        "lunch": [
            MealItem("2 chapati + dal + vegetable", "1 plate", 340, "Classic balanced plate"),
            MealItem("Brown rice + sambar + salad", "1 plate", 310, "Whole grain and fiber rich"),
            MealItem("Millet roti + veg curry", "1 serving", 290, "Ancient grain benefits")
        ],
        "evening_snack": [
            MealItem("Sprouts salad", "1 cup", 90, "High protein and low GI"),
            MealItem("Roasted chana", "1 cup", 120, "Stable energy crunch"),
            MealItem("Mixed Nuts (small portion)", "5-8 nuts", 70, "Healthy fats")
        ],
        "dinner": [
            MealItem("Vegetable soup + paneer", "1 bowl + 50g", 230, "Low carb high protein"),
            MealItem("Millet-based Khichdi", "1 bowl", 260, "Easy to digest"),
            MealItem("Chapati + sautéed vegetables", "1 set", 220, "Light and heart-healthy")
        ],
        "avoid": ["Sugar", "Maida", "Potato", "Honey", "Sweetened juices"],
        "tips": ["Walk for 15-20 mins after largest meal", "Maintain steady meal timings"]
    },
    "Hypothyroidism": {
        "focus": "Thyroid supportive nutrients and metabolism optimization",
        "meal_pattern": "Nutrient-dense Indian vegetarian tracking",
        "key_nutrients": ['Iodine', 'Selenium', 'Zinc', 'Fiber'],
        "early_morning": [
            MealItem("Warm water", "1 glass", 0, "Hydration focus"),
            MealItem("Lemon water", "1 glass", 10, "Detox and Vitamin C"),
            MealItem("Jeera (Cumin) water", "1 glass", 15, "Digestion boost")
        ],
        "breakfast": [
            MealItem("Ragi dosa", "2 medium", 190, "Calcium and Selenium rich"),
            MealItem("Vegetable upma", "1 plate", 230, "Iodine and fiber support"),
            MealItem("Oats porridge", "1 bowl", 180, "Steady energy")
        ],
        "mid_morning_snack": [
            MealItem("Apple", "1 medium", 80, "Pectin for gut health"),
            MealItem("Orange", "1 medium", 65, "Vitamin C boost"),
            MealItem("Pear", "1 medium", 75, "High fiber")
        ],
        "lunch": [
            MealItem("Chapati + dal + veg", "1 plate", 330, "Clean energy sources"),
            MealItem("Brown rice + sambar", "1 plate", 310, "Metabolism boosting grains"),
            MealItem("Millet roti + sabzi", "1 serving", 290, "Trace mineral support")
        ],
        "evening_snack": [
            MealItem("Selenium-rich Nuts (Brazil nuts/Almonds)", "1 handful", 160, "Direct thyroid support"),
            MealItem("Roasted seeds (Sunflower/Pumpkin)", "1 handful", 140, "Zinc and magnesium"),
            MealItem("Buttermilk", "1 glass", 45, "Probiotic and cooling")
        ],
        "dinner": [
            MealItem("Vegetable soup", "1 large bowl", 130, "Light and non-loading"),
            MealItem("Chapati + veg", "1 set", 210, "Simple and nourishing"),
            MealItem("Khichdi", "1 bowl", 270, "Easy to process")
        ],
        "avoid": ["Raw Cabbage/Cauliflower", "Soya products", "Excessive sugar"],
        "tips": ["Take thyroid medicine on empty stomach", "Increase daily physical activity"]
    },
    "Hyperlipidemia": {
        "focus": "Cholesterol reduction and healthy fat balance",
        "meal_pattern": "Fiber-heavy cardiovascular protocol",
        "key_nutrients": ['Soluble Fiber', 'Omega-3', 'Plant Sterols'],
        "early_morning": [
            MealItem("Garlic water", "1 glass", 5, "Natural lipid reducer"),
            MealItem("Lemon water", "1 glass", 10, "Liver support"),
            MealItem("Flaxseed water", "1 glass", 35, "Omega-3 fatty acids")
        ],
        "breakfast": [
            MealItem("Oats porridge", "1 bowl", 180, "Pectin to lower LDL"),
            MealItem("Vegetable poha", "1 plate", 210, "Low fat and light"),
            MealItem("Idli + sambar", "2 pieces", 200, "Steamed and fermented")
        ],
        "mid_morning_snack": [
            MealItem("Apple", "1 medium", 80, "Soluble fiber source"),
            MealItem("Guava", "1 medium", 60, "Low GI and high fiber"),
            MealItem("Pomegranate", "1 bowl", 95, "Antioxidant rich")
        ],
        "lunch": [
            MealItem("Chapati + dal + veg", "1 plate", 320, "Sodium controlled meal"),
            MealItem("Brown rice + rajma", "1 plate", 340, "High fiber and protein"),
            MealItem("Millet roti + sabzi", "1 serving", 300, "Heart healthy grains")
        ],
        "evening_snack": [
            MealItem("Nuts (Walnuts focus)", "5-7 nuts", 90, "Healthy fats"),
            MealItem("Green tea + roasted chana", "1 cup + 1 small handful", 125, "Antioxidants and fiber"),
            MealItem("Sprouts", "1 cup", 95, "Clinical nutrient load")
        ],
        "dinner": [
            MealItem("Vegetable soup", "1 bowl", 140, "Low calorie evening"),
            MealItem("Salad + paneer", "1 set", 210, "High satiety and nutrient dense"),
            MealItem("Chapati + veg", "1 set", 220, "Standard heart protocol")
        ],
        "avoid": ["Fried food", "Butter/Cheese", "Refined oil", "Red meat (for Regular)"],
        "tips": ["Incorporate flaxseeds into roti dough", "Walk 30 mins briskly daily"]
    },
    "Hypertension": {
        "focus": "Low sodium and High potassium Indian foods",
        "meal_pattern": "DASH-aligned vegetarian track",
        "key_nutrients": ['Potassium', 'Magnesium', 'Calcium', 'Low Sodium'],
        "early_morning": [
            MealItem("Warm lemon water", "1 glass", 10, "Detox and Vit C"),
            MealItem("Jeera water", "1 glass", 15, "Digestion and calm"),
            MealItem("Coconut water", "1 glass", 45, "Excellent natural potassium")
        ],
        "breakfast": [
            MealItem("Vegetable upma", "1 plate", 230, "Fiber and potassium"),
            MealItem("Oats", "1 bowl", 180, "Vascular health"),
            MealItem("Idli", "2 pieces", 120, "Light and low salt")
        ],
        "mid_morning_snack": [
            MealItem("Banana", "1 medium", 100, "Classic potassium boost"),
            MealItem("Orange", "1 medium", 65, "Vitamin C and antioxidants"),
            MealItem("Apple", "1 medium", 80, "Pectin for blood flow")
        ],
        "lunch": [
            MealItem("Low-salt chapati + dal + veg", "1 plate", 310, "Sodium restriction focus"),
            MealItem("Brown rice + sambar", "1 plate", 330, "Clean grains"),
            MealItem("Millet roti + veg", "1 serving", 290, "Magnesium support")
        ],
        "evening_snack": [
            MealItem("Roasted chana", "1 cup", 120, "Low sodium crunch"),
            MealItem("Fresh Fruits bowl", "1 bowl", 85, "Natural hydration"),
            MealItem("Buttermilk (No salt)", "1 glass", 45, "Cooling and probiotic")
        ],
        "dinner": [
            MealItem("Vegetable soup", "1 bowl", 130, "Light cardio-friendly end"),
            MealItem("Khichdi (Low salt)", "1 bowl", 260, "Easy and calming"),
            MealItem("Chapati + veg", "1 set", 210, "Satiety without pressure load")
        ],
        "avoid": ["Pickles/Papad", "Stored salty snacks", "Table salt", "Coffee (late evening)"],
        "tips": ["Use rock salt sparingly", "Add more herbs like garlic/black pepper for flavor"]
    },
    "Anemia / Iron Deficiency": {
        "focus": "Iron optimization and clinical ferritin support",
        "meal_pattern": "High iron availability protocol",
        "key_nutrients": ['Iron', 'Vitamin C', 'Folate', 'B12'],
        "early_morning": [
            MealItem("Lemon water + soaked raisins", "1 glass + 10 pcs", 90, "Vit C + Iron combo"),
            MealItem("Beetroot juice", "1 glass", 75, "Natural hemoglobin booster"),
            MealItem("Dates + warm water", "3 dates + 1 glass", 95, "Instant iron and energy")
        ],
        "breakfast": [
            MealItem("Spinach (Palak) chilla", "2 medium", 240, "Iron from leafy greens"),
            MealItem("Ragi dosa", "2 small", 210, "Calcium and iron balance"),
            MealItem("Vegetable paratha (Methi/Spinach focus)", "1 serving", 260, "High fiber iron breakfast")
        ],
        "mid_morning_snack": [
            MealItem("Pomegranate", "1 bowl", 95, "Direct iron boost"),
            MealItem("Apple", "1 medium", 80, "Natural minerals"),
            MealItem("Guava (for Vit C)", "1 medium", 60, "Aids iron absorption")
        ],
        "lunch": [
            MealItem("Chapati + palak dal + beetroot", "1 plate", 370, "Maximized iron intake"),
            MealItem("Rice + rajma + salad", "1 plate", 360, "High protein and iron"),
            MealItem("Millet roti + veg", "1 serving", 310, "Natural trace minerals")
        ],
        "evening_snack": [
            MealItem("Roasted chana + jaggery", "1 cup + 1 small cube", 150, "Traditional iron duo"),
            MealItem("Sprouts", "1 bowl", 95, "Rich in folate and vit C"),
            MealItem("Nuts (Walnuts/Cashews)", "1 handful", 170, "Healthy fats and minerals")
        ],
        "dinner": [
            MealItem("Vegetable khichdi", "1 bowl", 290, "Mild and nourishing"),
            MealItem("Chapati + veg", "1 set", 220, "Sustained nutrition"),
            MealItem("Soup + salad", "1 set", 160, "Light and hydration rich")
        ],
        "avoid": ["Tea/Coffee with food", "Calcium tablets at mealtime"],
        "tips": ["Eat iron foods and Vit C foods together", "Cook in iron tawa"]
    },
    "GERD": {
        "focus": "Low acid, alkaline-forming, soothing foods",
        "meal_pattern": "Reflux-prevention sequence",
        "key_nutrients": ['Bland diet', 'Antacids', 'Hydration'],
        "early_morning": [
            MealItem("Warm water", "1 glass", 0, "Digestive calm"),
            MealItem("Jeera water", "1 glass", 15, "Acid neutralization"),
            MealItem("Aloe vera juice", "1 shot", 20, "Soothes esophagus")
        ],
        "breakfast": [
            MealItem("Oats (made with water/low-fat milk)", "1 bowl", 185, "Safe high fiber"),
            MealItem("Idli", "2 pieces", 120, "Safe fermented choice"),
            MealItem("Dalia (Broken wheat porridge)", "1 bowl", 190, "Bland and filling")
        ],
        "mid_morning_snack": [
            MealItem("Papaya", "1 bowl", 70, "Natural digestive enzymes"),
            MealItem("Banana", "1 medium", 100, "Natural antacid fruit"),
            MealItem("Apple", "1 medium", 80, "Safe fiber")
        ],
        "lunch": [
            MealItem("Chapati + dal", "1 plate", 310, "Safe and clean"),
            MealItem("Rice + curd", "1 plate", 270, "Probiotic and cooling"),
            MealItem("Khichdi (non-spicy)", "1 bowl", 280, "Clinical comfort food")
        ],
        "evening_snack": [
            MealItem("Herbal tea (Chamomile/Ginger)", "1 cup", 5, "Calming for stomach"),
            MealItem("Buttermilk (strictly non-acidic)", "1 glass", 45, "Cooling"),
            MealItem("Whole Fruits", "1 piece", 75, "Steady energy")
        ],
        "dinner": [
            MealItem("Vegetable soup (clear)", "1 bowl", 110, "Light and non-trigger"),
            MealItem("Soft khichdi", "1 bowl", 260, "Easy to process"),
            MealItem("Steamed vegetables", "1 bowl", 140, "Minimal acid load")
        ],
        "avoid": ["Chilli", "Citrus", "Chocolate", "Peppermint", "Deep fried food"],
        "tips": ["Eat small portions", "Sit upright for 2h after dinner", "Drink water between meals"]
    },
    "Jaundice / Liver Dysfunction": {
        "focus": "Liver recovery and toxin flushing",
        "meal_pattern": "Energy rich, low fat, hydrated track",
        "key_nutrients": ['Complex Carbs', 'Electrolytes', 'Low Protein'],
        "early_morning": [
            MealItem("Lemon water", "1 glass", 10, "Flushes liver"),
            MealItem("Sugarcane juice (Hygienic)", "1 glass", 120, "Rapid glucose for liver repair"),
            MealItem("Coconut water", "1 glass", 45, "Electrolyte balance")
        ],
        "breakfast": [
            MealItem("Idli", "2 pieces", 120, "Light and steamed"),
            MealItem("Dalia", "1 bowl", 190, "Bland carbohydrate support"),
            MealItem("Fruit bowl", "1 bowl", 130, "Clean energy focus")
        ],
        "mid_morning_snack": [
            MealItem("Papaya", "1 bowl", 70, "Digestive enzyme help"),
            MealItem("Banana", "1 medium", 100, "Potassium and energy"),
            MealItem("Apple", "1 medium", 80, "Easy hydration")
        ],
        "lunch": [
            MealItem("Rice + dal", "1 plate", 320, "Simple recovery meal"),
            MealItem("Khichdi", "1 bowl", 280, "Standard clinical recovery"),
            MealItem("Chapati + veg (bland)", "1 plate", 290, "Light energy")
        ],
        "evening_snack": [
            MealItem("Coconut water", "1 glass", 45, "Cooling and hydrating"),
            MealItem("Fresh Fruit juice", "1 glass", 90, "Quick vitamins"),
            MealItem("Buttermilk", "1 glass", 45, "Light probiotic")
        ],
        "dinner": [
            MealItem("Khichdi", "1 bowl", 270, "Standard safe dinner"),
            MealItem("Vegetable soup", "1 bowl", 120, "Minimum burden on liver"),
            MealItem("Light chapati + veg", "1 set", 200, "Clean nutritious end")
        ],
        "avoid": ["Alcohol", "Oil/Fats", "Heavy spices", "Junk food"],
        "tips": ["Rest adequately", "Maintain hygiene to avoid secondary infection"]
    },
    "Asthma": {
        "focus": "Airway immunity and vibration reduction",
        "meal_pattern": "Warming and anti-inflammatory track",
        "key_nutrients": ['Vitamin C', 'Omega-3', 'Zinc', 'Antioxidants'],
        "early_morning": [
            MealItem("Turmeric milk", "1 glass", 140, "Curcumin for inflammation"),
            MealItem("Ginger tea", "1 cup", 25, "Anti-inflammatory and warming"),
            MealItem("Warm water", "1 glass", 0, "Proper hydration")
        ],
        "breakfast": [
            MealItem("Idli", "2 pieces", 120, "Safe steamed protein"),
            MealItem("Oats", "1 bowl", 185, "Healthy fiber"),
            MealItem("Upma", "1 plate", 230, "Steady energy")
        ],
        "mid_morning_snack": [
            MealItem("Orange", "1 piece", 65, "Vitamin C boost"),
            MealItem("Apple", "1 medium", 80, "Lung health support"),
            MealItem("Guava", "1 medium", 60, "Immune system help")
        ],
        "lunch": [
            MealItem("Chapati + dal + veg", "1 plate", 330, "Clean and balanced"),
            MealItem("Rice + sambar", "1 plate", 310, "Warm comforting meal"),
            MealItem("Millet roti", "1 set", 240, "Trace minerals and fiber")
        ],
        "evening_snack": [
            MealItem("Herbal tea (Tulsi focus)", "1 cup", 5, "Soothes the airways"),
            MealItem("Nuts (Walnuts focal)", "5-7 nuts", 110, "Anti-inflammatory fats"),
            MealItem("Roasted chana", "1 cup", 120, "Protein and crunch")
        ],
        "dinner": [
            MealItem("Soup", "1 bowl", 130, "Light and hydrating"),
            MealItem("Khichdi", "1 bowl", 280, "Warm recovery dinner"),
            MealItem("Chapati + veg", "1 set", 220, "Clean nighttime meal")
        ],
        "avoid": ["Cold water/Ice", "Deep fried things", "Preservatives"],
        "tips": ["Do daily breathing exercises", "Avoid sudden dust or cold exposure"]
    },
    "Dengue / Infections": {
        "focus": "Platelet support and clinical recovery",
        "meal_pattern": "Hyper-hydrated recovery seq",
        "key_nutrients": ['Water', 'Electrolytes', 'Papain', 'Vitamin C'],
        "early_morning": [
            MealItem("Papaya leaf juice", "1 shot", 15, "Traditional platelet support"),
            MealItem("Coconut water", "1 glass", 45, "Natural electrolyte support"),
            MealItem("Lemon water", "1 glass", 10, "Immunity boost")
        ],
        "breakfast": [
            MealItem("Idli", "2 pieces", 120, "Steamed and light"),
            MealItem("Dalia", "1 bowl", 190, "Good energy load"),
            MealItem("Oats", "1 bowl", 185, "Filling and clean")
        ],
        "mid_morning_snack": [
            MealItem("Pomegranate", "1 bowl", 95, "Iron and antioxidants"),
            MealItem("Papaya", "1 bowl", 70, "Platelet support and digestion"),
            MealItem("Apple", "1 medium", 80, "Vital vitamins")
        ],
        "lunch": [
            MealItem("Rice + dal", "1 plate", 320, "Primary energy recovery"),
            MealItem("Khichdi", "1 bowl", 280, "Standard recovery nutrition"),
            MealItem("Chapati + veg", "1 plate", 290, "Mild solid food focus")
        ],
        "evening_snack": [
            MealItem("Coconut water", "1 glass", 45, "Essential hydration"),
            MealItem("Fruit juice (non-acidic)", "1 glass", 95, "Vitamin load"),
            MealItem("Soup", "1 bowl", 120, "Warm and nutrient dense")
        ],
        "dinner": [
            MealItem("Soup", "1 bowl", 130, "Light and hydrating"),
            MealItem("Khichdi", "1 bowl", 270, "Easy digestible energy"),
            MealItem("Light veg", "1 bowl", 110, "Minimal load")
        ],
        "avoid": ["Oily spicy food", "Hard fruits to chew", "Red meat (for Regular) during high fever"],
        "tips": ["Drink 4-5 liters of liquids daily", "Complete bed rest is mandatory"]
    },
    "Migraine": {
        "focus": "Stabilizing blood sugar and avoiding triggers",
        "meal_pattern": "Non-trigger Indian sequence",
        "key_nutrients": ['Magnesium', 'B12', 'Hydration'],
        "early_morning": [
            MealItem("Warm water", "1 glass", 0, "Hydration start"),
            MealItem("Lemon water", "1 glass", 10, "Detox and Vit C"),
            MealItem("Herbal tea (Caffeine free)", "1 cup", 5, "Calming the nerves")
        ],
        "breakfast": [
            MealItem("Oats", "1 bowl", 190, "Steady energy release"),
            MealItem("Upma", "1 plate", 230, "Complex carb focus"),
            MealItem("Idli", "2 pieces", 120, "Cleanest morning fuel")
        ],
        "mid_morning_snack": [
            MealItem("Banana", "1 medium", 100, "High Magnesium source"),
            MealItem("Apple", "1 piece", 80, "Vitamins and hydration"),
            MealItem("Nuts (Almonds)", "5-7 nuts", 120, "Brain healthy fats")
        ],
        "lunch": [
            MealItem("Chapati + veg", "1 plate", 310, "Safe clean lunch"),
            MealItem("Rice + dal", "1 plate", 320, "Steady nutrients"),
            MealItem("Millet roti", "1 set", 240, "Magnesium support")
        ],
        "evening_snack": [
            MealItem("Nuts (Walnuts)", "5-7 nuts", 110, "Omega-3 and Magnesium"),
            MealItem("Herbal tea", "1 cup", 5, "Calm and relax"),
            MealItem("Fruits bowl", "1 bowl", 85, "Slow glucose focus")
        ],
        "dinner": [
            MealItem("Soup", "1 bowl", 120, "Light and warm"),
            MealItem("Khichdi", "1 bowl", 280, "Traditional comforting meal"),
            MealItem("Chapati + veg", "1 set", 220, "Clean nighttime satiety")
        ],
        "avoid": ["Chocolate", "Cheese", "MSG", "Aged foods", "Strong Coffee"],
        "tips": ["Maintain fixed meal times", "Ensure 8 hours of sleep"]
    },
    "Chronic Kidney Disease": {
        "focus": "Low potassium and High quality limited protein",
        "meal_pattern": "Clinical nephro-friendly track",
        "key_nutrients": ['Limited Potassium', 'Limited Phosphorus', 'Fiber'],
        "early_morning": [
            MealItem("Warm water", "1 glass", 0, "Minimal load start"),
            MealItem("Jeera water", "1 glass", 15, "Digestion support")
        ],
        "breakfast": [
            MealItem("Idli", "2 pieces", 120, "Low potassium choice"),
            MealItem("Dalia", "1 bowl", 190, "Fiber and steady energy"),
            MealItem("Oats (made with water)", "1 bowl", 185, "Clean carbohydrate")
        ],
        "mid_morning_snack": [
            MealItem("Apple (without skin if pot. high)", "1 medium", 80, "Low potassium fruit"),
            MealItem("Pear", "1 piece", 75, "Renal-safe fruit option")
        ],
        "lunch": [
            MealItem("Rice + dal (controlled portion)", "1 plate", 350, "Energy and limited protein"),
            MealItem("Chapati + veg (Low pot. vegetables)", "1 plate", 310, "Standard safe meal")
        ],
        "evening_snack": [
            MealItem("Fruits (Safe list)", "1 bowl", 85, "Vitamin support"),
            MealItem("Buttermilk (diluted)", "1 glass", 40, "Clinical hydration")
        ],
        "dinner": [
            MealItem("Soup (Cabbage/Gourd focal)", "1 bowl", 120, "Light nighttime load"),
            MealItem("Khichdi", "1 bowl", 270, "Standard easy processing")
        ],
        "avoid": ["Potatoes/Tomatoes", "Bananas/Oranges", "High protein excess", "Salty snacks"],
        "tips": ["Leach vegetables before cooking to remove potassium", "Strict water limit if prescribed"]
    },
    "Acne": {
        "focus": "Antioxidant and anti-inflammatory skin health",
        "meal_pattern": "Skin-clear Indian vegetarian track",
        "key_nutrients": ['Zinc', 'Vitamin A', 'Vitamin E', 'Fiber'],
        "early_morning": [
            MealItem("Lemon water", "1 glass", 10, "Detox and Vit C"),
            MealItem("Neem water", "1 shot", 15, "Traditional blood purifier")
        ],
        "breakfast": [
            MealItem("Oats + fruits", "1 bowl", 240, "Low glycemic start"),
            MealItem("Idli", "2 pieces", 120, "Light and fermented"),
            MealItem("Upma", "1 plate", 230, "Vitamins and steady energy")
        ],
        "mid_morning_snack": [
            MealItem("Apple", "1 piece", 80, "Pectin and slow glucose"),
            MealItem("Papaya", "1 bowl", 70, "Skin enzymes and vitamins")
        ],
        "lunch": [
            MealItem("Chapati + veg", "1 plate", 320, "Safe and whole grains"),
            MealItem("Rice + dal", "1 plate", 330, "Clean energy and protein")
        ],
        "evening_snack": [
            MealItem("Green tea", "1 cup", 5, "Antioxidants for skin"),
            MealItem("Whole Fruits", "1 piece", 75, "Nutrient rich crunch")
        ],
        "dinner": [
            MealItem("Soup", "1 bowl", 130, "Hydrating end"),
            MealItem("Chapati + veg", "1 set", 220, "Balanced nighttime meal")
        ],
        "avoid": ["Milk/Dairy", "Sugar", "Fried food", "Junk food"],
        "tips": ["Drink 3L water daily", "Don't touch face", "Use tea-tree oil if needed"]
    },
    "Healthy": {
        "focus": "General maintenance of energy and wellness with Indian variety",
        "meal_pattern": "Balanced 3 main meals and 2 snacks",
        "key_nutrients": ['Protein', 'Fiber', 'Vitamins', 'Minerals', 'Healthy Fats'],
        "early_morning": [
            MealItem("Warm water with honey and lemon", "1 glass", 30, "Metabolism wake up"),
            MealItem("Mix of 5-8 soaked nuts (Almonds/Walnuts)", "1 serving", 60, "Essential fats")
        ],
        "breakfast": [
            MealItem("Vegetable Poha / Upma / Idli Sambar", "1 serving", 250, "Classic Indian breakfast")
        ],
        "mid_morning_snack": [
            MealItem("Any seasonal whole fruit", "1 piece", 80, "Natural energy")
        ],
        "lunch": [
            MealItem("2 Rotis + Dal + 1 Veg Curry + Salad + Curd", "1 plate", 380, "The balanced Indian plate")
        ],
        "evening_snack": [
            MealItem("Green Tea or Ginger Tea + 2 Digestive biscuits", "1 set", 100, "Low calorie relaxer")
        ],
        "dinner": [
            MealItem("Vegetable Khichdi + Bowl of vegetables", "1 bowl", 300, "Light and easy")
        ],
        "avoid": ["Refined foods", "Excess sugar/salt", "Packaged snacks"],
        "tips": ["Chew well", "Drink 3 liters of water", "Be active"]
    }
}


VEGETARIAN_SUBSTITUTES = {
    "Chicken Tikka": "Paneer Tikka",
    "Chicken Kadai": "Paneer Matar Kadai",
    "Chicken Curry": "Paneer or Mixed Veg Curry",
    "Chicken soup": "Vegetable and Dal soup",
    "Kozhi Rasam": "Tomato and Pepper Rasam",
    "Fish Curry": "Soya or Paneer Curry",
    "Fish Tikka": "Paneer Tikka",
    "Fish stew": "Mixed Vegetable stew",
    "Egg Bhurji": "Paneer Bhurji",
    "Egg Omelette": "Besan Chilla",
    "Egg sandwich": "Paneer sandwich",
    "Boiled Egg": "Paneer cubes or Tofu",
    "Liver Sauté": "Soya and Mushroom Stir-fry",
    "Mutton Stew": "Mixed Veg and Soya Stew",
}

NON_VEG_DIET_GUIDELINES = {
    "Diabetes Mellitus": {
        "early_morning": [
            MealItem("Methi water", "1 glass", 10, "Blood sugar regulation"),
            MealItem("Cinnamon water", "1 glass", 5, "Insulin sensitivity support"),
            MealItem("Lemon water", "1 glass", 10, "Metabolic wake-up"),
        ],
        "breakfast": [
            MealItem("Oats vegetable upma", "1 bowl", 190, "High fiber and steady energy"),
            MealItem("Boiled eggs (2) + whole wheat toast", "1 serving", 250, "High protein start"),
            MealItem("Ragi dosa + chutney", "2 medium", 210, "Complex carbohydrates"),
        ],
        "mid_morning_snack": [
            MealItem("Guava", "1 medium", 60, "Fiber and Vitamin C"),
            MealItem("Apple", "1 medium", 80, "Pectin and slow glucose release"),
            MealItem("Papaya", "1 bowl", 70, "Digestive health"),
        ],
        "lunch": [
            MealItem("Chapati + dal + veg", "1 plate", 340, "Classic balanced plate"),
            MealItem("Brown rice + grilled chicken + salad", "1 plate", 380, "Lean protein and whole grain"),
            MealItem("Millet roti + fish curry (low oil)", "1 serving", 360, "Omega-3 and complex carbs"),
        ],
        "evening_snack": [
            MealItem("Sprouts", "1 cup", 90, "High protein and low GI"),
            MealItem("Roasted chana", "1 cup", 120, "Stable energy crunch"),
            MealItem("Boiled egg", "1 egg", 78, "Protein boost"),
        ],
        "dinner": [
            MealItem("Vegetable soup + paneer", "1 bowl + 50g", 230, "Low carb high protein"),
            MealItem("Grilled fish + sautéed veg", "1 serving", 310, "Lean omega-3 dinner"),
            MealItem("Chicken soup + salad", "1 bowl + salad", 270, "Light high protein end"),
        ],
    },
    "Prediabetes": {
        "early_morning": [
            MealItem("Cinnamon water", "1 glass", 5, "Insulin sensitivity"),
            MealItem("Lemon water", "1 glass", 10, "Metabolic support"),
        ],
        "breakfast": [
            MealItem("Vegetable poha", "1 plate", 180, "Light and fibrous"),
            MealItem("Egg omelette + toast", "1 serving", 240, "Protein and whole grain"),
            MealItem("Oats", "1 bowl", 185, "Steady energy"),
        ],
        "mid_morning_snack": [
            MealItem("Apple", "1 medium", 80, "Low GI fruit"),
            MealItem("Guava", "1 medium", 60, "Fiber and Vitamin C"),
        ],
        "lunch": [
            MealItem("Brown rice + dal", "1 plate", 310, "Whole grain energy"),
            MealItem("Chapati + chicken (grilled)", "1 plate", 370, "Lean protein and carb balance"),
            MealItem("Millet + fish", "1 serving", 350, "Omega-3 and low GI grains"),
        ],
        "evening_snack": [
            MealItem("Roasted peanuts", "small handful", 120, "Healthy fats"),
            MealItem("Sprouts", "1 cup", 90, "Protein and fiber"),
        ],
        "dinner": [
            MealItem("Vegetable khichdi", "1 bowl", 270, "Comforting and light"),
            MealItem("Chicken soup", "1 bowl", 200, "Lean protein and hydration"),
            MealItem("Paneer + veg", "1 plate", 240, "Vegetarian protein"),
        ],
    },
    "Hypoglycemia": {
        "early_morning": [
            MealItem("Milk + almonds", "1 glass + 5 nuts", 175, "Steady glucose boost"),
        ],
        "breakfast": [
            MealItem("Peanut butter toast", "2 slices", 280, "Sustained energy"),
            MealItem("Egg omelette", "2 eggs", 180, "High protein"),
            MealItem("Upma", "1 plate", 230, "Complex carbs"),
        ],
        "mid_morning_snack": [
            MealItem("Banana", "1 medium", 100, "Quick glucose"),
            MealItem("Dates", "3 pieces", 95, "Natural fast energy"),
        ],
        "lunch": [
            MealItem("Rice + dal", "1 plate", 320, "Energy recovery"),
            MealItem("Chapati + chicken", "1 plate", 370, "Sustained protein and carb"),
            MealItem("Fish + veg", "1 serving", 310, "Lean protein meal"),
        ], 
        "evening_snack": [
            MealItem("Fruits + nuts", "1 bowl + handful", 180, "Energy stability"),
        ],
        "dinner": [
            MealItem("Chapati + paneer", "1 set", 290, "Evening protein"),
            MealItem("Chicken curry", "1 bowl", 340, "Protein and energy"),
            MealItem("Khichdi", "1 bowl", 270, "Easy to digest"),
        ],
    },
    "Hypothyroidism": {
        "early_morning": [
            MealItem("Warm water", "1 glass", 0, "Hydration focus"),
            MealItem("Jeera (Cumin) water", "1 glass", 15, "Digestion boost"),
        ],
        "breakfast": [
            MealItem("Ragi dosa", "2 medium", 190, "Calcium and Selenium rich"),
            MealItem("Eggs + toast", "2 eggs + 2 slices", 290, "Iodine and protein"),
            MealItem("Oats", "1 bowl", 185, "Steady energy"),
        ],
        "mid_morning_snack": [
            MealItem("Apple", "1 medium", 80, "Pectin for gut health"),
            MealItem("Orange", "1 medium", 65, "Vitamin C boost"),
        ],
        "lunch": [
            MealItem("Chapati + dal + veg", "1 plate", 330, "Clean energy sources"),
            MealItem("Brown rice + chicken", "1 plate", 380, "Lean protein and whole grain"),
            MealItem("Fish + veg", "1 serving", 340, "Iodine-rich fish"),
        ],
        "evening_snack": [
            MealItem("Nuts (Selenium-rich)", "1 handful", 160, "Thyroid support"),
            MealItem("Boiled egg", "1 egg", 78, "Protein and iodine"),
        ],
        "dinner": [
            MealItem("Vegetable soup + paneer", "1 bowl + 50g", 210, "Light and non-loading"),
            MealItem("Grilled fish", "1 serving", 250, "Rich in iodine"),
            MealItem("Chapati + veg", "1 set", 210, "Simple and nourishing"),
        ],
    },
    "Hyperthyroidism": {
        "early_morning": [
            MealItem("Lemon water", "1 glass", 10, "Detox and calm"),
        ],
        "breakfast": [
            MealItem("Idli", "2 pieces", 120, "Light and safe"),
            MealItem("Egg + toast", "1 egg + 2 slices", 220, "Calming protein"),
            MealItem("Upma", "1 plate", 230, "Steady energy"),
        ],
        "mid_morning_snack": [
            MealItem("Banana", "1 medium", 100, "Calming potassium"),
        ],
        "lunch": [
            MealItem("Rice + dal", "1 plate", 320, "Energy and calm"),
            MealItem("Chicken curry (light spice)", "1 bowl", 320, "Protein with no triggers"),
            MealItem("Fish + veg", "1 serving", 310, "Lean and easy digest"),
        ],
        "evening_snack": [
            MealItem("Buttermilk", "1 glass", 45, "Cooling and probiotic"),
        ],
        "dinner": [
            MealItem("Khichdi", "1 bowl", 270, "Comforting and light"),
            MealItem("Chicken soup", "1 bowl", 200, "Light protein dinner"),
            MealItem("Paneer + veg", "1 plate", 240, "Balanced nighttime meal"),
        ],
    },
    "Hyperlipidemia": {
        "early_morning": [
            MealItem("Garlic water", "1 glass", 5, "Natural lipid reducer"),
            MealItem("Flaxseed water", "1 glass", 35, "Omega-3 fatty acids"),
        ],
        "breakfast": [
            MealItem("Oats porridge", "1 bowl", 180, "Pectin to lower LDL"),
            MealItem("Egg white omelette (2 whites)", "1 serving", 100, "High protein, zero cholesterol yolk"),
            MealItem("Idli + sambar", "2 pieces", 200, "Steamed and fermented"),
        ],
        "mid_morning_snack": [
            MealItem("Apple", "1 medium", 80, "Soluble fiber"),
        ],
        "lunch": [
            MealItem("Chapati + dal + veg", "1 plate", 320, "Heart-safe meal"),
            MealItem("Grilled fish + veg", "1 serving", 330, "Omega-3 cholesterol management"),
            MealItem("Brown rice + chicken (low oil)", "1 plate", 360, "Lean protein"),
        ],
        "evening_snack": [
            MealItem("Nuts (Walnuts)", "5-7 nuts", 90, "Healthy fats"),
        ],
        "dinner": [
            MealItem("Vegetable soup + salad", "1 bowl", 150, "Heart-friendly end"),
            MealItem("Grilled chicken", "1 serving", 220, "Lean and low fat"),
            MealItem("Paneer + veg", "1 plate", 210, "Clean protein option"),
        ],
    },
    "Obesity": {
        "early_morning": [
            MealItem("Lemon water", "1 glass", 10, "Metabolism boost"),
        ],
        "breakfast": [
            MealItem("Oats", "1 bowl", 185, "High fiber low calories"),
            MealItem("Egg white omelette (2 whites)", "1 serving", 100, "Zero-calorie high protein"),
            MealItem("Fruits bowl", "1 bowl", 130, "Low calorie vitamins"),
        ],
        "mid_morning_snack": [
            MealItem("Papaya", "1 bowl", 70, "Low calorie digestive"),
        ],
        "lunch": [
            MealItem("Chapati + veg (low oil)", "1 plate", 290, "Controlled calorie lunch"),
            MealItem("Grilled chicken + salad", "1 serving", 310, "High protein fat-loss meal"),
            MealItem("Fish + veg (steamed)", "1 serving", 280, "Low fat high protein"),
        ],
        "evening_snack": [
            MealItem("Green tea + boiled egg", "1 cup + 1 egg", 90, "Fat burning and protein"),
        ],
        "dinner": [
            MealItem("Vegetable soup", "1 bowl", 120, "Low calorie hydrating end"),
            MealItem("Paneer (small portion) + salad", "50g + salad", 180, "Protein and fiber"),
            MealItem("Grilled fish + greens", "1 serving", 210, "Clean lean dinner"),
        ],
    },
    "Hypertension": {
        "early_morning": [
            MealItem("Lemon water", "1 glass", 10, "Detox and Vit C"),
            MealItem("Coconut water", "1 glass", 45, "Potassium boost"),
        ],
        "breakfast": [
            MealItem("Upma", "1 plate", 230, "Fiber and potassium"),
            MealItem("Idli", "2 pieces", 120, "Light and low salt"),
            MealItem("Boiled egg (no salt)", "1 egg", 78, "Protein without sodium"),
        ],
        "mid_morning_snack": [
            MealItem("Banana", "1 medium", 100, "Classic potassium boost"),
        ],
        "lunch": [
            MealItem("Chapati + dal + veg (low salt)", "1 plate", 310, "Sodium restriction focus"),
            MealItem("Chicken (low salt, steamed)", "1 serving", 250, "Lean clean protein"),
            MealItem("Fish + veg (steamed)", "1 serving", 280, "Heart-healthy omega-3"),
        ],
        "evening_snack": [
            MealItem("Roasted chana", "1 cup", 120, "Low sodium crunch"),
        ],
        "dinner": [
            MealItem("Vegetable soup", "1 bowl", 130, "Light cardio-friendly end"),
            MealItem("Fish (low salt, grilled)", "1 serving", 220, "Lean and heart-safe"),
            MealItem("Paneer + veg", "1 plate", 210, "Satiety without pressure load"),
        ],
    },
    "Anemia": {
        "early_morning": [
            MealItem("Lemon water + dates", "1 glass + 3 dates", 95, "Vit C + Iron combo"),
        ],
        "breakfast": [
            MealItem("Spinach omelette (2 eggs)", "1 serving", 240, "Iron from both eggs and palak"),
            MealItem("Ragi dosa", "2 small", 210, "Calcium and iron balance"),
            MealItem("Vegetable paratha (Methi/Spinach)", "1 serving", 260, "High fiber iron breakfast"),
        ],
        "mid_morning_snack": [
            MealItem("Pomegranate", "1 bowl", 95, "Direct iron boost"),
        ],
        "lunch": [
            MealItem("Chapati + chicken liver / chicken + spinach", "1 plate", 400, "Highest iron content meal"),
            MealItem("Rice + dal + leafy veg", "1 plate", 360, "Plant iron support"),
        ],
        "evening_snack": [
            MealItem("Boiled egg", "1 egg", 78, "B12 and iron"),
        ],
        "dinner": [
            MealItem("Fish + veg", "1 serving", 280, "Iron rich lean protein"),
            MealItem("Khichdi", "1 bowl", 270, "Mild and nourishing"),
        ],
    },
    "Vitamin B12 Deficiency": {
        "early_morning": [
            MealItem("Milk", "1 glass", 115, "B12 and calcium"),
        ],
        "breakfast": [
            MealItem("Eggs + toast", "2 eggs + 2 slices", 280, "Classic B12 source"),
            MealItem("Upma + curd", "1 plate", 230, "Probiotic and nutrients"),
        ],
        "mid_morning_snack": [
            MealItem("Banana", "1 medium", 100, "Energy and minerals"),
        ],
        "lunch": [
            MealItem("Rice + fish", "1 plate", 380, "B12 and lean protein"),
            MealItem("Chapati + chicken", "1 plate", 370, "Protein for recovery"),
        ],
        "evening_snack": [
            MealItem("Buttermilk", "1 glass", 45, "Probiotic B12 support"),
        ],
        "dinner": [
            MealItem("Paneer", "100g", 180, "Vegetarian B12 source"),
            MealItem("Chicken", "1 serving", 250, "Direct B12 source"),
        ],
    },
    "Multiple Vitamin Deficiencies (B12 & D)": {
        "early_morning": [
            MealItem("Warm milk + soaked almonds", "1 glass + 5 nuts", 175, "Vitamin D from milk"),
        ],
        "breakfast": [
            MealItem("Eggs (2) + whole wheat toast", "1 serving", 280, "B12 powerhouse"),
            MealItem("Vegetable upma + curd", "1 plate", 230, "Probiotic and nutrients"),
        ],
        "mid_morning_snack": [
            MealItem("Banana", "1 medium", 100, "Energy and minerals"),
            MealItem("Buttermilk", "1 glass", 45, "Probiotic B12 support"),
        ],
        "lunch": [
            MealItem("Rice + fish curry", "1 plate", 380, "Highest natural B12 source"),
            MealItem("Chapati + chicken + salad", "1 plate", 370, "Complete amino acid profile"),
        ],
        "evening_snack": [
            MealItem("Sprouts chaat", "1 bowl", 95, "Vitamin and mineral boost"),
        ],
        "dinner": [
            MealItem("Chapati + chicken", "1 set", 340, "B12 and protein"),
            MealItem("Fish + veg", "1 serving", 300, "Omega-3 and B12"),
            MealItem("Paneer + curd", "1 plate", 250, "Calcium and D support"),
        ],
    },
    "GERD": {
        "early_morning": [
            MealItem("Warm water", "1 glass", 0, "Digestive calm"),
        ],
        "breakfast": [
            MealItem("Oats (made with water)", "1 bowl", 185, "Safe high fiber"),
            MealItem("Idli", "2 pieces", 120, "Safe fermented choice"),
            MealItem("Boiled egg (no spice)", "1 egg", 78, "Safe bland protein"),
        ],
        "mid_morning_snack": [
            MealItem("Papaya", "1 bowl", 70, "Natural digestive enzymes"),
        ],
        "lunch": [
            MealItem("Chapati + dal", "1 plate", 310, "Safe and clean"),
            MealItem("Rice + chicken (low spice, no tomato)", "1 plate", 360, "Mild non-veg option"),
        ],
        "evening_snack": [
            MealItem("Herbal tea (Chamomile)", "1 cup", 5, "Calming for stomach"),
        ],
        "dinner": [
            MealItem("Vegetable soup (clear)", "1 bowl", 110, "Light and non-trigger"),
            MealItem("Fish (light, steamed, no spice)", "1 serving", 200, "GERD-safe protein"),
        ],
    },
    "Jaundice": {
        "early_morning": [
            MealItem("Lemon water", "1 glass", 10, "Flushes liver"),
        ],
        "breakfast": [
            MealItem("Idli", "2 pieces", 120, "Light and steamed"),
            MealItem("Dalia", "1 bowl", 190, "Bland carbohydrate support"),
        ],
        "mid_morning_snack": [
            MealItem("Coconut water", "1 glass", 45, "Electrolyte balance"),
        ],
        "lunch": [
            MealItem("Rice + dal", "1 plate", 320, "Simple recovery meal"),
            MealItem("Boiled chicken (light)", "1 serving", 190, "Easy-digest protein"),
        ],
        "evening_snack": [
            MealItem("Fruit juice", "1 glass", 90, "Quick vitamins"),
        ],
        "dinner": [
            MealItem("Khichdi", "1 bowl", 270, "Standard safe dinner"),
            MealItem("Soup", "1 bowl", 120, "Minimum burden on liver"),
        ],
    },
    "Asthma": {
        "early_morning": [
            MealItem("Turmeric milk", "1 glass", 140, "Curcumin for inflammation"),
        ],
        "breakfast": [
            MealItem("Idli", "2 pieces", 120, "Safe steamed food"),
            MealItem("Egg (boiled, no fry)", "1 egg", 78, "Anti-inflammatory protein"),
        ],
        "mid_morning_snack": [
            MealItem("Orange", "1 piece", 65, "Vitamin C boost"),
        ],
        "lunch": [
            MealItem("Chapati + chicken (light)", "1 plate", 360, "Protein and clean carbs"),
            MealItem("Rice + dal", "1 plate", 320, "Warm comforting meal"),
        ],
        "evening_snack": [
            MealItem("Herbal tea (Tulsi)", "1 cup", 5, "Soothes the airways"),
        ],
        "dinner": [
            MealItem("Fish soup (clear)", "1 bowl", 160, "Anti-inflammatory omega-3"),
            MealItem("Khichdi", "1 bowl", 280, "Warm recovery dinner"),
        ],
    },
    "Dengue": {
        "early_morning": [
            MealItem("Papaya leaf juice", "1 shot", 15, "Traditional platelet support"),
        ],
        "breakfast": [
            MealItem("Idli", "2 pieces", 120, "Steamed and light"),
        ],
        "mid_morning_snack": [
            MealItem("Pomegranate", "1 bowl", 95, "Iron and antioxidants"),
        ],
        "lunch": [
            MealItem("Rice + dal", "1 plate", 320, "Primary energy recovery"),
            MealItem("Boiled chicken", "1 serving", 190, "Light protein for immune support"),
        ],
        "evening_snack": [
            MealItem("Coconut water", "1 glass", 45, "Essential hydration"),
        ],
        "dinner": [
            MealItem("Soup", "1 bowl", 160, "Warm and hydrating"),
            MealItem("Khichdi", "1 bowl", 270, "Easy digestible energy"),
        ],
    },
    "Urinary Tract Infection": {
        "early_morning": [
            MealItem("Coconut water", "1 glass", 45, "Hydration and UTI flush"),
        ],
        "breakfast": [
            MealItem("Idli", "2 pieces", 120, "Light and steamed"),
            MealItem("Boiled egg", "1 egg", 78, "Protein without irritants"),
        ],
        "mid_morning_snack": [
            MealItem("Watermelon", "1 bowl", 65, "High water content flush"),
        ],
        "lunch": [
            MealItem("Rice + dal", "1 plate", 320, "Clean energy"),
            MealItem("Chicken (low spice, steamed)", "1 serving", 220, "UTI-safe lean protein"),
        ],
        "evening_snack": [
            MealItem("Lemon water", "1 glass", 10, "Alkalizing flush"),
        ],
        "dinner": [
            MealItem("Vegetable soup", "1 bowl", 120, "Hydrating light end"),
            MealItem("Fish (steamed, no strong spice)", "1 serving", 200, "Clean protein"),
        ],
    },
    "Migraine": {
        "early_morning": [
            MealItem("Warm water", "1 glass", 0, "Hydration start"),
        ],
        "breakfast": [
            MealItem("Oats + egg (boiled)", "1 bowl + 1 egg", 265, "Steady energy and magnesium"),
        ],
        "mid_morning_snack": [
            MealItem("Banana", "1 medium", 100, "High Magnesium source"),
        ],
        "lunch": [
            MealItem("Chapati + fish (omega-3 rich)", "1 plate", 360, "Magnesium and omega-3 anti-trigger"),
            MealItem("Rice + dal", "1 plate", 320, "Steady nutrients"),
        ],
        "evening_snack": [
            MealItem("Nuts (Walnuts)", "5-7 nuts", 110, "Omega-3 and Magnesium"),
        ],
        "dinner": [
            MealItem("Vegetable soup", "1 bowl", 120, "Light and warm"),
            MealItem("Chicken soup (clear, no MSG)", "1 bowl", 190, "Light protein, hydration"),
        ],
    },
    "Anxiety Disorder": {
        "early_morning": [
            MealItem("Warm milk", "1 glass", 115, "Calming tryptophan"),
        ],
        "breakfast": [
            MealItem("Upma + egg (boiled)", "1 plate + 1 egg", 305, "Steady serotonin precursors"),
        ],
        "mid_morning_snack": [
            MealItem("Apple", "1 medium", 80, "Natural calming sugars"),
        ],
        "lunch": [
            MealItem("Chapati + chicken (light spice)", "1 plate", 360, "Tryptophan-rich protein"),
            MealItem("Rice + dal", "1 plate", 320, "Comforting energy"),
        ],
        "evening_snack": [
            MealItem("Herbal tea (Chamomile)", "1 cup", 5, "Natural relaxant"),
        ],
        "dinner": [
            MealItem("Khichdi", "1 bowl", 270, "Comforting and light"),
            MealItem("Fish (steamed)", "1 serving", 220, "Omega-3 for mood support"),
        ],
    },
    "Chronic Kidney Disease": {
        "early_morning": [
            MealItem("Warm water", "1 glass", 0, "Minimal load start"),
        ],
        "breakfast": [
            MealItem("Idli", "2 pieces", 120, "Low potassium choice"),
            MealItem("Dalia", "1 bowl", 190, "Fiber and steady energy"),
        ],
        "mid_morning_snack": [
            MealItem("Apple (without skin)", "1 medium", 80, "Low potassium fruit"),
        ],
        "lunch": [
            MealItem("Rice + dal (controlled portion)", "1 plate", 350, "Energy and limited protein"),
            MealItem("Limited chicken (boiled, no salt)", "1 small serving", 150, "Controlled protein for CKD"),
        ],
        "evening_snack": [
            MealItem("Fruits (Safe list: apple, grapes)", "1 bowl", 85, "Renal-safe vitamins"),
        ],
        "dinner": [
            MealItem("Vegetable soup (Cabbage/Gourd)", "1 bowl", 120, "Light nighttime load"),
            MealItem("Khichdi", "1 bowl", 270, "Standard easy processing"),
        ],
    },
    "Acne": {
        "early_morning": [
            MealItem("Lemon water", "1 glass", 10, "Detox and Vit C"),
        ],
        "breakfast": [
            MealItem("Oats + fruits", "1 bowl", 240, "Low glycemic start"),
        ],
        "mid_morning_snack": [
            MealItem("Apple", "1 piece", 80, "Skin health vitamins"),
        ],
        "lunch": [
            MealItem("Chapati + veg", "1 plate", 320, "Safe and whole grain"),
            MealItem("Fish (optional, steamed)", "1 serving", 200, "Omega-3 for skin"),
        ],
        "evening_snack": [
            MealItem("Green tea", "1 cup", 5, "Antioxidants for skin"),
        ],
        "dinner": [
            MealItem("Vegetable soup", "1 bowl", 120, "Hydrating end"),
            MealItem("Paneer + veg", "1 plate", 210, "Balanced nighttime meal"),
        ],
    },
    "Healthy Individual": {
        "early_morning": [
            MealItem("Warm water", "1 glass", 0, "Metabolism wake up"),
        ],
        "breakfast": [
            MealItem("Idli / eggs / oats (choose 1)", "1 serving", 250, "Classic Indian breakfast"),
        ],
        "mid_morning_snack": [
            MealItem("Fruits", "1 piece", 80, "Natural energy"),
        ],
        "lunch": [
            MealItem("Balanced veg + non-veg", "1 plate", 420, "The balanced Indian plate"),
        ],
        "evening_snack": [
            MealItem("Nuts", "handful", 110, "Healthy fats"),
        ],
        "dinner": [
            MealItem("Light meal", "1 bowl", 280, "Easy and clean"),
        ],
    },
    "Healthy": {
        "early_morning": [
            MealItem("Warm water with honey and lemon", "1 glass", 30, "Metabolism wake up"),
        ],
        "breakfast": [
            MealItem("Idli + eggs + oats (choose 1)", "1 serving", 250, "Classic Indian breakfast"),
        ],
        "mid_morning_snack": [
            MealItem("Seasonal whole fruit", "1 piece", 80, "Natural energy"),
        ],
        "lunch": [
            MealItem("Balanced veg + non-veg (roti/rice + dal + protein)", "1 plate", 420, "The balanced Indian plate"),
        ],
        "evening_snack": [
            MealItem("Nuts or boiled egg", "handful or 1 egg", 110, "Protein snack"),
        ],
        "dinner": [
            MealItem("Light meal (soup / khichdi / grilled protein)", "1 bowl", 280, "Easy and clean"),
        ],
    },
}



def adjust_for_preferences(meal_items: List[MealItem], preference: str) -> List[Dict]:
    """Adjusts list of MealItems based on food preference."""
    adjusted = []
    
    for item in meal_items:
        is_regular_only = "(for Regular)" in item.name or "(for Regular)" in item.benefits

        clean_name = item.name.replace("(for Regular)", "").strip()
        clean_portion = item.portion.replace("(for Regular)", "").strip()
        clean_benefits = item.benefits.replace("(for Regular)", "").strip()

        if preference == "vegetarian":
            if is_regular_only:
                continue 
            
            item_dict = {
                "name": clean_name,
                "portion": clean_portion,
                "calories": item.calories,
                "benefits": clean_benefits
            }
            adjusted.append(item_dict)

        elif preference == "non_vegetarian":
            
            item_dict = {
                "name": clean_name,
                "portion": clean_portion,
                "calories": item.calories,
                "benefits": clean_benefits,
                "is_non_veg": is_regular_only
            }
            adjusted.append(item_dict)
        else:
            item_dict = {
                "name": clean_name,
                "portion": clean_portion,
                "calories": item.calories,
                "benefits": clean_benefits
            }
            adjusted.append(item_dict)

    return adjusted

def generate_diet_recommendation(
    predicted_disease: str,
    abnormal_labs: List[Dict] = None,
    food_preference: str = "none",  
    patient_name: str = "Patient",
    age: int = 40,
    gender: str = "other",
    height: float = 170.0,
    weight: float = 70.0,
    activity_level: str = "moderate",
    **kwargs
) -> Dict:
    
    if abnormal_labs is None:
        abnormal_labs = []
    
   
    h_m = height / 100 if height > 0 else 1.7
    bmi = round(weight / (h_m ** 2), 1) if weight > 0 else 22.0
    
    bmi_category = "Normal"
    if bmi < 18.5: bmi_category = "Underweight"
    elif bmi < 25.0: bmi_category = "Normal"
    elif bmi < 30.0: bmi_category = "Overweight"
    else: bmi_category = "Obese"

    
    if gender.lower() == "male":
        bmr = 10 * weight + 6.25 * height - 5 * age + 5
    else:
        bmr = 10 * weight + 6.25 * height - 5 * age - 161
    
    act_mult = {"sedentary": 1.2, "moderate": 1.4, "active": 1.6}.get(activity_level.lower(), 1.4)
    target_calories = int(bmr * act_mult)

    guidelines = get_disease_guidelines(predicted_disease)
    guidelines = adjust_for_lab_abnormalities(guidelines, abnormal_labs)
    
    def build_plan(pref):
        slots = ["early_morning", "breakfast", "mid_morning_snack", "lunch", "evening_snack", "dinner"]
        times = ["6:30 AM", "8:30 AM", "11:00 AM", "1:30 PM", "4:30 PM", "8:00 PM"]
        plan = {}
        
        for slot, time in zip(slots, times):
           
            pref_items = []
            if pref == "non_vegetarian":
                
                match_name = None
                for d_name in NON_VEG_DIET_GUIDELINES:
                    if d_name.lower() in predicted_disease.lower() or predicted_disease.lower() in d_name.lower():
                        match_name = d_name
                        break
                if match_name:
                    pref_items = NON_VEG_DIET_GUIDELINES[match_name].get(slot, [])
            
            
            source_items = pref_items if pref_items else guidelines.get(slot, [])
            items = adjust_for_preferences(source_items, pref)
            
            
            if not items:
                
                healthy_items = []
                if pref == "non_vegetarian":
                    healthy_items = NON_VEG_DIET_GUIDELINES["Healthy"].get(slot, [])
                
                source_healthy = healthy_items if healthy_items else DISEASE_DIET_GUIDELINES["Healthy"].get(slot, [])
                items = adjust_for_preferences(source_healthy, pref)
            
           
            slot_calories = sum(it.get("calories", 0) for it in items)
            
            plan[slot] = {
                "time": time,
                "items": items,
                "total_calories": slot_calories
            }
        return plan
    
    veg_meal_plan = build_plan("vegetarian")
    non_veg_meal_plan = build_plan("non_vegetarian")

    primary_plan = veg_meal_plan if food_preference == "vegetarian" else non_veg_meal_plan
    
    
    foods_to_avoid = list(set(guidelines.get("avoid", []) + guidelines.get("lab_specific_avoid", [])))
    nutritional_advice = list(set(guidelines.get("tips", []) + guidelines.get("lab_specific_tips", [])))
    
    return {
        "report_title": "Clinical Personalized Diet Plan",
        "patient_name": patient_name,
        "patient_info": {
            "name": patient_name,
            "date": datetime.datetime.now().strftime("%Y-%m-%d"),
            "bmi": bmi,
            "bmi_category": bmi_category,
            "condition": predicted_disease
        },
        "target_condition": predicted_disease,
        "food_preference": "Vegetarian" if food_preference == "vegetarian" else "Non-Vegetarian",
        "key_nutrients": guidelines.get("key_nutrients", []),
        "nutritional_goals": [
            f"Stabilize and manage {predicted_disease} progression",
            f"Achieve daily caloric balance of {target_calories} kcal",
            "Enhance micronutrient profile based on lab findings",
            "Improve lifestyle markers through structured meal timing"
        ],
        "calorie_requirement": {"total_kcal": target_calories},
        "total_daily_calories": sum(slot["total_calories"] for slot in primary_plan.values()),
        "vegetarian_diet_plan": veg_meal_plan,
        "mixed_diet_plan": non_veg_meal_plan,
        "daily_meal_plan": primary_plan,
        "foods_to_avoid": foods_to_avoid,
        "nutritional_advice": nutritional_advice,
        "condition_recommendations": {
            "rationale": f"Focused on {guidelines.get('focus', 'balanced nutrition')}. Optimized for {predicted_disease}.",
        },
        "lifestyle_recommendations": {
            "hydration": "8-10 glasses of water daily",
            "sleep": "7-9 hours of restful sleep",
            "physical_activity": f"{activity_level.title()} activity suited for age and condition"
        },
        "disclaimer": "",
        "is_finalized": False
    }

def get_disease_guidelines(disease: str) -> Dict:
    disease_lower = disease.lower()
    
    if "diabetes" in disease_lower or "sugar" in disease_lower:
        return DISEASE_DIET_GUIDELINES["Diabetes Mellitus"]
    elif "prediabetes" in disease_lower:
        
        return DISEASE_DIET_GUIDELINES.get("Prediabetes", DISEASE_DIET_GUIDELINES["Diabetes Mellitus"])
    elif "obesity" in disease_lower or "overweight" in disease_lower:
        return DISEASE_DIET_GUIDELINES.get("Obesity", DISEASE_DIET_GUIDELINES["Healthy"])
    elif "anemia" in disease_lower or "iron" in disease_lower:
        return DISEASE_DIET_GUIDELINES["Anemia / Iron Deficiency"]
    elif "hypertension" in disease_lower or "blood pressure" in disease_lower:
        return DISEASE_DIET_GUIDELINES["Hypertension"]
    elif "asthma" in disease_lower:
        return DISEASE_DIET_GUIDELINES["Asthma"]
    elif "gastritis" in disease_lower or "gerd" in disease_lower:
        return DISEASE_DIET_GUIDELINES["GERD"]
    elif "jaundice" in disease_lower or "liver" in disease_lower:
        return DISEASE_DIET_GUIDELINES["Jaundice / Liver Dysfunction"]
    elif "dengue" in disease_lower or "infection" in disease_lower:
        return DISEASE_DIET_GUIDELINES["Dengue / Infections"]
    elif "migraine" in disease_lower:
        return DISEASE_DIET_GUIDELINES["Migraine"]
    elif "kidney" in disease_lower or "ckd" in disease_lower:
        return DISEASE_DIET_GUIDELINES["Chronic Kidney Disease"]
    elif "acne" in disease_lower or "skin" in disease_lower:
        return DISEASE_DIET_GUIDELINES["Acne"]
    elif "lipid" in disease_lower or "cholesterol" in disease_lower:
        return DISEASE_DIET_GUIDELINES["Hyperlipidemia"]
    elif "hypothyroidism" in disease_lower or "hypo thyroid" in disease_lower:
        return DISEASE_DIET_GUIDELINES["Hypothyroidism"]
    else:
        return DISEASE_DIET_GUIDELINES["Healthy"]

def adjust_for_lab_abnormalities(guidelines: Dict, abnormal_labs: List[Dict]) -> Dict:
    additional_tips = []
    additional_avoid = []
    
    for lab in abnormal_labs:
        test = lab.get("test", "").lower()
        status = lab.get("status", "").lower()
        
        if "glucose" in test:
            if "high" in status:
                additional_tips.append("Strictly limit all simple sugars and refined carbohydrates")
                additional_avoid.append("All sugary foods until glucose normalizes")
        
        if "cholesterol" in test:
            if "high" in status:
                additional_tips.append("Increase soluble fiber intake (oats, beans, apples)")
                additional_avoid.append("Saturated fats and fried foods")
        
        if "blood pressure" in test or "bp" in test:
            if "high" in status:
                additional_tips.append("Reduce sodium to less than 1,500mg per day")
                additional_avoid.append("All high-sodium processed foods")
    
    result = guidelines.copy()
    if additional_tips:
        result["tips"] = result.get("tips", []) + additional_tips
    if additional_avoid:
        result["avoid"] = result.get("avoid", []) + additional_avoid
    
    return result