import React, { useState } from 'react';
import { Shield, GraduationCap, ArrowRight, LogIn, UserPlus, Database } from 'lucide-react';
import type { Student } from '../mockData';

interface AuthProps {
  students: Student[];
  onLogin: (role: 'student' | 'admin', studentId?: string) => void;
  onRegister: (newStudent: Student) => void;
  onSeedData: () => void;
}

export const Auth: React.FC<AuthProps> = ({ students, onLogin, onRegister, onSeedData }) => {
  const [activeTab, setActiveTab] = useState<'student' | 'admin'>('student');
  const [studentAuthMode, setStudentAuthMode] = useState<'login' | 'register'>('login');
  
  // Student Login Fields
  const [studentEmail, setStudentEmail] = useState('');
  const [studentPassword, setStudentPassword] = useState('');
  
  // Student Register Fields
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regBranch, setRegBranch] = useState<'Computer Science' | 'Information Technology' | 'Electronics' | 'Mechanical' | 'Electrical'>('Computer Science');
  const [regCgpa, setRegCgpa] = useState('8.0');
  const [regBacklogs, setRegBacklogs] = useState('0');
  const [regSkills, setRegSkills] = useState('React, TypeScript, JavaScript');
  const [regProjects, setRegProjects] = useState('2');
  const [regResume, setRegResume] = useState('Enthusiastic developer skilled in frontend applications.');

  // Admin Credentials
  const [adminEmail, setAdminEmail] = useState('admin@university.edu');
  const [adminPassword, setAdminPassword] = useState('admin123');
  
  const [error, setError] = useState('');

  const handleStudentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (studentAuthMode === 'login') {
      const student = students.find(
        (s) => s.email.toLowerCase().trim() === studentEmail.toLowerCase().trim()
      );
      if (student && student.password === studentPassword) {
        setError('');
        onLogin('student', student.id);
      } else {
        setError('Invalid student credentials. Please check email/password.');
      }
    } else {
      // Validate registration
      if (!regName || !regEmail || !regPassword) {
        setError('Please fill in all required fields.');
        return;
      }
      if (students.some((s) => s.email.toLowerCase().trim() === regEmail.toLowerCase().trim())) {
        setError('A student with this email is already registered.');
        return;
      }
      const cgpaNum = parseFloat(regCgpa);
      if (isNaN(cgpaNum) || cgpaNum < 0 || cgpaNum > 10) {
        setError('CGPA must be a number between 0 and 10.');
        return;
      }
      const backlogsNum = parseInt(regBacklogs);
      if (isNaN(backlogsNum) || backlogsNum < 0) {
        setError('Backlogs cannot be negative.');
        return;
      }

      const newStudent: Student = {
        id: `std_${Math.random().toString(36).substr(2, 9)}`,
        name: regName.trim(),
        email: regEmail.trim(),
        password: regPassword,
        branch: regBranch,
        cgpa: cgpaNum,
        backlogs: backlogsNum,
        placementStatus: 'Unplaced',
        resumeScore: 0,
        skills: regSkills.split(',').map(s => s.trim()).filter(Boolean),
        projectsCount: parseInt(regProjects) || 0,
        resumeText: regResume,
        applications: []
      };

      onRegister(newStudent);
      setStudentEmail(newStudent.email);
      setStudentPassword(newStudent.password || '');
      setStudentAuthMode('login');
      setError('');
    }
  };

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

      <div className="glass-card animate-slide-in w-full max-w-lg p-8 relative overflow-hidden" style={{ borderTop: '4px solid hsl(var(--color-primary))' }}>
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
            {/* Student Auth Mode Switcher */}
            <div className="flex gap-4 border-b border-white/5 pb-4 mb-4">
              <button
                type="button"
                onClick={() => { setStudentAuthMode('login'); setError(''); }}
                className={`text-xs font-semibold pb-1 border-b-2 transition-all ${
                  studentAuthMode === 'login'
                    ? 'border-indigo-500 text-white'
                    : 'border-transparent text-gray-500 hover:text-gray-300'
                }`}
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => { setStudentAuthMode('register'); setError(''); }}
                className={`text-xs font-semibold pb-1 border-b-2 transition-all ${
                  studentAuthMode === 'register'
                    ? 'border-indigo-500 text-white'
                    : 'border-transparent text-gray-500 hover:text-gray-300'
                }`}
              >
                New Account Registration
              </button>
            </div>

            <form onSubmit={handleStudentSubmit} className="flex flex-col gap-1.5">
              {studentAuthMode === 'login' ? (
                <>
                  <div className="input-group">
                    <label className="input-label">Student Email</label>
                    <input
                      type="email"
                      required
                      value={studentEmail}
                      onChange={(e) => setStudentEmail(e.target.value)}
                      placeholder="student@univ.edu"
                      className="input-field"
                    />
                  </div>

                  <div className="input-group">
                    <label className="input-label">Password</label>
                    <input
                      type="password"
                      required
                      value={studentPassword}
                      onChange={(e) => setStudentPassword(e.target.value)}
                      placeholder="••••••••"
                      className="input-field"
                    />
                  </div>

                  <button type="submit" className="btn btn-primary w-full py-3 mt-2">
                    Sign In as Student
                    <ArrowRight size={18} />
                  </button>
                </>
              ) : (
                <div className="max-h-[400px] overflow-y-auto pr-1 flex flex-col gap-2">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="input-group">
                      <label className="input-label">Full Name</label>
                      <input
                        type="text"
                        required
                        value={regName}
                        onChange={(e) => setRegName(e.target.value)}
                        placeholder="Aravind Sharma"
                        className="input-field"
                      />
                    </div>
                    <div className="input-group">
                      <label className="input-label">Email Address</label>
                      <input
                        type="email"
                        required
                        value={regEmail}
                        onChange={(e) => setRegEmail(e.target.value)}
                        placeholder="aravind@univ.edu"
                        className="input-field"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="input-group">
                      <label className="input-label">Password</label>
                      <input
                        type="password"
                        required
                        value={regPassword}
                        onChange={(e) => setRegPassword(e.target.value)}
                        placeholder="••••••••"
                        className="input-field"
                      />
                    </div>
                    <div className="input-group">
                      <label className="input-label">Branch</label>
                      <select
                        value={regBranch}
                        onChange={(e: any) => setRegBranch(e.target.value)}
                        className="input-field"
                      >
                        <option value="Computer Science">Computer Science</option>
                        <option value="Information Technology">Information Technology</option>
                        <option value="Electronics">Electronics</option>
                        <option value="Mechanical">Mechanical</option>
                        <option value="Electrical">Electrical</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="input-group">
                      <label className="input-label">CGPA</label>
                      <input
                        type="number"
                        step="0.01"
                        required
                        value={regCgpa}
                        onChange={(e) => setRegCgpa(e.target.value)}
                        placeholder="8.5"
                        min="0"
                        max="10"
                        className="input-field"
                      />
                    </div>
                    <div className="input-group">
                      <label className="input-label">Backlogs</label>
                      <input
                        type="number"
                        required
                        value={regBacklogs}
                        onChange={(e) => setRegBacklogs(e.target.value)}
                        placeholder="0"
                        min="0"
                        className="input-field"
                      />
                    </div>
                    <div className="input-group">
                      <label className="input-label">Projects Count</label>
                      <input
                        type="number"
                        required
                        value={regProjects}
                        onChange={(e) => setRegProjects(e.target.value)}
                        placeholder="2"
                        min="0"
                        className="input-field"
                      />
                    </div>
                  </div>

                  <div className="input-group">
                    <label className="input-label">Skills (comma-separated)</label>
                    <input
                      type="text"
                      required
                      value={regSkills}
                      onChange={(e) => setRegSkills(e.target.value)}
                      placeholder="React, TypeScript, SQL"
                      className="input-field"
                    />
                  </div>

                  <div className="input-group">
                    <label className="input-label">Resume Plain Text summary</label>
                    <textarea
                      rows={3}
                      required
                      value={regResume}
                      onChange={(e) => setRegResume(e.target.value)}
                      placeholder="Summary of experience and projects..."
                      className="input-field resize-none text-xs"
                    ></textarea>
                  </div>

                  <button type="submit" className="btn btn-primary w-full py-3 mt-2 shrink-0">
                    Register Profile
                    <UserPlus size={18} />
                  </button>
                </div>
              )}
            </form>
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

        {/* Demo Database Seeder banner */}
        <div className="mt-6 pt-4 border-t border-white/5 flex flex-col items-center gap-3">
          <p className="text-[10px] text-gray-500 text-center leading-relaxed">
            Evaluation Mode: Start with a clean system, or seed the interactive placement database instantly.
          </p>
          <button
            type="button"
            onClick={onSeedData}
            className="btn btn-secondary btn-sm flex items-center gap-2 text-indigo-300 hover:text-indigo-200 border-indigo-500/20 hover:border-indigo-500/40"
          >
            <Database size={14} />
            Seed Sample Data
          </button>
        </div>
      </div>
    </div>
  );
};
