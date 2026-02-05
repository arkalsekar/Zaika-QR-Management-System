import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { LogOut, Plus, Trash2, Edit2, X, RefreshCw, QrCode, Search, Save } from 'lucide-react';
import { QRCodeCanvas } from 'qrcode.react';
import Scanner from '../components/Scanner';

export default function AdminDashboard() {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('counters'); // counters | coupons
    const [counters, setCounters] = useState([]);
    const [coupons, setCoupons] = useState([]);

    // Counter Form State
    const [editingCounterId, setEditingCounterId] = useState(null);
    const [counterForm, setCounterForm] = useState({
        counter_id: '',
        counter_name: '',
        counter_amount: '',
        allowed_amounts: '',
        counter_password: '',
        counter_email: '',
        counter_phone: '',
        counter_coordinator_name: ''
    });

    // New Coupon Form State
    const [newCoupon, setNewCoupon] = useState({
        balance: '',
        roll_no: '',
        phone: '',
        email: ''
    });

    // Update Balance State
    const [balanceSearchId, setBalanceSearchId] = useState('');
    const [showBalanceScanner, setShowBalanceScanner] = useState(false);
    const [foundCoupon, setFoundCoupon] = useState(null);
    const [updatedBalanceValue, setUpdatedBalanceValue] = useState('');

    useEffect(() => {
        const admin = localStorage.getItem('admin_user');
        if (!admin) {
            navigate('/admin/login');
            return;
        }
        fetchCounters();
        fetchCoupons();
    }, [navigate]);

    const fetchCounters = async () => {
        const { data } = await supabase.from('counters').select('*').order('created_at', { ascending: false });
        if (data) setCounters(data);
    };

    const fetchCoupons = async () => {
        const { data } = await supabase.from('coupons').select('*').order('created_at', { ascending: false });
        if (data) setCoupons(data);
    };

    const handleLogout = () => {
        localStorage.removeItem('admin_user');
        navigate('/');
    };

    const handleFormSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editingCounterId) {
                // Update Mode - using upsert (POST) to avoid CORS/PATCH issues
                const { error } = await supabase
                    .from('counters')
                    .upsert(counterForm);

                if (error) throw error;
                alert('Counter updated successfully!');
            } else {
                // Create Mode
                const { error } = await supabase
                    .from('counters')
                    .insert([counterForm]);

                if (error) throw error;
                alert('Counter created successfully!');
            }

            resetCounterForm();
            fetchCounters();
        } catch (err) {
            alert('Error: ' + err.message);
        }
    };

    const editCounter = (counter) => {
        setEditingCounterId(counter.counter_id);
        setCounterForm({
            counter_id: counter.counter_id,
            counter_name: counter.counter_name,
            counter_amount: counter.counter_amount,
            allowed_amounts: counter.allowed_amounts || '',
            counter_password: counter.counter_password,
            counter_email: counter.counter_email || '',
            counter_phone: counter.counter_phone || '',
            counter_coordinator_name: counter.counter_coordinator_name || ''
        });
        // Scroll to form
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const resetCounterForm = () => {
        setEditingCounterId(null);
        setCounterForm({
            counter_id: '', counter_name: '', counter_amount: '', allowed_amounts: '',
            counter_password: '', counter_email: '', counter_phone: '', counter_coordinator_name: ''
        });
    };

    const deleteCounter = async (id) => {
        if (!window.confirm('Are you sure?')) return;
        await supabase.from('counters').delete().eq('counter_id', id);
        fetchCounters();
    };

    const createCoupon = async (e) => {
        e.preventDefault();
        try {
            const { error } = await supabase.from('coupons').insert([{
                balance: newCoupon.balance,
                roll_no: newCoupon.roll_no,
                phone: newCoupon.phone,
                email: newCoupon.email,
                status: 'active'
            }]);

            if (error) throw error;
            alert('Coupon created!');
            setNewCoupon({ balance: '', roll_no: '', phone: '', email: '' });
            fetchCoupons();
        } catch (err) {
            alert('Error creating coupon: ' + err.message);
        }
    };

    // Update Balance Logic
    const handleBalanceScan = (code) => {
        if (code) {
            setShowBalanceScanner(false);
            setBalanceSearchId(code);
            fetchCouponForUpdate(code);
        }
    };

    const fetchCouponForUpdate = async (id) => {
        if (!id) return;
        try {
            const { data, error } = await supabase.from('coupons').select('*').eq('coupon_id', id).single();
            if (error || !data) throw new Error('Coupon not found');
            setFoundCoupon(data);
            setUpdatedBalanceValue(data.balance);
        } catch (err) {
            alert(err.message);
            setFoundCoupon(null);
        }
    };

    const updateBalance = async () => {
        if (!foundCoupon) return;
        try {
            // Using upsert to update balance to bypass potential PATCH CORS issues
            const updatedCoupon = { ...foundCoupon, balance: parseFloat(updatedBalanceValue) };

            // Also update status if balance > 0
            if (updatedCoupon.balance > 0 && updatedCoupon.status === 'used') {
                updatedCoupon.status = 'active';
            }

            const { error } = await supabase.from('coupons').upsert(updatedCoupon);

            if (error) throw error;
            alert('Balance updated!');
            setFoundCoupon(null);
            setBalanceSearchId('');
            setUpdatedBalanceValue('');
            fetchCoupons(); // Refresh list
        } catch (err) {
            alert('Error updating balance: ' + err.message);
        }
    };

    return (
        <div className="min-h-screen">
            <nav className="nav-bar">
                <div className="logo">Zaika Admin</div>
                <button onClick={handleLogout} style={{ background: 'transparent', border: '1px solid #334155' }}>
                    <LogOut size={18} /> Logout
                </button>
            </nav>

            <div className="container">
                <div className="flex gap-4 mb-8">
                    <button
                        onClick={() => setActiveTab('counters')}
                        style={{ opacity: activeTab === 'counters' ? 1 : 0.5 }}
                    >
                        Manage Counters
                    </button>
                    <button
                        onClick={() => setActiveTab('coupons')}
                        style={{ opacity: activeTab === 'coupons' ? 1 : 0.5 }}
                    >
                        Manage Coupons
                    </button>
                </div>

                {activeTab === 'counters' && (
                    <div className="animate-fade-in">
                        <div className="card mb-8">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="text-xl">{editingCounterId ? 'Edit Counter' : 'Add New Counter'}</h3>
                                {editingCounterId && (
                                    <button onClick={resetCounterForm} style={{ background: 'transparent', padding: '0.5rem' }} className="text-sm">
                                        <X size={18} /> Cancel Edit
                                    </button>
                                )}
                            </div>

                            <form onSubmit={handleFormSubmit} className="grid-cols-2">
                                {/* ID is read-only in edit mode to prevent PK conflicts */}
                                <input
                                    placeholder="Counter ID (Login ID)"
                                    value={counterForm.counter_id}
                                    onChange={e => setCounterForm({ ...counterForm, counter_id: e.target.value })}
                                    required
                                    disabled={!!editingCounterId}
                                    style={{ opacity: editingCounterId ? 0.6 : 1 }}
                                />
                                <input placeholder="Counter Name" value={counterForm.counter_name} onChange={e => setCounterForm({ ...counterForm, counter_name: e.target.value })} required />
                                <input type="number" placeholder="Default Amount" value={counterForm.counter_amount} onChange={e => setCounterForm({ ...counterForm, counter_amount: e.target.value })} required />
                                <input placeholder="Allowed Amounts (e.g. 10,20,50)" value={counterForm.allowed_amounts} onChange={e => setCounterForm({ ...counterForm, allowed_amounts: e.target.value })} />
                                <input placeholder="Password" value={counterForm.counter_password} onChange={e => setCounterForm({ ...counterForm, counter_password: e.target.value })} required />
                                <input placeholder="Coordinator Name" value={counterForm.counter_coordinator_name} onChange={e => setCounterForm({ ...counterForm, counter_coordinator_name: e.target.value })} />
                                <input placeholder="Email" value={counterForm.counter_email} onChange={e => setCounterForm({ ...counterForm, counter_email: e.target.value })} />
                                <input placeholder="Phone" value={counterForm.counter_phone} onChange={e => setCounterForm({ ...counterForm, counter_phone: e.target.value })} />

                                <button type="submit" className="flex-center gap-2" style={{ background: editingCounterId ? 'var(--color-warning)' : 'var(--color-primary)', color: editingCounterId ? '#000' : '#fff' }}>
                                    {editingCounterId ? <RefreshCw size={18} /> : <Plus size={18} />}
                                    {editingCounterId ? 'Update Counter' : 'Create Counter'}
                                </button>
                            </form>
                        </div>

                        <div className="card">
                            <h3 className="text-xl mb-4">Existing Counters</h3>
                            <div className="table-wrapper">
                                <table>
                                    <thead>
                                        <tr>
                                            <th>ID</th>
                                            <th>Name</th>
                                            <th>Default Amount</th>
                                            <th>Allowed Amounts</th>
                                            <th>Total Sales</th>
                                            <th>Coordinator</th>
                                            <th>Pass</th>
                                            <th>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {counters.map(c => (
                                            <tr key={c.counter_id} style={{ background: editingCounterId === c.counter_id ? 'rgba(255, 255, 255, 0.05)' : 'transparent' }}>
                                                <td>{c.counter_id}</td>
                                                <td>{c.counter_name}</td>
                                                <td>₹{c.counter_amount}</td>
                                                <td>{c.allowed_amounts || '-'}</td>
                                                <td style={{ color: 'var(--color-success)', fontWeight: 'bold' }}>₹{c.total_sales || 0}</td>
                                                <td>{c.counter_coordinator_name}</td>
                                                <td className="text-sm">{c.counter_password}</td>
                                                <td className="flex gap-2">
                                                    <button onClick={() => editCounter(c)} style={{ background: 'var(--color-primary)', padding: '0.5rem' }} title="Edit">
                                                        <Edit2 size={16} />
                                                    </button>
                                                    <button onClick={() => deleteCounter(c.counter_id)} style={{ background: 'var(--color-danger)', padding: '0.5rem' }} title="Delete">
                                                        <Trash2 size={16} />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'coupons' && (
                    <div className="animate-fade-in">

                        {/* Update Balance Section */}
                        <div className="card mb-8 border border-blue-500/30">
                            <h3 className="text-xl mb-4 text-blue-400">Update Coupon Balance</h3>

                            {!foundCoupon ? (
                                <div className="flex flex-col gap-4">
                                    <div className="flex gap-4">
                                        <input
                                            placeholder="Enter/Scan Coupon ID"
                                            value={balanceSearchId}
                                            onChange={(e) => setBalanceSearchId(e.target.value)}
                                            style={{ flexGrow: 1 }}
                                        />
                                        <button onClick={() => setShowBalanceScanner(true)} style={{ background: 'var(--color-warning)', color: 'black' }}>
                                            <QrCode size={20} />
                                        </button>
                                        <button onClick={() => fetchCouponForUpdate(balanceSearchId)} className="flex-center gap-2">
                                            <Search size={20} /> Find
                                        </button>
                                    </div>
                                    {showBalanceScanner && (
                                        <div className="mt-4 relative">
                                            <Scanner onScan={handleBalanceScan} />
                                            <button
                                                onClick={() => setShowBalanceScanner(false)}
                                                className="absolute top-2 right-2 p-2 bg-black/50 text-white rounded"
                                            >
                                                Close
                                            </button>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div className="bg-slate-800 p-6 rounded-lg border border-white/10">
                                    <div className="flex justify-between items-start mb-6">
                                        <div>
                                            <div className="text-sm text-slate-400">Editing Coupon</div>
                                            <div className="text-2xl font-mono text-white">{foundCoupon.coupon_id}</div>
                                            <div className="text-sm text-slate-400 mt-1">
                                                Roll: {foundCoupon.roll_no || 'N/A'} | Status: {foundCoupon.status}
                                            </div>
                                        </div>
                                        <button onClick={() => setFoundCoupon(null)} style={{ background: 'transparent' }}>
                                            <X size={20} />
                                        </button>
                                    </div>

                                    <div className="flex gap-4 items-end">
                                        <div className="flex-grow">
                                            <label className="text-sm text-slate-400 mb-1 block">New Balance (₹)</label>
                                            <input
                                                type="number"
                                                value={updatedBalanceValue}
                                                onChange={(e) => setUpdatedBalanceValue(e.target.value)}
                                                className="text-2xl font-bold text-green-400"
                                            />
                                        </div>
                                        <button
                                            onClick={updateBalance}
                                            className="flex-center gap-2"
                                            style={{ background: 'var(--color-success)', height: '50px' }}
                                        >
                                            <Save size={20} /> Update Balance
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="card mb-8">
                            <h3 className="text-xl mb-4">Issue New Coupon</h3>
                            <form onSubmit={createCoupon} className="grid-cols-2">
                                <input type="number" placeholder="Balance Amount" value={newCoupon.balance} onChange={e => setNewCoupon({ ...newCoupon, balance: e.target.value })} required />
                                <input placeholder="Student Roll No" value={newCoupon.roll_no} onChange={e => setNewCoupon({ ...newCoupon, roll_no: e.target.value })} />
                                <input placeholder="Student Phone" value={newCoupon.phone} onChange={e => setNewCoupon({ ...newCoupon, phone: e.target.value })} />
                                <input placeholder="Student Email" value={newCoupon.email} onChange={e => setNewCoupon({ ...newCoupon, email: e.target.value })} />
                                <button type="submit" className="flex-center gap-2"><Plus size={18} /> Generate Coupon</button>
                            </form>
                        </div>

                        <div className="card">
                            <h3 className="text-xl mb-4">Recent Coupons</h3>
                            <div className="grid-cols-2">
                                {coupons.map(c => (
                                    <div key={c.coupon_id} className="glass p-4 rounded-lg flex justify-between items-center" style={{ padding: '1rem' }}>
                                        <div>
                                            <div className="text-sm text-secondary">ID: {c.coupon_id.split('-')[0]}...</div>
                                            <div className="text-xl">₹{c.balance}</div>
                                            <div className={`text-sm ${c.status === 'active' ? 'text-green-500' : 'text-red-500'}`} style={{ color: c.status === 'active' ? 'var(--color-success)' : 'var(--color-danger)' }}>
                                                {c.status.toUpperCase()}
                                            </div>
                                        </div>
                                        <div className="flex-col flex-center">
                                            <QRCodeCanvas value={c.coupon_id} size={64} />
                                            <a href={`mailto:?subject=Your Coupon&body=Here is your coupon code: ${c.coupon_id}`} target="_blank" className="text-xs mt-2 text-center text-blue-400">Email</a>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
