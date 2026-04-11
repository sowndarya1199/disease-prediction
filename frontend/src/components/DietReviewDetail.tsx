import React, { useState, useEffect } from 'react';

interface DietReviewDetailProps {
    patientId: number;
}

const DietReviewDetail: React.FC<DietReviewDetailProps> = ({ patientId }) => {
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
    const [activeTrack, setActiveTrack] = useState<'vegetarian' | 'mixed'>('vegetarian');
    const [validation, setValidation] = useState({
        decision: 'Accept AI Prediction', // Default for diet review
        observations: '',
        finalDiagnosis: '',
        dietPlan: null as any,
        doctorSignature: ''
    });

    useEffect(() => {
        const fetchInitialData = async () => {
            setLoading(true);
            try {
                // First get the patient's current diet recommendation
                const dietRes = await fetch(`http://127.0.0.1:8000/patients/${patientId}/diet-recommendation`);
                if (dietRes.ok) {
                    const dietData = await dietRes.json();
                    
                    // Also check if there's an existing validation for this patient to pre-fill the signature and observations
                    const patientRes = await fetch(`http://127.0.0.1:8000/patients/${patientId}`);
                    if (patientRes.ok) {
                        await patientRes.json();
                        // You might want to fetch the actual last validation record here if possible
                        // For now we'll just use the diet data
                    }

                    setValidation(prev => ({
                        ...prev,
                        dietPlan: dietData,
                        observations: prev.observations || '',
                        doctorSignature: prev.doctorSignature || ''
                    }));
                }
            } catch (err) {
                console.error("Failed to fetch diet details", err);
            } finally {
                setLoading(false);
            }
        };

        fetchInitialData();
    }, [patientId]);

    const handleSave = async (isDraft = false) => {
        setSubmitting(true);
        try {
            const response = await fetch(`http://127.0.0.1:8000/patients/${patientId}/validation`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    decision: validation.decision,
                    observations: validation.observations,
                    final_diagnosis: validation.finalDiagnosis || validation.dietPlan?.target_condition,
                    diet_plan: JSON.stringify(validation.dietPlan),
                    doctor_signature: validation.doctorSignature,
                    patient_id: patientId,
                    is_draft: isDraft
                }),
            });

            if (response.ok) {
                setToast({ message: isDraft ? 'Draft saved successfully!' : 'Diet plan finalized and signed!', type: 'success' });
            } else {
                setToast({ message: 'Failed to save clinical review.', type: 'error' });
            }
        } catch {
            setToast({ message: 'Connection error.', type: 'error' });
        } finally {
            setSubmitting(false);
        }
    };

    useEffect(() => {
        if (toast) {
            const timer = setTimeout(() => setToast(null), 3000);
            return () => clearTimeout(timer);
        }
    }, [toast]);

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center p-20 gap-4">
                <div className="w-12 h-12 border-4 border-emerald-100 border-t-emerald-600 rounded-full animate-spin" />
                <p className="text-xs font-black text-slate-400 uppercase tracking-widest animate-pulse">Analyzing Clinical Nutrition Model...</p>
            </div>
        );
    }

    if (!validation.dietPlan) {
        return (
            <div className="p-20 text-center">
                <div className="text-4xl mb-4">⚠️</div>
                <h3 className="text-xl font-black text-slate-800">No Diet Plan Available</h3>
                <p className="text-slate-500 font-medium">Verify that the patient has completed diagnostic testing first.</p>
            </div>
        );
    }

    return (
        <div className="p-8 max-w-5xl mx-auto space-y-8 pb-32 relative">
            {toast && (
                <div className={`fixed top-24 right-8 z-[100] px-6 py-3 rounded-[1.5rem] shadow-2xl border flex items-center gap-3 animate-slide-up-fade ${toast.type === 'success' ? 'bg-emerald-50 border-emerald-100 text-emerald-700' : 'bg-rose-50 border-rose-100 text-rose-700'}`}>
                    <span className="text-lg">{toast.type === 'success' ? '✅' : '⚠️'}</span>
                    <span className="font-black text-xs uppercase tracking-tight">{toast.message}</span>
                </div>
            )}

            <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden group">
                <div className="bg-emerald-600 px-8 py-6 flex items-center justify-between text-white relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-32 -mt-32 blur-3xl opacity-50" />
                    <div className="relative z-10 flex items-center gap-6">
                        <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-3xl shrink-0 shadow-inner">🥗</div>
                        <div>
                            <h3 className="text-xl font-black tracking-tight leading-none mb-2">{validation.dietPlan.target_condition} Management Diet</h3>
                            <p className="text-[10px] font-black uppercase tracking-widest text-emerald-100 opacity-80 italic">Verified Medical Nutrition Therapy Recommendation</p>
                        </div>
                    </div>
                    <div className="relative z-10 text-right">
                        <div className="text-2xl font-black leading-none">{validation.dietPlan.total_daily_calories}</div>
                        <div className="text-[10px] font-black uppercase tracking-widest text-emerald-100">Kcal / Day</div>
                    </div>
                </div>

                <div className="p-10 space-y-10">
                    {/* Focus Area */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                        <div className="space-y-4">
                            <label className="text-[10px] font-black text-emerald-600 uppercase tracking-widest flex items-center gap-2">
                                <span className="w-1 h-1 bg-emerald-600 rounded-full" />
                                DIETARY FOCUS & OBJECTIVE
                            </label>
                            <input 
                                className="w-full p-4 rounded-2xl bg-slate-50 border-2 border-slate-100 text-xs font-bold text-slate-800 transition-all focus:border-emerald-500 focus:bg-white outline-none shadow-sm"
                                value={validation.dietPlan.dietary_focus}
                                onChange={(e) => setValidation({
                                    ...validation,
                                    dietPlan: { ...validation.dietPlan, dietary_focus: e.target.value }
                                })}
                            />
                        </div>
                        <div className="space-y-4">
                            <label className="text-[10px] font-black text-emerald-600 uppercase tracking-widest flex items-center gap-2">
                                <span className="w-1 h-1 bg-emerald-600 rounded-full" />
                                TARGET DAILY CALORIES
                            </label>
                            <div className="relative">
                                <input 
                                    type="number"
                                    className="w-full p-4 rounded-2xl bg-slate-50 border-2 border-slate-100 text-xs font-black text-slate-800 transition-all focus:border-emerald-500 focus:bg-white outline-none shadow-sm"
                                    value={validation.dietPlan.total_daily_calories}
                                    onChange={(e) => setValidation({
                                        ...validation,
                                        dietPlan: { ...validation.dietPlan, total_daily_calories: Number(e.target.value) }
                                    })}
                                />
                                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-black text-slate-400">KCAL</span>
                            </div>
                        </div>
                    </div>

                    {/* Track Selector */}
                    <div className="flex items-center gap-2 p-2 bg-slate-50 rounded-2xl border border-slate-100 mb-6">
                        <button 
                            onClick={() => setActiveTrack('vegetarian')}
                            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl transition-all font-black text-[10px] uppercase tracking-widest ${activeTrack === 'vegetarian' ? 'bg-emerald-600 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-100'}`}
                        >
                            🥬 Vegetarian Track
                        </button>
                        <button 
                            onClick={() => setActiveTrack('mixed')}
                            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl transition-all font-black text-[10px] uppercase tracking-widest ${activeTrack === 'mixed' ? 'bg-amber-600 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-100'}`}
                        >
                            🍗 Non-Vegetarian Track
                        </button>
                    </div>

                    {/* Meal Plan Structure */}
                    <div className="space-y-6">
                        <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                             <label className="text-[10px] font-black text-emerald-600 uppercase tracking-widest flex items-center gap-2">
                                <span className="w-1 h-1 bg-emerald-600 rounded-full" />
                                {activeTrack.toUpperCase()} NUTRITION PROTOCOL
                            </label>
                             <div className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">CLINICAL REVIEW REQUIRED</div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {Object.entries((activeTrack === 'vegetarian' ? validation.dietPlan.vegetarian_diet_plan : validation.dietPlan.mixed_diet_plan) || validation.dietPlan.daily_meal_plan).map(([mealKey, meal]: [string, any]) => (
                                <div key={mealKey} className={`rounded-3xl p-5 space-y-4 border transition-all hover:shadow-md ${activeTrack === 'vegetarian' ? 'bg-emerald-50/20 border-emerald-50 hover:border-emerald-200' : 'bg-amber-50/20 border-amber-50 hover:border-amber-200'}`}>
                                    <div className="flex items-center justify-between">
                                        <h4 className="text-[10px] font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
                                            <span className={`w-1.5 h-1.5 rounded-full shadow-sm ${activeTrack === 'vegetarian' ? 'bg-emerald-500 shadow-emerald-500' : 'bg-amber-500 shadow-amber-500'}`} />
                                            {mealKey.replace(/_/g, ' ')}
                                        </h4>
                                        <span className="text-[9px] font-black text-slate-400 bg-white px-2 py-0.5 rounded-md border border-slate-100">{meal.time}</span>
                                    </div>

                                    <div className="space-y-2">
                                        {meal.items.map((item: any, idx: number) => (
                                            <div key={idx} className="group relative">
                                                <div className="bg-white p-3 rounded-2xl border border-slate-100 shadow-sm space-y-2">
                                                    <div className="flex justify-between items-start gap-2">
                                                        <input 
                                                            className={`flex-1 bg-transparent text-[11px] font-bold text-slate-800 outline-none border-b border-transparent focus:border-${activeTrack === 'vegetarian' ? 'emerald' : 'amber'}-300`}
                                                            value={item.name}
                                                            placeholder="Food item..."
                                                            onChange={(e) => {
                                                                const newPlan = { ...validation.dietPlan };
                                                                const targetPlan = activeTrack === 'vegetarian' ? newPlan.vegetarian_diet_plan : newPlan.mixed_diet_plan;
                                                                targetPlan[mealKey].items[idx].name = e.target.value;
                                                                setValidation({ ...validation, dietPlan: newPlan });
                                                            }}
                                                        />
                                                        <button 
                                                            onClick={() => {
                                                                const newPlan = { ...validation.dietPlan };
                                                                const targetPlan = activeTrack === 'vegetarian' ? newPlan.vegetarian_diet_plan : newPlan.mixed_diet_plan;
                                                                targetPlan[mealKey].items.splice(idx, 1);
                                                                setValidation({ ...validation, dietPlan: newPlan });
                                                            }}
                                                            className="opacity-0 group-hover:opacity-100 p-1 text-slate-300 hover:text-rose-500 transition-all"
                                                        >
                                                             <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                            </svg>
                                                        </button>
                                                    </div>
                                                    <div className="flex gap-2">
                                                        <input 
                                                            className="w-full bg-slate-50/50 px-2 py-0.5 rounded text-[10px] text-slate-500 outline-none"
                                                            value={item.portion}
                                                            placeholder="Portion..."
                                                            onChange={(e) => {
                                                                const newPlan = { ...validation.dietPlan };
                                                                const targetPlan = activeTrack === 'vegetarian' ? newPlan.vegetarian_diet_plan : newPlan.mixed_diet_plan;
                                                                targetPlan[mealKey].items[idx].portion = e.target.value;
                                                                setValidation({ ...validation, dietPlan: newPlan });
                                                            }}
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                        <button 
                                            onClick={() => {
                                                const newPlan = { ...validation.dietPlan };
                                                const targetPlan = activeTrack === 'vegetarian' ? newPlan.vegetarian_diet_plan : newPlan.mixed_diet_plan;
                                                targetPlan[mealKey].items.push({ name: '', portion: '', calories: 0, benefits: '' });
                                                setValidation({ ...validation, dietPlan: newPlan });
                                            }}
                                            className={`w-full py-2.5 rounded-2xl border-2 border-dashed border-slate-100 text-[10px] font-black text-slate-400 hover:border-${activeTrack === 'vegetarian' ? 'emerald' : 'amber'}-300 transition-all active:scale-[0.98]`}
                                        >
                                            + ADD {activeTrack.toUpperCase()} ITEM
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Advice Section */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                        <div className="space-y-4">
                            <label className="text-[10px] font-black text-emerald-600 uppercase tracking-widest flex items-center gap-2">
                                <span className="w-1 h-1 bg-emerald-600 rounded-full" />
                                CLINICAL NUTRITIONAL ADVICE
                            </label>
                            <textarea 
                                className="w-full p-5 rounded-[2rem] bg-slate-50 border-2 border-slate-100 text-xs font-semibold text-slate-700 leading-relaxed transition-all focus:border-emerald-500 focus:bg-white outline-none shadow-sm h-40 resize-none"
                                value={validation.dietPlan.nutritional_advice.join('\n')}
                                placeholder="One recommendation per line..."
                                onChange={(e) => setValidation({
                                    ...validation,
                                    dietPlan: { ...validation.dietPlan, nutritional_advice: e.target.value.split('\n') }
                                })}
                            />
                        </div>
                        <div className="space-y-4">
                            <label className="text-[10px] font-black text-emerald-600 uppercase tracking-widest flex items-center gap-2">
                                <span className="w-1 h-1 bg-emerald-600 rounded-full" />
                                CLINICAL OBSERVATIONS
                            </label>
                            <textarea 
                                className="w-full p-5 rounded-[2rem] bg-indigo-50/40 border-2 border-indigo-100/50 text-xs font-semibold text-indigo-900 leading-relaxed transition-all focus:border-indigo-400 focus:bg-white outline-none shadow-sm h-40 resize-none"
                                value={validation.observations}
                                placeholder="Specific observations regarding nutritional status..."
                                onChange={(e) => setValidation({ ...validation, observations: e.target.value })}
                            />
                        </div>
                    </div>

                    <div className="pt-10 border-t border-slate-100 flex items-center justify-center">
                        <div className="text-center space-y-2">
                             <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center justify-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                                Ready for Clinical Finalization
                            </p>
                            <p className="text-[9px] font-bold text-slate-300 uppercase tracking-widest italic">Verification status will be updated upon saving</p>
                        </div>
                    </div>
                </div>

                <div className="bg-slate-50 px-10 py-8 flex items-center justify-center gap-4">
                    <button 
                         onClick={() => handleSave(true)}
                         disabled={submitting}
                         className="px-10 py-4 rounded-2xl bg-white border-2 border-slate-200 text-[11px] font-black uppercase tracking-widest text-slate-500 hover:bg-slate-100 transition-all active:scale-95 disabled:opacity-50"
                    >
                        Save Progress
                    </button>
                    <button 
                         onClick={() => handleSave(false)}
                         disabled={submitting}
                         className="px-14 py-4 rounded-2xl bg-slate-900 text-white text-[11px] font-black uppercase tracking-widest shadow-2xl shadow-slate-900/30 hover:bg-slate-800 transition-all active:scale-95 disabled:opacity-50 flex items-center gap-3"
                    >
                        {submitting && <div className="w-3 h-3 border-2 border-white/20 border-t-white rounded-full animate-spin" />}
                        CERTIFY & PUBLISH PLAN
                    </button>
                </div>
            </div>
        </div>
    );
};

export default DietReviewDetail;
