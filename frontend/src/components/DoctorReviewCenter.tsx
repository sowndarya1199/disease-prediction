import { API_BASE } from '../config';
import React, { useState, useEffect } from 'react';
import PredictionView from './PredictionView';

interface Patient {
    id: number;
    name: string;
    age: number;
    gender: string;
    approval_status: string;
    risk_level?: string;
}

interface DoctorReviewCenterProps {
    initialPatientId?: number | null;
}

const DoctorReviewCenter: React.FC<DoctorReviewCenterProps> = ({ initialPatientId }) => {
    const [pendingPatients, setPendingPatients] = useState<Patient[]>([]);
    const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
    const [loadingQueue, setLoadingQueue] = useState(true);
    const [analysisResult, setAnalysisResult] = useState<any | null>(null);
    const [analysisLoading, setAnalysisLoading] = useState(false);
    const [analysisError, setAnalysisError] = useState<string | null>(null);
    const [viewMode, setViewMode] = useState<'queue' | 'detail'>(initialPatientId ? 'detail' : 'queue');

    const fetchPendingQueue = async () => {
        try {
            const res = await fetch(`${API_BASE}/patients/`);
            if (res.ok) {
                const allPatients = await res.json();
                const pending = allPatients.filter((p: any) =>
                    p.approval_status === 'Pending Approval' || p.approval_status === 'Modified' || p.approval_status === 'Approved'
                );
                setPendingPatients(pending);
            }
        } catch { } finally {
            setLoadingQueue(false);
        }
    };

    useEffect(() => {
        fetchPendingQueue();
        const interval = setInterval(fetchPendingQueue, 10000);
        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        if (initialPatientId && pendingPatients.length > 0) {
            const patient = pendingPatients.find(p => p.id === initialPatientId);
            if (patient) {
                handlePatientSelect(patient);
            }
        }
    }, [initialPatientId, pendingPatients.length]);

    const handlePatientSelect = async (patient: Patient) => {
        setSelectedPatient(patient);
        setViewMode('detail');
        setAnalysisLoading(true);
        setAnalysisError(null);
        setAnalysisResult(null);

        try {
            const res = await fetch(`${API_BASE}/patients/${patient.id}/predict`, { method: 'POST' });
            if (res.ok) {
                const data = await res.json();
                setAnalysisResult(data);
            } else {
                setAnalysisError("Failed to fetch diagnostic data.");
            }
        } catch {
            setAnalysisError("Connection error.");
        } finally {
            setAnalysisLoading(false);
        }
    };

    const handleBackToQueue = () => {
        setViewMode('queue');
        setSelectedPatient(null);
        setAnalysisResult(null);
        fetchPendingQueue();
    };

    if (viewMode === 'detail' && selectedPatient) {
        return (
            <div className="flex flex-col h-full bg-slate-50/50 animate-fade-in relative">
                
                <header className="sticky top-0 z-[60] bg-white border-b border-slate-200 px-10 py-5 flex items-center justify-between shadow-sm">
                    <div className="flex items-center gap-8">
                        <button
                            onClick={handleBackToQueue}
                            className="flex items-center gap-2 text-slate-400 hover:text-slate-900 transition-all font-black uppercase tracking-widest text-[9px]"
                        >
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M15 19l-7-7 7-7" />
                            </svg>
                            Back to Queue
                        </button>

                        <div className="h-6 w-px bg-slate-200" />

                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-xl bg-slate-900 flex items-center justify-center text-white font-black text-sm shadow-md">
                                {selectedPatient.name.charAt(0).toUpperCase()}
                            </div>
                            <div>
                                <h2 className="text-base font-black text-slate-900 tracking-tight leading-none mb-1.5 flex items-center gap-3">
                                    {selectedPatient.name}
                                </h2>
                                <div className="flex items-center gap-3">
                                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-tight">{selectedPatient.gender} • {selectedPatient.age}y</span>
                                    <div className={`flex items-center gap-1.5 px-2 py-0.5 ${selectedPatient.approval_status === 'Approved' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : selectedPatient.approval_status === 'Modified' ? 'bg-amber-50 text-amber-600 border-amber-100' : 'bg-blue-50 text-blue-600 border-blue-100'} rounded-full border`}>
                                        <span className={`w-1.5 h-1.5 rounded-full ${selectedPatient.approval_status === 'Approved' ? 'bg-emerald-600' : selectedPatient.approval_status === 'Modified' ? 'bg-amber-600' : 'bg-blue-600 animate-pulse'}`} />
                                        <span className="text-[9px] font-black uppercase tracking-tighter">
                                            {selectedPatient.approval_status === 'Pending Approval' ? 'Diagnostic Pending' : selectedPatient.approval_status}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                </header>

                <div className="flex-1">
                    <PredictionView
                        initialPatientId={selectedPatient.id}
                        userRole="doctor"
                        result={analysisResult}
                        loading={analysisLoading}
                        error={analysisError}
                        isEmbed={true}
                    />
                </div>
            </div>
        );
    }

    return (
        <div className="p-8 h-full bg-slate-50/30 overflow-y-auto animate-fade-in">
            <header className="mb-10 flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-black text-slate-800 tracking-tighter">Clinical Validation Center</h1>
                    <p className="text-sm font-bold text-slate-400 uppercase tracking-widest mt-1">Diagnostic Review Queue</p>
                </div>
                <div className="flex items-center gap-3">
                    <div className="px-4 py-2 bg-blue-100 rounded-2xl flex items-center gap-2 border border-blue-200">
                        <span className="w-2 h-2 bg-blue-600 rounded-full animate-pulse" />
                        <span className="text-xs font-black text-blue-700 uppercase tracking-widest">
                            {pendingPatients.length} Active Cases
                        </span>
                    </div>
                </div>
            </header>

            {loadingQueue ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="h-48 bg-white rounded-[2.5rem] border border-slate-100 animate-pulse" />
                    ))}
                </div>
            ) : pendingPatients.length === 0 ? (
                <div className="max-w-md mx-auto mt-20 text-center">
                    <div className="w-24 h-24 bg-white rounded-[2.5rem] shadow-xl flex items-center justify-center mx-auto mb-8 border border-slate-100">
                        <span className="text-4xl">✅</span>
                    </div>
                    <h2 className="text-xl font-black text-slate-800 tracking-tight">Queue Clear</h2>
                    <p className="text-sm font-bold text-slate-400 uppercase tracking-widest leading-relaxed mt-2">
                        All patient diagnostic reports have been clinically verified.
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {pendingPatients.map((patient) => (
                        <button
                            key={patient.id}
                            onClick={() => handlePatientSelect(patient)}
                            className="group bg-white rounded-[2.5rem] p-6 text-left border border-slate-100 hover:border-blue-400 transition-all duration-500 hover:shadow-2xl hover:shadow-blue-200/50 hover:-translate-y-1 relative overflow-hidden"
                        >
                           
                            <div className="absolute top-0 right-0 w-24 h-24 bg-blue-50 rounded-bl-[4rem] -mr-8 -mt-8 group-hover:bg-blue-600 transition-colors duration-500" />

                            <div className="relative z-10">
                                <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center font-black text-xl text-slate-500 group-hover:bg-white group-hover:text-blue-600 transition-colors mb-6 shadow-sm">
                                    {patient.name.charAt(0).toUpperCase()}
                                </div>

                                <h3 className="text-lg font-black text-slate-900 leading-tight mb-1 group-hover:text-blue-700 transition-colors">
                                    {patient.name}
                                </h3>
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">
                                    {patient.gender} • {patient.age} years
                                </p>

                                <div className="flex items-center justify-between mt-auto pt-4 border-t border-slate-50">
                                    <div className="flex items-center gap-2">
                                        <div className={`w-2 h-2 rounded-full ${patient.approval_status === 'Modified' ? 'bg-amber-400' : patient.approval_status === 'Approved' ? 'bg-emerald-400' : 'bg-blue-400'}`} />
                                        <span className={`text-[10px] font-black uppercase tracking-tighter ${patient.approval_status === 'Approved' ? 'text-emerald-500' : 'text-slate-400'}`}>
                                            {patient.approval_status}
                                        </span>
                                    </div>
                                    <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-all">
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5l7 7-7 7" />
                                        </svg>
                                    </div>
                                </div>
                            </div>
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
};

export default DoctorReviewCenter;

