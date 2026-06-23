import React, { useState } from 'react';
import {
  LayoutDashboard,
  Briefcase,
  FileCheck,
  MessageSquare,
  TrendingUp,
  Award,
  AlertCircle,
  Sparkles,
  Send,
  User,
  Search,
  Check,
  X,
  ArrowRight,
  ClipboardCopy,
  Clock,
  Plus
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { DashboardShell } from './DashboardShell';
import { MOCK_RESUME_TIPS, MOCK_INTERVIEW_QAS } from '../mockData';
import type { Student, PlacementDrive } from '../mockData';
import type { AppNotification } from './NotificationCenter';

interface StudentPortalProps {
  currentStudent: Student;
  drives: PlacementDrive[];
  onLogout: () => void;
  onApply: (driveId: string) => void;
  onUpdateResumeScore: (score: number, resumeText: string) => void;
  onUpdateStudentProfile: (updatedStudent: Student) => void;
  notifications: AppNotification[];
  onMarkAsRead: (id: string) => void;
  onMarkAllAsRead: () => void;
  onClearNotification: (id: string) => void;
  onClearAll: () => void;
  theme: 'light' | 'dark';
  toggleTheme: () => void;
}

export const StudentPortal: React.FC<StudentPortalProps> = ({
  currentStudent,
  drives,
  onLogout,
  onApply,
  onUpdateResumeScore,
  onUpdateStudentProfile,
  notifications,
  onMarkAsRead,
  onMarkAllAsRead,
  onClearNotification,
  onClearAll,
  theme,
  toggleTheme
}) => {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'drives' | 'ats' | 'interview' | 'visualizer' | 'profile'>('dashboard');

  // Profile Settings States
  const [profileName, setProfileName] = useState(currentStudent.name);
  const [profileEmail, setProfileEmail] = useState(currentStudent.email);
  const [profilePassword, setProfilePassword] = useState(currentStudent.password || '');
  const [profileBranch, setProfileBranch] = useState(currentStudent.branch);
  const [profileCgpa, setProfileCgpa] = useState(currentStudent.cgpa.toString());
  const [profileBacklogs, setProfileBacklogs] = useState(currentStudent.backlogs.toString());
  const [profileSkillsList, setProfileSkillsList] = useState<string[]>(currentStudent.skills);
  const [newSkillInput, setNewSkillInput] = useState('');
  const [profileProjects, setProfileProjects] = useState(currentStudent.projectsCount.toString());
  const [profileResume, setProfileResume] = useState(currentStudent.resumeText || '');
  const [profileCertifications, setProfileCertifications] = useState<string[]>(['AWS Cloud Practitioner', 'Google UX Design Professional Certificate']);
  const [newCertInput, setNewCertInput] = useState('');

  // ATS Resume Scorer State
  const [resumeTextInput, setResumeTextInput] = useState(currentStudent.resumeText || '');
  const [atsReport, setAtsReport] = useState<{
    score: number;
    foundKeywords: string[];
    missingKeywords: string[];
    foundVerbs: string[];
    hasMetrics: boolean;
    recommendations: string[];
  } | null>(null);

  // Mock Interview State
  const [interviewRole, setInterviewRole] = useState<'Software Engineer' | 'Analyst' | null>(null);
  const [interviewQuestions, setInterviewQuestions] = useState<
    Array<{ question: string; correctKeywords: string[]; sampleFollowUp: string }>
  >([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [userAnswer, setUserAnswer] = useState('');
  const [chatHistory, setChatHistory] = useState<Array<{ sender: 'user' | 'bot' | 'feedback'; text: string }>>([]);
  const [isInterviewFinished, setIsInterviewFinished] = useState(false);
  const [interviewScores, setInterviewScores] = useState<number[]>([]);

  // Pipeline Visualizer State
  const [selectedApplicationId, setSelectedApplicationId] = useState<string>(
    currentStudent.applications[0]?.driveId || ''
  );

  // Recruitment Drives Filters & Search
  const [driveSearch, setDriveSearch] = useState('');
  const [driveBranchFilter, setDriveBranchFilter] = useState('All');
  const [driveEligibilityFilter, setDriveEligibilityFilter] = useState('All'); // All, Eligible, Applied
  const [driveSortOrder, setDriveSortOrder] = useState('PackageDesc'); // PackageDesc, DeadlineAsc, MatchDesc

  // Show eligibility detail modal
  const [eligibilityDetailsDrive, setEligibilityDetailsDrive] = useState<PlacementDrive | null>(null);

  // Computations
  const totalApplied = currentStudent.applications.length;
  const isPlaced = currentStudent.placementStatus === 'Placed';

  // Smart Compatibility Math
  const getCompatibility = (student: Student, drive: PlacementDrive) => {
    const isGpaEligible = student.cgpa >= drive.cgpaCutoff;
    const isBacklogEligible = student.backlogs <= drive.maxBacklogs;
    const isBranchEligible = drive.allowedBranches.includes(student.branch);
    const eligible = isGpaEligible && isBacklogEligible && isBranchEligible;

    if (!eligible) {
      return {
        eligible: false,
        score: 0,
        reasons: [
          !isGpaEligible && `GPA Cut-off is ${drive.cgpaCutoff} (your CGPA: ${student.cgpa})`,
          !isBacklogEligible && `Maximum backlogs allowed is ${drive.maxBacklogs} (your backlogs: ${student.backlogs})`,
          !isBranchEligible && `Allowed branches: ${drive.allowedBranches.join(', ')} (your branch: ${student.branch})`
        ].filter(Boolean) as string[]
      };
    }

    const requiredSkills = drive.skillsRequired;
    const studentSkills = student.skills;
    const matchingSkills = requiredSkills.filter(s =>
      studentSkills.some(ss => ss.toLowerCase() === s.toLowerCase())
    );

    const skillScore = requiredSkills.length > 0 ? (matchingSkills.length / requiredSkills.length) * 70 : 70;
    const gpaBonus = Math.min(((student.cgpa - drive.cgpaCutoff) / (10 - drive.cgpaCutoff)) * 30, 30);
    const overallScore = Math.min(Math.round(skillScore + Math.max(0, gpaBonus)), 100);

    return { eligible: true, score: overallScore, matchingSkills };
  };

  // 1. Placement Readiness Index Score (Calculated SaaS Gauge metric)
  const calculateReadinessScore = () => {
    const gpaWeight = Math.min(currentStudent.cgpa / 10, 1) * 40; // max 40 points
    const resumeWeight = (currentStudent.resumeScore / 100) * 30; // max 30 points
    const backlogWeight = currentStudent.backlogs === 0 ? 20 : Math.max(0, 20 - currentStudent.backlogs * 10); // max 20 points
    const projectsWeight = Math.min(currentStudent.projectsCount / 4, 1) * 10; // max 10 points
    return Math.round(gpaWeight + resumeWeight + backlogWeight + projectsWeight);
  };
  const readinessScore = calculateReadinessScore();

  // 2. Skill Gap Analysis
  const getSkillGap = () => {
    const allRequiredSkills = new Set<string>();
    drives.forEach(d => {
      d.skillsRequired.forEach(s => allRequiredSkills.add(s));
    });

    const studentSkillsLower = new Set(currentStudent.skills.map(s => s.toLowerCase()));
    const missing = Array.from(allRequiredSkills).filter(s => !studentSkillsLower.has(s.toLowerCase()));

    // Return top 5 missing skills that are popular in drives
    return missing.slice(0, 5);
  };
  const missingSkills = getSkillGap();

  // 3. Recommended Drives (Eligible and high compatibility match %)
  const getRecommendedDrives = () => {
    return drives
      .filter(d => {
        const comp = getCompatibility(currentStudent, d);
        const hasApplied = currentStudent.applications.some(a => a.driveId === d.id);
        return comp.eligible && !hasApplied;
      })
      .map(d => ({ drive: d, comp: getCompatibility(currentStudent, d) }))
      .sort((a, b) => b.comp.score - a.comp.score)
      .slice(0, 3);
  };
  const recommendationsList = getRecommendedDrives();

  // 4. Upcoming Drive Timeline Calendar (Calculates remaining days)
  const getRemainingDays = (dateStr: string) => {
    const today = new Date();
    const deadline = new Date(dateStr);
    const diffTime = deadline.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const activeDrivesCount = drives.filter(d => d.active).length;

  const getUpcomingDrives = () => {
    return drives
      .filter(d => d.active && getRemainingDays(d.deadline) >= 0)
      .sort((a, b) => new Date(a.deadline).getTime() - new Date(b.deadline).getTime())
      .slice(0, 4);
  };
  const upcomingDrivesList = getUpcomingDrives();

  const getSortedDrives = () => {
    const copy = [...drives];
    
    // Filter searches
    const filtered = copy.filter(d => {
      const matchesSearch = d.companyName.toLowerCase().includes(driveSearch.toLowerCase()) ||
                            d.role.toLowerCase().includes(driveSearch.toLowerCase()) ||
                            d.jobDesc.toLowerCase().includes(driveSearch.toLowerCase());
      const matchesBranch = driveBranchFilter === 'All' || d.allowedBranches.includes(driveBranchFilter);
      
      const comp = getCompatibility(currentStudent, d);
      const hasApplied = currentStudent.applications.some(a => a.driveId === d.id);
      
      let matchesEligibility = true;
      if (driveEligibilityFilter === 'Eligible') {
        matchesEligibility = comp.eligible && !hasApplied;
      } else if (driveEligibilityFilter === 'Applied') {
        matchesEligibility = hasApplied;
      }

      return matchesSearch && matchesBranch && matchesEligibility;
    });

    // Sort order
    return filtered.sort((a, b) => {
      if (driveSortOrder === 'PackageDesc') {
        return b.numericPackage - a.numericPackage;
      } else if (driveSortOrder === 'DeadlineAsc') {
        return new Date(a.deadline).getTime() - new Date(b.deadline).getTime();
      } else if (driveSortOrder === 'MatchDesc') {
        const scoreA = getCompatibility(currentStudent, a).score;
        const scoreB = getCompatibility(currentStudent, b).score;
        return scoreB - scoreA;
      }
      return 0;
    });
  };

  const filteredDrives = getSortedDrives();

  // Run ATS Scan
  const handleAtsScan = () => {
    if (!resumeTextInput.trim()) return;

    const textLower = resumeTextInput.toLowerCase();
    const foundKeywords: string[] = [];
    const missingKeywords: string[] = [];

    MOCK_RESUME_TIPS.keywords.forEach(kw => {
      if (textLower.includes(kw.word.toLowerCase())) {
        foundKeywords.push(kw.word);
      } else {
        missingKeywords.push(kw.word);
      }
    });

    const foundVerbs: string[] = [];
    MOCK_RESUME_TIPS.actionVerbs.forEach(verb => {
      if (textLower.includes(verb.toLowerCase())) {
        foundVerbs.push(verb);
      }
    });

    const metricsRegex = /\b\d+(?:%|\s*k|\s*x|\s*lakhs|\s*percent|\s*million|\s*projects)\b|(?:\d+\+)/i;
    const hasMetrics = metricsRegex.test(textLower);

    let calcScore = 40;
    const keywordPct = foundKeywords.length / MOCK_RESUME_TIPS.keywords.length;
    calcScore += Math.round(keywordPct * 35);

    const verbPct = Math.min(foundVerbs.length / 5, 1);
    calcScore += Math.round(verbPct * 15);

    if (hasMetrics) calcScore += 10;
    calcScore = Math.min(calcScore, 100);

    const recommendations: string[] = [];
    if (foundKeywords.length < 5) {
      recommendations.push("Inject more industry technical skills (e.g., " + missingKeywords.slice(0, 3).join(', ') + ").");
    }
    if (foundVerbs.length < 3) {
      recommendations.push("Begin work experience lines with robust verbs such as " + MOCK_RESUME_TIPS.actionVerbs.slice(0, 3).join(', ') + ".");
    }
    if (!hasMetrics) {
      recommendations.push("Quantify your project outcomes (e.g., 'rendered 40% faster latency', 'served 200+ users').");
    }
    if (resumeTextInput.length < 150) {
      recommendations.push("Expand details: Add core programming languages, database structures, and testing setups.");
    } else if (resumeTextInput.length > 1200) {
      recommendations.push("Concise format suggested. Reduce text volume to preserve scan density indicators.");
    }

    if (recommendations.length === 0) {
      recommendations.push("Excellent work! Resume text indicators are highly optimized for university recruiters.");
    }

    setAtsReport({
      score: calcScore,
      foundKeywords,
      missingKeywords,
      foundVerbs,
      hasMetrics,
      recommendations
    });

    onUpdateResumeScore(calcScore, resumeTextInput);
  };

  const handleCopyMissingKeywords = () => {
    if (!atsReport || atsReport.missingKeywords.length === 0) return;
    const missingStr = atsReport.missingKeywords.join(', ');
    navigator.clipboard.writeText(missingStr);
    alert('Missing keywords copied to clipboard! Paste them into your skill profile.');
  };

  // Add skill tag
  const handleAddSkillTag = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSkillInput.trim()) return;
    const skill = newSkillInput.trim();
    if (!profileSkillsList.includes(skill)) {
      setProfileSkillsList([...profileSkillsList, skill]);
    }
    setNewSkillInput('');
  };

  const handleRemoveSkillTag = (skillToRemove: string) => {
    setProfileSkillsList(profileSkillsList.filter(s => s !== skillToRemove));
  };

  // Add certification tag
  const handleAddCert = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCertInput.trim()) return;
    const cert = newCertInput.trim();
    if (!profileCertifications.includes(cert)) {
      setProfileCertifications([...profileCertifications, cert]);
    }
    setNewCertInput('');
  };

  const handleRemoveCert = (certToRemove: string) => {
    setProfileCertifications(profileCertifications.filter(c => c !== certToRemove));
  };

  // Calculate Profile Completion %
  const calculateProfileCompletion = () => {
    let completion = 0;
    if (profileName.trim()) completion += 15;
    if (profileEmail.trim()) completion += 10;
    if (profilePassword.trim()) completion += 10;
    if (parseFloat(profileCgpa) > 0) completion += 15;
    if (profileSkillsList.length >= 3) completion += 15;
    if (parseInt(profileProjects) > 0) completion += 15;
    if (profileResume.trim().length > 100) completion += 10;
    if (profileCertifications.length > 0) completion += 10;
    return completion;
  };
  const profileCompletion = calculateProfileCompletion();

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    const cgpaNum = parseFloat(profileCgpa);
    if (isNaN(cgpaNum) || cgpaNum < 0 || cgpaNum > 10) {
      alert('CGPA must be a decimal value between 0 and 10.');
      return;
    }
    const backlogsNum = parseInt(profileBacklogs);
    if (isNaN(backlogsNum) || backlogsNum < 0) {
      alert('Backlog count cannot be negative.');
      return;
    }

    const updatedStudent: Student = {
      ...currentStudent,
      name: profileName.trim(),
      email: profileEmail.trim(),
      password: profilePassword,
      branch: profileBranch,
      cgpa: cgpaNum,
      backlogs: backlogsNum,
      skills: profileSkillsList,
      projectsCount: parseInt(profileProjects) || 0,
      resumeText: profileResume.trim()
    };

    onUpdateStudentProfile(updatedStudent);
  };

  // Start Interview Chat Simulator
  const handleStartInterview = (role: 'Software Engineer' | 'Analyst') => {
    setInterviewRole(role);
    const qas = MOCK_INTERVIEW_QAS[role];
    setInterviewQuestions(qas);
    setCurrentQuestionIndex(0);
    setUserAnswer('');
    setIsInterviewFinished(false);
    setInterviewScores([]);

    setChatHistory([
      { sender: 'bot', text: `Welcome to the interactive ${role} Simulator. I will guide you through core concept inquiries. Let's begin!` },
      { sender: 'bot', text: `Question 1: ${qas[0].question}` }
    ]);
  };

  // Submit Answer to Chatbot
  const handleSendAnswer = () => {
    if (!userAnswer.trim() || !interviewRole) return;

    const answer = userAnswer.trim();
    const currentQuestion = interviewQuestions[currentQuestionIndex];

    const updatedHistory = [...chatHistory, { sender: 'user' as const, text: answer }];
    setChatHistory(updatedHistory);
    setUserAnswer('');

    const answerLower = answer.toLowerCase();
    const matchedKeywords = currentQuestion.correctKeywords.filter((kw: string) =>
      answerLower.includes(kw.toLowerCase())
    );

    const scoreVal = Math.min(2 + matchedKeywords.length * 2.5, 10);
    const newScores = [...interviewScores, scoreVal];
    setInterviewScores(newScores);

    let feedbackText = `[SaaS Feedback Evaluation] score: ${Math.round(scoreVal * 10)}% match.\n`;
    if (matchedKeywords.length > 0) {
      feedbackText += `Targeted terms identified: "${matchedKeywords.join(', ')}". `;
    } else {
      feedbackText += `Missed technical terms. Consider linking related keywords. `;
    }

    if (scoreVal < 6) {
      feedbackText += `Advice: Strengthen explanation by including context on: "${currentQuestion.correctKeywords.slice(0, 3).join(', ')}".`;
    } else {
      feedbackText += `Excellent grasp of core architectural patterns.`;
    }

    const historyWithFeedback = [...updatedHistory, { sender: 'feedback' as const, text: feedbackText }];
    setChatHistory(historyWithFeedback);

    setTimeout(() => {
      const nextIndex = currentQuestionIndex + 1;
      if (nextIndex < interviewQuestions.length) {
        setCurrentQuestionIndex(nextIndex);
        setChatHistory(prev => [
          ...prev,
          { sender: 'bot', text: `Question ${nextIndex + 1}: ${interviewQuestions[nextIndex].question}` }
        ]);
      } else {
        setIsInterviewFinished(true);
        const finalAverage = Math.round((newScores.reduce((a, b) => a + b, 0) / newScores.length) * 10);
        setChatHistory(prev => [
          ...prev,
          { sender: 'bot', text: `Interview successfully completed!` },
          { sender: 'bot', text: `Overall Skill Assessment Grade: ${finalAverage}% match. Recommended next step: Review missing keywords.` }
        ]);
      }
    }, 1000);
  };

  const selectedApp = currentStudent.applications.find(app => app.driveId === selectedApplicationId);
  const selectedDrive = drives.find(d => d.id === selectedApplicationId);

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard size={18} /> },
    { id: 'drives', label: 'Placement Drives', icon: <Briefcase size={18} /> },
    { id: 'ats', label: 'ATS Resume Scorer', icon: <FileCheck size={18} /> },
    { id: 'interview', label: 'Mock Interview', icon: <MessageSquare size={18} /> },
    { id: 'visualizer', label: 'Stage Visualizer', icon: <TrendingUp size={18} /> },
    { id: 'profile', label: 'Profile Settings', icon: <User size={18} /> }
  ];

  return (
    <DashboardShell
      role="student"
      userName={currentStudent.name}
      userSub={currentStudent.branch}
      avatarInitials={currentStudent.name.charAt(0)}
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
        
        {/* TAB 1: DASHBOARD */}
        {activeTab === 'dashboard' && (
          <motion.div
            key="dashboard-tab"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.2 }}
            className="flex flex-col gap-6"
          >
            {/* Banner Section */}
            <div className="dashboard-hero">
              <div className="absolute top-0 right-0 p-8 text-blue-500/10 pointer-events-none hidden md:block">
                <Sparkles size={130} />
              </div>
              <div className="hero-content-area flex flex-col justify-center">
                <span className="badge badge-primary self-start mb-3">Student Portal Active</span>
                <h2 className="text-2xl sm:text-3xl font-extrabold text-white font-display">
                  Welcome, {currentStudent.name.split(' ')[0]}!
                </h2>
                <p className="text-slate-400 mt-2 text-xs sm:text-sm leading-relaxed">
                  {isPlaced
                    ? `Placed! Offer secured at ${currentStudent.placedCompany}. Keep your certifications and profile updated.`
                    : "Track recruitment pipelines, match your profile skills against drives, and complete simulation interviews to increase hire eligibility."
                  }
                </p>
                {isPlaced && (
                  <div className="mt-4 bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 p-4 rounded-xl flex items-center gap-3 max-w-md">
                    <Award size={22} className="text-emerald-400 shrink-0" />
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-wider">Placed Offer Finalized</p>
                      <p className="text-sm font-semibold mt-0.5">{currentStudent.placedCompany} (Salary: {currentStudent.placedPackage})</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Top Row: 4-column KPI grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              
              {/* Placement Readiness Score */}
              <div className="glass-card flex flex-col justify-between p-5 relative overflow-hidden bg-slate-900/40">
                <div className="flex justify-between items-start">
                  <span className="text-xs font-bold text-slate-400 uppercase">Readiness Score</span>
                  <Award size={18} className="text-blue-500" />
                </div>
                <div className="flex items-center gap-4 mt-3">
                  <div className="relative flex items-center justify-center">
                    <svg width="60" height="60" className="transform -rotate-90">
                      <circle cx="30" cy="30" r="25" fill="transparent" stroke="rgba(255,255,255,0.05)" strokeWidth="5" />
                      <circle
                        cx="30"
                        cy="30"
                        r="25"
                        fill="transparent"
                        stroke="#2563eb"
                        strokeWidth="5"
                        strokeDasharray={2 * Math.PI * 25}
                        strokeDashoffset={2 * Math.PI * 25 * (1 - readinessScore / 100)}
                        strokeLinecap="round"
                        className="transition-all duration-1000"
                      />
                    </svg>
                    <span className="absolute text-xs font-black text-white">{readinessScore}%</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-xs text-slate-300 font-semibold">SaaS Index</span>
                    <span className="text-[10px] text-slate-500 mt-0.5">Eligibility Weight</span>
                  </div>
                </div>
              </div>

              {/* ATS Score */}
              <div className="glass-card flex flex-col justify-between p-5 bg-slate-900/40">
                <div className="flex justify-between items-start">
                  <span className="text-xs font-bold text-slate-400 uppercase">ATS Score</span>
                  <FileCheck size={18} className="text-emerald-400" />
                </div>
                <div className="mt-2">
                  <span className="text-3xl font-black text-white">{currentStudent.resumeScore}%</span>
                  <p className="text-[10px] text-slate-500 mt-1">Optimization Score</p>
                </div>
              </div>

              {/* Applications Count */}
              <div className="glass-card flex flex-col justify-between p-5 bg-slate-900/40">
                <div className="flex justify-between items-start">
                  <span className="text-xs font-bold text-slate-400 uppercase">Applications Count</span>
                  <Briefcase size={18} className="text-teal-400" />
                </div>
                <div className="mt-2">
                  <span className="text-3xl font-black text-white">{totalApplied}</span>
                  <p className="text-[10px] text-slate-500 mt-1">Submitted Campaigns</p>
                </div>
              </div>

              {/* Active Drives */}
              <div className="glass-card flex flex-col justify-between p-5 bg-slate-900/40">
                <div className="flex justify-between items-start">
                  <span className="text-xs font-bold text-slate-400 uppercase">Active Drives</span>
                  <TrendingUp size={18} className="text-blue-400" />
                </div>
                <div className="mt-2">
                  <span className="text-3xl font-black text-white">{activeDrivesCount}</span>
                  <p className="text-[10px] text-slate-500 mt-1">Ongoing Campaigns</p>
                </div>
              </div>

            </div>

            {/* Second Row: Upcoming Drives & Skill Gap Analysis */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              
              {/* Upcoming Drives Card */}
              <div className="glass-card flex flex-col gap-4 bg-slate-900/40">
                <div className="flex justify-between items-center pb-2 border-b border-slate-900">
                  <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                    <Clock size={16} className="text-blue-500 animate-pulse" />
                    Upcoming Drives
                  </h3>
                  <button onClick={() => setActiveTab('drives')} className="text-xs text-blue-400 hover:underline">
                    Explore All
                  </button>
                </div>

                {upcomingDrivesList.length === 0 ? (
                  <div className="text-center py-10 flex flex-col items-center justify-center gap-2">
                    <Clock size={40} className="text-slate-600 opacity-20" />
                    <p className="text-xs text-slate-500">No upcoming drives. You're all caught up!</p>
                  </div>
                ) : (
                  <div className="flex flex-col gap-3">
                    {upcomingDrivesList.map((drive) => {
                      const remainingDays = getRemainingDays(drive.deadline);
                      const isEligible = currentStudent.cgpa >= drive.cgpaCutoff && currentStudent.backlogs <= drive.maxBacklogs && drive.allowedBranches.includes(currentStudent.branch);
                      return (
                        <div
                          key={drive.id}
                          className="p-3 rounded-lg border border-slate-850 hover:border-slate-800 bg-slate-950/40 flex justify-between items-center transition-colors"
                        >
                          <div className="min-w-0">
                            <h4 className="font-bold text-white text-xs truncate">{drive.companyName}</h4>
                            <p className="text-[10px] text-slate-500 mt-0.5 leading-none">{drive.role} • {drive.package}</p>
                          </div>
                          
                          <div className="flex items-center gap-3">
                            <span className={`badge ${isEligible ? 'badge-primary' : 'badge-danger'} text-[9px]`}>
                              {isEligible ? 'Eligible' : 'Ineligible'}
                            </span>
                            <span className="inline-flex items-center gap-1 text-[10px] text-amber-500 font-semibold bg-amber-500/5 px-2 py-0.5 rounded border border-amber-500/10">
                              <Clock size={10} />
                              {remainingDays === 0 ? 'Closes Today' : `${remainingDays}d left`}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Skill Gap Analysis Card */}
              <div className="glass-card flex flex-col gap-4 bg-slate-900/40">
                <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2 pb-2 border-b border-slate-900">
                  <Sparkles size={16} className="text-teal-400" />
                  Skill Gap Analysis
                </h3>

                <div className="flex flex-col gap-4">
                  <div>
                    <p className="text-[11px] font-bold text-teal-400">Missing Key Technologies</p>
                    <p className="text-[10px] text-slate-400 mt-1 leading-relaxed">
                      Based on active corporate campus placements matching your branch, adding these tags to your profile can increase eligibility match scores:
                    </p>
                  </div>

                  {missingSkills.length === 0 ? (
                    <div className="p-3 bg-emerald-500/5 border border-emerald-500/10 rounded-xl flex items-center gap-2">
                      <Check className="text-emerald-400" size={16} />
                      <p className="text-[10px] text-emerald-300 font-semibold">Excellent! No skill gaps found. Your profile matches all active drives.</p>
                    </div>
                  ) : (
                    <div className="flex flex-wrap gap-1.5 py-1">
                      {missingSkills.map(skill => (
                        <span key={skill} className="px-2.5 py-1 bg-slate-950 text-slate-300 rounded-lg text-[10px] border border-slate-850 font-medium">
                          {skill}
                        </span>
                      ))}
                    </div>
                  )}

                  <div className="p-3.5 bg-slate-950/40 border border-slate-900 rounded-xl flex flex-col gap-2">
                    <p className="text-[10px] text-slate-400 leading-normal">
                      Update your skills tags, projects count, and resume to sync compatibility scoring in real-time.
                    </p>
                    <button
                      onClick={() => setActiveTab('profile')}
                      className="text-[10px] text-teal-400 hover:underline font-bold self-start flex items-center gap-1"
                    >
                      Update Profile Tags <ArrowRight size={10} />
                    </button>
                  </div>
                </div>
              </div>

            </div>

            {/* Third Row: Application Pipeline & Recommendations */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              
              {/* Application Pipeline Card */}
              <div className="glass-card flex flex-col gap-4 bg-slate-900/40">
                <div className="flex justify-between items-center pb-2 border-b border-slate-900">
                  <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                    <TrendingUp size={16} className="text-indigo-400" />
                    Application Pipeline
                  </h3>
                  <button onClick={() => setActiveTab('visualizer')} className="text-xs text-blue-400 hover:underline">
                    Track Stages
                  </button>
                </div>

                {totalApplied === 0 ? (
                  <div className="text-center py-10 flex flex-col items-center justify-center gap-2">
                    <Briefcase size={40} className="text-slate-600 opacity-20" />
                    <p className="text-xs text-slate-500">You haven't submitted any job applications yet.</p>
                  </div>
                ) : (
                  <div className="flex flex-col gap-3 max-h-[320px] overflow-y-auto pr-1 custom-scrollbar">
                    {currentStudent.applications.map((app) => (
                      <div
                        key={app.driveId}
                        className="p-3.5 rounded-lg border border-slate-850 hover:border-slate-800 bg-slate-950/40 flex justify-between items-center transition-colors"
                      >
                        <div className="min-w-0">
                          <h4 className="font-bold text-white text-xs truncate">{app.companyName}</h4>
                          <p className="text-[10px] text-slate-500 mt-0.5 leading-none">{app.role} • Applied: {app.appliedDate}</p>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <span className={`badge ${
                            app.status === 'Selected' ? 'badge-success' :
                            app.status === 'Rejected' ? 'badge-danger' :
                            'badge-info'
                          } text-[9px]`}>
                            {app.status}
                          </span>
                          <button
                            onClick={() => {
                              setSelectedApplicationId(app.driveId);
                              setActiveTab('visualizer');
                            }}
                            className="btn btn-secondary btn-sm"
                          >
                            Track
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Recommendations Card */}
              <div className="glass-card flex flex-col gap-4 bg-slate-900/40">
                <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2 pb-2 border-b border-slate-900">
                  <Award size={16} className="text-emerald-400" />
                  Recommendations
                </h3>

                {recommendationsList.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-xs text-slate-500">No new matching opportunities available. Check back soon!</p>
                  </div>
                ) : (
                  <div className="flex flex-col gap-3">
                    {recommendationsList.map(({ drive, comp }) => (
                      <div
                        key={drive.id}
                        className="p-3 rounded-lg border border-slate-850 hover:border-slate-800 bg-slate-950/40 flex justify-between items-center transition-colors"
                      >
                        <div className="min-w-0 flex-1 pr-3">
                          <div className="flex items-center gap-2">
                            <h4 className="font-bold text-white text-xs truncate">{drive.companyName}</h4>
                            <span className="px-1.5 py-0.5 bg-blue-500/10 text-blue-400 rounded text-[9px] font-bold">{drive.package}</span>
                          </div>
                          <p className="text-[10px] text-slate-500 mt-1 leading-none">{drive.role}</p>
                          <div className="mt-2.5 flex items-center gap-2">
                            <span className="text-[9px] font-bold text-emerald-400 shrink-0">{comp.score}% Match</span>
                            <div className="flex-1 h-1 bg-slate-900 rounded-full overflow-hidden">
                              <div className="h-full bg-emerald-500" style={{ width: `${comp.score}%` }} />
                            </div>
                          </div>
                        </div>
                        
                        <button
                          onClick={() => {
                            setActiveTab('drives');
                            setDriveSearch(drive.companyName);
                          }}
                          className="btn btn-primary btn-sm shrink-0"
                        >
                          Details
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

            </div>
          </motion.div>
        )}

        {/* TAB 2: PLACEMENT DRIVES */}
        {activeTab === 'drives' && (
          <motion.div
            key="drives-tab"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.2 }}
            className="flex flex-col gap-6"
          >
            {/* Search, Filter, Sort Row */}
            <div className="glass-card flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900/40 p-4">
              
              {/* Search */}
              <div className="relative flex-1 max-w-md">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type="text"
                  value={driveSearch}
                  onChange={(e) => setDriveSearch(e.target.value)}
                  placeholder="Search company or role..."
                  className="w-full bg-slate-950 border border-slate-850 rounded-lg py-2 pl-9 pr-4 text-xs text-slate-200 outline-none placeholder-slate-600 focus:border-blue-500"
                />
              </div>

              {/* Filters */}
              <div className="flex flex-wrap items-center gap-3">
                
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] text-slate-500 uppercase font-bold">Branch:</span>
                  <select
                    value={driveBranchFilter}
                    onChange={(e) => setDriveBranchFilter(e.target.value)}
                    className="bg-slate-950 border border-slate-850 rounded py-1.5 px-2.5 text-xs text-slate-300 outline-none cursor-pointer focus:border-blue-500"
                  >
                    <option value="All">All Branches</option>
                    <option value="Computer Science">Computer Science</option>
                    <option value="Information Technology">Information Technology</option>
                    <option value="Electronics">Electronics</option>
                    <option value="Mechanical">Mechanical</option>
                    <option value="Electrical">Electrical</option>
                  </select>
                </div>

                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] text-slate-500 uppercase font-bold">Status:</span>
                  <select
                    value={driveEligibilityFilter}
                    onChange={(e) => setDriveEligibilityFilter(e.target.value)}
                    className="bg-slate-950 border border-slate-850 rounded py-1.5 px-2.5 text-xs text-slate-300 outline-none cursor-pointer focus:border-blue-500"
                  >
                    <option value="All">All Opportunities</option>
                    <option value="Eligible">Eligible Only</option>
                    <option value="Applied">Applied Campaigns</option>
                  </select>
                </div>

                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] text-slate-500 uppercase font-bold">Sort:</span>
                  <select
                    value={driveSortOrder}
                    onChange={(e) => setDriveSortOrder(e.target.value)}
                    className="bg-slate-950 border border-slate-850 rounded py-1.5 px-2.5 text-xs text-slate-300 outline-none cursor-pointer focus:border-blue-500"
                  >
                    <option value="PackageDesc">Package: High to Low</option>
                    <option value="DeadlineAsc">Deadline: Soonest</option>
                    <option value="MatchDesc">Best Match %</option>
                  </select>
                </div>

              </div>

            </div>

            {/* Drives List */}
            {filteredDrives.length === 0 ? (
              <div className="glass-card text-center py-16 flex flex-col items-center justify-center gap-3">
                <Briefcase size={48} className="text-slate-600 opacity-20" />
                <h3 className="font-display font-bold text-slate-400 text-sm">No Active Campaigns Found</h3>
                <p className="text-xs text-slate-500 max-w-sm leading-relaxed">
                  No recruitment drives match your query. Check back later or contact the placement cell.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4">
                {filteredDrives.map((drive) => {
                  const matchResult = getCompatibility(currentStudent, drive);
                  const hasApplied = currentStudent.applications.some(a => a.driveId === drive.id);
                  const appRecord = currentStudent.applications.find(a => a.driveId === drive.id);
                  const remainingDays = getRemainingDays(drive.deadline);

                  return (
                    <div
                      key={drive.id}
                      className="glass-card p-5 flex flex-col md:flex-row justify-between gap-6 border-l-4 transition-colors"
                      style={{
                        borderLeftColor: matchResult.eligible
                          ? 'var(--color-primary-light)'
                          : 'rgba(239, 68, 68, 0.4)'
                      }}
                    >
                      {/* Left Info Column */}
                      <div className="flex-1 flex flex-col gap-2 min-w-0">
                        <div className="flex items-center gap-3 flex-wrap">
                          <h3 className="text-base font-extrabold text-white font-display">{drive.companyName}</h3>
                          <span className="badge badge-primary font-bold">{drive.package}</span>
                          
                          {/* Countdown Badge */}
                          {remainingDays > 0 ? (
                            <span className="inline-flex items-center gap-1 text-[10px] text-amber-500 bg-amber-500/5 px-2 py-0.5 rounded border border-amber-500/10 font-medium">
                              <Clock size={10} />
                              {remainingDays} days left
                            </span>
                          ) : (
                            <span className="text-[10px] text-red-400 bg-red-400/5 px-2 py-0.5 rounded border border-red-400/10 font-bold uppercase">
                              Deadline Closed
                            </span>
                          )}
                          
                          {hasApplied && (
                            <span className={`badge ${
                              appRecord?.status === 'Selected' ? 'badge-success' :
                              appRecord?.status === 'Rejected' ? 'badge-danger' :
                              'badge-info'
                            }`}>
                              Applied: {appRecord?.status}
                            </span>
                          )}
                        </div>

                        <span className="text-xs font-bold text-blue-400">{drive.role}</span>
                        <p className="text-xs text-slate-400 leading-relaxed max-w-3xl">{drive.jobDesc}</p>

                        {/* Drive requirements overview */}
                        <div className="flex items-center gap-4 flex-wrap mt-2 text-[10px] text-slate-500 font-semibold uppercase">
                          <span>Cut-off GPA: <strong className="text-slate-300">{drive.cgpaCutoff}</strong></span>
                          <span>Max Backlogs: <strong className="text-slate-300">{drive.maxBacklogs}</strong></span>
                          <span>Deadline: <strong className="text-slate-300">{drive.deadline}</strong></span>
                        </div>

                        {/* Skill Match list */}
                        <div className="flex flex-wrap gap-1 mt-2.5">
                          {drive.skillsRequired.map(skill => {
                            const hasSkill = currentStudent.skills.some(ss => ss.toLowerCase() === skill.toLowerCase());
                            return (
                              <span
                                key={skill}
                                className={`px-2 py-0.5 rounded text-[10px] ${
                                  hasSkill
                                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-semibold'
                                    : 'bg-slate-900 text-slate-500 border border-slate-850'
                                }`}
                              >
                                {skill}
                              </span>
                            );
                          })}
                        </div>
                      </div>

                      {/* Right Control Box */}
                      <div className="flex flex-col items-center justify-center p-4 bg-slate-950/40 border border-slate-900/60 rounded-xl min-w-[160px] text-center shrink-0 self-start md:self-stretch">
                        {matchResult.eligible ? (
                          <>
                            <span className="text-2xl font-black text-emerald-400 font-display">{matchResult.score}%</span>
                            <span className="text-[9px] text-emerald-500 font-bold uppercase tracking-wider mt-0.5">Match Index</span>
                            
                            <button
                              disabled={hasApplied || isPlaced}
                              onClick={() => onApply(drive.id)}
                              className="btn btn-primary btn-sm w-full mt-4"
                            >
                              {hasApplied ? 'Applied' : isPlaced ? 'Status Placed' : 'Apply Instantly'}
                            </button>
                          </>
                        ) : (
                          <>
                            <span className="text-xs font-bold text-red-400 flex items-center gap-1">
                              <AlertCircle size={14} />
                              Ineligible
                            </span>
                            <button
                              onClick={() => setEligibilityDetailsDrive(drive)}
                              className="text-[9px] text-slate-500 hover:text-slate-300 underline font-semibold mt-1"
                            >
                              Why? View reasons
                            </button>
                            <button disabled className="btn btn-secondary btn-sm w-full mt-4 opacity-50 cursor-not-allowed">
                              Locked
                            </button>
                          </>
                        )}
                      </div>

                    </div>
                  );
                })}
              </div>
            )}
          </motion.div>
        )}

        {/* TAB 3: ATS RESUME SCORER */}
        {activeTab === 'ats' && (
          <motion.div
            key="ats-tab"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.2 }}
            className="flex flex-col gap-6"
          >
            <div className="glass-card flex flex-col gap-5 p-5 bg-slate-900/40">
              <div>
                <h2 className="text-base font-bold text-white uppercase tracking-wider">ATS Resume Scanner Simulator</h2>
                <p className="text-xs text-slate-400 mt-1">
                  Parse your profile experience script to analyze keyword weights, action verb counts, and quantifiable metrics density.
                </p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
                
                {/* Text area column */}
                <div className="lg:col-span-7 flex flex-col gap-4">
                  <div className="flex flex-col gap-1.5 flex-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase">Resume plaintext content</label>
                    <textarea
                      rows={12}
                      value={resumeTextInput}
                      onChange={(e) => setResumeTextInput(e.target.value)}
                      placeholder="Paste your professional summary, academic qualifications, and programming projects here..."
                      className="w-full bg-slate-950 border border-slate-850 focus:border-blue-500 rounded-lg p-3 text-xs text-slate-200 placeholder-slate-700 outline-none transition-colors resize-none leading-relaxed flex-1"
                    />
                  </div>
                  <button
                    disabled={!resumeTextInput.trim()}
                    onClick={handleAtsScan}
                    className="btn btn-primary w-full"
                  >
                    Analyze Resume Text
                  </button>
                </div>

                {/* Score breakdown column */}
                <div className="lg:col-span-5 flex flex-col justify-center p-5 bg-slate-950/40 border border-slate-900 rounded-xl relative">
                  
                  {atsReport ? (
                    <div className="flex flex-col gap-5 h-full justify-between">
                      
                      {/* Circle indicator */}
                      <div className="text-center py-2 flex flex-col items-center">
                        <div className="relative flex items-center justify-center">
                          <svg width="100" height="100" className="transform -rotate-90">
                            <circle cx="50" cy="50" r="42" fill="transparent" stroke="rgba(255,255,255,0.05)" strokeWidth="6" />
                            <circle
                              cx="50"
                              cy="50"
                              r="42"
                              fill="transparent"
                              stroke={atsReport.score >= 75 ? '#10b981' : atsReport.score >= 60 ? '#f59e0b' : '#ef4444'}
                              strokeWidth="6"
                              strokeDasharray={2 * Math.PI * 42}
                              strokeDashoffset={2 * Math.PI * 42 * (1 - atsReport.score / 100)}
                              strokeLinecap="round"
                              className="transition-all duration-700"
                            />
                          </svg>
                          <span className="absolute text-xl font-black text-white">{atsReport.score}%</span>
                        </div>
                        <span className="text-[10px] text-slate-400 font-bold uppercase mt-2">Overall ATS Index</span>
                      </div>

                      {/* Detail Checks */}
                      <div className="flex flex-col gap-2.5">
                        <div className="flex justify-between items-center text-xs">
                          <span className="text-slate-400 font-medium">Keywords Matching:</span>
                          <span className="font-bold text-white">{atsReport.foundKeywords.length} of {MOCK_RESUME_TIPS.keywords.length}</span>
                        </div>
                        <div className="flex justify-between items-center text-xs">
                          <span className="text-slate-400 font-medium">Action Verbs Count:</span>
                          <span className="font-bold text-white">{atsReport.foundVerbs.length} found</span>
                        </div>
                        <div className="flex justify-between items-center text-xs">
                          <span className="text-slate-400 font-medium">Quantifiable Metrics:</span>
                          <span className={`font-bold ${atsReport.hasMetrics ? 'text-emerald-400' : 'text-amber-500'}`}>
                            {atsReport.hasMetrics ? 'Optimized' : 'Missing'}
                          </span>
                        </div>
                      </div>

                      {/* Action trigger */}
                      {atsReport.missingKeywords.length > 0 && (
                        <button
                          onClick={handleCopyMissingKeywords}
                          className="btn btn-secondary w-full"
                        >
                          <ClipboardCopy size={12} className="text-blue-400" />
                          Copy Missing Keywords ({atsReport.missingKeywords.length})
                        </button>
                      )}

                    </div>
                  ) : (
                    <div className="text-center py-12 flex flex-col items-center justify-center gap-2">
                      <FileCheck size={40} className="text-slate-700 opacity-20" />
                      <p className="text-xs text-slate-500">Submit resume plain text to view optimization report.</p>
                    </div>
                  )}

                </div>

              </div>
            </div>

            {/* ATS Recommendations logs */}
            {atsReport && (
              <div className="glass-card flex flex-col gap-4 bg-slate-900/40">
                <h3 className="text-xs font-bold text-white uppercase tracking-wider">ATS Optimization Suggestions</h3>
                <div className="flex flex-col gap-3">
                  {atsReport.recommendations.map((rec, i) => (
                    <div key={i} className="p-3 rounded-lg border border-slate-850 bg-slate-950/40 flex gap-2.5 text-xs text-slate-300 leading-relaxed">
                      <AlertCircle size={16} className="text-blue-500 shrink-0 mt-0.5" />
                      <span>{rec}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        )}

        {/* TAB 4: MOCK INTERVIEW SIMULATOR */}
        {activeTab === 'interview' && (
          <motion.div
            key="interview-tab"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.2 }}
            className="flex flex-col gap-6"
          >
            {!interviewRole ? (
              <div className="glass-card text-center py-16 flex flex-col items-center justify-center gap-5 bg-slate-900/40">
                <MessageSquare size={48} className="text-blue-500 opacity-30 animate-pulse" />
                <div>
                  <h3 className="font-display font-extrabold text-white text-lg">Select Preparation Sector Track</h3>
                  <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto leading-relaxed">
                    Select a job track to load structured concept questions. You will get instant conceptual keyword feedback on each answer.
                  </p>
                </div>
                <div className="flex flex-wrap justify-center gap-3">
                  <button
                    onClick={() => handleStartInterview('Software Engineer')}
                    className="btn btn-primary"
                  >
                    Software Engineer Track
                  </button>
                  <button
                    onClick={() => handleStartInterview('Analyst')}
                    className="btn btn-secondary"
                  >
                    Business/Data Analyst Track
                  </button>
                </div>
              </div>
            ) : (
              <div className="glass-card flex flex-col gap-4 bg-slate-900/40 min-h-[500px]">
                
                {/* Header */}
                <div className="flex justify-between items-center pb-2 border-b border-slate-900">
                  <div>
                    <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                      {interviewRole} Interview Simulator
                    </h3>
                    <span className="text-[10px] text-slate-500">
                      Concept questions query tracker
                    </span>
                  </div>
                  
                  {!isInterviewFinished && (
                    <span className="text-[11px] font-bold text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded">
                      Question {currentQuestionIndex + 1} of {interviewQuestions.length}
                    </span>
                  )}
                </div>

                {/* Chat Container */}
                <div className="flex-1 overflow-y-auto max-h-[350px] p-2 flex flex-col gap-3 custom-scrollbar">
                  {chatHistory.map((chat, idx) => (
                    <div
                      key={idx}
                      className={`flex flex-col max-w-[80%] ${
                        chat.sender === 'user' ? 'self-end items-end' : 'self-start items-start'
                      }`}
                    >
                      <span className="text-[9px] text-slate-500 uppercase font-bold mb-0.5">
                        {chat.sender === 'user' ? 'You' : chat.sender === 'bot' ? 'Interviewer' : 'AI Evaluation'}
                      </span>
                      <div
                        className={`p-3 rounded-xl text-xs leading-relaxed whitespace-pre-line ${
                          chat.sender === 'user'
                            ? 'bg-blue-600 text-white rounded-tr-none'
                            : chat.sender === 'feedback'
                            ? 'bg-slate-900 border border-slate-800 text-slate-300 rounded-tl-none font-semibold'
                            : 'bg-slate-950 border border-slate-850 text-slate-200 rounded-tl-none'
                        }`}
                      >
                        {chat.text}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Input action row */}
                {!isInterviewFinished ? (
                  <div className="flex gap-2 pt-2 border-t border-slate-900">
                    <input
                      type="text"
                      value={userAnswer}
                      onChange={(e) => setUserAnswer(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleSendAnswer();
                      }}
                      placeholder="Type your detailed engineering answer..."
                      className="flex-1 bg-slate-950 border border-slate-850 rounded-lg px-4 py-2 text-xs text-slate-200 outline-none focus:border-blue-500"
                    />
                    <button
                      onClick={handleSendAnswer}
                      className="btn btn-primary"
                    >
                      <Send size={16} />
                    </button>
                  </div>
                ) : (
                  <div className="flex flex-col gap-4 items-center justify-center py-4 pt-2 border-t border-slate-900 text-center">
                    
                    {/* Display score analytics chart */}
                    <div className="w-full max-w-xs p-3 bg-slate-950/50 border border-slate-900 rounded-xl">
                      <p className="text-[10px] font-bold text-slate-400 uppercase mb-2">Round Score Index</p>
                      
                      {/* Custom SVG line chart of scores */}
                      <svg width="200" height="60" viewBox="0 0 200 60" className="mx-auto overflow-visible">
                        {/* Grid lines */}
                        <line x1="0" y1="50" x2="200" y2="50" stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
                        <line x1="0" y1="10" x2="200" y2="10" stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
                        
                        {/* Plot line */}
                        <path
                          d={interviewScores.map((score, i) => {
                            const x = i * (200 / Math.max(1, interviewScores.length - 1));
                            const y = 50 - (score / 10) * 40;
                            return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
                          }).join(' ')}
                          fill="none"
                          stroke="#2563eb"
                          strokeWidth="2.5"
                        />
                        
                        {/* Points */}
                        {interviewScores.map((score, i) => {
                          const x = i * (200 / Math.max(1, interviewScores.length - 1));
                          const y = 50 - (score / 10) * 40;
                          return (
                            <g key={i}>
                              <circle cx={x} cy={y} r="3" fill="#14b8a6" />
                              <text x={x} y={y - 6} fill="#ffffff" fontSize="8" fontWeight="bold" textAnchor="middle">
                                {score}
                              </text>
                            </g>
                          );
                        })}
                      </svg>
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={() => handleStartInterview(interviewRole)}
                        className="btn btn-primary btn-sm"
                      >
                        Try Again
                      </button>
                      <button
                        onClick={() => setInterviewRole(null)}
                        className="btn btn-secondary btn-sm"
                      >
                        Change Track
                      </button>
                    </div>
                  </div>
                )}

              </div>
            )}
          </motion.div>
        )}

        {/* TAB 5: STAGE PIPELINE VISUALIZER */}
        {activeTab === 'visualizer' && (
          <motion.div
            key="visualizer-tab"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.2 }}
            className="flex flex-col gap-6"
          >
            <div className="glass-card flex flex-col gap-4 bg-slate-900/40">
              <div>
                <h2 className="text-base font-bold text-white uppercase tracking-wider">Recruitment Pipeline Visualizer</h2>
                <p className="text-xs text-slate-400 mt-1">
                  Track ongoing interview stages and coordinator feedback notes.
                </p>
              </div>

              {totalApplied === 0 ? (
                <div className="text-center py-16 flex flex-col items-center justify-center gap-3">
                  <TrendingUp size={48} className="text-slate-600 opacity-20" />
                  <p className="text-xs text-slate-500">Apply to recruitment campaigns to view selection pathways.</p>
                </div>
              ) : (
                <div className="flex flex-col gap-5">
                  
                  {/* Selector */}
                  <div className="flex flex-col gap-1.5 max-w-xs">
                    <label className="text-[10px] font-bold text-slate-400 uppercase">Select Application</label>
                    <select
                      value={selectedApplicationId}
                      onChange={(e) => setSelectedApplicationId(e.target.value)}
                      className="bg-slate-950 border border-slate-850 rounded py-2 px-3 text-xs text-slate-200 outline-none cursor-pointer focus:border-blue-500"
                    >
                      {currentStudent.applications.map((app) => (
                        <option key={app.driveId} value={app.driveId}>
                          {app.companyName} - {app.role}
                        </option>
                      ))}
                    </select>
                  </div>

                  {selectedApp && selectedDrive ? (
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start mt-2">
                      
                      {/* Timeline column */}
                      <div className="lg:col-span-7 flex flex-col gap-4 p-4 bg-slate-950/40 border border-slate-900 rounded-xl">
                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider pb-2 border-b border-slate-900">
                          Timeline Stages
                        </span>

                        <div className="flex flex-col gap-5 relative pl-4 mt-2">
                          {/* Thread Line */}
                          <div className="absolute left-[7px] top-2 bottom-2 w-0.5 bg-slate-900" />

                          {selectedDrive.rounds.map((round, idx) => {
                            const isCurrent = selectedApp.status === round;
                            const isCleared = selectedApp.currentRoundIndex > idx || selectedApp.status === 'Selected';
                            const isFinalSelected = selectedApp.status === 'Selected' && idx === selectedDrive.rounds.length - 1;
                            const isRejectedAtThisRound = selectedApp.status === 'Rejected' && selectedApp.currentRoundIndex === idx;

                            return (
                              <div key={round} className="flex gap-4 items-start relative">
                                
                                {/* Bullet indicator */}
                                <div
                                  className={`h-4.5 w-4.5 rounded-full shrink-0 flex items-center justify-center border-2 z-10 ${
                                    isFinalSelected || isCleared
                                      ? 'bg-emerald-500/10 border-emerald-500 text-emerald-400'
                                      : isRejectedAtThisRound
                                      ? 'bg-red-500/10 border-red-500 text-red-400'
                                      : isCurrent
                                      ? 'bg-blue-600/10 border-blue-500 text-blue-400 animate-pulse'
                                      : 'bg-slate-950 border-slate-900 text-slate-600'
                                  }`}
                                >
                                  {isCleared || isFinalSelected ? (
                                    <Check size={10} strokeWidth={3} />
                                  ) : isRejectedAtThisRound ? (
                                    <X size={10} strokeWidth={3} />
                                  ) : (
                                    <span className="w-1.5 h-1.5 rounded-full bg-current" />
                                  )}
                                </div>

                                <div className="flex-1">
                                  <h4 className={`text-xs font-bold ${
                                    isCurrent ? 'text-blue-400' : isCleared ? 'text-slate-200' : 'text-slate-500'
                                  }`}>
                                    {round}
                                  </h4>
                                  {isCurrent && (
                                    <span className="inline-block mt-1 text-[9px] text-blue-400 bg-blue-500/5 border border-blue-500/10 px-1.5 py-0.2 rounded font-medium">
                                      Active Stage
                                    </span>
                                  )}
                                  {isRejectedAtThisRound && (
                                    <span className="inline-block mt-1 text-[9px] text-red-400 bg-red-500/5 border border-red-500/10 px-1.5 py-0.2 rounded font-bold uppercase">
                                      Rejected
                                    </span>
                                  )}
                                </div>

                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {/* Info and Feedback column */}
                      <div className="lg:col-span-5 flex flex-col gap-4">
                        <div className="p-4 rounded-xl border border-slate-850 bg-slate-950/40">
                          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Company Metadata</span>
                          <h4 className="font-extrabold text-white text-sm mt-1">{selectedDrive.companyName}</h4>
                          <p className="text-[10px] text-blue-400 font-bold mt-0.5">{selectedDrive.role}</p>

                          <div className="mt-3 text-xs flex flex-col gap-1.5 border-t border-slate-900 pt-3">
                            <div className="flex justify-between">
                              <span className="text-slate-500">Compensation package:</span>
                              <span className="font-bold text-white">{selectedDrive.package}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-slate-500">Applicant status:</span>
                              <span className={`font-bold ${
                                selectedApp.status === 'Selected' ? 'text-emerald-400' :
                                selectedApp.status === 'Rejected' ? 'text-red-400' : 'text-slate-300'
                              }`}>
                                {selectedApp.status}
                              </span>
                            </div>
                          </div>
                        </div>

                        {selectedApp.feedback && (
                          <div className="p-4 rounded-xl border border-blue-500/10 bg-blue-500/5 text-xs leading-relaxed text-blue-200">
                            <span className="text-[10px] font-bold text-blue-400 uppercase tracking-wider block mb-1">Coordinator Feedback Notes</span>
                            <p className="font-medium">{selectedApp.feedback}</p>
                          </div>
                        )}
                      </div>

                    </div>
                  ) : null}

                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* TAB 6: PROFILE SETTINGS */}
        {activeTab === 'profile' && (
          <motion.div
            key="profile-tab"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.2 }}
            className="flex flex-col gap-6"
          >
            {/* Progress Completeness */}
            <div className="glass-card flex flex-col gap-3 bg-slate-900/40">
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-400 font-bold uppercase">Profile Completion Index</span>
                <span className="font-extrabold text-blue-400">{profileCompletion}%</span>
              </div>
              <div className="h-2 w-full bg-slate-950 rounded-full overflow-hidden border border-slate-900">
                <div className="h-full bg-blue-500 transition-all duration-500" style={{ width: `${profileCompletion}%` }} />
              </div>
              <p className="text-[10px] text-slate-500 leading-normal">
                Complete certifications and paste Plain Text resume summary details to reach 100% profile index score.
              </p>
            </div>

            {/* General form fields */}
            <form onSubmit={handleSaveProfile} className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              
              {/* Left editable details card */}
              <div className="glass-card lg:col-span-8 flex flex-col gap-4 bg-slate-900/40">
                <h3 className="text-xs font-bold text-white uppercase tracking-wider pb-2 border-b border-slate-900">
                  Candidate Credentials
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase">Full Name</label>
                    <input
                      type="text"
                      required
                      value={profileName}
                      onChange={(e) => setProfileName(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-850 rounded-lg py-2 px-3 text-xs text-slate-100 placeholder-slate-700 outline-none focus:border-blue-500"
                    />
                  </div>
                  
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase">Email Address</label>
                    <input
                      type="email"
                      required
                      value={profileEmail}
                      onChange={(e) => setProfileEmail(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-850 rounded-lg py-2 px-3 text-xs text-slate-100 placeholder-slate-700 outline-none focus:border-blue-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase">Security Password</label>
                    <input
                      type="password"
                      required
                      value={profilePassword}
                      onChange={(e) => setProfilePassword(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-850 rounded-lg py-2 px-3 text-xs text-slate-100 placeholder-slate-700 outline-none focus:border-blue-500"
                    />
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase">Branch Sector</label>
                    <select
                      value={profileBranch}
                      onChange={(e) => setProfileBranch(e.target.value as Student['branch'])}
                      className="w-full bg-slate-950 border border-slate-850 rounded-lg py-2 px-3 text-xs text-slate-100 outline-none focus:border-blue-500 cursor-pointer"
                    >
                      <option value="Computer Science">Computer Science</option>
                      <option value="Information Technology">Information Technology</option>
                      <option value="Electronics">Electronics</option>
                      <option value="Mechanical">Mechanical</option>
                      <option value="Electrical">Electrical</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase">Cumulative GPA</label>
                    <input
                      type="number"
                      step="0.01"
                      required
                      min="0"
                      max="10"
                      value={profileCgpa}
                      onChange={(e) => setProfileCgpa(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-850 rounded-lg py-2 px-3 text-xs text-slate-100 outline-none focus:border-blue-500"
                    />
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase">Backlog Count</label>
                    <input
                      type="number"
                      required
                      min="0"
                      value={profileBacklogs}
                      onChange={(e) => setProfileBacklogs(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-850 rounded-lg py-2 px-3 text-xs text-slate-100 outline-none focus:border-blue-500"
                    />
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase">Projects Count</label>
                    <input
                      type="number"
                      required
                      min="0"
                      value={profileProjects}
                      onChange={(e) => setProfileProjects(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-850 rounded-lg py-2 px-3 text-xs text-slate-100 outline-none focus:border-blue-500"
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Resume plaintext content</label>
                  <textarea
                    rows={4}
                    required
                    value={profileResume}
                    onChange={(e) => setProfileResume(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-850 rounded-lg p-3 text-xs text-slate-100 placeholder-slate-700 outline-none focus:border-blue-500 resize-none leading-relaxed"
                  />
                </div>

                <button
                  type="submit"
                  className="btn btn-primary w-full"
                >
                  Save Profile Settings
                </button>
              </div>

              {/* Right certifications and skills editing card */}
              <div className="lg:col-span-4 flex flex-col gap-6">
                
                {/* Skills tags list */}
                <div className="glass-card flex flex-col gap-4 bg-slate-900/40">
                  <h3 className="text-xs font-bold text-white uppercase tracking-wider pb-2 border-b border-slate-900">
                    Portfolio Skills ({profileSkillsList.length})
                  </h3>

                  <div className="flex flex-wrap gap-1.5">
                    {profileSkillsList.map(skill => (
                      <span key={skill} className="px-2 py-0.5 rounded text-[10px] bg-blue-500/10 text-blue-400 border border-blue-500/10 font-medium flex items-center gap-1">
                        {skill}
                        <button type="button" onClick={() => handleRemoveSkillTag(skill)} className="text-blue-400 hover:text-red-400">
                          <X size={10} />
                        </button>
                      </span>
                    ))}
                  </div>

                  <div className="flex gap-2 border-t border-slate-900 pt-3">
                    <input
                      type="text"
                      value={newSkillInput}
                      onChange={(e) => setNewSkillInput(e.target.value)}
                      placeholder="Add tag (e.g. AWS)"
                      className="flex-1 bg-slate-950 border border-slate-850 rounded py-1 px-2.5 text-[11px] text-slate-200 outline-none placeholder-slate-700 focus:border-blue-500"
                    />
                    <button
                      type="button"
                      onClick={handleAddSkillTag}
                      className="btn btn-primary btn-sm px-2"
                    >
                      <Plus size={16} />
                    </button>
                  </div>
                </div>

                {/* Certifications list */}
                <div className="glass-card flex flex-col gap-4 bg-slate-900/40">
                  <h3 className="text-xs font-bold text-white uppercase tracking-wider pb-2 border-b border-slate-900">
                    Certifications ({profileCertifications.length})
                  </h3>

                  <div className="flex flex-col gap-2">
                    {profileCertifications.map(cert => (
                      <div key={cert} className="p-2 bg-slate-950 border border-slate-900 rounded-lg flex justify-between items-center text-[11px] text-slate-300 font-semibold leading-relaxed">
                        <span className="truncate pr-2">{cert}</span>
                        <button type="button" onClick={() => handleRemoveCert(cert)} className="text-slate-500 hover:text-red-400 shrink-0">
                          <X size={12} />
                        </button>
                      </div>
                    ))}
                  </div>

                  <div className="flex gap-2 border-t border-slate-900 pt-3">
                    <input
                      type="text"
                      value={newCertInput}
                      onChange={(e) => setNewCertInput(e.target.value)}
                      placeholder="Add certification"
                      className="flex-1 bg-slate-950 border border-slate-850 rounded py-1 px-2.5 text-[11px] text-slate-200 outline-none placeholder-slate-700 focus:border-blue-500"
                    />
                    <button
                      type="button"
                      onClick={handleAddCert}
                      className="btn btn-primary btn-sm px-2"
                    >
                      <Plus size={16} />
                    </button>
                  </div>
                </div>

              </div>

            </form>
          </motion.div>
        )}

      </AnimatePresence>

      {/* ELIGIBILITY DETAIL MODAL */}
      <AnimatePresence>
        {eligibilityDetailsDrive && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setEligibilityDetailsDrive(null)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-slate-900 border border-slate-800 rounded-xl max-w-md w-full p-6 relative z-10 shadow-2xl"
            >
              <div className="flex justify-between items-start">
                <h3 className="font-display font-extrabold text-white text-base">Eligibility Check: {eligibilityDetailsDrive.companyName}</h3>
                <button onClick={() => setEligibilityDetailsDrive(null)} className="text-slate-400 hover:text-white">
                  <X size={16} />
                </button>
              </div>
              <p className="text-slate-400 text-xs mt-1">Review criteria metrics and reasons for lock status:</p>

              <div className="mt-4 flex flex-col gap-3 p-3.5 bg-slate-950 border border-slate-900 rounded-xl">
                
                {/* GPA check */}
                <div className="flex gap-3 text-xs leading-relaxed">
                  <div className={`mt-0.5 shrink-0 w-4 h-4 rounded-full flex items-center justify-center text-[10px] ${
                    currentStudent.cgpa >= eligibilityDetailsDrive.cgpaCutoff
                      ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                      : 'bg-red-500/10 text-red-400 border border-red-500/20'
                  }`}>
                    {currentStudent.cgpa >= eligibilityDetailsDrive.cgpaCutoff ? <Check size={10} /> : <X size={10} />}
                  </div>
                  <div>
                    <p className="font-bold text-white">CGPA Cutoff</p>
                    <p className="text-[10px] text-slate-500 mt-0.5">Required: {eligibilityDetailsDrive.cgpaCutoff} | Yours: {currentStudent.cgpa}</p>
                  </div>
                </div>

                {/* Backlog check */}
                <div className="flex gap-3 text-xs leading-relaxed border-t border-slate-900 pt-3">
                  <div className={`mt-0.5 shrink-0 w-4 h-4 rounded-full flex items-center justify-center text-[10px] ${
                    currentStudent.backlogs <= eligibilityDetailsDrive.maxBacklogs
                      ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                      : 'bg-red-500/10 text-red-400 border border-red-500/20'
                  }`}>
                    {currentStudent.backlogs <= eligibilityDetailsDrive.maxBacklogs ? <Check size={10} /> : <X size={10} />}
                  </div>
                  <div>
                    <p className="font-bold text-white">Backlog Constraint</p>
                    <p className="text-[10px] text-slate-500 mt-0.5">Max Allowed: {eligibilityDetailsDrive.maxBacklogs} | Yours: {currentStudent.backlogs}</p>
                  </div>
                </div>

                {/* Branch check */}
                <div className="flex gap-3 text-xs leading-relaxed border-t border-slate-900 pt-3">
                  <div className={`mt-0.5 shrink-0 w-4 h-4 rounded-full flex items-center justify-center text-[10px] ${
                    eligibilityDetailsDrive.allowedBranches.includes(currentStudent.branch)
                      ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                      : 'bg-red-500/10 text-red-400 border border-red-500/20'
                  }`}>
                    {eligibilityDetailsDrive.allowedBranches.includes(currentStudent.branch) ? <Check size={10} /> : <X size={10} />}
                  </div>
                  <div>
                    <p className="font-bold text-white">Branch Eligibility</p>
                    <p className="text-[10px] text-slate-500 mt-0.5">Allowed Sectors: {eligibilityDetailsDrive.allowedBranches.join(', ')}</p>
                  </div>
                </div>

              </div>

              <div className="flex justify-end mt-5">
                <button
                  onClick={() => setEligibilityDetailsDrive(null)}
                  className="btn btn-secondary btn-sm"
                >
                  Close Report
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </DashboardShell>
  );
};
