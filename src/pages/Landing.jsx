import React from 'react';
import { Link } from 'react-router-dom';

export default function Landing() {
    return (
        <div className="login-container flex-col gap-8">
            <div className="text-center animate-fade-in">
                <h1 className="text-3xl mb-2" style={{ color: 'var(--color-primary)' }}>Bonhomie 2026</h1>
                <h2 className="text-xl text-secondary">Zaika Food Coupon System</h2>
            </div>

            <div className="flex gap-8 animate-fade-in landing-cards" style={{ animationDelay: '0.1s' }}>
                <Link to="/counter/login" className="card glass hover:scale-105 transition-transform cursor-pointer flex-center flex-col gap-4 landing-card" style={{ textDecoration: 'none' }}>
                    <div className="text-4xl">🏪</div>
                    <div className="text-xl font-bold text-white">Counter Login</div>
                </Link>

                <Link to="/admin/login" className="card glass hover:scale-105 transition-transform cursor-pointer flex-center flex-col gap-4 landing-card" style={{ textDecoration: 'none' }}>
                    <div className="text-4xl">🛡️</div>
                    <div className="text-xl font-bold text-white">Admin Login</div>
                </Link>
            </div>
        </div>
    );
}
