import { API_BASE } from '../config';
import React, { useState, useEffect } from 'react';
import DietReviewDetail from './DietReviewDetail';

interface Patient {
    id: number;
    name: string;
    age: number;
    gender: string;
    approval_status: string;
}

interface DietReviewCenterProps {
    initialPatientId?: number | null;
}

const DietReviewCenter: React.FC<DietReviewCenterProps> = ({ initialPatientId }) => {
    const [patients, setPatients] = useState<Patient[]>([]);
    const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
    const [loading, setLoading] = useState(true);
    const [viewMode, setViewMode] = useState<'queue' | 'detail'>(initialPatientId ? 'detail' : 'queue');

    const fetchPatients = async () => {
        try {
            const res = await fetch('${API_BASE}/patients/');
            if (res.ok) {
                const allPatients = await res.json();
                // Show patients who have a diagnostic status (Approved/Modified) as they likely need a diet plan
                const filtered = allPatients.filter((p: any) => 
                    p.approval_status === 'Approved' || p.approval_status === 'Modified' || p.approval_status === 'Pending Approval'
                );
                setPatients(filtered);
            }
        } catch { } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPatients();
    }, []);

    useEffect(() => {
        if (initialPatientId && patients.length > 0) {
            const patient = patients.find(p => p.id === initialPatientId);
            if (patient) {
                setSelectedPatient(patient);
                setViewMode('detail');
            }
        }
    }, [initialPatientId, patients]);

    const handlePatientSelect = (patient: Patient) => {
        setSelectedPatient(patient);
        setViewMode('detail');
    };

    const handleBack = () => {
        setViewMode('queue');
        setSelectedPatient(null);
        fetchPatients();
    };

    if (viewMode === 'detail' && selectedPatient) {
        return (
            <div className="flex flex-col h-full bg-slate-50 animate-fade-in">
                <header className="sticky top-0 z-50 bg-white border-b border-slate-200 px-8 py-4 flex items-center justify-between shadow-sm">
                    <div className="flex items-center gap-6">
                        <button
                            onClick={handleBack}
                            className="p-2 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-900 transition-all"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 19l-7-7 7-7" />
                            </svg>
                        </button>
                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-xl bg-emerald-600 flex items-center justify-center text-white font-black">
                                {selectedPatient.name.charAt(0).toUpperCase()}
                            </div>
                            <div>
                                <h2 className="text-lg font-black text-slate-900 leading-none mb-1">{selectedPatient.name}</h2>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{selectedPatient.gender} • {selectedPatient.age}y</p>
                            </div>
                        </div>
                    </div>
                    <div className="px-4 py-1.5 bg-emerald-50 text-emerald-600 rounded-full border border-emerald-100 text-[10px] font-black uppercase tracking-widest">
                        Clinical Diet Review
                    </div>
                </header>
                <div className="flex-1 overflow-auto">
                    <DietReviewDetail patientId={selectedPatient.id} />
                </div>
            </div>
        );
    }

    return (
        <div className="p-8 h-full bg-slate-50/30 overflow-y-auto animate-fade-in">
            <header className="mb-10">
                <h1 className="text-3xl font-black text-slate-900 tracking-tighter">Dietary Review Center</h1>
                <p className="text-sm font-bold text-slate-400 uppercase tracking-widest mt-1">Review & Sign Nutrition Plans</p>
            </header>

            {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="h-40 bg-white rounded-3xl border border-slate-100 animate-pulse" />
                    ))}
                </div>
            ) : patients.length === 0 ? (
                <div className="text-center py-20">
                    <div className="text-4xl mb-4">🥗</div>
                    <h2 className="text-xl font-black text-slate-800">All reviews caught up</h2>
                    <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px] mt-2">No patients currently pending nutrition review.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {patients.map((p) => (
                        <button
                            key={p.id}
                            onClick={() => handlePatientSelect(p)}
                            className="bg-white rounded-[2rem] p-6 text-left border border-slate-100 hover:border-emerald-500 transition-all group relative overflow-hidden shadow-sm hover:shadow-xl"
                        >
                            <div className="absolute top-0 right-0 w-16 h-16 bg-emerald-50 rounded-bl-[2rem] transition-colors group-hover:bg-emerald-600/10" />
                            <div className="relative z-10">
                                <div className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center font-black text-slate-400 group-hover:bg-emerald-600 group-hover:text-white transition-colors mb-4">
                                    {p.name.charAt(0).toUpperCase()}
                                </div>
                                <h3 className="text-lg font-black text-slate-900 mb-1">{p.name}</h3>
                                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-6">{p.gender} • {p.age}y</p>
                                
                                <div className="flex items-center justify-between pt-4 border-t border-slate-50">
                                    <span className="text-[9px] font-black uppercase text-emerald-600">Review Diet</span>
                                    <svg className="w-4 h-4 text-slate-300 group-hover:text-emerald-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                                    </svg>
                                </div>
                            </div>
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
};

export default DietReviewCenter;

