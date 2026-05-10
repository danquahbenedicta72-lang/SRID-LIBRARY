import React, { useState, useEffect, useRef } from 'react';
import {
  Users,
  Clock,
  BarChart3,
  PlusCircle,
  Search,
  LogOut,
  LogIn,
  CheckCircle2,
  AlertCircle,
  BookOpen,
  Library,
  QrCode,
  Smartphone,
  Bell,
  ChevronLeft,
  GraduationCap,
  Building2,
  Phone,
  X,
  Upload,
  Trash2,
  Settings,
  AlertTriangle
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend
} from 'recharts';
import { format } from 'date-fns';
import { QRCodeSVG } from 'qrcode.react';
import Papa from 'papaparse';
import { Student, AttendanceRecord, UserRole, StudentStatus } from './types';
import { PROGRAMMES, YEARS, HALLS } from './constants';

// Shared Components
const Navbar = ({ activeTab, setActiveTab }: { activeTab: string, setActiveTab: (tab: string) => void }) => (
  <nav className="bg-[#141414] text-white p-4 flex justify-between items-center border-b border-[#2a2a2a] sticky top-0 z-50">
    <div className="flex items-center gap-2">
      <Building2 className="w-6 h-6 text-emerald-500" />
      <div className="flex items-center gap-3">
        <img
          src="https://upload.wikimedia.org/wikipedia/en/thumb/e/ef/UMa_logo.png/220px-UMa_logo.png"
          alt="UMaT Logo"
          className="w-10 h-10 object-contain"
        />
        <span className="font-bold text-xl tracking-tight">UMaT-SRID <span className="text-emerald-500">LIBRARY</span></span>
      </div>
    </div>
    <div className="flex gap-1">
      {[
        { id: 'attendance', label: 'Attendance', icon: Clock },
        { id: 'students', label: 'Students', icon: Users },
        { id: 'guests', label: 'Guests', icon: Users },
        { id: 'qr', label: 'QR Center', icon: QrCode },
        { id: 'analytics', label: 'Analytics', icon: BarChart3 },
      ].map((tab) => (

        <button
          key={tab.id}
          id={`nav-${tab.id}`}
          onClick={() => setActiveTab(tab.id)}
          className={`px-4 py-2 rounded-lg flex items-center gap-2 transition-all duration-200 ${activeTab === tab.id
            ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-900/20'
            : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
            }`}
        >
          <tab.icon className="w-4 h-4" />
          <span className="hidden sm:inline font-medium">{tab.label}</span>
        </button>
      ))}
    </div>
  </nav>
);

const StudentMode = () => {
  const [step, setStep] = useState<'ref' | 'action' | 'success'>('ref');
  const [refNo, setRefNo] = useState('');
  const [action, setAction] = useState<'Arrive' | 'Leave' | null>(null);
  const [purpose, setPurpose] = useState('');
  const [studentInfo, setStudentInfo] = useState<Student | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleNext = async () => {
    if (refNo.length !== 10) {
      setError('Please enter a valid 10-digit Reference Number.');
      return;
    }
    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/students');
      const students: Student[] = await res.json();
      const student = students.find(s => String(s.refNo) === String(refNo));
      if (!student) {
        setError('Reference Number not found. Please register at the desk.');
      } else {
        setStudentInfo(student);
        setStep('action');
      }
    } catch (e) {
      setError('Connection error.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/attendance/action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ studentRef: refNo, action, purpose })
      });
      if (res.ok) {
        setStep('success');
      } else {
        const err = await res.json();
        setError(err.error);
      }
    } catch (e) {
      setError('Failed to submit.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md bg-[#141414] border border-[#2a2a2a] rounded-3xl p-8 shadow-2xl relative overflow-hidden"
      >
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-500 via-blue-500 to-emerald-500"></div>

        <div className="flex flex-col items-center text-center mb-8">
          <img
            src="https://upload.wikimedia.org/wikipedia/en/thumb/e/ef/UMa_logo.png/220px-UMa_logo.png"
            alt="UMaT Logo"
            className="w-16 h-16 object-contain mb-4"
          />
          <h1 className="text-2xl font-bold tracking-tight">Kiosk Terminal</h1>
          <p className="text-zinc-500 text-sm">Scan to check in or out</p>
        </div>

        <AnimatePresence mode="wait">
          {step === 'ref' && (
            <motion.div
              key="step-ref"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <div className="space-y-2">
                <label className="text-xs font-mono uppercase text-zinc-500 tracking-widest">Reference Number</label>
                <input
                  type="text"
                  maxLength={10}
                  placeholder="Enter 10-digit ID"
                  value={refNo}
                  onChange={(e) => setRefNo(e.target.value.replace(/\D/g, ''))}
                  className="w-full bg-[#1e1e1e] border border-[#2a2a2a] rounded-2xl py-4 px-6 text-2xl font-mono text-center tracking-[0.2em] focus:ring-2 focus:ring-emerald-500 outline-none transition-all placeholder:text-zinc-800"
                />
                {error && <p className="text-red-500 text-xs text-center mt-2 flex items-center justify-center gap-1"><AlertCircle className="w-3 h-3" /> {error}</p>}
              </div>
              <button
                disabled={refNo.length !== 10 || loading}
                onClick={handleNext}
                className="w-full bg-white text-black font-bold py-4 rounded-2xl hover:bg-zinc-200 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? 'Verifying...' : 'Continue'} <ChevronLeft className="w-5 h-5 rotate-180" />
              </button>
            </motion.div>
          )}

          {step === 'action' && (
            <motion.div
              key="step-action"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <div className="bg-[#1e1e1e] p-4 rounded-2xl border border-[#2a2a2a]">
                <p className="text-xs font-mono text-emerald-500 mb-1">Welcome back,</p>
                <p className="text-xl font-bold">{studentInfo?.name}</p>
                <p className="text-sm text-zinc-500">{studentInfo?.programme} • Year {studentInfo?.year}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={() => setAction('Arrive')}
                  className={`py-6 rounded-2xl border-2 transition-all flex flex-col items-center gap-2 ${action === 'Arrive' ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400' : 'bg-[#1e1e1e] border-[#2a2a2a] text-zinc-400'
                    }`}
                >
                  <LogIn className="w-8 h-8" />
                  <span className="font-bold">Arrive</span>
                </button>
                <button
                  onClick={() => setAction('Leave')}
                  className={`py-6 rounded-2xl border-2 transition-all flex flex-col items-center gap-2 ${action === 'Leave' ? 'bg-red-500/20 border-red-500 text-red-400' : 'bg-[#1e1e1e] border-[#2a2a2a] text-zinc-400'
                    }`}
                >
                  <LogOut className="w-8 h-8" />
                  <span className="font-bold">Leave</span>
                </button>
              </div>

              {action === 'Arrive' && (
                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} className="space-y-2">
                  <label className="text-xs font-mono text-zinc-500">Book Reference / Purpose</label>
                  <input
                    type="text"
                    placeholder="e.g. Reference Calculus Vol 2"
                    value={purpose}
                    onChange={(e) => setPurpose(e.target.value)}
                    className="w-full bg-[#1e1e1e] border border-[#2a2a2a] rounded-xl py-3 px-4 text-sm focus:ring-1 focus:ring-emerald-500 outline-none"
                  />
                </motion.div>
              )}

              {error && <p className="text-red-500 text-xs text-center flex items-center justify-center gap-1"><AlertCircle className="w-3 h-3" /> {error}</p>}

              <div className="flex gap-4">
                <button
                  onClick={() => setStep('ref')}
                  className="flex-1 bg-zinc-800 hover:bg-zinc-700 text-white font-bold py-4 rounded-2xl transition-all"
                >
                  Back
                </button>
                <button
                  disabled={!action || loading}
                  onClick={handleSubmit}
                  className="flex-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-4 rounded-2xl transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {loading ? 'Processing...' : 'Submit'}
                </button>
              </div>
            </motion.div>
          )}

          {step === 'success' && (
            <motion.div
              key="step-success"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center space-y-6"
            >
              <div className="bg-emerald-500/20 w-24 h-24 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-12 h-12 text-emerald-500" />
              </div>
              <div>
                <h2 className="text-2xl font-bold">Successfully Recorded</h2>
                <p className="text-zinc-500 mt-2">Have a productive session!</p>
              </div>
              <button
                onClick={() => {
                  setStep('ref');
                  setRefNo('');
                  setPurpose('');
                  setAction(null);
                }}
                className="w-full bg-zinc-800 hover:bg-zinc-700 text-white font-bold py-4 rounded-2xl"
              >
                Done
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  )
}

const RegistrationMode = ({ onComplete }: { onComplete: () => void }) => {
  const [formData, setFormData] = useState<Partial<Student>>({
    year: '1',
    programme: 'CE',
    hall: 'Volta Hall'
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.refNo?.length !== 10) {
      setError('Reference Number must be 10 digits.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/students', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      if (res.ok) {
        setSuccess(true);
        onComplete();
      } else {
        const err = await res.json();
        setError(err.error);
      }
    } catch (e) {
      setError('Registration failed.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] text-white flex items-center justify-center p-4">
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="w-full max-w-md bg-[#141414] border border-[#2a2a2a] rounded-3xl p-8 text-center space-y-6">
          <div className="bg-emerald-500/20 w-20 h-20 rounded-full flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-10 h-10 text-emerald-500" />
          </div>
          <h2 className="text-2xl font-bold">Registration Complete!</h2>
          <p className="text-zinc-500">You can now use your Reference Number at the Kiosk Terminal.</p>
          <button onClick={() => window.location.hash = '#scan'} className="w-full bg-emerald-600 text-white font-bold py-4 rounded-2xl">
            Go to Check-In
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-[#141414] border border-[#2a2a2a] rounded-3xl p-8 shadow-2xl relative"
      >
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 to-indigo-500"></div>
        <div className="flex flex-col items-center mb-8">
          <img
            src="https://upload.wikimedia.org/wikipedia/en/thumb/e/ef/UMa_logo.png/220px-UMa_logo.png"
            alt="UMaT Logo"
            className="w-16 h-16 object-contain mb-4"
          />
          <h1 className="text-2xl font-bold">Student Membership</h1>
          <p className="text-zinc-500 text-sm">Register to access library resources</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <label className="text-xs font-mono uppercase text-zinc-500">Reference Number</label>
            <input required type="text" maxLength={10} placeholder="10 Digits" value={formData.refNo || ''} onChange={e => setFormData({ ...formData, refNo: e.target.value.replace(/\D/g, '') })} className="w-full bg-[#1e1e1e] border border-[#2a2a2a] rounded-xl py-3 px-4 focus:ring-2 focus:ring-blue-500 outline-none font-mono" />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-mono uppercase text-zinc-500">Full Name</label>
            <input required type="text" placeholder="Your Name" value={formData.name || ''} onChange={e => setFormData({ ...formData, name: e.target.value })} className="w-full bg-[#1e1e1e] border border-[#2a2a2a] rounded-xl py-3 px-4 focus:ring-2 focus:ring-blue-500 outline-none" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-mono uppercase text-zinc-500">Year</label>
              <select value={formData.year} onChange={e => setFormData({ ...formData, year: e.target.value })} className="w-full bg-[#1e1e1e] border border-[#2a2a2a] rounded-xl py-3 px-4 focus:ring-2 focus:ring-blue-500 outline-none">
                {YEARS.map(y => <option key={y} value={y}>Year {y}</option>)}
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-mono uppercase text-zinc-500">Programme</label>
              <select value={formData.programme} onChange={e => setFormData({ ...formData, programme: e.target.value })} className="w-full bg-[#1e1e1e] border border-[#2a2a2a] rounded-xl py-3 px-4 focus:ring-2 focus:ring-blue-500 outline-none">
                {PROGRAMMES.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
          </div>
          <div className="space-y-1">
            <label className="text-xs font-mono uppercase text-zinc-500">Hall / Hostel</label>
            <select value={formData.hall} onChange={e => setFormData({ ...formData, hall: e.target.value })} className="w-full bg-[#1e1e1e] border border-[#2a2a2a] rounded-xl py-3 px-4 focus:ring-2 focus:ring-blue-500 outline-none">
              {HALLS.map(h => <option key={h} value={h}>{h}</option>)}
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-xs font-mono uppercase text-zinc-500">Contact Number</label>
            <input required type="text" placeholder="Phone Number" value={formData.contact || ''} onChange={e => setFormData({ ...formData, contact: e.target.value })} className="w-full bg-[#1e1e1e] border border-[#2a2a2a] rounded-xl py-3 px-4 focus:ring-2 focus:ring-blue-500 outline-none" />
          </div>

          {error && <p className="text-red-500 text-xs text-center flex items-center justify-center gap-1"><AlertCircle className="w-3 h-3" /> {error}</p>}

          <button disabled={loading} type="submit" className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-4 rounded-2xl transition-all disabled:opacity-50">
            {loading ? 'Registering...' : 'Complete Registration'}
          </button>
        </form>
      </motion.div>
    </div>
  )
}

const LoginMode = ({ onLogin }: { onLogin: (role: UserRole) => void }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const credentials: Record<string, { pass: string, role: UserRole }> = {
    'srid_lib': { pass: 'srid_srid', role: 'SUPER_ADMIN' },
    'super_admin': { pass: 'super123', role: 'SUPER_ADMIN' },
    'manager': { pass: 'manager123', role: 'MANAGER' },
    'viewer': { pass: 'viewer123', role: 'VIEWER' }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const user = credentials[username];
    if (user && user.pass === password) {
      onLogin(user.role);
    } else {
      setError('Invalid username or password');
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-[#141414] border border-[#2a2a2a] rounded-3xl p-8 shadow-2xl relative"
      >
        <div className="absolute top-0 left-0 w-full h-1 bg-emerald-500"></div>
        <div className="flex flex-col items-center mb-8">
          <img
            src="https://upload.wikimedia.org/wikipedia/en/thumb/e/ef/UMa_logo.png/220px-UMa_logo.png"
            alt="UMaT Logo"
            className="w-20 h-20 object-contain mb-4 mx-auto"
          />
          <h1 className="text-2xl font-bold">UMaT-SRID Admin</h1>
          <p className="text-zinc-500 text-sm">Library Management System</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <label className="text-xs font-mono uppercase text-zinc-500">Username</label>
            <input
              required
              type="text"
              value={username}
              onChange={e => setUsername(e.target.value)}
              className="w-full bg-[#1e1e1e] border border-[#2a2a2a] rounded-xl py-3 px-4 focus:ring-2 focus:ring-emerald-500 outline-none"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-mono uppercase text-zinc-500">Password</label>
            <input
              required
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="w-full bg-[#1e1e1e] border border-[#2a2a2a] rounded-xl py-3 px-4 focus:ring-2 focus:ring-emerald-500 outline-none"
            />
          </div>

          {error && <p className="text-red-500 text-xs text-center flex items-center justify-center gap-1"><AlertCircle className="w-3 h-3" /> {error}</p>}

          <button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-4 rounded-2xl transition-all">
            Unlock Dashboard
          </button>

          <div className="text-center">
            <button type="button" onClick={() => alert('Please contact the System Administrator to reset your password.')} className="text-zinc-600 hover:text-emerald-500 text-xs transition-colors">
              Forgot Password?
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}

const StudentDetailModal = ({
  student,
  attendance,
  onClose,
  onUpdate,
  onDelete,
  onDrop,
  deletingRef,
  userRole
}: {
  student: Student,
  attendance: AttendanceRecord[],
  onClose: () => void,
  onUpdate: (data: Partial<Student>) => void,
  onDelete: (refNo: string) => void,
  onDrop: (refNo: string) => void,
  deletingRef: string | null,
  userRole: UserRole | null
}) => {
  const [editData, setEditData] = useState<Student>(student);
  const [isEditing, setIsEditing] = useState(false);

  const history = attendance.filter(a => a.studentRef === student.refNo).sort((a, b) => b.date.localeCompare(a.date));

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 z-[60] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
    >
      <motion.div
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        className="w-full max-w-2xl bg-[#141414] border border-[#2a2a2a] rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]"
      >
        <div className="p-6 border-b border-[#2a2a2a] flex justify-between items-center bg-[#1a1a1a]">
          <div className="flex items-center gap-4">
            <div className="bg-emerald-500/10 p-3 rounded-2xl">
              <Users className="w-6 h-6 text-emerald-500" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold text-white leading-tight">{isEditing ? 'Edit Profile' : student.name}</h2>
                {!isEditing && (
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${student.status === 'ACTIVE' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500'
                    }`}>
                    {student.status}
                  </span>
                )}
              </div>
              <p className="text-xs font-mono text-emerald-500 uppercase">{student.refNo}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-zinc-500 hover:text-white p-2 transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-8">
          <section className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-xs font-mono uppercase text-zinc-500 tracking-widest">Personal Details</h3>
              {(userRole === 'SUPER_ADMIN' || userRole === 'MANAGER') && (
                <button
                  onClick={() => setIsEditing(!isEditing)}
                  className="text-xs bg-zinc-800 hover:bg-zinc-700 text-zinc-300 py-1.5 px-3 rounded-lg transition-all"
                >
                  {isEditing ? 'Cancel Edit' : 'Edit Info'}
                </button>
              )}
            </div>

            {isEditing ? (
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] uppercase text-zinc-600">Full Name</label>
                  <input
                    type="text"
                    value={editData.name}
                    onChange={e => setEditData({ ...editData, name: e.target.value })}
                    className="w-full bg-[#1e1e1e] border border-[#2a2a2a] rounded-xl py-2 px-3 text-sm focus:ring-1 focus:ring-emerald-500 outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] uppercase text-zinc-600">Contact</label>
                  <input
                    type="text"
                    value={editData.contact}
                    onChange={e => setEditData({ ...editData, contact: e.target.value })}
                    className="w-full bg-[#1e1e1e] border border-[#2a2a2a] rounded-xl py-2 px-3 text-sm focus:ring-1 focus:ring-emerald-500 outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] uppercase text-zinc-600">Year</label>
                  <select
                    value={editData.year}
                    onChange={e => setEditData({ ...editData, year: e.target.value })}
                    className="w-full bg-[#1e1e1e] border border-[#2a2a2a] rounded-xl py-2 px-3 text-sm focus:ring-1 focus:ring-emerald-500 outline-none"
                  >
                    {YEARS.map(y => <option key={y} value={y}>Year {y}</option>)}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] uppercase text-zinc-600">Programme</label>
                  <select
                    value={editData.programme}
                    onChange={e => setEditData({ ...editData, programme: e.target.value })}
                    className="w-full bg-[#1e1e1e] border border-[#2a2a2a] rounded-xl py-2 px-3 text-sm focus:ring-1 focus:ring-emerald-500 outline-none"
                  >
                    {PROGRAMMES.map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>
                <div className="md:col-span-2 flex justify-end">
                  <button
                    onClick={() => {
                      onUpdate(editData);
                      setIsEditing(false);
                    }}
                    className="bg-emerald-600 hover:bg-emerald-500 text-white px-6 py-2 rounded-xl text-sm font-bold transition-all shadow-lg shadow-emerald-900/20"
                  >
                    Update Profile
                  </button>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { label: 'Programme', value: student.programme, icon: BookOpen },
                  { label: 'Year', value: `Year ${student.year}`, icon: GraduationCap },
                  { label: 'Hall', value: student.hall, icon: Building2 },
                  { label: 'Contact', value: student.contact, icon: Phone },
                ].map((item, i) => (
                  <div key={i} className="bg-[#1e1e1e] border border-[#2a2a2a] p-3 rounded-2xl">
                    <item.icon className="w-4 h-4 text-zinc-600 mb-2" />
                    <p className="text-[10px] uppercase text-zinc-600 mb-0.5">{item.label}</p>
                    <p className="text-sm font-medium text-white">{item.value}</p>
                  </div>
                ))}
              </div>
            )}
          </section>

          <section className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-xs font-mono uppercase text-zinc-500 tracking-widest">Attendance History</h3>
            </div>
            <div className="bg-[#1e1e1e] border border-[#2a2a2a] rounded-2xl overflow-hidden overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-[#2a2a2a] text-[10px] uppercase text-zinc-500 font-mono">
                  <tr>
                    <th className="py-2 px-4 whitespace-nowrap">Date</th>
                    <th className="py-2 px-4 whitespace-nowrap">Time In</th>
                    <th className="py-2 px-4 whitespace-nowrap" >Time Out</th>
                    <th className="py-2 px-4 whitespace-nowrap">Purpose</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#2a2a2a]">
                  {history.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="py-8 text-center text-zinc-600 italic">No attendance records found.</td>
                    </tr>
                  ) : (
                    history.slice(0, 10).map(h => (
                      <tr key={h.id} className="hover:bg-zinc-800/50 transition-colors">
                        <td className="py-3 px-4 text-zinc-400 font-mono text-xs whitespace-nowrap">{h.date}</td>
                        <td className="py-3 px-4 text-white whitespace-nowrap">{format(new Date(h.checkIn), 'HH:mm')}</td>
                        <td className="py-3 px-4 text-zinc-500 whitespace-nowrap">{h.checkOut ? format(new Date(h.checkOut), 'HH:mm') : '--:--'}</td>
                        <td className="py-3 px-4 text-zinc-400 text-xs italic">{h.purpose || '-'}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </section>
        </div>

        <div className="p-4 bg-[#1a1a1a] border-t border-[#2a2a2a] flex justify-between gap-4">
          {userRole === 'SUPER_ADMIN' && (
            <button
              onClick={() => {
                if (window.confirm('IRREVERSIBLE: Delete this student and all history from the entire system?')) {
                  onDelete(student.refNo);
                }
              }}
              disabled={deletingRef === student.refNo}
              className={`px-4 py-2.5 rounded-xl border border-red-900/30 font-bold text-xs transition-all flex items-center gap-2 ${deletingRef === student.refNo
                ? 'bg-red-500/10 text-red-400 opacity-50 cursor-not-allowed'
                : 'text-red-500 hover:bg-red-500/10'
                }`}
            >
              {deletingRef === student.refNo ? <Clock className="w-3 h-3 animate-spin" /> : <Trash2 className="w-3 h-3" />}
              Delete Permanently
            </button>
          )}

          {(userRole === 'SUPER_ADMIN' || userRole === 'MANAGER') && student.status === 'ACTIVE' && (
            <button
              onClick={() => {
                if (window.confirm(`Drop ${student.name}'s status? (Marks as no longer schooling)`)) {
                  onDrop(student.refNo);
                }
              }}
              className="px-4 py-2.5 rounded-xl border border-amber-500/30 text-amber-500 hover:bg-amber-500/10 transition-all font-bold text-xs flex items-center gap-2"
            >
              <LogOut className="w-3 h-3" /> Drop Record
            </button>
          )}
          <button
            onClick={onClose}
            className="px-8 py-3 bg-zinc-800 hover:bg-zinc-700 text-white rounded-xl transition-all font-bold text-sm"
          >
            Close
          </button>
        </div>
      </motion.div>
    </motion.div>
  )
}

export default function App() {
  const [activeTab, setActiveTab] = useState('attendance');
  const [students, setStudents] = useState<Student[]>([]);
  const [guests, setGuests] = useState<any[]>([]);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [purpose, setPurpose] = useState('');
  const [message, setMessage] = useState<{ text: string, type: 'success' | 'error' } | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userRole, setUserRole] = useState<UserRole | null>(null);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [deletingRef, setDeletingRef] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [view, setView] = useState<'admin' | 'scan' | 'register'>('admin');

  const [newStudent, setNewStudent] = useState<Partial<Student>>({
    year: '1',
    programme: 'CE',
    hall: 'Volta Hall'
  });
  const [newGuest, setNewGuest] = useState({
    fullName: '',
    institution: '',
    contact: '',
    purpose: ''
  });

  const registerGuest = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/guests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newGuest)
      });
      if (res.ok) {
        showMsg('Guest registered successfully');
        setNewGuest({ fullName: '', institution: '', contact: '', purpose: '' });
        fetchData();
      } else {
        const err = await res.json();
        showMsg(err.error || 'Failed to register guest', 'error');
      }
    } catch (err) {
      showMsg('Registration failed', 'error');
    }
  };

  const fetchData = async () => {
    try {
      // Fetch students
      const stuRes = await fetch('/api/students');
      const studentsData = await stuRes.json();

      if (Array.isArray(studentsData)) {
        setStudents(studentsData);
      } else {
        console.error('Students data is not an array:', studentsData);
        setStudents([]);
      }
      // Fetch guests
      try {
        const guestRes = await fetch('/api/guest-visits');
        const guestData = await guestRes.json();
        if (Array.isArray(guestData)) setGuests(guestData);
      } catch (err) {
        console.log('Failed to fetch guests');
      }

      // Fetch attendance (if endpoint exists, otherwise use empty array)
      try {
        const attRes = await fetch('/api/attendance');
        const attendanceData = await attRes.json();
        if (Array.isArray(attendanceData)) {
          setAttendance(attendanceData);
        } else {
          setAttendance([]);
        }
      } catch (attError) {
        console.log('Attendance endpoint not found, using empty array');
        setAttendance([]);
      }
    } catch (error) {
      console.error('Failed to fetch data:', error);
      setStudents([]);
      setAttendance([]);
    }
  };

  useEffect(() => {
    fetchData();
    const updateView = () => {
      const hash = window.location.hash;
      if (hash === '#scan') setView('scan');
      else if (hash === '#register') setView('register');
      else if (hash === '#admin') setView('admin');
      else setView('scan');
    }
    updateView();
    window.addEventListener('hashchange', updateView);
    return () => window.removeEventListener('hashchange', updateView);
  }, []);

  const showMsg = (text: string, type: 'success' | 'error' = 'success') => {
    setMessage({ text, type });
    setTimeout(() => setMessage(null), 3000);
  };

  const registerStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newStudent.refNo?.length !== 10) {
      showMsg('Reference Number must be exactly 10 digits', 'error');
      return;
    }
    try {
      const res = await fetch('/api/students', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newStudent)
      });
      if (res.ok) {
        showMsg('Student registered successfully');
        setNewStudent({ year: '1', name: '', refNo: '', programme: 'CE', contact: '', hall: 'Volta Hall' });
        fetchData();
      } else {
        const err = await res.json();
        showMsg(err.error, 'error');
      }
    } catch (err) {
      showMsg('Registration failed', 'error');
    }
  };

  const handleAttendance = async (refNo: string, action: 'check-in' | 'check-out') => {
    try {
      const reqAction = action === 'check-in' ? 'Arrive' : 'Leave';
      const res = await fetch(`/api/attendance/action`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ studentRef: refNo, action: reqAction, purpose })
      });
      if (res.ok) {
        showMsg(`Successfully processed ${reqAction}`);
        fetchData();
        setSearchTerm('');
        setPurpose('');
      } else {
        const err = await res.json();
        showMsg(err.error, 'error');
      }
    } catch (err) {
      showMsg('Attendance update failed', 'error');
    }
  };

  const dropStudent = async (refNo: string) => {
    try {
      const res = await fetch(`/api/students/${refNo}/drop`, { method: 'POST' });
      if (res.ok) {
        showMsg('Student record dropped (Stops schooling)');
        fetchData();
        if (selectedStudent?.refNo === refNo) setSelectedStudent({ ...selectedStudent, status: 'DROPPED' });
      } else {
        showMsg('Failed to drop student', 'error');
      }
    } catch (err) {
      showMsg('Network error', 'error');
    }
  };

  const deleteStudent = async (refNo: string) => {
    setDeletingRef(refNo);
    try {
      const res = await fetch(`/api/students/${refNo}`, { method: 'DELETE' });
      if (res.ok) {
        showMsg('Student deleted permanently');
        await fetchData();
        if (selectedStudent?.refNo === refNo) setSelectedStudent(null);
      } else {
        showMsg('Failed to delete student', 'error');
      }
    } catch (err) {
      showMsg('Network error', 'error');
    } finally {
      setDeletingRef(null);
    }
  };

  const updateStudent = async (data: Partial<Student>) => {
    try {
      const res = await fetch(`/api/students/${data.refNo}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      if (res.ok) {
        showMsg('Student updated successfully');
        fetchData();
        setSelectedStudent(null);
      } else {
        showMsg('Failed to update student', 'error');
      }
    } catch (err) {
      showMsg('Network error', 'error');
    }
  };

  const resetSystem = async () => {
    const confirmation = window.prompt('DANGER: To confirm system reset, type "RESET ALL" below. This will delete ALL students and ALL attendance records.');
    if (confirmation !== 'RESET ALL') return;

    try {
      const res = await fetch('/api/system/reset', { method: 'POST' });
      if (res.ok) {
        showMsg('System reset successful');
        fetchData();
      } else {
        showMsg('Reset failed', 'error');
      }
    } catch (err) {
      showMsg('Network error', 'error');
    }
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        const rawData = results.data as any[];
        const importedStudents: Student[] = rawData.map(row => ({
          refNo: row.refNo || row['Ref No'] || row['Reference Number'],
          name: row.name || row['Name'] || row['Full Name'],
          year: row.year || row['Year'] || '1',
          programme: row.programme || row['Programme'] || 'CE',
          contact: row.contact || row['Contact'] || row['Phone'],
          hall: row.hall || row['Hall'] || row['Hostel'] || 'Railway Hall',
          status: (row.status as StudentStatus) || 'ACTIVE'
        })).filter(s => s.refNo && s.name);

        if (importedStudents.length === 0) {
          showMsg('No valid students found in CSV', 'error');
          return;
        }

        try {
          const res = await fetch('/api/students/bulk', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(importedStudents)
          });
          if (res.ok) {
            const summary = await res.json();
            showMsg(`Import complete: ${summary.added} added, ${summary.skipped} skipped (duplicates)`);
            fetchData();
          } else {
            showMsg('Bulk import failed', 'error');
          }
        } catch (err) {
          showMsg('Network error during import', 'error');
        }

        if (fileInputRef.current) fileInputRef.current.value = '';
      }
    });
  };

  // STUDENT ROUTES — No login required
  if (view === 'scan') return <StudentMode />;
  if (view === 'register') return <RegistrationMode onComplete={() => fetchData()} />;

  // ADMIN ROUTES — Require authentication
  if (!isAuthenticated) {
    return <LoginMode onLogin={(role) => {
      setIsAuthenticated(true);
      setUserRole(role);
    }} />;
  }

  if (userRole === 'VIEWER') {
    return <div className="min-h-screen bg-[#0a0a0a] text-white flex items-center justify-center">Access Denied. Admins only.</div>;
  }

  // Analytics Helpers
  const getYearData = () => {
    const counts: Record<string, number> = {};
    (attendance || []).forEach(a => {
      if (a.year) counts[a.year] = (counts[a.year] || 0) + 1;
    });
    return Object.entries(counts).map(([name, value]) => ({ name: `Year ${name}`, value }));
  };

  const getProgrammeData = () => {
    const counts: Record<string, number> = {};
    (attendance || []).forEach(a => {
      if (a.programme) counts[a.programme] = (counts[a.programme] || 0) + 1;
    });
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  };

  const getTrendData = () => {
    const counts: Record<string, { students: number, guests: number }> = {};
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      counts[dateStr] = { students: 0, guests: 0 };
    }

    (attendance || []).forEach(a => {
      if (counts[a.date] !== undefined) {
        counts[a.date].students++;
      }
    });

    (guests || []).forEach(g => {
      const dateStr = (g.visit_date || g.createdAt || '').substring(0, 10);
      if (counts[dateStr] !== undefined) {
        counts[dateStr].guests++;
      }
    });

    return Object.entries(counts).map(([date, data]) => ({
      name: format(new Date(date), 'MMM dd'),
      Students: data.students,
      Guests: data.guests
    }));
  };

  const getPurposeData = () => {
    const counts: Record<string, number> = {};
    (attendance || []).forEach(a => {
      const purpose = a.purpose?.trim() || 'General Study';
      counts[purpose] = (counts[purpose] || 0) + 1;
    });
    (guests || []).forEach(g => {
      const purpose = g.purpose?.trim() || 'General Visit';
      counts[purpose] = (counts[purpose] || 0) + 1;
    });
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([name, value]) => ({ name, value }));
  };
  const getInactiveStudents = () => {
    const threeMonthsAgo = new Date();
    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);

    return (students || []).filter(student => {
      const studentAttendance = (attendance || []).filter(a => a.studentRef === student.refNo);
      if (studentAttendance.length === 0) return true;

      const lastVisit = new Date(Math.max(...studentAttendance.map(a => new Date(a.date).getTime())));
      return lastVisit < threeMonthsAgo;
    });
  };

  const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

  const baseUrl = typeof window !== 'undefined' ? `${window.location.origin}${window.location.pathname}` : '';
  const scanUrl = `${baseUrl}#scan`;
  const registerUrl = `${baseUrl}#register`;

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-zinc-300 font-sans">
      <Navbar activeTab={activeTab} setActiveTab={setActiveTab} />

      <main className="max-w-7xl mx-auto p-4 sm:p-8">
        <AnimatePresence mode="wait">
          {message && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className={`fixed top-20 right-4 z-50 p-4 rounded-xl flex items-center gap-3 shadow-2xl border ${message.type === 'success' ? 'bg-emerald-950/80 text-emerald-400 border-emerald-800' : 'bg-red-950/80 text-red-400 border-red-800'
                } backdrop-blur-md`}
            >
              {message.type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
              <span className="font-medium text-sm">{message.text}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {activeTab === 'attendance' && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="grid lg:grid-cols-3 gap-8"
          >
            <div className="lg:col-span-1 space-y-6">
              <div id="check-in-panel" className="bg-[#141414] border border-[#2a2a2a] p-6 rounded-2xl shadow-xl">
                <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                  <LogIn className="w-5 h-5 text-emerald-500" />
                  Manual Check-In
                </h2>
                <div className="relative mb-6">
                  <Search className="absolute left-3 top-3.5 w-5 h-5 text-zinc-500" />
                  <input
                    type="text"
                    placeholder="Search Reference Number..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full bg-[#1e1e1e] border border-[#2a2a2a] rounded-xl py-3 pl-10 pr-4 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all text-white"
                  />
                </div>

                {searchTerm && (
                  <div className="space-y-4">
                    {students.filter(s => s.refNo.toLowerCase().includes(searchTerm.toLowerCase())).map(student => {
                      const today = new Date().toISOString().split('T')[0];
                      const activeSession = attendance.find(a => a.studentRef === student.refNo && a.date === today && !a.checkOut);

                      return (
                        <div key={student.refNo} className="bg-[#1e1e1e] border border-[#2a2a2a] p-4 rounded-xl">
                          <div className="flex justify-between items-start mb-2">
                            <div>
                              <p className="font-bold text-white">{student.name}</p>
                              <p className="text-xs text-zinc-500 font-mono tracking-tighter text-emerald-500">{student.refNo}</p>
                              <p className="text-xs text-zinc-500">{student.programme} • {student.hall}</p>
                            </div>
                            <div className={`px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider ${activeSession ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500'}`}>
                              {activeSession ? 'Inside' : 'Not In'}
                            </div>
                          </div>
                          <div className="flex gap-2">
                            {!activeSession ? (
                              <div className="w-full space-y-2">
                                <input
                                  type="text"
                                  placeholder="Book / Purpose"
                                  value={purpose}
                                  onChange={(e) => setPurpose(e.target.value)}
                                  className="w-full bg-[#141414] border border-[#2a2a2a] rounded-lg py-2 px-3 text-xs outline-none focus:ring-1 focus:ring-emerald-500"
                                />
                                <button
                                  onClick={() => handleAttendance(student.refNo, 'check-in')}
                                  className="w-full bg-emerald-600 hover:bg-emerald-500 text-white py-2 rounded-lg flex items-center justify-center gap-2 transition-colors font-medium text-sm"
                                >
                                  <LogIn className="w-4 h-4" /> Check In
                                </button>
                              </div>
                            ) : (
                              <button
                                onClick={() => handleAttendance(student.refNo, 'check-out')}
                                className="flex-1 bg-zinc-700 hover:bg-zinc-600 text-white py-2 rounded-lg flex items-center justify-center gap-2 transition-colors font-medium text-sm"
                              >
                                <LogOut className="w-4 h-4" /> Check Out
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                    {students.filter(s => s.refNo.toLowerCase().includes(searchTerm.toLowerCase())).length === 0 && (
                      <div className="text-center py-8">
                        <Users className="w-12 h-12 text-zinc-700 mx-auto mb-2" />
                        <p className="text-zinc-500 text-sm">No student found matching "{searchTerm}"</p>
                        <button
                          onClick={() => setActiveTab('students')}
                          className="mt-4 text-emerald-500 hover:underline text-sm font-medium"
                        >
                          Register new student?
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            <div className="lg:col-span-2 space-y-6">
              <div className="bg-[#141414] border border-[#2a2a2a] p-6 rounded-2xl shadow-xl h-full">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-bold text-white flex items-center gap-2">
                    <Clock className="w-5 h-5 text-blue-500" />
                    Live Activity
                  </h2>
                  <button
                    onClick={() => {
                      const csvHeader = "Student,Ref No,Book/Purpose,Time In,Time Out,Date\n";
                      const csvRows = (attendance || []).map(a =>
                        `"${a.name}","${a.studentRef}","${a.purpose || 'General Study'}","${a.checkIn}","${a.checkOut || ''}","${a.date}"`
                      ).join("\n");
                      const blob = new Blob([csvHeader + csvRows], { type: 'text/csv' });
                      const url = window.URL.createObjectURL(blob);
                      const a = document.createElement('a');
                      a.setAttribute('hidden', '');
                      a.setAttribute('href', url);
                      a.setAttribute('download', `library_attendance_${format(new Date(), 'yyyy-MM-dd')}.csv`);
                      document.body.appendChild(a);
                      a.click();
                      document.body.removeChild(a);
                      showMsg('CSV Exported successfully');
                    }}
                    className="bg-zinc-800 hover:bg-zinc-700 text-white px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2"
                  >
                    <Smartphone className="w-3 h-3" /> Export CSV
                  </button>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead className="text-xs uppercase text-zinc-500 font-mono tracking-wider">
                      <tr>
                        <th className="pb-4 font-medium px-4">Student</th>
                        <th className="pb-4 font-medium px-4">Book/Purpose</th>
                        <th className="pb-4 font-medium px-4">Time In</th>
                        <th className="pb-4 font-medium px-4">Time Out</th>
                        <th className="pb-4 font-medium px-4">Status</th>
                      </tr>
                    </thead>
                    <tbody className="text-sm divide-y divide-[#2a2a2a]">
                      {(attendance || []).filter(a => a.date === new Date().toISOString().split('T')[0]).map(record => (
                        <tr key={record.id} className="hover:bg-zinc-800/30 transition-colors group">
                          <td className="py-4 px-4">
                            <div>
                              <p className="font-bold text-white group-hover:text-emerald-400 transition-colors">{record.name}</p>
                              <p className="text-xs text-zinc-500 font-mono">{record.studentRef}</p>
                            </div>
                          </td>
                          <td className="py-4 px-4">
                            <div className="flex items-center gap-2">
                              <BookOpen className="w-3 h-3 text-zinc-600" />
                              <span className="text-zinc-300 italic text-xs">{record.purpose || 'General Study'}</span>
                            </div>
                          </td>
                          <td className="py-4 px-4 text-zinc-400">{format(new Date(record.checkIn), 'HH:mm:ss')}</td>
                          <td className="py-4 px-4 text-zinc-400">
                            {record.checkOut ? format(new Date(record.checkOut), 'HH:mm:ss') : '--:--:--'}
                          </td>
                          <td className="py-4 px-4">
                            {record.checkOut ? (
                              <span className="flex items-center gap-1.5 text-zinc-500 text-xs">
                                <LogOut className="w-3 h-3" /> Exited
                              </span>
                            ) : (
                              <span className="flex items-center gap-1.5 text-emerald-500 text-xs font-bold animate-pulse">
                                <span className="w-2 h-2 bg-emerald-500 rounded-full"></span>
                                Inside
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {activeTab === 'students' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="grid md:grid-cols-5 gap-8"
          >
            <div className="md:col-span-2">
              <div id="register-form" className="bg-[#141414] border border-[#2a2a2a] p-6 rounded-2xl shadow-xl sticky top-24">
                <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                  <PlusCircle className="w-5 h-5 text-emerald-500" />
                  Admin Registration
                </h2>
                <form onSubmit={registerStudent} className="space-y-4">
                  <div className="space-y-1">
                    <label className="text-xs font-mono uppercase text-zinc-500">Ref Number (10 Digits)</label>
                    <input
                      required
                      type="text"
                      maxLength={10}
                      value={newStudent.refNo || ''}
                      onChange={e => setNewStudent({ ...newStudent, refNo: e.target.value.replace(/\D/g, '') })}
                      placeholder="e.g. 9012593422"
                      className="w-full bg-[#1e1e1e] border border-[#2a2a2a] rounded-lg py-2 px-4 focus:ring-2 focus:ring-emerald-500/50 outline-none transition-all text-white font-mono"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-mono uppercase text-zinc-500">Full Name</label>
                    <div className="relative">
                      <Users className="absolute left-3 top-2.5 w-4 h-4 text-zinc-600" />
                      <input
                        required
                        type="text"
                        value={newStudent.name || ''}
                        onChange={e => setNewStudent({ ...newStudent, name: e.target.value })}
                        placeholder="e.g. Samuel Adjetey"
                        className="w-full bg-[#1e1e1e] border border-[#2a2a2a] rounded-lg py-2 pl-10 pr-4 focus:ring-2 focus:ring-emerald-500/50 outline-none transition-all text-white"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-xs font-mono uppercase text-zinc-500">Year</label>
                      <div className="relative">
                        <GraduationCap className="absolute left-3 top-2.5 w-4 h-4 text-zinc-600" />
                        <select
                          value={newStudent.year}
                          onChange={e => setNewStudent({ ...newStudent, year: e.target.value })}
                          className="w-full bg-[#1e1e1e] border border-[#2a2a2a] rounded-lg py-2 pl-10 pr-4 focus:ring-2 focus:ring-emerald-500/50 outline-none transition-all text-white"
                        >
                          {YEARS.map(y => <option key={y} value={y}>Year {y}</option>)}
                        </select>
                      </div>
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-mono uppercase text-zinc-500">Programme</label>
                      <select
                        value={newStudent.programme}
                        onChange={e => setNewStudent({ ...newStudent, programme: e.target.value })}
                        className="w-full bg-[#1e1e1e] border border-[#2a2a2a] rounded-lg py-2 px-4 focus:ring-2 focus:ring-emerald-500/50 outline-none transition-all text-white"
                      >
                        {PROGRAMMES.map(p => <option key={p} value={p}>{p}</option>)}
                      </select>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-mono uppercase text-zinc-500">Contact</label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-2.5 w-4 h-4 text-zinc-600" />
                      <input
                        required
                        type="text"
                        value={newStudent.contact || ''}
                        onChange={e => setNewStudent({ ...newStudent, contact: e.target.value })}
                        placeholder="e.g. 0244001122"
                        className="w-full bg-[#1e1e1e] border border-[#2a2a2a] rounded-lg py-2 pl-10 pr-4 focus:ring-2 focus:ring-emerald-500/50 outline-none transition-all text-white"
                      />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-mono uppercase text-zinc-500">Hall / Hostel</label>
                    <div className="relative">
                      <Building2 className="absolute left-3 top-2.5 w-4 h-4 text-zinc-600" />
                      <select
                        value={newStudent.hall}
                        onChange={e => setNewStudent({ ...newStudent, hall: e.target.value })}
                        className="w-full bg-[#1e1e1e] border border-[#2a2a2a] rounded-lg py-2 pl-10 pr-4 focus:ring-2 focus:ring-emerald-500/50 outline-none transition-all text-white"
                      >
                        {HALLS.map(h => <option key={h} value={h}>{h}</option>)}
                      </select>
                    </div>
                  </div>
                  <button
                    type="submit"
                    className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 rounded-lg flex items-center justify-center gap-2 transition-all shadow-lg shadow-emerald-900/20 active:scale-95"
                  >
                    <PlusCircle className="w-5 h-5" /> Register Student
                  </button>
                </form>
              </div>
            </div>

            <div className="md:col-span-3 space-y-6">
              <div className="bg-[#141414] border border-[#2a2a2a] p-6 rounded-2xl shadow-xl">
                <div className="flex justify-between items-center mb-6">
                  <div className="flex items-center gap-4">
                    <h2 className="text-xl font-bold text-white flex items-center gap-2">
                      <Users className="w-5 h-5 text-blue-500" />
                      Student Database
                    </h2>
                  </div>
                  <div className="flex items-center gap-3">
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleImport}
                      hidden
                      accept=".csv"
                    />
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="bg-zinc-800 hover:bg-zinc-700 text-white px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2"
                    >
                      <Upload className="w-3 h-3" /> Import CSV
                    </button>
                    <span className="text-xs font-mono text-zinc-600">{students.length} Registered</span>
                  </div>
                </div>

                <div className="mb-6 flex flex-wrap gap-4">
                  <div className="flex-1 min-w-[200px] relative">
                    <Search className="absolute left-3 top-2.5 w-4 h-4 text-zinc-500" />
                    <input
                      type="text"
                      placeholder="Search name, ref no, programme..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full bg-[#1e1e1e] border border-[#2a2a2a] rounded-lg py-2 pl-10 pr-4 text-sm outline-none focus:ring-1 focus:ring-emerald-500"
                    />
                  </div>
                </div>

                <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
                  {PROGRAMMES.map(prog => {
                    const progStudents = students.filter(s => s.programme === prog);
                    if (progStudents.length === 0 && !searchTerm) return null;

                    const filteredProgStudents = progStudents.filter(s => {
                      const query = searchTerm.toLowerCase();
                      return s.name.toLowerCase().includes(query) || s.refNo.toLowerCase().includes(query);
                    });

                    if (filteredProgStudents.length === 0 && searchTerm) return null;

                    return (
                      <div key={prog} className="space-y-2">
                        <div className="flex items-center gap-2 px-2 py-1 bg-zinc-800/30 rounded-lg border border-[#2a2a2a]">
                          <BookOpen className="w-4 h-4 text-emerald-500" />
                          <h3 className="text-sm font-bold text-white">{prog} Department</h3>
                          <span className="text-[10px] text-zinc-500 font-mono ml-auto">{filteredProgStudents.length} Students</span>
                        </div>

                        <div className="pl-4 space-y-4">
                          {YEARS.map(year => {
                            const yearStudents = filteredProgStudents.filter(s => s.year === year);
                            if (yearStudents.length === 0) return null;

                            return (
                              <div key={`${prog}-${year}`} className="space-y-2">
                                <h4 className="text-xs font-mono text-zinc-600 uppercase tracking-widest px-2">Year {year}</h4>
                                <div className="bg-[#1e1e1e] border border-[#2a2a2a] rounded-xl overflow-hidden">
                                  <table className="w-full text-left">
                                    <tbody className="text-sm divide-y divide-[#2a2a2a]">
                                      {yearStudents.map(s => (
                                        <tr
                                          key={s.refNo}
                                          onClick={() => setSelectedStudent(s)}
                                          className={`hover:bg-zinc-800/30 transition-colors group cursor-pointer ${deletingRef === s.refNo ? 'opacity-50 pointer-events-none' : ''}`}
                                        >
                                          <td className="py-2.5 px-4 font-mono text-emerald-500 w-32">{s.refNo}</td>
                                          <td className="py-2.5 px-4 text-white font-medium">{s.name}</td>
                                          <td className="py-2.5 px-4 hidden md:table-cell text-zinc-500">{s.hall}</td>
                                          <td className="py-2.5 px-4 w-24">
                                            <span className={`text-[9px] px-2 py-0.5 rounded-full font-bold uppercase ${s.status === 'ACTIVE' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500'
                                              }`}>
                                              {s.status}
                                            </span>
                                          </td>
                                          <td className="py-2.5 px-4 text-right w-16">
                                            {userRole === 'SUPER_ADMIN' && (
                                              <button
                                                onClick={(e) => {
                                                  e.stopPropagation();
                                                  if (window.confirm('IRREVERSIBLE: Delete student and their attendance history permanently?')) deleteStudent(s.refNo);
                                                }}
                                                className={`${deletingRef === s.refNo ? 'text-zinc-700 animate-pulse' : 'text-zinc-600 hover:text-red-500'} transition-colors p-1`}
                                                title="Delete Student Permanently"
                                                disabled={deletingRef === s.refNo}
                                              >
                                                {deletingRef === s.refNo ? (
                                                  <Clock className="w-3 h-3 animate-spin" />
                                                ) : (
                                                  <Trash2 className="w-3 h-3" />
                                                )}
                                              </button>
                                            )}
                                          </td>
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}

                  {students.length === 0 && (
                    <div className="text-center py-20 bg-[#1e1e1e] rounded-3xl border border-dashed border-[#2a2a2a]">
                      <Users className="w-16 h-16 text-zinc-800 mx-auto mb-4" />
                      <p className="text-zinc-500">The database is currently empty.</p>
                      <p className="text-zinc-700 text-xs mt-1">Register students manually or import via CSV.</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        )}
        {activeTab === 'guests' && (
          <div className="bg-[#141414] border border-[#2a2a2a] rounded-2xl p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <Users className="w-5 h-5 text-purple-500" />
                Guest Visits
              </h2>
              <span className="text-xs font-mono text-zinc-600">{guests.length} Total Guests</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-[#2a2a2a] text-[10px] uppercase text-zinc-500 font-mono">
                  <tr>
                    <th className="py-3 px-4">Name</th>
                    <th className="py-3 px-4">Location</th>
                    <th className="py-3 px-4">Purpose</th>
                    <th className="py-3 px-4">Visit Date</th>
                  </tr>
                </thead>
                <tbody className="text-sm divide-y divide-[#2a2a2a]">
                  {guests.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="py-8 text-center text-zinc-600 italic">No guest visits recorded yet.</td>
                    </tr>
                  ) : (
                    guests.map((guest, index) => (
                      <tr key={index} className="hover:bg-zinc-800/30 transition-colors">
                        <td className="py-3 px-4 text-white font-medium">{guest.name}</td>
                        <td className="py-3 px-4 text-zinc-400">{guest.location}</td>
                        <td className="py-3 px-4 text-zinc-400 italic">{guest.purpose}</td>
                        <td className="py-3 px-4 text-zinc-500 font-mono text-xs">{guest.visit_date}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
        {activeTab === 'qr' && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="grid md:grid-cols-2 gap-8"
          >
            <div className="bg-[#141414] border border-[#2a2a2a] p-8 rounded-3xl shadow-xl text-center flex flex-col items-center">
              <div className="bg-emerald-500/10 p-4 rounded-3xl mb-6">
                <QrCode className="w-12 h-12 text-emerald-500" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">Self-Check Terminal</h2>
              <p className="text-zinc-500 text-sm mb-8">Scan to Arrive or Leave without Librarian assistance</p>

              <div className="bg-white p-6 rounded-3xl mb-8 shadow-2xl">
                <QRCodeSVG value={scanUrl} size={250} level="H" />
              </div>

              <div className="flex flex-col gap-2 w-full">
                <a
                  href={scanUrl}
                  target="_blank"
                  className="inline-flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white px-6 py-3 rounded-xl transition-all font-bold"
                >
                  <Smartphone className="w-4 h-4" /> Open Kiosk View
                </a>
                <p className="text-[10px] text-zinc-600 font-mono break-all">{scanUrl}</p>
              </div>
            </div>

            <div className="bg-[#141414] border border-[#2a2a2a] p-8 rounded-3xl shadow-xl text-center flex flex-col items-center">
              <div className="bg-blue-500/10 p-4 rounded-3xl mb-6">
                <Users className="w-12 h-12 text-blue-500" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">Student Registration</h2>
              <p className="text-zinc-500 text-sm mb-8">Scan to register as a new library member</p>

              <div className="bg-white p-6 rounded-3xl mb-8 shadow-2xl">
                <QRCodeSVG value={registerUrl} size={250} level="H" />
              </div>

              <div className="flex flex-col gap-2 w-full">
                <a
                  href={registerUrl}
                  target="_blank"
                  className="inline-flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-6 py-3 rounded-xl transition-all font-bold"
                >
                  <Smartphone className="w-4 h-4" /> Open Registration View
                </a>
                <p className="text-[10px] text-zinc-600 font-mono break-all">{registerUrl}</p>
              </div>

              <div className="mt-6 bg-blue-900/10 text-blue-400 px-6 py-4 rounded-2xl text-xs border border-blue-900/20 w-full text-left">
                <strong>Requirement:</strong> Provide this QR code to students at the entrance. They can register using their own smartphones.
              </div>
            </div>
          </motion.div>
        )}

        {activeTab === 'analytics' && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="space-y-8"
          >
            {getInactiveStudents().length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-amber-500/10 border border-amber-500/20 p-4 rounded-2xl flex items-start gap-4"
              >
                <div className="bg-amber-500/20 p-2 rounded-xl">
                  <Bell className="w-5 h-5 text-amber-500" />
                </div>
                <div className="flex-1">
                  <h4 className="text-amber-500 font-bold text-sm">System Alerts</h4>
                  <p className="text-zinc-400 text-xs mt-0.5">
                    {getInactiveStudents().length} student(s) have been inactive for over 3 months.
                    Consider reviewing their status in the directory.
                  </p>
                </div>
                <button
                  onClick={() => { setActiveTab('students'); setSearchTerm('Inactive'); }}
                  className="text-xs font-bold text-amber-500 hover:bg-amber-500/10 px-3 py-1.5 rounded-lg transition-all"
                >
                  View Students
                </button>
              </motion.div>
            )}

            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold text-white">System Analytics</h2>
              <button
                onClick={() => {
                  const csvHeader = "Metric,Value\n";
                  const csvRows = [
                    `Total Visits,${(attendance || []).length}`,
                    `In-Library Now,${(attendance || []).filter(a => !a.checkOut).length}`,
                    `Database Size,${(students || []).length}`,
                    "\nDetailed Attendance\n",
                    "Student,Ref No,Book/Purpose,Check In,Check Out,Date",
                    ...(attendance || []).map(a => `"${a.name}","${a.studentRef}","${a.purpose}","${a.checkIn}","${a.checkOut}","${a.date}"`)
                  ].join("\n");
                  const blob = new Blob([csvHeader + csvRows], { type: 'text/csv' });
                  const url = window.URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.setAttribute('href', url);
                  a.setAttribute('download', `umat_library_full_report_${format(new Date(), 'yyyy-MM-dd')}.csv`);
                  a.click();
                  showMsg('Full Report Exported');
                }}
                className="bg-emerald-600 hover:bg-emerald-500 text-white px-6 py-2 rounded-xl text-sm font-bold transition-all shadow-lg shadow-emerald-900/20"
              >
                Export Full Report (CSV)
              </button>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[
                { title: 'Guest Visits', value: guests.length, icon: Users, color: 'text-purple-500' },
                { title: 'In-Library', value: (attendance || []).filter(a => !a.checkOut).length, icon: LogIn, color: 'text-blue-500' },
                { title: 'Database Size', value: (students || []).length, icon: Users, color: 'text-amber-500' },
              ].map((stat, i) => (
                <div key={i} className="bg-[#141414] border border-[#2a2a2a] p-6 rounded-2xl flex items-center justify-between shadow-xl">
                  <div>
                    <p className="text-zinc-500 text-sm font-mono uppercase tracking-wider mb-1">{stat.title}</p>
                    <p className="text-3xl font-bold text-white">{stat.value}</p>
                  </div>
                  <div className={`p-4 rounded-xl bg-zinc-800/50 ${stat.color}`}>
                    <stat.icon className="w-8 h-8" />
                  </div>
                </div>
              ))}
            </div>

            <div className="grid lg:grid-cols-2 gap-8">
              <div className="bg-[#141414] border border-[#2a2a2a] p-6 rounded-2xl shadow-xl">
                <h3 className="text-white font-bold mb-6 flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-emerald-500" />
                  Attendance Trends (Last 7 Days)
                </h3>
                <div className="h-80 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={getTrendData()}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#2a2a2a" vertical={false} />
                      <XAxis dataKey="name" stroke="#52525b" fontSize={10} tickLine={false} axisLine={false} />
                      <YAxis stroke="#52525b" fontSize={10} tickLine={false} axisLine={false} />
                      <Tooltip
                        contentStyle={{ backgroundColor: '#1e1e1e', border: '1px solid #2a2a2a', borderRadius: '12px', fontSize: '12px' }}
                      />
                      <Legend verticalAlign="top" height={36} wrapperStyle={{ fontSize: '12px', color: '#a1a1aa' }} />
                      <Bar dataKey="Students" fill="#10b981" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="Guests" fill="#a855f7" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="bg-[#141414] border border-[#2a2a2a] p-6 rounded-2xl shadow-xl">
                <h3 className="text-white font-bold mb-6 flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-blue-500" />
                  Popular Resources / Purposes
                </h3>
                <div className="h-80 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={getPurposeData()} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" stroke="#2a2a2a" horizontal={false} />
                      <XAxis type="number" stroke="#52525b" fontSize={10} tickLine={false} axisLine={false} />
                      <YAxis dataKey="name" type="category" stroke="#52525b" fontSize={10} tickLine={false} axisLine={false} width={120} />
                      <Tooltip
                        contentStyle={{ backgroundColor: '#1e1e1e', border: '1px solid #2a2a2a', borderRadius: '12px', fontSize: '12px' }}
                      />
                      <Bar dataKey="value" fill="#3b82f6" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="bg-[#141414] border border-[#2a2a2a] p-6 rounded-2xl shadow-xl">
                <h3 className="text-white font-bold mb-6 flex items-center gap-2">
                  <Users className="w-5 h-5 text-amber-500" />
                  Distribution by Year
                </h3>
                <div className="h-80 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={getYearData()}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                        label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                      >
                        {getYearData().map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend verticalAlign="bottom" height={36} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="bg-[#141414] border border-[#2a2a2a] p-6 rounded-2xl shadow-xl">
                <h3 className="text-white font-bold mb-6 flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-indigo-500" />
                  Activity by Programme
                </h3>
                <div className="h-80 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={getProgrammeData()}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#2a2a2a" vertical={false} />
                      <XAxis dataKey="name" stroke="#52525b" fontSize={10} tickLine={false} axisLine={false} />
                      <YAxis stroke="#52525b" fontSize={10} tickLine={false} axisLine={false} />
                      <Tooltip
                        contentStyle={{ backgroundColor: '#1e1e1e', border: '1px solid #2a2a2a', borderRadius: '12px', fontSize: '12px' }}
                      />
                      <Bar dataKey="value" fill="#6366f1" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            <div className="bg-[#141414] border border-red-900/20 p-8 rounded-3xl shadow-2xl relative overflow-hidden mt-8">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-red-500/50 to-transparent"></div>
              <div className="flex flex-col md:flex-row justify-between items-center gap-6">
                <div className="flex items-center gap-6">
                  <div className="bg-red-500/10 p-4 rounded-2xl">
                    <AlertTriangle className="w-8 h-8 text-red-500" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white mb-1">Danger Zone</h3>
                    <p className="text-zinc-500 text-sm max-w-md">
                      Permanently delete all students and all attendance records. This action cannot be undone.
                    </p>
                  </div>
                </div>
                {userRole === 'SUPER_ADMIN' && (
                  <button
                    onClick={resetSystem}
                    className="bg-red-600/10 hover:bg-red-600 border border-red-600 text-red-500 hover:text-white px-8 py-4 rounded-2xl text-sm font-bold transition-all shadow-lg shadow-red-900/20 flex items-center gap-2"
                  >
                    <Trash2 className="w-4 h-4" /> Clear All Data
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        )}

        <AnimatePresence>
          {selectedStudent && (
            <StudentDetailModal
              student={selectedStudent}
              attendance={attendance}
              onClose={() => setSelectedStudent(null)}
              onUpdate={updateStudent}
              onDelete={deleteStudent}
              onDrop={dropStudent}
              deletingRef={deletingRef}
              userRole={userRole}
            />
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
