import { API_BASE } from '../config';
import React, { useState } from 'react';

const StaffRegistration: React.FC = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [role, setRole] = useState<'admin' | 'doctor' | 'nurse'>('doctor');
    const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
    const [loading, setLoading] = useState(false);
    const [fieldErrors, setFieldErrors] = useState<{ username?: string; password?: string }>({});

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
            default:
                return undefined;
        }
    };

    const handleFieldBlur = (field: string, value: string) => {
        const error = validateField(field, value);
        setFieldErrors(prev => ({ ...prev, [field]: error }));
    };

    const validateAllFields = (): boolean => {
        const errors: { username?: string; password?: string } = {};
        errors.username = validateField('username', username);
        errors.password = validateField('password', password);
        setFieldErrors(errors);
        return !errors.username && !errors.password;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setMessage(null);

        if (!validateAllFields()) {
            return;
        }

        setLoading(true);

        try {
            const response = await fetch(`${API_BASE}/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password, role }),
            });

            if (response.ok) {
                setMessage({ text: `Staff account "${username}" created successfully!`, type: 'success' });
                setUsername('');
                setPassword('');
                setFieldErrors({});
            } else {
                const data = await response.json();
                setMessage({ text: data.detail || 'Registration failed', type: 'error' });
            }
        } catch (error) {
            setMessage({ text: 'Network error. Is the backend running?', type: 'error' });
        } finally {
            setLoading(false);
        }
    };

    const roles = [
        {
            value: 'admin',
            label: 'Administrator',
            desc: 'Full system access',
            icon: '👑',
            gradient: 'linear-gradient(135deg, var(--primary-500), var(--accent-500))'
        },
        {
            value: 'doctor',
            label: 'Doctor',
            desc: 'Patient management & diagnosis',
            icon: '👨‍⚕️',
            gradient: 'linear-gradient(135deg, var(--accent-500), var(--violet-500))'
        },
        {
            value: 'nurse',
            label: 'Nurse',
            desc: 'Patient care & data entry',
            icon: '💉',
            gradient: 'linear-gradient(135deg, var(--violet-500), var(--primary-500))'
        },
    ];

    const inputStyle = {
        background: 'var(--gray-50)',
        border: '2px solid var(--gray-200)',
        color: 'var(--gray-800)'
    };

    return (
        <div className="p-6 md:p-8">
            <div className="max-w-lg mx-auto">

                <div className="mb-8">
                    <div className="flex items-center gap-3 mb-2">
                        <div
                            className="w-10 h-10 rounded-xl flex items-center justify-center"
                            style={{
                                background: 'linear-gradient(135deg, var(--primary-500), var(--violet-500))',
                                boxShadow: '0 4px 15px rgba(59, 130, 246, 0.3)'
                            }}
                        >
                            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                            </svg>
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold" style={{ color: 'var(--gray-900)' }}>Create Staff Account</h1>
                            <p className="text-sm" style={{ color: 'var(--gray-500)' }}>Add new team members to the system</p>
                        </div>
                    </div>
                </div>


                {message && (
                    <div
                        className="mb-6 px-5 py-4 rounded-xl flex items-center gap-3"
                        style={{
                            background: message.type === 'success' ? 'var(--success-glow)' : 'var(--error-glow)',
                            border: `1px solid ${message.type === 'success' ? 'var(--success)' : 'var(--error)'}`,
                            color: message.type === 'success' ? 'var(--success)' : 'var(--error)'
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


                <form onSubmit={handleSubmit} className="glass rounded-2xl p-6 card-hover">

                    <div className="mb-6">
                        <label className="block text-sm font-semibold mb-3" style={{ color: 'var(--gray-700)' }}>
                            🎭 Select Role
                        </label>
                        <div className="space-y-3">
                            {roles.map((r) => (
                                <label
                                    key={r.value}
                                    className="flex items-center gap-4 p-4 rounded-xl cursor-pointer transition-all duration-300"
                                    style={{
                                        border: role === r.value
                                            ? '2px solid var(--primary-500)'
                                            : '2px solid var(--gray-200)',
                                        background: role === r.value
                                            ? 'var(--primary-50)'
                                            : 'var(--white)',
                                        boxShadow: role === r.value ? '0 4px 20px rgba(59, 130, 246, 0.15)' : 'none'
                                    }}
                                >
                                    <input
                                        type="radio"
                                        name="role"
                                        value={r.value}
                                        checked={role === r.value}
                                        onChange={(e) => setRole(e.target.value as any)}
                                        className="sr-only"
                                    />
                                    <div
                                        className="w-12 h-12 rounded-xl flex items-center justify-center text-xl shrink-0 shadow-lg"
                                        style={{ background: r.gradient }}
                                    >
                                        {r.icon}
                                    </div>
                                    <div className="flex-1">
                                        <p className="font-bold" style={{ color: 'var(--gray-900)' }}>{r.label}</p>
                                        <p className="text-sm" style={{ color: 'var(--gray-500)' }}>{r.desc}</p>
                                    </div>
                                    <div
                                        className="w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all duration-300"
                                        style={{
                                            borderColor: role === r.value ? 'var(--primary-500)' : 'var(--gray-300)',
                                            background: role === r.value ? 'var(--primary-500)' : 'transparent'
                                        }}
                                    >
                                        {role === r.value && (
                                            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                                            </svg>
                                        )}
                                    </div>
                                </label>
                            ))}
                        </div>
                    </div>


                    <div className="space-y-5 mb-6">
                        <div>
                            <label className="block text-sm font-semibold mb-2" style={{ color: fieldErrors.username ? 'var(--error)' : 'var(--gray-700)' }}>
                                👤 Username
                            </label>
                            <input
                                type="text"
                                value={username}
                                onChange={(e) => {
                                    setUsername(e.target.value);
                                    if (fieldErrors.username) {
                                        setFieldErrors(prev => ({ ...prev, username: validateField('username', e.target.value) }));
                                    }
                                }}
                                onBlur={() => handleFieldBlur('username', username)}
                                className="w-full px-4 py-3.5 rounded-xl transition-all duration-300"
                                style={{
                                    ...inputStyle,
                                    border: fieldErrors.username ? '2px solid var(--error)' : inputStyle.border
                                }}
                                placeholder="Enter username"
                            />
                            {fieldErrors.username && (
                                <p className="mt-2 text-sm font-medium" style={{ color: 'var(--error)' }}>
                                    {fieldErrors.username}
                                </p>
                            )}
                        </div>
                        <div>
                            <label className="block text-sm font-semibold mb-2" style={{ color: fieldErrors.password ? 'var(--error)' : 'var(--gray-700)' }}>
                                🔒 Password
                            </label>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => {
                                    setPassword(e.target.value);
                                    if (fieldErrors.password) {
                                        setFieldErrors(prev => ({ ...prev, password: validateField('password', e.target.value) }));
                                    }
                                }}
                                onBlur={() => handleFieldBlur('password', password)}
                                className="w-full px-4 py-3.5 rounded-xl transition-all duration-300"
                                style={{
                                    ...inputStyle,
                                    border: fieldErrors.password ? '2px solid var(--error)' : inputStyle.border
                                }}
                                placeholder="Enter password"
                            />
                            {fieldErrors.password && (
                                <p className="mt-2 text-sm font-medium" style={{ color: 'var(--error)' }}>
                                    {fieldErrors.password}
                                </p>
                            )}
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-4 rounded-xl font-bold text-white transition-all duration-300 disabled:opacity-50"
                        style={{
                            background: 'linear-gradient(135deg, var(--primary-500), var(--violet-500))',
                            boxShadow: '0 10px 30px rgba(59, 130, 246, 0.3)'
                        }}
                        onMouseEnter={(e) => {
                            if (!loading) {
                                e.currentTarget.style.transform = 'translateY(-2px)';
                                e.currentTarget.style.boxShadow = '0 15px 40px rgba(59, 130, 246, 0.4)';
                            }
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.transform = 'translateY(0)';
                            e.currentTarget.style.boxShadow = '0 10px 30px rgba(59, 130, 246, 0.3)';
                        }}
                    >
                        {loading ? (
                            <span className="flex items-center justify-center gap-2">
                                <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                                </svg>
                                Creating Account...
                            </span>
                        ) : '✨ Create Staff Account'}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default StaffRegistration;

