import React, { useState } from 'react';
import {
  LayoutDashboard,
  Briefcase,
  Users,
  GitMerge,
  Plus,
  Search,
  X,
  ShieldCheck,
  Award,
  ChevronLeft,
  ChevronRight,
  UserCheck,
  TrendingUp,
  Clock
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { DashboardShell } from './DashboardShell';
import type { Student, PlacementDrive } from '../mockData';
import type { AppNotification } from './NotificationCenter';

interface AdminPortalProps {
  students: Student[];
  drives: PlacementDrive[];
  onLogout: () => void;
  onAddDrive: (drive: Omit<PlacementDrive, 'id' | 'registeredCount'>) => void;
  onToggleDriveActive: (driveId: string) => void;
  onUpdateStudentStatus: (studentId: string, company?: string, salaryPackage?: string) => void;
  onPromoteStudent: (studentId: string, driveId: string, newRoundIndex: number, isFinalSelection: boolean) => void;
  onRejectStudent: (studentId: string, driveId: string) => void;
  notifications: AppNotification[];
  onMarkAsRead: (id: string) => void;
  onMarkAllAsRead: () => void;
  onClearNotification: (id: string) => void;
  onClearAll: () => void;
  theme: 'light' | 'dark';
  toggleTheme: () => void;
}

export const AdminPortal: React.FC<AdminPortalProps> = ({
  students,
  drives,
  onLogout,
  onAddDrive,
  onToggleDriveActive,
  onUpdateStudentStatus,
  onPromoteStudent,
  onRejectStudent,
  notifications,
  onMarkAsRead,
  onMarkAllAsRead,
  onClearNotification,
  onClearAll,
  theme,
  toggleTheme
}) => {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'drives' | 'students' | 'tracker'>('dashboard');

  // Multi-step Campaign Launcher State
  const [showDriveForm, setShowDriveForm] = useState(false);
  const [formStep, setFormStep] = useState(1); // 1: Basic Info, 2: Eligibility, 3: Rounds, 4: Skills
  
  // Launcher Form Fields
  const [companyName, setCompanyName] = useState('');
  const [role, setRole] = useState('');
  const [pkg, setPkg] = useState('');
  const [numericPkg, setNumericPkg] = useState(6);
  const [cgpaCutoff, setCgpaCutoff] = useState(7.0);
  const [maxBacklogs, setMaxBacklogs] = useState(0);
  const [allowedBranches, setAllowedBranches] = useState<string[]>(['Computer Science', 'Information Technology']);
  const [deadline, setDeadline] = useState('2026-06-30');
  const [jobDesc, setJobDesc] = useState('');
  const [skillsRequiredText, setSkillsRequiredText] = useState('React, JavaScript, Node.js');
  
  // Dynamic custom rounds constructor list
  const [roundsList, setRoundsList] = useState<string[]>(['Online Coding Test', 'Technical Round 1', 'HR Interview']);
  const [newRoundInput, setNewRoundInput] = useState('');

  // Student Database Filter & Pagination State
  const [studentSearch, setStudentSearch] = useState('');
  const [branchFilter, setBranchFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [minCgpaFilter, setMinCgpaFilter] = useState(5.0);
  const [maxBacklogsFilter] = useState(3);
  
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;

  // Selected student for slide-out drawer
  const [selectedStudentForDrawer, setSelectedStudentForDrawer] = useState<Student | null>(null);

  // Manual Placed Override States
  const [statusOverrideStudentId, setStatusOverrideStudentId] = useState<string | null>(null);
  const [placedCompanyInput, setPlacedCompanyInput] = useState('');
  const [placedPackageInput, setPlacedPackageInput] = useState('');

  // Live Round Tracker Selection
  const [trackerDriveId, setTrackerDriveId] = useState<string>(() => {
    return drives[0]?.id || '';
  });

  // Drag and Drop State Helper
  const [draggedStudentId, setDraggedStudentId] = useState<string | null>(null);

  // Kanban Drag Events
  const handleDragStart = (e: React.DragEvent, studentId: string) => {
    setDraggedStudentId(studentId);
    e.dataTransfer.setData('text/plain', studentId);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDropColumn = (e: React.DragEvent, targetRoundIndex: number, isFinal: boolean, isReject: boolean) => {
    e.preventDefault();
    const studentId = e.dataTransfer.getData('text/plain') || draggedStudentId;
    if (!studentId || !trackerDriveId) return;

    if (isReject) {
      onRejectStudent(studentId, trackerDriveId);
    } else {
      onPromoteStudent(studentId, trackerDriveId, targetRoundIndex, isFinal);
    }
    setDraggedStudentId(null);
  };

  // Computations for KPI Dashboard Analytics
  const totalStudentsCount = students.length;
  const placedStudents = students.filter(s => s.placementStatus === 'Placed');
  const placedCount = placedStudents.length;
  const placementRate = totalStudentsCount > 0 ? Math.round((placedCount / totalStudentsCount) * 100) : 0;
  const activeDrivesCount = drives.filter(d => d.active).length;

  const totalPackageSum = placedStudents.reduce((sum, s) => {
    if (!s.placedPackage) return sum;
    const num = parseFloat(s.placedPackage.replace(/[^\d.]/g, ''));
    return sum + (isNaN(num) ? 0 : num);
  }, 0);
  const averagePackage = placedCount > 0 ? (totalPackageSum / placedCount).toFixed(1) : '0.0';

  // Compute Branch Placement Distribution (For Custom SVG Bar Charts)
  const branches = ['Computer Science', 'Information Technology', 'Electronics', 'Mechanical', 'Electrical'];
  const branchData = branches.map(br => {
    const branchStudents = students.filter(s => s.branch === br);
    const branchPlaced = branchStudents.filter(s => s.placementStatus === 'Placed');
    const pct = branchStudents.length > 0 ? Math.round((branchPlaced.length / branchStudents.length) * 100) : 0;
    return { name: br, pct, total: branchStudents.length, placed: branchPlaced.length };
  });

  // Calculate Funnel Metrics
  const getFunnelMetrics = () => {
    // Stage counts across all student applications
    let appliedCount = 0;
    let testedCount = 0;
    let interviewedCount = 0;
    let selectedCount = 0;

    students.forEach(s => {
      s.applications.forEach(app => {
        appliedCount += 1;
        if (app.currentRoundIndex >= 1) testedCount += 1;
        if (app.currentRoundIndex >= 2) interviewedCount += 1;
        if (app.status === 'Selected') selectedCount += 1;
      });
    });

    return { appliedCount, testedCount, interviewedCount, selectedCount };
  };
  const funnelMetrics = getFunnelMetrics();

  // Top Recruiters Placement share list
  const getTopRecruiters = () => {
    const counts: { [company: string]: number } = {};
    placedStudents.forEach(s => {
      if (s.placedCompany) {
        counts[s.placedCompany] = (counts[s.placedCompany] || 0) + 1;
      }
    });

    return Object.entries(counts)
      .map(([company, count]) => ({ company, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 4);
  };
  const topRecruiters = getTopRecruiters();

  // Add customized round to campaign launcher form
  const handleAddRound = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRoundInput.trim()) return;
    const round = newRoundInput.trim();
    if (!roundsList.includes(round)) {
      setRoundsList([...roundsList, round]);
    }
    setNewRoundInput('');
  };

  const handleRemoveRound = (roundToRemove: string) => {
    if (roundsList.length <= 1) {
      alert('Recruitment pipeline must contain at least one evaluation round.');
      return;
    }
    setRoundsList(roundsList.filter(r => r !== roundToRemove));
  };

  // Handle new drive submission
  const handleDriveSubmit = () => {
    if (!companyName.trim() || !role.trim() || !pkg.trim()) return;

    onAddDrive({
      companyName: companyName.trim(),
      role: role.trim(),
      package: pkg.includes('LPA') ? pkg.trim() : `${pkg.trim()} LPA`,
      numericPackage: Number(numericPkg),
      cgpaCutoff: Number(cgpaCutoff),
      maxBacklogs: Number(maxBacklogs),
      allowedBranches,
      deadline,
      jobDesc: jobDesc.trim(),
      skillsRequired: skillsRequiredText.split(',').map(s => s.trim()).filter(Boolean),
      rounds: roundsList,
      active: true
    });

    // Reset Form
    setCompanyName('');
    setRole('');
    setPkg('');
    setNumericPkg(6);
    setCgpaCutoff(7.0);
    setMaxBacklogs(0);
    setAllowedBranches(['Computer Science', 'Information Technology']);
    setDeadline('2026-06-30');
    setJobDesc('');
    setSkillsRequiredText('React, JavaScript, Node.js');
    setRoundsList(['Online Coding Test', 'Technical Round 1', 'HR Interview']);
    setFormStep(1);
    setShowDriveForm(false);
  };

  const handleBranchCheckbox = (branch: string) => {
    if (allowedBranches.includes(branch)) {
      setAllowedBranches(allowedBranches.filter(b => b !== branch));
    } else {
      setAllowedBranches([...allowedBranches, branch]);
    }
  };

  // Filter students database roster
  const filteredStudents = students.filter(student => {
    const matchesSearch = student.name.toLowerCase().includes(studentSearch.toLowerCase()) ||
                          student.email.toLowerCase().includes(studentSearch.toLowerCase());
    const matchesBranch = branchFilter === 'All' || student.branch === branchFilter;
    const matchesStatus = statusFilter === 'All' || student.placementStatus === statusFilter;
    const matchesCgpa = student.cgpa >= minCgpaFilter;
    const matchesBacklogs = student.backlogs <= maxBacklogsFilter;
    return matchesSearch && matchesBranch && matchesStatus && matchesCgpa && matchesBacklogs;
  });

  // Paginate list
  const totalPages = Math.ceil(filteredStudents.length / itemsPerPage);
  const paginatedStudents = filteredStudents.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handleManualStatusSave = (studentId: string) => {
    if (!placedCompanyInput.trim() || !placedPackageInput.trim()) return;
    onUpdateStudentStatus(studentId, placedCompanyInput.trim(), placedPackageInput.trim() + ' LPA');
    setStatusOverrideStudentId(null);
    setPlacedCompanyInput('');
    setPlacedPackageInput('');
  };

  // Kanban Stage Tracker Data Calculations
  const activeTrackerDrive = drives.find(d => d.id === trackerDriveId);
  const activeTrackerApplications = students.flatMap(s =>
    s.applications
      .filter(app => app.driveId === trackerDriveId)
      .map(app => ({ student: s, app }))
  );

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard size={18} /> },
    { id: 'drives', label: 'Recruitment Drives', icon: <Briefcase size={18} /> },
    { id: 'students', label: 'Student Database', icon: <Users size={18} /> },
    { id: 'tracker', label: 'Live Stage Tracker', icon: <GitMerge size={18} /> }
  ];

  return (
    <DashboardShell
      role="admin"
      userName="TPO Coordinator"
      userSub="Administrator"
      avatarInitials="TA"
      menuItems={menuItems}
      activeTab={activeTab}
      setActiveTab={(tabId) => setActiveTab(tabId as typeof activeTab)}
      onLogout={onLogout}
      notifications={notifications}
      onMarkAsRead={onMarkAsRead}
      onMarkAllAsRead={onMarkAllAsRead}
      onClearNotification={onClearNotification}
      onClearAll={onClearAll}
      theme={theme}
      toggleTheme={toggleTheme}
    >
      <AnimatePresence mode="wait">
        
        {/* TAB 1: DASHBOARD ANALYTICS */}
        {activeTab === 'dashboard' && (
          <motion.div
            key="dashboard-tab"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.2 }}
            className="flex flex-col gap-6"
          >
            {/* Admin Header Banner */}
            <div className="dashboard-hero">
              <div className="absolute top-0 right-0 p-8 text-blue-500/10 pointer-events-none hidden md:block">
                <ShieldCheck size={130} />
              </div>
              <div className="hero-content-area flex flex-col justify-center">
                <span className="badge badge-success self-start mb-3">● Portal Operational</span>
                <h2 className="text-2xl sm:text-3xl font-extrabold text-white font-display">TPO Coordinator Analytics</h2>
                <p className="text-slate-400 mt-2 text-xs sm:text-sm leading-relaxed">
                  Oversee corporate placement drives, transition applicants through stage pipelines, audit student rosters, and view cohort analytics.
                </p>
              </div>
            </div>

            {/* Top Row: 4-column KPI grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              
              {/* Placement Rate */}
              <div className="glass-card p-5 bg-slate-900/40 flex justify-between items-center">
                <div>
                  <span className="text-[10px] font-bold text-slate-500 uppercase">Placement Rate</span>
                  <h3 className="text-3xl font-black text-white mt-1.5">{placementRate}%</h3>
                  <p className="text-[9px] text-slate-500 mt-1">Hired ratio metric</p>
                </div>
                <UserCheck className="text-emerald-400" size={24} />
              </div>

              {/* Students Placed */}
              <div className="glass-card p-5 bg-slate-900/40 flex justify-between items-center">
                <div>
                  <span className="text-[10px] font-bold text-slate-500 uppercase">Students Placed</span>
                  <h3 className="text-3xl font-black text-white mt-1.5">{placedCount}</h3>
                  <p className="text-[9px] text-slate-500 mt-1">Secured job offers</p>
                </div>
                <Award className="text-blue-500" size={24} />
              </div>

              {/* Active Drives */}
              <div className="glass-card p-5 bg-slate-900/40 flex justify-between items-center">
                <div>
                  <span className="text-[10px] font-bold text-slate-500 uppercase">Active Drives</span>
                  <h3 className="text-3xl font-black text-white mt-1.5">{activeDrivesCount}</h3>
                  <p className="text-[9px] text-slate-500 mt-1">Ongoing Campaigns</p>
                </div>
                <Briefcase className="text-teal-400" size={24} />
              </div>

              {/* Average Package */}
              <div className="glass-card p-5 bg-slate-900/40 flex justify-between items-center">
                <div>
                  <span className="text-[10px] font-bold text-slate-500 uppercase">Average Package</span>
                  <h3 className="text-3xl font-black text-white mt-1.5">{averagePackage} LPA</h3>
                  <p className="text-[9px] text-slate-500 mt-1">Cohort CTC valuation</p>
                </div>
                <TrendingUp className="text-amber-500" size={24} />
              </div>

            </div>

            {/* Second Row: Department Analytics & Placement Funnel */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              
              {/* Department Analytics */}
              <div className="glass-card flex flex-col gap-4 bg-slate-900/40">
                <h3 className="text-xs font-bold text-white uppercase tracking-wider pb-2 border-b border-slate-900 flex justify-between items-center">
                  <span>Department Placement Analytics</span>
                  <span className="text-[10px] text-slate-500 font-semibold">% Placed Rate</span>
                </h3>

                <div className="py-4 flex flex-col justify-end h-[240px]">
                  <div className="flex justify-around items-end h-[180px] relative border-b border-slate-900 px-4">
                    {/* Y-axis indicator lines */}
                    <div className="absolute inset-x-0 bottom-0 h-0.5 bg-slate-900" />
                    <div className="absolute inset-x-0 top-0 border-t border-slate-900 border-dashed" />
                    <div className="absolute inset-x-0 top-1/2 border-t border-slate-900 border-dashed" />

                    {branchData.map((br) => (
                      <div key={br.name} className="flex flex-col items-center gap-2 group relative">
                        {/* Bar */}
                        <div
                          className="w-10 bg-gradient-to-t from-blue-600 to-blue-400 rounded-t-md transition-all duration-1000 group-hover:from-teal-400 group-hover:to-teal-500 cursor-pointer shadow-lg relative"
                          style={{ height: `${Math.max(8, br.pct * 1.6)}px` }}
                        >
                          {/* Tooltip */}
                          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-950 border border-slate-850 px-2 py-1 rounded text-[9px] text-white whitespace-nowrap z-20 pointer-events-none font-bold">
                            {br.placed} Placed / {br.total} Total
                          </div>
                        </div>

                        {/* Value label */}
                        <span className="text-[10px] font-black text-white leading-none">{br.pct}%</span>
                      </div>
                    ))}
                  </div>
                  
                  {/* X-axis labels */}
                  <div className="flex justify-around mt-2.5 text-[9px] text-slate-500 font-semibold uppercase">
                    <span>CSE</span>
                    <span>IT</span>
                    <span>ECE</span>
                    <span>ME</span>
                    <span>EE</span>
                  </div>
                </div>
              </div>

              {/* Placement Funnel */}
              <div className="glass-card flex flex-col gap-4 bg-slate-900/40">
                <h3 className="text-xs font-bold text-white uppercase tracking-wider pb-2 border-b border-slate-900">
                  Application Recruitment Funnel
                </h3>

                <div className="flex flex-col gap-3 py-1 flex-1 justify-center">
                  {[
                    { label: 'Registered', val: funnelMetrics.appliedCount, color: 'bg-blue-600/35 border-blue-500/40 text-blue-300' },
                    { label: 'Tested', val: funnelMetrics.testedCount, color: 'bg-indigo-600/35 border-indigo-500/40 text-indigo-300' },
                    { label: 'Interviewed', val: funnelMetrics.interviewedCount, color: 'bg-teal-600/35 border-teal-500/40 text-teal-300' },
                    { label: 'Selected', val: funnelMetrics.selectedCount, color: 'bg-emerald-600/35 border-emerald-500/40 text-emerald-300' }
                  ].map((step, idx, arr) => {
                    const maxVal = arr[0].val || 1;
                    const widthPct = Math.max(35, Math.round((step.val / maxVal) * 100));
                    return (
                      <div key={idx} className="flex items-center gap-3">
                        <span className="w-24 text-[9px] text-slate-500 uppercase font-bold text-right shrink-0">{step.label}</span>
                        <div className="flex-1">
                          <div
                            className={`p-1.5 px-3 rounded-lg border text-[10px] font-bold flex justify-between items-center transition-all duration-1000 ${step.color}`}
                            style={{ width: `${widthPct}%` }}
                          >
                            <span>{step.val}</span>
                            {step.val > 0 && <span className="text-[9px] opacity-60">{Math.round((step.val / maxVal) * 100)}%</span>}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

            </div>

            {/* Third Row: Recent Activity & Drive Performance */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              
              {/* Recent Activity */}
              <div className="glass-card flex flex-col gap-4 bg-slate-900/40">
                <div className="flex justify-between items-center pb-2 border-b border-slate-900">
                  <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                    <Clock size={16} className="text-blue-500 animate-pulse" />
                    Recent Activity
                  </h3>
                  <button onClick={onMarkAllAsRead} className="text-[10px] text-slate-400 hover:text-blue-400 hover:underline">
                    Mark Read
                  </button>
                </div>

                {notifications.length === 0 ? (
                  <div className="text-center py-10">
                    <p className="text-xs text-slate-500">No recent activity logs recorded.</p>
                  </div>
                ) : (
                  <div className="flex flex-col gap-2.5 max-h-[250px] overflow-y-auto pr-1 custom-scrollbar">
                    {notifications.slice(0, 10).map((notif) => (
                      <div key={notif.id} className={`p-2.5 rounded-lg border bg-slate-950/20 text-xs flex flex-col gap-1 transition-colors ${notif.read ? 'border-slate-900 opacity-60' : 'border-slate-800'}`}>
                        <div className="flex justify-between items-start">
                          <span className="font-bold text-slate-200">{notif.title}</span>
                          <span className="text-[8px] text-slate-500 font-semibold">{notif.timestamp}</span>
                        </div>
                        <p className="text-[10px] text-slate-400 leading-normal">{notif.message}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Drive Performance */}
              <div className="glass-card flex flex-col gap-4 bg-slate-900/40">
                <h3 className="text-xs font-bold text-white uppercase tracking-wider pb-2 border-b border-slate-900">
                  Drive Performance & Recruiters
                </h3>

                <div className="flex flex-col gap-3">
                  {/* Recruiters List */}
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2">Top Recruiter Selection Shares</span>
                    {topRecruiters.length === 0 ? (
                      <p className="text-xs text-slate-500 py-1">No recruiters selections recorded yet.</p>
                    ) : (
                      <div className="grid grid-cols-2 gap-2">
                        {topRecruiters.map((rec) => (
                          <div key={rec.company} className="p-2 bg-slate-950/40 border border-slate-900 rounded-lg flex justify-between items-center text-[10px]">
                            <span className="font-bold text-slate-200 truncate">{rec.company}</span>
                            <span className="px-1.5 py-0.5 bg-blue-500/10 text-blue-400 rounded text-[9px] font-bold shrink-0">
                              {rec.count} hire{rec.count > 1 ? 's' : ''}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Active Campaigns registration metrics */}
                  <div className="mt-2.5 pt-2.5 border-t border-slate-900">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2">Active Campaigns Registration Stats</span>
                    <div className="flex flex-col gap-2 max-h-[120px] overflow-y-auto custom-scrollbar pr-1">
                      {drives.slice(0, 3).map((drive) => (
                        <div key={drive.id} className="flex justify-between items-center text-[10px]">
                          <span className="text-slate-300 font-medium truncate pr-2">{drive.companyName} ({drive.role})</span>
                          <span className="text-slate-400 font-bold shrink-0">{drive.registeredCount} registered</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

            </div>

          </motion.div>
        )}

        {/* TAB 2: RECRUITMENT DRIVES MANAGER */}
        {activeTab === 'drives' && (
          <motion.div
            key="drives-tab"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.2 }}
            className="flex flex-col gap-6"
          >
            {/* Header control triggers */}
            <div className="flex justify-between items-center bg-slate-900/20 p-2 rounded-lg">
              <div>
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">Placement Drive Management</h3>
                <p className="text-[10px] text-slate-500 mt-0.5">Toggle channel availability or initiate new recruitment campaign wizards.</p>
              </div>
              <button
                onClick={() => {
                  setFormStep(1);
                  setShowDriveForm(true);
                }}
                className="btn btn-primary btn-sm flex items-center gap-1.5"
              >
                <Plus size={14} />
                Launch Campaign
              </button>
            </div>

            {/* Drives List */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {drives.map(drive => (
                <div
                  key={drive.id}
                  className="glass-card p-5 bg-slate-900/40 flex flex-col justify-between gap-4 border-t-2"
                  style={{ borderTopColor: drive.active ? '#10b981' : 'rgba(239, 68, 68, 0.4)' }}
                >
                  <div>
                    <div className="flex justify-between items-start flex-wrap gap-2">
                      <div>
                        <h4 className="font-extrabold text-white text-base font-display">{drive.companyName}</h4>
                        <span className="text-[10px] text-blue-400 font-bold mt-0.5">{drive.role}</span>
                      </div>
                      <span className="px-2 py-0.5 bg-blue-500/10 text-blue-400 rounded text-xs font-bold">{drive.package}</span>
                    </div>

                    <p className="text-xs text-slate-400 mt-3 line-clamp-3 leading-relaxed">{drive.jobDesc}</p>

                    <div className="grid grid-cols-3 gap-2 mt-4 text-[10px] bg-slate-950/40 p-2.5 rounded-lg border border-slate-900 text-center font-semibold uppercase">
                      <div>
                        <span className="text-slate-500 block mb-0.5">GPA Cutoff</span>
                        <span className="text-white text-xs">{drive.cgpaCutoff}</span>
                      </div>
                      <div>
                        <span className="text-slate-500 block mb-0.5">Backlogs</span>
                        <span className="text-white text-xs">≤ {drive.maxBacklogs}</span>
                      </div>
                      <div>
                        <span className="text-slate-500 block mb-0.5">Applicants</span>
                        <span className="text-white text-xs">{drive.registeredCount}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-between items-center border-t border-slate-900 pt-3">
                    <span className="text-[10px] font-bold text-slate-500 uppercase">
                      Deadline: <strong className="text-slate-300">{drive.deadline}</strong>
                    </span>

                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          setTrackerDriveId(drive.id);
                          setActiveTab('tracker');
                        }}
                        className="btn btn-secondary btn-sm"
                      >
                        Board Track
                      </button>
                      <button
                        onClick={() => onToggleDriveActive(drive.id)}
                        className={`btn btn-sm ${
                          drive.active ? 'btn-danger' : 'btn-success'
                        }`}
                      >
                        {drive.active ? 'Suspend' : 'Activate'}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* TAB 3: CANDIDATE DATABASE ROSTER */}
        {activeTab === 'students' && (
          <motion.div
            key="students-tab"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.2 }}
            className="flex flex-col gap-6"
          >
            {/* Database search & filter wrapper */}
            <div className="glass-card flex flex-col gap-4 bg-slate-900/40 p-4">
              
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {/* Search */}
                <div className="relative">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                  <input
                    type="text"
                    value={studentSearch}
                    onChange={(e) => setStudentSearch(e.target.value)}
                    placeholder="Search candidate name..."
                    className="w-full bg-slate-950 border border-slate-850 rounded py-1.5 pl-9 pr-3 text-xs text-slate-200 outline-none placeholder-slate-700 focus:border-blue-500"
                  />
                </div>

                {/* Branch */}
                <div className="flex items-center gap-1.5">
                  <span className="text-[9px] text-slate-500 uppercase font-bold shrink-0">Branch:</span>
                  <select
                    value={branchFilter}
                    onChange={(e) => setBranchFilter(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-850 rounded py-1.5 px-2 text-xs text-slate-300 outline-none cursor-pointer"
                  >
                    <option value="All">All Branches</option>
                    {branches.map(b => <option key={b} value={b}>{b}</option>)}
                  </select>
                </div>

                {/* Status */}
                <div className="flex items-center gap-1.5">
                  <span className="text-[9px] text-slate-500 uppercase font-bold shrink-0">Status:</span>
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-850 rounded py-1.5 px-2 text-xs text-slate-300 outline-none cursor-pointer"
                  >
                    <option value="All">All Statuses</option>
                    <option value="Placed">Placed</option>
                    <option value="Unplaced">Unplaced</option>
                  </select>
                </div>

                {/* Minimum CGPA */}
                <div className="flex items-center gap-1.5">
                  <span className="text-[9px] text-slate-500 uppercase font-bold shrink-0">Min CGPA:</span>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    max="10"
                    value={minCgpaFilter}
                    onChange={(e) => setMinCgpaFilter(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-850 rounded py-1 px-2 text-xs text-slate-200 outline-none"
                  />
                </div>
              </div>

            </div>

            {/* Candidates Table list */}
            <div className="glass-card bg-slate-900/40 overflow-hidden p-0 border border-slate-850 shadow-lg">
              
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-850 bg-slate-950/30 text-[9px] text-slate-500 uppercase font-bold tracking-wider">
                      <th className="p-4 pl-6">Candidate</th>
                      <th className="p-4">Branch</th>
                      <th className="p-4">CGPA</th>
                      <th className="p-4">Backlogs</th>
                      <th className="p-4">Placement Status</th>
                      <th className="p-4 pr-6 text-right">Actions</th>
                    </tr>
                  </thead>
                  
                  <tbody className="divide-y divide-slate-850 text-xs text-slate-300">
                    {paginatedStudents.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="text-center py-10 text-slate-500">
                          No candidates match the selected filters.
                        </td>
                      </tr>
                    ) : (
                      paginatedStudents.map((student) => (
                        <tr key={student.id} className="hover:bg-slate-900/30 transition-colors">
                          
                          <td className="p-4 pl-6">
                            <div className="flex items-center gap-3">
                              <div className="h-8 w-8 flex items-center justify-center rounded-full bg-slate-800 font-bold text-xs text-white">
                                {student.name.charAt(0)}
                              </div>
                              <div className="flex flex-col">
                                <span className="font-bold text-white">{student.name}</span>
                                <span className="text-[10px] text-slate-500 mt-0.5">{student.email}</span>
                              </div>
                            </div>
                          </td>

                          <td className="p-4 font-medium">{student.branch}</td>
                          <td className="p-4 font-bold text-white">{student.cgpa}</td>
                          <td className="p-4 font-medium text-slate-400">{student.backlogs}</td>
                          
                          <td className="p-4">
                            {student.placementStatus === 'Placed' ? (
                              <div className="flex flex-col">
                                <span className="badge badge-success self-start">Placed</span>
                                <span className="text-[9px] text-slate-500 mt-1 truncate max-w-[120px]">
                                  {student.placedCompany} ({student.placedPackage})
                                </span>
                              </div>
                            ) : (
                              <span className="badge badge-warning self-start">Unplaced</span>
                            )}
                          </td>

                          <td className="p-4 pr-6 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={() => setSelectedStudentForDrawer(student)}
                                className="btn btn-secondary btn-sm"
                              >
                                CV Inspect
                              </button>
                              
                              {student.placementStatus === 'Placed' ? (
                                <button
                                  onClick={() => onUpdateStudentStatus(student.id)}
                                  className="btn btn-danger btn-sm"
                                >
                                  Reset
                                </button>
                              ) : (
                                <button
                                  onClick={() => setStatusOverrideStudentId(student.id)}
                                  className="btn btn-success btn-sm"
                                >
                                  Placed Override
                                </button>
                              )}
                            </div>
                          </td>

                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pagination layout */}
              {totalPages > 1 && (
                <div className="p-4 border-t border-slate-850 flex justify-between items-center bg-slate-950/20">
                  <span className="text-[10px] text-slate-500 font-semibold uppercase">
                    Page {currentPage} of {totalPages} ({filteredStudents.length} entries)
                  </span>
                  
                  <div className="flex gap-1">
                    <button
                      disabled={currentPage === 1}
                      onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                      className="btn btn-secondary btn-sm px-2"
                    >
                      <ChevronLeft size={16} />
                    </button>
                    <button
                      disabled={currentPage === totalPages}
                      onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                      className="btn btn-secondary btn-sm px-2"
                    >
                      <ChevronRight size={16} />
                    </button>
                  </div>
                </div>
              )}

            </div>
          </motion.div>
        )}

        {/* TAB 4: KANBAN LIVE STAGE TRACKER */}
        {activeTab === 'tracker' && (
          <motion.div
            key="tracker-tab"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.2 }}
            className="flex flex-col gap-6"
          >
            {/* Controls */}
            <div className="glass-card flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-slate-900/40 p-4">
              <div>
                <h3 className="text-xs font-bold text-white uppercase tracking-wider">Live Round Progression Tracker</h3>
                <p className="text-[10px] text-slate-500 mt-0.5">Drag and drop student application cards to promote round stages or conclusion.</p>
              </div>

              {/* Selector */}
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-slate-500 uppercase font-bold shrink-0">Active Drive:</span>
                <select
                  value={trackerDriveId}
                  onChange={(e) => setTrackerDriveId(e.target.value)}
                  className="bg-slate-950 border border-slate-850 rounded py-1.5 px-3 text-xs text-slate-200 outline-none cursor-pointer focus:border-blue-500"
                >
                  {drives.map(d => (
                    <option key={d.id} value={d.id}>
                      {d.companyName} ({d.role})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Kanban Columns Board */}
            {activeTrackerDrive ? (
              <div className="flex gap-4 overflow-x-auto pb-4 custom-scrollbar select-none items-stretch min-h-[500px]">
                
                {/* Column rounds */}
                {activeTrackerDrive.rounds.map((roundName, roundIdx) => {
                  const columnApplicants = activeTrackerApplications.filter(
                    (x) => x.app.status === roundName
                  );

                  return (
                    <div
                      key={roundName}
                      onDragOver={handleDragOver}
                      onDrop={(e) => handleDropColumn(e, roundIdx, false, false)}
                      className="w-72 bg-slate-900/45 border border-slate-900 rounded-xl p-3 flex flex-col gap-3 shrink-0"
                    >
                      {/* Column Header */}
                      <div className="flex justify-between items-center pb-2 border-b border-slate-850">
                        <span className="text-xs font-bold text-slate-300 truncate pr-2">{roundName}</span>
                        <span className="px-2 py-0.5 bg-slate-800 text-slate-400 rounded text-[9px] font-bold shrink-0">
                          {columnApplicants.length}
                        </span>
                      </div>

                      {/* Applicants List */}
                      <div className="flex-1 flex flex-col gap-2.5 overflow-y-auto max-h-[420px] pr-0.5 custom-scrollbar">
                        {columnApplicants.length === 0 ? (
                          <div className="h-full flex items-center justify-center border border-dashed border-slate-850 rounded-lg p-6 text-center">
                            <span className="text-[10px] text-slate-600 font-medium">Drop candidates here</span>
                          </div>
                        ) : (
                          columnApplicants.map(({ student }) => (
                            <div
                              key={student.id}
                              draggable
                              onDragStart={(e) => handleDragStart(e, student.id)}
                              className="p-3 bg-slate-950 border border-slate-850 hover:border-slate-800 rounded-lg shadow cursor-grab active:cursor-grabbing flex flex-col gap-2.5 hover:shadow-lg transition-all"
                            >
                              <div className="flex justify-between items-start gap-2">
                                <span className="font-bold text-white text-[11px] truncate">{student.name}</span>
                                <span className="text-[8px] font-bold text-blue-400 bg-blue-500/10 px-1 rounded uppercase tracking-wider shrink-0">
                                  {student.branch.split(' ')[0]}
                                </span>
                              </div>
                              
                              <div className="flex justify-between text-[9px] text-slate-500 font-semibold border-t border-slate-900 pt-1.5">
                                <span>CGPA: <strong className="text-white">{student.cgpa}</strong></span>
                                <span>ATS: <strong className="text-white">{student.resumeScore}%</strong></span>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  );
                })}

                {/* Selected column (Final stage) */}
                <div
                  onDragOver={handleDragOver}
                  onDrop={(e) => handleDropColumn(e, activeTrackerDrive.rounds.length, true, false)}
                  className="w-72 bg-emerald-950/10 border border-emerald-900/30 rounded-xl p-3 flex flex-col gap-3 shrink-0"
                >
                  <div className="flex justify-between items-center pb-2 border-b border-emerald-900/35">
                    <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1">
                      <UserCheck size={14} />
                      Offer Issued
                    </span>
                    <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-400 rounded text-[9px] font-bold">
                      {activeTrackerApplications.filter(x => x.app.status === 'Selected').length}
                    </span>
                  </div>

                  <div className="flex-1 flex flex-col gap-2.5 overflow-y-auto max-h-[420px] pr-0.5 custom-scrollbar">
                    {activeTrackerApplications.filter(x => x.app.status === 'Selected').map(({ student }) => (
                      <div
                        key={student.id}
                        className="p-3 bg-slate-950 border border-emerald-900/30 rounded-lg shadow flex flex-col gap-2 hover:shadow-lg transition-all"
                      >
                        <span className="font-bold text-white text-[11px] truncate">{student.name}</span>
                        <div className="flex justify-between text-[9px] text-slate-500 font-semibold border-t border-slate-900 pt-1.5">
                          <span>CGPA: <strong className="text-emerald-400">{student.cgpa}</strong></span>
                          <span className="text-emerald-500 font-bold uppercase">OFFERED</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Rejected column */}
                <div
                  onDragOver={handleDragOver}
                  onDrop={(e) => handleDropColumn(e, 0, false, true)}
                  className="w-72 bg-red-950/10 border border-red-900/30 rounded-xl p-3 flex flex-col gap-3 shrink-0"
                >
                  <div className="flex justify-between items-center pb-2 border-b border-red-900/35">
                    <span className="text-xs font-bold text-red-400 uppercase tracking-wider flex items-center gap-1">
                      <X size={14} />
                      Concluded
                    </span>
                    <span className="px-2 py-0.5 bg-red-500/10 text-red-400 rounded text-[9px] font-bold">
                      {activeTrackerApplications.filter(x => x.app.status === 'Rejected').length}
                    </span>
                  </div>

                  <div className="flex-1 flex flex-col gap-2.5 overflow-y-auto max-h-[420px] pr-0.5 custom-scrollbar">
                    {activeTrackerApplications.filter(x => x.app.status === 'Rejected').map(({ student }) => (
                      <div
                        key={student.id}
                        className="p-3 bg-slate-950 border border-red-905/30 rounded-lg shadow flex flex-col gap-2 hover:shadow-lg transition-all opacity-60"
                      >
                        <span className="font-bold text-white text-[11px] truncate">{student.name}</span>
                        <div className="flex justify-between text-[9px] text-slate-500 font-semibold border-t border-slate-900 pt-1.5">
                          <span>CGPA: <strong className="text-red-400">{student.cgpa}</strong></span>
                          <span className="text-red-500 font-bold uppercase">REJECTED</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

              </div>
            ) : (
              <p className="text-xs text-slate-500 text-center py-10">No campaigns launched to track.</p>
            )}

          </motion.div>
        )}

      </AnimatePresence>

      {/* MULTI-STEP CAMPAIGN LAUNCHER MODAL */}
      <AnimatePresence>
        {showDriveForm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowDriveForm(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />

            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-slate-900 border border-slate-800 rounded-xl max-w-lg w-full p-6 relative z-10 shadow-2xl flex flex-col max-h-[90vh]"
            >
              {/* Modal Header */}
              <div className="flex justify-between items-center pb-3 border-b border-slate-850 shrink-0">
                <div>
                  <h3 className="font-display font-extrabold text-white text-base">Launch Recruitment Campaign</h3>
                  <p className="text-[10px] text-slate-500 mt-0.5">Wizard step {formStep} of 4</p>
                </div>
                <button onClick={() => setShowDriveForm(false)} className="text-slate-400 hover:text-white">
                  <X size={18} />
                </button>
              </div>

              {/* Progress Bar */}
              <div className="h-1 bg-slate-950 w-full shrink-0 my-3 rounded-full overflow-hidden">
                <div className="h-full bg-blue-500 transition-all duration-300" style={{ width: `${formStep * 25}%` }} />
              </div>

              {/* Modal Form Step views */}
              <div className="flex-1 overflow-y-auto py-2 pr-1 custom-scrollbar">
                
                {/* STEP 1: BASIC INFO */}
                {formStep === 1 && (
                  <div className="flex flex-col gap-4">
                    <div className="flex flex-col gap-1">
                      <label className="text-[10px] font-bold text-slate-400 uppercase">Company Name</label>
                      <input
                        type="text"
                        required
                        value={companyName}
                        onChange={(e) => setCompanyName(e.target.value)}
                        placeholder="Google Inc."
                        className="w-full bg-slate-950 border border-slate-850 rounded-lg py-2 px-3 text-xs text-slate-100 outline-none placeholder-slate-700 focus:border-blue-500"
                      />
                    </div>

                    <div className="flex flex-col gap-1">
                      <label className="text-[10px] font-bold text-slate-400 uppercase">Target Job Role</label>
                      <input
                        type="text"
                        required
                        value={role}
                        onChange={(e) => setRole(e.target.value)}
                        placeholder="Associate Software Engineer"
                        className="w-full bg-slate-950 border border-slate-850 rounded-lg py-2 px-3 text-xs text-slate-100 outline-none placeholder-slate-700 focus:border-blue-500"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="flex flex-col gap-1">
                        <label className="text-[10px] font-bold text-slate-400 uppercase">CTC Package (Text)</label>
                        <input
                          type="text"
                          required
                          value={pkg}
                          onChange={(e) => setPkg(e.target.value)}
                          placeholder="32 LPA"
                          className="w-full bg-slate-950 border border-slate-850 rounded-lg py-2 px-3 text-xs text-slate-100 outline-none placeholder-slate-700 focus:border-blue-500"
                        />
                      </div>
                      <div className="flex flex-col gap-1">
                        <label className="text-[10px] font-bold text-slate-400 uppercase">CTC Packages (Numeric)</label>
                        <input
                          type="number"
                          required
                          value={numericPkg}
                          onChange={(e) => setNumericPkg(Number(e.target.value))}
                          placeholder="32"
                          className="w-full bg-slate-950 border border-slate-850 rounded-lg py-2 px-3 text-xs text-slate-100 outline-none focus:border-blue-500"
                        />
                      </div>
                    </div>

                    <div className="flex flex-col gap-1">
                      <label className="text-[10px] font-bold text-slate-400 uppercase">Job Description Summary</label>
                      <textarea
                        rows={3}
                        required
                        value={jobDesc}
                        onChange={(e) => setJobDesc(e.target.value)}
                        placeholder="Detail day-to-day operations and technologies utilized..."
                        className="w-full bg-slate-950 border border-slate-850 rounded-lg p-3 text-xs text-slate-100 placeholder-slate-700 outline-none focus:border-blue-500 resize-none leading-relaxed"
                      />
                    </div>
                  </div>
                )}

                {/* STEP 2: ELIGIBILITY RULES */}
                {formStep === 2 && (
                  <div className="flex flex-col gap-4">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="flex flex-col gap-1">
                        <label className="text-[10px] font-bold text-slate-400 uppercase">GPA Cut-off Threshold</label>
                        <input
                          type="number"
                          step="0.1"
                          required
                          value={cgpaCutoff}
                          onChange={(e) => setCgpaCutoff(Number(e.target.value))}
                          placeholder="7.5"
                          className="w-full bg-slate-950 border border-slate-850 rounded-lg py-2 px-3 text-xs text-slate-100 outline-none focus:border-blue-500"
                        />
                      </div>
                      <div className="flex flex-col gap-1">
                        <label className="text-[10px] font-bold text-slate-400 uppercase">Max Allowed Backlogs</label>
                        <input
                          type="number"
                          required
                          value={maxBacklogs}
                          onChange={(e) => setMaxBacklogs(Number(e.target.value))}
                          placeholder="0"
                          className="w-full bg-slate-950 border border-slate-850 rounded-lg py-2 px-3 text-xs text-slate-100 outline-none focus:border-blue-500"
                        />
                      </div>
                    </div>

                    <div className="flex flex-col gap-2">
                      <label className="text-[10px] font-bold text-slate-400 uppercase">Allowed Branches Selection</label>
                      <div className="grid grid-cols-2 gap-2 p-3 bg-slate-950/60 border border-slate-850 rounded-lg">
                        {branches.map(branch => (
                          <div key={branch} className="flex items-center">
                            <input
                              id={`branch-${branch}`}
                              type="checkbox"
                              checked={allowedBranches.includes(branch)}
                              onChange={() => handleBranchCheckbox(branch)}
                              className="w-4 h-4 rounded border-slate-850 text-blue-600 bg-slate-950 focus:ring-blue-500"
                            />
                            <label htmlFor={`branch-${branch}`} className="ml-2 text-xs text-slate-400 font-semibold cursor-pointer">
                              {branch}
                            </label>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="flex flex-col gap-1">
                      <label className="text-[10px] font-bold text-slate-400 uppercase">Application Deadline Calendar</label>
                      <input
                        type="date"
                        required
                        value={deadline}
                        onChange={(e) => setDeadline(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-850 rounded-lg py-2 px-3 text-xs text-slate-100 outline-none focus:border-blue-500 cursor-pointer"
                      />
                    </div>
                  </div>
                )}

                {/* STEP 3: PIPELINE STAGES */}
                {formStep === 3 && (
                  <div className="flex flex-col gap-4">
                    <label className="text-[10px] font-bold text-slate-400 uppercase">Selection Process Pipeline Stages ({roundsList.length})</label>
                    
                    <div className="flex flex-col gap-2">
                      {roundsList.map((round, idx) => (
                        <div key={round} className="p-2.5 bg-slate-950 border border-slate-900 rounded-lg flex justify-between items-center text-xs">
                          <span className="font-bold text-slate-200">Stage {idx + 1}: {round}</span>
                          <button
                            type="button"
                            onClick={() => handleRemoveRound(round)}
                            className="text-slate-500 hover:text-red-400"
                          >
                            <X size={14} />
                          </button>
                        </div>
                      ))}
                    </div>

                    <div className="flex gap-2 border-t border-slate-850 pt-3">
                      <input
                        type="text"
                        value={newRoundInput}
                        onChange={(e) => setNewRoundInput(e.target.value)}
                        placeholder="Add new custom stage (e.g. System Design Interview)"
                        className="flex-1 bg-slate-950 border border-slate-850 rounded py-1 px-3 text-xs text-slate-200 outline-none placeholder-slate-700 focus:border-blue-500"
                      />
                      <button
                        type="button"
                        onClick={handleAddRound}
                        className="btn btn-primary btn-sm px-2"
                      >
                        <Plus size={16} />
                      </button>
                    </div>
                  </div>
                )}

                {/* STEP 4: SKILLS */}
                {formStep === 4 && (
                  <div className="flex flex-col gap-4">
                    <div className="flex flex-col gap-1">
                      <label className="text-[10px] font-bold text-slate-400 uppercase">Required Skills (Comma-separated)</label>
                      <input
                        type="text"
                        value={skillsRequiredText}
                        onChange={(e) => setSkillsRequiredText(e.target.value)}
                        placeholder="React, TypeScript, SQL, Node.js"
                        className="w-full bg-slate-950 border border-slate-850 rounded-lg py-2 px-3 text-xs text-slate-100 outline-none focus:border-blue-500"
                      />
                    </div>
                    
                    <div className="p-3 bg-slate-950 border border-slate-900 text-[10px] leading-relaxed text-slate-500 rounded-lg uppercase tracking-wider flex flex-col gap-1">
                      <div className="flex justify-between">
                        <span>Launch Target:</span>
                        <strong className="text-white">{companyName}</strong>
                      </div>
                      <div className="flex justify-between">
                        <span>CTC package:</span>
                        <strong className="text-white">{pkg}</strong>
                      </div>
                      <div className="flex justify-between">
                        <span>Eligibility threshold:</span>
                        <strong className="text-white">GPA ≥ {cgpaCutoff}</strong>
                      </div>
                      <div className="flex justify-between">
                        <span>Pipeline stages count:</span>
                        <strong className="text-white">{roundsList.length} Rounds</strong>
                      </div>
                    </div>
                  </div>
                )}

              </div>

              {/* Modal footer navigation controls */}
              <div className="flex justify-between border-t border-slate-850 pt-4 mt-2 shrink-0">
                <button
                  type="button"
                  disabled={formStep === 1}
                  onClick={() => setFormStep(prev => prev - 1)}
                  className="btn btn-secondary btn-sm"
                >
                  Back
                </button>
                
                {formStep < 4 ? (
                  <button
                    type="button"
                    onClick={() => {
                      if (formStep === 1 && (!companyName.trim() || !role.trim() || !pkg.trim())) {
                        alert('Please fill in Company, Role, and CTC Package details.');
                        return;
                      }
                      setFormStep(prev => prev + 1);
                    }}
                    className="btn btn-primary btn-sm"
                  >
                    Next
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleDriveSubmit}
                    className="btn btn-success btn-sm"
                  >
                    Launch Campaign
                  </button>
                )}
              </div>

            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* PLACED MANUAL OVERRIDE MODAL */}
      <AnimatePresence>
        {statusOverrideStudentId && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setStatusOverrideStudentId(null)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />

            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-slate-900 border border-slate-800 rounded-xl max-w-sm w-full p-6 relative z-10 shadow-2xl"
            >
              <h3 className="font-display font-extrabold text-white text-base">Assign Manual Placement</h3>
              <p className="text-slate-400 text-xs mt-1.5 leading-relaxed">
                Manually record a corporate offer for this candidate. This bypasses the active round pipelines.
              </p>

              <div className="mt-4 flex flex-col gap-3">
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Placed Company Name</label>
                  <input
                    type="text"
                    value={placedCompanyInput}
                    onChange={(e) => setPlacedCompanyInput(e.target.value)}
                    placeholder="e.g. Google"
                    className="w-full bg-slate-950 border border-slate-850 rounded-lg py-2 px-3 text-xs text-slate-100 placeholder-slate-700 outline-none focus:border-blue-500"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Placed CTC Salary Package (LPA)</label>
                  <input
                    type="number"
                    value={placedPackageInput}
                    onChange={(e) => setPlacedPackageInput(e.target.value)}
                    placeholder="e.g. 32"
                    className="w-full bg-slate-950 border border-slate-850 rounded-lg py-2 px-3 text-xs text-slate-100 placeholder-slate-700 outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 mt-5">
                <button
                  onClick={() => setStatusOverrideStudentId(null)}
                  className="btn btn-secondary btn-sm"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleManualStatusSave(statusOverrideStudentId)}
                  className="btn btn-success btn-sm"
                >
                  Assign Offer
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* DETAILED STUDENT CV DRAWER */}
      <AnimatePresence>
        {selectedStudentForDrawer && (
          <div className="fixed inset-0 z-50 flex justify-end">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedStudentForDrawer(null)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />

            <motion.aside
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="w-full max-w-md bg-slate-900 border-l border-slate-850 h-full p-6 flex flex-col justify-between relative z-10 shadow-2xl"
            >
              <div className="flex-1 overflow-y-auto pr-1 custom-scrollbar">
                
                {/* Header */}
                <div className="flex justify-between items-start pb-4 border-b border-slate-850">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 flex items-center justify-center rounded-full bg-slate-800 text-sm font-bold text-white">
                      {selectedStudentForDrawer.name.charAt(0)}
                    </div>
                    <div>
                      <h4 className="font-extrabold text-white text-sm leading-tight">{selectedStudentForDrawer.name}</h4>
                      <span className="text-[10px] text-slate-500 mt-0.5 block">{selectedStudentForDrawer.email}</span>
                    </div>
                  </div>
                  <button onClick={() => setSelectedStudentForDrawer(null)} className="text-slate-400 hover:text-white">
                    <X size={20} />
                  </button>
                </div>

                {/* Meta Grid */}
                <div className="grid grid-cols-2 gap-3 mt-4 text-xs">
                  <div className="p-3 bg-slate-950/40 border border-slate-900 rounded-lg">
                    <span className="text-[9px] text-slate-500 uppercase font-bold">Branch</span>
                    <p className="font-bold text-white mt-0.5">{selectedStudentForDrawer.branch}</p>
                  </div>
                  <div className="p-3 bg-slate-950/40 border border-slate-900 rounded-lg">
                    <span className="text-[9px] text-slate-500 uppercase font-bold">GPA</span>
                    <p className="font-bold text-white mt-0.5">{selectedStudentForDrawer.cgpa} / 10</p>
                  </div>
                  <div className="p-3 bg-slate-950/40 border border-slate-900 rounded-lg">
                    <span className="text-[9px] text-slate-500 uppercase font-bold">Backlogs</span>
                    <p className={`font-bold mt-0.5 ${selectedStudentForDrawer.backlogs > 0 ? 'text-red-400' : 'text-slate-200'}`}>
                      {selectedStudentForDrawer.backlogs}
                    </p>
                  </div>
                  <div className="p-3 bg-slate-950/40 border border-slate-900 rounded-lg">
                    <span className="text-[9px] text-slate-500 uppercase font-bold">Placement</span>
                    <p className="font-bold text-white mt-0.5">{selectedStudentForDrawer.placementStatus}</p>
                  </div>
                </div>

                {/* Skills tags */}
                <div className="mt-5">
                  <span className="text-[9px] text-slate-500 uppercase font-bold block mb-2">Technical Skills</span>
                  <div className="flex flex-wrap gap-1">
                    {selectedStudentForDrawer.skills.map(skill => (
                      <span key={skill} className="px-2 py-0.5 bg-slate-950 text-slate-300 rounded text-[10px] border border-slate-850">
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Plain-text Resume summary */}
                <div className="mt-5">
                  <span className="text-[9px] text-slate-500 uppercase font-bold block mb-2">Plain Text Resume Summary</span>
                  <div className="p-3 bg-slate-950/60 border border-slate-900 rounded-lg text-xs leading-relaxed text-slate-300 whitespace-pre-line leading-relaxed">
                    {selectedStudentForDrawer.resumeText || 'No resume content details loaded.'}
                  </div>
                </div>

              </div>

              <div className="pt-4 border-t border-slate-850 flex justify-end shrink-0 mt-4">
                <button
                  onClick={() => setSelectedStudentForDrawer(null)}
                  className="btn btn-secondary btn-sm"
                >
                  Close Drawer
                </button>
              </div>
            </motion.aside>
          </div>
        )}
      </AnimatePresence>

    </DashboardShell>
  );
};
