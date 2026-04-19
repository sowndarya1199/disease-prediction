import { API_BASE } from '../config';
import React, { useState, useEffect } from 'react';

interface Patient {
    id: number;
    name: string;
}

interface LabResult {
    id: number;
    test_name: string;
    value: number;
    unit: string;
    is_abnormal: boolean;
    reference_range: string;
}

const LabEntry: React.FC = () => {
    const [patients, setPatients] = useState<Patient[]>([]);
    const [selectedPatientId, setSelectedPatientId] = useState<number | ''>('');
    const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
    const [recentResults, setRecentResults] = useState<LabResult[]>([]);
    const [uploadLoading, setUploadLoading] = useState(false);
    const [dragActive, setDragActive] = useState(false);
    const [selectedIds, setSelectedIds] = useState<number[]>([]);
    const [isSimulated, setIsSimulated] = useState(false);

    useEffect(() => {
        const fetchPatients = async () => {
            try {
                const response = await fetch(`${API_BASE}/patients/`);
                if (response.ok) {
                    const data = await response.json();
                    setPatients(data);
                }
            } catch (error) {
                console.error("Error fetching patients:", error);
            }
        };
        fetchPatients();
    }, []);

    useEffect(() => {
        const fetchRecentResults = async () => {
            setSelectedIds([]); // Clear selection on patient change
            if (!selectedPatientId) {
                setRecentResults([]);
                return;
            }

            try {
                const response = await fetch(`${API_BASE}/labs/${selectedPatientId}`);
                if (response.ok) {
                    const data = await response.json();
                    setRecentResults(data);
                }
            } catch (error) {
                console.error("Error fetching recent results:", error);
            }
        };
        fetchRecentResults();
    }, [selectedPatientId]);

    const handleFileUpload = async (file: File) => {
        if (!selectedPatientId) {
            setMessage({ text: 'Please select a patient first', type: 'error' });
            return;
        }

        setMessage(null);
        setUploadLoading(true);

        const formData = new FormData();
        formData.append('file', file);
        formData.append('patient_id', selectedPatientId.toString());

        try {
            const response = await fetch(`${API_BASE}/labs/upload`, {
                method: 'POST',
                body: formData,
            });

            const data = await response.json();

            if (response.ok && data.success) {
                setIsSimulated(!!data.is_simulated);
                if (data.is_simulated) {
                    setMessage({ text: '⚠️ OCR failed: Showing simulated data for validation.', type: 'error' });
                } else {
                    setMessage({ text: data.message || 'Report processed successfully!', type: 'success' });
                }
                // Refresh list
                const resultsResponse = await fetch(`${API_BASE}/labs/${selectedPatientId}`);
                if (resultsResponse.ok) {
                    const newData = await resultsResponse.json();
                    setRecentResults(newData);
                }
            } else {
                setMessage({ text: data.message || 'Failed to process report.', type: 'error' });
                setIsSimulated(false);
            }
        } catch (error) {
            setMessage({ text: 'Network error occurred during upload.', type: 'error' });
        } finally {
            setUploadLoading(false);
        }
    };

    const handleDrag = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === "dragenter" || e.type === "dragover") {
            setDragActive(true);
        } else if (e.type === "dragleave") {
            setDragActive(false);
        }
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            handleFileUpload(e.dataTransfer.files[0]);
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            handleFileUpload(e.target.files[0]);
        }
    };

    const handleDeleteResult = async (resultId: number) => {
        if (!window.confirm('🗑️ Are you sure you want to delete this lab entry?')) return;

        try {
            const response = await fetch(`${API_BASE}/labs/${resultId}`, {
                method: 'DELETE'
            });

            if (response.ok) {
                setRecentResults(prev => prev.filter(r => r.id !== resultId));
                setSelectedIds(prev => prev.filter(id => id !== resultId));
                setMessage({ text: 'Lab result deleted successfully!', type: 'success' });
            } else {
                setMessage({ text: 'Failed to delete lab result.', type: 'error' });
            }
        } catch (error) {
            setMessage({ text: 'Connection error while deleting.', type: 'error' });
        }
    };

    const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.checked) {
            setSelectedIds(recentResults.map(r => r.id));
        } else {
            setSelectedIds([]);
        }
    };

    const handleSelectOne = (id: number) => {
        if (selectedIds.includes(id)) {
            setSelectedIds(prev => prev.filter(item => item !== id));
        } else {
            setSelectedIds(prev => [...prev, id]);
        }
    };

    const handleBulkDelete = async () => {
        if (!selectedIds.length) return;
        if (!window.confirm(`🗑️ Are you sure you want to delete ${selectedIds.length} items?`)) return;

        try {
            const response = await fetch(`${API_BASE}/labs/delete-batch`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(selectedIds)
            });

            if (response.ok) {
                setRecentResults(prev => prev.filter(r => !selectedIds.includes(r.id)));
                setSelectedIds([]);
                setMessage({ text: `${selectedIds.length} items deleted successfully!`, type: 'success' });
            } else {
                setMessage({ text: 'Failed to delete selected items.', type: 'error' });
            }
        } catch (error) {
            setMessage({ text: 'Connection error while deleting.', type: 'error' });
        }
    };

    return (
        <div className="p-6 md:p-8">
            <div className="max-w-5xl mx-auto">
                <div className="mb-8 text-center lg:text-left">
                    <div className="flex flex-col lg:flex-row items-center gap-4 mb-2">
                        <div
                            className="w-14 h-14 rounded-2xl flex items-center justify-center shadow-xl mb-2 lg:mb-0"
                            style={{
                                background: 'linear-gradient(135deg, var(--primary-500), var(--accent-500))',
                            }}
                        >
                            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                        </div>
                        <div>
                            <h1 className="text-3xl font-extrabold tracking-tight" style={{ color: 'var(--gray-900)' }}>Lab Report</h1>
                        </div>
                    </div>
                </div>

                {isSimulated && (
                    <div className="mb-6 p-5 rounded-2xl bg-amber-50 border-2 border-amber-200 flex items-center gap-4 animate-fadeIn">
                        <div className="w-12 h-12 rounded-xl bg-amber-100 flex items-center justify-center shrink-0">
                            <span className="text-2xl">⚠️</span>
                        </div>
                        <div>
                            <h3 className="text-amber-900 font-bold text-lg">Simulation Mode Active</h3>
                            <p className="text-amber-800 opacity-80 font-medium">Internal OCR could not read this document. The values shown below are generated for testing purposes and do not reflect patient data.</p>
                        </div>
                    </div>
                )}

                {message && (
                    <div
                        className="mb-8 px-6 py-4 rounded-2xl flex items-center gap-4 animate-fadeIn"
                        style={{
                            background: message.type === 'success' ? '#f0fdf4' : '#fef2f2',
                            border: `1px solid ${message.type === 'success' ? '#22c55e' : '#ef4444'}`,
                            color: message.type === 'success' ? '#15803d' : '#b91c1c'
                        }}
                    >
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${message.type === 'success' ? 'bg-green-100' : 'bg-red-100'}`}>
                            {message.type === 'success' ? (
                                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
                            ) : (
                                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
                            )}
                        </div>
                        <span className="font-semibold text-lg">{message.text}</span>
                    </div>
                )}

                <div className="grid lg:grid-cols-12 gap-8">
                    <div className="lg:col-span-8 space-y-8">
                        
                        <div className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-slate-100 relative overflow-hidden group transition-all hover:shadow-md">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-primary-50 rounded-full blur-3xl -mr-16 -mt-16 opacity-50 group-hover:opacity-100 transition-opacity"></div>

                            <label className="block text-sm font-bold uppercase tracking-wider mb-4 opacity-60" style={{ color: 'var(--gray-900)' }}>
                                🧪 Patient
                            </label>

                            <div className="relative">
                                <select
                                    value={selectedPatientId}
                                    onChange={(e) => setSelectedPatientId(Number(e.target.value))}
                                    className="w-full px-6 py-4 rounded-[1.25rem] text-lg font-medium cursor-pointer appearance-none transition-all duration-300 focus:ring-4 focus:ring-primary-50 outline-none"
                                    style={{
                                        background: 'var(--gray-50)',
                                        border: '2px solid var(--gray-100)',
                                        color: 'var(--gray-900)'
                                    }}
                                >
                                    <option value="" style={{ color: '#000', backgroundColor: '#fff' }}>Choose a patient</option>
                                    {patients.map((p) => (
                                        <option key={p.id} value={p.id} style={{ color: '#000', backgroundColor: '#fff' }}>{p.name}</option>
                                    ))}
                                </select>
                                <div className="absolute right-6 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
                                </div>
                            </div>
                        </div>

                        
                        <div
                            className={`bg-white rounded-[2.5rem] p-1 shadow-sm border-2 border-dashed transition-all duration-500 overflow-hidden ${!selectedPatientId ? 'opacity-50 grayscale' : 'hover:border-primary-400'
                                } ${dragActive ? 'border-primary-500 bg-primary-50/30' : 'border-slate-200'}`}
                            onDragEnter={handleDrag}
                            onDragLeave={handleDrag}
                            onDragOver={handleDrag}
                            onDrop={handleDrop}
                        >
                            <div className="p-10 text-center flex flex-col items-center gap-6 relative">
                                {uploadLoading && (
                                    <div className="absolute inset-0 bg-white/80 backdrop-blur-sm z-50 flex flex-col items-center justify-center gap-4">
                                        <div className="relative">
                                            <div className="w-20 h-20 border-4 border-primary-100 rounded-full"></div>
                                            <div className="w-20 h-20 border-4 border-t-primary-500 rounded-full animate-spin absolute top-0 left-0"></div>
                                        </div>
                                        <p className="text-xl font-bold tracking-tight text-primary-900">Analysis in progress</p>
                                    </div>
                                )}

                                <div className={`w-24 h-24 rounded-3xl flex items-center justify-center transition-all duration-500 ${dragActive ? 'bg-primary-500 scale-110' : 'bg-primary-50 text-primary-600'}`}>
                                    <svg className={`w-12 h-12 transition-colors ${dragActive ? 'text-white' : 'text-primary-500'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                                    </svg>
                                </div>

                                <div className="space-y-2">
                                    <h3 className="text-2xl font-bold text-slate-900">Upload Lab Report</h3>
                                </div>

                                <input
                                    id="file-upload"
                                    type="file"
                                    className="hidden"
                                    onChange={handleFileChange}
                                    accept=".pdf,image/*"
                                    disabled={!selectedPatientId || uploadLoading}
                                />

                                <label
                                    htmlFor="file-upload"
                                    className={`px-10 py-4 rounded-2xl font-bold text-lg transition-all duration-300 transform ${!selectedPatientId || uploadLoading
                                        ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                                        : 'bg-blue-600 text-white hover:bg-blue-700 hover:-translate-y-1 shadow-blue-200 shadow-xl cursor-pointer active:scale-95'
                                        }`}
                                >
                                    Select Report Document
                                </label>
                            </div>
                        </div>
                    </div>

                    <div className="lg:col-span-4 space-y-6">
                        <div className="bg-slate-900 rounded-[2.5rem] p-8 shadow-xl text-white relative overflow-hidden h-full">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-primary-500/20 rounded-full blur-3xl -mr-16 -mt-16"></div>

                            <div className="flex items-center justify-between mb-6">
                                <h3 className="text-xl font-bold flex items-center gap-3">
                                    Results
                                </h3>

                                {selectedIds.length > 0 && (
                                    <button
                                        onClick={handleBulkDelete}
                                        className="text-xs bg-red-500/80 hover:bg-red-500 text-white px-3 py-1.5 rounded-lg font-bold transition-colors animate-fadeIn"
                                    >
                                        Delete ({selectedIds.length})
                                    </button>
                                )}
                            </div>

                            {recentResults.length > 0 && (
                                <div className="mb-4 flex items-center gap-3 px-2">
                                    <div className="relative flex items-center">
                                        <input
                                            type="checkbox"
                                            checked={recentResults.length > 0 && selectedIds.length === recentResults.length}
                                            onChange={handleSelectAll}
                                            id="select-all"
                                            className="peer w-5 h-5 appearance-none border-2 border-white/30 rounded-lg bg-transparent checked:bg-primary-500 checked:border-primary-500 transition-all cursor-pointer"
                                        />
                                        <svg className="absolute w-3.5 h-3.5 text-white left-[3px] top-[3px] opacity-0 peer-checked:opacity-100 pointer-events-none transition-opacity" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                                        </svg>
                                    </div>
                                    <label htmlFor="select-all" className="text-sm font-medium text-white/60 cursor-pointer select-none">
                                        Select All
                                    </label>
                                </div>
                            )}

                            {recentResults.length === 0 ? null : (
                                <div className="space-y-4 max-h-[600px] overflow-auto pr-2 custom-scrollbar">
                                    {recentResults.map((result) => (
                                        <div
                                            key={result.id}
                                            onClick={() => handleSelectOne(result.id)}
                                            className={`p-5 rounded-2xl border transition-all hover:bg-white/10 group relative cursor-pointer ${selectedIds.includes(result.id)
                                                ? 'bg-primary-500/20 border-primary-500/50'
                                                : 'bg-white/5 border-white/10'
                                                }`}
                                        >
                                            <div className="absolute top-4 right-4 flex items-center gap-3">
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleDeleteResult(result.id);
                                                    }}
                                                    className="text-white/30 hover:text-red-400 transition-colors"
                                                    title="Delete this result"
                                                >
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                    </svg>
                                                </button>
                                                <div className="relative flex items-center">
                                                    <input
                                                        type="checkbox"
                                                        checked={selectedIds.includes(result.id)}
                                                        onChange={() => { }} // Handled by parent click but kept for visual
                                                        className="peer w-5 h-5 appearance-none border-2 border-white/20 rounded-lg bg-transparent checked:bg-primary-500 checked:border-primary-500 transition-all cursor-pointer"
                                                    />
                                                    <svg className="absolute w-3.5 h-3.5 text-white left-[3px] top-[3px] opacity-0 peer-checked:opacity-100 pointer-events-none transition-opacity" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                                                    </svg>
                                                </div>
                                            </div>

                                            <div className="mb-3 pr-8 select-none">
                                                <p className="text-xs uppercase tracking-widest font-bold text-white/40 mb-1">{result.test_name}</p>
                                                <div className="flex items-baseline gap-2">
                                                    <p className={`text-3xl font-black ${result.is_abnormal ? 'text-red-400' : 'text-primary-400'}`}>
                                                        {result.value}
                                                    </p>
                                                    <p className="text-sm font-bold text-white/60">{result.unit}</p>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-2 pt-3 border-t border-white/5 select-none">
                                                <div className={`w-2 h-2 rounded-full ${result.is_abnormal ? 'bg-red-500 animate-pulse' : 'bg-green-500'}`}></div>
                                                <p className="text-xs font-bold text-white/40">{result.reference_range}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            <style>{`
                .custom-scrollbar::-webkit-scrollbar {
                    width: 4px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: rgba(255,255,255,0.05);
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: rgba(255,255,255,0.2);
                    border-radius: 10px;
                }
                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(-10px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                .animate-fadeIn {
                    animation: fadeIn 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards;
                }
            `}</style>
        </div >
    );
};

export default LabEntry;

