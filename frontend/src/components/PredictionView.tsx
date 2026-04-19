import { API_BASE } from '../config';
import React, { useState, useEffect } from 'react';

interface ContributionFactor {
    factor: string;
    points: number;
    reason: string;
}

interface AbnormalLab {
    test: string;
    value: number;
    status: 'Low' | 'High';
    normal_range: string;
}

interface PredictionResult {
    patient_name?: string;
    disease: string;
    probability: number;
    risk: 'Low' | 'Medium' | 'High' | 'Moderate';
    prediction_method: string;
    prescription?: string;
    lab_report_url?: string;
    data_summary?: {
        symptoms_found: string[];
        lab_tests_found: string[];
        lab_values?: Record<string, number>;
        has_medical_history: boolean;
    };
    explanation?: {
        summary: string;
        top_factors: ContributionFactor[];
        abnormal_labs: AbnormalLab[];
        clean_explanation?: {
            key_reason: string;
            factors: Array<{ factor: string; display: string; status: string; description?: string }>;
            normal_ranges: Array<{ test: string; range: string }>;
            risk_level: string;
            risk_recommendation: string;
            action_advice: string[];
            confidence: number;
        };
    };
}


const FactorIcon: React.FC<{ type: string }> = ({ type }) => {
    const name = type.toLowerCase();
    if (name.includes('glucose')) return (
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M12 22a7 7 0 0 0 7-7c0-2-1-3.9-3-5.5s-3.5-4-4-6.5c-.5 2.5-2 4.9-4 6.5s-3 3.5-3 5.5a7 7 0 0 0 7 7z" />
        </svg>
    );
    if (name.includes('crp') || name.includes('inflammation')) return (
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M12 2c0 10-6 12-6 12s2 1 2 3-1 2-1 3 1 2 6 2 6-1 6-2-1-1-1-3 2-1 2-3-6-2-6-12z" />
        </svg>
    );
    if (name.includes('smoking')) return (
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" /><path d="M12 9v4" /><path d="M12 17h.01" />
        </svg>
    );
    if (name.includes('bmi') || name.includes('weight')) return (
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M16 16 20 4" /><path d="m8 16-4-12" /><path d="M3 20h18" /><path d="M5 20v-4h14v4" /><path d="M11 7h2" /><path d="M10 11h4" /><path d="M12 5V3" />
        </svg>
    );
    return (
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <circle cx="12" cy="12" r="10" /><path d="M12 16v-4" /><path d="M12 8h.01" />
        </svg>
    );
};

const PhysicianApprovalBadge: React.FC<{ status: string }> = ({ status }) => {
    if (status !== 'Approved' && status !== 'Modified') return null;

    return (
        <div className="flex items-center gap-3 px-5 py-3 bg-emerald-50 border border-emerald-100 rounded-2xl animate-fade-in shadow-sm">
            <div className="w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center text-white shadow-lg shadow-emerald-200">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                </svg>
            </div>
            <div>
                <p className="text-[10px] font-black text-emerald-800 uppercase tracking-widest leading-none mb-0.5">Validated</p>
                <p className="text-xs font-bold text-emerald-600/80">Doctor Verified</p>
            </div>
        </div>
    );
};

interface PredictionViewProps {
    initialPatientId: number | null;
    userRole: string | null;
    result: PredictionResult | null;
    loading: boolean;
    error: string | null;
    isEmbed?: boolean;
}

const PredictionView: React.FC<PredictionViewProps> = ({ initialPatientId, userRole, result, loading, error, isEmbed = false }) => {
    // Audit log role for clinical traceability
    useEffect(() => {
        if (userRole) console.log(`[Clinical Audit] Active Session Role: ${userRole}`);
    }, [userRole]);
    const [selectedPatientId, setSelectedPatientId] = useState<number | null>(initialPatientId);
    const [patientStatus, setPatientStatus] = useState<any | null>(null);
    const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

    const [validation, setValidation] = useState({
        decision: '',
        observations: '',
        finalDiagnosis: '',
        treatmentPlan: '',
        prescriptionNotes: '',
        overrideReason: '',
        riskLevel: '',
        customFactors: [] as any[],
        dietPlan: null as any,
        doctorSignature: '',
        signaturePath: ''
    });

    useEffect(() => {
        if (selectedPatientId && userRole === 'doctor') {
            fetchAIRecommendedDiet();
        }
    }, [selectedPatientId, userRole]);

    const fetchAIRecommendedDiet = async () => {
        if (!selectedPatientId) return;
        try {
            const res = await fetch(`${API_BASE}/patients/${selectedPatientId}/diet-recommendation`);
            if (res.ok) {
                const dietData = await res.json();
                setValidation(prev => ({ ...prev, dietPlan: dietData }));
            }
        } catch (err) {
            console.error("Failed to fetch diet recommendations", err);
        }
    };
    const [submittingValidation, setSubmittingValidation] = useState(false);
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [confirmAction, setConfirmAction] = useState<'finalize' | 'draft' | null>(null);
    const [isSavingDraft, setIsSavingDraft] = useState(false);
    const [displayedResult, setDisplayedResult] = useState<PredictionResult | null>(result);

    useEffect(() => {
        if (result && !validation.decision) {
            setDisplayedResult(result);
            const originalFactors = result?.explanation?.clean_explanation?.factors;
            if (originalFactors) {
                setValidation(prev => ({ ...prev, customFactors: originalFactors }));
            }
        }
    }, [result, validation.decision]);

    useEffect(() => {
        if (validation.decision === 'Modify Diagnosis' && displayedResult) {
            setDisplayedResult({
                ...displayedResult,
                disease: validation.finalDiagnosis || displayedResult.disease,
                risk: (validation.riskLevel as any) || displayedResult.risk,
                prediction_method: 'Clinically Modified by Physician',
                probability: 1.0,
                explanation: {
                    ...displayedResult.explanation,
                    clean_explanation: {
                        ...(displayedResult.explanation?.clean_explanation || {}),
                        key_reason: validation.observations,
                        factors: []
                    }
                } as any
            });
        } else if (validation.decision === 'Accept AI Prediction' && result) {
            setDisplayedResult(result);
        }
    }, [validation.finalDiagnosis, validation.decision, validation.riskLevel, validation.observations, result]);

    const getTheme = () => {
        if (!displayedResult) return null;
        const disease = displayedResult.disease.toLowerCase();
        const risk = displayedResult.risk;

        if (disease === 'healthy' || risk === 'Low') {
            return {
                primary: 'text-emerald-600',
                bg: 'bg-emerald-50',
                border: 'border-emerald-200',
                pulse: 'bg-emerald-500',
                gradFrom: '#059669',
                gradTo: '#34D399',
                insightsFrom: 'linear-gradient(90deg, #059669, #34d399)'
            };
        }
        if (risk === 'Moderate' || risk === 'Medium') {
            return {
                primary: 'text-amber-600',
                bg: 'bg-amber-50',
                border: 'border-amber-200',
                pulse: 'bg-amber-500',
                gradFrom: '#D97706',
                gradTo: '#FBBF24',
                insightsFrom: 'linear-gradient(90deg, #d97706, #fbbf24)'
            };
        }
        return {
            primary: 'text-rose-600',
            bg: 'bg-rose-50',
            border: 'border-rose-200',
            pulse: 'bg-rose-500',
            gradFrom: '#DC2626',
            gradTo: '#F43F5E',
            insightsFrom: 'linear-gradient(90deg, #dc2626, #f43f5e)'
        };
    };

    const theme = getTheme();

    useEffect(() => {
        setSelectedPatientId(initialPatientId);
    }, [initialPatientId]);

    useEffect(() => {
        if (selectedPatientId) {
            fetchPatientStatus();
        }
    }, [selectedPatientId]);

    const fetchPatientStatus = async () => {
        if (!selectedPatientId) return;
        try {
            const res = await fetch(`${API_BASE}/patients/${selectedPatientId}`);
            if (res.ok) {
                const data = await res.json();
                setPatientStatus(data.approval_status);
            }
        } catch { }
    };

    useEffect(() => {
        if (toast) {
            const timer = setTimeout(() => setToast(null), 3000);
            return () => clearTimeout(timer);
        }
    }, [toast]);

    const handleValidationSubmit = async (isDraft = false) => {
        if (!selectedPatientId || !validation.decision) return;
        if (!isDraft && validation.decision === 'Override Prediction' && !validation.overrideReason) {
            setToast({ message: 'Please provide a reason for overriding.', type: 'error' });
            return;
        }

        if (isDraft) setIsSavingDraft(true);
        else setSubmittingValidation(true);
        
        console.log("Submitting Validation with Signature Path:", validation.signaturePath);

        try {
            const response = await fetch(`${API_BASE}/patients/${selectedPatientId}/validation`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    decision: validation.decision,
                    observations: validation.observations,
                    final_diagnosis: validation.finalDiagnosis,
                    treatment_plan: validation.treatmentPlan,
                    prescription_notes: validation.prescriptionNotes,
                    override_reason: validation.overrideReason,
                    custom_factors: JSON.stringify(validation.customFactors),
                    diet_plan: validation.dietPlan ? JSON.stringify(validation.dietPlan) : null,
                    doctor_name: validation.doctorSignature,
                    signature_path: validation.signaturePath,
                    patient_id: selectedPatientId,
                    is_draft: isDraft
                }),
            });
            if (response.ok) {
                setToast({ message: isDraft ? 'Draft saved!' : 'Finalized successfully!', type: 'success' });
                if (!isDraft) fetchPatientStatus();
            } else {
                setToast({ message: 'Failed to save.', type: 'error' });
            }
        } catch {
            setToast({ message: 'Connection error.', type: 'error' });
        } finally {
            if (isDraft) setIsSavingDraft(false);
            else {
                setSubmittingValidation(false);
                setShowConfirmModal(false);
            }
        }
    };

    const triggerConfirm = (action: 'finalize' | 'draft') => {
        setConfirmAction(action);
        setShowConfirmModal(true);
    };


    const handleSignatureUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const formData = new FormData();
        formData.append('file', file);

        try {
            const res = await fetch(`${API_BASE}/signatures/upload`, {
                method: 'POST',
                body: formData
            });
            if (res.ok) {
                const data = await res.json();
                setValidation(prev => ({ ...prev, signaturePath: data.signature_path }));
                setToast({ message: 'Signature image uploaded successfully!', type: 'success' });
            } else {
                setToast({ message: 'Failed to upload signature.', type: 'error' });
            }
        } catch (err) {
            setToast({ message: 'Error uploading signature.', type: 'error' });
        }
    };

    const ConfirmationModal = () => {
        if (!showConfirmModal) return null;

        const currentAction = confirmAction || 'finalize';
        const config = {
            finalize: {
                title: 'Finalize Clinical Decision?',
                body: 'This will lock the diagnostic report and notify the patient of the certified results. This action cannot be undone.',
                confirmText: 'Yes, Finalize & Save',
                confirmColor: 'bg-slate-900',
                action: () => handleValidationSubmit(false)
            },
            draft: {
                title: 'Save Draft?',
                body: 'Your current notes and progress will be saved. You can return later to finalize the validation.',
                confirmText: 'Save Draft',
                confirmColor: 'bg-blue-600',
                action: () => handleValidationSubmit(true)
            }
        }[currentAction];

        return (
            <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
                <div className="bg-white rounded-[2rem] p-10 max-w-md w-full shadow-2xl border border-slate-100 animate-slide-up">
                    <h3 className="text-xl font-black text-slate-900 mb-4 tracking-tight">{config.title}</h3>
                    <p className="text-sm font-bold text-slate-500 leading-relaxed mb-8">{config.body}</p>
                    <div className="flex gap-4">
                        <button
                            onClick={() => setShowConfirmModal(false)}
                            className="flex-1 py-4 rounded-xl bg-slate-50 text-slate-400 font-black text-xs uppercase tracking-widest hover:bg-slate-100 transition-all"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={config.action}
                            className={`flex-1 py-4 rounded-xl ${config.confirmColor} text-white font-black text-xs uppercase tracking-widest shadow-xl transition-all hover:scale-[1.02] active:scale-95`}
                        >
                            {config.confirmText}
                        </button>
                    </div>
                </div>
            </div>
        );
    };

    const handleDecisionChange = (decision: string) => {
        let updates: any = { decision };
        if (decision === 'Accept AI Prediction' && result) {
            updates.finalDiagnosis = result.disease;
        }
        setValidation({ ...validation, ...updates });
    };

    return (
        <div className={`${isEmbed ? 'min-h-full' : 'min-h-screen'} bg-transparent font-sans text-slate-900 pb-6 relative overflow-x-hidden ${isEmbed ? 'p-0' : ''}`}>
            {toast && (
                <div className={`fixed top-6 right-6 z-[100] px-6 py-3 rounded-xl shadow-2xl border flex items-center gap-3 animate-fade-in ${toast.type === 'success' ? 'bg-emerald-50 border-emerald-100 text-emerald-700' : 'bg-rose-50 border-rose-100 text-rose-700'}`}>
                    <span className="text-lg">{toast.type === 'success' ? '✅' : '⚠️'}</span>
                    <span className="font-bold text-sm tracking-tight">{toast.message}</span>
                </div>
            )}

            <main className={`w-full mx-auto relative ${isEmbed ? 'px-4' : 'px-10'}`}>
                {loading && (
                    <div className="absolute inset-x-0 top-0 bottom-0 z-50 flex flex-col items-center justify-center animate-fade-in rounded-[3rem]">
                        <p className="text-2xl font-black text-slate-800 tracking-tight animate-pulse">Analyzing Case...</p>
                    </div>
                )}
                <ConfirmationModal />

                {error && (
                    <div className="mb-6 p-4 rounded-2xl bg-rose-50 border border-rose-100 text-rose-700 text-xs font-black flex items-center gap-3 animate-fade-in">
                        <span className="shrink-0 w-6 h-6 rounded-full bg-rose-100 flex items-center justify-center">!</span>
                        {error}
                    </div>
                )}

                {displayedResult && theme ? (
                    <div className={`flex flex-col xl:flex-row gap-8 pb-20 ${userRole !== 'doctor' ? 'justify-center' : ''}`}>
                        {/* LEFT PANEL */}
                        <div className={`w-full ${userRole === 'doctor' ? 'xl:w-[55%]' : 'xl:w-[60%]'} space-y-10 animate-fade-in`}>
                            {/* 1. PREDICTION SUMMARY */}
                            <div className="bg-gradient-to-br from-blue-50/50 to-white rounded-[2.5rem] border border-slate-100 shadow-xl shadow-slate-200/50 p-10 relative overflow-hidden group">
                                <div className="absolute top-0 right-0 w-64 h-64 bg-blue-100/20 rounded-full -mr-20 -mt-20 blur-3xl" />
                                <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-10">
                                    <div className="flex-1 space-y-6">
                                        <div className="space-y-6">
                                            <div className="flex items-center justify-between">
                                                <span className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full ${theme.bg} ${theme.primary} text-[11px] font-black uppercase tracking-widest border ${theme.border} shadow-sm shadow-current/10 animate-pulse`}>
                                                    <div className={`w-2 h-2 rounded-full ${theme.pulse}`} />
                                                    {displayedResult.risk} Risk Status
                                                </span>
                                                <div className="flex items-center gap-3">
                                                    <PhysicianApprovalBadge status={patientStatus} />
                                                    {(patientStatus === 'Approved' || patientStatus === 'Modified') && (
                                                        <a
                                                            href={`${API_BASE}/patients/${selectedPatientId}/download-health-report`}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-slate-900 text-white text-[10px] font-black uppercase tracking-widest shadow-lg shadow-slate-900/20 border border-slate-700 hover:scale-105 active:scale-95 transition-all"
                                                        >
                                                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                                            </svg>
                                                            Download Report
                                                        </a>
                                                    )}
                                                </div>
                                            </div>
                                            <h1 className="text-4xl lg:text-5xl font-black text-slate-900 tracking-tight leading-none mb-2">
                                                {displayedResult.disease}
                                            </h1>
                                        </div>
                                        <div className="flex">
                                            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-5 border border-slate-50 shadow-sm w-full transition-all hover:translate-y-[-2px]">
                                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 text-center">Risk Level</p>
                                                <p className={`text-3xl font-black ${theme.primary} flex items-center justify-center gap-2`}>
                                                    {displayedResult.risk === 'High' ? '🔴' : (displayedResult.risk === 'Moderate' || displayedResult.risk === 'Medium') ? '🟠' : '🟢'}
                                                    {displayedResult.risk}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* 2. CLINICAL OR KEY FACTORS DISPLAY */}
                            <div className="space-y-6">
                                <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] pl-2">
                                    {displayedResult.prediction_method.includes('Modified') ? "Doctor's Clinical Description" : 'Key Clinical Factors'}
                                </h3>

                                {displayedResult.prediction_method.includes('Modified') ? (
                                    <div className="bg-white rounded-[2rem] p-8 border-2 border-indigo-100 shadow-sm transition-all hover:shadow-md group relative overflow-hidden">
                                        <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50/50 rounded-full -mr-10 -mt-10 blur-2xl" />
                                        <div className="flex items-center gap-4 mb-6">
                                            <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-500 flex items-center justify-center">
                                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                                </svg>
                                            </div>
                                            <div>
                                                <h4 className="text-[10px] font-black text-indigo-400 uppercase tracking-widest leading-none mb-1">Physician Analysis</h4>
                                                <p className="text-sm font-black text-slate-900">Clinical Observations & Reasoning</p>
                                            </div>
                                        </div>
                                        <div className="relative z-10">
                                            <p className="text-[15px] font-bold text-slate-700 leading-relaxed bg-slate-50/50 p-6 rounded-2xl border border-slate-100/50 whitespace-pre-wrap">
                                                {displayedResult.explanation?.clean_explanation?.key_reason || 'This case was modified by your physician. Please consult with them for the full clinical details.'}
                                            </p>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                        {(displayedResult.explanation?.clean_explanation?.factors || []).map((f, i) => (
                                            <div key={i} className="bg-white rounded-[2rem] p-6 border border-slate-100 shadow-sm transition-all hover:shadow-md hover:translate-y-[-4px] group">
                                                <div className="flex items-center justify-between mb-4">
                                                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-colors ${f.status === 'High' ? 'bg-rose-50 text-rose-500' : f.status === 'Slightly high' || f.status === 'Borderline' ? 'bg-amber-50 text-amber-500' : 'bg-emerald-50 text-emerald-500'}`}>
                                                        <FactorIcon type={f.factor} />
                                                    </div>
                                                    <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${f.status === 'High' ? 'bg-rose-500 text-white' : f.status === 'Slightly high' || f.status === 'Borderline' ? 'bg-amber-400 text-white' : 'bg-emerald-400 text-white'}`}>
                                                        {f.status}
                                                    </span>
                                                </div>
                                                <div className="space-y-2 mb-6">
                                                    <p className="text-sm font-black text-slate-900 leading-tight">{f.display.split('(')[0]}</p>
                                                    <p className="text-[10px] font-bold text-slate-500 leading-relaxed bg-slate-50 p-2 rounded-lg border border-slate-100 whitespace-pre-wrap">
                                                        {f.description}
                                                    </p>
                                                </div>
                                                <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                                                    <div
                                                        className={`h-full rounded-full transition-all duration-1000 ${f.status === 'High' ? 'bg-rose-500' : f.status === 'Slightly high' || f.status === 'Borderline' ? 'bg-amber-400' : 'bg-emerald-400'}`}
                                                        style={{ width: f.status === 'High' ? '90%' : f.status === 'Slightly high' || f.status === 'Borderline' ? '60%' : '30%' }}
                                                    />
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* 3. SCANNED DATA SUMMARY */}
                            {displayedResult.data_summary && userRole === 'doctor' && (
                                <div className="space-y-6">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-2">
                                        <div className="bg-amber-50/40 rounded-[2.5rem] border border-amber-100/50 p-6 flex items-start gap-4">
                                            <div className="w-10 h-10 rounded-2xl bg-white border border-amber-100 flex items-center justify-center text-amber-500 shrink-0">
                                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                                </svg>
                                            </div>
                                            <div>
                                                <h4 className="text-[10px] font-black text-amber-600 uppercase tracking-widest mb-2">Symptoms</h4>
                                                <div className="flex flex-wrap gap-2">
                                                    {displayedResult.data_summary.symptoms_found?.length > 0 ? (
                                                        displayedResult.data_summary.symptoms_found.map((s, i) => (
                                                            <span key={i} className="px-2.5 py-1 bg-white border border-amber-100 rounded-lg text-[11px] font-bold text-slate-700 capitalize shadow-sm">{s}</span>
                                                        ))
                                                    ) : (
                                                        <span className="text-[11px] font-bold text-slate-400">No primary symptoms recorded.</span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="bg-blue-50/40 rounded-[2.5rem] border border-blue-100/50 p-6 flex items-start gap-4">
                                            <div className="w-10 h-10 rounded-2xl bg-white border border-blue-100 flex items-center justify-center text-blue-500 shrink-0">
                                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                </svg>
                                            </div>
                                            <div>
                                                <h4 className="text-[10px] font-black text-blue-600 uppercase tracking-widest mb-2">Lab Values</h4>
                                                <div className="flex flex-wrap gap-2">
                                                    {displayedResult.data_summary.lab_tests_found?.length > 0 ? (
                                                        displayedResult.data_summary.lab_tests_found.map((l, i) => (
                                                            <span key={i} className="px-2.5 py-1 bg-white border border-blue-100 rounded-lg text-[11px] font-bold text-slate-700 capitalize shadow-sm">
                                                                {l.replace(/_/g, ' ')}: <span className="text-blue-600 font-black">{displayedResult.data_summary?.lab_values?.[l]}</span>
                                                            </span>
                                                        ))
                                                    ) : (
                                                        <span className="text-[11px] font-bold text-slate-400">No laboratory data extracted.</span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* 4. SUMMARY */}
                            <div className="bg-blue-50/40 rounded-[2.5rem] border border-blue-100/50 p-8 flex gap-6 relative overflow-hidden transition-all hover:bg-blue-50/60">
                                <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-blue-500" />
                                <div className="w-12 h-12 rounded-2xl bg-white border border-blue-100 shadow-sm flex items-center justify-center text-blue-500 shrink-0">
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                </div>
                                <div className="space-y-2">
                                    <h3 className="text-sm font-black text-slate-800 tracking-tight">Summary</h3>
                                    <p className="text-sm font-medium text-slate-600 leading-relaxed md:pr-10">
                                        {displayedResult.explanation?.clean_explanation?.key_reason || 'Diagnostic pattern aligns with clinical markers and detected symptoms.'}
                                    </p>
                                </div>
                            </div>

                            {/* 5. NORMAL RANGES */}
                            <div className="bg-slate-50/50 rounded-[2.5rem] border border-slate-100 p-8 shadow-sm transition-all hover:bg-slate-50">
                                <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-6">Normal Reference Ranges</h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-4">
                                    {(displayedResult.explanation?.clean_explanation?.normal_ranges || []).map((r, i) => (
                                        <div key={i} className="flex justify-between items-center py-3 border-b border-slate-200/60">
                                            <span className="text-[13px] font-bold text-slate-500">{r.test}</span>
                                            <span className="text-[13px] font-black text-slate-800 bg-white px-3 py-1 rounded-lg border border-slate-100 shadow-sm">{r.range}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* 6. PRESCRIPTION */}
                            {displayedResult.prescription && userRole !== 'doctor' && (
                                <div className="pt-4 space-y-4">
                                    <h4 className="text-[11px] font-black text-emerald-600 uppercase tracking-[0.2em] pl-1">Doctor's Clinical Prescription</h4>
                                    <div className="bg-emerald-50/40 rounded-[2.5rem] border-2 border-emerald-100/50 p-8 flex gap-6 relative overflow-hidden transition-all hover:bg-emerald-50/60 group">
                                        <div className="absolute left-0 top-0 bottom-0 w-2 bg-emerald-500" />
                                        <div className="w-16 h-16 rounded-3xl bg-white border border-emerald-100 shadow-sm flex items-center justify-center text-emerald-500 shrink-0 group-hover:scale-110 transition-transform">
                                            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                                            </svg>
                                        </div>
                                        <div className="space-y-3">
                                            <h3 className="text-lg font-black text-slate-900 tracking-tight leading-none mb-1">Medication & Dosage</h3>
                                            <p className="text-[15px] font-bold text-slate-700 leading-relaxed bg-white/50 p-4 rounded-2xl border border-emerald-100/30 shadow-sm">
                                                {displayedResult.prescription}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* RIGHT PANEL */}
                        {userRole === 'doctor' && (
                            <div className="w-full xl:w-[55%]">
                                <div className="bg-white rounded-[2rem] border border-slate-200 shadow-sm p-8 h-fit flex flex-col">
                                    <div className="flex items-center justify-between mb-8 pb-4 border-b border-slate-50">
                                        <h3 className="text-[11px] font-black text-slate-900 uppercase tracking-widest">Doctor's Clinical Validation</h3>
                                        <PhysicianApprovalBadge status={patientStatus} />
                                    </div>

                                    <div className="space-y-8">
                                        <div className="grid grid-cols-2 gap-3">
                                            {[
                                                { id: 'Accept AI Prediction', label: 'Accept Prediction', color: 'blue' },
                                                { id: 'Modify Diagnosis', label: 'Modify Case', color: 'indigo' }
                                            ].map((option) => (
                                                <button
                                                    key={option.id}
                                                    onClick={() => handleDecisionChange(option.id)}
                                                    className={`p-4 rounded-xl border-2 transition-all duration-200 flex flex-col items-center gap-2 ${
                                                        validation.decision === option.id
                                                            ? option.id === 'Accept AI Prediction'
                                                                ? 'border-blue-600 bg-blue-50'
                                                                : 'border-indigo-600 bg-indigo-50'
                                                            : 'border-slate-100 hover:border-slate-200 bg-white'
                                                    }`}
                                                >
                                                    <span className={`text-[10px] font-black uppercase tracking-widest ${
                                                        validation.decision === option.id 
                                                            ? option.id === 'Accept AI Prediction' ? 'text-blue-700' : 'text-indigo-700'
                                                            : 'text-slate-400'
                                                    }`}>
                                                        {option.label}
                                                    </span>
                                                    {validation.decision === option.id && (
                                                        <div className={`w-1.5 h-1.5 rounded-full ${option.id === 'Accept AI Prediction' ? 'bg-blue-600' : 'bg-indigo-600'}`} />
                                                    )}
                                                </button>
                                            ))}
                                        </div>

                                        <div className="space-y-5">
                                            <div className="space-y-4">
                                                <label className="text-[10px] font-black text-amber-600 uppercase tracking-widest block ml-1">Description of the Disease (Patient View)</label>
                                                <div className="relative">
                                                    <textarea
                                                        value={validation.observations}
                                                        onChange={(e) => setValidation(prev => ({ ...prev, observations: e.target.value }))}
                                                        className="w-full p-6 rounded-[2rem] bg-amber-50/20 border-2 border-amber-100/50 text-xs font-bold leading-relaxed focus:ring-4 focus:ring-amber-500/10 focus:border-amber-400 transition-all resize-none h-48 outline-none"
                                                        placeholder="Enter a simple description of the disease and clinical findings that the patient can understand..."
                                                    />
                                                    <div className="absolute top-4 right-4 text-[9px] font-black text-amber-400 uppercase tracking-widest">Clinical Observations</div>
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <div className="space-y-2">
                                                    <label className="text-[10px] font-black text-blue-600 uppercase tracking-widest block ml-1">Final Certified Diagnosis</label>
                                                    <input
                                                        placeholder="Confirmed diagnosis..."
                                                        value={validation.finalDiagnosis}
                                                        disabled={validation.decision === 'Accept AI Prediction'}
                                                        onChange={(e) => setValidation({ ...validation, finalDiagnosis: e.target.value })}
                                                        className="w-full p-4 rounded-xl bg-blue-50/20 border-2 border-blue-100/50 text-xs font-black focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all disabled:bg-slate-50 disabled:text-slate-400 disabled:border-slate-200"
                                                    />
                                                </div>
                                                <div className="space-y-2">
                                                    <label className="text-[10px] font-black text-rose-600 uppercase tracking-widest block ml-1">Assessed Risk Level</label>
                                                    <select
                                                        value={validation.riskLevel}
                                                        disabled={validation.decision === 'Accept AI Prediction'}
                                                        onChange={(e) => setValidation({ ...validation, riskLevel: e.target.value })}
                                                        className="w-full p-4 rounded-xl bg-rose-50/20 border-2 border-rose-100/50 text-xs font-black focus:ring-4 focus:ring-rose-500/10 focus:border-rose-500 transition-all disabled:bg-slate-50 disabled:text-slate-400 disabled:border-slate-200"
                                                    >
                                                        <option value="">(Select Risk Level)</option>
                                                        <option value="Low">Low Risk</option>
                                                        <option value="Moderate">Moderate Risk</option>
                                                        <option value="High">High Risk</option>
                                                        <option value="Critical">Critical Risk</option>
                                                    </select>
                                                </div>
                                            </div>

                                            <div className="space-y-4 pt-4 border-t border-slate-50">
                                                <div className="space-y-2">
                                                    <label className="text-[10px] font-black text-slate-900 uppercase tracking-widest block ml-1">Doctor's Digital Signature (Print Name)</label>
                                                    <div className="relative">
                                                        <input
                                                            placeholder="Type your full name as signature..."
                                                            value={validation.doctorSignature}
                                                            onChange={(e) => setValidation({ ...validation, doctorSignature: e.target.value })}
                                                            className="w-full p-4 pl-12 rounded-xl bg-slate-50 border-2 border-slate-100 text-xs font-black focus:ring-4 focus:ring-slate-500/10 focus:border-slate-400 transition-all font-serif italic text-lg"
                                                        />
                                                        <svg className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                                        </svg>
                                                    </div>
                                                </div>

                                                <div className="space-y-4">
                                                    <label className="text-[10px] font-black text-indigo-600 uppercase tracking-widest block ml-1">Official Signature Image (PNG/JPG)</label>
                                                    <div className="flex items-center gap-4">
                                                        <label className="flex-1 relative cursor-pointer group">
                                                            <div className={`p-4 rounded-xl border-2 border-dashed transition-all flex items-center justify-center gap-3 ${validation.signaturePath ? 'bg-indigo-50 border-indigo-300' : 'bg-slate-50 border-slate-200 hover:border-indigo-300'}`}>
                                                                <svg className={`w-5 h-5 ${validation.signaturePath ? 'text-indigo-500' : 'text-slate-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                                                                </svg>
                                                                <span className={`text-[11px] font-black uppercase tracking-widest ${validation.signaturePath ? 'text-indigo-700' : 'text-slate-400'}`}>
                                                                    {validation.signaturePath ? 'Signature Loaded' : 'Upload Signature Image'}
                                                                </span>
                                                                <input type="file" onChange={handleSignatureUpload} className="hidden" accept="image/*" />
                                                            </div>
                                                        </label>
                                                        {validation.signaturePath && (
                                                            <div className="w-16 h-12 bg-white rounded-xl border border-indigo-100 flex items-center justify-center p-1 overflow-hidden">
                                                                <img src={`${API_BASE}${validation.signaturePath.replace(/\\/g, '/').split('backend')[1]}`} alt="Preview" className="max-w-full max-h-full object-contain" />
                                                            </div>
                                                        )}
                                                    </div>
                                                    <p className="text-[9px] font-bold text-slate-400 ml-1">This image will be embedded in the final health report footer.</p>
                                                </div>
                                            </div>

                                            {displayedResult.lab_report_url && (
                                                <div className="space-y-4 pt-4 border-t border-slate-50">
                                                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest block ml-1">Lab Report</h4>
                                                    <div className="relative group rounded-3xl overflow-hidden border-2 border-slate-100 bg-slate-50 aspect-[4/3] flex items-center justify-center shadow-inner">
                                                        <img src={displayedResult.lab_report_url.startsWith('h') ? displayedResult.lab_report_url : `${API_BASE}${displayedResult.lab_report_url}`} alt="Patient Lab Report" className="max-w-full max-h-full object-contain p-2 hover:scale-110 transition-transform duration-700" />
                                                        <div className="absolute inset-0 bg-slate-900/0 group-hover:bg-slate-900/5 transition-colors pointer-events-none" />
                                                        <a href={displayedResult.lab_report_url.startsWith('h') ? displayedResult.lab_report_url : `${API_BASE}${displayedResult.lab_report_url}`} target="_blank" rel="noopener noreferrer" className="absolute bottom-4 right-4 p-3 bg-white/95 backdrop-blur-xl rounded-2xl border border-slate-200 shadow-2xl text-[9px] font-black uppercase tracking-widest text-slate-600 opacity-0 group-hover:opacity-100 transition-all hover:bg-white hover:scale-105 active:scale-95">Review Original File</a>
                                                    </div>
                                                </div>
                                            )}
                                        </div>

                                        <div className="flex items-center justify-center gap-3 mt-8 pt-6 border-t border-slate-100">
                                            <button
                                                onClick={() => triggerConfirm('finalize')}
                                                disabled={submittingValidation || isSavingDraft || !validation.decision}
                                                className="px-8 py-4 bg-slate-900 text-white rounded-xl font-black text-[10px] uppercase tracking-widest shadow-xl hover:bg-slate-800 transition-all active:scale-95 disabled:opacity-30 flex items-center gap-2"
                                            >
                                                {submittingValidation && <div className="w-3 h-3 border-2 border-white/20 border-t-white rounded-full animate-spin" />}
                                                Finalize & Save Clinical Decision
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center py-32 text-center animate-fade-in relative z-10 w-full min-h-[50vh]">
                        {!loading && (
                            <>
                                <div className="w-20 h-20 bg-white rounded-3xl shadow-xl flex items-center justify-center mb-10 group transition-all hover:scale-110 mx-auto">
                                    <svg className="w-10 h-10 text-blue-100 group-hover:text-blue-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                                    </svg>
                                </div>
                                <h3 className="text-2xl font-black text-slate-800 mb-2">Ready for analysis</h3>
                            </>
                        )}
                    </div>
                )}
            </main>
        </div>
    );
};

export default PredictionView;

