import { useState, useEffect } from 'react';
import { Auth } from './components/Auth';
import { StudentPortal } from './components/StudentPortal';
import { AdminPortal } from './components/AdminPortal';
import { Notification } from './components/Notification';
import type { ToastType } from './components/Notification';
import { INITIAL_STUDENTS, INITIAL_DRIVES } from './mockData';
import type { Student, PlacementDrive, Application } from './mockData';
import { CustomCursor } from './components/CustomCursor';
import { useTheme } from './ThemeContext';
import type { AppNotification } from './components/NotificationCenter';

function App() {
  const { theme, toggleTheme } = useTheme();
  
  const [students, setStudents] = useState<Student[]>(() => {
    const saved = localStorage.getItem('tpo_students');
    return saved ? JSON.parse(saved) : [];
  });
  
  const [drives, setDrives] = useState<PlacementDrive[]>(() => {
    const saved = localStorage.getItem('tpo_drives');
    return saved ? JSON.parse(saved) : [];
  });
  
  const [session, setSession] = useState<{ role: 'student' | 'admin'; studentId?: string } | null>(null);
  const [toast, setToast] = useState<ToastType | null>(null);

  // Centralized Notifications State
  const [notifications, setNotifications] = useState<AppNotification[]>(() => {
    const saved = localStorage.getItem('tpo_notifications');
    return saved ? JSON.parse(saved) : [];
  });

  // Helper to trigger toast notifications
  const triggerToast = (message: string, type: 'success' | 'error' | 'warning' | 'info') => {
    setToast({
      id: Math.random().toString(36).substr(2, 9),
      message,
      type
    });
  };

  // Synchronize state with localStorage
  useEffect(() => {
    localStorage.setItem('tpo_students', JSON.stringify(students));
  }, [students]);

  useEffect(() => {
    localStorage.setItem('tpo_drives', JSON.stringify(drives));
  }, [drives]);

  useEffect(() => {
    localStorage.setItem('tpo_notifications', JSON.stringify(notifications));
  }, [notifications]);

  // Seed notification logger helper
  const addNotification = (
    title: string,
    message: string,
    type: AppNotification['type'],
    studentId?: string
  ) => {
    const newNotif: AppNotification = {
      id: `notif_${Math.random().toString(36).substr(2, 9)}`,
      title,
      message,
      type,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      read: false,
      studentId
    };
    setNotifications((prev) => [newNotif, ...prev]);
  };

  // Seed sample data convenience helper
  const handleSeedData = () => {
    setStudents(INITIAL_STUDENTS);
    setDrives(INITIAL_DRIVES);
    
    // Clear notifications log and seed default system alerts
    const initialNotifs: AppNotification[] = [
      {
        id: 'init_1',
        title: 'Welcome to TPOHelper',
        message: 'System database has been populated with mock students and recruiter campaigns.',
        type: 'system',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        read: false
      },
      {
        id: 'init_2',
        title: 'New Campaigns Launched',
        message: 'Check out active recruitment campaigns from Google, Microsoft, Amazon, and Tesla.',
        type: 'drive_created',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        read: false
      }
    ];
    setNotifications(initialNotifs);
    triggerToast('Sample database seeded successfully. Feel free to sign in!', 'success');
  };

  const handleLogin = (role: 'student' | 'admin', studentId?: string) => {
    setSession({ role, studentId });
    if (role === 'student') {
      const std = students.find(s => s.id === studentId);
      triggerToast(`Welcome back, ${std?.name}!`, 'success');
      addNotification(
        'Session Logged In',
        `Successfully logged into Student portal.`,
        'system',
        studentId
      );
    } else {
      triggerToast('Administrator authenticated successfully.', 'success');
      addNotification(
        'Session Logged In',
        'Administrator authenticated successfully.',
        'system'
      );
    }
  };

  const handleLogout = () => {
    const prevSession = session;
    setSession(null);
    triggerToast('Logged out successfully.', 'info');
    if (prevSession && prevSession.role === 'student' && prevSession.studentId) {
      addNotification(
        'Session Logged Out',
        'Logged out of Student portal.',
        'system',
        prevSession.studentId
      );
    } else {
      addNotification(
        'Session Logged Out',
        'Logged out of Administrator Portal.',
        'system'
      );
    }
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
    
    // Add Notification logs
    addNotification(
      'Application Submitted',
      `You successfully registered for the ${drive.companyName} (${drive.role}) drive.`,
      'application_status',
      studentId
    );
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
    addNotification(
      'ATS Score Updated',
      `Optimized resume text. New ATS Index score: ${score}%.`,
      'system',
      session.studentId
    );
  };

  // Student updates profile details
  const handleUpdateStudentProfile = (updatedStudent: Student) => {
    setStudents(prevStudents =>
      prevStudents.map(s => s.id === updatedStudent.id ? updatedStudent : s)
    );
    triggerToast('Profile settings saved successfully.', 'success');
    addNotification(
      'Profile Updated',
      'Your profile educational preferences and CV tags have been updated.',
      'system',
      updatedStudent.id
    );
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
    
    addNotification(
      'New Placement Drive Launched',
      `Campaign launched for ${newDrive.companyName} (${newDrive.role}) with package ${newDrive.package}.`,
      'drive_created'
    );
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
          
          addNotification(
            'Campaign Status Changed',
            `Recruitment campaign for ${d.companyName} has been ${nextState ? 'reactivated' : 'temporarily suspended'}.`,
            'system'
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
            
            addNotification(
              'Placement Offer Finalized',
              `Manual placement override: Assigned Offer at ${company} with ${salaryPackage} salary package.`,
              'offer_received',
              studentId
            );
            
            return {
              ...s,
              placementStatus: 'Placed' as const,
              placedCompany: company,
              placedPackage: salaryPackage
            };
          } else {
            triggerToast(`${s.name} status reset to Unplaced.`, 'info');
            
            addNotification(
              'Placement Status Reset',
              'Your placement record status was reset to Unplaced by the admin coordinator.',
              'system',
              studentId
            );
            
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
                  status: nextRoundName as Application['status'],
                  currentRoundIndex: newRoundIndex,
                  feedback: `Successfully cleared stage "${drive.rounds[newRoundIndex - 1]}". Promoted to "${nextRoundName}".`
                };
              }
            }
            return app;
          });

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
      
      addNotification(
        'Congratulations! Offer Received',
        `You have been offered the role of ${drive.role} at ${drive.companyName} (${drive.package})!`,
        'offer_received',
        studentId
      );
      
      addNotification(
        'Student Placed Successfully',
        `${student.name} secured a placement offer at ${drive.companyName}.`,
        'placement_completed'
      );
    } else {
      triggerToast(`${student.name} promoted to "${drive.rounds[newRoundIndex]}" for ${drive.companyName}.`, 'success');
      
      addNotification(
        'Round Clearance Notification',
        `You cleared the "${drive.rounds[newRoundIndex - 1]}" stage for ${drive.companyName}. Promoted to "${drive.rounds[newRoundIndex]}".`,
        'interview_scheduled',
        studentId
      );
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
    
    addNotification(
      'Application Status Concluded',
      `Recruitment pipeline for ${drive.companyName} finished at stage "${drive.rounds[student.applications.find(a => a.driveId === driveId)?.currentRoundIndex || 0]}".`,
      'application_status',
      studentId
    );
  };

  // Notification management functions
  const handleMarkAsRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  };

  const handleMarkAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    triggerToast('All notifications marked as read.', 'info');
  };

  const handleClearNotification = (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  const handleClearAll = () => {
    setNotifications([]);
    triggerToast('Notification log cleared.', 'info');
  };

  // Get active logged in student object
  const loggedInStudent = session?.role === 'student'
    ? students.find(s => s.id === session.studentId)
    : undefined;

  const handleRegisterStudent = (newStudent: Student) => {
    setStudents(prevStudents => [...prevStudents, newStudent]);
    triggerToast(`Student registration successful! Please sign in.`, 'success');
  };

  return (
    <div className="min-h-screen flex flex-col relative bg-slate-950">
      
      {/* Dynamic Custom Cursor (Lerp optimized) */}
      <CustomCursor />

      {/* Global Notification Toast banner */}
      <Notification toast={toast} onClose={() => setToast(null)} />

      {/* Layout Router View switcher */}
      <div className="flex-1 flex flex-col">
        {!session ? (
          <Auth
            students={students}
            onLogin={handleLogin}
            onRegister={handleRegisterStudent}
            onSeedData={handleSeedData}
          />
        ) : session.role === 'student' && loggedInStudent ? (
          <StudentPortal
            key={loggedInStudent.id}
            currentStudent={loggedInStudent}
            drives={drives}
            onLogout={handleLogout}
            onApply={handleApplyDrive}
            onUpdateResumeScore={handleUpdateResumeScore}
            onUpdateStudentProfile={handleUpdateStudentProfile}
            notifications={notifications.filter(n => n.studentId === loggedInStudent.id || !n.studentId)}
            onMarkAsRead={handleMarkAsRead}
            onMarkAllAsRead={handleMarkAllAsRead}
            onClearNotification={handleClearNotification}
            onClearAll={handleClearAll}
            theme={theme}
            toggleTheme={toggleTheme}
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
            notifications={notifications}
            onMarkAsRead={handleMarkAsRead}
            onMarkAllAsRead={handleMarkAllAsRead}
            onClearNotification={handleClearNotification}
            onClearAll={handleClearAll}
            theme={theme}
            toggleTheme={toggleTheme}
          />
        )}
      </div>
    </div>
  );
}

export default App;
