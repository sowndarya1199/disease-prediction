import React, { useState, useEffect, useRef } from 'react';
import { API_BASE } from '../config';

interface Patient {
    id: number;
    name: string;
    age: number;
    gender: string;
}

interface SymptomHistory {
    id: number;
    patient_id: number;
    raw_text: string;
    processed_data: string;
    severity: number;
    duration: string;
    timestamp: string;
}

interface SymptomCategories {
    [category: string]: string[];
}

const SymptomEntry: React.FC = () => {
    const [patients, setPatients] = useState<Patient[]>([]);
    const [selectedPatientId, setSelectedPatientId] = useState<number | ''>('');
    const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<string[]>([]);
    const [showSearchDropdown, setShowSearchDropdown] = useState(false);
    const [symptomCategories, setSymptomCategories] = useState<SymptomCategories>({});
    const [commonSymptoms, setCommonSymptoms] = useState<string[]>([]);
    const [activeCategory, setActiveCategory] = useState('All');
    const [duration, setDuration] = useState('');
    const [severityLevel, setSeverityLevel] = useState<string>('');
    const [severityScore, setSeverityScore] = useState<number>(0);
    const [loading, setLoading] = useState(false);
    const [analyzed, setAnalyzed] = useState(false);
    const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
    const [symptomHistory, setSymptomHistory] = useState<SymptomHistory[]>([]);
    const [showHistory, setShowHistory] = useState(false);
    const [fieldErrors, setFieldErrors] = useState<{ patientId?: string; symptoms?: string }>({});
    const [analysisProgress, setAnalysisProgress] = useState(0);

    const durationOptions = ["1 day", "3 days", "1 week", "Custom"];
    const messageTimeoutRef = useRef<any>(null);
    const searchInputRef = useRef<HTMLInputElement>(null);

    const showToast = (text: string, type: 'success' | 'error') => {
        if (messageTimeoutRef.current) clearTimeout(messageTimeoutRef.current);
        setMessage({ text, type });
        messageTimeoutRef.current = setTimeout(() => {
            setMessage(null);
        }, 4000);
    };

    const validateField = (field: string, value: any): string | undefined => {
        switch (field) {
            case 'patientId':
                if (!value) return 'Please select a patient';
                return undefined;
            case 'symptoms':
                if (!value || value.length === 0) return 'Please select at least one symptom';
                return undefined;
            default:
                return undefined;
        }
    };

    
    useEffect(() => {
        const fetchPatients = async () => {
            try {
                const response = await fetch(`${API_BASE}/patients/`);
                if (response.ok) {
                    const data = await response.json();
                    setPatients(data);
                }
            } catch (error) {
                console.error("Failed to fetch patients", error);
            }
        };
        fetchPatients();
    }, []);

   
    useEffect(() => {
        const fetchSymptomData = async () => {
            try {
                const [categoriesRes, commonRes] = await Promise.all([
                    fetch(`${API_BASE}/symptoms/categories`),
                    fetch(`${API_BASE}/symptoms/common`)
                ]);

                if (categoriesRes.ok) {
                    const data = await categoriesRes.json();
                    setSymptomCategories(data.categories);
                }

                if (commonRes.ok) {
                    const data = await commonRes.json();
                    setCommonSymptoms(data.common_symptoms);
                }
            } catch (error) {
                console.error("Failed to fetch symptom data", error);
            }
        };
        fetchSymptomData();
    }, []);

    
    useEffect(() => {
        const fetchHistory = async () => {
            if (!selectedPatientId) {
                setSymptomHistory([]);
                return;
            }
            try {
                const response = await fetch(`${API_BASE}/symptoms/${selectedPatientId}`);
                if (response.ok) {
                    const data = await response.json();
                    setSymptomHistory(data);
                }
            } catch (error) {
                console.error("Failed to fetch history", error);
            }
        };
        fetchHistory();
    }, [selectedPatientId]);

    
    useEffect(() => {
        const searchSymptoms = async () => {
            if (searchQuery.length === 0) {
                setSearchResults([]);
                setShowSearchDropdown(false);
                return;
            }

            try {
                const response = await fetch(`${API_BASE}/symptoms/search?q=${encodeURIComponent(searchQuery)}&limit=10`);
                if (response.ok) {
                    const data = await response.json();
                    setSearchResults(data.results);
                    setShowSearchDropdown(true);
                }
            } catch (error) {
                console.error("Failed to search symptoms", error);
            }
        };

        const debounceTimer = setTimeout(searchSymptoms, 300);
        return () => clearTimeout(debounceTimer);
    }, [searchQuery]);

    const toggleSymptom = (symptom: string) => {
        setSelectedSymptoms(prev => {
            if (prev.includes(symptom)) {
                return prev.filter(s => s !== symptom);
            } else {
                return [...prev, symptom];
            }
        });
        setAnalyzed(false);
        setFieldErrors(prev => ({ ...prev, symptoms: undefined }));
    };

    const addSymptomFromSearch = (symptom: string) => {
        if (!selectedSymptoms.includes(symptom)) {
            setSelectedSymptoms(prev => [...prev, symptom]);
            setAnalyzed(false);
        }
        setSearchQuery('');
        setShowSearchDropdown(false);
        setFieldErrors(prev => ({ ...prev, symptoms: undefined }));
    };

    const removeSymptom = (symptom: string) => {
        setSelectedSymptoms(prev => prev.filter(s => s !== symptom));
        setAnalyzed(false);
    };

    const handleAnalyze = async () => {
        
        const patientError = validateField('patientId', selectedPatientId);
        if (patientError) {
            setFieldErrors(prev => ({ ...prev, patientId: patientError }));
            showToast('Please select a patient first.', 'error');
            return;
        }

        
        const symptomsError = validateField('symptoms', selectedSymptoms);
        if (symptomsError) {
            setFieldErrors(prev => ({ ...prev, symptoms: symptomsError }));
            showToast('Please select at least one symptom.', 'error');
            return;
        }

        setLoading(true);
        setMessage(null);
        setAnalysisProgress(0);

        const progressInterval = setInterval(() => {
            setAnalysisProgress(prev => Math.min(prev + 10, 90));
        }, 150);

        try {
            const response = await fetch(`${API_BASE}/symptoms/process`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ symptoms: selectedSymptoms }),
            });

            clearInterval(progressInterval);
            setAnalysisProgress(100);

            if (response.ok) {
                const data = await response.json();
                setTimeout(() => {
                    setSeverityLevel(data.severity_level || 'Low');
                    setSeverityScore(data.severity_score || 3);
                    setAnalyzed(true);
                    setFieldErrors({});
                    setLoading(false);
                }, 400);
            } else {
                setLoading(false);
                showToast('Analysis failed. Please try again.', 'error');
            }
        } catch (error) {
            clearInterval(progressInterval);
            setLoading(false);
            showToast('Analysis failed. Check backend.', 'error');
        }
    };

    const handleSave = async () => {
        const patientError = validateField('patientId', selectedPatientId);
        if (patientError) {
            setFieldErrors(prev => ({ ...prev, patientId: patientError }));
            showToast('Please select a patient.', 'error');
            return;
        }
        if (!analyzed) {
            showToast('Please analyze the symptoms first.', 'error');
            return;
        }
        setLoading(true);
        setMessage(null);

        try {
            const response = await fetch(`${API_BASE}/symptoms/`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    patient_id: selectedPatientId,
                    raw_text: selectedSymptoms.join(', '),
                    severity: severityScore,
                    duration: duration
                }),
            });

            if (response.ok) {
                showToast('Symptoms saved successfully 🎉', 'success');
                setTimeout(() => {
                    setSelectedSymptoms([]);
                    setDuration('');
                    setSeverityLevel('');
                    setSeverityScore(0);
                    setAnalyzed(false);
                    setAnalysisProgress(0);

                    fetch(`${API_BASE}/symptoms/${selectedPatientId}`)
                        .then(res => res.json())
                        .then(data => setSymptomHistory(data))
                        .catch(console.error);
                }, 1500);
            } else {
                showToast('Failed to save. Please try again.', 'error');
            }
        } catch (error) {
            showToast('Network error. Is the backend running?', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm('Are you sure you want to delete this record?')) return;
        try {
            const response = await fetch(`http://localhost:8000/symptoms/${id}`, {
                method: 'DELETE',
            });
            if (response.ok) {
                setSymptomHistory(prev => prev.filter(item => item.id !== id));
                showToast('Record deleted successfully', 'success');
            } else {
                showToast('Failed to delete record', 'error');
            }
        } catch (error) {
            console.error("Delete failed", error);
            showToast('Delete failed. Check backend.', 'error');
        }
    };

    const getSeverityConfig = (level: string) => {
        switch (level) {
            case 'High':
                return { color: 'rose', gradient: 'from-rose-500 to-red-600', label: 'High Severity' };
            case 'Moderate':
                return { color: 'amber', gradient: 'from-amber-400 to-orange-500', label: 'Moderate Severity' };
            default:
                return { color: 'emerald', gradient: 'from-emerald-400 to-teal-500', label: 'Low Severity' };
        }
    };

    const severityConfig = analyzed ? getSeverityConfig(severityLevel) : null;
    const selectedPatient = selectedPatientId ? patients.find(p => p.id === selectedPatientId) : null;

    
    const getFilteredSymptoms = () => {
        if (activeCategory === 'All') {
            return Object.entries(symptomCategories).flatMap(([cat, symptoms]) =>
                symptoms.map(s => ({ category: cat, symptom: s }))
            );
        }
        const symptoms = symptomCategories[activeCategory] || [];
        return symptoms.map(s => ({ category: activeCategory, symptom: s }));
    };

    const filteredSymptoms = getFilteredSymptoms();
    const categories = ['All', ...Object.keys(symptomCategories)];

    return (
        <div className="min-h-screen bg-[#f8fafc] font-sans text-slate-800 p-6 md:px-12 md:py-10 relative overflow-hidden">
            <style>{`
                @keyframes shimmer {
                    0% { transform: translateX(-100%); }
                    100% { transform: translateX(100%); }
                }
                @keyframes soft-pulse {
                    0%, 100% { opacity: 1; transform: scale(1); }
                    50% { opacity: 0.8; transform: scale(1.02); }
                }
                .shimmer-effect {
                    position: relative;
                    overflow: hidden;
                }
                .shimmer-effect::after {
                    content: '';
                    position: absolute;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    background: linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent);
                    animation: shimmer 2s infinite;
                }
                .toast-slide-in {
                    animation: toast-slide 0.4s cubic-bezier(0.16, 1, 0.3, 1);
                }
                @keyframes toast-slide {
                    from { transform: translateY(-20px); opacity: 0; }
                    to { transform: translateY(0); opacity: 1; }
                }
                .custom-scrollbar::-webkit-scrollbar {
                    width: 8px;
                    height: 8px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: #f1f5f9;
                    border-radius: 10px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: #cbd5e1;
                    border-radius: 10px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                    background: #94a3b8;
                }
            `}</style>


            <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-600"></div>
            <div className="absolute -top-24 -right-24 w-96 h-96 bg-blue-100/40 rounded-full blur-3xl"></div>
            <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-purple-100/40 rounded-full blur-3xl"></div>

            <div className="max-w-7xl mx-auto relative z-10 space-y-8">

                {message && (
                    <div className={`
                        fixed top-8 left-1/2 -translate-x-1/2 z-50 px-6 py-4 rounded-2xl shadow-2xl backdrop-blur-xl border flex items-center gap-4 toast-slide-in
                        ${message.type === 'success' ? 'bg-white/90 border-emerald-100 text-emerald-800' : 'bg-white/90 border-rose-100 text-rose-800'}
                    `}>
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg ${message.type === 'success' ? 'bg-emerald-50' : 'bg-rose-50'}`}>
                            {message.type === 'success' ? '🎉' : '⚠️'}
                        </div>
                        <p className="font-semibold text-lg">{message.text}</p>
                    </div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

                    <div className="lg:col-span-7 space-y-6">

                        <div className="bg-white rounded-[2rem] p-6 shadow-sm border border-slate-100 hover:shadow-md transition-all">
                            <div className="flex flex-col sm:flex-row items-center gap-6">
                                <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-3xl font-black shadow-lg shadow-blue-200">
                                    {selectedPatient ? selectedPatient.name.charAt(0) : '?'}
                                </div>
                                <div className="flex-1 w-full space-y-4">
                                    <div className="flex flex-col">
                                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Active Patient</span>
                                        <div className="relative group overflow-hidden rounded-xl bg-slate-50 border border-slate-100">
                                            <select
                                                value={selectedPatientId}
                                                onChange={(e) => {
                                                    setSelectedPatientId(Number(e.target.value));
                                                    setFieldErrors(prev => ({ ...prev, patientId: undefined }));
                                                }}
                                                className="appearance-none bg-transparent px-4 py-3 text-xl font-bold text-slate-800 focus:outline-none w-full cursor-pointer pr-10 transition-all"
                                            >
                                                <option value="">Choose a patient...</option>
                                                {patients.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                                            </select>
                                            <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-blue-500">
                                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 9l-7 7-7-7" /></svg>
                                            </div>
                                        </div>
                                    </div>
                                    {selectedPatient && (
                                        <div className="flex gap-4 animate-fadeIn">
                                            <div className="px-3 py-1 bg-blue-50 text-blue-600 rounded-lg text-xs font-bold uppercase tracking-wider">
                                                {selectedPatient.age} Years
                                            </div>
                                            <div className="px-3 py-1 bg-purple-50 text-purple-600 rounded-lg text-xs font-bold uppercase tracking-wider">
                                                {selectedPatient.gender}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                            {fieldErrors.patientId && <p className="text-sm text-rose-500 font-medium mt-3 ml-2">{fieldErrors.patientId}</p>}
                        </div>


                        <div className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-slate-100 space-y-6">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 text-xl shadow-inner shadow-blue-100">
                                    🔍
                                </div>
                                <h3 className="text-xl font-extrabold text-slate-800 tracking-tight">Search Symptoms</h3>
                            </div>

                            <div className="relative">
                                <input
                                    ref={searchInputRef}
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    onFocus={() => searchQuery.length > 0 && setShowSearchDropdown(true)}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter' && searchQuery.trim()) {
                                            addSymptomFromSearch(searchQuery.trim());
                                        }
                                    }}
                                    className="w-full bg-slate-50 border-transparent rounded-2xl px-6 py-4 text-lg text-slate-700 focus:ring-4 focus:ring-blue-100/50 focus:bg-white transition-all border border-slate-100 placeholder-slate-300"
                                    placeholder="Type to search symptoms..."
                                />
                                {showSearchDropdown && searchQuery.length > 0 && (
                                    <div className="absolute top-full mt-2 w-full bg-white rounded-2xl shadow-2xl border border-slate-100 max-h-64 overflow-y-auto custom-scrollbar z-20">
                                        {searchResults.map((symptom, idx) => (
                                            <button
                                                key={idx}
                                                onClick={() => addSymptomFromSearch(symptom)}
                                                className="w-full text-left px-6 py-3 hover:bg-blue-50 transition-colors flex items-center justify-between group"
                                            >
                                                <span className="text-slate-700 font-medium">{symptom}</span>
                                                {selectedSymptoms.includes(symptom) ? (
                                                    <span className="text-xs bg-emerald-100 text-emerald-600 px-2 py-1 rounded-full font-bold">Selected</span>
                                                ) : (
                                                    <span className="text-xs text-blue-500 opacity-0 group-hover:opacity-100 transition-opacity">Add</span>
                                                )}
                                            </button>
                                        ))}
                                        
                                        {/* Custom Symptom Option */}
                                        {!searchResults.some(s => s.toLowerCase() === searchQuery.toLowerCase()) && (
                                            <button
                                                onClick={() => addSymptomFromSearch(searchQuery)}
                                                className="w-full text-left px-6 py-4 bg-blue-50 hover:bg-blue-100 transition-all flex items-center gap-3 group border-t border-blue-100"
                                            >
                                                <div className="w-8 h-8 rounded-lg bg-blue-500 text-white flex items-center justify-center font-black shadow-sm group-hover:scale-110 transition-transform">
                                                    +
                                                </div>
                                                <div>
                                                    <p className="text-xs font-black text-blue-600 uppercase tracking-widest leading-none mb-1">Add Custom Symptom</p>
                                                    <p className="text-sm font-bold text-slate-700">"{searchQuery}"</p>
                                                </div>
                                            </button>
                                        )}
                                    </div>
                                )}
                            </div>

                            
                            <div>
                                <h4 className="text-sm font-black text-slate-800 uppercase tracking-widest mb-3 flex items-center gap-2">
                                    <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
                                    Quick Add
                                </h4>
                                <div className="flex flex-wrap gap-2">
                                    {commonSymptoms.map((symptom) => (
                                        <button
                                            key={symptom}
                                            onClick={() => toggleSymptom(symptom)}
                                            className={`
                                                px-4 py-2 rounded-xl text-sm font-bold transition-all border-2
                                                ${selectedSymptoms.includes(symptom)
                                                    ? 'bg-blue-500 text-white border-blue-500 shadow-lg scale-105'
                                                    : 'bg-slate-50 text-slate-600 border-transparent hover:bg-slate-100'}
                                            `}
                                        >
                                            {symptom}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            
                            {selectedSymptoms.length > 0 && (
                                <div className="bg-blue-50 rounded-2xl p-6 space-y-3">
                                    <h4 className="text-sm font-black text-blue-900 uppercase tracking-widest flex items-center gap-2">
                                        <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
                                        Selected ({selectedSymptoms.length})
                                    </h4>
                                    <div className="flex flex-wrap gap-2">
                                        {selectedSymptoms.map((symptom) => (
                                            <div
                                                key={symptom}
                                                className="bg-white px-4 py-2 rounded-xl flex items-center gap-2 shadow-sm group hover:shadow-md transition-all"
                                            >
                                                <span className="text-sm font-semibold text-slate-700">{symptom}</span>
                                                <button
                                                    onClick={() => removeSymptom(symptom)}
                                                    className="w-5 h-5 rounded-full bg-rose-100 text-rose-500 flex items-center justify-center hover:bg-rose-500 hover:text-white transition-all text-xs font-bold"
                                                >
                                                    ×
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                            {fieldErrors.symptoms && <p className="text-sm text-rose-500 font-medium ml-4">{fieldErrors.symptoms}</p>}

                           
                            <div>
                                <h4 className="text-sm font-black text-slate-800 uppercase tracking-widest mb-3 flex items-center gap-2">
                                    <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
                                    Browse by Category
                                </h4>
                                <div className="flex flex-wrap gap-2 mb-4">
                                    {categories.map((category) => (
                                        <button
                                            key={category}
                                            onClick={() => setActiveCategory(category)}
                                            className={`
                                                px-4 py-2 rounded-xl text-xs font-bold transition-all border-2
                                                ${activeCategory === category
                                                    ? 'bg-slate-900 text-white border-slate-900 shadow-lg'
                                                    : 'bg-slate-50 text-slate-500 border-transparent hover:bg-slate-100'}
                                            `}
                                        >
                                            {category}
                                        </button>
                                    ))}
                                </div>

                               
                                <div className="max-h-96 overflow-y-auto custom-scrollbar bg-slate-50 rounded-2xl p-4 space-y-2">
                                    {filteredSymptoms.map(({ symptom }, idx) => (
                                        <label
                                            key={idx}
                                            className="flex items-center gap-3 p-3 rounded-xl hover:bg-white transition-all cursor-pointer group"
                                        >
                                            <input
                                                type="checkbox"
                                                checked={selectedSymptoms.includes(symptom)}
                                                onChange={() => toggleSymptom(symptom)}
                                                className="w-5 h-5 rounded border-2 border-slate-300 text-blue-500 focus:ring-2 focus:ring-blue-200 cursor-pointer"
                                            />
                                            <span className="text-sm font-medium text-slate-700 group-hover:text-slate-900">
                                                {symptom}
                                            </span>
                                        </label>
                                    ))}
                                    {filteredSymptoms.length === 0 && (
                                        <p className="text-center text-slate-400 py-8 text-sm font-medium">No symptoms in this category</p>
                                    )}
                                </div>
                            </div>

                            <button
                                onClick={handleAnalyze}
                                disabled={loading || selectedSymptoms.length === 0 || !selectedPatientId}
                                className={`
                                    w-full py-5 rounded-[1.5rem] font-black text-xl text-white shadow-xl transition-all duration-300 flex items-center justify-center gap-3
                                    ${loading || selectedSymptoms.length === 0 || !selectedPatientId ? 'bg-slate-200 cursor-not-allowed text-slate-400' : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:shadow-blue-500/30 hover:-translate-y-1 active:scale-[0.98]'}
                                `}
                            >
                                {loading ? (
                                    <>
                                        <div className="w-6 h-6 border-4 border-white/30 border-t-white rounded-full animate-spin"></div>
                                        <span>Analyzing Clinical Data...</span>
                                    </>
                                ) : (
                                    <>
                                        <span>Analyze Symptoms</span>
                                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg>
                                    </>
                                )}
                            </button>
                        </div>
                    </div>


                    <div className="lg:col-span-5 space-y-6">

                        <div className={`
                            bg-white rounded-[2.5rem] p-8 shadow-sm border border-slate-100 min-h-[420px] flex flex-col items-center justify-center text-center space-y-8 transition-all duration-500
                            ${loading ? 'shimmer-effect opacity-90' : ''}
                        `}>
                            {!analyzed && !loading && (
                                <div className="space-y-6 group">
                                    <div className="w-32 h-32 rounded-full bg-slate-50 flex items-center justify-center mx-auto transition-transform group-hover:scale-110 duration-500">
                                        <div className="w-24 h-24 rounded-full border-4 border-dashed border-slate-200 flex items-center justify-center animate-[spin_10s_linear_infinite]">
                                            <span className="text-4xl grayscale opacity-40">🤖</span>
                                        </div>
                                    </div>
                                    <div>
                                        <h3 className="text-2xl font-black text-slate-400">Assistant Idle</h3>
                                        <p className="text-slate-400 font-medium max-w-[200px]">Select symptoms to begin analysis</p>
                                    </div>
                                </div>
                            )}

                            {loading && (
                                <div className="space-y-6 animate-pulse">
                                    <div className="relative w-40 h-40 mx-auto">
                                        <svg className="w-full h-full transform -rotate-90">
                                            <circle cx="80" cy="80" r="72" stroke="#f1f5f9" strokeWidth="12" fill="none" />
                                            <circle cx="80" cy="80" r="72" stroke="#3b82f6" strokeWidth="12" fill="none" strokeDasharray={452} strokeDashoffset={452 - (452 * analysisProgress) / 100} className="transition-all duration-300" />
                                        </svg>
                                        <div className="absolute inset-0 flex items-center justify-center text-3xl font-black text-blue-600">
                                            {analysisProgress}%
                                        </div>
                                    </div>
                                    <div className="space-y-1">
                                        <h3 className="text-2xl font-black text-slate-800">Processing...</h3>
                                        <p className="text-slate-400 font-medium">Identifying clinical patterns</p>
                                    </div>
                                </div>
                            )}

                            {analyzed && severityConfig && (
                                <div className="w-full space-y-8 animate-fadeIn">
                                    <div className="flex flex-col items-center">
                                        <div className={`px-6 py-2 rounded-full bg-gradient-to-r ${severityConfig.gradient} text-white font-black text-xs uppercase tracking-[0.2em] shadow-lg shadow-${severityConfig.color}-100 mb-8`}>
                                            {severityConfig.label}
                                        </div>
                                        <div className="relative w-48 h-48 mb-4">
                                            <svg className="w-full h-full transform -rotate-90">
                                                <circle cx="96" cy="96" r="88" stroke="#f8fafc" strokeWidth="16" fill="none" />
                                                <circle cx="96" cy="96" r="88" stroke="currentColor" strokeWidth="16" fill="none"
                                                    className={`text-${severityConfig.color}-500 transition-all duration-1000 ease-out`}
                                                    strokeDasharray={553}
                                                    strokeDashoffset={553 - (553 * (severityScore / 10))}
                                                    style={{ strokeLinecap: 'round' }}
                                                />
                                            </svg>
                                            <div className="absolute inset-0 flex flex-col items-center justify-center">
                                                <span className="text-6xl font-black text-slate-900 tracking-tighter">{severityScore}</span>
                                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Risk Index</span>
                                            </div>
                                        </div>
                                        <div className="text-emerald-500 font-bold flex items-center gap-1 animate-bounce mt-2 text-sm">
                                            <span>Analysis Completed</span>
                                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>


                        <div className={`
                            bg-white rounded-[2rem] p-8 shadow-sm border border-slate-100 space-y-6 transition-all duration-500
                            ${analyzed ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-40 pointer-events-none'}
                        `}>
                            <h4 className="text-sm font-black text-slate-800 uppercase tracking-widest flex items-center gap-2">
                                <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
                                Symptom Duration
                            </h4>
                            <div className="flex flex-wrap gap-2">
                                {durationOptions.map((opt) => (
                                    <button
                                        key={opt}
                                        onClick={() => setDuration(opt)}
                                        className={`
                                            flex-1 min-w-[80px] py-3 px-2 rounded-xl text-xs font-bold transition-all border-2
                                            ${duration === opt
                                                ? 'bg-slate-900 text-white border-slate-900 shadow-lg scale-[1.05] z-10'
                                                : 'bg-slate-50 text-slate-500 border-transparent hover:bg-slate-100'}
                                        `}
                                    >
                                        {opt}
                                    </button>
                                ))}
                            </div>

                            <button
                                onClick={handleSave}
                                disabled={!duration}
                                className={`
                                    w-full py-4 rounded-2xl font-black text-lg text-white transition-all shadow-md group
                                    ${duration
                                        ? 'bg-emerald-500 hover:bg-emerald-600 hover:shadow-emerald-100 active:scale-[0.98]'
                                        : 'bg-slate-100 text-slate-300 cursor-not-allowed'}
                                `}
                            >
                                <div className="flex items-center justify-center gap-2">
                                    <svg className={`w-6 h-6 transition-transform ${duration ? 'group-hover:translate-y-[-2px]' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" /></svg>
                                    <span>Save Record</span>
                                </div>
                            </button>
                        </div>
                    </div>
                </div>


                {selectedPatientId && (
                    <div className="space-y-4 pt-8">
                        <div className="flex items-center justify-between">
                            <h3 className="text-2xl font-black text-slate-800">Patient History</h3>
                            <button
                                onClick={() => setShowHistory(!showHistory)}
                                className="px-5 py-2 rounded-xl bg-white border border-slate-100 text-sm font-bold text-blue-600 shadow-sm hover:shadow-md transition-all flex items-center gap-2"
                            >
                                {showHistory ? 'Hide Records' : `View ${symptomHistory.length} Records`}
                                <svg className={`w-4 h-4 transition-transform ${showHistory ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 9l-7 7-7-7" /></svg>
                            </button>
                        </div>

                        {showHistory && (
                            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 animate-fadeIn">
                                {symptomHistory.map((h) => (
                                    <div key={h.id} className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-50 hover:border-blue-100 transition-all group">
                                        <div className="flex justify-between items-start mb-4">
                                            <div className="px-3 py-1 bg-slate-50 rounded-lg text-[10px] font-black text-slate-400 uppercase tracking-tighter">
                                                {new Date(h.timestamp).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                                            </div>
                                        </div>
                                        <p className="text-slate-600 text-sm leading-relaxed line-clamp-3 mb-4">{h.raw_text}</p>
                                        <button
                                            onClick={() => handleDelete(h.id)}
                                            className="w-full py-2 rounded-xl bg-rose-50 text-rose-500 text-[10px] font-black uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-all hover:bg-rose-500 hover:text-white"
                                        >
                                            Delete Permanently
                                        </button>
                                    </div>
                                ))}
                                {symptomHistory.length === 0 && (
                                    <div className="col-span-full py-20 text-center bg-slate-50 rounded-[2.5rem] border-2 border-dashed border-slate-100">
                                        <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">No records available</p>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default SymptomEntry;
