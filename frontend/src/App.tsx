import React, { useState, useEffect } from 'react';
import Login from './components/Login';
import RegistrationForm from './components/RegistrationForm';

import PatientList from './components/PatientList';
import StaffRegistration from './components/StaffRegistration';
import SymptomEntry from './components/SymptomEntry';
import LabEntry from './components/LabEntry';
import PredictionView from './components/PredictionView';
import DietRecommendationView from './components/DietRecommendationView';
import DoctorReviewCenter from './components/DoctorReviewCenter';
import DietReviewCenter from './components/DietReviewCenter';
import HealthReportView from './components/HealthReportView';

interface Notification {
    id: number;
    patient_id: number;
    patient_name: string;
    risk_level: string;
    message: string;
    is_read: boolean;
    created_at: string;
}

type ViewType = 'register' | 'list' | 'admin' | 'symptom' | 'lab' | 'predict' | 'diet' | 'dietReview' | 'review' | 'healthReport';

interface NavItem {
    id: ViewType;
    label: string;
    icon: React.ReactNode;
    adminOnly?: boolean;
    staffOnly?: boolean;
}

const Icons = {
    // ... paths same as before
    register: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.2" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
        </svg>
    ),
    list: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
        </svg>
    ),
    symptom: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
    ),
    lab: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.2" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
        </svg>
    ),
    predict: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.2" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
    ),
    admin: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
    ),
    diet: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
        </svg>
    ),
    healthReport: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.2" d="M12 8v4l3 3" />
        </svg>
    ),
    dietReview: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.2" d="M21 15.546c-.523 0-1.046.151-1.5.454a2.704 2.704 0 01-3 0 2.704 2.704 0 00-3 0 2.704 2.704 0 01-3 0 2.704 2.704 0 00-3 0 2.704 2.704 0 01-3 0 2.701 2.701 0 00-1.5-.454M9 16v2a2 2 0 01-2 2H5a2 2 0 01-2-2v-2m9-9V3m0 0L9 6m3-3l3 3m-6 10H5a2 2 0 01-2-2V5a2 2 0 012-2h14a2 2 0 012 2v10a2 2 0 01-2 2h-4" />
        </svg>
    ),
    review: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
        </svg>
    ),
};

const navItems: NavItem[] = [
    { id: 'register', label: 'New Patient', icon: Icons.register },
    { id: 'list', label: 'Records', icon: Icons.list },
    { id: 'symptom', label: 'Symptoms', icon: Icons.symptom },
    { id: 'lab', label: 'Lab Results', icon: Icons.lab },
    { id: 'predict', label: 'Prediction', icon: Icons.predict },
    { id: 'healthReport', label: 'Health Report', icon: Icons.healthReport },
    { id: 'diet', label: 'Diet Plan', icon: Icons.diet },
    { id: 'dietReview', label: 'Diet Review', icon: Icons.dietReview, staffOnly: true },
    { id: 'review', label: 'Review Center', icon: Icons.review, staffOnly: true },
    { id: 'admin', label: 'Staff', icon: Icons.admin, adminOnly: true },
];

const getNavItemsForRole = (role: string | null) => {
    if (role === 'doctor') {
        const doctorAllowedIds = ['list', 'predict', 'healthReport', 'dietReview', 'review'];
        return navItems.filter(item => doctorAllowedIds.includes(item.id));
    }
    if (role === 'admin') {
        return navItems;
    }
    // For other roles (e.g., patient, user), restrict review and admin items
    return navItems.filter(item => !item.adminOnly && !item.staffOnly);
};

function App() {
    const [token, setToken] = useState<string | null>(null);
    const [role, setRole] = useState<string | null>(null);
    const [username, setUsername] = useState<string | null>(null);
    const [view, setView] = useState<ViewType>('register');
    const [viewHistory, setViewHistory] = useState<ViewType[]>([]);
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [showNotifications, setShowNotifications] = useState(false);
    const [unreadCount, setUnreadCount] = useState(0);
    const [selectedPatientId, setSelectedPatientId] = useState<number | null>(null);
    const [patients, setPatients] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<any | null>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const storedToken = localStorage.getItem('token');
        const storedRole = localStorage.getItem('role');
        const storedUser = localStorage.getItem('username');
        if (storedToken && storedRole) {
            setToken(storedToken);
            setRole(storedRole);
            setUsername(storedUser);
            if (storedRole === 'doctor') {
                setView('review');
            }
        }
    }, []);

    const fetchPatients = async () => {
        try {
            const res = await fetch('http://127.0.0.1:8000/patients/');
            if (res.ok) setPatients(await res.json());
        } catch { }
    };

    useEffect(() => {
        if (token) fetchPatients();
    }, [token]);

    const fetchNotifications = async () => {
        try {
            const res = await fetch('http://127.0.0.1:8000/notifications');
            if (res.ok) {
                const data = await res.json();
                setNotifications(data);
                setUnreadCount(data.filter((n: Notification) => !n.is_read).length);
            }
        } catch { }
    };

    useEffect(() => {
        if (token && (role === 'doctor' || role === 'admin')) {
            fetchNotifications();
            const interval = setInterval(fetchNotifications, 30000);
            return () => clearInterval(interval);
        }
    }, [token, role]);

    const markAsRead = async (id: number) => {
        try {
            await fetch(`http://127.0.0.1:8000/notifications/${id}/read`, { method: 'PUT' });
            fetchNotifications();
        } catch { }
    };

    const deleteNotification = async (id: number) => {
        try {
            await fetch(`http://127.0.0.1:8000/notifications/${id}`, { method: 'DELETE' });
            fetchNotifications();
        } catch { }
    };

    const handleLogin = (newToken: string, newRole: string, newUser: string) => {
        setToken(newToken);
        setRole(newRole);
        setUsername(newUser);
        localStorage.setItem('token', newToken);
        localStorage.setItem('role', newRole);
        localStorage.setItem('username', newUser);
        if (newRole === 'doctor') {
            setView('review');
        } else {
            setView('register');
        }
    };

    const handleLogout = () => {
        setToken(null);
        setRole(null);
        setUsername(null);
        localStorage.clear();
        setView('register');
        setViewHistory([]);
    };

    const navigateTo = (newView: ViewType) => {
        if (newView !== view) {
            setViewHistory(prev => [...prev, view]);
            setView(newView);
            // Clear results when navigating to prediction page from sidebar
            if (newView === 'predict') {
                setResult(null);
                setError(null);
            }
        }
    };

    const goBack = () => {
        if (viewHistory.length > 0) {
            const previousView = viewHistory[viewHistory.length - 1];
            setViewHistory(prev => prev.slice(0, -1));
            setView(previousView);
        }
    };

    const handlePatientSelect = (id: number) => {
        setSelectedPatientId(id);
        if (role === 'doctor') {
            navigateTo('review');
        } else {
            navigateTo('predict');
        }
    };

    const handleGlobalPredict = async () => {
        if (!selectedPatientId) return;
        setLoading(true);
        setError(null);
        setResult(null);
        navigateTo('predict');
        try {
            console.log(`Running analysis for patient ID: ${selectedPatientId}`);
            const res = await fetch(`http://127.0.0.1:8000/patients/${selectedPatientId}/predict`, { method: 'POST' });
            if (res.ok) {
                const data = await res.json();
                console.log("Analysis successful!");
                setResult(data);
            } else {
                console.error(`Analysis failed with status: ${res.status}`);
                setError("Analysis failed.");
            }
        } catch (err) {
            console.error("Connection error detected:", err);
            setError("Connection error.");
        } finally {
            setLoading(false);
        }
    };

    if (!token) {
        return <Login onLogin={handleLogin} />;
    }

    const renderContent = () => {
        // Strict role-based view restrictions
        if (role === 'doctor') {
            switch (view) {
                case 'list': return <PatientList onNavigateToPrediction={handlePatientSelect} />;
                case 'review': return <DoctorReviewCenter initialPatientId={selectedPatientId} />;
                case 'dietReview': return <DietReviewCenter />;
                case 'predict': return <PredictionView initialPatientId={selectedPatientId} userRole={role} result={result} loading={loading} error={error} />;
                case 'healthReport': return <HealthReportView />;
                default: return <DoctorReviewCenter />;
            }
        }

        switch (view) {
            case 'register': return <RegistrationForm />;
            case 'list': return <PatientList onNavigateToPrediction={handlePatientSelect} />;
            case 'symptom': return <SymptomEntry />;
            case 'lab': return <LabEntry />;
            case 'predict': return <PredictionView initialPatientId={selectedPatientId} userRole={role} result={result} loading={loading} error={error} />;
            case 'healthReport': return <HealthReportView />;
            case 'diet': return <DietRecommendationView />;
            case 'admin': return role === 'admin' ? <StaffRegistration /> : <div>Access Denied</div>;
            default: return <RegistrationForm />;
        }
    };

    return (
        <div className="min-h-screen flex gradient-mesh">
            <aside className="w-72 p-4 flex flex-col shrink-0 sidebar-mesh relative overflow-hidden">
                <div
                    className="absolute top-0 right-0 w-40 h-40 rounded-full blur-3xl opacity-20"
                    style={{ background: 'var(--accent-400)' }}
                />
                <div
                    className="absolute bottom-20 left-0 w-32 h-32 rounded-full blur-3xl opacity-10"
                    style={{ background: 'var(--violet-400)' }}
                />

                <div className="px-4 py-6 mb-4 relative z-10">
                    <div className="flex items-center gap-4">
                        <div
                            className="w-12 h-12 rounded-xl flex items-center justify-center shadow-lg"
                            style={{
                                background: 'linear-gradient(135deg, var(--accent-400) 0%, var(--primary-500) 100%)',
                                boxShadow: '0 8px 20px rgba(6, 182, 212, 0.3)'
                            }}
                        >
                            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                            </svg>
                        </div>
                        <div>
                            <h1 className="text-xl font-bold text-white tracking-tight">MedPred</h1>
                            <p className="text-xs font-medium" style={{ color: 'var(--accent-300)' }}>Health Analytics</p>
                        </div>
                    </div>
                </div>

                {(role === 'doctor' || role === 'admin') && (
                    <div className="px-4 mb-4 relative z-20">
                        <button
                            onClick={() => setSelectedPatientId(null)}
                            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all"
                            style={{
                                background: 'rgba(255, 255, 255, 0.08)',
                                border: '1px solid rgba(255, 255, 255, 0.1)',
                            }}
                        >
                            <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: 'rgba(255, 255, 255, 0.1)' }}>
                                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </div>
                            <div className="flex-1 text-left">
                                <span className="text-sm font-semibold text-white">System Logs</span>
                                <p className="text-xs" style={{ color: 'rgba(255, 255, 255, 0.4)' }}>No active issues</p>
                            </div>
                        </button>

                    </div>
                )}

                <nav className="flex-1 space-y-2 relative z-10 px-2 mt-4">
                    {getNavItemsForRole(role).map((item) => {
                        const isActive = view === item.id;
                        return (
                            <button
                                key={item.id}
                                onClick={() => navigateTo(item.id)}
                                className={`group w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl text-sm font-semibold transition-all duration-500 relative overflow-hidden ${isActive ? 'nav-active bg-white/10' : 'hover:bg-white/5'}`}
                                style={{
                                    color: isActive ? 'white' : 'rgba(255, 255, 255, 0.5)',
                                }}
                            >
                                {isActive && (
                                    <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/10 to-transparent pointer-events-none" />
                                )}
                                <span
                                    className={`transition-all duration-500 ${isActive ? 'scale-110 shadow-glow' : 'group-hover:scale-110'}`}
                                    style={{
                                        color: isActive ? 'var(--accent-400)' : 'inherit',
                                    }}
                                >
                                    {item.icon}
                                </span>
                                {item.label}
                                {isActive && (
                                    <div
                                        className="ml-auto w-1.5 h-1.5 rounded-full"
                                        style={{
                                            background: 'var(--accent-400)',
                                            boxShadow: '0 0 12px var(--accent-400), 0 0 20px var(--accent-400)'
                                        }}
                                    />
                                )}
                            </button>
                        );
                    })}
                </nav>

                <div
                    className="rounded-2xl p-4 mt-4 relative z-10"
                    style={{
                        background: 'rgba(255, 255, 255, 0.05)',
                        border: '1px solid rgba(255, 255, 255, 0.1)'
                    }}
                >
                    <div className="flex items-center gap-3">
                        <div
                            className="w-11 h-11 rounded-xl flex items-center justify-center text-sm font-bold shadow-lg"
                            style={{
                                background: 'linear-gradient(135deg, var(--primary-500) 0%, var(--accent-500) 100%)',
                                color: 'white',
                            }}
                        >
                            {role?.charAt(0).toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-white truncate">{username} <span className="text-white/40 text-[10px] uppercase font-black ml-1">({role?.toUpperCase()})</span></p>
                            <div className="flex items-center gap-1.5">
                                <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                                <p className="text-xs text-white/60">Online</p>
                            </div>
                        </div>
                        <button
                            onClick={handleLogout}
                            className="p-2.5 rounded-xl transition-all duration-300 hover:bg-white/10 text-white/60"
                            title="Sign Out"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                            </svg>
                        </button>
                    </div>
                </div>
            </aside>

            <main className="flex-1 min-w-0 flex flex-col bg-[#F8FAFC]">
                {/* TOP BAR */}
                <header className="h-20 bg-white/50 backdrop-blur-md border-b border-slate-200 px-8 flex items-center justify-between sticky top-0 z-40">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={goBack}
                            disabled={viewHistory.length === 0}
                            className="p-2.5 rounded-xl transition-all duration-300 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-slate-100 text-slate-500"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                            </svg>
                        </button>
                        <h2 className="text-lg font-black text-slate-800 tracking-tight">{view.toUpperCase()}</h2>
                    </div>

                    <div className="flex items-center gap-6">
                        {/* Patient Selector & Predict Button - Only show on Predict view */}
                        {view === 'predict' && (
                            <div className="hidden md:flex items-center gap-3">
                                <select
                                    value={selectedPatientId || ''}
                                    onChange={(e) => {
                                        setSelectedPatientId(Number(e.target.value));
                                        setResult(null); // Clear previous results when switching patients
                                        setError(null);
                                    }}
                                    className="h-10 px-4 rounded-full bg-white border border-slate-200 text-xs font-bold text-slate-600 focus:border-blue-500 glow-pill transition-all outline-none min-w-[180px]"
                                >
                                    <option value="">Select Patient</option>
                                    {patients.map(p => (
                                        <option key={p.id} value={p.id}>{p.name}</option>
                                    ))}
                                </select>

                                <button
                                    onClick={handleGlobalPredict}
                                    disabled={!selectedPatientId || loading}
                                    className={`h-10 px-6 rounded-full btn-gradient-blue text-xs font-black uppercase tracking-widest disabled:opacity-50 disabled:pointer-events-none flex items-center gap-2 ${loading ? 'animate-pulse' : ''}`}
                                >
                                    {loading ? (
                                        <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    ) : (
                                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M13 10V3L4 14h7v7l9-11h-7z" />
                                        </svg>
                                    )}
                                    {loading ? 'Analyzing...' : 'Run Analysis'}
                                </button>
                            </div>
                        )}

                        <div className="flex items-center gap-4">
                            {/* Emergency Alerts - Visible to Staff Only */}
                            {(role === 'doctor' || role === 'admin') && (
                                <div className="relative">
                                    <button
                                        onClick={() => setShowNotifications(!showNotifications)}
                                        className={`p-2.5 rounded-xl transition-all border ${unreadCount > 0 ? 'bg-red-50 border-red-100 text-red-500 animate-pulse' : 'bg-white border-slate-200 text-slate-400 hover:text-slate-600'}`}
                                    >
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                                        </svg>
                                        {unreadCount > 0 && <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-600 rounded-full border-2 border-white" />}
                                    </button>

                                    {showNotifications && (
                                        <div className="absolute right-0 mt-3 w-80 glass-premium rounded-[1.5rem] shadow-2xl overflow-hidden z-[100] border-slate-200">
                                            <div className="p-4 bg-white/50 border-b border-slate-100 flex justify-between items-center">
                                                <span className="text-xs font-black text-slate-800 uppercase tracking-widest px-1">Emergency Alerts</span>
                                                <span className="text-[10px] bg-red-100 text-red-600 px-2 py-0.5 rounded-full font-black">{unreadCount} NEW</span>
                                            </div>
                                            <div className="max-h-[30rem] overflow-auto p-2">
                                                {notifications.length === 0 ? (
                                                    <div className="py-8 text-center text-xs text-slate-400 font-bold uppercase tracking-widest">No Alerts</div>
                                                ) : (
                                                    notifications.map((n) => (
                                                        <div
                                                            key={n.id}
                                                            className="p-4 rounded-2xl hover:bg-white/80 transition-all group mb-1 relative"
                                                        >
                                                            <div
                                                                className="flex gap-4 cursor-pointer"
                                                                onClick={() => { markAsRead(n.id); setShowNotifications(false); }}
                                                            >
                                                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${n.risk_level === 'Critical' ? 'bg-red-50 text-red-600' : 'bg-amber-50 text-amber-600'}`}>
                                                                    {n.risk_level === 'Critical' ? '🚨' : '⚠️'}
                                                                </div>
                                                                <div className="min-w-0 pr-8">
                                                                    <p className="text-sm font-black text-slate-800 truncate">{n.patient_name}</p>
                                                                    <p className="text-xs font-bold text-slate-400 mt-0.5">{n.message}</p>
                                                                </div>
                                                            </div>
                                                            <button
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    deleteNotification(n.id);
                                                                }}
                                                                className="absolute top-4 right-4 p-2 text-slate-300 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                                                                title="Delete Alert"
                                                            >
                                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                                </svg>
                                                            </button>
                                                        </div>
                                                    ))
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Avatar */}
                            <div className="flex items-center gap-3 pl-4 border-l border-slate-200">
                                <div className="text-right hidden xl:block">
                                    <p className="text-xs font-black text-slate-800 leading-none">{username}</p>
                                    <p className="text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-tighter">Verified {role?.toUpperCase()}</p>
                                </div>
                                <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-slate-800 to-slate-900 flex items-center justify-center text-white text-sm font-black shadow-lg">
                                    {username?.charAt(0).toUpperCase()}
                                </div>
                            </div>
                        </div>
                    </div>
                </header>

                <div className="flex-1 p-8 overflow-auto">
                    {renderContent()}
                </div>
            </main>
        </div>
    );
}

export default App;
