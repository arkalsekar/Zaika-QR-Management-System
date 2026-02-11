import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import Scanner from '../components/Scanner';
import { LogOut, RefreshCw, QrCode, CheckCircle } from 'lucide-react';

export default function CounterDashboard() {
    const navigate = useNavigate();
    const [counter, setCounter] = useState(null);

    // Transaction State
    const [manualCouponId, setManualCouponId] = useState('');
    const [selectedAmount, setSelectedAmount] = useState('');
    const [amountOptions, setAmountOptions] = useState([]);

    // UI State
    const [showScanner, setShowScanner] = useState(false);
    const [message, setMessage] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);
    const [lastSuccess, setLastSuccess] = useState(null);

    useEffect(() => {
        const user = localStorage.getItem('counter_user');
        if (!user) {
            navigate('/counter/login');
            return;
        }
        const parsedUser = JSON.parse(user);
        setCounter(parsedUser);

        // Parse allowed amounts
        if (parsedUser.allowed_amounts) {
            const opts = parsedUser.allowed_amounts.split(',').map(s => s.trim()).filter(Boolean);
            setAmountOptions(opts);
            if (opts.length > 0) setSelectedAmount(opts[0]);
        } else {
            setSelectedAmount(parsedUser.counter_amount);
        }
    }, [navigate]);

    const handleScan = (code) => {
        if (code) {
            setManualCouponId(code);
            setShowScanner(false);
            setMessage('QR Code scanned !');
        }
    };

    const handleDeduct = async () => {
        if (!manualCouponId || !selectedAmount) {
            setMessage('Please enter Coupon ID and verify Amount');
            return;
        }

        setIsProcessing(true);
        setMessage('Processing...');
        setLastSuccess(null);

        try {
            const couponId = manualCouponId.trim();
            const deductAmount = parseFloat(selectedAmount);

            // 1. Fetch Coupon
            const { data: coupon, error } = await supabase
                .from('coupons')
                .select('*')
                .eq('coupon_id', couponId)
                .single();

            if (error || !coupon) {
                throw new Error('Coupon not found');
            }

            if (coupon.status === 'expired') {
                throw new Error('Coupon Expired');
            }

            const couponBalance = parseFloat(coupon.balance);

            if (deductAmount <= couponBalance) {
                // Success Case
                const newBalance = couponBalance - deductAmount;
                const newStatus = newBalance === 0 ? 'used' : 'active';

                const newLog = {
                    counter_id: counter.counter_id,
                    amount: deductAmount,
                    timestamp: new Date().toISOString()
                };

                const currentLogs = coupon.counter_logs || [];
                const newLogs = [...currentLogs, newLog];

                const { error: updateError } = await supabase
                    .from('coupons')
                    .update({
                        balance: newBalance,
                        status: newStatus,
                        counter_logs: newLogs,
                        used_at: [...(coupon.used_at || []), newLog]
                    })
                    .eq('coupon_id', couponId);

                if (updateError) throw updateError;

                // 2. Update Counter Sales (Best Effort)
                try {
                    // Fetch FULL counter object to safely perform an upsert (which replaces the row)
                    // avoiding PATCH requests which are currently blocked by CORS/RLS issues
                    const { data: currentCounter } = await supabase
                        .from('counters')
                        .select('*')
                        .eq('counter_id', counter.counter_id)
                        .single();

                    if (currentCounter) {
                        const currentSales = parseFloat(currentCounter.total_sales || 0);
                        const newSales = currentSales + deductAmount;

                        // Use upsert (POST) instead of update (PATCH)
                        await supabase.from('counters')
                            .upsert({
                                ...currentCounter,
                                total_sales: newSales
                            });
                    }

                } catch (salesErr) {
                    console.error("Failed to update sales tracking", salesErr);
                }

                setLastSuccess({
                    amount: deductAmount,
                    remaining: newBalance,
                    id: couponId
                });
                setMessage('');
                setManualCouponId(''); // Reset input on success
            } else {
                setMessage(`Insufficient Balance! Available: ₹${couponBalance}`);
            }

        } catch (err) {
            setMessage(`Error: ${err.message}`);
        } finally {
            setIsProcessing(false);
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('counter_user');
        navigate('/');
    };

    const resetFlow = () => {
        setManualCouponId('');
        setMessage('');
        setLastSuccess(null);
    };

    if (!counter) return null;

    return (
        <div className="min-h-screen flex flex-col" style={{ background: 'var(--color-bg-primary)' }}>
            <nav className="nav-bar">
                <div className="counter-nav-info">
                    <div className="logo" style={{ fontSize: '1.2rem', padding: 0 }}>{counter.counter_name}</div>
                    <div className="text-sm">Coord: {counter.counter_coordinator_name}</div>
                </div>
                <button onClick={handleLogout} className="logout-btn" style={{ background: 'transparent', border: '1px solid #334155' }}>
                    <LogOut size={18} />
                </button>
            </nav>

            <div className="container flex-col flex-center flex-grow counter-main" style={{ gap: '1.5rem', justifyContent: 'flex-start', marginTop: '2rem' }}>

                {/* Amount Selection */}
                <div className="card w-full max-w-md">
                    <label className="text-sm mb-2 block" style={{ textTransform: 'uppercase', letterSpacing: '0.05em' }}>Deduction Amount</label>
                    {amountOptions.length > 0 ? (
                        <select
                            style={{ fontSize: '1.25rem', padding: '1rem' }}
                            value={selectedAmount}
                            onChange={(e) => setSelectedAmount(e.target.value)}
                        >
                            {amountOptions.map(amt => (
                                <option key={amt} value={amt}>₹{amt}</option>
                            ))}
                        </select>
                    ) : (
                        <div className="text-3xl" style={{ color: 'var(--color-warning)', fontWeight: 'bold' }}>₹{selectedAmount}</div>
                    )}
                </div>

                {/* Input Section */}
                <div className="card w-full max-w-md flex-col gap-4">

                    {!showScanner ? (
                        <>
                            <div className="flex gap-4">
                                <input
                                    style={{ flexGrow: 1, fontFamily: 'monospace' }}
                                    placeholder="Enter Coupon ID"
                                    value={manualCouponId}
                                    onChange={(e) => setManualCouponId(e.target.value)}
                                />
                                <button
                                    onClick={() => setShowScanner(true)}
                                    style={{ background: 'var(--color-primary)', width: 'auto' }}
                                >
                                    <QrCode size={24} />
                                </button>
                            </div>

                            <p className="text-sm" style={{ textAlign: 'center', margin: '0.5rem 0' }}>or scan QR code to autofill</p>

                            <button
                                onClick={handleDeduct}
                                disabled={isProcessing || !manualCouponId}
                                className="w-full text-xl"
                                style={{
                                    background: 'var(--color-warning)',
                                    color: '#000',
                                    padding: '1rem',
                                    fontWeight: 'bold',
                                    marginTop: '1rem'
                                }}
                            >
                                {isProcessing ? 'Processing...' : 'CONFIRM DEDUCTION'}
                            </button>
                        </>
                    ) : (
                        <div style={{ position: 'relative' }}>
                            <div style={{ overflow: 'hidden', borderRadius: 'var(--radius-md)', border: '2px solid var(--color-warning)' }}>
                                <Scanner onScan={handleScan} />
                            </div>
                            <button
                                onClick={() => setShowScanner(false)}
                                className="mt-4 w-full"
                                style={{ background: 'var(--color-bg-secondary)' }}
                            >
                                Close Scanner
                            </button>
                        </div>
                    )}

                    {message && (
                        <div style={{
                            padding: '1rem',
                            borderRadius: 'var(--radius-md)',
                            marginTop: '1rem',
                            textAlign: 'center',
                            background: message.includes('Error') || message.includes('Insufficient') ? 'rgba(239, 68, 68, 0.2)' : 'rgba(59, 130, 246, 0.2)',
                            color: message.includes('Error') || message.includes('Insufficient') ? 'var(--color-danger)' : 'var(--color-text-accent)'
                        }}>
                            {message}
                        </div>
                    )}
                </div>

                {/* Success Prompt Overlay */}
                {lastSuccess && (
                    <div className="success-overlay animate-fade-in" style={{
                        position: 'fixed', inset: 0, zIndex: 1000,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(5px)'
                    }}>
                        <div className="card success-card" style={{ textAlign: 'center', border: '1px solid var(--color-success)' }}>
                            <div style={{ color: 'var(--color-success)', marginBottom: '1rem', display: 'flex', justifyContent: 'center' }}>
                                <CheckCircle size={64} />
                            </div>
                            <h2 className="text-2xl mb-2">Payment Successful!</h2>
                            <div style={{ background: 'var(--color-bg-secondary)', padding: '1.5rem', borderRadius: 'var(--radius-md)', marginBottom: '1.5rem' }}>
                                <div className="text-sm">Deducted</div>
                                <div className="text-3xl" style={{ color: 'var(--color-warning)', fontWeight: 'bold' }}>₹{lastSuccess.amount}</div>
                                <div style={{ height: '1px', background: 'rgba(255,255,255,0.1)', margin: '1rem 0' }}></div>
                                <div className="flex justify-between text-sm" style={{ marginBottom: '0.5rem' }}>
                                    <span>ID</span>
                                    <span style={{ fontFamily: 'monospace' }}>{lastSuccess.id.split('-')[0]}...</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span>Remaining</span>
                                    <span style={{ color: 'var(--color-success)', fontWeight: 'bold' }}>₹{lastSuccess.remaining}</span>
                                </div>
                            </div>
                            <button
                                onClick={resetFlow}
                                className="w-full"
                                style={{ background: 'var(--color-success)', padding: '1rem', fontSize: '1.1rem' }}
                            >
                                Done
                            </button>
                        </div>
                    </div>
                )}

            </div>
        </div>
    );
}
