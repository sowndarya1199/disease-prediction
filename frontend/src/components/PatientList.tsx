import { API_BASE } from '../config';
import React, { useEffect, useState, useRef } from 'react';

interface Patient {
    id: number;
    name: string;
    age: number;
    gender: string;
    height: number;
    weight: number;
    diabetes: boolean;
    hypertension: boolean;
    smoking: boolean;
    alcohol_consumption: boolean;
    approval_status?: string;
}

type FilterType = 'all' | 'diabetes' | 'hypertension' | 'smoking' | 'high-risk' | 'healthy' | 'pending-approval';
type BMIFilter = 'all' | 'underweight' | 'normal' | 'overweight' | 'obese';

interface PatientListProps {
    onNavigateToPrediction?: (id: number) => void;
}

const PatientList: React.FC<PatientListProps> = ({ onNavigateToPrediction }) => {
    const [patients, setPatients] = useState<Patient[]>([]);

    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [activeFilter, setActiveFilter] = useState<FilterType>('all');
    const [bmiFilter, setBmiFilter] = useState<BMIFilter>('all');
    const [animatedStats, setAnimatedStats] = useState<Record<string, number>>({});
    const statsRef = useRef<HTMLDivElement>(null);
    const [hasAnimated, setHasAnimated] = useState(false);

    const fetchPatients = async () => {
        try {
            const response = await fetch('${API_BASE}/patients/');
            if (response.ok) {
                const data = await response.json();
                setPatients(data);
            }
        } catch {

        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPatients();
    }, []);


    useEffect(() => {
        if (!loading && patients.length > 0 && !hasAnimated) {
            setHasAnimated(true);
            const stats = {
                total: patients.length,
                diabetes: patients.filter(p => p.diabetes).length,
                hypertension: patients.filter(p => p.hypertension).length,
                highRisk: patients.filter(p => getRiskLevel(p) === 'high').length
            };

            Object.entries(stats).forEach(([key, target]) => {
                let current = 0;
                const duration = 1000;
                const increment = target / (duration / 16);
                const animate = () => {
                    current += increment;
                    if (current < target) {
                        setAnimatedStats(prev => ({ ...prev, [key]: Math.floor(current) }));
                        requestAnimationFrame(animate);
                    } else {
                        setAnimatedStats(prev => ({ ...prev, [key]: target }));
                    }
                };
                requestAnimationFrame(animate);
            });
        }
    }, [loading, patients, hasAnimated]);

    const calculateBMI = (weight: number, height: number): number => {
        if (height === 0) return 0;
        return weight / ((height / 100) ** 2);
    };

    const getBMICategory = (bmi: number) => {
        if (bmi < 18.5) return { label: 'Underweight', color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.15)' };
        if (bmi < 25) return { label: 'Normal', color: '#10b981', bg: 'rgba(16, 185, 129, 0.15)' };
        if (bmi < 30) return { label: 'Overweight', color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.15)' };
        return { label: 'Obese', color: '#f43f5e', bg: 'rgba(244, 63, 94, 0.15)' };
    };

    const getRiskLevel = (patient: Patient): 'low' | 'medium' | 'high' => {
        const riskFactors = [patient.diabetes, patient.hypertension, patient.smoking, patient.alcohol_consumption].filter(Boolean).length;
        const bmi = calculateBMI(patient.weight, patient.height);
        const hasAbnormalBMI = bmi < 18.5 || bmi >= 30;

        if (riskFactors >= 2 || (riskFactors >= 1 && hasAbnormalBMI)) return 'high';
        if (riskFactors === 1 || hasAbnormalBMI) return 'medium';
        return 'low';
    };

    const getRiskConfig = (level: 'low' | 'medium' | 'high') => {
        switch (level) {
            case 'high': return { label: 'High Risk', color: '#f43f5e', bg: 'rgba(244, 63, 94, 0.15)', icon: '⚠️' };
            case 'medium': return { label: 'Moderate', color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.15)', icon: '⚡' };
            default: return { label: 'Low Risk', color: '#10b981', bg: 'rgba(16, 185, 129, 0.15)', icon: '✓' };
        }
    };

    const filteredPatients = patients.filter(p => {
        const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase());
        const bmi = calculateBMI(p.weight, p.height);

        let matchesCondition = true;
        switch (activeFilter) {
            case 'diabetes': matchesCondition = p.diabetes; break;
            case 'hypertension': matchesCondition = p.hypertension; break;
            case 'smoking': matchesCondition = p.smoking; break;
            case 'high-risk': matchesCondition = getRiskLevel(p) === 'high'; break;
            case 'healthy': matchesCondition = getRiskLevel(p) === 'low' && !p.diabetes && !p.hypertension && !p.smoking; break;
            case 'pending-approval': matchesCondition = p.approval_status === 'Pending Approval'; break;
        }

        let matchesBMI = true;
        switch (bmiFilter) {
            case 'underweight': matchesBMI = bmi < 18.5; break;
            case 'normal': matchesBMI = bmi >= 18.5 && bmi < 25; break;
            case 'overweight': matchesBMI = bmi >= 25 && bmi < 30; break;
            case 'obese': matchesBMI = bmi >= 30; break;
        }

        return matchesSearch && matchesCondition && matchesBMI;
    });

    const handleDelete = async (patientId: number, patientName: string) => {
        if (!window.confirm(`Are you sure you want to delete "${patientName}"? This will also delete all their symptoms and lab records.`)) {
            return;
        }

        try {
            const response = await fetch(`${API_BASE}/patients/${patientId}`, {
                method: 'DELETE'
            });

            if (response.ok) {
                setPatients(prev => prev.filter(p => p.id !== patientId));
            } else {
                alert('Failed to delete patient. Please try again.');
            }
        } catch {
            alert('Network error. Is the backend running?');
        }
    };

    const highRiskCount = patients.filter(p => getRiskLevel(p) === 'high').length;

    const stats = [
        {
            key: 'total',
            label: 'Total Patients',
            value: animatedStats.total ?? 0,
            actualValue: patients.length,
            icon: (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
            ),
            gradient: 'linear-gradient(135deg, #22d3ee, #3b82f6)',
            filter: 'all' as FilterType
        },
        {
            key: 'diabetes',
            label: 'Diabetes Cases',
            value: animatedStats.diabetes ?? 0,
            actualValue: patients.filter(p => p.diabetes).length,
            icon: <span className="text-2xl">🩸</span>,
            gradient: 'linear-gradient(135deg, #f59e0b, #f97316)',
            filter: 'diabetes' as FilterType
        },
        {
            key: 'hypertension',
            label: 'Hypertension',
            value: animatedStats.hypertension ?? 0,
            actualValue: patients.filter(p => p.hypertension).length,
            icon: <span className="text-2xl">❤️</span>,
            gradient: 'linear-gradient(135deg, #f43f5e, #ec4899)',
            filter: 'hypertension' as FilterType
        },
        {
            key: 'highRisk',
            label: 'High Risk',
            value: animatedStats.highRisk ?? 0,
            actualValue: highRiskCount,
            icon: <span className="text-2xl">⚠️</span>,
            gradient: 'linear-gradient(135deg, #8b5cf6, #6366f1)',
            filter: 'high-risk' as FilterType
        }
    ];

    const filterChips: { key: FilterType; label: string; icon: string }[] = [
        { key: 'all', label: 'All Patients', icon: '👥' },
        { key: 'healthy', label: 'Healthy', icon: '💚' },
        { key: 'diabetes', label: 'Diabetes', icon: '🩸' },
        { key: 'hypertension', label: 'Hypertension', icon: '❤️' },
        { key: 'smoking', label: 'Smokers', icon: '🚬' },
        { key: 'high-risk', label: 'High Risk', icon: '⚠️' },
        { key: 'pending-approval', label: 'Pending', icon: '⏳' }
    ];

    const bmiChips: { key: BMIFilter; label: string }[] = [
        { key: 'all', label: 'All BMI' },
        { key: 'underweight', label: 'Underweight' },
        { key: 'normal', label: 'Normal' },
        { key: 'overweight', label: 'Overweight' },
        { key: 'obese', label: 'Obese' }
    ];

    return (
        <div className="min-h-full p-6 md:p-8 relative overflow-hidden">

            <div className="absolute inset-0 pointer-events-none overflow-hidden">
                <div
                    className="absolute w-[600px] h-[600px] rounded-full blur-3xl opacity-20"
                    style={{
                        background: 'radial-gradient(circle, rgba(6, 182, 212, 0.4) 0%, transparent 70%)',
                        top: '-15%',
                        right: '-10%',
                        animation: 'floatBg 20s ease-in-out infinite'
                    }}
                />
                <div
                    className="absolute w-[500px] h-[500px] rounded-full blur-3xl opacity-15"
                    style={{
                        background: 'radial-gradient(circle, rgba(139, 92, 246, 0.4) 0%, transparent 70%)',
                        bottom: '-10%',
                        left: '-5%',
                        animation: 'floatBg 25s ease-in-out infinite reverse'
                    }}
                />
            </div>

            <div className="max-w-7xl mx-auto relative z-10">

                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-8" style={{ animation: 'slideIn 0.5s ease-out' }}>
                    <div className="flex items-center gap-4">
                        <div
                            className="w-14 h-14 rounded-2xl flex items-center justify-center shadow-xl"
                            style={{
                                background: 'linear-gradient(135deg, #22d3ee 0%, #3b82f6 100%)',
                                boxShadow: '0 10px 30px rgba(6, 182, 212, 0.4)'
                            }}
                        >
                            <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold" style={{ color: 'var(--gray-900)' }}>Patient Records</h1>
                            <p className="text-sm" style={{ color: 'var(--gray-500)' }}>
                                {patients.length} patients registered • {filteredPatients.length} showing
                            </p>
                        </div>
                    </div>


                    <div className="relative">
                        <svg
                            className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                            style={{ color: '#9ca3af' }}
                        >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                        <input
                            type="text"
                            placeholder="Search patients by name..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-12 pr-4 py-3.5 rounded-2xl w-full lg:w-80 transition-all duration-300"
                            style={{
                                background: 'rgba(255, 255, 255, 0.9)',
                                backdropFilter: 'blur(10px)',
                                border: '2px solid #e5e7eb',
                                color: '#1f2937',
                                boxShadow: '0 4px 15px rgba(0, 0, 0, 0.05)'
                            }}
                            onFocus={(e) => {
                                e.target.style.borderColor = '#0891b2';
                                e.target.style.boxShadow = '0 0 20px rgba(6, 182, 212, 0.15)';
                            }}
                            onBlur={(e) => {
                                e.target.style.borderColor = '#e5e7eb';
                                e.target.style.boxShadow = '0 4px 15px rgba(0, 0, 0, 0.05)';
                            }}
                        />
                    </div>
                </div>


                <div ref={statsRef} className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8" style={{ animation: 'slideIn 0.5s ease-out 0.1s both' }}>
                    {stats.map((stat, i) => (
                        <button
                            key={stat.key}
                            onClick={() => setActiveFilter(stat.filter)}
                            className="rounded-3xl p-6 text-left transition-all duration-300 relative overflow-hidden group"
                            style={{
                                background: activeFilter === stat.filter
                                    ? 'linear-gradient(135deg, rgba(255, 255, 255, 0.95), rgba(255, 255, 255, 0.9))'
                                    : 'rgba(255, 255, 255, 0.8)',
                                backdropFilter: 'blur(20px)',
                                border: activeFilter === stat.filter ? '2px solid #0891b2' : '2px solid rgba(255, 255, 255, 0.5)',
                                boxShadow: activeFilter === stat.filter
                                    ? '0 20px 40px rgba(6, 182, 212, 0.2)'
                                    : '0 10px 30px rgba(0, 0, 0, 0.05)',
                                transform: activeFilter === stat.filter ? 'scale(1.02)' : 'scale(1)',
                                animation: `fadeInUp 0.4s ease-out ${i * 0.1}s both`
                            }}
                        >

                            <div
                                className="absolute left-0 top-0 bottom-0 w-1.5 rounded-l-3xl transition-all duration-300"
                                style={{ background: stat.gradient }}
                            />

                            <div className="flex items-start justify-between mb-4">
                                <div
                                    className="w-12 h-12 rounded-xl flex items-center justify-center text-white transition-transform duration-300 group-hover:scale-110"
                                    style={{
                                        background: stat.gradient,
                                        boxShadow: `0 8px 20px ${stat.gradient.includes('#22d3ee') ? 'rgba(6, 182, 212, 0.3)' : stat.gradient.includes('#f59e0b') ? 'rgba(245, 158, 11, 0.3)' : stat.gradient.includes('#f43f5e') ? 'rgba(244, 63, 94, 0.3)' : 'rgba(139, 92, 246, 0.3)'}`
                                    }}
                                >
                                    {stat.icon}
                                </div>
                                {stat.actualValue > 0 && (
                                    <div
                                        className="text-xs font-semibold px-2 py-1 rounded-full"
                                        style={{ background: stat.gradient, color: 'white' }}
                                    >
                                        {Math.round((stat.actualValue / patients.length) * 100)}%
                                    </div>
                                )}
                            </div>
                            <div
                                className="text-4xl font-bold mb-1 transition-all duration-300"
                                style={{ color: '#1f2937' }}
                            >
                                {stat.value}
                            </div>
                            <div className="text-sm font-medium" style={{ color: '#6b7280' }}>{stat.label}</div>
                        </button>
                    ))}
                </div>


                <div className="mb-6 space-y-4" style={{ animation: 'slideIn 0.5s ease-out 0.2s both' }}>

                    <div className="flex flex-wrap gap-2">
                        {filterChips.map((chip) => (
                            <button
                                key={chip.key}
                                onClick={() => setActiveFilter(chip.key)}
                                className="flex items-center gap-2 px-4 py-2.5 rounded-full text-sm font-semibold transition-all duration-300"
                                style={{
                                    background: activeFilter === chip.key
                                        ? 'linear-gradient(135deg, #22d3ee, #3b82f6)'
                                        : 'rgba(255, 255, 255, 0.9)',
                                    color: activeFilter === chip.key ? 'white' : '#6b7280',
                                    border: activeFilter === chip.key ? 'none' : '2px solid #e5e7eb',
                                    boxShadow: activeFilter === chip.key ? '0 8px 20px rgba(6, 182, 212, 0.3)' : 'none',
                                    transform: activeFilter === chip.key ? 'scale(1.05)' : 'scale(1)'
                                }}
                            >
                                <span>{chip.icon}</span>
                                {chip.label}
                            </button>
                        ))}
                    </div>


                    <div className="flex flex-wrap gap-2">
                        {bmiChips.map((chip) => (
                            <button
                                key={chip.key}
                                onClick={() => setBmiFilter(chip.key)}
                                className="px-4 py-2 rounded-full text-sm font-medium transition-all duration-300"
                                style={{
                                    background: bmiFilter === chip.key
                                        ? '#1f2937'
                                        : 'rgba(255, 255, 255, 0.9)',
                                    color: bmiFilter === chip.key ? 'white' : '#6b7280',
                                    border: bmiFilter === chip.key ? 'none' : '2px solid #e5e7eb'
                                }}
                            >
                                {chip.label}
                            </button>
                        ))}
                    </div>
                </div>


                {highRiskCount > 0 && (
                    <div
                        className="mb-6 px-5 py-4 rounded-2xl flex items-center gap-3"
                        style={{
                            background: 'linear-gradient(135deg, rgba(244, 63, 94, 0.1), rgba(139, 92, 246, 0.1))',
                            border: '1px solid rgba(244, 63, 94, 0.2)',
                            animation: 'slideIn 0.5s ease-out 0.3s both'
                        }}
                    >
                        <span className="text-xl">🧠</span>
                        <span className="font-medium" style={{ color: '#1f2937' }}>
                            Health Alert: <span style={{ color: '#f43f5e' }}>{highRiskCount} patient{highRiskCount > 1 ? 's' : ''}</span> require attention due to multiple risk factors
                        </span>
                    </div>
                )}


                {loading ? (
                    <div className="flex items-center justify-center py-20">
                        <div className="flex flex-col items-center gap-4">
                            <div
                                className="w-14 h-14 border-4 border-t-transparent rounded-full animate-spin"
                                style={{ borderColor: '#0891b2', borderTopColor: 'transparent' }}
                            />
                            <p className="font-medium" style={{ color: '#6b7280' }}>Loading patient records...</p>
                        </div>
                    </div>
                ) : filteredPatients.length === 0 ? (
                    <div
                        className="rounded-3xl p-16 text-center"
                        style={{
                            background: 'rgba(255, 255, 255, 0.9)',
                            backdropFilter: 'blur(20px)',
                            border: '2px solid rgba(255, 255, 255, 0.5)'
                        }}
                    >
                        <div
                            className="w-20 h-20 mx-auto mb-6 rounded-2xl flex items-center justify-center"
                            style={{ background: '#f3f4f6' }}
                        >
                            <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: '#9ca3af' }}>
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                        </div>
                        <h3 className="text-xl font-bold mb-2" style={{ color: '#1f2937' }}>No patients found</h3>
                        <p style={{ color: '#6b7280' }}>{searchTerm ? 'Try a different search term' : 'Register your first patient to get started'}</p>
                    </div>
                ) : (
                    <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-5">
                        {filteredPatients.map((patient, index) => {
                            const bmi = calculateBMI(patient.weight, patient.height);
                            const bmiCategory = getBMICategory(bmi);
                            const riskLevel = getRiskLevel(patient);
                            const riskConfig = getRiskConfig(riskLevel);
                            const conditions = [];
                            if (patient.diabetes) conditions.push({ label: 'Diabetes', icon: '🩸' });
                            if (patient.hypertension) conditions.push({ label: 'Hypertension', icon: '❤️' });
                            if (patient.smoking) conditions.push({ label: 'Smoker', icon: '🚬' });
                            if (patient.alcohol_consumption) conditions.push({ label: 'Alcohol', icon: '🍷' });

                            return (
                                <div
                                    key={patient.id}
                                    className="rounded-3xl p-6 transition-all duration-300 group cursor-pointer relative overflow-hidden"
                                    style={{
                                        background: 'rgba(255, 255, 255, 0.95)',
                                        backdropFilter: 'blur(20px)',
                                        border: '2px solid rgba(255, 255, 255, 0.5)',
                                        boxShadow: '0 10px 30px rgba(0, 0, 0, 0.05)',
                                        animation: `fadeInUp 0.4s ease-out ${index * 0.05}s both`
                                    }}
                                    onMouseEnter={(e) => {
                                        e.currentTarget.style.transform = 'translateY(-5px)';
                                        e.currentTarget.style.boxShadow = '0 25px 50px rgba(6, 182, 212, 0.15)';
                                        e.currentTarget.style.borderColor = 'rgba(6, 182, 212, 0.3)';
                                    }}
                                    onMouseLeave={(e) => {
                                        e.currentTarget.style.transform = 'translateY(0)';
                                        e.currentTarget.style.boxShadow = '0 10px 30px rgba(0, 0, 0, 0.05)';
                                        e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.5)';
                                    }}
                                >

                                    <div
                                        className="absolute left-0 top-0 bottom-0 w-1.5 rounded-l-3xl"
                                        style={{ background: riskConfig.color }}
                                    />


                                    <div className="flex items-start gap-4 mb-5">
                                        <div className="flex-1 min-w-0">
                                            <h3 className="font-bold text-xl tracking-tight" style={{ color: '#1f2937' }}>
                                                {patient.name}
                                            </h3>
                                            <div className="flex items-center gap-2 mt-1">
                                                <span className="text-sm" style={{ color: '#6b7280' }}>
                                                    {patient.age} yrs • {patient.gender}
                                                </span>

                                            </div>
                                        </div>

                                        <div
                                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold"
                                            style={{
                                                background: riskConfig.bg,
                                                color: riskConfig.color,
                                                animation: riskLevel === 'high' ? 'pulse 2s ease-in-out infinite' : 'none'
                                            }}
                                        >
                                            {riskConfig.icon} {riskConfig.label}
                                        </div>

                                        {/* Approval Status Badge */}
                                        <div
                                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider shadow-sm border"
                                            style={{
                                                backgroundColor: patient.approval_status === 'Approved' ? '#ecfdf5' :
                                                    patient.approval_status === 'Modified' ? '#eff6ff' :
                                                        patient.approval_status === 'Pending Approval' ? '#fff7ed' : '#f8fafc',
                                                color: patient.approval_status === 'Approved' ? '#059669' :
                                                    patient.approval_status === 'Modified' ? '#2563eb' :
                                                        patient.approval_status === 'Pending Approval' ? '#ea580c' : '#64748b',
                                                borderColor: patient.approval_status === 'Approved' ? '#10b98120' :
                                                    patient.approval_status === 'Modified' ? '#3b82f620' :
                                                        patient.approval_status === 'Pending Approval' ? '#f9731620' : '#e2e8f0'
                                            }}
                                        >
                                            <span className="w-1.5 h-1.5 rounded-full animate-pulse mr-0.5" style={{
                                                backgroundColor: patient.approval_status === 'Approved' ? '#10b981' :
                                                    patient.approval_status === 'Modified' ? '#3b82f6' :
                                                        patient.approval_status === 'Pending Approval' ? '#f97316' : '#94a3b8'
                                            }}></span>
                                            {patient.approval_status || 'Registered'}
                                        </div>
                                    </div>


                                    <div className="flex items-center justify-between mb-4">
                                        <div className="flex items-center gap-3">
                                            <div>
                                                <span className="text-xs font-medium block" style={{ color: '#9ca3af' }}>BMI</span>
                                                <span className="text-2xl font-bold" style={{ color: bmiCategory.color }}>
                                                    {bmi.toFixed(1)}
                                                </span>
                                            </div>
                                            <span
                                                className="text-xs px-2.5 py-1 rounded-full font-semibold"
                                                style={{ background: bmiCategory.bg, color: bmiCategory.color }}
                                            >
                                                {bmiCategory.label}
                                            </span>
                                        </div>
                                    </div>


                                    <div className="flex flex-wrap gap-2 mb-5">
                                        {conditions.length > 0 ? conditions.map((c, i) => (
                                            <span
                                                key={i}
                                                className="px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5"
                                                style={{
                                                    background: 'rgba(244, 63, 94, 0.1)',
                                                    color: '#f43f5e',
                                                    border: '1px solid rgba(244, 63, 94, 0.2)'
                                                }}
                                            >
                                                {c.icon} {c.label}
                                            </span>
                                        )) : (
                                            <span
                                                className="px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5"
                                                style={{
                                                    background: 'rgba(16, 185, 129, 0.1)',
                                                    color: '#10b981',
                                                    border: '1px solid rgba(16, 185, 129, 0.2)'
                                                }}
                                            >
                                                ✓ No conditions reported
                                            </span>
                                        )}
                                    </div>


                                    <div
                                        className="pt-4 flex items-center justify-between"
                                        style={{ borderTop: '1px solid #f3f4f6' }}
                                    >
                                        <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    if (onNavigateToPrediction) {
                                                        onNavigateToPrediction(patient.id);
                                                    }
                                                }}
                                                className="px-3 py-2 rounded-xl text-xs font-semibold transition-all duration-300"
                                                style={{ background: '#f3f4f6', color: '#6b7280' }}
                                                onMouseEnter={(e) => {
                                                    e.currentTarget.style.background = '#e5e7eb';
                                                }}
                                                onMouseLeave={(e) => {
                                                    e.currentTarget.style.background = '#f3f4f6';
                                                }}
                                            >
                                                Review Prediction
                                            </button>
                                            {(patient.approval_status === 'Approved' || patient.approval_status === 'Modified') && (
                                                <a
                                                    href={`${API_BASE}/patients/${patient.id}/download-health-report`}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    onClick={(e) => e.stopPropagation()}
                                                    className="px-3 py-2 rounded-xl text-xs font-semibold transition-all duration-300 flex items-center gap-1.5 hover:scale-105"
                                                    style={{ background: '#0f172a', color: '#f8fafc' }}
                                                >
                                                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                                    </svg>
                                                    Report
                                                </a>
                                            )}
                                        </div>
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleDelete(patient.id, patient.name);
                                            }}
                                            className="p-2 rounded-xl transition-all duration-200 opacity-0 group-hover:opacity-100"
                                            style={{
                                                background: 'rgba(244, 63, 94, 0.1)',
                                                color: '#f43f5e'
                                            }}
                                            title="Delete patient"
                                        >
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                            </svg>
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>


            <style>{`
                @keyframes floatBg {
                    0%, 100% { transform: translate(0, 0) scale(1); }
                    25% { transform: translate(20px, -20px) scale(1.05); }
                    50% { transform: translate(-15px, 15px) scale(0.95); }
                    75% { transform: translate(-20px, -15px) scale(1.02); }
                }
                
                @keyframes slideIn {
                    from { opacity: 0; transform: translateY(20px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                
                @keyframes fadeInUp {
                    from { opacity: 0; transform: translateY(30px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                
                @keyframes pulse {
                    0%, 100% { opacity: 1; }
                    50% { opacity: 0.7; }
                }
            `}</style>
        </div >
    );
};

export default PatientList;

