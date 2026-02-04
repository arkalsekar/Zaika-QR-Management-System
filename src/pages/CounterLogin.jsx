import React, { useState } from 'react';
import { supabase } from '../supabaseClient';
import { useNavigate } from 'react-router-dom';

export default function CounterLogin() {
    const [counterId, setCounterId] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleLogin = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const { data, error } = await supabase
                .from('counters')
                .select('*')
                .eq('counter_id', counterId)
                .eq('counter_password', password)
                .single();

            if (error || !data) {
                throw new Error('Invalid Counter ID or Password');
            }

            localStorage.setItem('counter_user', JSON.stringify(data));
            navigate('/counter/dashboard');
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="login-container">
            <div className="card login-card glass animate-fade-in">
                <h2 className="text-xl text-center mb-4">Counter Login</h2>
                <form onSubmit={handleLogin} className="flex flex-col gap-4">
                    <div>
                        <label className="text-sm mb-2 block">Counter ID</label>
                        <input
                            value={counterId}
                            onChange={(e) => setCounterId(e.target.value)}
                            placeholder="Enter Counter ID"
                            required
                        />
                    </div>
                    <div>
                        <label className="text-sm mb-2 block">Password</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="Enter password"
                            required
                        />
                    </div>
                    {error && <div className="text-sm" style={{ color: 'var(--color-red-500)' }}>{error}</div>}
                    <button type="submit" disabled={loading}>
                        {loading ? 'Logging in...' : 'Login'}
                    </button>
                </form>
            </div>
        </div>
    );
}
