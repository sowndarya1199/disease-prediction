import React, { useState, useEffect } from 'react';

interface Patient { id: number; name: string; }

interface MealItem {
    name: string;
    portion: string;
    calories: number;
    benefits: string;
    substituted?: boolean;
}

interface MealSlot {
    time: string;
    items: MealItem[];
    total_calories: number;
}

interface MealPlan {
    early_morning: MealSlot;
    breakfast: MealSlot;
    mid_morning_snack: MealSlot;
    lunch: MealSlot;
    evening_snack: MealSlot;
    dinner: MealSlot;
}

interface DietRecommendation {
    patient_name: string;
    target_condition: string;
    food_preference: string;
    key_nutrients?: string[];
    vegetarian_diet_plan?: MealPlan;
    mixed_diet_plan?: MealPlan;
    daily_meal_plan?: MealPlan;
    total_daily_calories: number;
    foods_to_avoid?: string[];
    nutritional_advice?: string[];
    hydration_goal?: string;
    disclaimer: string;
    is_finalized?: boolean;
    patient_info?: { bmi?: number; bmi_category?: string };
    nutritional_goals?: string[];
    calorie_requirement?: { total_kcal: number };
    condition_recommendations?: { rationale: string };
    lifestyle_recommendations?: { hydration: string; sleep: string; physical_activity: string };
}

const MEAL_EMOJIS: Record<string, string> = {
    early_morning: '🌅',
    breakfast: '🥣',
    mid_morning_snack: '🍎',
    lunch: '🍽️',
    evening_snack: '🥤',
    dinner: '🌙',
};

const MEAL_TITLES: Record<string, string> = {
    early_morning: 'Early Morning',
    breakfast: 'Breakfast',
    mid_morning_snack: 'Mid-Morning Snack',
    lunch: 'Lunch',
    evening_snack: 'Evening Snack',
    dinner: 'Dinner',
};

// ── Reusable Meal Card ──────────────────────────────────────────────
function MealCard({ mealKey, meal, accentColor }: { mealKey: string; meal: MealSlot; accentColor: 'emerald' | 'amber' }) {
    const colors = {
        emerald: { border: 'border-emerald-100/60', badge: 'bg-emerald-100 text-emerald-700', item: 'border-emerald-50', benefit: 'text-emerald-600' },
        amber:   { border: 'border-amber-100/60',   badge: 'bg-amber-100 text-amber-700',     item: 'border-amber-50',   benefit: 'text-amber-600'   },
    }[accentColor];

    return (
        <div className={`glass rounded-3xl p-5 border ${colors.border} hover:shadow-md transition-all`}>
            <div className="flex items-center justify-between mb-3">
                <h4 className="font-black text-sm flex items-center gap-2 text-slate-800">
                    <span className="text-lg">{MEAL_EMOJIS[mealKey] ?? '🍴'}</span>
                    {MEAL_TITLES[mealKey] ?? mealKey.replace(/_/g, ' ')}
                    <span className="text-[10px] text-slate-400 font-bold">{meal.time}</span>
                </h4>
                <span className={`text-[10px] font-black px-2 py-1 rounded-full ${colors.badge}`}>
                    {meal.total_calories} cal
                </span>
            </div>
            <div className="space-y-2">
                {meal.items?.map((item, idx) => (
                    <div key={idx} className={`p-2.5 rounded-xl bg-white border ${colors.item} shadow-sm`}>
                        <div className="text-[11px] font-black text-slate-800 flex items-center justify-between">
                            {item.name}
                            {item.substituted && (
                                <span className={`text-[8px] px-1.5 py-0.5 rounded uppercase font-black bg-opacity-20 ${colors.badge}`}>
                                    Veg Alt
                                </span>
                            )}
                        </div>
                        <p className="text-[10px] text-slate-500 mt-0.5">
                            {item.portion} • <span className={colors.benefit}>{item.benefits}</span>
                        </p>
                    </div>
                ))}
            </div>
        </div>
    );
}

// ── Track Column ────────────────────────────────────────────────────
function TrackColumn({ title, subtitle, emoji, plan, accentColor }: {
    title: string;
    subtitle: string;
    emoji: string;
    plan: MealPlan;
    accentColor: 'emerald' | 'amber';
}) {
    const headerBg = accentColor === 'emerald' ? 'bg-emerald-50 border-emerald-100 text-emerald-800' : 'bg-amber-50 border-amber-100 text-amber-800';
    const subColor = accentColor === 'emerald' ? 'text-emerald-600' : 'text-amber-600';

    return (
        <div className="space-y-5">
            <div className={`flex items-center gap-3 p-4 rounded-2xl border ${headerBg}`}>
                <span className="text-2xl">{emoji}</span>
                <div>
                    <h3 className="text-lg font-black">{title}</h3>
                    <p className={`text-xs ${subColor}`}>{subtitle}</p>
                </div>
            </div>
            {Object.entries(plan).map(([key, slot]) => (
                <MealCard key={key} mealKey={key} meal={slot as MealSlot} accentColor={accentColor} />
            ))}
        </div>
    );
}

// ── Main Component ──────────────────────────────────────────────────
const DietRecommendationView: React.FC = () => {
    const [patients, setPatients] = useState<Patient[]>([]);
    const [selectedPatientId, setSelectedPatientId] = useState<number | ''>('');
    const [foodPreference, setFoodPreference] = useState<string>('vegetarian');
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<DietRecommendation | null>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        fetch('http://127.0.0.1:8000/patients/')
            .then(r => r.ok ? r.json() : [])
            .then(setPatients)
            .catch(() => {});
    }, []);

    const handleGenerate = async (forceRegenerate = false) => {
        if (!selectedPatientId) return;
        setLoading(true);
        setError(null);
        setResult(null);

        try {
            // Priority: Used saved doctor-modified plan if it exists, unless 'force' is requested
            const params = new URLSearchParams({ 
                preference: foodPreference, 
                regenerate: forceRegenerate ? 'true' : 'false' 
            });

            const res = await fetch(
                `http://127.0.0.1:8000/patients/${selectedPatientId}/finalized-diet?${params}`
            );
            if (res.ok) {
                setResult(await res.json());
            } else {
                setError('No diet plan found. This patient may need a diagnostic review first.');
            }
        } catch {
            setError('Network error. Is the backend running?');
        } finally {
            setLoading(false);
        }
    };

    const inputStyle = {
        background: 'var(--gray-50)',
        border: '2px solid var(--gray-200)',
        color: 'var(--gray-800)',
    };

    const isVegetarian = foodPreference === 'vegetarian';

    return (
        <div className="p-6 md:p-8" style={{ background: 'linear-gradient(135deg,#f0fdf4,#dcfce7,#f0fdf4)', minHeight: '100vh' }}>
            <div className="max-w-6xl mx-auto space-y-6">

                {/* Header */}
                <div>
                    <h1 className="text-3xl font-black" style={{ color: 'var(--success)' }}>🥗 Diet Recommendation</h1>
                    <p className="text-sm" style={{ color: 'var(--gray-500)' }}>Personalized Indian nutrition plans based on your health profile</p>
                </div>

                {/* Controls */}
                <div className="glass rounded-2xl p-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {/* Patient */}
                        <div>
                            <label className="block text-sm font-semibold mb-2" style={{ color: 'var(--gray-700)' }}>👤 Select Patient</label>
                            <select
                                value={selectedPatientId}
                                onChange={e => { setSelectedPatientId(Number(e.target.value)); setResult(null); setError(null); }}
                                className="w-full px-4 py-3 rounded-xl cursor-pointer"
                                style={inputStyle}
                            >
                                <option value="">— Choose a patient —</option>
                                {patients.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                            </select>
                        </div>

                        {/* Preference */}
                        <div>
                            <label className="block text-sm font-semibold mb-2" style={{ color: 'var(--gray-700)' }}>🍽️ Food Preference</label>
                            <select
                                value={foodPreference}
                                onChange={e => { setFoodPreference(e.target.value); setResult(null); }}
                                className="w-full px-4 py-3 rounded-xl cursor-pointer"
                                style={inputStyle}
                            >
                                <option value="vegetarian">🥬 Vegetarian Only</option>
                                <option value="non_vegetarian">🍗 Non-Vegetarian Options</option>
                            </select>
                        </div>

                        {/* Buttons */}
                        {/* Single Generate Button */}
                        <div className="flex items-end">
                            <button
                                onClick={() => handleGenerate(false)}
                                disabled={!selectedPatientId || loading}
                                className="w-full px-6 py-3 rounded-xl font-bold text-white disabled:opacity-50 transition-all shadow-lg hover:brightness-110 active:scale-95"
                                style={{ background: 'linear-gradient(135deg,#059669,#047857)', boxShadow: '0 10px 30px rgba(5,150,105,.3)' }}
                            >
                                {loading ? '⏳ Processing...' : '📋 Generate / View Clinical Diet'}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Error */}
                {error && (
                    <div className="px-5 py-4 rounded-xl flex items-center gap-3" style={{ background: 'var(--error-glow)', border: '1px solid var(--error)', color: 'var(--error)' }}>
                        ⚠️ <span className="font-medium">{error}</span>
                    </div>
                )}

                {/* Result */}
                {result && (
                    <div className="space-y-6">

                        {/* Summary header */}
                        <div className="glass rounded-2xl overflow-hidden">
                            <div className="p-6" style={{ background: 'linear-gradient(135deg,rgba(16,185,129,.1),rgba(5,150,105,.05))' }}>
                                <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
                                    <div className="flex-1">
                                        <h2 className="text-2xl font-black mb-1" style={{ color: 'var(--gray-900)' }}>
                                            Diet Plan for {result.patient_name}
                                        </h2>
                                        <p className="text-sm mb-3" style={{ color: 'var(--gray-600)' }}>
                                            <strong>Condition:</strong> {result.target_condition} &nbsp;|&nbsp;
                                            <strong>Preference:</strong> {isVegetarian ? 'Vegetarian' : 'Regular (Veg + Non-Veg)'}
                                        </p>
                                        <div className="flex flex-wrap gap-2">
                                            <span className="px-3 py-1 bg-slate-100 text-slate-700 rounded-full text-[10px] font-black uppercase border border-slate-200">
                                                BMI: {result.patient_info?.bmi ?? 'N/A'} ({result.patient_info?.bmi_category ?? 'N/A'})
                                            </span>
                                            {result.is_finalized && (
                                                <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-[10px] font-black uppercase flex items-center gap-1">
                                                    ✓ Doctor Verified
                                                </span>
                                            )}
                                        </div>
                                        <div className="flex gap-4 mt-4">
                                            <button
                                                onClick={() => handleGenerate(false)}
                                                disabled={loading || !selectedPatientId}
                                                className="flex-1 bg-emerald-600 text-white font-bold py-4 px-6 rounded-2xl hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
                                            >
                                                {loading ? (
                                                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                                ) : (
                                                    <span>📋 Generate / View Diet</span>
                                                )}
                                            </button>
                                        </div>

                                        {result.key_nutrients && (
                                            <div className="mt-4 flex flex-wrap gap-2">
                                                {result.key_nutrients.map((n, i) => (
                                                    <span key={i} className="px-3 py-1 rounded-full text-[10px] font-black uppercase" style={{ background: 'white', color: 'var(--success)', border: '1px solid var(--success-glow)' }}>{n}</span>
                                                ))}
                                            </div>
                                        )}
                                    </div>

                                    <div className="flex items-center gap-4 shrink-0">
                                        {result.is_finalized && (
                                            <button
                                                onClick={() => window.open(`http://127.0.0.1:8000/patients/${selectedPatientId}/download-diet-pdf?preference=${foodPreference}`, '_blank')}
                                                className="px-5 py-2.5 bg-white text-slate-900 rounded-xl font-black text-[10px] uppercase tracking-widest shadow border border-slate-200 hover:bg-slate-50 transition-all flex items-center gap-2"
                                            >
                                                ⬇ Download PDF
                                            </button>
                                        )}
                                        <div className="text-center p-4 rounded-xl shadow-lg border border-white/50" style={{ background: 'linear-gradient(135deg,var(--success),#047857)', color: 'white' }}>
                                            <div className="text-3xl font-black">{result.calorie_requirement?.total_kcal ?? result.total_daily_calories}</div>
                                            <div className="text-[10px] font-black uppercase tracking-tighter">Target kcal/day</div>
                                        </div>
                                    </div>
                                </div>

                                {result.nutritional_goals && (
                                    <div className="mt-5 p-5 rounded-2xl" style={{ background: 'rgba(5,150,105,.04)', border: '1px solid rgba(5,150,105,.1)' }}>
                                        <h3 className="text-xs font-black uppercase tracking-widest text-emerald-600 mb-3">Nutritional Focus Goals</h3>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                            {result.nutritional_goals.map((g, i) => (
                                                <div key={i} className="flex items-start gap-2 bg-white/60 p-2.5 rounded-xl border border-white">
                                                    <span className="w-2 h-2 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
                                                    <p className="text-xs font-medium text-slate-700">{g}</p>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* ── VEGETARIAN ONLY ── */}
                        {isVegetarian && result.vegetarian_diet_plan && (
                            <TrackColumn
                                title="Pure Vegetarian Diet Plan"
                                subtitle="All meals are plant-based Indian foods"
                                emoji="🥬"
                                plan={result.vegetarian_diet_plan}
                                accentColor="emerald"
                            />
                        )}

                        {/* ── NON-VEGETARIAN: single track ── */}
                        {!isVegetarian && result.mixed_diet_plan && (
                            <TrackColumn
                                title="Non-Vegetarian Diet Plan"
                                subtitle="Indian diet plan with non-vegetarian options"
                                emoji="🍗"
                                plan={result.mixed_diet_plan}
                                accentColor="amber"
                            />
                        )}

                        {/* ── LEGACY fallback ── */}
                        {!result.vegetarian_diet_plan && result.daily_meal_plan && (
                            <div className="space-y-4">
                                <div className="flex items-center gap-3 p-4 rounded-2xl bg-slate-100 border border-slate-200">
                                    <span className="text-2xl">📋</span>
                                    <div>
                                        <h3 className="text-lg font-black text-slate-800">Standardized Diet Plan</h3>
                                        <p className="text-xs text-slate-500">Older format — click Regenerate to upgrade to the dual-track Indian protocol</p>
                                    </div>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                    {Object.entries(result.daily_meal_plan).map(([key, slot]) => (
                                        <MealCard key={key} mealKey={key} meal={slot as MealSlot} accentColor="emerald" />
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Foods to avoid + Advice */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="glass rounded-2xl p-6 bg-red-50/40 border border-red-100">
                                <h3 className="text-base font-black mb-3 text-red-700">🚫 Foods to Avoid</h3>
                                <div className="space-y-2">
                                    {result.foods_to_avoid?.map((f, i) => (
                                        <div key={i} className="p-2.5 rounded-xl bg-white flex items-center gap-2 border border-red-100 shadow-sm">
                                            <span className="text-red-500 font-black">×</span>
                                            <span className="text-xs font-medium text-slate-700">{f}</span>
                                        </div>
                                    ))}
                                    {(!result.foods_to_avoid || result.foods_to_avoid.length === 0) && (
                                        <p className="text-xs text-slate-400 italic p-2">No specific restrictions identified.</p>
                                    )}
                                </div>
                            </div>

                            <div className="glass rounded-2xl p-6 bg-blue-50/40 border border-blue-100">
                                <h3 className="text-base font-black mb-3 text-blue-700">💡 Nutritional Advice</h3>
                                <div className="space-y-2">
                                    {result.nutritional_advice?.map((t, i) => (
                                        <div key={i} className="p-2.5 rounded-xl bg-white flex items-start gap-2 border border-blue-100 shadow-sm">
                                            <span className="text-blue-400 font-black text-sm">✦</span>
                                            <span className="text-xs font-medium text-slate-700">{t}</span>
                                        </div>
                                    ))}
                                    {(!result.nutritional_advice || result.nutritional_advice.length === 0) && (
                                        <p className="text-xs text-slate-400 italic p-2">General healthy eating guidelines apply.</p>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Lifestyle Protocol */}
                        {result.lifestyle_recommendations && (
                            <div className="rounded-[2.5rem] p-10 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 shadow-2xl relative overflow-hidden boarder border-slate-700">
                                <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-500/10 rounded-full -mr-40 -mt-40 blur-3xl" />
                                <div className="absolute bottom-0 left-0 w-80 h-80 bg-blue-500/10 rounded-full -ml-40 -mb-40 blur-3xl opacity-50" />
                                
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative z-10">
                                    {[
                                        { 
                                            icon: '🚰', 
                                            label: 'Hydration', 
                                            val: result.lifestyle_recommendations.hydration,
                                            accent: 'blue' 
                                        },
                                        { 
                                            icon: '😴', 
                                            label: 'Sleep Goal', 
                                            val: result.lifestyle_recommendations.sleep,
                                            accent: 'violet'
                                        },
                                        { 
                                            icon: '⚡', 
                                            label: 'Activity', 
                                            val: result.lifestyle_recommendations.physical_activity,
                                            accent: 'emerald'
                                        },
                                    ].map(({ icon, label, val }) => (
                                        <div key={label} className="p-6 rounded-[2rem] bg-white/5 border border-white/10 hover:bg-white/8 transition-all group">
                                            <div className="flex items-start gap-4">
                                                <span className={`text-4xl filter drop-shadow-lg group-hover:scale-110 transition-transform`}>{icon}</span>
                                                <div>
                                                    <p className={`text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-2`}>{label}</p>
                                                    <p className="text-sm font-black text-white leading-relaxed tracking-tight group-hover:text-emerald-300 transition-colors">
                                                        {val || 'No data generated'}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* Empty state */}
                {!result && !loading && (
                    <div className="glass rounded-[3rem] p-24 text-center border-4 border-dashed border-emerald-100 bg-emerald-50/20">
                        <div className="w-24 h-24 mx-auto mb-8 rounded-[2rem] bg-emerald-100 flex items-center justify-center text-5xl shadow-inner">🥗</div>
                        <h3 className="text-2xl font-black text-emerald-900 mb-3">Initialize Clinical Nutrition Protocol</h3>
                        <p className="text-emerald-600/70 max-w-md mx-auto font-medium">
                            Select a patient and food preference above, then generate your personalized Indian diet plan.
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default DietRecommendationView;
