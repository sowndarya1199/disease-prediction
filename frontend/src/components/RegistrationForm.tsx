import React, { useState, useEffect } from 'react';
import { API_BASE } from '../config';

interface FormData {
    [key: string]: string | number | boolean | '';
    name: string;
    dob: string;
    age: number | '';
    gender: string;
    height: number | '';
    weight: number | '';
    diabetes: boolean;
    hypertension: boolean;
    smoking: boolean;
    alcohol_consumption: boolean;
    other_medical_history: string;
}

const calculateBMI = (height: number, weight: number): string => {
    if (!height || !weight || height <= 0 || weight <= 0) return '';
    const heightInMeters = height / 100;
    const bmi = (weight / (heightInMeters * heightInMeters)).toFixed(1);
    return bmi;
};

const RegistrationForm: React.FC = () => {
    const [currentStep, setCurrentStep] = useState(1);
    const [formData, setFormData] = useState<FormData>({
        name: '',
        dob: '',
        age: '',
        gender: 'Male',
        height: '',
        weight: '',
        diabetes: false,
        hypertension: false,
        smoking: false,
        alcohol_consumption: false,
        other_medical_history: '',
    });

    const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
    const [loading, setLoading] = useState(false);
    const [focusedInput, setFocusedInput] = useState<string | null>(null);
    const [animatedBMI, setAnimatedBMI] = useState<string>('');
    const [showSuccess, setShowSuccess] = useState(false);
    const [fieldErrors, setFieldErrors] = useState<{ name?: string; dob?: string; age?: string; height?: string; weight?: string }>({});

    const calculateAge = (dob: string): number | '' => {
        if (!dob) return '';
        const birthDate = new Date(dob);
        const today = new Date();
        let age = today.getFullYear() - birthDate.getFullYear();
        const m = today.getMonth() - birthDate.getMonth();
        if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
            age--;
        }
        return age;
    };

    const getAgeDisplay = (dob: string): string => {
        if (!dob) return '';
        const birthDate = new Date(dob);
        const today = new Date();

        let years = today.getFullYear() - birthDate.getFullYear();
        let months = today.getMonth() - birthDate.getMonth();
        let days = today.getDate() - birthDate.getDate();

        if (days < 0) {
            months--;
            const prevMonth = new Date(today.getFullYear(), today.getMonth(), 0);
            days += prevMonth.getDate();
        }

        if (months < 0) {
            years--;
            months += 12;
        }

        
        if (years === 0) {
            if (months === 0) {
                return days === 1 ? '1 day old' : `${days} days old`;
            }
            return months === 1 ? '1 month old' : `${months} months old`;
        }

        
        return years === 1 ? '1 year' : `${years} years`;
    };

    const validateField = (field: string, value: string | number | ''): string | undefined => {
        const numValue = typeof value === 'number' ? value : Number(value);
        switch (field) {
            case 'name':
                if (!value || String(value).trim() === '') return 'Name is required';
                if (String(value).length < 2) return 'Name must be at least 2 characters';
                if (String(value).length > 100) return 'Name must be less than 100 characters';
                if (!/^[a-zA-Z\s]+$/.test(String(value))) return 'Name can only contain letters, spaces';
                return undefined;
            case 'dob':
                if (!value) return 'Date of Birth is required';
                const date = new Date(value as string);
                if (isNaN(date.getTime())) return 'Invalid date';
                if (date > new Date()) return 'Date of Birth cannot be in the future';
                return undefined;
            case 'age':
                if (!value && value !== 0) return 'Age is required';
                if (isNaN(numValue) || numValue < 0 || numValue > 150) return 'Age must be between 0 and 150';
                if (!Number.isInteger(numValue)) return 'Age must be a whole number';
                return undefined;
            case 'height':
                if (!value && value !== 0) return 'Height is required';
                if (isNaN(numValue) || numValue < 30 || numValue > 300) return 'Height must be between 30 and 300 cm';
                return undefined;
            case 'weight':
                if (!value && value !== 0) return 'Weight is required';
                if (isNaN(numValue) || numValue < 1 || numValue > 500) return 'Weight must be between 1 and 500 kg';
                return undefined;
            default:
                return undefined;
        }
    };

    const handleFieldBlur = (field: string, value: string | number | '') => {
        const error = validateField(field, value);
        setFieldErrors(prev => ({ ...prev, [field]: error }));
        setFocusedInput(null);
    };

    const bmi = calculateBMI(Number(formData.height), Number(formData.weight));

    useEffect(() => {
        if (bmi && bmi !== animatedBMI) {
            const start = parseFloat(animatedBMI) || 0;
            const end = parseFloat(bmi);
            const duration = 500;
            const startTime = performance.now();

            const animate = (currentTime: number) => {
                const elapsed = currentTime - startTime;
                const progress = Math.min(elapsed / duration, 1);
                const easeOut = 1 - Math.pow(1 - progress, 3);
                const current = start + (end - start) * easeOut;
                setAnimatedBMI(current.toFixed(1));

                if (progress < 1) {
                    requestAnimationFrame(animate);
                }
            };
            requestAnimationFrame(animate);
        }
    }, [bmi, animatedBMI]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;
        const checked = (e.target as HTMLInputElement).checked;

        if (name === 'dob') {
            const ageComp = calculateAge(value);
            setFormData(prev => ({
                ...prev,
                dob: value,
                age: ageComp
            }));

            const ageError = validateField('age', ageComp);
            const dobError = validateField('dob', value);
            setFieldErrors(prev => ({ ...prev, age: ageError, dob: dobError }));
        } else {
            setFormData(prev => ({
                ...prev,
                [name]: type === 'checkbox' ? checked : value
            }));
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && currentStep < 3) {
            e.preventDefault();
            if (canProceed(currentStep)) {
                setCurrentStep(prev => prev + 1);
            }
        }
    };

    const handleSubmit = async (e?: React.FormEvent | React.MouseEvent) => {
        if (e) {
            e.preventDefault();
        }
        if (currentStep !== 3) {
            return;
        }
        setLoading(true);
        setMessage(null);

        try {
            const response = await fetch(`${API_BASE}/patients/`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            });

            if (response.ok) {

                setShowSuccess(true);
                setMessage({ text: `Patient ${formData.name} registered successfully!`, type: 'success' });
                setTimeout(() => {
                    setFormData({
                        name: '', dob: '', age: '', gender: 'Male', height: '', weight: '',
                        diabetes: false, hypertension: false, smoking: false,
                        alcohol_consumption: false, other_medical_history: ''
                    });
                    setCurrentStep(1);
                    setShowSuccess(false);
                    setAnimatedBMI('');
                }, 2000);
            } else {
                setMessage({ text: 'Registration failed. Please check the data.', type: 'error' });
            }
        } catch {
            setMessage({ text: 'Network error. Is the backend running?', type: 'error' });
        } finally {
            setLoading(false);
        }
    };

    const getBMICategory = (bmi: string) => {
        const val = parseFloat(bmi);
        if (val < 18.5) return { label: 'Underweight', color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.15)', hint: 'Consider nutritional assessment' };
        if (val < 25) return { label: 'Healthy', color: '#10b981', bg: 'rgba(16, 185, 129, 0.15)', hint: 'BMI is within healthy range' };
        if (val < 30) return { label: 'Overweight', color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.15)', hint: 'Lifestyle modifications recommended' };
        return { label: 'Obese', color: '#f43f5e', bg: 'rgba(244, 63, 94, 0.15)', hint: 'Medical intervention may be needed' };
    };

    const steps = [
        { id: 1, title: 'Personal Info', icon: 'user' },
        { id: 2, title: 'Physical Metrics', icon: 'metrics' },
        { id: 3, title: 'Medical History', icon: 'history' }
    ];

    const canProceed = (step: number) => {
        if (step === 1) {
            const nameError = validateField('name', formData.name);
            const dobError = validateField('dob', formData.dob);
            const ageError = validateField('age', formData.age);
            return formData.name && formData.dob && formData.age !== '' && formData.gender && !nameError && !dobError && !ageError;
        }
        if (step === 2) {
            const heightError = validateField('height', formData.height);
            const weightError = validateField('weight', formData.weight);
            return formData.height && formData.weight && !heightError && !weightError;
        }
        return true;
    };

    const isLabelFloating = (field: string, value: string | number | '') => {
        return focusedInput === field || (value !== '' && value !== undefined);
    };

    const renderStepIcon = (iconName: string) => {
        switch (iconName) {
            case 'user':
                return (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                );
            case 'metrics':
                return (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                );
            case 'history':
                return (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                );
            default:
                return null;
        }
    };

    const medicalConditions = [
        { name: 'diabetes', label: 'Diabetes', icon: '🩸', description: 'Blood sugar condition' },
        { name: 'hypertension', label: 'Hypertension', icon: '❤️', description: 'High blood pressure' },
        { name: 'smoking', label: 'Smoking', icon: '🚬', description: 'Tobacco use' },
        { name: 'alcohol_consumption', label: 'Alcohol', icon: '🍷', description: 'Regular consumption' }
    ];

    return (
        <div className="min-h-full p-6 md:p-8 relative overflow-hidden">

            <div className="absolute inset-0 pointer-events-none overflow-hidden">
                <div
                    className="absolute w-[500px] h-[500px] rounded-full blur-3xl opacity-30"
                    style={{
                        background: 'radial-gradient(circle, rgba(6, 182, 212, 0.3) 0%, transparent 70%)',
                        top: '-10%',
                        right: '-10%',
                        animation: 'floatBg 15s ease-in-out infinite'
                    }}
                />
                <div
                    className="absolute w-[400px] h-[400px] rounded-full blur-3xl opacity-20"
                    style={{
                        background: 'radial-gradient(circle, rgba(59, 130, 246, 0.3) 0%, transparent 70%)',
                        bottom: '-5%',
                        left: '-5%',
                        animation: 'floatBg 20s ease-in-out infinite reverse'
                    }}
                />
                <div
                    className="absolute w-[300px] h-[300px] rounded-full blur-3xl opacity-15"
                    style={{
                        background: 'radial-gradient(circle, rgba(139, 92, 246, 0.3) 0%, transparent 70%)',
                        top: '40%',
                        left: '30%',
                        animation: 'floatBg 18s ease-in-out infinite'
                    }}
                />
            </div>

            <div className="max-w-4xl mx-auto relative z-10">

                <div className="mb-8" style={{ animation: 'slideIn 0.5s ease-out' }}>
                    <div className="flex items-center gap-4">
                        <div
                            className="w-14 h-14 rounded-2xl flex items-center justify-center shadow-xl"
                            style={{
                                background: 'linear-gradient(135deg, #22d3ee 0%, #06b6d4 50%, #3b82f6 100%)',
                                boxShadow: '0 10px 30px rgba(6, 182, 212, 0.4)'
                            }}
                        >
                            <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                            </svg>
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold" style={{ color: 'var(--gray-900)' }}>Register New Patient</h1>
                            <p className="text-sm" style={{ color: 'var(--gray-500)' }}>Enter patient information for health analysis</p>
                        </div>
                    </div>
                </div>


                {message && (
                    <div
                        className="mb-6 px-5 py-4 rounded-2xl flex items-center gap-3"
                        style={{
                            background: message.type === 'success' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(244, 63, 94, 0.15)',
                            border: `1px solid ${message.type === 'success' ? '#10b981' : '#f43f5e'}`,
                            color: message.type === 'success' ? '#10b981' : '#f43f5e',
                            animation: message.type === 'error' ? 'shake 0.5s ease-in-out' : 'none'
                        }}
                    >
                        <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            {message.type === 'success' ? (
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            ) : (
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            )}
                        </svg>
                        <span className="font-medium">{message.text}</span>
                    </div>
                )}


                <div className="mb-8" style={{ animation: 'slideIn 0.5s ease-out 0.1s both' }}>
                    <div className="flex items-center justify-between relative">

                        <div className="absolute top-6 left-0 right-0 h-1 bg-gray-200 rounded-full mx-16" />
                        <div
                            className="absolute top-6 left-0 h-1 rounded-full mx-16 transition-all duration-500"
                            style={{
                                background: 'linear-gradient(90deg, #22d3ee, #3b82f6)',
                                width: `${((currentStep - 1) / 2) * 100}%`,
                                maxWidth: 'calc(100% - 128px)'
                            }}
                        />

                        {steps.map((step) => (
                            <div
                                key={step.id}
                                className="flex flex-col items-center relative z-10 cursor-pointer"
                                onClick={() => step.id < currentStep && setCurrentStep(step.id)}
                            >
                                <div
                                    className="w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-300"
                                    style={{
                                        background: currentStep === step.id
                                            ? 'linear-gradient(135deg, #22d3ee, #3b82f6)'
                                            : currentStep > step.id
                                                ? 'linear-gradient(135deg, #10b981, #059669)'
                                                : 'white',
                                        border: currentStep === step.id
                                            ? 'none'
                                            : currentStep > step.id
                                                ? 'none'
                                                : '2px solid #e5e7eb',
                                        color: currentStep >= step.id ? 'white' : '#9ca3af',
                                        boxShadow: currentStep === step.id
                                            ? '0 8px 25px rgba(6, 182, 212, 0.4)'
                                            : currentStep > step.id
                                                ? '0 4px 15px rgba(16, 185, 129, 0.3)'
                                                : 'none',
                                        transform: currentStep === step.id ? 'scale(1.1)' : 'scale(1)'
                                    }}
                                >
                                    {currentStep > step.id ? (
                                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                                        </svg>
                                    ) : (
                                        renderStepIcon(step.icon)
                                    )}
                                </div>
                                <span
                                    className="mt-2 text-sm font-medium transition-colors duration-300"
                                    style={{
                                        color: currentStep === step.id ? '#0891b2' : currentStep > step.id ? '#10b981' : '#9ca3af'
                                    }}
                                >
                                    {step.title}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>

                <form onSubmit={handleSubmit} onKeyDown={handleKeyDown}>

                    <div
                        className={`transition-all duration-500 ${currentStep === 1 ? 'opacity-100 translate-x-0' : 'hidden'}`}
                        style={{ animation: currentStep === 1 ? 'fadeInUp 0.4s ease-out' : 'none' }}
                    >
                        <div
                            className="rounded-3xl p-8 relative overflow-hidden"
                            style={{
                                background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.9) 0%, rgba(255, 255, 255, 0.95) 100%)',
                                backdropFilter: 'blur(20px)',
                                border: '1px solid rgba(6, 182, 212, 0.2)',
                                boxShadow: '0 20px 50px rgba(0, 0, 0, 0.08), 0 0 0 1px rgba(6, 182, 212, 0.1)'
                            }}
                        >

                            <div
                                className="absolute top-0 left-1/2 -translate-x-1/2 w-1/2 h-1 rounded-full"
                                style={{ background: 'linear-gradient(90deg, transparent, rgba(6, 182, 212, 0.5), transparent)' }}
                            />

                            <div className="flex items-center gap-3 mb-8">
                                <div
                                    className="w-10 h-10 rounded-xl flex items-center justify-center"
                                    style={{
                                        background: 'linear-gradient(135deg, #22d3ee, #3b82f6)',
                                        boxShadow: '0 4px 15px rgba(6, 182, 212, 0.3)'
                                    }}
                                >
                                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                    </svg>
                                </div>
                                <div>
                                    <h2 className="text-xl font-bold" style={{ color: 'var(--gray-900)' }}>Personal Information</h2>
                                    <p className="text-sm" style={{ color: 'var(--gray-500)' }}>Basic patient identification details</p>
                                </div>
                            </div>

                            <div className="space-y-6">

                                <div className="relative">
                                    <div className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: fieldErrors.name ? '#f43f5e' : focusedInput === 'name' ? '#0891b2' : '#9ca3af' }}>
                                        <svg className="w-5 h-5 transition-colors duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                        </svg>
                                    </div>
                                    <input
                                        type="text"
                                        name="name"
                                        id="name"
                                        value={formData.name}
                                        onChange={handleChange}
                                        onFocus={() => setFocusedInput('name')}
                                        onBlur={() => handleFieldBlur('name', formData.name)}
                                        className="w-full pl-12 pr-4 py-4 rounded-2xl transition-all duration-300"
                                        style={{
                                            background: focusedInput === 'name' ? 'white' : '#f9fafb',
                                            border: fieldErrors.name ? '2px solid #f43f5e' : focusedInput === 'name' ? '2px solid #0891b2' : '2px solid #e5e7eb',
                                            color: '#1f2937',
                                            boxShadow: fieldErrors.name ? '0 0 20px rgba(244, 63, 94, 0.15)' : focusedInput === 'name' ? '0 0 20px rgba(6, 182, 212, 0.15)' : 'none'
                                        }}
                                        placeholder=" "
                                    />
                                    <label
                                        htmlFor="name"
                                        className="absolute left-12 transition-all duration-300 pointer-events-none font-medium"
                                        style={{
                                            top: isLabelFloating('name', formData.name) ? '-10px' : '50%',
                                            transform: isLabelFloating('name', formData.name) ? 'translateY(0)' : 'translateY(-50%)',
                                            fontSize: isLabelFloating('name', formData.name) ? '12px' : '14px',
                                            color: fieldErrors.name ? '#f43f5e' : focusedInput === 'name' ? '#0891b2' : '#6b7280',
                                            background: isLabelFloating('name', formData.name) ? 'white' : 'transparent',
                                            padding: isLabelFloating('name', formData.name) ? '0 8px' : '0'
                                        }}
                                    >
                                        Full Name
                                    </label>
                                    {fieldErrors.name && (
                                        <p className="mt-2 text-sm font-medium" style={{ color: '#f43f5e' }}>
                                            {fieldErrors.name}
                                        </p>
                                    )}
                                </div>

                                <div className="grid md:grid-cols-2 gap-6">

                                    <div className="relative">
                                        <input
                                            type="date"
                                            name="dob"
                                            id="dob"
                                            value={formData.dob}
                                            onChange={handleChange}
                                            onFocus={() => setFocusedInput('dob')}
                                            onBlur={() => handleFieldBlur('dob', formData.dob)}
                                            className="w-full px-4 py-4 rounded-2xl transition-all duration-300"
                                            style={{
                                                background: focusedInput === 'dob' ? 'white' : '#f9fafb',
                                                border: fieldErrors.dob ? '2px solid #f43f5e' : focusedInput === 'dob' ? '2px solid #0891b2' : '2px solid #e5e7eb',
                                                color: '#1f2937',
                                                boxShadow: fieldErrors.dob ? '0 0 20px rgba(244, 63, 94, 0.15)' : focusedInput === 'dob' ? '0 0 20px rgba(6, 182, 212, 0.15)' : 'none'
                                            }}
                                            placeholder=" "
                                            max={new Date().toISOString().split('T')[0]}
                                        />
                                        <label
                                            htmlFor="dob"
                                            className="absolute left-4 transition-all duration-300 pointer-events-none font-medium"
                                            style={{
                                                top: '-10px',
                                                transform: 'translateY(0)',
                                                fontSize: '12px',
                                                color: fieldErrors.dob ? '#f43f5e' : focusedInput === 'dob' ? '#0891b2' : '#6b7280',
                                                background: 'white',
                                                padding: '0 8px'
                                            }}
                                        >
                                            Date of Birth
                                        </label>
                                        {fieldErrors.dob && (
                                            <p className="mt-2 text-sm font-medium" style={{ color: '#f43f5e' }}>
                                                {fieldErrors.dob}
                                            </p>
                                        )}
                                        {formData.age !== '' && !fieldErrors.age && (
                                            <div className="mt-2 text-sm font-medium text-gray-600 flex items-center gap-2">
                                                <span style={{ color: '#0891b2' }}>Age:</span> {getAgeDisplay(formData.dob)}
                                            </div>
                                        )}
                                        {fieldErrors.age && (
                                            <p className="mt-2 text-sm font-medium" style={{ color: '#f43f5e' }}>
                                                {fieldErrors.age}
                                            </p>
                                        )}
                                    </div>


                                    <div />
                                </div>


                                <div>
                                    <label className="block text-sm font-semibold mb-3" style={{ color: '#374151' }}>Gender</label>
                                    <div className="grid grid-cols-3 gap-4">
                                        {[
                                            { value: 'Male', icon: '👨', label: 'Male' },
                                            { value: 'Female', icon: '👩', label: 'Female' },
                                            { value: 'Other', icon: '🧑', label: 'Other' }
                                        ].map((g) => (
                                            <label
                                                key={g.value}
                                                className="flex flex-col items-center gap-2 p-4 rounded-2xl cursor-pointer transition-all duration-300"
                                                style={{
                                                    border: formData.gender === g.value
                                                        ? '2px solid #0891b2'
                                                        : '2px solid #e5e7eb',
                                                    background: formData.gender === g.value
                                                        ? 'linear-gradient(135deg, rgba(6, 182, 212, 0.1), rgba(59, 130, 246, 0.1))'
                                                        : 'white',
                                                    boxShadow: formData.gender === g.value
                                                        ? '0 8px 25px rgba(6, 182, 212, 0.2)'
                                                        : 'none',
                                                    transform: formData.gender === g.value ? 'scale(1.02)' : 'scale(1)'
                                                }}
                                            >
                                                <input
                                                    type="radio"
                                                    name="gender"
                                                    value={g.value}
                                                    checked={formData.gender === g.value}
                                                    onChange={handleChange}
                                                    className="sr-only"
                                                />
                                                <span className="text-3xl">{g.icon}</span>
                                                <span
                                                    className="font-medium text-sm"
                                                    style={{ color: formData.gender === g.value ? '#0891b2' : '#6b7280' }}
                                                >
                                                    {g.label}
                                                </span>
                                            </label>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>


                    <div
                        className={`transition-all duration-500 ${currentStep === 2 ? 'opacity-100 translate-x-0' : 'hidden'}`}
                        style={{ animation: currentStep === 2 ? 'fadeInUp 0.4s ease-out' : 'none' }}
                    >
                        <div
                            className="rounded-3xl p-8 relative overflow-hidden"
                            style={{
                                background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.9) 0%, rgba(255, 255, 255, 0.95) 100%)',
                                backdropFilter: 'blur(20px)',
                                border: '1px solid rgba(6, 182, 212, 0.2)',
                                boxShadow: '0 20px 50px rgba(0, 0, 0, 0.08), 0 0 0 1px rgba(6, 182, 212, 0.1)'
                            }}
                        >
                            <div
                                className="absolute top-0 left-1/2 -translate-x-1/2 w-1/2 h-1 rounded-full"
                                style={{ background: 'linear-gradient(90deg, transparent, rgba(6, 182, 212, 0.5), transparent)' }}
                            />

                            <div className="flex items-center gap-3 mb-8">
                                <div
                                    className="w-10 h-10 rounded-xl flex items-center justify-center"
                                    style={{
                                        background: 'linear-gradient(135deg, #22d3ee, #3b82f6)',
                                        boxShadow: '0 4px 15px rgba(6, 182, 212, 0.3)'
                                    }}
                                >
                                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                    </svg>
                                </div>
                                <div>
                                    <h2 className="text-xl font-bold" style={{ color: 'var(--gray-900)' }}>Physical Metrics</h2>
                                    <p className="text-sm" style={{ color: 'var(--gray-500)' }}>Height, weight, and body composition</p>
                                </div>
                            </div>

                            <div className="grid md:grid-cols-2 gap-6 mb-6">

                                <div className="relative">
                                    <div className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: fieldErrors.height ? '#f43f5e' : focusedInput === 'height' ? '#0891b2' : '#9ca3af' }}>
                                        <svg className="w-5 h-5 transition-colors duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
                                        </svg>
                                    </div>
                                    <input
                                        type="number"
                                        name="height"
                                        id="height"
                                        value={formData.height}
                                        onChange={handleChange}
                                        onFocus={() => setFocusedInput('height')}
                                        onBlur={() => handleFieldBlur('height', formData.height)}
                                        className="w-full pl-12 pr-16 py-4 rounded-2xl transition-all duration-300"
                                        style={{
                                            background: focusedInput === 'height' ? 'white' : '#f9fafb',
                                            border: fieldErrors.height ? '2px solid #f43f5e' : focusedInput === 'height' ? '2px solid #0891b2' : '2px solid #e5e7eb',
                                            color: '#1f2937',
                                            boxShadow: fieldErrors.height ? '0 0 20px rgba(244, 63, 94, 0.15)' : focusedInput === 'height' ? '0 0 20px rgba(6, 182, 212, 0.15)' : 'none'
                                        }}
                                        placeholder=" "
                                    />
                                    <label
                                        htmlFor="height"
                                        className="absolute left-12 transition-all duration-300 pointer-events-none font-medium"
                                        style={{
                                            top: isLabelFloating('height', formData.height) ? '-10px' : '50%',
                                            transform: isLabelFloating('height', formData.height) ? 'translateY(0)' : 'translateY(-50%)',
                                            fontSize: isLabelFloating('height', formData.height) ? '12px' : '14px',
                                            color: fieldErrors.height ? '#f43f5e' : focusedInput === 'height' ? '#0891b2' : '#6b7280',
                                            background: isLabelFloating('height', formData.height) ? 'white' : 'transparent',
                                            padding: isLabelFloating('height', formData.height) ? '0 8px' : '0'
                                        }}
                                    >
                                        Height
                                    </label>
                                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-medium" style={{ color: '#9ca3af' }}>cm</span>
                                    {fieldErrors.height && (
                                        <p className="mt-2 text-sm font-medium" style={{ color: '#f43f5e' }}>
                                            {fieldErrors.height}
                                        </p>
                                    )}
                                </div>


                                <div className="relative">
                                    <div className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: fieldErrors.weight ? '#f43f5e' : focusedInput === 'weight' ? '#0891b2' : '#9ca3af' }}>
                                        <svg className="w-5 h-5 transition-colors duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" />
                                        </svg>
                                    </div>
                                    <input
                                        type="number"
                                        name="weight"
                                        id="weight"
                                        value={formData.weight}
                                        onChange={handleChange}
                                        onFocus={() => setFocusedInput('weight')}
                                        onBlur={() => handleFieldBlur('weight', formData.weight)}
                                        className="w-full pl-12 pr-16 py-4 rounded-2xl transition-all duration-300"
                                        style={{
                                            background: focusedInput === 'weight' ? 'white' : '#f9fafb',
                                            border: fieldErrors.weight ? '2px solid #f43f5e' : focusedInput === 'weight' ? '2px solid #0891b2' : '2px solid #e5e7eb',
                                            color: '#1f2937',
                                            boxShadow: fieldErrors.weight ? '0 0 20px rgba(244, 63, 94, 0.15)' : focusedInput === 'weight' ? '0 0 20px rgba(6, 182, 212, 0.15)' : 'none'
                                        }}
                                        placeholder=" "
                                    />
                                    <label
                                        htmlFor="weight"
                                        className="absolute left-12 transition-all duration-300 pointer-events-none font-medium"
                                        style={{
                                            top: isLabelFloating('weight', formData.weight) ? '-10px' : '50%',
                                            transform: isLabelFloating('weight', formData.weight) ? 'translateY(0)' : 'translateY(-50%)',
                                            fontSize: isLabelFloating('weight', formData.weight) ? '12px' : '14px',
                                            color: fieldErrors.weight ? '#f43f5e' : focusedInput === 'weight' ? '#0891b2' : '#6b7280',
                                            background: isLabelFloating('weight', formData.weight) ? 'white' : 'transparent',
                                            padding: isLabelFloating('weight', formData.weight) ? '0 8px' : '0'
                                        }}
                                    >
                                        Weight
                                    </label>
                                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-medium" style={{ color: '#9ca3af' }}>kg</span>
                                    {fieldErrors.weight && (
                                        <p className="mt-2 text-sm font-medium" style={{ color: '#f43f5e' }}>
                                            {fieldErrors.weight}
                                        </p>
                                    )}
                                </div>
                            </div>


                            <div
                                className="rounded-2xl p-6 transition-all duration-500"
                                style={{
                                    background: bmi ? getBMICategory(bmi).bg : '#f9fafb',
                                    border: `2px solid ${bmi ? getBMICategory(bmi).color : '#e5e7eb'}`
                                }}
                            >
                                <div className="flex items-center justify-between mb-3">
                                    <span className="text-sm font-semibold" style={{ color: '#374151' }}>Body Mass Index (BMI)</span>
                                    {bmi && (
                                        <span
                                            className="text-xs px-3 py-1.5 rounded-full font-semibold text-white"
                                            style={{ background: getBMICategory(bmi).color }}
                                        >
                                            {getBMICategory(bmi).label}
                                        </span>
                                    )}
                                </div>
                                <div className="flex items-end gap-2">
                                    <span
                                        className="text-5xl font-bold transition-all duration-300"
                                        style={{ color: bmi ? getBMICategory(bmi).color : '#d1d5db' }}
                                    >
                                        {animatedBMI || '—'}
                                    </span>
                                    <span className="text-lg mb-2" style={{ color: '#9ca3af' }}>kg/m²</span>
                                </div>
                            </div>
                        </div>
                    </div>


                    <div
                        className={`transition-all duration-500 ${currentStep === 3 ? 'opacity-100 translate-x-0' : 'hidden'}`}
                        style={{ animation: currentStep === 3 ? 'fadeInUp 0.4s ease-out' : 'none' }}
                    >
                        <div
                            className="rounded-3xl p-8 relative overflow-hidden"
                            style={{
                                background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.9) 0%, rgba(255, 255, 255, 0.95) 100%)',
                                backdropFilter: 'blur(20px)',
                                border: '1px solid rgba(139, 92, 246, 0.2)',
                                boxShadow: '0 20px 50px rgba(0, 0, 0, 0.08), 0 0 0 1px rgba(139, 92, 246, 0.1)'
                            }}
                        >
                            <div
                                className="absolute top-0 left-1/2 -translate-x-1/2 w-1/2 h-1 rounded-full"
                                style={{ background: 'linear-gradient(90deg, transparent, rgba(139, 92, 246, 0.5), transparent)' }}
                            />

                            <div className="flex items-center gap-3 mb-8">
                                <div
                                    className="w-10 h-10 rounded-xl flex items-center justify-center"
                                    style={{
                                        background: 'linear-gradient(135deg, #a78bfa, #8b5cf6)',
                                        boxShadow: '0 4px 15px rgba(139, 92, 246, 0.3)'
                                    }}
                                >
                                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                    </svg>
                                </div>
                                <div>
                                    <h2 className="text-xl font-bold" style={{ color: 'var(--gray-900)' }}>Medical History</h2>
                                    <p className="text-sm" style={{ color: 'var(--gray-500)' }}>Known conditions and lifestyle factors</p>
                                </div>
                            </div>


                            <div className="grid md:grid-cols-2 gap-4 mb-6">
                                {medicalConditions.map((item, index) => (
                                    <label
                                        key={item.name}
                                        className="flex items-center gap-4 p-5 rounded-2xl cursor-pointer transition-all duration-300 group"
                                        style={{
                                            border: (formData as Record<string, boolean | string | number>)[item.name]
                                                ? '2px solid #8b5cf6'
                                                : '2px solid #e5e7eb',
                                            background: (formData as Record<string, boolean | string | number>)[item.name]
                                                ? 'linear-gradient(135deg, rgba(139, 92, 246, 0.1), rgba(99, 102, 241, 0.1))'
                                                : 'white',
                                            boxShadow: (formData as Record<string, boolean | string | number>)[item.name]
                                                ? '0 8px 25px rgba(139, 92, 246, 0.2)'
                                                : 'none',
                                            animation: `fadeInUp 0.4s ease-out ${index * 0.1}s both`
                                        }}
                                    >
                                        <span className="text-2xl">{item.icon}</span>
                                        <div className="flex-1">
                                            <span className="font-semibold block" style={{ color: '#374151' }}>{item.label}</span>
                                            <span className="text-xs" style={{ color: '#9ca3af' }}>{item.description}</span>
                                        </div>
                                        <div
                                            className="w-7 h-7 rounded-lg flex items-center justify-center transition-all duration-300"
                                            style={{
                                                background: (formData as Record<string, boolean | string | number>)[item.name] ? '#8b5cf6' : '#f3f4f6',
                                                border: (formData as Record<string, boolean | string | number>)[item.name] ? 'none' : '2px solid #e5e7eb'
                                            }}
                                        >
                                            {(formData as Record<string, boolean | string | number>)[item.name] && (
                                                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                                                </svg>
                                            )}
                                        </div>
                                        <input
                                            type="checkbox"
                                            name={item.name}
                                            checked={(formData as Record<string, boolean | string | number>)[item.name] as boolean}
                                            onChange={handleChange}
                                            className="sr-only"
                                        />
                                    </label>
                                ))}
                            </div>


                            <div className="relative">
                                <textarea
                                    name="other_medical_history"
                                    id="other_medical_history"
                                    value={formData.other_medical_history}
                                    onChange={handleChange}
                                    onFocus={() => setFocusedInput('notes')}
                                    onBlur={() => setFocusedInput(null)}
                                    rows={4}
                                    className="w-full px-4 py-4 rounded-2xl transition-all duration-300 resize-none"
                                    style={{
                                        background: focusedInput === 'notes' ? 'white' : '#f9fafb',
                                        border: focusedInput === 'notes' ? '2px solid #8b5cf6' : '2px solid #e5e7eb',
                                        color: '#1f2937',
                                        boxShadow: focusedInput === 'notes' ? '0 0 20px rgba(139, 92, 246, 0.15)' : 'none'
                                    }}
                                    placeholder="Any additional medical information, allergies, current medications..."
                                />
                                <label
                                    htmlFor="other_medical_history"
                                    className="absolute left-4 -top-2.5 px-2 text-xs font-medium"
                                    style={{
                                        color: focusedInput === 'notes' ? '#8b5cf6' : '#6b7280',
                                        background: 'white'
                                    }}
                                >
                                    Additional Notes (Optional)
                                </label>
                            </div>
                        </div>
                    </div>


                    <div
                        className="mt-8 flex items-center justify-between"
                        style={{ animation: 'slideIn 0.5s ease-out 0.3s both' }}
                    >
                        {currentStep > 1 ? (
                            <button
                                type="button"
                                onClick={() => setCurrentStep(prev => prev - 1)}
                                className="flex items-center gap-2 px-6 py-3.5 rounded-xl font-semibold transition-all duration-300"
                                style={{
                                    background: 'white',
                                    border: '2px solid #e5e7eb',
                                    color: '#6b7280'
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.borderColor = '#0891b2';
                                    e.currentTarget.style.color = '#0891b2';
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.borderColor = '#e5e7eb';
                                    e.currentTarget.style.color = '#6b7280';
                                }}
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
                                </svg>
                                Previous
                            </button>
                        ) : (
                            <div />
                        )}

                        {currentStep < 3 ? (
                            <button
                                type="button"
                                onClick={() => canProceed(currentStep) && setCurrentStep(prev => prev + 1)}
                                disabled={!canProceed(currentStep)}
                                className="flex items-center gap-2 px-8 py-3.5 rounded-xl font-semibold text-white transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed group"
                                style={{
                                    background: 'linear-gradient(135deg, #22d3ee, #3b82f6)',
                                    boxShadow: canProceed(currentStep) ? '0 10px 30px rgba(6, 182, 212, 0.3)' : 'none'
                                }}
                                onMouseEnter={(e) => {
                                    if (canProceed(currentStep)) {
                                        e.currentTarget.style.transform = 'translateY(-2px)';
                                        e.currentTarget.style.boxShadow = '0 15px 40px rgba(6, 182, 212, 0.4)';
                                    }
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.transform = 'translateY(0)';
                                    e.currentTarget.style.boxShadow = canProceed(currentStep) ? '0 10px 30px rgba(6, 182, 212, 0.3)' : 'none';
                                }}
                            >
                                Next Step
                                <svg className="w-5 h-5 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                                </svg>
                            </button>
                        ) : (
                            <button
                                type="button"
                                onClick={handleSubmit}
                                disabled={loading || showSuccess}
                                className="flex items-center gap-2 px-10 py-4 rounded-xl font-bold text-white transition-all duration-300 disabled:opacity-70 disabled:cursor-not-allowed relative overflow-hidden group"
                                style={{
                                    background: showSuccess
                                        ? 'linear-gradient(135deg, #10b981, #059669)'
                                        : 'linear-gradient(135deg, #22d3ee 0%, #06b6d4 25%, #3b82f6 50%, #06b6d4 75%, #22d3ee 100%)',
                                    backgroundSize: '200% 200%',
                                    boxShadow: '0 10px 30px rgba(6, 182, 212, 0.4)',
                                    animation: !loading && !showSuccess ? 'gradientShift 3s ease infinite' : 'none'
                                }}
                                onMouseEnter={(e) => {
                                    if (!loading && !showSuccess) {
                                        e.currentTarget.style.transform = 'translateY(-3px) scale(1.02)';
                                        e.currentTarget.style.boxShadow = '0 15px 40px rgba(6, 182, 212, 0.5)';
                                    }
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.transform = 'translateY(0) scale(1)';
                                    e.currentTarget.style.boxShadow = '0 10px 30px rgba(6, 182, 212, 0.4)';
                                }}
                            >
                                {loading ? (
                                    <>
                                        <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                        </svg>
                                        <span>Registering...</span>
                                    </>
                                ) : showSuccess ? (
                                    <>
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                                        </svg>
                                        <span>Registered!</span>
                                    </>
                                ) : (
                                    <>
                                        <span>Register Patient</span>
                                        <svg className="w-5 h-5 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                                        </svg>
                                    </>
                                )}
                            </button>
                        )}
                    </div>
                </form>
            </div>


            <style>{`
                @keyframes floatBg {
                    0%, 100% { transform: translate(0, 0) scale(1); }
                    25% { transform: translate(15px, -15px) scale(1.03); }
                    50% { transform: translate(-10px, 10px) scale(0.97); }
                    75% { transform: translate(-15px, -10px) scale(1.02); }
                }
                
                @keyframes slideIn {
                    from {
                        opacity: 0;
                        transform: translateY(20px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }
                
                @keyframes fadeInUp {
                    from {
                        opacity: 0;
                        transform: translateY(30px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }
                
                @keyframes gradientShift {
                    0% { background-position: 0% 50%; }
                    50% { background-position: 100% 50%; }
                    100% { background-position: 0% 50%; }
                }
                
                @keyframes shake {
                    0%, 100% { transform: translateX(0); }
                    10%, 30%, 50%, 70%, 90% { transform: translateX(-5px); }
                    20%, 40%, 60%, 80% { transform: translateX(5px); }
                }
            `}</style>
        </div>
    );
};

export default RegistrationForm;
