import { API_BASE } from '../config';
import React, { useState } from 'react';

interface LoginProps {
    onLogin: (token: string, role: string, username: string) => void;
}

type AuthMode = 'login' | 'register';
type UserRole = 'doctor' | 'patient';

const Login: React.FC<LoginProps> = ({ onLogin }) => {
    const [mode, setMode] = useState<AuthMode>('login');
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [selectedRole, setSelectedRole] = useState<UserRole>('patient');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [focusedInput, setFocusedInput] = useState<string | null>(null);
    const [fieldErrors, setFieldErrors] = useState<{ username?: string; password?: string; confirmPassword?: string }>({});

    const validateField = (field: string, value: string): string | undefined => {
        switch (field) {
            case 'username':
                if (!value.trim()) return 'Username is required';
                if (value.length < 3) return 'Username must be at least 3 characters';
                if (!/^[a-zA-Z0-9_]+$/.test(value)) return 'Username can only contain letters, numbers, and underscores';
                return undefined;
            case 'password':
                if (!value) return 'Password is required';
                if (value.length < 4) return 'Password must be at least 4 characters';
                return undefined;
            case 'confirmPassword':
                if (mode === 'register') {
                    if (!value) return 'Please confirm your password';
                    if (value !== password) return 'Passwords do not match';
                }
                return undefined;
            default:
                return undefined;
        }
    };

    const handleFieldBlur = (field: string, value: string) => {
        const error = validateField(field, value);
        setFieldErrors(prev => ({ ...prev, [field]: error }));
        setFocusedInput(null);
    };

    const validateAllFields = (): boolean => {
        const errors: { username?: string; password?: string; confirmPassword?: string } = {};
        errors.username = validateField('username', username);
        errors.password = validateField('password', password);
        if (mode === 'register') {
            errors.confirmPassword = validateField('confirmPassword', confirmPassword);
        }
        setFieldErrors(errors);
        return !errors.username && !errors.password && (mode === 'login' || !errors.confirmPassword);
    };


    const roles = [
        {
            value: 'doctor' as UserRole,
            label: 'Doctor',
            desc: 'Medical practitioner',
            icon: (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
            ),
            gradient: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)'
        },
        {
            value: 'patient' as UserRole,
            label: 'Patient',
            desc: 'Patient access',
            icon: (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
            ),
            gradient: 'linear-gradient(135deg, #22d3ee 0%, #06b6d4 100%)'
        }
    ];

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (!validateAllFields()) {
            return;
        }

        setLoading(true);

        try {
            if (mode === 'register') {
                const registerResponse = await fetch(`${API_BASE}/register`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ username, password, role: selectedRole }),
                });

                if (!registerResponse.ok) {
                    const data = await registerResponse.json();
                    throw new Error(data.detail || 'Registration failed');
                }
            }

            const formData = new FormData();
            formData.append('username', username);
            formData.append('password', password);

            const response = await fetch(`${API_BASE}/token`, {
                method: 'POST',
                body: formData,
            });

            if (!response.ok) {
                throw new Error('Invalid credentials');
            }

            const data = await response.json();
            onLogin(data.access_token, data.role, username);
        } catch (err: any) {
            setError(err.message || 'Authentication failed');
        } finally {
            setLoading(false);
        }
    };

    const isLabelFloating = (field: string, value: string) => {
        return focusedInput === field || value.length > 0;
    };

    const switchMode = () => {
        setMode(mode === 'login' ? 'register' : 'login');
        setError('');
        setConfirmPassword('');
        setFieldErrors({});
    };

    return (
        <div
            className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden"
            style={{
                background: 'linear-gradient(135deg, #0a1628 0%, #0f2847 25%, #0d3a5c 50%, #0f2847 75%, #0a1628 100%)'
            }}
        >

            <div className="absolute inset-0 overflow-hidden">
                <div
                    className="absolute w-[600px] h-[600px] rounded-full blur-3xl"
                    style={{
                        background: 'radial-gradient(circle, rgba(6, 182, 212, 0.25) 0%, rgba(6, 182, 212, 0) 70%)',
                        top: '-20%',
                        right: '-15%',
                        animation: 'floatOrb 8s ease-in-out infinite'
                    }}
                />
                <div
                    className="absolute w-[500px] h-[500px] rounded-full blur-3xl"
                    style={{
                        background: 'radial-gradient(circle, rgba(59, 130, 246, 0.2) 0%, rgba(59, 130, 246, 0) 70%)',
                        bottom: '-15%',
                        left: '-10%',
                        animation: 'floatOrb 10s ease-in-out infinite reverse'
                    }}
                />
                <div
                    className="absolute w-[350px] h-[350px] rounded-full blur-3xl"
                    style={{
                        background: 'radial-gradient(circle, rgba(139, 92, 246, 0.15) 0%, rgba(139, 92, 246, 0) 70%)',
                        top: '40%',
                        left: '20%',
                        animation: 'floatOrb 12s ease-in-out infinite'
                    }}
                />
                <svg className="absolute bottom-0 left-0 w-full opacity-10" viewBox="0 0 1440 320" preserveAspectRatio="none" style={{ height: '200px' }}>
                    <path
                        fill="url(#waveGradient)"
                        d="M0,192L48,197.3C96,203,192,213,288,229.3C384,245,480,267,576,250.7C672,235,768,181,864,181.3C960,181,1056,235,1152,234.7C1248,235,1344,181,1392,154.7L1440,128L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"
                        style={{ animation: 'waveMove 15s linear infinite' }}
                    />
                    <defs>
                        <linearGradient id="waveGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                            <stop offset="0%" stopColor="#06b6d4" />
                            <stop offset="50%" stopColor="#3b82f6" />
                            <stop offset="100%" stopColor="#06b6d4" />
                        </linearGradient>
                    </defs>
                </svg>
                <div
                    className="absolute inset-0"
                    style={{
                        backgroundImage: `radial-gradient(circle at 1px 1px, rgba(255,255,255,0.08) 1px, transparent 0)`,
                        backgroundSize: '50px 50px'
                    }}
                />
            </div>


            <div className="relative z-10 w-full max-w-md">

                <div className="text-center mb-8" style={{ animation: 'fadeInUp 0.6s ease-out' }}>
                    <div className="relative inline-block mb-6">
                        <div
                            className="w-24 h-24 rounded-3xl flex items-center justify-center shadow-2xl"
                            style={{
                                background: 'linear-gradient(135deg, #22d3ee 0%, #06b6d4 50%, #3b82f6 100%)',
                                boxShadow: '0 25px 60px rgba(6, 182, 212, 0.5), 0 0 40px rgba(6, 182, 212, 0.3)',
                                animation: 'pulse-glow 3s ease-in-out infinite'
                            }}
                        >
                            <svg className="w-12 h-12 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                                <circle cx="12" cy="12" r="3" fill="currentColor" opacity="0.3" />
                            </svg>
                        </div>
                        <div
                            className="absolute inset-0 rounded-3xl"
                            style={{
                                border: '2px solid rgba(6, 182, 212, 0.4)',
                                animation: 'pulseRing 2s ease-out infinite'
                            }}
                        />
                    </div>

                    <h1
                        className="text-5xl font-bold mb-3 bg-clip-text text-transparent"
                        style={{
                            backgroundImage: 'linear-gradient(135deg, #ffffff 0%, #a5f3fc 50%, #67e8f9 100%)',
                            fontFamily: "'Plus Jakarta Sans', sans-serif",
                            letterSpacing: '-0.02em'
                        }}
                    >
                        MedPred
                    </h1>

                </div>


                <div
                    className="rounded-3xl p-8 relative overflow-hidden"
                    style={{
                        background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.12) 0%, rgba(255, 255, 255, 0.05) 100%)',
                        backdropFilter: 'blur(24px)',
                        WebkitBackdropFilter: 'blur(24px)',
                        border: '1px solid rgba(255, 255, 255, 0.15)',
                        boxShadow: '0 32px 64px -12px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
                        animation: 'fadeInUp 0.6s ease-out 0.2s both'
                    }}
                >

                    <div
                        className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-1 rounded-full"
                        style={{
                            background: 'linear-gradient(90deg, transparent, rgba(6, 182, 212, 0.6), transparent)'
                        }}
                    />


                    <div className="flex mb-6 p-1 rounded-xl" style={{ background: 'rgba(255, 255, 255, 0.08)' }}>
                        <button
                            type="button"
                            onClick={() => setMode('login')}
                            className="flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all duration-300"
                            style={{
                                background: mode === 'login' ? 'linear-gradient(135deg, #22d3ee, #3b82f6)' : 'transparent',
                                color: mode === 'login' ? '#ffffff' : 'rgba(255, 255, 255, 0.6)',
                                boxShadow: mode === 'login' ? '0 4px 15px rgba(6, 182, 212, 0.3)' : 'none'
                            }}
                        >
                            Sign In
                        </button>
                        <button
                            type="button"
                            onClick={() => setMode('register')}
                            className="flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all duration-300"
                            style={{
                                background: mode === 'register' ? 'linear-gradient(135deg, #22d3ee, #3b82f6)' : 'transparent',
                                color: mode === 'register' ? '#ffffff' : 'rgba(255, 255, 255, 0.6)',
                                boxShadow: mode === 'register' ? '0 4px 15px rgba(6, 182, 212, 0.3)' : 'none'
                            }}
                        >
                            Register
                        </button>
                    </div>


                    {error && (
                        <div
                            className="mb-6 px-4 py-4 rounded-2xl text-sm font-medium flex items-center gap-3"
                            style={{
                                background: 'rgba(244, 63, 94, 0.15)',
                                border: '1px solid rgba(244, 63, 94, 0.3)',
                                color: '#fb7185',
                                animation: 'shake 0.5s ease-in-out'
                            }}
                        >
                            <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-5">

                        {mode === 'register' && (
                            <div className="mb-2">
                                <label className="block text-sm font-medium mb-3" style={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                                    Select Your Role
                                </label>
                                <div className="grid grid-cols-3 gap-3">
                                    {roles.map((role) => (
                                        <button
                                            key={role.value}
                                            type="button"
                                            onClick={() => setSelectedRole(role.value)}
                                            className="p-3 rounded-xl transition-all duration-300 flex flex-col items-center gap-2"
                                            style={{
                                                background: selectedRole === role.value
                                                    ? 'rgba(255, 255, 255, 0.15)'
                                                    : 'rgba(255, 255, 255, 0.05)',
                                                border: selectedRole === role.value
                                                    ? '2px solid rgba(34, 211, 238, 0.8)'
                                                    : '2px solid rgba(255, 255, 255, 0.1)',
                                                boxShadow: selectedRole === role.value
                                                    ? '0 0 20px rgba(6, 182, 212, 0.3)'
                                                    : 'none',
                                                transform: selectedRole === role.value ? 'scale(1.02)' : 'scale(1)'
                                            }}
                                        >
                                            <div
                                                className="w-10 h-10 rounded-xl flex items-center justify-center text-white"
                                                style={{ background: role.gradient }}
                                            >
                                                {role.icon}
                                            </div>
                                            <span
                                                className="text-xs font-semibold"
                                                style={{ color: selectedRole === role.value ? '#22d3ee' : 'rgba(255, 255, 255, 0.7)' }}
                                            >
                                                {role.label}
                                            </span>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}


                        <div className="relative">
                            <div className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: fieldErrors.username ? '#f43f5e' : focusedInput === 'username' ? '#22d3ee' : 'rgba(255, 255, 255, 0.4)' }}>
                                <svg className="w-5 h-5 transition-colors duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                </svg>
                            </div>
                            <input
                                type="text"
                                id="username"
                                value={username}
                                onChange={(e) => {
                                    setUsername(e.target.value);
                                    if (fieldErrors.username) {
                                        setFieldErrors(prev => ({ ...prev, username: validateField('username', e.target.value) }));
                                    }
                                }}
                                onFocus={() => setFocusedInput('username')}
                                onBlur={(e) => handleFieldBlur('username', e.target.value)}
                                className="w-full pl-12 pr-4 py-4 rounded-2xl transition-all duration-300 text-base peer"
                                style={{
                                    background: 'rgba(255, 255, 255, 0.08)',
                                    border: fieldErrors.username ? '2px solid rgba(244, 63, 94, 0.8)' : focusedInput === 'username' ? '2px solid rgba(6, 182, 212, 0.8)' : '2px solid rgba(255, 255, 255, 0.1)',
                                    color: '#ffffff',
                                    boxShadow: fieldErrors.username ? '0 0 20px rgba(244, 63, 94, 0.2)' : focusedInput === 'username' ? '0 0 20px rgba(6, 182, 212, 0.2)' : 'none'
                                }}
                                placeholder=" "
                            />
                            <label
                                htmlFor="username"
                                className="absolute left-12 transition-all duration-300 pointer-events-none font-medium"
                                style={{
                                    top: isLabelFloating('username', username) ? '-10px' : '50%',
                                    transform: isLabelFloating('username', username) ? 'translateY(0)' : 'translateY(-50%)',
                                    fontSize: isLabelFloating('username', username) ? '12px' : '14px',
                                    color: fieldErrors.username ? '#f43f5e' : focusedInput === 'username' ? '#22d3ee' : 'rgba(255, 255, 255, 0.5)',
                                    background: isLabelFloating('username', username) ? 'linear-gradient(to bottom, transparent 50%, rgba(15, 40, 71, 1) 50%)' : 'transparent',
                                    padding: isLabelFloating('username', username) ? '0 8px' : '0'
                                }}
                            >
                                Username
                            </label>
                            {fieldErrors.username && (
                                <p className="mt-2 text-sm font-medium" style={{ color: '#f43f5e' }}>
                                    {fieldErrors.username}
                                </p>
                            )}
                        </div>


                        <div className="relative">
                            <div className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: fieldErrors.password ? '#f43f5e' : focusedInput === 'password' ? '#22d3ee' : 'rgba(255, 255, 255, 0.4)' }}>
                                <svg className="w-5 h-5 transition-colors duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                </svg>
                            </div>
                            <input
                                type={showPassword ? "text" : "password"}
                                id="password"
                                value={password}
                                onChange={(e) => {
                                    setPassword(e.target.value);
                                    if (fieldErrors.password) {
                                        setFieldErrors(prev => ({ ...prev, password: validateField('password', e.target.value) }));
                                    }
                                }}
                                onFocus={() => setFocusedInput('password')}
                                onBlur={(e) => handleFieldBlur('password', e.target.value)}
                                className="w-full pl-12 pr-12 py-4 rounded-2xl transition-all duration-300 text-base"
                                style={{
                                    background: 'rgba(255, 255, 255, 0.08)',
                                    border: fieldErrors.password ? '2px solid rgba(244, 63, 94, 0.8)' : focusedInput === 'password' ? '2px solid rgba(6, 182, 212, 0.8)' : '2px solid rgba(255, 255, 255, 0.1)',
                                    color: '#ffffff',
                                    boxShadow: fieldErrors.password ? '0 0 20px rgba(244, 63, 94, 0.2)' : focusedInput === 'password' ? '0 0 20px rgba(6, 182, 212, 0.2)' : 'none'
                                }}
                                placeholder=" "
                            />
                            <label
                                htmlFor="password"
                                className="absolute left-12 transition-all duration-300 pointer-events-none font-medium"
                                style={{
                                    top: isLabelFloating('password', password) ? '-10px' : '50%',
                                    transform: isLabelFloating('password', password) ? 'translateY(0)' : 'translateY(-50%)',
                                    fontSize: isLabelFloating('password', password) ? '12px' : '14px',
                                    color: fieldErrors.password ? '#f43f5e' : focusedInput === 'password' ? '#22d3ee' : 'rgba(255, 255, 255, 0.5)',
                                    background: isLabelFloating('password', password) ? 'linear-gradient(to bottom, transparent 50%, rgba(15, 40, 71, 1) 50%)' : 'transparent',
                                    padding: isLabelFloating('password', password) ? '0 8px' : '0'
                                }}
                            >
                                Password
                            </label>
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-4 top-1/2 -translate-y-1/2 p-1 rounded-lg transition-all duration-300 hover:bg-white/10"
                                style={{ color: 'rgba(255, 255, 255, 0.5)' }}
                            >
                                {showPassword ? (
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                                    </svg>
                                ) : (
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                    </svg>
                                )}
                            </button>
                            {fieldErrors.password && (
                                <p className="mt-2 text-sm font-medium" style={{ color: '#f43f5e' }}>
                                    {fieldErrors.password}
                                </p>
                            )}
                        </div>


                        {mode === 'register' && (
                            <div className="relative">
                                <div className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: fieldErrors.confirmPassword ? '#f43f5e' : focusedInput === 'confirmPassword' ? '#22d3ee' : 'rgba(255, 255, 255, 0.4)' }}>
                                    <svg className="w-5 h-5 transition-colors duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                                    </svg>
                                </div>
                                <input
                                    type={showPassword ? "text" : "password"}
                                    id="confirmPassword"
                                    value={confirmPassword}
                                    onChange={(e) => {
                                        setConfirmPassword(e.target.value);
                                        if (fieldErrors.confirmPassword) {
                                            setFieldErrors(prev => ({ ...prev, confirmPassword: validateField('confirmPassword', e.target.value) }));
                                        }
                                    }}
                                    onFocus={() => setFocusedInput('confirmPassword')}
                                    onBlur={(e) => handleFieldBlur('confirmPassword', e.target.value)}
                                    className="w-full pl-12 pr-4 py-4 rounded-2xl transition-all duration-300 text-base"
                                    style={{
                                        background: 'rgba(255, 255, 255, 0.08)',
                                        border: fieldErrors.confirmPassword ? '2px solid rgba(244, 63, 94, 0.8)' : focusedInput === 'confirmPassword' ? '2px solid rgba(6, 182, 212, 0.8)' : '2px solid rgba(255, 255, 255, 0.1)',
                                        color: '#ffffff',
                                        boxShadow: fieldErrors.confirmPassword ? '0 0 20px rgba(244, 63, 94, 0.2)' : focusedInput === 'confirmPassword' ? '0 0 20px rgba(6, 182, 212, 0.2)' : 'none'
                                    }}
                                    placeholder=" "
                                />
                                <label
                                    htmlFor="confirmPassword"
                                    className="absolute left-12 transition-all duration-300 pointer-events-none font-medium"
                                    style={{
                                        top: isLabelFloating('confirmPassword', confirmPassword) ? '-10px' : '50%',
                                        transform: isLabelFloating('confirmPassword', confirmPassword) ? 'translateY(0)' : 'translateY(-50%)',
                                        fontSize: isLabelFloating('confirmPassword', confirmPassword) ? '12px' : '14px',
                                        color: fieldErrors.confirmPassword ? '#f43f5e' : focusedInput === 'confirmPassword' ? '#22d3ee' : 'rgba(255, 255, 255, 0.5)',
                                        background: isLabelFloating('confirmPassword', confirmPassword) ? 'linear-gradient(to bottom, transparent 50%, rgba(15, 40, 71, 1) 50%)' : 'transparent',
                                        padding: isLabelFloating('confirmPassword', confirmPassword) ? '0 8px' : '0'
                                    }}
                                >
                                    Confirm Password
                                </label>
                                {fieldErrors.confirmPassword && (
                                    <p className="mt-2 text-sm font-medium" style={{ color: '#f43f5e' }}>
                                        {fieldErrors.confirmPassword}
                                    </p>
                                )}
                            </div>
                        )}


                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-4 rounded-2xl font-bold text-white text-base transition-all duration-300 relative overflow-hidden group disabled:opacity-60 disabled:cursor-not-allowed"
                            style={{
                                background: 'linear-gradient(135deg, #22d3ee 0%, #06b6d4 25%, #3b82f6 50%, #06b6d4 75%, #22d3ee 100%)',
                                backgroundSize: '200% 200%',
                                boxShadow: '0 15px 35px rgba(6, 182, 212, 0.4)',
                                animation: loading ? 'none' : 'gradientShift 3s ease infinite'
                            }}
                            onMouseEnter={(e) => {
                                if (!loading) {
                                    e.currentTarget.style.transform = 'translateY(-3px) scale(1.01)';
                                    e.currentTarget.style.boxShadow = '0 20px 45px rgba(6, 182, 212, 0.5)';
                                }
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.transform = 'translateY(0) scale(1)';
                                e.currentTarget.style.boxShadow = '0 15px 35px rgba(6, 182, 212, 0.4)';
                            }}
                        >
                            <div
                                className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                                style={{
                                    background: 'linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent)',
                                    transform: 'translateX(-100%)',
                                    animation: 'shine 2s ease infinite'
                                }}
                            />
                            <span className="relative z-10 flex items-center justify-center gap-3">
                                {loading ? (
                                    <>
                                        <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                        </svg>
                                        <span>{mode === 'register' ? 'Creating Account...' : 'Authenticating...'}</span>
                                    </>
                                ) : (
                                    <>
                                        <span>{mode === 'register' ? 'Create Account' : 'Sign In'}</span>
                                        <svg className="w-5 h-5 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                                        </svg>
                                    </>
                                )}
                            </span>
                        </button>
                    </form>


                    <div className="mt-6 text-center">
                        <button
                            type="button"
                            onClick={switchMode}
                            className="text-sm font-medium transition-all duration-300 hover:underline"
                            style={{ color: 'rgba(103, 232, 249, 0.9)' }}
                        >
                            {mode === 'login'
                                ? "Don't have an account? Register here"
                                : 'Already have an account? Sign in'}
                        </button>
                    </div>
                </div>
            </div>


            <style>{`
                @keyframes floatOrb {
                    0%, 100% { transform: translate(0, 0) scale(1); }
                    25% { transform: translate(20px, -20px) scale(1.05); }
                    50% { transform: translate(-10px, 15px) scale(0.95); }
                    75% { transform: translate(-20px, -10px) scale(1.02); }
                }
                
                @keyframes pulseRing {
                    0% { transform: scale(1); opacity: 0.6; }
                    100% { transform: scale(1.3); opacity: 0; }
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
                
                @keyframes shine {
                    0% { transform: translateX(-100%); }
                    100% { transform: translateX(100%); }
                }
                
                @keyframes shake {
                    0%, 100% { transform: translateX(0); }
                    10%, 30%, 50%, 70%, 90% { transform: translateX(-5px); }
                    20%, 40%, 60%, 80% { transform: translateX(5px); }
                }
                
                @keyframes waveMove {
                    0% { transform: translateX(0); }
                    100% { transform: translateX(-100px); }
                }
            `}</style>
        </div>
    );
};

export default Login;

