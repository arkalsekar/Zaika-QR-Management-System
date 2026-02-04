import React, { useState } from 'react';
import { supabase } from '../supabaseClient';
import { useNavigate } from 'react-router-dom';

export default function AdminLogin() {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleLogin = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            // Check against admins table
            const { data, error } = await supabase
                .from('admins')
                .select('*')
                .eq('username', username)
                .eq('password', password) // In real app, verify hash
                .single();

            if (error || !data) {
                throw new Error('Invalid credentials');
            }

            // Success
            localStorage.setItem('admin_user', JSON.stringify(data));
            navigate('/admin/dashboard');
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="login-container">
            <div className="card login-card glass animate-fade-in">
                <h2 className="text-2xl text-center mb-4">Admin Login</h2>
                <form onSubmit={handleLogin} className="flex flex-col gap-4">
                    <div>
                        <label className="text-sm mb-2 block">Username</label>
                        <input
                            type="text"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            placeholder="Enter admin username"
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
