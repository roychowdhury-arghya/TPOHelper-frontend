import React, { useState } from 'react';
import { Shield, GraduationCap, ArrowRight, LogIn } from 'lucide-react';
import type { Student } from '../mockData';

interface AuthProps {
  students: Student[];
  onLogin: (role: 'student' | 'admin', targetId?: string) => void;
}

export const Auth: React.FC<AuthProps> = ({ students, onLogin }) => {
  const [activeTab, setActiveTab] = useState<'student' | 'admin'>('student');
  const [selectedStudentId, setSelectedStudentId] = useState(students[1]?.id || ''); // Default to Rohan (unplaced)
  const [adminEmail, setAdminEmail] = useState('admin@university.edu');
  const [adminPassword, setAdminPassword] = useState('admin123');
  const [error, setError] = useState('');

  const handleAdminSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (adminEmail === 'admin@university.edu' && adminPassword === 'admin123') {
      setError('');
      onLogin('admin');
    } else {
      setError('Invalid admin credentials. Use: admin@university.edu / admin123');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative" style={{ zIndex: 10 }}>
      {/* Background glow effects built into page */}
      <div className="bg-glow-container">
        <div className="bg-glow-orb bg-glow-orb-1"></div>
        <div className="bg-glow-orb bg-glow-orb-2"></div>
      </div>

      <div className="glass-card animate-slide-in w-full max-w-md p-8 relative overflow-hidden" style={{ borderTop: '4px solid hsl(var(--color-primary))' }}>
        {/* Decorative elements */}
        <div className="absolute -top-10 -right-10 w-24 h-24 bg-indigo-500/10 rounded-full blur-xl"></div>
        
        {/* Title Section */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center p-3 bg-indigo-500/15 rounded-2xl text-indigo-400 mb-3 shadow-[0_0_20px_rgba(99,102,241,0.2)]">
            <GraduationCap size={32} />
          </div>
          <h1 className="text-2xl font-bold text-white font-display">TPOHelper</h1>
          <p className="text-sm text-gray-400 mt-1">University Placement & Training Portal</p>
        </div>

        {/* Auth Role Tabs */}
        <div className="flex bg-black/30 p-1 rounded-xl mb-6 border border-white/5">
          <button
            onClick={() => { setActiveTab('student'); setError(''); }}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all ${
              activeTab === 'student'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-gray-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <GraduationCap size={16} />
            Student View
          </button>
          <button
            onClick={() => { setActiveTab('admin'); setError(''); }}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all ${
              activeTab === 'admin'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-gray-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Shield size={16} />
            TPO Admin
          </button>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-500/10 border border-red-500/30 text-red-200 text-xs rounded-lg p-3 mb-4 flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse"></span>
            {error}
          </div>
        )}

        {/* Tab Content */}
        {activeTab === 'student' ? (
          <div className="animate-slide-in">
            <div className="mb-6 bg-indigo-500/5 border border-indigo-500/10 rounded-xl p-4">
              <h3 className="text-sm font-semibold text-white mb-2 font-display">Quick Evaluator Bypass</h3>
              <p className="text-xs text-gray-400 leading-relaxed mb-3">
                Since this is the frontend part, select any mock student profile below to log in and preview their specific eligibility, dashboard, and interview state.
              </p>
              
              <div className="input-group">
                <label className="input-label">Select Student Profile</label>
                <select
                  value={selectedStudentId}
                  onChange={(e) => setSelectedStudentId(e.target.value)}
                  className="input-field"
                >
                  {students.map((student) => (
                    <option key={student.id} value={student.id}>
                      {student.name} ({student.branch} - CGPA: {student.cgpa}) {student.placementStatus === 'Placed' ? '✅ Placed' : '⏳ Pending'}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <button
              onClick={() => onLogin('student', selectedStudentId)}
              className="btn btn-primary w-full py-3 mt-2"
            >
              Sign In as Student
              <ArrowRight size={18} />
            </button>
          </div>
        ) : (
          <form onSubmit={handleAdminSubmit} className="animate-slide-in">
            <div className="input-group">
              <label className="input-label">Admin Email Address</label>
              <input
                type="email"
                required
                value={adminEmail}
                onChange={(e) => setAdminEmail(e.target.value)}
                placeholder="admin@university.edu"
                className="input-field"
              />
            </div>

            <div className="input-group">
              <label className="input-label">Admin Password</label>
              <input
                type="password"
                required
                value={adminPassword}
                onChange={(e) => setAdminPassword(e.target.value)}
                placeholder="••••••••"
                className="input-field"
              />
            </div>

            <div className="mt-4 mb-6 bg-white/5 border border-white/10 rounded-lg p-3 text-xs text-gray-400 flex flex-col gap-1">
              <div className="flex justify-between">
                <span>Default Admin Email:</span>
                <span className="font-mono text-white font-medium">admin@university.edu</span>
              </div>
              <div className="flex justify-between">
                <span>Default Password:</span>
                <span className="font-mono text-white font-medium">admin123</span>
              </div>
            </div>

            <button
              type="submit"
              className="btn btn-primary w-full py-3"
            >
              Authenticate Admin
              <LogIn size={18} />
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
