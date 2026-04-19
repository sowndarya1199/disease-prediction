import { API_BASE } from '../config';
import React, { useState, useEffect } from 'react';

interface Patient { id: number; name: string; approval_status: string; }

const HealthReportView: React.FC = () => {
    const [patients, setPatients] = useState<Patient[]>([]);
    const [selectedPatientId, setSelectedPatientId] = useState<number | ''>('');
    const [reportData, setReportData] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        fetch(`${API_BASE}/patients/`)
            .then(r => r.ok ? r.json() : [])
            .then((data: Patient[]) => {
                const verifiedPatients = data.filter(p => p.approval_status === 'Approved' || p.approval_status === 'Modified');
                setPatients(verifiedPatients);
            })
            .catch(() => setError('Failed to load patients.'));
    }, []);

    useEffect(() => {
        if (selectedPatientId) {
            setLoading(true);
            setReportData(null);
            fetch(`${API_BASE}/patients/${selectedPatientId}/predict`, { method: 'POST' })
                .then(r => r.ok ? r.json() : null)
                .then(data => {
                    setReportData(data);
                    setLoading(false);
                })
                .catch(() => {
                    setError('Failed to load report data.');
                    setLoading(false);
                });
        } else {
            setReportData(null);
        }
    }, [selectedPatientId]);

    const inputStyle = {
        background: 'var(--gray-50)',
        border: '2px solid var(--gray-200)',
        color: 'var(--gray-800)',
    };

    const downloadUrl = selectedPatientId ? `${API_BASE}/patients/${selectedPatientId}/download-health-report` : '';

    return (
        <div className="p-6 md:p-8" style={{ background: 'linear-gradient(135deg,#eff6ff,#dbeafe,#eff6ff)', minHeight: '100vh' }}>
            <div className="max-w-6xl mx-auto space-y-6 h-full flex flex-col">

                
                <div>
                    <h1 className="text-3xl font-black" style={{ color: '#1e3a8a' }}>📄 Health Report</h1>
                    <p className="text-sm" style={{ color: 'var(--gray-500)' }}>View and download the clinically verified comprehensive health report</p>
                </div>

               
                <div className="glass rounded-2xl p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 items-end">
                        <div className="lg:col-span-2">
                            <label className="block text-sm font-semibold mb-2" style={{ color: 'var(--gray-700)' }}>👤 Select Verified Patient</label>
                            <select
                                value={selectedPatientId}
                                onChange={e => setSelectedPatientId(Number(e.target.value))}
                                className="w-full px-4 py-3 rounded-xl cursor-pointer"
                                style={inputStyle}
                            >
                                <option value="">— Choose a patient —</option>
                                {patients.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                            </select>
                        </div>
                        {selectedPatientId && (
                            <div className="flex">
                                <a
                                    href={downloadUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    download={`${patients.find(p => p.id === selectedPatientId)?.name || 'Patient'}_Health_Report.pdf`}
                                    className="w-full px-6 py-3 rounded-xl font-bold flex items-center justify-center gap-2 text-white hover:scale-[1.02] active:scale-95 transition-all shadow-xl"
                                    style={{ background: 'linear-gradient(135deg, #2563eb, #1d4ed8)', boxShadow: '0 10px 30px rgba(37,99,235,.2)' }}
                                >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                    </svg>
                                    Download PDF Report
                                </a>
                            </div>
                        )}
                    </div>
                </div>

                {/* Error */}
                {error && (
                    <div className="px-5 py-4 rounded-xl flex items-center gap-3 bg-red-50 border border-red-100 text-red-600 shadow-sm">
                        ⚠️ <span className="font-medium">{error}</span>
                    </div>
                )}

                {/* Report Content Display */}
                {loading && (
                    <div className="py-20 text-center space-y-4">
                        <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
                        <p className="text-blue-900 font-bold">Assembling Clinical Data...</p>
                    </div>
                )}

                {selectedPatientId && reportData && !loading && (
                    <div className="animate-fade-in space-y-8 pb-20">
                        {/* Summary Card */}
                        <div className="bg-white rounded-[2.5rem] p-10 shadow-2xl shadow-blue-900/10 border border-blue-50 relative overflow-hidden group">
                            <div className="absolute top-0 right-0 w-64 h-64 bg-blue-50 rounded-full -mr-32 -mt-32 blur-3xl opacity-50 group-hover:opacity-100 transition-opacity" />
                            <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                                <div className="space-y-3">
                                    <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border border-blue-100 ${reportData.risk === 'High' ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'} shadow-sm`}>
                                        {reportData.risk} Clinical Risk Level
                                    </span>
                                    <h2 className="text-4xl md:text-5xl font-black text-blue-950 tracking-tight">{reportData.disease}</h2>
                                    <p className="text-sm font-bold text-blue-800/60 leading-relaxed max-w-2xl">
                                        {reportData.explanation?.clean_explanation?.key_reason || reportData.explanation?.summary || "Clinical assessment finalized by medical professional."}
                                    </p>
                                </div>
                                <div className="bg-blue-600 px-8 py-6 rounded-3xl text-white text-center shadow-2xl shadow-blue-600/30">
                                    <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-80 mb-1">Status</p>
                                    <p className="text-2xl font-black">{reportData.risk.toUpperCase()}</p>
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                            {/* Analysis Factors */}
                            <div className="lg:col-span-2 space-y-6">
                                <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest ml-4">Analysis Insights</h3>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    {reportData.explanation?.clean_explanation?.factors?.map((f: any, i: number) => (
                                        <div key={i} className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm hover:shadow-md transition-all hover:-translate-y-1">
                                            <div className="flex justify-between items-start mb-4">
                                                <div className={`w-10 h-10 rounded-2xl flex items-center justify-center text-xl ${f.status === 'High' ? 'bg-red-50 text-red-500' : 'bg-green-50 text-green-500'}`}>
                                                    {f.factor.toLowerCase().includes('glucose') ? '🩸' : f.factor.toLowerCase().includes('bmi') ? '⚖️' : '🧬'}
                                                </div>
                                                <span className={`text-[9px] font-black px-2.5 py-1 rounded-full uppercase ${f.status === 'High' || f.status.includes('high') ? 'bg-red-500 text-white' : 'bg-green-500 text-white'}`}>
                                                    {f.status}
                                                </span>
                                            </div>
                                            <p className="text-sm font-black text-blue-950 mb-2">{f.display.split('(')[0]}</p>
                                            <p className="text-[11px] font-bold text-slate-500 leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-100">{f.description}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Reference Ranges */}
                            <div className="space-y-6">
                                <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest ml-4">Clinical Reference</h3>
                                <div className="bg-slate-900 rounded-[2.5rem] p-8 text-white shadow-2xl">
                                    <div className="space-y-4">
                                        {reportData.explanation?.clean_explanation?.normal_ranges?.map((r: any, i: number) => (
                                            <div key={i} className="flex justify-between items-center py-3 border-b border-white/10 last:border-0">
                                                <span className="text-xs font-bold text-slate-400">{r.test}</span>
                                                <span className="text-xs font-black text-blue-200">{r.range}</span>
                                            </div>
                                        ))}
                                    </div>
                                    <div className="mt-8 p-6 bg-white/5 rounded-3xl border border-white/10">
                                        <p className="text-[10px] font-black text-blue-300 uppercase tracking-[0.2em] mb-3 leading-none">Prescription/Notes</p>
                                        <p className="text-xs font-medium leading-relaxed italic">
                                            {reportData.prescription || "Follow standard protocol for diagnosed condition. Re-test scheduled markers in 30 days."}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Initial Empty State */}
                {!selectedPatientId && (
                    <div className="flex-1 flex flex-col items-center justify-center py-20 text-center">
                        <div className="w-32 h-32 bg-blue-100 rounded-[3rem] flex items-center justify-center text-6xl shadow-inner mb-8 animate-float">📄</div>
                        <h3 className="text-3xl font-black text-blue-950 mb-4 tracking-tight">Generate Report Detail</h3>
                        <p className="text-blue-900/50 max-w-sm font-bold leading-relaxed">
                            Select a verified patient above to load their comprehensive clinical diagnostics directly on this page.
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default HealthReportView;

