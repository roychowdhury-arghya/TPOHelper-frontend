import React, { useState } from 'react';
import { 
  LayoutDashboard, 
  Briefcase, 
  Users, 
  GitMerge, 
  LogOut, 
  Plus, 
  Search, 
  Check, 
  X, 
  FileText, 
  ArrowRight, 
  ShieldCheck, 
  TrendingUp
} from 'lucide-react';
import type { Student, PlacementDrive } from '../mockData';

interface AdminPortalProps {
  students: Student[];
  drives: PlacementDrive[];
  onLogout: () => void;
  onAddDrive: (drive: Omit<PlacementDrive, 'id' | 'registeredCount'>) => void;
  onToggleDriveActive: (driveId: string) => void;
  onUpdateStudentStatus: (studentId: string, company?: string, salaryPackage?: string) => void;
  onPromoteStudent: (studentId: string, driveId: string, newRoundIndex: number, isFinalSelection: boolean) => void;
  onRejectStudent: (studentId: string, driveId: string) => void;
  onSeedData?: () => void;
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
  onSeedData
}) => {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'drives' | 'students' | 'tracker'>('dashboard');

  // New Drive Form State
  const [showDriveForm, setShowDriveForm] = useState(false);
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
  const [roundsText, setRoundsText] = useState('Aptitude Test, Technical Interview, HR Interview');

  // Student Database Filter State
  const [studentSearch, setStudentSearch] = useState('');
  const [branchFilter, setBranchFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [minCgpaFilter, setMinCgpaFilter] = useState(5.0);
  
  // Selected student for resume view
  const [selectedStudentForResume, setSelectedStudentForResume] = useState<Student | null>(null);
  
  // Manual Status Change state
  const [statusChangeStudentId, setStatusChangeStudentId] = useState<string | null>(null);
  const [placedCompanyInput, setPlacedCompanyInput] = useState('');
  const [placedPackageInput, setPlacedPackageInput] = useState('');

  // Live Round Tracker Selection
  const [trackerDriveId, setTrackerDriveId] = useState<string>(drives[0]?.id || '');

  // ----------------------------------------------------
  // Computations for Analytics & KPI
  // ----------------------------------------------------
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

  // Compute Branch Distribution data
  const branches = ['Computer Science', 'Information Technology', 'Electronics', 'Mechanical', 'Electrical'];
  const branchData = branches.map(br => {
    const branchStudents = students.filter(s => s.branch === br);
    const branchPlaced = branchStudents.filter(s => s.placementStatus === 'Placed');
    const pct = branchStudents.length > 0 ? Math.round((branchPlaced.length / branchStudents.length) * 100) : 0;
    return { name: br, pct, total: branchStudents.length, placed: branchPlaced.length };
  });

  // Handle new drive submission
  const handleDriveSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!companyName || !role || !pkg) return;

    onAddDrive({
      companyName,
      role,
      package: pkg.includes('LPA') ? pkg : `${pkg} LPA`,
      numericPackage: Number(numericPkg),
      cgpaCutoff: Number(cgpaCutoff),
      maxBacklogs: Number(maxBacklogs),
      allowedBranches,
      deadline,
      jobDesc,
      skillsRequired: skillsRequiredText.split(',').map(s => s.trim()).filter(Boolean),
      rounds: roundsText.split(',').map(s => s.trim()).filter(Boolean),
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
    setRoundsText('Aptitude Test, Technical Interview, HR Interview');
    setShowDriveForm(false);
  };

  const handleBranchCheckbox = (branch: string) => {
    if (allowedBranches.includes(branch)) {
      setAllowedBranches(allowedBranches.filter(b => b !== branch));
    } else {
      setAllowedBranches([...allowedBranches, branch]);
    }
  };

  // Filter students roster
  const filteredStudents = students.filter(student => {
    const matchesSearch = student.name.toLowerCase().includes(studentSearch.toLowerCase()) || 
                          student.email.toLowerCase().includes(studentSearch.toLowerCase());
    const matchesBranch = branchFilter === 'All' || student.branch === branchFilter;
    const matchesStatus = statusFilter === 'All' || student.placementStatus === statusFilter;
    const matchesCgpa = student.cgpa >= minCgpaFilter;
    return matchesSearch && matchesBranch && matchesStatus && matchesCgpa;
  });

  const handleManualStatusSave = (studentId: string) => {
    if (!placedCompanyInput.trim() || !placedPackageInput.trim()) return;
    onUpdateStudentStatus(studentId, placedCompanyInput.trim(), placedPackageInput.trim() + ' LPA');
    setStatusChangeStudentId(null);
    setPlacedCompanyInput('');
    setPlacedPackageInput('');
  };

  // Tracker details
  const activeTrackerDrive = drives.find(d => d.id === trackerDriveId);
  const activeTrackerApplications = students.flatMap(s => 
    s.applications
      .filter(app => app.driveId === trackerDriveId && app.status !== 'Rejected' && app.status !== 'Selected')
      .map(app => ({ student: s, app }))
  );

  return (
    <div className="dashboard-layout">
      {/* Sidebar navigation */}
      <aside className="side-menu animate-slide-in">
        <div className="glass-card mb-4 flex flex-col items-center text-center p-6" style={{ borderBottom: '3px solid hsl(var(--color-secondary))' }}>
          <div className="avatar mb-3 text-lg bg-gradient-to-br from-indigo-500 to-purple-600">A</div>
          <h3 className="font-semibold text-white truncate max-w-full font-display">TPO Administration</h3>
          <p className="text-xs text-indigo-400 mt-0.5">University Admin Panel</p>
          <div className="flex gap-4 mt-4 text-xs border-t border-white/5 pt-4 w-full justify-around">
            <div>
              <p className="text-gray-500 font-medium text-[10px] uppercase tracking-wider">Placement Rate</p>
              <p className="font-bold text-white mt-0.5 text-base">{placementRate}%</p>
            </div>
            <div>
              <p className="text-gray-500 font-medium text-[10px] uppercase tracking-wider">Active Drives</p>
              <p className="font-bold text-white mt-0.5 text-base">{activeDrivesCount}</p>
            </div>
          </div>
        </div>

        <div className="glass-card flex flex-col gap-1.5 p-3">
          <button 
            onClick={() => setActiveTab('dashboard')} 
            className={`menu-item ${activeTab === 'dashboard' ? 'active' : ''}`}
          >
            <LayoutDashboard size={18} />
            Dashboard
          </button>
          <button 
            onClick={() => setActiveTab('drives')} 
            className={`menu-item ${activeTab === 'drives' ? 'active' : ''}`}
          >
            <Briefcase size={18} />
            Recruitment Drives
          </button>
          <button 
            onClick={() => setActiveTab('students')} 
            className={`menu-item ${activeTab === 'students' ? 'active' : ''}`}
          >
            <Users size={18} />
            Student Database
          </button>
          <button 
            onClick={() => setActiveTab('tracker')} 
            className={`menu-item ${activeTab === 'tracker' ? 'active' : ''}`}
          >
            <GitMerge size={18} />
            Live Round Tracker
          </button>
          
          <div className="border-t border-white/5 my-3"></div>

          <button 
            onClick={onLogout} 
            className="menu-item hover:bg-red-500/10 hover:text-red-400 text-gray-400"
          >
            <LogOut size={18} />
            Log Out
          </button>

          {onSeedData && (
            <button 
              onClick={onSeedData} 
              className="menu-item hover:bg-indigo-500/10 hover:text-indigo-400 text-gray-400 mt-2"
              title="Reset & Load Sample Data"
            >
              <Plus size={18} />
              Reset & Seed Data
            </button>
          )}
        </div>
      </aside>

      {/* Main content grid */}
      <main className="flex flex-col gap-6 animate-slide-in">

        {/* TAB 1: DASHBOARD & CHARTS */}
        {activeTab === 'dashboard' && (
          <div className="flex flex-col gap-6 animate-slide-in">
            <div className="glass-card relative overflow-hidden p-8 flex flex-col justify-center bg-gradient-to-r from-purple-950/30 to-indigo-950/30" style={{ borderLeft: '4px solid hsl(var(--color-primary))' }}>
              <div className="absolute top-0 right-0 p-8 text-indigo-500/10 pointer-events-none">
                <ShieldCheck size={120} />
              </div>
              <span className="badge badge-success self-start mb-3">System Operational</span>
              <h2 className="text-2xl md:text-3xl font-extrabold text-white font-display">TPO Dashboard Analytics</h2>
              <p className="text-gray-400 mt-2 text-sm max-w-xl">
                Track recruitment drives, oversee student application cycles, update stage transitions, and generate cohort graphs.
              </p>
            </div>

            {/* Dashboard metrics */}
            <div className="metrics-grid">
              <div className="glass-card metric-card">
                <div className="metric-icon-box">
                  <Users size={20} />
                </div>
                <div className="metric-value">{totalStudentsCount}</div>
                <div className="metric-label">Total Student Roster</div>
              </div>

              <div className="glass-card metric-card success">
                <div className="metric-icon-box">
                  <Check size={20} />
                </div>
                <div className="metric-value">{placedCount}</div>
                <div className="metric-label">Placed Students ({placementRate}%)</div>
              </div>

              <div className="glass-card metric-card info">
                <div className="metric-icon-box">
                  <Briefcase size={20} />
                </div>
                <div className="metric-value">{activeDrivesCount}</div>
                <div className="metric-label">Active Drives Running</div>
              </div>

              <div className="glass-card metric-card warning">
                <div className="metric-icon-box">
                  <TrendingUp size={20} />
                </div>
                <div className="metric-value">{averagePackage} LPA</div>
                <div className="metric-label">Average CTC Offered</div>
              </div>
            </div>

            {/* Visual Charts (Custom SVGs) */}
            <div className="content-grid">
              {/* Chart 1: Drives package distribution */}
              <div className="glass-card flex flex-col gap-4">
                <h3 className="text-base font-bold text-white font-display flex items-center gap-2">
                  <TrendingUp size={16} className="text-indigo-400" />
                  Salary Package Distribution (LPA)
                </h3>
                
                <div className="chart-container flex items-end justify-around pt-6 border-b border-l border-white/5 pb-2">
                  {drives.map((drive) => {
                    const maxHeight = 160;
                    const maxPackage = Math.max(...drives.map(d => d.numericPackage), 35);
                    const barHeight = (drive.numericPackage / maxPackage) * maxHeight;
                    
                    return (
                      <div key={drive.id} className="flex flex-col items-center group w-12 relative">
                        {/* Tooltip value */}
                        <span className="absolute -top-6 bg-slate-900 border border-indigo-500/20 text-[10px] text-white px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity font-mono z-10">
                          {drive.package}
                        </span>
                        
                        {/* SVG Bar */}
                        <div 
                          className="w-8 rounded-t-md custom-chart-bar"
                          style={{
                            height: `${barHeight}px`,
                            background: `linear-gradient(to top, hsl(var(--color-primary)), hsl(var(--color-secondary)))`,
                            boxShadow: '0 0 15px -3px hsl(var(--color-primary) / 30%)'
                          }}
                        ></div>
                        
                        <p className="text-[10px] text-gray-500 mt-2 truncate w-full text-center" title={drive.companyName}>
                          {drive.companyName}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Chart 2: Branch Placements rate */}
              <div className="glass-card flex flex-col gap-4">
                <h3 className="text-base font-bold text-white font-display flex items-center gap-2">
                  <Users size={16} className="text-purple-400" />
                  Placement Rates by Department
                </h3>
                
                <div className="flex flex-col gap-3.5 justify-center py-2 h-full">
                  {branchData.map((data) => (
                    <div key={data.name} className="flex flex-col gap-1.5">
                      <div className="flex justify-between text-[11px]">
                        <span className="text-gray-300 font-medium">{data.name}</span>
                        <span className="text-indigo-300 font-bold font-mono">{data.pct}% ({data.placed}/{data.total})</span>
                      </div>
                      <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden border border-white/5">
                        <div 
                          className="h-full bg-gradient-to-r from-purple-500 to-indigo-500 rounded-full transition-all duration-1000"
                          style={{ width: `${data.pct}%` }}
                        ></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: DRIVE MANAGEMENT */}
        {activeTab === 'drives' && (
          <div className="flex flex-col gap-6 animate-slide-in">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-xl font-bold text-white font-display">Manage Recruitment Drives</h2>
                <p className="text-xs text-gray-400 mt-1">Configure selection criteria, branches eligibility, and recruitment steps.</p>
              </div>
              <button 
                onClick={() => setShowDriveForm(!showDriveForm)} 
                className="btn btn-primary"
              >
                {showDriveForm ? <X size={16} /> : <Plus size={16} />}
                {showDriveForm ? 'Close Editor' : 'Launch New Drive'}
              </button>
            </div>

            {/* Form Drawer */}
            {showDriveForm && (
              <form onSubmit={handleDriveSubmit} className="glass-card animate-slide-in grid grid-cols-1 md:grid-cols-2 gap-4" style={{ borderLeft: '4px solid hsl(var(--color-primary))' }}>
                <div className="input-group">
                  <label className="input-label">Company Name</label>
                  <input
                    type="text"
                    required
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    placeholder="e.g. Google"
                    className="input-field"
                  />
                </div>

                <div className="input-group">
                  <label className="input-label">Job Role Name</label>
                  <input
                    type="text"
                    required
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    placeholder="e.g. Associate Software Engineer"
                    className="input-field"
                  />
                </div>

                <div className="input-group">
                  <label className="input-label">CTC Package (Text)</label>
                  <input
                    type="text"
                    required
                    value={pkg}
                    onChange={(e) => setPkg(e.target.value)}
                    placeholder="e.g. 18 LPA"
                    className="input-field"
                  />
                </div>

                <div className="input-group">
                  <label className="input-label">Package (Numeric, for charts)</label>
                  <input
                    type="number"
                    required
                    value={numericPkg}
                    onChange={(e) => setNumericPkg(Number(e.target.value))}
                    min={1}
                    className="input-field"
                  />
                </div>

                <div className="input-group">
                  <label className="input-label">CGPA Cut-off threshold</label>
                  <input
                    type="number"
                    step="0.1"
                    required
                    value={cgpaCutoff}
                    onChange={(e) => setCgpaCutoff(Number(e.target.value))}
                    min={0}
                    max={10}
                    className="input-field"
                  />
                </div>

                <div className="input-group">
                  <label className="input-label">Max Active Backlogs Allowed</label>
                  <input
                    type="number"
                    required
                    value={maxBacklogs}
                    onChange={(e) => setMaxBacklogs(Number(e.target.value))}
                    min={0}
                    className="input-field"
                  />
                </div>

                <div className="input-group md:col-span-2">
                  <label className="input-label">Eligible Branches</label>
                  <div className="flex flex-wrap gap-4 mt-1 bg-white/5 border border-white/10 p-3.5 rounded-xl">
                    {branches.map(br => (
                      <label key={br} className="flex items-center gap-2 text-xs cursor-pointer text-gray-300">
                        <input
                          type="checkbox"
                          checked={allowedBranches.includes(br)}
                          onChange={() => handleBranchCheckbox(br)}
                          className="accent-indigo-500"
                        />
                        {br}
                      </label>
                    ))}
                  </div>
                </div>

                <div className="input-group">
                  <label className="input-label">Registration Deadline</label>
                  <input
                    type="date"
                    required
                    value={deadline}
                    onChange={(e) => setDeadline(e.target.value)}
                    className="input-field"
                  />
                </div>

                <div className="input-group">
                  <label className="input-label">Required Skills (Comma separated)</label>
                  <input
                    type="text"
                    required
                    value={skillsRequiredText}
                    onChange={(e) => setSkillsRequiredText(e.target.value)}
                    className="input-field"
                  />
                </div>

                <div className="input-group md:col-span-2">
                  <label className="input-label">Recruitment Pipeline Rounds (Comma separated order)</label>
                  <input
                    type="text"
                    required
                    value={roundsText}
                    onChange={(e) => setRoundsText(e.target.value)}
                    className="input-field"
                  />
                </div>

                <div className="input-group md:col-span-2 mb-0">
                  <label className="input-label">Job Description summary</label>
                  <textarea
                    rows={4}
                    value={jobDesc}
                    onChange={(e) => setJobDesc(e.target.value)}
                    placeholder="Provide full description of job role expectations..."
                    className="input-field resize-none text-xs"
                  ></textarea>
                </div>

                <button 
                  type="submit" 
                  className="btn btn-primary md:col-span-2 py-3"
                >
                  Create and Launch Campaign
                </button>
              </form>
            )}

            {/* Drives list */}
            <div className="flex flex-col gap-4">
              {drives.map(drive => (
                <div key={drive.id} className="glass-card flex flex-col md:flex-row justify-between md:items-center gap-4">
                  <div>
                    <div className="flex items-center gap-3">
                      <h3 className="font-bold text-white text-base font-display">{drive.companyName}</h3>
                      <span className="badge badge-info">{drive.package}</span>
                      <span className={`badge ${drive.active ? 'badge-success' : 'badge-danger'}`}>
                        {drive.active ? 'Active' : 'Closed'}
                      </span>
                    </div>
                    <p className="text-xs text-indigo-400 mt-1 font-semibold">{drive.role}</p>
                    <p className="text-xs text-slate-400 leading-relaxed max-w-3xl mt-1.5">{drive.jobDesc}</p>
                    
                    <div className="flex gap-4 flex-wrap mt-3 text-[10px] text-gray-500 font-semibold">
                      <span>Cut-off: {drive.cgpaCutoff} CGPA</span>
                      <span>Max Backlogs: {drive.maxBacklogs}</span>
                      <span>Candidates Registered: {drive.registeredCount}</span>
                      <span>Deadline: {drive.deadline}</span>
                    </div>
                  </div>

                  <div className="flex md:flex-col gap-2 shrink-0">
                    <button
                      onClick={() => onToggleDriveActive(drive.id)}
                      className={`btn btn-sm ${drive.active ? 'btn-danger' : 'btn-success'}`}
                    >
                      {drive.active ? 'Suspend Drive' : 'Reactivate'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 3: STUDENT DATABASE */}
        {activeTab === 'students' && (
          <div className="flex flex-col gap-6 animate-slide-in">
            <div>
              <h2 className="text-xl font-bold text-white font-display">Student Placement Roster</h2>
              <p className="text-xs text-gray-400 mt-1">Review student eligibility database, check academic status, edit placements status, and view resume scoring analysis.</p>
            </div>

            {/* Filter tools */}
            <div className="glass-card grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 p-5">
              <div className="input-group mb-0">
                <label className="input-label">Search Student</label>
                <div className="relative">
                  <input
                    type="text"
                    value={studentSearch}
                    onChange={(e) => setStudentSearch(e.target.value)}
                    placeholder="Search by name/email..."
                    className="input-field pl-9 text-xs"
                  />
                  <Search className="absolute left-3 top-3.5 text-gray-500" size={14} />
                </div>
              </div>

              <div className="input-group mb-0">
                <label className="input-label">Branch/Department</label>
                <select
                  value={branchFilter}
                  onChange={(e) => setBranchFilter(e.target.value)}
                  className="input-field text-xs"
                >
                  <option value="All">All Departments</option>
                  {branches.map(br => <option key={br} value={br}>{br}</option>)}
                </select>
              </div>

              <div className="input-group mb-0">
                <label className="input-label">Placement Status</label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="input-field text-xs"
                >
                  <option value="All">All Status</option>
                  <option value="Placed">Placed</option>
                  <option value="Unplaced">Unplaced</option>
                </select>
              </div>

              <div className="input-group mb-0">
                <label className="input-label flex justify-between">
                  <span>Minimum CGPA</span>
                  <span className="font-bold text-indigo-400">{minCgpaFilter.toFixed(1)}</span>
                </label>
                <input
                  type="range"
                  min="5.0"
                  max="10.0"
                  step="0.1"
                  value={minCgpaFilter}
                  onChange={(e) => setMinCgpaFilter(Number(e.target.value))}
                  className="accent-indigo-500 mt-2.5"
                />
              </div>
            </div>

            {/* Student grid table */}
            <div className="glass-card overflow-x-auto p-0 border border-white/5">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-white/5 text-gray-400 font-bold bg-slate-950/20">
                    <th className="p-4">Name</th>
                    <th className="p-4">Branch</th>
                    <th className="p-4">CGPA / Backlogs</th>
                    <th className="p-4">Placement Status</th>
                    <th className="p-4">ATS Match</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 text-gray-300">
                  {filteredStudents.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-gray-500">
                        No students match the selected filter parameters.
                      </td>
                    </tr>
                  ) : (
                    filteredStudents.map(student => (
                      <tr key={student.id} className="hover:bg-white/20 transition-colors">
                        <td className="p-4 font-semibold text-white">
                          <p>{student.name}</p>
                          <p className="text-[10px] text-gray-500 font-normal">{student.email}</p>
                        </td>
                        <td className="p-4">{student.branch}</td>
                        <td className="p-4 font-mono font-medium">
                          {student.cgpa} CGPA / {student.backlogs} Backlogs
                        </td>
                        <td className="p-4">
                          {student.placementStatus === 'Placed' ? (
                            <div className="flex flex-col gap-0.5">
                              <span className="badge badge-success">Placed</span>
                              <span className="text-[10px] text-slate-400 font-semibold truncate max-w-[120px]" title={student.placedCompany}>
                                @ {student.placedCompany} ({student.placedPackage})
                              </span>
                            </div>
                          ) : (
                            <span className="badge badge-warning">Unplaced</span>
                          )}
                        </td>
                        <td className="p-4 font-mono font-bold text-indigo-400">
                          {student.resumeScore}%
                        </td>
                        <td className="p-4 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => setSelectedStudentForResume(student)}
                              className="btn btn-secondary btn-sm p-1.5"
                              title="Review Resume Text"
                            >
                              <FileText size={14} />
                            </button>
                            
                            {statusChangeStudentId === student.id ? (
                              <div className="flex gap-1 items-center bg-slate-900 border border-white/10 p-2 rounded-xl text-left absolute right-4 z-55 animate-slide-in shadow-2xl">
                                <div className="flex flex-col gap-1.5">
                                  <input
                                    type="text"
                                    placeholder="Company Name"
                                    value={placedCompanyInput}
                                    onChange={(e) => setPlacedCompanyInput(e.target.value)}
                                    className="input-field p-1 text-[10px] w-28 h-7"
                                  />
                                  <input
                                    type="text"
                                    placeholder="LPA Package"
                                    value={placedPackageInput}
                                    onChange={(e) => setPlacedPackageInput(e.target.value)}
                                    className="input-field p-1 text-[10px] w-28 h-7"
                                  />
                                  <div className="flex justify-end gap-1">
                                    <button 
                                      onClick={() => setStatusChangeStudentId(null)}
                                      className="btn btn-danger btn-sm p-1 h-5 text-[9px]"
                                    >
                                      Cancel
                                    </button>
                                    <button 
                                      onClick={() => handleManualStatusSave(student.id)}
                                      className="btn btn-success btn-sm p-1 h-5 text-[9px]"
                                    >
                                      Save
                                    </button>
                                  </div>
                                </div>
                              </div>
                            ) : (
                              <button
                                onClick={() => {
                                  if (student.placementStatus === 'Placed') {
                                    // Set back to unplaced
                                    onUpdateStudentStatus(student.id);
                                  } else {
                                    setStatusChangeStudentId(student.id);
                                  }
                                }}
                                className={`btn btn-sm ${student.placementStatus === 'Placed' ? 'btn-danger' : 'btn-success'}`}
                              >
                                {student.placementStatus === 'Placed' ? 'Mark Unplaced' : 'Set Placed'}
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
          </div>
        )}

        {/* TAB 4: LIVE RECRUITMENT TRACKER */}
        {activeTab === 'tracker' && (
          <div className="flex flex-col gap-6 animate-slide-in">
            <div className="flex justify-between items-center flex-wrap gap-4">
              <div>
                <h2 className="text-xl font-bold text-white font-display">Live Round Stage Tracker</h2>
                <p className="text-xs text-gray-400 mt-1">Select an active placement campaign and coordinator pipeline. Drag-click students to coordinate rounds.</p>
              </div>

              <div className="input-group max-w-xs mb-0">
                <select
                  value={trackerDriveId}
                  onChange={(e) => setTrackerDriveId(e.target.value)}
                  className="input-field text-xs h-9 py-1"
                >
                  {drives.map(drv => (
                    <option key={drv.id} value={drv.id}>{drv.companyName} - {drv.role}</option>
                  ))}
                </select>
              </div>
            </div>

            {activeTrackerDrive ? (
              <div className="flex flex-col gap-4">
                <div className="glass-card p-4 bg-slate-900/50 flex gap-4 text-xs">
                  <div className="flex-1">
                    <span className="text-gray-500 font-semibold">Recruiting:</span> <span className="text-white font-bold">{activeTrackerDrive.companyName}</span>
                  </div>
                  <div className="flex-1">
                    <span className="text-gray-500 font-semibold">Package:</span> <span className="text-white font-bold">{activeTrackerDrive.package}</span>
                  </div>
                  <div className="flex-1">
                    <span className="text-gray-500 font-semibold">Total Steps:</span> <span className="text-indigo-400 font-bold">{activeTrackerDrive.rounds.join(' ➔ ')}</span>
                  </div>
                </div>

                {/* Kanban board layout */}
                <div className="live-tracker-board">
                  {activeTrackerDrive.rounds.map((roundName, colIndex) => {
                    // Filter candidates in this specific round index
                    const columnApplications = activeTrackerApplications.filter(item => 
                      item.app.currentRoundIndex === colIndex
                    );

                    const isLastCol = colIndex === activeTrackerDrive.rounds.length - 1;

                    return (
                      <div key={roundName} className="tracker-column animate-slide-in">
                        <div className="column-header">
                          <h4 className="column-title truncate max-w-[140px]" title={roundName}>{roundName}</h4>
                          <span className="column-count">{columnApplications.length}</span>
                        </div>

                        <div className="flex flex-col gap-2 pt-2">
                          {columnApplications.length === 0 ? (
                            <div className="text-center py-8 text-gray-600 text-[10px]">
                              Empty Stage
                            </div>
                          ) : (
                            columnApplications.map(({ student }) => (
                              <div key={student.id} className="candidate-card">
                                <p className="candidate-name text-white truncate">{student.name}</p>
                                <p className="candidate-details mt-0.5">{student.branch} (CGPA: {student.cgpa})</p>
                                
                                <div className="candidate-actions">
                                  <button
                                    onClick={() => onRejectStudent(student.id, activeTrackerDrive.id)}
                                    className="btn btn-danger btn-sm p-1 h-5 text-[9px] flex items-center justify-center"
                                    title="Mark Rejected"
                                  >
                                    <X size={10} />
                                  </button>
                                  <button
                                    onClick={() => onPromoteStudent(student.id, activeTrackerDrive.id, colIndex + 1, isLastCol)}
                                    className="btn btn-success btn-sm p-1 h-5 text-[9px] flex items-center gap-1"
                                    title={isLastCol ? 'Select Candidate' : 'Move Next'}
                                  >
                                    {isLastCol ? 'Select' : <ArrowRight size={10} />}
                                  </button>
                                </div>
                              </div>
                            ))
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="glass-card text-center py-12 text-gray-500">
                <Briefcase size={40} className="mx-auto opacity-20 mb-3" />
                <p className="text-sm">Please launch recruitment drives to activate Tracker pipelines.</p>
              </div>
            )}
          </div>
        )}

      </main>

      {/* Student Resume Review Modal overlay */}
      {selectedStudentForResume && (
        <div className="modal-overlay animate-slide-in">
          <div className="glass-card modal-content p-6 relative">
            <button 
              onClick={() => setSelectedStudentForResume(null)}
              className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"
            >
              <X size={20} />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <FileText size={24} className="text-indigo-400" />
              <div>
                <h3 className="text-lg font-bold text-white font-display">Resume Analyzer Report</h3>
                <p className="text-xs text-gray-400">Candidate: {selectedStudentForResume.name} ({selectedStudentForResume.branch})</p>
              </div>
            </div>

            <div className="flex gap-6 items-center p-3 bg-white/5 border border-white/10 rounded-xl mb-4 text-xs">
              <div>
                <span className="text-gray-500 font-semibold">ATS Compatibility Score:</span>{' '}
                <span className="font-mono font-bold text-indigo-400 text-sm">{selectedStudentForResume.resumeScore}%</span>
              </div>
              <div>
                <span className="text-gray-500 font-semibold">Projects count:</span>{' '}
                <span className="text-white font-bold">{selectedStudentForResume.projectsCount}</span>
              </div>
            </div>

            <h4 className="text-xs font-bold uppercase text-gray-400 tracking-wider mb-2">Resume Plain Text Body</h4>
            <div className="bg-black/30 p-4 rounded-xl text-xs text-gray-300 leading-relaxed font-mono overflow-y-auto max-h-60 border border-white/5 whitespace-pre-wrap">
              {selectedStudentForResume.resumeText}
            </div>

            <h4 className="text-xs font-bold uppercase text-gray-400 tracking-wider mb-2 mt-4">Candidate Skills</h4>
            <div className="flex flex-wrap gap-1">
              {selectedStudentForResume.skills.map(s => (
                <span key={s} className="px-2.5 py-0.5 bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 rounded text-[10px]">{s}</span>
              ))}
            </div>

            <button
              onClick={() => setSelectedStudentForResume(null)}
              className="btn btn-secondary btn-sm w-full mt-6"
            >
              Close Analyzer
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
