import { useState } from 'react';
import { Auth } from './components/Auth';
import { StudentPortal } from './components/StudentPortal';
import { AdminPortal } from './components/AdminPortal';
import { Notification } from './components/Notification';
import type { ToastType } from './components/Notification';
import { INITIAL_STUDENTS, INITIAL_DRIVES } from './mockData';
import type { Student, PlacementDrive, Application } from './mockData';
import { GraduationCap, LogOut, Shield } from 'lucide-react';

function App() {
  const [students, setStudents] = useState<Student[]>(INITIAL_STUDENTS);
  const [drives, setDrives] = useState<PlacementDrive[]>(INITIAL_DRIVES);
  const [session, setSession] = useState<{ role: 'student' | 'admin'; studentId?: string } | null>(null);
  const [toast, setToast] = useState<ToastType | null>(null);

  // Helper to trigger toast notifications
  const triggerToast = (message: string, type: 'success' | 'error' | 'warning' | 'info') => {
    setToast({
      id: Math.random().toString(36).substr(2, 9),
      message,
      type
    });
  };

  const handleLogin = (role: 'student' | 'admin', studentId?: string) => {
    setSession({ role, studentId });
    if (role === 'student') {
      const std = students.find(s => s.id === studentId);
      triggerToast(`Welcome back, ${std?.name}!`, 'success');
    } else {
      triggerToast('Administrator authenticated successfully.', 'success');
    }
  };

  const handleLogout = () => {
    setSession(null);
    triggerToast('Logged out successfully.', 'info');
  };

  // Student apply to drive
  const handleApplyDrive = (driveId: string) => {
    if (!session || session.role !== 'student' || !session.studentId) return;

    const studentId = session.studentId;
    const drive = drives.find(d => d.id === driveId);
    if (!drive) return;

    // Check if already applied
    const student = students.find(s => s.id === studentId);
    if (student?.applications.some(app => app.driveId === driveId)) {
      triggerToast('You have already applied for this placement drive.', 'warning');
      return;
    }

    const newApplication: Application = {
      driveId,
      companyName: drive.companyName,
      role: drive.role,
      appliedDate: new Date().toISOString().split('T')[0],
      status: 'Applied',
      currentRoundIndex: 0
    };

    // Update students list state
    setStudents(prevStudents => 
      prevStudents.map(s => {
        if (s.id === studentId) {
          return {
            ...s,
            applications: [...s.applications, newApplication]
          };
        }
        return s;
      })
    );

    // Update drives list state to bump count
    setDrives(prevDrives => 
      prevDrives.map(d => {
        if (d.id === driveId) {
          return {
            ...d,
            registeredCount: d.registeredCount + 1
          };
        }
        return d;
      })
    );

    triggerToast(`Application submitted successfully for ${drive.companyName}!`, 'success');
  };

  // Student updates resume ATS text/score
  const handleUpdateResumeScore = (score: number, resumeText: string) => {
    if (!session || session.role !== 'student' || !session.studentId) return;

    setStudents(prevStudents => 
      prevStudents.map(s => {
        if (s.id === session.studentId) {
          return {
            ...s,
            resumeScore: score,
            resumeText
          };
        }
        return s;
      })
    );

    triggerToast(`Resume index optimized! New ATS Score: ${score}%`, 'success');
  };

  // Admin launches new drive
  const handleAddDrive = (newDriveData: Omit<PlacementDrive, 'id' | 'registeredCount'>) => {
    const newDrive: PlacementDrive = {
      ...newDriveData,
      id: `drv_${Math.random().toString(36).substr(2, 9)}`,
      registeredCount: 0
    };

    setDrives(prevDrives => [newDrive, ...prevDrives]);
    triggerToast(`Recruitment drive for ${newDrive.companyName} created successfully!`, 'success');
  };

  // Admin suspends/reactivates drive
  const handleToggleDriveActive = (driveId: string) => {
    setDrives(prevDrives => 
      prevDrives.map(d => {
        if (d.id === driveId) {
          const nextState = !d.active;
          triggerToast(
            `Drive for ${d.companyName} has been ${nextState ? 'activated' : 'suspended'}.`,
            nextState ? 'success' : 'warning'
          );
          return { ...d, active: nextState };
        }
        return d;
      })
    );
  };

  // Admin updates student placement status manually
  const handleUpdateStudentStatus = (studentId: string, company?: string, salaryPackage?: string) => {
    const student = students.find(s => s.id === studentId);
    if (!student) return;

    setStudents(prevStudents => 
      prevStudents.map(s => {
        if (s.id === studentId) {
          if (company && salaryPackage) {
            triggerToast(`${s.name} marked as Placed @ ${company}!`, 'success');
            return {
              ...s,
              placementStatus: 'Placed' as const,
              placedCompany: company,
              placedPackage: salaryPackage
            };
          } else {
            triggerToast(`${s.name} status reset to Unplaced.`, 'info');
            return {
              ...s,
              placementStatus: 'Unplaced' as const,
              placedCompany: undefined,
              placedPackage: undefined
            };
          }
        }
        return s;
      })
    );
  };

  // Admin promotes candidate in tracker pipeline
  const handlePromoteStudent = (
    studentId: string, 
    driveId: string, 
    newRoundIndex: number, 
    isFinalSelection: boolean
  ) => {
    const student = students.find(s => s.id === studentId);
    const drive = drives.find(d => d.id === driveId);
    if (!student || !drive) return;

    setStudents(prevStudents => 
      prevStudents.map(s => {
        if (s.id === studentId) {
          const updatedApps = s.applications.map(app => {
            if (app.driveId === driveId) {
              if (isFinalSelection) {
                return {
                  ...app,
                  status: 'Selected' as const,
                  currentRoundIndex: newRoundIndex - 1,
                  feedback: `Offer issued! Selected for the role of ${drive.role} with a salary package of ${drive.package}.`
                };
              } else {
                const nextRoundName = drive.rounds[newRoundIndex];
                return {
                  ...app,
                  status: nextRoundName as any,
                  currentRoundIndex: newRoundIndex,
                  feedback: `Successfully cleared stage "${drive.rounds[newRoundIndex - 1]}". Promoted to "${nextRoundName}".`
                };
              }
            }
            return app;
          });

          // If final selection, automatically mark the student as Placed overall in their profile!
          if (isFinalSelection) {
            return {
              ...s,
              placementStatus: 'Placed' as const,
              placedCompany: drive.companyName,
              placedPackage: drive.package,
              applications: updatedApps
            };
          }

          return {
            ...s,
            applications: updatedApps
          };
        }
        return s;
      })
    );

    if (isFinalSelection) {
      triggerToast(`Congratulations! ${student.name} has been selected for ${drive.companyName}!`, 'success');
    } else {
      triggerToast(`${student.name} promoted to "${drive.rounds[newRoundIndex]}" for ${drive.companyName}.`, 'success');
    }
  };

  // Admin rejects student candidate
  const handleRejectStudent = (studentId: string, driveId: string) => {
    const student = students.find(s => s.id === studentId);
    const drive = drives.find(d => d.id === driveId);
    if (!student || !drive) return;

    setStudents(prevStudents => 
      prevStudents.map(s => {
        if (s.id === studentId) {
          return {
            ...s,
            applications: s.applications.map(app => {
              if (app.driveId === driveId) {
                return {
                  ...app,
                  status: 'Rejected' as const,
                  feedback: `Recruitment cycle concluded at stage "${drive.rounds[app.currentRoundIndex]}". Better luck next time!`
                };
              }
              return app;
            })
          };
        }
        return s;
      })
    );

    triggerToast(`${student.name} marked as Rejected for ${drive.companyName}.`, 'warning');
  };

  // Get active logged in student object
  const loggedInStudent = session?.role === 'student' 
    ? students.find(s => s.id === session.studentId) 
    : undefined;

  return (
    <div className="min-h-screen flex flex-col relative">
      {/* Background glow effects built into root */}
      <div className="bg-glow-container">
        <div className="bg-glow-orb bg-glow-orb-1"></div>
        <div className="bg-glow-orb bg-glow-orb-2"></div>
      </div>

      {/* Global Notification system */}
      <Notification toast={toast} onClose={() => setToast(null)} />

      {/* Main Header navigation bar */}
      <header className="app-header">
        <div className="app-logo">
          <GraduationCap className="logo-icon animate-pulse" size={24} />
          <span>TPOHelper</span>
        </div>

        {session && (
          <div className="user-nav-profile">
            {session.role === 'student' && loggedInStudent ? (
              <div className="flex items-center gap-3">
                <div className="hidden sm:flex flex-col text-right">
                  <span className="text-xs font-semibold text-white truncate max-w-[120px]">{loggedInStudent.name}</span>
                  <span className="text-[10px] text-gray-500 font-semibold uppercase">{loggedInStudent.branch}</span>
                </div>
                <div className="avatar">{loggedInStudent.name.charAt(0)}</div>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <div className="hidden sm:flex flex-col text-right">
                  <span className="text-xs font-semibold text-white">TPO Coordinator</span>
                  <span className="text-[10px] text-indigo-400 font-bold uppercase tracking-wider">Administrator</span>
                </div>
                <div className="avatar bg-gradient-to-br from-indigo-500 to-purple-600">
                  <Shield size={16} className="text-white" />
                </div>
              </div>
            )}
            
            <button 
              onClick={handleLogout}
              className="btn btn-secondary btn-sm p-1.5 rounded-lg text-gray-400 hover:text-red-400 transition-colors"
              title="Sign Out"
            >
              <LogOut size={16} />
            </button>
          </div>
        )}
      </header>

      {/* Layout Router Router view switcher */}
      <div className="flex-1 flex flex-col">
        {!session ? (
          <Auth students={students} onLogin={handleLogin} />
        ) : session.role === 'student' && loggedInStudent ? (
          <StudentPortal
            currentStudent={loggedInStudent}
            drives={drives}
            onLogout={handleLogout}
            onApply={handleApplyDrive}
            onUpdateResumeScore={handleUpdateResumeScore}
          />
        ) : (
          <AdminPortal
            students={students}
            drives={drives}
            onLogout={handleLogout}
            onAddDrive={handleAddDrive}
            onToggleDriveActive={handleToggleDriveActive}
            onUpdateStudentStatus={handleUpdateStudentStatus}
            onPromoteStudent={handlePromoteStudent}
            onRejectStudent={handleRejectStudent}
          />
        )}
      </div>
    </div>
  );
}

export default App;
