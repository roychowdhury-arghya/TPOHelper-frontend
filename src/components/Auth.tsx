import React, { useState } from 'react';
import { Shield, GraduationCap, ArrowRight, LogIn, UserPlus, Mail, Database, Eye, EyeOff, Lock, User, Percent, Star, AlertTriangle, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence, useMotionValue, useSpring } from 'framer-motion';
import type { Student } from '../mockData';
import { Logo } from './Logo';

interface AuthProps {
  students: Student[];
  onLogin: (role: 'student' | 'admin', studentId?: string) => void;
  onRegister: (newStudent: Student) => void;
  onSeedData: () => void;
}

export const Auth: React.FC<AuthProps> = ({ students, onLogin, onRegister, onSeedData }) => {
  const [activeTab, setActiveTab] = useState<'student' | 'admin'>('student');
  const [studentAuthMode, setStudentAuthMode] = useState<'login' | 'register'>('login');

  // Password visibility triggers
  const [showStudentPassword, setShowStudentPassword] = useState(false);
  const [showRegPassword, setShowRegPassword] = useState(false);
  const [showAdminPassword, setShowAdminPassword] = useState(false);

  // Caps Lock triggers
  const [capsLockActive, setCapsLockActive] = useState(false);

  // Remember me toggle
  const [rememberMe, setRememberMe] = useState(() => {
    return localStorage.getItem('tpo_remember_me') === 'true';
  });

  // Student Login Fields
  const [studentEmail, setStudentEmail] = useState(() => {
    return localStorage.getItem('tpo_saved_email') || '';
  });
  const [studentPassword, setStudentPassword] = useState(() => {
    return localStorage.getItem('tpo_saved_password') || '';
  });

  // Student Register Fields
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regBranch, setRegBranch] = useState<'Computer Science' | 'Information Technology' | 'Electronics' | 'Mechanical' | 'Electrical'>('Computer Science');
  const [regCgpa, setRegCgpa] = useState('8.0');
  const [regBacklogs, setRegBacklogs] = useState('0');
  const [regSkills, setRegSkills] = useState('React, TypeScript, JavaScript');
  const [regProjects, setRegProjects] = useState('2');
  const [regResume, setRegResume] = useState('Enthusiastic developer skilled in building frontend applications.');

  // Admin Credentials
  const [adminEmail, setAdminEmail] = useState('admin@university.edu');
  const [adminPassword, setAdminPassword] = useState('admin123');

  // Error/Success alert states
  const [error, setError] = useState('');
  const [forgotPasswordEmail, setForgotPasswordEmail] = useState('');
  const [showForgotModal, setShowForgotModal] = useState(false);

  // Detect Caps Lock state
  const handleKeyUp = (e: React.KeyboardEvent) => {
    if (e.getModifierState) {
      setCapsLockActive(e.getModifierState('CapsLock'));
    }
  };

  // Left Hero mouse tracking states with smooth Framer Motion spring physics
  const [heroMouse, setHeroMouse] = useState({ x: 0, y: 0, tiltX: 0, tiltY: 0 });
  const [isHoveringHero, setIsHoveringHero] = useState(false);

  const cursorX = useMotionValue(0);
  const cursorY = useMotionValue(0);

  // Configure high-performance, responsive springs (stiff start, soft drift deceleration)
  const springConfig = { damping: 30, stiffness: 220, mass: 0.6 };
  const cursorXSpring = useSpring(cursorX, springConfig);
  const cursorYSpring = useSpring(cursorY, springConfig);

  const handleHeroMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    cursorX.set(x);
    cursorY.set(y);

    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    const tiltX = ((x - centerX) / centerX) * 8;
    const tiltY = ((y - centerY) / centerY) * -8;
    setHeroMouse({ x, y, tiltX, tiltY });
    setIsHoveringHero(true);
  };

  const handleHeroMouseLeave = () => {
    setIsHoveringHero(false);
    setHeroMouse({ x: 0, y: 0, tiltX: 0, tiltY: 0 });
  };



  // Remember Me Persistence
  const handleStudentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (studentAuthMode === 'login') {
      const student = students.find(
        (s) => s.email.toLowerCase().trim() === studentEmail.toLowerCase().trim()
      );
      if (student && student.password === studentPassword) {
        if (rememberMe) {
          localStorage.setItem('tpo_remember_me', 'true');
          localStorage.setItem('tpo_saved_email', studentEmail);
          localStorage.setItem('tpo_saved_password', studentPassword);
        } else {
          localStorage.removeItem('tpo_remember_me');
          localStorage.removeItem('tpo_saved_email');
          localStorage.removeItem('tpo_saved_password');
        }
        onLogin('student', student.id);
      } else {
        setError('Invalid email or password. Click "Seed Placement Database" to load dummy accounts.');
      }
    } else {
      // Validate Registration Fields
      if (!regName.trim() || !regEmail.trim() || !regPassword) {
        setError('Please fill in all required fields.');
        return;
      }
      if (students.some((s) => s.email.toLowerCase().trim() === regEmail.toLowerCase().trim())) {
        setError('An account with this email already exists.');
        return;
      }
      const cgpaNum = parseFloat(regCgpa);
      if (isNaN(cgpaNum) || cgpaNum < 0 || cgpaNum > 10) {
        setError('CGPA must be a decimal value between 0 and 10.');
        return;
      }
      const backlogsNum = parseInt(regBacklogs);
      if (isNaN(backlogsNum) || backlogsNum < 0) {
        setError('Backlogs cannot be a negative count.');
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
        skills: regSkills.split(',').map((s) => s.trim()).filter(Boolean),
        projectsCount: parseInt(regProjects) || 0,
        resumeText: regResume.trim(),
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
    setError('');
    
    if (adminEmail.trim() === 'admin@university.edu' && adminPassword === 'admin123') {
      onLogin('admin');
    } else {
      setError('Access Denied. Ensure credentials match admin@university.edu / admin123.');
    }
  };

  const handleForgotPasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    alert(`A password reset link has been dispatched to: ${forgotPasswordEmail}`);
    setShowForgotModal(false);
    setForgotPasswordEmail('');
  };

  // Password strength meter calculation
  const getPasswordStrength = (pass: string) => {
    if (!pass) return { score: 0, label: '', color: 'bg-transparent' };
    let score = 0;
    if (pass.length >= 8) score += 1;
    if (/[A-Z]/.test(pass)) score += 1;
    if (/[0-9]/.test(pass)) score += 1;
    if (/[^A-Za-z0-9]/.test(pass)) score += 1;

    switch (score) {
      case 1:
        return { score: 25, label: 'Weak', color: 'bg-red-500' };
      case 2:
        return { score: 50, label: 'Fair', color: 'bg-amber-500' };
      case 3:
        return { score: 75, label: 'Good', color: 'bg-blue-500' };
      case 4:
        return { score: 100, label: 'Strong', color: 'bg-emerald-500' };
      default:
        return { score: 0, label: '', color: 'bg-transparent' };
    }
  };

  const strength = getPasswordStrength(regPassword);

  return (
    <div className="auth-layout selection:bg-blue-500/20 selection:text-white relative overflow-hidden">
      
      {/* Decorative Radial Grid & Ambient Glows */}
      <div className="ambient-glow">
        <div className="ambient-orb ambient-orb-1" />
        <div className="ambient-orb ambient-orb-2" />
        <div className="ambient-orb ambient-orb-3" />
      </div>
      <div className="grid-overlay" />

      {/* Left Column: Handcrafted Premium Hero Section */}
      <div 
        className="auth-hero relative z-10"
        onMouseMove={handleHeroMouseMove}
        onMouseLeave={handleHeroMouseLeave}
      >
        {/* Layer 2: Moving particles */}
        <div className="hero-particles">
          <div className="particle p1" />
          <div className="particle p2" />
          <div className="particle p3" />
          <div className="particle p4" />
          <div className="particle p5" />
        </div>

        {/* Layer 3: Interactive cursor glow */}
        {isHoveringHero && (
          <motion.div 
            className="hero-cursor-orb"
            style={{
              x: cursorXSpring,
              y: cursorYSpring,
              translateX: "-50%",
              translateY: "-50%",
              position: "absolute",
              left: 0,
              top: 0
            }}
          />
        )}

        {/* Top Header Logo */}
        <div className="flex items-center gap-2 scale-110 origin-left">
          <Logo size={42} showWordmark={true} />
        </div>

        {/* Hero Middle Content */}
        <div className="my-auto py-6">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold bg-blue-500/10 text-blue-400 rounded-full border border-blue-500/20 mb-6">
            <Star size={12} fill="currentColor" />
            University Placement Platform
          </span>
          <h1 className="text-3xl lg:text-4xl font-extrabold font-display leading-[1.1] text-white tracking-tight">
            Launch Your Career
          </h1>
          <p className="mt-3 text-blue-400 text-base font-semibold">
            Track. Prepare. Get Placed.
          </p>
          <p className="mt-2 text-slate-400 text-sm leading-relaxed max-w-sm">
            One platform connecting students, recruiters, and placement teams.
          </p>

          {/* Layer 4: 3D Centerpiece Visual */}
          <div className="hero-illustration">
            <motion.div 
              className="ecosystem-container"
              style={{
                transformStyle: "preserve-3d",
                perspective: 1000
              }}
              animate={{
                rotateY: isHoveringHero ? heroMouse.tiltX : 0,
                rotateX: isHoveringHero ? heroMouse.tiltY : 0,
                z: isHoveringHero ? 5 : 0
              }}
              transition={{ type: "spring", stiffness: 90, damping: 22 }}
            >
              {/* Opportunities Graph Connection Lines */}
              <svg className="pipeline-svg" viewBox="0 0 400 240" fill="none" xmlns="http://www.w3.org/2000/svg">
                <defs>
                  <linearGradient id="pipeline-grad" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="#2563EB" />
                    <stop offset="50%" stopColor="#8B5CF6" />
                    <stop offset="100%" stopColor="#14B8A6" />
                  </linearGradient>
                </defs>
                
                {/* SVG Connections */}
                <path d="M60 120 C 120 70, 160 170, 200 120" stroke="rgba(255,255,255,0.04)" strokeWidth="2" />
                <path d="M200 120 C 240 70, 280 170, 340 120" stroke="rgba(255,255,255,0.04)" strokeWidth="2" />
                <path d="M200 120 Q 270 50, 340 60" stroke="rgba(255,255,255,0.04)" strokeWidth="2" />
                
                {/* Active path particles tracing the curve */}
                <motion.path 
                  d="M60 120 C 120 70, 160 170, 200 120 C 240 70, 280 170, 340 120" 
                  stroke="url(#pipeline-grad)" 
                  strokeWidth="2" 
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  transition={{ duration: 6, repeat: Infinity, ease: "easeInOut", repeatType: "mirror" }}
                />
              </svg>

              {/* Floating Graph Nodes (Parallax Depth Layers) */}
              <div className="ecosystem-nodes">
                {/* Node 1: Students */}
                <motion.div 
                  className="ecosystem-node node-students"
                  style={{ translateZ: 40 }}
                  animate={{ y: [0, -4, 0] }}
                  transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
                  whileHover={{ scale: 1.05 }}
                >
                  <div className="node-glow glow-purple" />
                  <div className="node-dot bg-purple-500" />
                  <span className="node-label">Students</span>
                </motion.div>

                {/* Node 2: Skills */}
                <motion.div 
                  className="ecosystem-node node-skills"
                  style={{ translateZ: 20 }}
                  animate={{ y: [0, 4, 0] }}
                  transition={{ duration: 6, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
                  whileHover={{ scale: 1.05 }}
                >
                  <div className="node-glow glow-blue" />
                  <div className="node-dot bg-blue-500" />
                  <span className="node-label">Skills</span>
                </motion.div>

                {/* Node 3: Opportunities */}
                <motion.div 
                  className="ecosystem-node node-opportunities"
                  style={{ translateZ: 30 }}
                  animate={{ y: [0, -3, 0] }}
                  transition={{ duration: 5.5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
                  whileHover={{ scale: 1.05 }}
                >
                  <div className="node-glow glow-teal" />
                  <div className="node-dot bg-teal-500" />
                  <span className="node-label">Opportunities</span>
                </motion.div>

                {/* Node 4: Placement */}
                <motion.div 
                  className="ecosystem-node node-placement"
                  style={{ translateZ: 50 }}
                  animate={{ y: [0, 3, 0] }}
                  transition={{ duration: 4.5, repeat: Infinity, ease: "easeInOut", delay: 1.5 }}
                  whileHover={{ scale: 1.05 }}
                >
                  <div className="node-glow glow-emerald" />
                  <div className="node-dot bg-emerald-500" />
                  <span className="node-label">Placement</span>
                </motion.div>
              </div>
            </motion.div>
          </div>
        </div>

        {/* Seed helper triggers */}
        <div className="pt-6 border-t border-slate-900/60 flex flex-col gap-3">
          <p className="text-[10px] text-slate-500 leading-normal">
            Evaluating the system? Seed mock students, companies, and candidate pipelines instantly.
          </p>
          <button
            onClick={onSeedData}
            type="button"
            className="btn-seed w-full sm:w-fit"
          >
            <Database size={14} className="text-teal-400" />
            Seed Placement Database
          </button>
        </div>
      </div>

      {/* Right Column: Clean Responsive Auth Card Forms */}
      <div className="auth-form-container">
        
        <div className="auth-card">
          
          {/* Active Role Selector Tab */}
          <div className="auth-tab-group">
            <button
              onClick={() => {
                setActiveTab('student');
                setError('');
              }}
              className={`auth-tab-btn flex items-center gap-2 ${activeTab === 'student' ? 'active' : ''}`}
            >
              <GraduationCap size={16} />
              Student Portal
            </button>
            <button
              onClick={() => {
                setActiveTab('admin');
                setError('');
              }}
              className={`auth-tab-btn flex items-center gap-2 ${activeTab === 'admin' ? 'active' : ''}`}
            >
              <Shield size={16} />
              Coordinator Portal
            </button>
          </div>

          {/* Form Error Alert */}
          {error && (
            <div className="alert-box alert-error">
              <AlertCircle size={16} />
              <span>{error}</span>
            </div>
          )}

          {/* Caps Lock Alert */}
          {capsLockActive && (
            <div className="alert-box alert-warning">
              <AlertTriangle size={14} className="animate-bounce" />
              <span>Warning: Caps Lock is active.</span>
            </div>
          )}

          {/* Tab Views */}
          <AnimatePresence mode="wait">
            {activeTab === 'student' ? (
              <motion.div
                key="student-panel"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
              >
                {/* Sign-in vs Register switch */}
                <div className="auth-mode-switch">
                  <button
                    onClick={() => {
                      setStudentAuthMode('login');
                      setError('');
                    }}
                    className={`auth-mode-btn ${studentAuthMode === 'login' ? 'active' : ''}`}
                  >
                    Sign In
                  </button>
                  <button
                    onClick={() => {
                      setStudentAuthMode('register');
                      setError('');
                    }}
                    className={`auth-mode-btn ${studentAuthMode === 'register' ? 'active' : ''}`}
                  >
                    Register Profile
                  </button>
                </div>

                {/* Form fields */}
                <form onSubmit={handleStudentSubmit} onKeyUp={handleKeyUp} className="flex flex-col gap-4">
                  {studentAuthMode === 'login' ? (
                    <>
                      <div className="field-container">
                        <label className="field-label">Email Address</label>
                        <div className="input-wrapper">
                          <Mail size={16} />
                          <input
                            type="email"
                            required
                            value={studentEmail}
                            onChange={(e) => setStudentEmail(e.target.value)}
                            placeholder="aravind.sharma@univ.edu"
                          />
                        </div>
                      </div>

                      <div className="field-container">
                        <div className="flex justify-between items-center">
                          <label className="field-label">Password</label>
                          <button
                            type="button"
                            onClick={() => setShowForgotModal(true)}
                            className="text-[11px] text-blue-400 hover:underline font-medium"
                          >
                            Forgot Password?
                          </button>
                        </div>
                        <div className="input-wrapper">
                          <Lock size={16} />
                          <input
                            type={showStudentPassword ? 'text' : 'password'}
                            required
                            value={studentPassword}
                            onChange={(e) => setStudentPassword(e.target.value)}
                            placeholder="••••••••"
                          />
                          <button
                            type="button"
                            onClick={() => setShowStudentPassword(!showStudentPassword)}
                            className="password-toggle"
                          >
                            {showStudentPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                          </button>
                        </div>
                      </div>

                      {/* Remember me trigger */}
                      <div className="flex items-center mb-2">
                        <input
                          id="remember-me"
                          type="checkbox"
                          checked={rememberMe}
                          onChange={(e) => setRememberMe(e.target.checked)}
                          className="w-4 h-4 rounded border-slate-800 text-blue-600 bg-slate-950 focus:ring-blue-500 focus:ring-offset-slate-900"
                        />
                        <label htmlFor="remember-me" className="ml-2.5 text-xs text-slate-400 font-medium cursor-pointer">
                          Remember my profile on this device
                        </label>
                      </div>

                      <button
                        type="submit"
                        className="btn-submit mt-2"
                      >
                        Sign In as Student
                        <ArrowRight size={16} />
                      </button>
                    </>
                  ) : (
                    // Registration Panels
                    <div className="scroll-container flex flex-col gap-4">
                      
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="field-container mb-0">
                          <label className="field-label">Full Name</label>
                          <div className="input-wrapper">
                            <User size={14} />
                            <input
                              type="text"
                              required
                              value={regName}
                              onChange={(e) => setRegName(e.target.value)}
                              placeholder="Aravind Sharma"
                              style={{ paddingLeft: '34px', paddingRight: '12px', fontSize: '0.8rem' }}
                            />
                          </div>
                        </div>

                        <div className="field-container mb-0">
                          <label className="field-label">Email Address</label>
                          <div className="input-wrapper">
                            <Mail size={14} />
                            <input
                              type="email"
                              required
                              value={regEmail}
                              onChange={(e) => setRegEmail(e.target.value)}
                              placeholder="student@univ.edu"
                              style={{ paddingLeft: '34px', paddingRight: '12px', fontSize: '0.8rem' }}
                            />
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="field-container mb-0">
                          <label className="field-label">Password</label>
                          <div className="input-wrapper">
                            <Lock size={14} />
                            <input
                              type={showRegPassword ? 'text' : 'password'}
                              required
                              value={regPassword}
                              onChange={(e) => setRegPassword(e.target.value)}
                              placeholder="••••••••"
                              style={{ paddingLeft: '34px', paddingRight: '32px', fontSize: '0.8rem' }}
                            />
                            <button
                              type="button"
                              onClick={() => setShowRegPassword(!showRegPassword)}
                              className="password-toggle"
                            >
                              {showRegPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                            </button>
                          </div>
                          
                          {/* Strength Bar */}
                          {regPassword && (
                            <div className="mt-1 flex flex-col gap-1">
                              <div className="flex justify-between items-center text-[9px] font-bold">
                                <span className="text-slate-500">Security Index:</span>
                                <span className="text-slate-300">{strength.label}</span>
                              </div>
                              <div className="h-1 w-full bg-slate-950 rounded-full overflow-hidden">
                                <div className={`h-full transition-all duration-300 ${strength.color}`} style={{ width: `${strength.score}%` }} />
                              </div>
                            </div>
                          )}
                        </div>

                        <div className="field-container mb-0">
                          <label className="field-label">Branch Sector</label>
                          <div className="input-wrapper">
                            <select
                              value={regBranch}
                              onChange={(e) => setRegBranch(e.target.value as Student['branch'])}
                              style={{ paddingLeft: '12px', fontSize: '0.8rem' }}
                            >
                              <option value="Computer Science">Computer Science</option>
                              <option value="Information Technology">Information Technology</option>
                              <option value="Electronics">Electronics</option>
                              <option value="Mechanical">Mechanical</option>
                              <option value="Electrical">Electrical</option>
                            </select>
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-3">
                        <div className="field-container mb-0">
                          <label className="field-label flex items-center gap-1">
                            <Percent size={10} className="text-slate-500" />
                            CGPA
                          </label>
                          <div className="input-wrapper">
                            <input
                              type="number"
                              step="0.01"
                              required
                              min="0"
                              max="10"
                              value={regCgpa}
                              onChange={(e) => setRegCgpa(e.target.value)}
                              placeholder="8.50"
                              style={{ paddingLeft: '12px', fontSize: '0.8rem' }}
                            />
                          </div>
                        </div>

                        <div className="field-container mb-0">
                          <label className="field-label">Backlogs</label>
                          <div className="input-wrapper">
                            <input
                              type="number"
                              required
                              min="0"
                              value={regBacklogs}
                              onChange={(e) => setRegBacklogs(e.target.value)}
                              placeholder="0"
                              style={{ paddingLeft: '12px', fontSize: '0.8rem' }}
                            />
                          </div>
                        </div>

                        <div className="field-container mb-0">
                          <label className="field-label">Projects</label>
                          <div className="input-wrapper">
                            <input
                              type="number"
                              required
                              min="0"
                              value={regProjects}
                              onChange={(e) => setRegProjects(e.target.value)}
                              placeholder="2"
                              style={{ paddingLeft: '12px', fontSize: '0.8rem' }}
                            />
                          </div>
                        </div>
                      </div>

                      <div className="field-container mb-0">
                        <label className="field-label">Keywords & Skills (comma-separated)</label>
                        <div className="input-wrapper">
                          <input
                            type="text"
                            required
                            value={regSkills}
                            onChange={(e) => setRegSkills(e.target.value)}
                            placeholder="React, TypeScript, SQL, Node.js"
                            style={{ paddingLeft: '12px', fontSize: '0.8rem' }}
                          />
                        </div>
                      </div>

                      <div className="field-container mb-0">
                        <label className="field-label">Resume Plain Text Summary</label>
                        <div className="input-wrapper">
                          <textarea
                            rows={3}
                            required
                            value={regResume}
                            onChange={(e) => setRegResume(e.target.value)}
                            placeholder="Dedicated developer skilled in building responsive frontend apps..."
                            style={{ padding: '10px 12px', fontSize: '0.8rem', height: 'auto' }}
                          />
                        </div>
                      </div>

                      <button
                        type="submit"
                        className="btn-submit mt-2 shrink-0"
                      >
                        Register Candidate Profile
                        <UserPlus size={14} />
                      </button>
                    </div>
                  )}
                </form>
              </motion.div>
            ) : (
              // Coordinator Admin Portal Panel
              <motion.div
                key="admin-panel"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
              >
                <form onSubmit={handleAdminSubmit} onKeyUp={handleKeyUp} className="flex flex-col gap-4">
                  <div className="field-container">
                    <label className="field-label">TPO Coordinator Email</label>
                    <div className="input-wrapper">
                      <Mail size={16} />
                      <input
                        type="email"
                        required
                        value={adminEmail}
                        onChange={(e) => setAdminEmail(e.target.value)}
                        placeholder="admin@university.edu"
                      />
                    </div>
                  </div>

                  <div className="field-container">
                    <label className="field-label">System Password</label>
                    <div className="input-wrapper">
                      <Lock size={16} />
                      <input
                        type={showAdminPassword ? 'text' : 'password'}
                        required
                        value={adminPassword}
                        onChange={(e) => setAdminPassword(e.target.value)}
                        placeholder="••••••••"
                      />
                      <button
                        type="button"
                        onClick={() => setShowAdminPassword(!showAdminPassword)}
                        className="password-toggle"
                      >
                        {showAdminPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>

                  {/* Seed hint card */}
                  <div className="p-3.5 bg-slate-950/60 border border-slate-900/60 rounded-lg text-[10px] leading-relaxed text-slate-500 font-semibold uppercase tracking-wider flex flex-col gap-1.5">
                    <div className="flex justify-between items-center text-slate-400">
                      <span>Default Admin:</span>
                      <span className="font-mono text-white select-all">admin@university.edu</span>
                    </div>
                    <div className="flex justify-between items-center text-slate-400">
                      <span>Default Password:</span>
                      <span className="font-mono text-white select-all">admin123</span>
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="btn-submit mt-2"
                  >
                    Authenticate Admin
                    <LogIn size={16} />
                  </button>
                </form>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Forgot Password Modal */}
      <AnimatePresence>
        {showForgotModal && (
          <div className="modal-overlay">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowForgotModal(false)}
              className="absolute inset-0"
            />
            
            {/* Modal Body */}
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="modal-content"
            >
              <h3 className="modal-title">Reset Password</h3>
              <p className="modal-body">
                Provide your registered university email below and we will dispatch code links to reset your credentials.
              </p>
              
              <form onSubmit={handleForgotPasswordSubmit} className="flex flex-col gap-4">
                <div className="field-container mb-0">
                  <label className="field-label">Student Email</label>
                  <div className="input-wrapper">
                    <Mail size={16} />
                    <input
                      type="email"
                      required
                      value={forgotPasswordEmail}
                      onChange={(e) => setForgotPasswordEmail(e.target.value)}
                      placeholder="name@univ.edu"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2 mt-4">
                  <button
                    type="button"
                    onClick={() => setShowForgotModal(false)}
                    className="btn btn-secondary btn-sm"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn-submit"
                    style={{ width: 'auto', height: '36px', padding: '0 16px', fontSize: '0.8rem', boxShadow: 'none' }}
                  >
                    Send Reset Link
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
};
