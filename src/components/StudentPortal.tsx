import React, { useState, useEffect } from 'react';
import {
  LayoutDashboard,
  Briefcase,
  FileCheck,
  MessageSquare,
  TrendingUp,
  LogOut,
  Award,
  AlertCircle,
  Sparkles,
  BookOpen,
  Send,
  GraduationCap,
  User
} from 'lucide-react';
import { MOCK_RESUME_TIPS, MOCK_INTERVIEW_QAS } from '../mockData';
import type { Student, PlacementDrive } from '../mockData';

interface StudentPortalProps {
  currentStudent: Student;
  drives: PlacementDrive[];
  onLogout: () => void;
  onApply: (driveId: string) => void;
  onUpdateResumeScore: (score: number, resumeText: string) => void;
  onUpdateStudentProfile: (updatedStudent: Student) => void;
}

export const StudentPortal: React.FC<StudentPortalProps> = ({
  currentStudent,
  drives,
  onLogout,
  onApply,
  onUpdateResumeScore,
  onUpdateStudentProfile
}) => {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'drives' | 'ats' | 'interview' | 'visualizer' | 'profile'>('dashboard');

  // Profile Settings States
  const [profileName, setProfileName] = useState(currentStudent.name);
  const [profileEmail, setProfileEmail] = useState(currentStudent.email);
  const [profilePassword, setProfilePassword] = useState(currentStudent.password || '');
  const [profileBranch, setProfileBranch] = useState(currentStudent.branch);
  const [profileCgpa, setProfileCgpa] = useState(currentStudent.cgpa.toString());
  const [profileBacklogs, setProfileBacklogs] = useState(currentStudent.backlogs.toString());
  const [profileSkills, setProfileSkills] = useState(currentStudent.skills.join(', '));
  const [profileProjects, setProfileProjects] = useState(currentStudent.projectsCount.toString());
  const [profileResume, setProfileResume] = useState(currentStudent.resumeText || '');

  // Reset fields if logged-in student changes
  useEffect(() => {
    setProfileName(currentStudent.name);
    setProfileEmail(currentStudent.email);
    setProfilePassword(currentStudent.password || '');
    setProfileBranch(currentStudent.branch);
    setProfileCgpa(currentStudent.cgpa.toString());
    setProfileBacklogs(currentStudent.backlogs.toString());
    setProfileSkills(currentStudent.skills.join(', '));
    setProfileProjects(currentStudent.projectsCount.toString());
    setProfileResume(currentStudent.resumeText || '');
    setResumeTextInput(currentStudent.resumeText || '');
  }, [currentStudent.id]);

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
  const [interviewQuestions, setInterviewQuestions] = useState<any[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [userAnswer, setUserAnswer] = useState('');
  const [chatHistory, setChatHistory] = useState<Array<{ sender: 'user' | 'bot' | 'feedback'; text: string }>>([]);
  const [isInterviewFinished, setIsInterviewFinished] = useState(false);
  const [interviewScores, setInterviewScores] = useState<number[]>([]);

  // Pipeline Visualizer State
  const [selectedApplicationId, setSelectedApplicationId] = useState<string>(
    currentStudent.applications[0]?.driveId || ''
  );

  // Profile calculations
  const totalApplied = currentStudent.applications.length;
  const isPlaced = currentStudent.placementStatus === 'Placed';

  // Smart Compatibility Math
  const getCompatibility = (student: Student, drive: PlacementDrive) => {
    // 1. Core Eligibility criteria check
    const isGpaEligible = student.cgpa >= drive.cgpaCutoff;
    const isBacklogEligible = student.backlogs <= drive.maxBacklogs;
    const isBranchEligible = drive.allowedBranches.includes(student.branch);
    const eligible = isGpaEligible && isBacklogEligible && isBranchEligible;

    if (!eligible) {
      return {
        eligible: false, score: 0, reasons: [
          !isGpaEligible && `GPA cut-off is ${drive.cgpaCutoff} (yours: ${student.cgpa})`,
          !isBacklogEligible && `Max backlogs allowed is ${drive.maxBacklogs} (yours: ${student.backlogs})`,
          !isBranchEligible && `Eligible branches: ${drive.allowedBranches.join(', ')} (your branch: ${student.branch})`
        ].filter(Boolean) as string[]
      };
    }

    // 2. Compatibility Score (based on skills)
    const requiredSkills = drive.skillsRequired;
    const studentSkills = student.skills;
    const matchingSkills = requiredSkills.filter(s =>
      studentSkills.some(ss => ss.toLowerCase() === s.toLowerCase())
    );

    // Skill match portion (70% weight) + GPA boost (30% weight)
    const skillScore = requiredSkills.length > 0 ? (matchingSkills.length / requiredSkills.length) * 70 : 70;
    const gpaBonus = Math.min(((student.cgpa - drive.cgpaCutoff) / (10 - drive.cgpaCutoff)) * 30, 30);
    const overallScore = Math.min(Math.round(skillScore + Math.max(0, gpaBonus)), 100);

    return { eligible: true, score: overallScore, matchingSkills };
  };

  // Run ATS Scan
  const handleAtsScan = () => {
    if (!resumeTextInput.trim()) return;

    // Detect Keywords
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

    // Detect Action Verbs
    const foundVerbs: string[] = [];
    MOCK_RESUME_TIPS.actionVerbs.forEach(verb => {
      if (textLower.includes(verb.toLowerCase())) {
        foundVerbs.push(verb);
      }
    });

    // Check Metrics (numbers like 30%, 10k, 2x, etc.)
    const metricsRegex = /\b\d+(?:%|\s*k|\s*x|\s*lakhs|\s*percent|\s*million|\s*projects)\b|(?:\d+\+)/i;
    const hasMetrics = metricsRegex.test(textLower);

    // Score calculation:
    // Base 40
    // Found keywords: up to 35 points
    // Action verbs: up to 15 points
    // Metrics presence: 10 points
    let calcScore = 40;
    const keywordPct = foundKeywords.length / MOCK_RESUME_TIPS.keywords.length;
    calcScore += Math.round(keywordPct * 35);

    const verbPct = Math.min(foundVerbs.length / 5, 1);
    calcScore += Math.round(verbPct * 15);

    if (hasMetrics) calcScore += 10;
    calcScore = Math.min(calcScore, 100);

    // Build recommendations
    const recommendations: string[] = [];
    if (foundKeywords.length < 5) {
      recommendations.push("Inject more domain-specific technical skills (e.g., " + missingKeywords.slice(0, 3).join(', ') + ").");
    }
    if (foundVerbs.length < 3) {
      recommendations.push("Start accomplishment bullet points with stronger active verbs (e.g. 'Optimized', 'Automated').");
    }
    if (!hasMetrics) {
      recommendations.push("Quantify your achievements! Rephrase text to show metrics (e.g. 'reduced processing latency by 35%').");
    }
    if (resumeTextInput.length < 150) {
      recommendations.push("Expand your profile. Provide details on capstone projects, stack configurations, and team scale.");
    } else if (resumeTextInput.length > 1000) {
      recommendations.push("Keep it concise. Shorten descriptions so ATS scanners can quickly isolate key performance indicators.");
    }

    if (recommendations.length === 0) {
      recommendations.push("Excellent resume details! Formatting and keywords are highly optimized for automated screeners.");
    }

    setAtsReport({
      score: calcScore,
      foundKeywords,
      missingKeywords,
      foundVerbs,
      hasMetrics,
      recommendations
    });

    // Save back to main state
    onUpdateResumeScore(calcScore, resumeTextInput);
  };

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    const cgpaNum = parseFloat(profileCgpa);
    if (isNaN(cgpaNum) || cgpaNum < 0 || cgpaNum > 10) {
      alert('CGPA must be a number between 0 and 10.');
      return;
    }
    const backlogsNum = parseInt(profileBacklogs);
    if (isNaN(backlogsNum) || backlogsNum < 0) {
      alert('Backlogs cannot be negative.');
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
      skills: profileSkills.split(',').map(s => s.trim()).filter(Boolean),
      projectsCount: parseInt(profileProjects) || 0,
      resumeText: profileResume,
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

    // Initial bot greetings
    setChatHistory([
      { sender: 'bot', text: `Welcome to your simulated ${role} Technical Interview. I will ask you standard technical and behavioral screening questions. Let's begin!` },
      { sender: 'bot', text: `Question 1: ${qas[0].question}` }
    ]);
  };

  // Submit Answer to Chatbot
  const handleSendAnswer = () => {
    if (!userAnswer.trim() || !interviewRole) return;

    const answer = userAnswer.trim();
    const currentQuestion = interviewQuestions[currentQuestionIndex];

    // Add user answer to chat history
    const updatedHistory = [...chatHistory, { sender: 'user' as const, text: answer }];
    setChatHistory(updatedHistory);
    setUserAnswer('');

    // Evaluate response
    const answerLower = answer.toLowerCase();
    const matchedKeywords = currentQuestion.correctKeywords.filter((kw: string) =>
      answerLower.includes(kw.toLowerCase())
    );

    // Score answer out of 10
    const scoreVal = Math.min(2 + matchedKeywords.length * 2, 10);
    const newScores = [...interviewScores, scoreVal];
    setInterviewScores(newScores);

    // Formulate real-time feedback
    let feedbackText = `[Feedback] Score: ${scoreVal}/10. `;
    if (matchedKeywords.length > 0) {
      feedbackText += `You correctly targeted key components: "${matchedKeywords.join(', ')}". `;
    } else {
      feedbackText += `Your answer missed foundational terminology. `;
    }

    if (scoreVal < 6) {
      feedbackText += `Recommendation: Try to integrate specific terminology. Mentioning "${currentQuestion.correctKeywords.slice(0, 3).join(', ')}" would strengthen the rating.`;
    } else {
      feedbackText += `Excellent precision in utilizing professional concepts.`;
    }

    // Add evaluation node
    const historyWithFeedback = [...updatedHistory, { sender: 'feedback' as const, text: feedbackText }];
    setChatHistory(historyWithFeedback);

    // Schedule next step
    setTimeout(() => {
      const nextIndex = currentQuestionIndex + 1;
      if (nextIndex < interviewQuestions.length) {
        setCurrentQuestionIndex(nextIndex);
        setChatHistory(prev => [
          ...prev,
          { sender: 'bot', text: `Question ${nextIndex + 1}: ${interviewQuestions[nextIndex].question}` }
        ]);
      } else {
        // Wrap up interview
        setIsInterviewFinished(true);
        const finalAverage = Math.round((newScores.reduce((a, b) => a + b, 0) / newScores.length) * 10);
        setChatHistory(prev => [
          ...prev,
          { sender: 'bot', text: `Interview complete! Thank you. I have analyzed your overall responses.` },
          { sender: 'bot', text: `Your overall performance index is ${finalAverage}%. A comprehensive report has been generated.` }
        ]);
      }
    }, 1200);
  };

  // Selected Application for Pipeline Visualizer
  const selectedApp = currentStudent.applications.find(app => app.driveId === selectedApplicationId);
  const selectedDrive = drives.find(d => d.id === selectedApplicationId);

  return (
    <div className="dashboard-layout">
      {/* Side Menu Navigation */}
      <aside className="side-menu animate-slide-in">
        <div className="glass-card mb-4 flex flex-col items-center text-center p-6" style={{ borderBottom: '3px solid hsl(var(--color-primary))' }}>
          <div className="avatar mb-3 text-lg">{currentStudent.name.charAt(0)}</div>
          <h3 className="font-semibold text-white truncate max-w-full font-display" title={currentStudent.name}>{currentStudent.name}</h3>
          <p className="text-xs text-indigo-400 mt-0.5">{currentStudent.branch}</p>
          <div className="flex gap-4 mt-4 text-xs border-t border-white/5 pt-4 w-full justify-around">
            <div>
              <p className="text-gray-500">CGPA</p>
              <p className="font-bold text-white mt-0.5">{currentStudent.cgpa}</p>
            </div>
            <div>
              <p className="text-gray-500">Backlogs</p>
              <p className="font-bold text-white mt-0.5">{currentStudent.backlogs}</p>
            </div>
            <div>
              <p className="text-gray-500">ATS</p>
              <p className="font-bold text-white mt-0.5">{currentStudent.resumeScore}%</p>
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
            Placement Drives
          </button>
          <button
            onClick={() => setActiveTab('ats')}
            className={`menu-item ${activeTab === 'ats' ? 'active' : ''}`}
          >
            <FileCheck size={18} />
            ATS Resume Scorer
          </button>
          <button
            onClick={() => setActiveTab('interview')}
            className={`menu-item ${activeTab === 'interview' ? 'active' : ''}`}
          >
            <MessageSquare size={18} />
            Mock Interview
          </button>
          <button
            onClick={() => setActiveTab('visualizer')}
            className={`menu-item ${activeTab === 'visualizer' ? 'active' : ''}`}
          >
            <TrendingUp size={18} />
            Stage Visualizer
          </button>
          <button
            onClick={() => setActiveTab('profile')}
            className={`menu-item ${activeTab === 'profile' ? 'active' : ''}`}
          >
            <User size={18} />
            Profile Settings
          </button>

          <div className="border-t border-white/5 my-3"></div>

          <button
            onClick={onLogout}
            className="menu-item hover:bg-red-500/10 hover:text-red-400 text-gray-400"
          >
            <LogOut size={18} />
            Log Out
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex flex-col gap-6 animate-slide-in">

        {/* TAB 1: DASHBOARD */}
        {activeTab === 'dashboard' && (
          <div className="flex flex-col gap-6 animate-slide-in">
            {/* Welcoming banner */}
            <div className="glass-card relative overflow-hidden p-8 flex flex-col justify-center bg-gradient-to-r from-indigo-950/40 to-purple-950/40" style={{ borderLeft: '4px solid hsl(var(--color-secondary))' }}>
              <div className="absolute top-0 right-0 p-8 text-indigo-500/10 pointer-events-none">
                <Sparkles size={120} />
              </div>
              <span className="badge badge-primary self-start mb-3">Student Portal Active</span>
              <h2 className="text-2xl md:text-3xl font-extrabold text-white font-display">
                Hello, {currentStudent.name.split(' ')[0]}!
              </h2>
              <p className="text-gray-400 mt-2 text-sm md:text-base max-w-xl">
                {isPlaced
                  ? `Congratulations on your selection at ${currentStudent.placedCompany}! Your placement process has completed.`
                  : "Keep your profile up-to-date, verify recruitment matching, and leverage mock interviews to boost selection rates."
                }
              </p>
              {isPlaced && (
                <div className="mt-4 bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 p-4 rounded-xl flex items-center gap-3 max-w-md">
                  <Award size={24} className="text-emerald-400 shrink-0" />
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wider">Placed Status Secured</p>
                    <p className="text-sm font-medium mt-0.5">{currentStudent.placedCompany} (Package: {currentStudent.placedPackage})</p>
                  </div>
                </div>
              )}
            </div>

            {/* Dashboard metrics grid */}
            <div className="metrics-grid">
              <div className="glass-card metric-card">
                <div className="metric-icon-box">
                  <GraduationCap size={20} />
                </div>
                <div className="metric-value">{currentStudent.cgpa}</div>
                <div className="metric-label">Cumulative GPA</div>
              </div>

              <div className="glass-card metric-card info">
                <div className="metric-icon-box">
                  <Briefcase size={20} />
                </div>
                <div className="metric-value">{totalApplied}</div>
                <div className="metric-label">Applications Submitted</div>
              </div>

              <div className="glass-card metric-card success">
                <div className="metric-icon-box">
                  <FileCheck size={20} />
                </div>
                <div className="metric-value">{currentStudent.resumeScore}%</div>
                <div className="metric-label">ATS Resume Score</div>
              </div>

              <div className="glass-card metric-card warning">
                <div className="metric-icon-box">
                  <AlertCircle size={20} />
                </div>
                <div className="metric-value">{currentStudent.backlogs}</div>
                <div className="metric-label">Active Backlogs</div>
              </div>
            </div>

            {/* Sub-grid of cards */}
            <div className="content-grid">
              <div className="glass-card flex flex-col gap-4">
                <h3 className="text-lg font-bold text-white font-display">Active Job Applications</h3>
                {totalApplied === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <Briefcase size={40} className="mx-auto opacity-20 mb-3" />
                    <p className="text-sm">You haven't applied to any drives yet.</p>
                  </div>
                ) : (
                  <div className="item-list">
                    {currentStudent.applications.map((app) => {
                      return (
                        <div key={app.driveId} className="list-item">
                          <div>
                            <p className="font-bold text-white text-sm">{app.companyName}</p>
                            <p className="text-xs text-indigo-400 mt-0.5">{app.role}</p>
                          </div>
                          <div className="flex items-center gap-4">
                            <span className={`badge ${app.status === 'Selected' ? 'badge-success' :
                                app.status === 'Rejected' ? 'badge-danger' :
                                  'badge-info'
                              }`}>
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
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Tips / Profile Completions */}
              <div className="glass-card flex flex-col gap-4">
                <h3 className="text-lg font-bold text-white font-display">Smart Suggestions</h3>

                <div className="flex flex-col gap-3">
                  {currentStudent.resumeScore < 75 && (
                    <div className="flex gap-3 bg-amber-500/10 border border-amber-500/20 p-3.5 rounded-xl text-xs leading-relaxed text-amber-200">
                      <AlertCircle className="shrink-0 text-amber-400" size={18} />
                      <div>
                        <p className="font-bold">Low Resume ATS Match</p>
                        <p className="mt-1">Your score is {currentStudent.resumeScore}%. Scanning tools suggest optimizing keywords and formatting to avoid filter rejects.</p>
                        <button onClick={() => setActiveTab('ats')} className="text-indigo-400 font-semibold hover:underline mt-2 block">Optimize Now →</button>
                      </div>
                    </div>
                  )}

                  <div className="flex gap-3 bg-indigo-500/10 border border-indigo-500/20 p-3.5 rounded-xl text-xs leading-relaxed text-indigo-200">
                    <Sparkles className="shrink-0 text-indigo-400" size={18} />
                    <div>
                      <p className="font-bold">Practice Interviews</p>
                      <p className="mt-1">Conduct interactive behavioral and tech simulation tests. AI feedback will rate your target skill coverage.</p>
                      <button onClick={() => setActiveTab('interview')} className="text-indigo-400 font-semibold hover:underline mt-2 block">Start Simulator →</button>
                    </div>
                  </div>

                  <div className="flex gap-3 bg-white/5 border border-white/10 p-3.5 rounded-xl text-xs leading-relaxed text-gray-300">
                    <BookOpen className="shrink-0 text-gray-400" size={18} />
                    <div>
                      <p className="font-bold">Skills Catalog ({currentStudent.skills.length})</p>
                      <div className="flex flex-wrap gap-1 mt-2">
                        {currentStudent.skills.map(s => (
                          <span key={s} className="px-2 py-0.5 bg-slate-800 text-slate-300 rounded text-[10px]">{s}</span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: PLACEMENT DRIVES */}
        {activeTab === 'drives' && (
          <div className="flex flex-col gap-6 animate-slide-in">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-xl font-bold text-white font-display">Active Campus Placement Drives</h2>
                <p className="text-xs text-gray-400 mt-1">Review compatibility matching and apply directly to active recruitment opportunities.</p>
              </div>
            </div>

            <div className="grid grid-template-columns: 1fr gap-4">
              {drives.map((drive) => {
                const matchResult = getCompatibility(currentStudent, drive);
                const hasApplied = currentStudent.applications.some(a => a.driveId === drive.id);
                const application = currentStudent.applications.find(a => a.driveId === drive.id);

                return (
                  <div key={drive.id} className="glass-card flex flex-col md:flex-row justify-between md:items-center gap-6" style={{ borderLeft: matchResult.eligible ? '4px solid hsl(var(--color-primary))' : '4px solid rgba(255,255,255,0.1)' }}>
                    <div className="flex-1 flex flex-col gap-2">
                      <div className="flex items-center gap-3 flex-wrap">
                        <h3 className="text-lg font-bold text-white font-display">{drive.companyName}</h3>
                        <span className="badge badge-info">{drive.package}</span>
                        {hasApplied && (
                          <span className={`badge ${application?.status === 'Selected' ? 'badge-success' :
                              application?.status === 'Rejected' ? 'badge-danger' :
                                'badge-primary'
                            }`}>
                            Applied: {application?.status}
                          </span>
                        )}
                      </div>

                      <p className="text-xs font-semibold text-indigo-400">{drive.role}</p>
                      <p className="text-xs text-gray-400 leading-relaxed max-w-2xl">{drive.jobDesc}</p>

                      <div className="flex items-center gap-4 flex-wrap mt-2 text-xs text-gray-400">
                        <div>
                          <span className="font-semibold text-gray-500">Cut-off GPA:</span> {drive.cgpaCutoff}
                        </div>
                        <div>
                          <span className="font-semibold text-gray-500">Max Backlogs:</span> {drive.maxBacklogs}
                        </div>
                        <div>
                          <span className="font-semibold text-gray-500">Registration Ends:</span> {drive.deadline}
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-1 mt-2">
                        {drive.skillsRequired.map(skill => {
                          const hasSkill = currentStudent.skills.some(ss => ss.toLowerCase() === skill.toLowerCase());
                          return (
                            <span
                              key={skill}
                              className={`px-2 py-0.5 rounded text-[10px] ${hasSkill ? 'bg-indigo-500/20 text-indigo-300 font-semibold' : 'bg-slate-800 text-slate-500'
                                }`}
                            >
                              {skill}
                            </span>
                          );
                        })}
                      </div>
                    </div>

                    <div className="flex flex-col items-center justify-center p-4 bg-white/5 rounded-2xl min-w-[150px] border border-white/5 text-center">
                      {matchResult.eligible ? (
                        <>
                          <div className="text-2xl font-black text-emerald-400 font-display">{matchResult.score}%</div>
                          <div className="text-[10px] text-emerald-500/80 uppercase font-bold tracking-wider mt-0.5">Compatibility Match</div>

                          <button
                            disabled={hasApplied || isPlaced}
                            onClick={() => onApply(drive.id)}
                            className="btn btn-primary btn-sm w-full mt-4"
                          >
                            {hasApplied ? 'Applied' : isPlaced ? 'Placed' : 'Apply Now'}
                          </button>
                        </>
                      ) : (
                        <>
                          <div className="text-xs text-red-400 font-semibold flex items-center gap-1">
                            <AlertCircle size={14} />
                            Ineligible
                          </div>

                          <div className="flex flex-col gap-1 mt-2 text-[10px] text-gray-500 text-left w-full leading-tight">
                            {matchResult.reasons?.map((reason, i) => (
                              <p key={i}>• {reason}</p>
                            ))}
                          </div>

                          <button
                            disabled
                            className="btn btn-secondary btn-sm w-full mt-4 opacity-50 cursor-not-allowed"
                          >
                            Locked
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB 3: ATS RESUME SCORER */}
        {activeTab === 'ats' && (
          <div className="flex flex-col gap-6 animate-slide-in">
            <div>
              <h2 className="text-xl font-bold text-white font-display">ATS Resume Match Scorer</h2>
              <p className="text-xs text-gray-400 mt-1">Paste your resume content below to simulate ATS filtering. Evaluate keyword weight, readability, and structural metrics.</p>
            </div>

            <div className="ats-layout">
              <div className="glass-card flex flex-col gap-4">
                <div className="input-group mb-0">
                  <label className="input-label">Resume Content (Plain Text)</label>
                  <textarea
                    rows={12}
                    value={resumeTextInput}
                    onChange={(e) => setResumeTextInput(e.target.value)}
                    placeholder="Paste your professional summary, academic qualifications, projects, and work experience here..."
                    className="input-field resize-none leading-relaxed text-sm"
                  ></textarea>
                </div>

                <button
                  disabled={!resumeTextInput.trim()}
                  onClick={handleAtsScan}
                  className="btn btn-primary w-full py-3"
                >
                  <FileCheck size={18} />
                  Analyze Resume Text
                </button>
              </div>

              {/* Analysis output */}
              <div className="glass-card flex flex-col gap-6 justify-center">
                {atsReport ? (
                  <div className="animate-slide-in flex flex-col gap-6">
                    <div className="text-center">
                      <div className="circular-score">
                        <svg width="120" height="120">
                          <circle
                            cx="60"
                            cy="60"
                            r="50"
                            fill="transparent"
                            stroke="rgba(255,255,255,0.05)"
                            strokeWidth="8"
                          />
                          <circle
                            cx="60"
                            cy="60"
                            r="50"
                            fill="transparent"
                            stroke="hsl(var(--color-primary))"
                            strokeWidth="8"
                            strokeDasharray={314.16}
                            strokeDashoffset={314.16 - (314.16 * atsReport.score) / 100}
                          />
                        </svg>
                        <div className="circular-score-text">
                          <p className="circular-score-val">{atsReport.score}</p>
                          <p className="circular-score-lbl">Score</p>
                        </div>
                      </div>
                      <h4 className="text-sm font-semibold text-white mt-4 font-display">Applicant Match Index</h4>
                    </div>

                    <div className="border-t border-white/5 pt-4">
                      <h4 className="text-xs font-bold uppercase text-gray-400 tracking-wider mb-2">Detailed Checkpoints</h4>

                      <div className="flex flex-col gap-2 text-xs">
                        <div className="flex justify-between items-center py-1">
                          <span className="text-gray-500">Core Keyword Density:</span>
                          <span className="font-semibold text-white">{atsReport.foundKeywords.length} Detected</span>
                        </div>
                        <div className="flex justify-between items-center py-1">
                          <span className="text-gray-500">Action Verb Density:</span>
                          <span className="font-semibold text-white">{atsReport.foundVerbs.length} Used</span>
                        </div>
                        <div className="flex justify-between items-center py-1">
                          <span className="text-gray-500">Quantifiable Metrics:</span>
                          <span className={atsReport.hasMetrics ? 'text-emerald-400 font-semibold' : 'text-amber-400 font-semibold'}>
                            {atsReport.hasMetrics ? 'Optimized' : 'Missing Numbers'}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="border-t border-white/5 pt-4">
                      <h4 className="text-xs font-bold uppercase text-gray-400 tracking-wider mb-2">Refinement Recommendations</h4>
                      <ul className="flex flex-col gap-2 pl-4 list-disc text-xs text-indigo-300/95 leading-relaxed">
                        {atsReport.recommendations.map((rec, i) => (
                          <li key={i}>{rec}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-12 text-gray-500">
                    <FileCheck size={48} className="mx-auto opacity-20 mb-3" />
                    <p className="text-sm max-w-xs mx-auto">Input your resume details and click analyze to calculate formatting scoring checkpoints.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: MOCK INTERVIEW SIMULATOR */}
        {activeTab === 'interview' && (
          <div className="flex flex-col gap-6 animate-slide-in">
            <div>
              <h2 className="text-xl font-bold text-white font-display">Mock Interview Simulator</h2>
              <p className="text-xs text-gray-400 mt-1">Test your concepts. Choose a placement track to simulate live screening and receive real-time keyword analysis.</p>
            </div>

            {!interviewRole ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="glass-card flex flex-col gap-4 p-6 hover:border-indigo-500/30 transition-all">
                  <h3 className="text-lg font-bold text-white font-display">Software Engineer Track</h3>
                  <p className="text-xs text-gray-400 leading-relaxed">
                    Evaluates system designs, concurrency, DB indexes, React context state, async hooks, and basic compiler logic.
                  </p>
                  <button
                    onClick={() => handleStartInterview('Software Engineer')}
                    className="btn btn-primary mt-auto"
                  >
                    Start Technical Mock
                  </button>
                </div>

                <div className="glass-card flex flex-col gap-4 p-6 hover:border-indigo-500/30 transition-all">
                  <h3 className="text-lg font-bold text-white font-display">Technology Consultant / Analyst Track</h3>
                  <p className="text-xs text-gray-400 leading-relaxed">
                    Evaluates metrics calculation, messy datasets imputations, funnel conversions, stakeholder communications, and root cause reviews.
                  </p>
                  <button
                    onClick={() => handleStartInterview('Analyst')}
                    className="btn btn-primary mt-auto"
                  >
                    Start Analytical Mock
                  </button>
                </div>
              </div>
            ) : (
              <div className="glass-card flex flex-col gap-4">
                <div className="flex justify-between items-center border-bottom border-white/5 pb-3">
                  <div className="flex items-center gap-2">
                    <span className="badge badge-primary">{interviewRole} Interview</span>
                    <span className="text-xs text-gray-500">Question {Math.min(currentQuestionIndex + 1, interviewQuestions.length)} of {interviewQuestions.length}</span>
                  </div>
                  <button
                    onClick={() => setInterviewRole(null)}
                    className="btn btn-secondary btn-sm"
                  >
                    Change Track
                  </button>
                </div>

                {/* Chat window */}
                <div className="chat-window">
                  {chatHistory.map((msg, i) => (
                    <div
                      key={i}
                      className={`chat-bubble ${msg.sender === 'user' ? 'user' :
                          msg.sender === 'feedback' ? 'feedback' : 'assistant'
                        }`}
                    >
                      {msg.text}
                    </div>
                  ))}
                </div>

                {/* Input row */}
                {!isInterviewFinished && (
                  <div className="chat-input-bar">
                    <input
                      type="text"
                      value={userAnswer}
                      onChange={(e) => setUserAnswer(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && userAnswer.trim()) {
                          handleSendAnswer();
                        }
                      }}
                      placeholder="Type your detailed interview answer here..."
                      className="input-field flex-1"
                    />
                    <button
                      disabled={!userAnswer.trim()}
                      onClick={handleSendAnswer}
                      className="btn btn-primary"
                    >
                      <Send size={16} />
                    </button>
                  </div>
                )}

                {isInterviewFinished && (
                  <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-4 flex flex-col gap-3 text-center animate-slide-in">
                    <Award size={32} className="text-emerald-400 mx-auto" />
                    <h3 className="font-bold text-white font-display">Interview Finished!</h3>
                    <p className="text-xs text-slate-300 max-w-md mx-auto">
                      Your answer scoring records have been cataloged. Average Performance: {Math.round((interviewScores.reduce((a, b) => a + b, 0) / interviewScores.length) * 10)}%.
                    </p>
                    <button
                      onClick={() => handleStartInterview(interviewRole)}
                      className="btn btn-outline btn-sm mx-auto mt-2"
                    >
                      Retry Simulator
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* TAB 5: PIPELINE VISUALIZER */}
        {activeTab === 'visualizer' && (
          <div className="flex flex-col gap-6 animate-slide-in">
            <div>
              <h2 className="text-xl font-bold text-white font-display">Recruitment Pipeline Visualizer</h2>
              <p className="text-xs text-gray-400 mt-1">Select an active job application to view your hiring stage and round-by-round interview feedback.</p>
            </div>

            {totalApplied === 0 ? (
              <div className="glass-card text-center py-12 text-gray-500">
                <TrendingUp size={48} className="mx-auto opacity-20 mb-3" />
                <p className="text-sm">Apply to drives first to track recruitment stages.</p>
              </div>
            ) : (
              <div className="glass-card flex flex-col gap-6">
                <div className="input-group max-w-sm mb-0">
                  <label className="input-label">Select Application to Track</label>
                  <select
                    value={selectedApplicationId}
                    onChange={(e) => setSelectedApplicationId(e.target.value)}
                    className="input-field"
                  >
                    {currentStudent.applications.map((app) => (
                      <option key={app.driveId} value={app.driveId}>
                        {app.companyName} - {app.role}
                      </option>
                    ))}
                  </select>
                </div>

                {selectedApp && selectedDrive && (
                  <div className="border-t border-white/5 pt-6 animate-slide-in">
                    <div className="flex justify-between items-center mb-6 flex-wrap gap-2">
                      <div>
                        <h3 className="text-lg font-bold text-white font-display">{selectedDrive.companyName}</h3>
                        <p className="text-xs text-indigo-400">{selectedDrive.role}</p>
                      </div>
                      <div>
                        <span className={`badge ${selectedApp.status === 'Selected' ? 'badge-success' :
                            selectedApp.status === 'Rejected' ? 'badge-danger' :
                              'badge-info'
                          }`}>
                          Current Status: {selectedApp.status}
                        </span>
                      </div>
                    </div>

                    {/* Timeline stepper */}
                    <div className="pipeline-stepper">
                      {/* Colored progress bar background based on completed steps */}
                      <div
                        className="pipeline-progress-bar"
                        style={{
                          width: `${(selectedApp.currentRoundIndex / (selectedDrive.rounds.length - 1)) * 90}%`
                        }}
                      ></div>

                      {selectedDrive.rounds.map((round, index) => {
                        const isCompleted = index < selectedApp.currentRoundIndex || selectedApp.status === 'Selected';
                        const isActive = index === selectedApp.currentRoundIndex && selectedApp.status !== 'Selected' && selectedApp.status !== 'Rejected';
                        const isFinalSelected = selectedApp.status === 'Selected' && index === selectedDrive.rounds.length - 1;
                        const isFinalRejected = selectedApp.status === 'Rejected' && index === selectedApp.currentRoundIndex;

                        let nodeClass = '';
                        if (isFinalSelected) nodeClass = 'selected-step';
                        else if (isFinalRejected) nodeClass = 'rejected-step';
                        else if (isCompleted) nodeClass = 'completed';
                        else if (isActive) nodeClass = 'active';

                        return (
                          <div key={round} className={`step-node ${nodeClass}`}>
                            <div className="step-dot">
                              {index + 1}
                            </div>
                            <div className="step-label">{round}</div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Step details feedback */}
                    <div className="bg-white/5 border border-white/10 rounded-xl p-5 mt-8 flex gap-4">
                      <div className="p-3 bg-indigo-500/10 rounded-xl text-indigo-400 align-self-start shrink-0">
                        <Award size={20} />
                      </div>
                      <div>
                        <h4 className="font-bold text-white text-sm font-display">TPO Feedback Log</h4>
                        <p className="text-xs text-slate-300 mt-2 leading-relaxed">
                          {selectedApp.feedback
                            ? selectedApp.feedback
                            : `Status details: The recruitment board is currently processing candidates for the "${selectedDrive.rounds[selectedApp.currentRoundIndex]}" stage. Feedback logs will appear here once the round reviews conclude.`
                          }
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* TAB 6: PROFILE SETTINGS */}
        {activeTab === 'profile' && (
          <div className="flex flex-col gap-6 animate-slide-in">
            <div>
              <h2 className="text-xl font-bold text-white font-display">Profile & Academic Settings</h2>
              <p className="text-xs text-gray-400 mt-1">Keep your credentials and grades up to date. Compatibility matching dynamically adapts to your scores.</p>
            </div>

            <form onSubmit={handleSaveProfile} className="glass-card flex flex-col gap-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="input-group">
                  <label className="input-label">Full Name</label>
                  <input
                    type="text"
                    required
                    value={profileName}
                    onChange={(e) => setProfileName(e.target.value)}
                    className="input-field"
                  />
                </div>
                <div className="input-group">
                  <label className="input-label">Email Address</label>
                  <input
                    type="email"
                    required
                    value={profileEmail}
                    onChange={(e) => setProfileEmail(e.target.value)}
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
                    value={profilePassword}
                    onChange={(e) => setProfilePassword(e.target.value)}
                    className="input-field"
                  />
                </div>
                <div className="input-group">
                  <label className="input-label">Branch/Major</label>
                  <select
                    value={profileBranch}
                    onChange={(e: any) => setProfileBranch(e.target.value)}
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
                  <label className="input-label">Cumulative CGPA</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={profileCgpa}
                    onChange={(e) => setProfileCgpa(e.target.value)}
                    min="0"
                    max="10"
                    className="input-field"
                  />
                </div>
                <div className="input-group">
                  <label className="input-label">Active Backlogs</label>
                  <input
                    type="number"
                    required
                    value={profileBacklogs}
                    onChange={(e) => setProfileBacklogs(e.target.value)}
                    min="0"
                    className="input-field"
                  />
                </div>
                <div className="input-group">
                  <label className="input-label">Projects Built</label>
                  <input
                    type="number"
                    required
                    value={profileProjects}
                    onChange={(e) => setProfileProjects(e.target.value)}
                    min="0"
                    className="input-field"
                  />
                </div>
              </div>

              <div className="input-group">
                <label className="input-label">Technical Skills (comma-separated)</label>
                <input
                  type="text"
                  required
                  value={profileSkills}
                  onChange={(e) => setProfileSkills(e.target.value)}
                  className="input-field"
                />
              </div>

              <div className="input-group mb-0">
                <label className="input-label">Resume plain text summary (Syncs with ATS tool)</label>
                <textarea
                  rows={6}
                  required
                  value={profileResume}
                  onChange={(e) => setProfileResume(e.target.value)}
                  placeholder="Paste your resume details..."
                  className="input-field resize-none text-xs leading-relaxed"
                ></textarea>
              </div>

              <button type="submit" className="btn btn-primary w-full py-3 mt-2">
                Save Profile Changes
              </button>
            </form>
          </div>
        )}

      </main>
    </div>
  );
};
