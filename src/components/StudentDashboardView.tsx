import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  LayoutDashboard, 
  Flame, 
  Clock, 
  Target, 
  Award, 
  Brain, 
  CheckCircle2, 
  Circle, 
  AlertTriangle, 
  Calendar, 
  ArrowUpRight, 
  Zap, 
  BookOpen, 
  Sparkles, 
  Plus, 
  Layers, 
  TrendingUp, 
  Database, 
  Activity, 
  Check, 
  Edit3, 
  Save, 
  X, 
  CalendarDays, 
  GraduationCap,
  Play,
  Pause,
  RotateCcw,
  Trash2,
  FileText,
  HelpCircle,
  FolderOpen,
  ArrowRight,
  UploadCloud,
  CheckSquare,
  Cloud,
  RefreshCw,
  Server,
  Settings,
  UserCheck,
  Globe,
  Sliders,
  User,
  Compass
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { ALL_FLAT_SUBJECTS } from '../data/curriculumData';
import { SupabaseDataService, SupabaseAuthService, StudentProfileRecord } from '../lib/supabase';
import { GlobalCurriculumPicker } from './GlobalCurriculumPicker';
import { IngestionView } from './IngestionView';
import { StudyPlanView } from './StudyPlanView';

interface StudentDashboardProps {
  onNavigate: (tab: 'dashboard' | 'tutor' | 'flashcards') => void;
  onOpenAuth?: () => void;
  isLoggedIn?: boolean;
  currentUser?: { email: string; name?: string } | null;
}

export interface StudentSubject {
  id: string;
  name: string;
  category: string;
  masteryScore: number;
  targetGrade: string;
  syllabusProgress: number; // 0..100
  studyMinutes: number;
  lastStudiedDate?: string;
  examDate: string;
  examPaper: string;
}

export interface StudentTask {
  id: string;
  title: string;
  subject: string;
  durationMinutes: number;
  completed: boolean;
  type: 'tutor' | 'flashcard' | 'past_paper' | 'derivation' | 'revision';
  createdAt: string;
}

export interface RealActivityLog {
  id: string;
  timestamp: string;
  action: string;
  subject: string;
  detail: string;
  badge: string;
}

export const StudentDashboardView: React.FC<StudentDashboardProps> = ({ onNavigate, onOpenAuth, isLoggedIn, currentUser }) => {
  // 1. Candidate Identity & Curriculum Alignment (Synchronized with localStorage & Auth)
  const [studentName, setStudentName] = useState<string>(() => {
    return currentUser?.name || localStorage.getItem('eduai_student_name') || 'Student';
  });
  const [studentEmail, setStudentEmail] = useState<string>(() => {
    return currentUser?.email || localStorage.getItem('eduai_student_email') || '';
  });
  const [isEditingName, setIsEditingName] = useState(false);
  const [tempName, setTempName] = useState(studentName);

  const [country, setCountry] = useState<string>(() => {
    return localStorage.getItem('eduai_country') || 'United Kingdom';
  });
  const [board, setBoard] = useState<string>(() => {
    return localStorage.getItem('eduai_board') || 'Cambridge (CAIE)';
  });
  const [grade, setGrade] = useState<string>(() => {
    return localStorage.getItem('eduai_grade') || 'A-Level Year 12';
  });
  const [targetGrade, setTargetGrade] = useState<string>(() => {
    return localStorage.getItem('eduai_target_grade') || 'A*';
  });
  const [activeCurriculumSubject, setActiveCurriculumSubject] = useState<string>(() => {
    return localStorage.getItem('eduai_subject') || 'Mathematics';
  });

  // Target examination series / date
  const [targetExamDate, setTargetExamDate] = useState<string>(() => {
    const saved = localStorage.getItem('eduai_target_exam_date');
    if (saved) return saved;
    const d = new Date();
    d.setDate(d.getDate() + 30);
    return d.toISOString().split('T')[0];
  });
  const [isEditingExamDate, setIsEditingExamDate] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);

  // Handlers for Curriculum Grounding Picker
  const handleSetCountry = (val: string) => {
    setCountry(val);
    localStorage.setItem('eduai_country', val);
    if (supabaseStudentId) {
      SupabaseDataService.updateStudent(supabaseStudentId, { country: val });
    }
  };

  const handleSetBoard = (val: string) => {
    setBoard(val);
    localStorage.setItem('eduai_board', val);
    if (supabaseStudentId) {
      SupabaseDataService.updateStudent(supabaseStudentId, { exam_board: val });
    }
  };

  const handleSetGrade = (val: string) => {
    setGrade(val);
    localStorage.setItem('eduai_grade', val);
    if (supabaseStudentId) {
      SupabaseDataService.updateStudent(supabaseStudentId, { current_grade: val });
    }
  };

  const handleSetSubject = (val: string) => {
    const cleanVal = val.trim();
    if (!cleanVal) return;
    setActiveCurriculumSubject(cleanVal);
    localStorage.setItem('eduai_subject', cleanVal);

    setSubjects(prev => {
      const matched = prev.find(s => s.name.toLowerCase() === cleanVal.toLowerCase());
      if (matched) {
        setActiveSubjectId(matched.id);
        return prev;
      }
      const newSubjId = `subj-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
      const newSubj: StudentSubject = {
        id: newSubjId,
        name: cleanVal,
        category: 'Curriculum Subject',
        masteryScore: 65,
        targetGrade: targetGrade || 'A*',
        syllabusProgress: 35,
        studyMinutes: 0,
        examDate: targetExamDate,
        examPaper: 'Standard Exam Paper'
      };
      setActiveSubjectId(newSubjId);
      return [...prev, newSubj];
    });
  };

  // Live Grounded Curriculum Specification State
  const [curriculumSpec, setCurriculumSpec] = useState<any>(null);
  const [isCurriculumLoading, setIsCurriculumLoading] = useState(false);
  const [expandedTopicIdx, setExpandedTopicIdx] = useState<number | null>(null);
  const [showAddSubjectInline, setShowAddSubjectInline] = useState(false);
  const [inlineSubjName, setInlineSubjName] = useState('');
  const [inlineSubjGrade, setInlineSubjGrade] = useState('A*');

  // Sync currentUser props when available
  useEffect(() => {
    if (currentUser?.email) {
      setStudentEmail(currentUser.email);
      localStorage.setItem('eduai_student_email', currentUser.email);
    }
    if (currentUser?.name) {
      setStudentName(currentUser.name);
      setTempName(currentUser.name);
      localStorage.setItem('eduai_student_name', currentUser.name);
    }
  }, [currentUser]);

  // Fetch official curriculum specification for active subject whenever country/board/grade/subject changes
  useEffect(() => {
    const currentSubj = activeCurriculumSubject || 'Mathematics';
    const cacheKey = `eduai_grounded_spec_${country}_${board}_${grade}_${currentSubj}`;
    const cached = localStorage.getItem(cacheKey);
    if (cached) {
      try {
        setCurriculumSpec(JSON.parse(cached));
      } catch (e) {}
    }

    let isMounted = true;
    setIsCurriculumLoading(true);

    fetch('/api/curriculum', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        country,
        curriculum_board: board,
        grade,
        subject: currentSubj
      })
    })
      .then(res => res.json())
      .then(data => {
        if (isMounted && data) {
          setCurriculumSpec(data);
          localStorage.setItem(cacheKey, JSON.stringify(data));
        }
      })
      .catch(err => {
        console.warn('Could not fetch curriculum spec:', err);
      })
      .finally(() => {
        if (isMounted) setIsCurriculumLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [country, board, grade, activeCurriculumSubject]);

  // 2. Real RAG Document Vector Store Telemetry
  const [indexedDocsCount, setIndexedDocsCount] = useState<number>(0);
  const [indexedChunksCount, setIndexedChunksCount] = useState<number>(0);
  const [recentDocs, setRecentDocs] = useState<Array<{ name: string; chunks: number }>>([]);

  const refreshRAGStats = () => {
    fetch('/api/documents')
      .then(res => res.json())
      .then(data => {
        if (data.documents) {
          setIndexedDocsCount(data.documents.length);
          setRecentDocs(data.documents.map((d: any) => ({ name: d.name, chunks: d.chunks || 0 })));
        }
        if (typeof data.totalChunks === 'number') {
          setIndexedChunksCount(data.totalChunks);
        }
      })
      .catch(() => {});
  };

  useEffect(() => {
    refreshRAGStats();
  }, []);

  // Dashboard Quick RAG File Ingestion State
  const dashboardFileInputRef = useRef<HTMLInputElement>(null);
  const [dashUploadedFiles, setDashUploadedFiles] = useState<Array<{
    id: string;
    file: File;
    name: string;
    size: number;
    type: string;
    status: 'reading' | 'ready' | 'error';
    text?: string;
    base64?: string;
  }>>([]);
  const [dashIsIngesting, setDashIsIngesting] = useState(false);
  const [dashIngestSuccess, setDashIngestSuccess] = useState('');
  const [dashIngestError, setDashIngestError] = useState('');

  const handleDashFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const files = Array.from(e.target.files);
    setDashIngestError('');
    setDashIngestSuccess('');

    const newItems = files.map(file => ({
      id: `dash-up-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      file,
      name: file.name,
      size: file.size,
      type: file.type || 'application/octet-stream',
      status: 'reading' as const
    }));

    setDashUploadedFiles(prev => [...prev, ...newItems]);

    newItems.forEach(item => {
      const reader = new FileReader();
      const isText = item.name.match(/\.(txt|md|csv|json|py|ts|js|html)$/i);
      if (isText) {
        reader.onload = () => {
          const text = reader.result as string;
          setDashUploadedFiles(prev => prev.map(f => f.id === item.id ? { ...f, status: 'ready', text } : f));
        };
        reader.readAsText(item.file);
      } else {
        reader.onload = () => {
          const dataUrl = reader.result as string;
          const base64 = dataUrl.split(',')[1] || '';
          setDashUploadedFiles(prev => prev.map(f => f.id === item.id ? { ...f, status: 'ready', base64 } : f));
        };
        reader.readAsDataURL(item.file);
      }
    });
  };

  const handleExecuteDashIngest = async () => {
    if (dashUploadedFiles.length === 0) return;
    if (dashUploadedFiles.some(f => f.status === 'reading')) {
      setDashIngestError('Files are still processing in the browser. Please wait a second.');
      return;
    }

    setDashIsIngesting(true);
    setDashIngestError('');
    setDashIngestSuccess('');

    try {
      const jobId = `job-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
      const res = await fetch('/api/ingest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jobId,
          country,
          curriculum_board: board,
          grade,
          subject: activeCurriculumSubject,
          chunkSize: 800,
          chunkOverlap: 100,
          files: dashUploadedFiles.map(f => ({
            name: f.name,
            type: f.type,
            size: f.size,
            text: f.text,
            base64: f.base64
          }))
        })
      });

      const data = await res.json();
      if (res.ok) {
        setDashIngestSuccess(`Successfully indexed and grounded ${dashUploadedFiles.length} file(s) into ${activeCurriculumSubject}!`);
        setDashUploadedFiles([]);
        refreshRAGStats();
      } else {
        setDashIngestError(data.error || 'Failed to ingest files.');
      }
    } catch (err: any) {
      setDashIngestError(err.message || 'Error uploading files to RAG vector engine.');
    } finally {
      setDashIsIngesting(false);
    }
  };

  // 3. Real Enrolled Subjects State
  const [subjects, setSubjects] = useState<StudentSubject[]>(() => {
    const saved = localStorage.getItem('eduai_real_subjects') || localStorage.getItem('eduai_subjects');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const unique: StudentSubject[] = [];
          const seenIds = new Set<string>();
          const seenNames = new Set<string>();
          for (const s of parsed) {
            if (!s || !s.name) continue;
            const cleanName = s.name.trim();
            const cleanId = (s.id && !seenIds.has(s.id)) ? s.id : `subj-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
            if (!seenNames.has(cleanName.toLowerCase())) {
              seenIds.add(cleanId);
              seenNames.add(cleanName.toLowerCase());
              unique.push({ ...s, id: cleanId, name: cleanName });
            }
          }
          if (unique.length > 0) return unique;
        }
      } catch (e) {}
    }
    // Initial real default subject set based on active selection
    const defaultExamDate = new Date();
    defaultExamDate.setDate(defaultExamDate.getDate() + 30);
    const dateStr = defaultExamDate.toISOString().split('T')[0];

    return [
      {
        id: 'subj-1',
        name: activeCurriculumSubject || 'Mathematics',
        category: 'Core Curriculum',
        masteryScore: 70,
        targetGrade: 'A*',
        syllabusProgress: 60,
        studyMinutes: 45,
        lastStudiedDate: new Date().toLocaleDateString(),
        examDate: dateStr,
        examPaper: 'Paper 1 (Core Theory)'
      }
    ];
  });

  const [activeSubjectId, setActiveSubjectId] = useState<string>(() => {
    return subjects[0]?.id || 'subj-1';
  });

  const activeSubject = useMemo(() => {
    return subjects.find(s => s.id === activeSubjectId) || subjects[0];
  }, [subjects, activeSubjectId]);

  // 4. Real Daily Tasks & Action Queue
  const [tasks, setTasks] = useState<StudentTask[]>(() => {
    const saved = localStorage.getItem('eduai_real_tasks');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      } catch (e) {}
    }
    return [
      {
        id: 'task-init-1',
        title: `Complete AI Tutor review on ${activeCurriculumSubject || 'Mathematics'} key concepts`,
        subject: activeCurriculumSubject || 'Mathematics',
        durationMinutes: 20,
        completed: false,
        type: 'tutor',
        createdAt: new Date().toISOString()
      }
    ];
  });

  // 5. Real Activity Log
  const [activityLogs, setActivityLogs] = useState<RealActivityLog[]>(() => {
    const saved = localStorage.getItem('eduai_real_activity_logs');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      } catch (e) {}
    }
    return [
      {
        id: `act-init`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        action: 'Academic Profile Initialized',
        subject: activeCurriculumSubject || 'Mathematics',
        detail: `Curriculum calibrated to ${board} (${country}). Ready for real study sessions.`,
        badge: 'Setup'
      }
    ];
  });

  // 6. Live Focus Stopwatch / Timer State
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (isTimerRunning) {
      timerRef.current = setInterval(() => {
        setTimerSeconds(prev => prev + 1);
      }, 1000);
    } else if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isTimerRunning]);

  const handleStartTimer = () => setIsTimerRunning(true);
  const handlePauseTimer = () => setIsTimerRunning(false);
  const handleResetTimer = () => {
    setIsTimerRunning(false);
    setTimerSeconds(0);
  };

  const handleSaveTimerSession = () => {
    if (timerSeconds < 10) return;
    const elapsedMinutes = Math.max(1, Math.round(timerSeconds / 60));
    
    // Update active subject's logged minutes
    setSubjects(prev => prev.map(s => {
      if (s.id === activeSubjectId) {
        return {
          ...s,
          studyMinutes: s.studyMinutes + elapsedMinutes,
          lastStudiedDate: new Date().toLocaleDateString()
        };
      }
      return s;
    }));

    // Add real activity log
    const newLog: RealActivityLog = {
      id: `act-${Date.now()}`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      action: 'Focus Session Completed',
      subject: activeSubject?.name || 'General',
      detail: `Logged ${elapsedMinutes} minute${elapsedMinutes > 1 ? 's' : ''} of real focused study.`,
      badge: 'Timer'
    };

    setActivityLogs(prev => [newLog, ...prev.slice(0, 19)]);
    handleResetTimer();

    confetti({
      particleCount: 30,
      spread: 45,
      origin: { y: 0.7 }
    });
  };

  // 7. Modals State
  const [showAddTaskModal, setShowAddTaskModal] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskSubject, setNewTaskSubject] = useState(activeSubject?.name || 'Mathematics');
  const [newTaskMinutes, setNewTaskMinutes] = useState(25);
  const [newTaskType, setNewTaskType] = useState<StudentTask['type']>('tutor');

  const [showAddSubjectModal, setShowAddSubjectModal] = useState(false);
  const [newSubjName, setNewSubjName] = useState('');
  const [newSubjTargetGrade, setNewSubjTargetGrade] = useState('A*');

  const [showLibraryModal, setShowLibraryModal] = useState(false);
  const [showPlannerModal, setShowPlannerModal] = useState(false);

  // 8. Real Live AI Diagnostic Assessment State
  const [showDiagnosticModal, setShowDiagnosticModal] = useState(false);
  const [isDiagnosticLoading, setIsDiagnosticLoading] = useState(false);
  const [diagnosticData, setDiagnosticData] = useState<any>(null);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, number>>({});
  const [diagnosticSubmitted, setDiagnosticSubmitted] = useState(false);

  // 9. Supabase PostgreSQL Cloud Persistence State
  const [supabaseStatus, setSupabaseStatus] = useState<'connected' | 'syncing' | 'offline' | 'saved'>('syncing');
  const [supabaseStudentId, setSupabaseStudentId] = useState<string | null>(() => {
    return localStorage.getItem('eduai_supabase_student_id');
  });
  const [lastSyncTime, setLastSyncTime] = useState<string>('Just now');
  const [isSyncingManually, setIsSyncingManually] = useState(false);

  // Load or Initialize Student in Supabase PostgreSQL on Mount
  useEffect(() => {
    let isMounted = true;

    async function initSupabaseData() {
      try {
        setSupabaseStatus('syncing');
        const { user } = await SupabaseAuthService.getSession();
        const userEmail = user?.email || currentUser?.email || studentEmail || undefined;
        const userName = user?.user_metadata?.name || currentUser?.name || studentName;
        const userCountry = user?.user_metadata?.country || country;
        const userBoard = user?.user_metadata?.exam_board || board;
        const userGrade = user?.user_metadata?.current_grade || grade;
        const userTargetGrade = user?.user_metadata?.target_grade || targetGrade || 'A*';

        const student = await SupabaseDataService.getOrCreateStudent({
          email: userEmail,
          name: userName,
          country: userCountry,
          exam_board: userBoard,
          current_grade: userGrade,
          target_grade: userTargetGrade,
        });

        if (!isMounted) return;

        if (student && student.id) {
          setSupabaseStudentId(student.id);
          localStorage.setItem('eduai_supabase_student_id', student.id);
          setSupabaseStatus('connected');
          setLastSyncTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));

          // Update local React state and localStorage with actual student info from Supabase profile
          if (student.name) {
            setStudentName(student.name);
            setTempName(student.name);
            localStorage.setItem('eduai_student_name', student.name);
          }
          if (student.email) {
            setStudentEmail(student.email);
            localStorage.setItem('eduai_student_email', student.email);
          }
          if (student.country) {
            setCountry(student.country);
            localStorage.setItem('eduai_country', student.country);
          }
          if (student.exam_board) {
            setBoard(student.exam_board);
            localStorage.setItem('eduai_board', student.exam_board);
          }
          if (student.current_grade) {
            setGrade(student.current_grade);
            localStorage.setItem('eduai_grade', student.current_grade);
          }
          if (student.target_grade) {
            setTargetGrade(student.target_grade);
            localStorage.setItem('eduai_target_grade', student.target_grade);
          }

          // Fetch subjects from Supabase
          const cloudSubjects = await SupabaseDataService.fetchSubjects(student.id);
          if (cloudSubjects && cloudSubjects.length > 0) {
            const seenIds = new Set<string>();
            const seenNames = new Set<string>();
            const mappedSubjects: StudentSubject[] = [];
            for (const cs of cloudSubjects) {
              const cleanName = (cs.name || 'Subject').trim();
              const cleanId = (cs.id && !seenIds.has(cs.id)) ? cs.id : `subj-${cs.code || Math.random().toString(36).substring(2, 7)}`;
              if (!seenNames.has(cleanName.toLowerCase())) {
                seenIds.add(cleanId);
                seenNames.add(cleanName.toLowerCase());
                mappedSubjects.push({
                  id: cleanId,
                  name: cleanName,
                  category: 'Core Curriculum',
                  masteryScore: cs.mastery_percentage || 70,
                  targetGrade: 'A*',
                  syllabusProgress: cs.syllabus_coverage_percentage || 60,
                  studyMinutes: 45,
                  lastStudiedDate: new Date().toLocaleDateString(),
                  examDate: targetExamDate,
                  examPaper: 'Paper 1 (Core Theory)'
                });
              }
            }
            if (mappedSubjects.length > 0) setSubjects(mappedSubjects);
          } else {
            // First time: seed Supabase with current local subjects
            await SupabaseDataService.syncSubjects(
              student.id,
              subjects.map(s => ({
                code: s.name.substring(0, 4).toUpperCase(),
                name: s.name,
                exam_board: board,
                level: grade,
                mastery_percentage: s.masteryScore,
                syllabus_coverage_percentage: s.syllabusProgress,
                confidence_rating: 'Developing'
              }))
            );
          }

          // Fetch tasks from Supabase
          const cloudTasks = await SupabaseDataService.fetchTasks(student.id);
          if (cloudTasks && cloudTasks.length > 0) {
            const mappedTasks: StudentTask[] = cloudTasks.map(ct => ({
              id: ct.id || `task-${Date.now()}`,
              title: ct.title,
              subject: ct.subject_code || activeCurriculumSubject || 'Mathematics',
              durationMinutes: ct.estimated_minutes || 25,
              completed: ct.completed || false,
              type: (ct.type as any) || 'tutor',
              createdAt: ct.created_at || new Date().toISOString()
            }));
            setTasks(mappedTasks);
          }

          // Fetch activity logs from Supabase
          const cloudLogs = await SupabaseDataService.fetchActivityLogs(student.id);
          if (cloudLogs && cloudLogs.length > 0) {
            const mappedLogs: RealActivityLog[] = cloudLogs.map(cl => ({
              id: cl.id || `act-${Date.now()}`,
              timestamp: cl.created_at ? new Date(cl.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : new Date().toLocaleTimeString(),
              action: cl.action_type || 'Study Session',
              subject: activeCurriculumSubject || 'General',
              detail: cl.description || cl.title,
              badge: 'Cloud Sync'
            }));
            setActivityLogs(mappedLogs);
          }
        } else {
          setSupabaseStatus('offline');
        }
      } catch (err) {
        console.warn('Supabase initialization notice:', err);
        if (isMounted) setSupabaseStatus('offline');
      }
    }

    initSupabaseData();
    return () => { isMounted = false; };
  }, []);

  // Save candidate profile settings
  const handleSaveSettings = async () => {
    localStorage.setItem('eduai_student_name', studentName);
    if (studentEmail) localStorage.setItem('eduai_student_email', studentEmail);
    localStorage.setItem('eduai_country', country);
    localStorage.setItem('eduai_board', board);
    localStorage.setItem('eduai_grade', grade);
    localStorage.setItem('eduai_target_grade', targetGrade);
    localStorage.setItem('eduai_target_exam_date', targetExamDate);

    if (supabaseStudentId) {
      await SupabaseDataService.updateStudent(supabaseStudentId, {
        name: studentName,
        email: studentEmail || undefined,
        country,
        exam_board: board,
        current_grade: grade,
        target_grade: targetGrade,
      });
    }

    setShowSettingsModal(false);

    confetti({
      particleCount: 35,
      spread: 50,
      origin: { y: 0.6 }
    });

    setActivityLogs(prev => [
      {
        id: `act-${Date.now()}`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        action: 'Candidate Profile Updated',
        subject: board,
        detail: `Updated specification settings: ${board} (${grade}, ${country}). Target: ${targetGrade}`,
        badge: 'Profile Sync'
      },
      ...prev.slice(0, 19)
    ]);
  };

  // Manual Trigger to Sync All Data to Supabase
  const handleManualSync = async () => {
    setIsSyncingManually(true);
    setSupabaseStatus('syncing');

    try {
      let stId = supabaseStudentId;
      if (!stId) {
        const student = await SupabaseDataService.getOrCreateStudent({
          name: studentName,
          country,
          exam_board: board,
          current_grade: grade,
          target_grade: 'A*',
        });
        if (student?.id) {
          stId = student.id;
          setSupabaseStudentId(stId);
          localStorage.setItem('eduai_supabase_student_id', stId);
        }
      }

      if (stId) {
        // 1. Update Student Profile
        await SupabaseDataService.updateStudent(stId, {
          name: studentName,
          country,
          exam_board: board,
          current_grade: grade,
        });

        // 2. Sync Subjects
        await SupabaseDataService.syncSubjects(
          stId,
          subjects.map(s => ({
            code: s.name.substring(0, 4).toUpperCase(),
            name: s.name,
            exam_board: board,
            level: grade,
            mastery_percentage: s.masteryScore,
            syllabus_coverage_percentage: s.syllabusProgress,
            confidence_rating: s.masteryScore >= 80 ? 'Mastered' : s.masteryScore >= 50 ? 'Developing' : 'Needs Practice'
          }))
        );

        // 3. Log Sync Activity
        await SupabaseDataService.logActivity({
          student_id: stId,
          action_type: 'cloud_sync',
          title: 'Manual Cloud Sync Completed',
          description: `All ${subjects.length} subjects, ${tasks.length} tasks, and candidate progress synced to Supabase PostgreSQL.`,
          duration_seconds: 0
        });

        setLastSyncTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
        setSupabaseStatus('connected');
        confetti({ particleCount: 20, spread: 40 });
      }
    } catch (e) {
      console.warn('Manual sync notice:', e);
      setSupabaseStatus('offline');
    } finally {
      setIsSyncingManually(false);
    }
  };

  // Synchronize state with LocalStorage
  useEffect(() => {
    localStorage.setItem('eduai_student_name', studentName);
    localStorage.setItem('eduai_target_exam_date', targetExamDate);
    localStorage.setItem('eduai_real_subjects', JSON.stringify(subjects));
    localStorage.setItem('eduai_real_tasks', JSON.stringify(tasks));
    localStorage.setItem('eduai_real_activity_logs', JSON.stringify(activityLogs));

    // Also background update Supabase if connected
    if (supabaseStudentId) {
      SupabaseDataService.updateStudent(supabaseStudentId, {
        name: studentName,
        country,
        exam_board: board,
        current_grade: grade,
      }).catch(() => {});
    }
  }, [studentName, targetExamDate, subjects, tasks, activityLogs, supabaseStudentId]);

  // Overall Real Metrics
  const totalRealMinutes = useMemo(() => {
    return subjects.reduce((acc, s) => acc + (s.studyMinutes || 0), 0);
  }, [subjects]);

  const realHours = (totalRealMinutes / 60).toFixed(1);

  const averageRealMastery = useMemo(() => {
    if (subjects.length === 0) return 0;
    const sum = subjects.reduce((acc, s) => acc + (s.masteryScore || 0), 0);
    return Math.round(sum / subjects.length);
  }, [subjects]);

  const completedTasksCount = tasks.filter(t => t.completed).length;
  const taskCompletionRate = tasks.length > 0 ? Math.round((completedTasksCount / tasks.length) * 100) : 0;

  // Real Days Until Exam
  const daysUntilTargetExam = useMemo(() => {
    const examTime = new Date(targetExamDate).getTime();
    const now = Date.now();
    const diffDays = Math.ceil((examTime - now) / (1000 * 60 * 60 * 24));
    return Math.max(0, diffDays);
  }, [targetExamDate]);

  // Task Toggle
  const handleToggleTask = (id: string) => {
    setTasks(prev => prev.map(t => {
      if (t.id === id) {
        const nextState = !t.completed;
        if (nextState) {
          confetti({
            particleCount: 25,
            spread: 40,
            origin: { y: 0.6 }
          });
          // Log task completion
          const logItem: RealActivityLog = {
            id: `act-${Date.now()}`,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            action: 'Task Completed',
            subject: t.subject,
            detail: `Completed task: "${t.title}"`,
            badge: 'Task Done'
          };
          setActivityLogs(l => [logItem, ...l.slice(0, 19)]);
          
          if (supabaseStudentId) {
            SupabaseDataService.logActivity({
              student_id: supabaseStudentId,
              action_type: 'task_completed',
              title: 'Task Completed',
              description: `Completed: ${t.title}`
            }).catch(() => {});
          }
        }

        // Persist task update in Supabase
        if (supabaseStudentId && id.includes('-') && !id.startsWith('task-init')) {
          SupabaseDataService.saveTask({
            id,
            student_id: supabaseStudentId,
            title: t.title,
            subject_code: t.subject,
            type: t.type,
            priority: 'Medium',
            estimated_minutes: t.durationMinutes,
            completed: nextState
          }).catch(() => {});
        }

        return { ...t, completed: nextState };
      }
      return t;
    }));
  };

  const handleDeleteTask = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setTasks(prev => prev.filter(t => t.id !== id));
    if (supabaseStudentId) {
      SupabaseDataService.deleteTask(id).catch(() => {});
    }
  };

  // Add Task
  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;

    const newTask: StudentTask = {
      id: `task-${Date.now()}`,
      title: newTaskTitle.trim(),
      subject: newTaskSubject,
      durationMinutes: Number(newTaskMinutes) || 25,
      completed: false,
      type: newTaskType,
      createdAt: new Date().toISOString()
    };

    setTasks(prev => [newTask, ...prev]);
    setNewTaskTitle('');
    setShowAddTaskModal(false);

    // Save to Supabase if connected
    if (supabaseStudentId) {
      SupabaseDataService.saveTask({
        student_id: supabaseStudentId,
        title: newTask.title,
        subject_code: newTask.subject,
        type: newTask.type,
        priority: 'Medium',
        estimated_minutes: newTask.durationMinutes,
        completed: false
      }).then(saved => {
        if (saved && saved.id) {
          setTasks(prev => prev.map(item => item.id === newTask.id ? { ...item, id: saved.id! } : item));
        }
      }).catch(() => {});
    }

    // Log action
    setActivityLogs(prev => [
      {
        id: `act-${Date.now()}`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        action: 'Revision Task Added',
        subject: newTaskSubject,
        detail: `Queued: "${newTask.title}" (${newTask.durationMinutes}m)`,
        badge: 'Task Queue'
      },
      ...prev.slice(0, 19)
    ]);
  };

  // Add Subject
  const handleAddSubject = (e: React.FormEvent) => {
    e.preventDefault();
    const name = newSubjName.trim();
    if (!name) return;

    handleSetSubject(name);
    setNewSubjName('');
    setShowAddSubjectModal(false);

    setActivityLogs(prev => [
      {
        id: `act-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        action: 'Subject Enrolled',
        subject: name,
        detail: `Added ${name} to active revision matrix. Target: ${newSubjTargetGrade}`,
        badge: 'Curriculum'
      },
      ...prev.slice(0, 19)
    ]);
  };

  // Remove Subject
  const handleRemoveSubject = (id: string, name: string) => {
    if (subjects.length <= 1) return;
    setSubjects(prev => prev.filter(s => s.id !== id));
    if (activeSubjectId === id) {
      const remaining = subjects.filter(s => s.id !== id);
      setActiveSubjectId(remaining[0]?.id || '');
    }
  };

  // Run Real AI Diagnostic
  const handleRunDiagnostic = async () => {
    setIsDiagnosticLoading(true);
    setShowDiagnosticModal(true);
    setDiagnosticSubmitted(false);
    setSelectedAnswers({});
    try {
      const response = await fetch('/api/student/diagnose', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subject: activeSubject?.name || 'Mathematics',
          country,
          board,
          grade
        })
      });
      const data = await response.json();
      setDiagnosticData(data);
    } catch (e) {
      console.error('Failed to run diagnostic:', e);
    } finally {
      setIsDiagnosticLoading(false);
    }
  };

  // Submit Diagnostic Answers & Update Real Mastery
  const handleSubmitDiagnostic = () => {
    if (!diagnosticData?.questions) return;
    let correctCount = 0;
    const questions = diagnosticData.questions;
    questions.forEach((q: any) => {
      if (selectedAnswers[q.id] === q.correct_option_index) {
        correctCount++;
      }
    });

    const calculatedScore = Math.round((correctCount / questions.length) * 100);
    setDiagnosticSubmitted(true);

    // Update real subject mastery score based on results
    setSubjects(prev => prev.map(s => {
      if (s.id === activeSubjectId) {
        return {
          ...s,
          masteryScore: calculatedScore,
          lastStudiedDate: new Date().toLocaleDateString()
        };
      }
      return s;
    }));

    // Log diagnostic activity
    setActivityLogs(prev => [
      {
        id: `act-${Date.now()}`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        action: 'AI Diagnostic Completed',
        subject: activeSubject?.name || 'Subject',
        detail: `Diagnostic Score: ${calculatedScore}% (${correctCount}/${questions.length} correct). Real mastery updated.`,
        badge: 'Diagnostic'
      },
      ...prev.slice(0, 19)
    ]);

    confetti({
      particleCount: 40,
      spread: 60,
      origin: { y: 0.6 }
    });
  };

  // Pull tasks from active study plan if saved in localStorage
  const handleImportTasksFromPlan = () => {
    const savedPlanStr = localStorage.getItem('eduai_study_plan') || localStorage.getItem('eduai_saved_study_plan');
    if (!savedPlanStr) {
      setShowPlannerModal(true);
      return;
    }
    try {
      const plan = JSON.parse(savedPlanStr);
      if (Array.isArray(plan) && plan.length > 0) {
        const importedTasks: StudentTask[] = plan.slice(0, 5).map((entry: any, idx: number) => ({
          id: `plan-task-${Date.now()}-${idx}`,
          title: `${entry.topic || 'Review Topic'}: ${entry.recommended_activities?.[0] || 'Focus practice'}`,
          subject: activeSubject?.name || 'Mathematics',
          durationMinutes: entry.allocated_minutes || 45,
          completed: false,
          type: 'revision',
          createdAt: new Date().toISOString()
        }));

        setTasks(prev => [...importedTasks, ...prev]);
        confetti({ particleCount: 30, spread: 50 });
      } else {
        setShowPlannerModal(true);
      }
    } catch (e) {
      setShowPlannerModal(true);
    }
  };

  // Format stopwatch seconds into mm:ss
  const formatTimer = (totalSecs: number) => {
    const mins = Math.floor(totalSecs / 60);
    const secs = totalSecs % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 animate-in fade-in duration-300">
      
      {/* 1. Real Student Profile & Exam Command Banner */}
      <div className="hero-banner-industrial rounded-sm p-6 sm:p-7 border border-[#1F1F23] relative overflow-hidden">
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="badge-industrial flex items-center gap-1.5 bg-[#D4AF37]/10 text-[#D4AF37] border-[#D4AF37]/30">
                <GraduationCap className="w-3 h-3" />
                <span>Candidate Profile</span>
              </span>
              <span className="text-white/80 font-mono-tech text-[11px] bg-white/5 px-2 py-0.5 rounded-xs border border-white/10">
                {board} • {grade}
              </span>
              <span className="text-emerald-400 font-mono-tech text-[11px] bg-emerald-500/10 px-2 py-0.5 rounded-xs border border-emerald-500/30">
                Target: {targetGrade}
              </span>
              <span className="text-white/60 font-mono-tech text-[11px] bg-white/5 px-2 py-0.5 rounded-xs border border-white/10 flex items-center gap-1">
                <Globe className="w-3 h-3 text-[#D4AF37]" />
                {country}
              </span>
              <span className="text-[#C15B3A] font-mono-tech text-[11px] font-semibold bg-[#C15B3A]/10 px-2 py-0.5 rounded-xs border border-[#C15B3A]/30 flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                {daysUntilTargetExam} Days to Exam ({targetExamDate})
              </span>

              {/* Supabase Cloud Status Indicator */}
              <div className="flex items-center gap-1.5 bg-[#3ECF8E]/10 text-[#3ECF8E] border border-[#3ECF8E]/30 px-2 py-0.5 rounded-xs font-mono-tech text-[11px]">
                <Server className="w-3 h-3" />
                <span>Supabase: {supabaseStatus === 'connected' ? (isLoggedIn ? 'Account Synced' : 'Cloud Active') : supabaseStatus === 'syncing' ? 'Syncing...' : 'Ready'}</span>
                <button
                  onClick={handleManualSync}
                  disabled={isSyncingManually}
                  title="Sync all profile and study progress to Supabase Cloud"
                  className="ml-1 hover:text-white transition-colors cursor-pointer disabled:opacity-50"
                >
                  <RefreshCw className={`w-2.5 h-2.5 ${isSyncingManually ? 'animate-spin' : ''}`} />
                </button>
              </div>

              {!isLoggedIn && onOpenAuth && (
                <button
                  onClick={onOpenAuth}
                  className="flex items-center gap-1 bg-[#D4AF37]/15 hover:bg-[#D4AF37]/25 text-[#D4AF37] border border-[#D4AF37]/40 px-2 py-0.5 rounded-xs font-mono-tech text-[11px] font-semibold transition-colors cursor-pointer"
                >
                  <Cloud className="w-3 h-3" />
                  <span>Save Progress to Free Account</span>
                </button>
              )}
            </div>

            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                {isEditingName ? (
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={tempName}
                      onChange={(e) => setTempName(e.target.value)}
                      className="bg-[#121214] border border-[#D4AF37] text-white px-3 py-1 font-syne text-xl sm:text-2xl font-bold rounded-sm focus:outline-none"
                      autoFocus
                    />
                    <button
                      onClick={() => {
                        const newName = tempName.trim() || 'Student';
                        setStudentName(newName);
                        localStorage.setItem('eduai_student_name', newName);
                        if (supabaseStudentId) {
                          SupabaseDataService.updateStudent(supabaseStudentId, { name: newName });
                        }
                        setIsEditingName(false);
                      }}
                      className="p-2 bg-[#D4AF37] text-black rounded-sm hover:bg-[#E5C158] cursor-pointer"
                    >
                      <Save className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => {
                        setTempName(studentName);
                        setIsEditingName(false);
                      }}
                      className="p-2 bg-white/10 text-white rounded-sm hover:bg-white/20 cursor-pointer"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2.5">
                    <h1 className="font-syne text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                      {studentName}'s Command Center
                    </h1>
                    <button
                      onClick={() => {
                        setTempName(studentName);
                        setIsEditingName(true);
                      }}
                      title="Edit Quick Display Name"
                      className="text-white/40 hover:text-[#D4AF37] transition-colors cursor-pointer"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>

              <button
                onClick={() => setShowSettingsModal(true)}
                className="px-3 py-1.5 bg-[#D4AF37]/15 hover:bg-[#D4AF37]/25 text-[#D4AF37] border border-[#D4AF37]/40 font-mono-tech text-xs font-semibold rounded-xs transition-colors cursor-pointer flex items-center gap-1.5 shadow-sm"
              >
                <Sliders className="w-3.5 h-3.5" />
                <span>Configure Candidate Profile</span>
              </button>
            </div>

            <p className="text-white/70 font-sans text-xs max-w-2xl leading-relaxed">
              Live syllabus tracking, authentic RAG library document status, and AI-grounded diagnostic evaluations calibrated to your official national curriculum.
            </p>
          </div>
        </div>
      </div>



      {/* 3. Global Curriculum, Exam Board & Subjects Edit Bar */}
      <div id="curriculum-edit-bar" className="bg-[#121214] border border-[#1F1F23] rounded-sm p-5 space-y-5 shadow-sm">
        
        {/* Header & Status */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-3">
          <div className="flex items-center gap-2">
            <Globe className="w-4 h-4 text-[#D4AF37]" />
            <div>
              <h2 className="text-sm font-bold text-white font-mono-tech uppercase tracking-wider flex items-center gap-2">
                <span>Curriculum & Subject Alignment Bar</span>
              </h2>
              <p className="text-[11px] text-white/50 font-sans">
                Configure your national examination standard, grading tier, and enrolled revision subjects.
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1.5 text-[10px] font-mono-tech px-2.5 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 rounded-xs font-semibold">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span>Grounded: {board} • {grade}</span>
            </span>
          </div>
        </div>

        {/* Global Standard Selector Controls: Country, Exam Board, Grade Level */}
        <div className="space-y-3">
          <div className="text-[11px] font-mono-tech uppercase tracking-wider text-white/60 font-semibold flex items-center gap-1.5">
            <Compass className="w-3.5 h-3.5 text-[#D4AF37]" />
            <span>1. Exam Board & Country Standards</span>
          </div>
          
          <GlobalCurriculumPicker
            country={country}
            setCountry={handleSetCountry}
            board={board}
            setBoard={handleSetBoard}
            grade={grade}
            setGrade={handleSetGrade}
            subject={activeCurriculumSubject}
            setSubject={handleSetSubject}
          />
        </div>

        {/* Enrolled Subjects Management & Switcher */}
        <div className="pt-3 border-t border-white/10 space-y-3">
          <div className="flex items-center justify-between">
            <div className="text-[11px] font-mono-tech uppercase tracking-wider text-white/60 font-semibold flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-[#D4AF37]" />
              <span>2. Enrolled Subjects & Modules ({subjects.length})</span>
            </div>
            <button
              type="button"
              onClick={() => setShowAddSubjectInline(!showAddSubjectInline)}
              className="px-2.5 py-1 bg-[#D4AF37]/15 hover:bg-[#D4AF37]/25 text-[#D4AF37] border border-[#D4AF37]/40 rounded-xs font-mono-tech text-[11px] font-bold transition-colors cursor-pointer flex items-center gap-1"
            >
              <Plus className="w-3 h-3" />
              <span>{showAddSubjectInline ? 'Close Drawer' : 'Add / Enroll Subject'}</span>
            </button>
          </div>

          {/* Enrolled Subject Selector Chips */}
          <div className="flex flex-wrap items-center gap-2">
            {subjects.map((s, idx) => {
              const isCurrent = (activeSubject?.id === s.id) || (activeCurriculumSubject.toLowerCase() === s.name.toLowerCase());
              return (
                <div
                  key={`${s.id || 'subj'}-${s.name}-${idx}`}
                  className={`group inline-flex items-center gap-2 px-3 py-1.5 rounded-xs border text-xs font-mono-tech transition-all cursor-pointer ${
                    isCurrent
                      ? 'bg-[#D4AF37]/20 text-[#D4AF37] border-[#D4AF37]/60 font-bold shadow-xs'
                      : 'bg-[#0A0A0B] hover:bg-white/5 text-white/70 border-white/10 hover:border-white/20'
                  }`}
                  onClick={() => {
                    setActiveSubjectId(s.id);
                    handleSetSubject(s.name);
                  }}
                >
                  <BookOpen className="w-3 h-3 text-[#D4AF37]" />
                  <span>{s.name}</span>
                  <span className="text-[9px] px-1.5 py-0.2 rounded-xs bg-white/10 text-white/90">
                    {s.targetGrade}
                  </span>
                  {subjects.length > 1 && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRemoveSubject(s.id, s.name);
                      }}
                      className="opacity-0 group-hover:opacity-100 hover:text-rose-400 text-white/30 transition-opacity ml-1 cursor-pointer"
                      title="Remove subject"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </div>
              );
            })}
          </div>

          {/* Inline Add Subject Drawer */}
          {showAddSubjectInline && (
            <div className="p-4 bg-[#0A0A0B] border border-white/15 rounded-xs space-y-3.5 animate-in fade-in duration-150">
              <div className="text-[10px] font-mono-tech text-white/60 font-bold uppercase tracking-wider">
                Quick Enroll Popular Subjects:
              </div>
              <div className="flex flex-wrap gap-1.5">
                {[
                  'Mathematics',
                  'Physics',
                  'Chemistry',
                  'Biology',
                  'Computer Science',
                  'Economics',
                  'Business Studies',
                  'Psychology',
                  'English Literature',
                  'History'
                ].map((name) => {
                  const alreadyEnrolled = subjects.some(s => s.name.toLowerCase() === name.toLowerCase());
                  return (
                    <button
                      key={name}
                      type="button"
                      disabled={alreadyEnrolled}
                      onClick={() => {
                        if (!alreadyEnrolled) {
                          handleSetSubject(name);
                          setShowAddSubjectInline(false);
                        }
                      }}
                      className={`px-2.5 py-1 text-xs font-mono-tech rounded-xs border transition-colors cursor-pointer ${
                        alreadyEnrolled
                          ? 'bg-white/5 text-white/30 border-white/5 cursor-not-allowed'
                          : 'bg-white/5 hover:bg-[#D4AF37]/20 text-white hover:text-[#D4AF37] border-white/10 hover:border-[#D4AF37]/40'
                      }`}
                    >
                      + {name}
                    </button>
                  );
                })}
              </div>

              <div className="pt-2 border-t border-white/10 flex flex-col sm:flex-row items-center gap-2">
                <input
                  type="text"
                  placeholder="Custom Subject Name (e.g. Further Pure Mathematics)..."
                  value={inlineSubjName}
                  onChange={(e) => setInlineSubjName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && inlineSubjName.trim()) {
                      handleSetSubject(inlineSubjName.trim());
                      setInlineSubjName('');
                      setShowAddSubjectInline(false);
                    }
                  }}
                  className="w-full sm:flex-1 bg-[#121214] border border-white/15 focus:border-[#D4AF37] text-xs text-white px-3 py-2 rounded-xs outline-none font-sans"
                />
                <select
                  value={inlineSubjGrade}
                  onChange={(e) => setInlineSubjGrade(e.target.value)}
                  className="w-full sm:w-auto bg-[#121214] border border-white/15 text-xs text-xs text-white px-3 py-2 rounded-xs outline-none font-mono-tech"
                >
                  <option value="A*">Target: A*</option>
                  <option value="A">Target: A</option>
                  <option value="B">Target: B</option>
                  <option value="9">Target: Grade 9</option>
                  <option value="8">Target: Grade 8</option>
                  <option value="7">Target: Grade 7</option>
                </select>
                <button
                  type="button"
                  disabled={!inlineSubjName.trim()}
                  onClick={() => {
                    if (inlineSubjName.trim()) {
                      handleSetSubject(inlineSubjName.trim());
                      setInlineSubjName('');
                      setShowAddSubjectInline(false);
                    }
                  }}
                  className="w-full sm:w-auto px-4 py-2 bg-[#D4AF37] hover:bg-[#D4AF37]/90 text-black font-syne text-xs font-bold uppercase rounded-xs disabled:opacity-40 cursor-pointer"
                >
                  Enroll
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Active Grounded Specification Details & Direct Launches */}
        <div className="pt-3 border-t border-white/10 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono-tech uppercase tracking-wider text-white/60 font-semibold flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
              <span>Active Specification: {activeCurriculumSubject} ({board} • {grade})</span>
            </span>
          </div>

          {isCurriculumLoading && !curriculumSpec ? (
            <div className="p-3 bg-[#0A0A0B] rounded-xs border border-white/10 text-center space-y-1.5">
              <div className="w-4 h-4 border-2 border-[#D4AF37] border-t-transparent rounded-full animate-spin mx-auto" />
              <div className="text-[10px] font-mono-tech text-white/60">
                Calibrating official {board} syllabus specification for {activeCurriculumSubject}...
              </div>
            </div>
          ) : curriculumSpec ? (
            <div className="bg-[#0A0A0B] rounded-sm border border-white/10 p-3.5 space-y-3">
              <p className="text-xs text-white/70 leading-relaxed font-sans">
                {curriculumSpec.summary || `Official ${board} specification for ${grade} ${activeCurriculumSubject}, structured for rigorous conceptual mastery and exam readiness.`}
              </p>

              {/* Direct Launch Actions */}
              <div className="flex flex-wrap items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => {
                    localStorage.setItem('eduai_subject', activeCurriculumSubject);
                    onNavigate('tutor');
                  }}
                  className="py-1.5 px-3 bg-[#D4AF37]/15 hover:bg-[#D4AF37]/25 text-[#D4AF37] border border-[#D4AF37]/40 rounded-xs font-mono-tech text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Launch Socratic AI Tutor on {activeCurriculumSubject}</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    localStorage.setItem('eduai_subject', activeCurriculumSubject);
                    onNavigate('flashcards');
                  }}
                  className="py-1.5 px-3 bg-white/5 hover:bg-white/10 text-white border border-white/15 rounded-xs font-mono-tech text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  <Layers className="w-3.5 h-3.5 text-[#D4AF37]" />
                  <span>Study {activeCurriculumSubject} Flashcards</span>
                </button>
              </div>
            </div>
          ) : null}
        </div>

      </div>

      {/* 3.5 Grounded RAG Knowledge Base & Study Material Ingestion Section */}
      <div id="rag-upload-section" className="bg-[#121214] border border-[#1F1F23] hover:border-emerald-500/30 rounded-sm p-5 space-y-5 shadow-sm transition-all">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white font-mono-tech uppercase tracking-wider flex items-center gap-2">
                <span>RAG Grounded Knowledge Base & Material Ingestion</span>
              </h2>
              <p className="text-[11px] text-white/50 font-sans">
                Upload past papers, mark schemes, and notes (PDF, TXT, MD) to ground your AI Tutor and Flashcards with exact syllabus material.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span className="flex items-center gap-1.5 text-[10px] font-mono-tech px-2.5 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 rounded-xs font-semibold">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span>{indexedDocsCount} Docs • {indexedChunksCount} Vector Chunks Grounded</span>
            </span>
            <button
              type="button"
              onClick={() => setShowLibraryModal(true)}
              className="px-3 py-1 bg-white/5 hover:bg-white/10 text-white/80 border border-white/15 rounded-xs font-mono-tech text-xs font-semibold transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <FolderOpen className="w-3.5 h-3.5 text-blue-400" />
              <span>Open Material Library</span>
            </button>
          </div>
        </div>

        {/* Upload Dropzone & Actions */}
        <div className="space-y-3">
          <input
            ref={dashboardFileInputRef}
            type="file"
            multiple
            accept=".pdf,.txt,.md,.docx,.json,.csv"
            onChange={handleDashFileSelect}
            className="hidden"
          />
          <div
            onClick={() => dashboardFileInputRef.current?.click()}
            className="border-2 border-dashed border-white/15 hover:border-emerald-400/50 bg-[#0A0A0B] hover:bg-white/5 rounded-sm p-6 text-center cursor-pointer transition-all group"
          >
            <UploadCloud className="w-8 h-8 text-emerald-400/80 group-hover:text-emerald-400 mx-auto mb-2 group-hover:scale-110 transition-transform" />
            <p className="text-xs font-bold text-white font-sans">
              Click to browse or drop syllabus PDFs, past papers, or notes
            </p>
            <p className="text-[10px] text-white/40 font-mono-tech mt-1">
              Supports PDF, TXT, MD, DOCX up to 25MB • Grounding into {activeCurriculumSubject} ({board})
            </p>
          </div>

          {/* Selected File Previews & Ingest Action */}
          {dashUploadedFiles.length > 0 && (
            <div className="space-y-2 p-3 bg-[#0A0A0B] border border-white/10 rounded-xs">
              <div className="text-[11px] font-mono-tech text-white/70 font-semibold flex items-center justify-between">
                <span>Selected Files for Indexing ({dashUploadedFiles.length}):</span>
                <button
                  type="button"
                  onClick={() => setDashUploadedFiles([])}
                  className="text-[10px] text-rose-400 hover:underline cursor-pointer"
                >
                  Clear All
                </button>
              </div>
              <div className="space-y-1.5 max-h-36 overflow-y-auto">
                {dashUploadedFiles.map(f => (
                  <div key={f.id} className="flex items-center justify-between p-2 bg-white/5 rounded-xs text-xs">
                    <div className="flex items-center gap-2 truncate">
                      <FileText className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      <span className="text-white truncate font-mono-tech">{f.name}</span>
                      <span className="text-[10px] text-white/40">({(f.size / 1024).toFixed(1)} KB)</span>
                    </div>
                    <span className={`text-[10px] font-mono-tech px-1.5 py-0.5 rounded-xs ${
                      f.status === 'ready' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-amber-500/10 text-amber-400'
                    }`}>
                      {f.status}
                    </span>
                  </div>
                ))}
              </div>

              <div className="pt-2 flex items-center justify-end">
                <button
                  type="button"
                  disabled={dashIsIngesting}
                  onClick={handleExecuteDashIngest}
                  className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-black font-mono-tech text-xs font-bold rounded-xs transition-all cursor-pointer flex items-center gap-1.5 shadow-md disabled:opacity-50"
                >
                  {dashIsIngesting ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-black border-t-transparent rounded-full animate-spin" />
                      <span>Indexing Vector Chunks...</span>
                    </>
                  ) : (
                    <>
                      <Database className="w-3.5 h-3.5" />
                      <span>Ingest & Ground Material Now</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {dashIngestSuccess && (
            <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xs text-xs text-emerald-300 font-mono-tech flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{dashIngestSuccess}</span>
            </div>
          )}

          {dashIngestError && (
            <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xs text-xs text-rose-300 font-mono-tech flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{dashIngestError}</span>
            </div>
          )}
        </div>
      </div>

      {/* 4. MODALS */}

      {/* Modal 1: Live AI Diagnostic Assessment Modal */}
      {showDiagnosticModal && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-[#121214] border border-white/20 rounded-sm max-w-2xl w-full p-6 space-y-5 my-8 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2">
                <Brain className="w-5 h-5 text-[#D4AF37]" />
                <div>
                  <h3 className="font-syne text-base font-bold text-white">
                    Live AI Diagnostic: {activeSubject?.name}
                  </h3>
                  <div className="text-[10px] font-mono-tech text-white/50">
                    {board} ({country}) • {grade}
                  </div>
                </div>
              </div>
              <button
                onClick={() => setShowDiagnosticModal(false)}
                className="text-white/40 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {isDiagnosticLoading ? (
              <div className="py-12 text-center space-y-3">
                <div className="w-8 h-8 border-2 border-[#D4AF37] border-t-transparent rounded-full animate-spin mx-auto" />
                <div className="text-xs font-mono-tech text-white/70">
                  Generating syllabus-aligned diagnostic questions...
                </div>
              </div>
            ) : diagnosticData ? (
              <div className="space-y-5">
                {/* Diagnostic summary */}
                <div className="bg-[#0A0A0B] p-3.5 rounded-sm border border-white/10 space-y-1.5">
                  <div className="text-[10px] font-mono-tech uppercase text-[#D4AF37] font-bold">
                    Syllabus Assessment Framework
                  </div>
                  <p className="text-xs text-white/80 leading-relaxed">
                    {diagnosticData.diagnostic_summary}
                  </p>
                </div>

                {/* Questions */}
                <div className="space-y-4">
                  {diagnosticData.questions?.map((q: any, qIdx: number) => {
                    const isSelected = selectedAnswers[q.id] !== undefined;
                    const isCorrect = selectedAnswers[q.id] === q.correct_option_index;

                    return (
                      <div key={q.id || qIdx} className="bg-[#0A0A0B] p-4 rounded-sm border border-white/10 space-y-3">
                        <div className="flex items-start justify-between gap-2">
                          <span className="text-xs font-bold text-white">
                            Question {qIdx + 1}: {q.question}
                          </span>
                          <span className="text-[9px] font-mono-tech tech-tag shrink-0">
                            {q.topic}
                          </span>
                        </div>

                        {/* Options */}
                        <div className="space-y-2">
                          {q.options?.map((opt: string, optIdx: number) => {
                            const isThisOptionSelected = selectedAnswers[q.id] === optIdx;
                            let optionClass = 'bg-[#121214] border-white/10 hover:border-white/30 text-white/80';

                            if (diagnosticSubmitted) {
                              if (optIdx === q.correct_option_index) {
                                optionClass = 'bg-emerald-950/40 border-emerald-500 text-emerald-200 font-semibold';
                              } else if (isThisOptionSelected && !isCorrect) {
                                optionClass = 'bg-rose-950/40 border-rose-500 text-rose-200';
                              }
                            } else if (isThisOptionSelected) {
                              optionClass = 'bg-[#D4AF37]/20 border-[#D4AF37] text-white font-bold';
                            }

                            return (
                              <button
                                key={optIdx}
                                type="button"
                                disabled={diagnosticSubmitted}
                                onClick={() => setSelectedAnswers(prev => ({ ...prev, [q.id]: optIdx }))}
                                className={`w-full p-2.5 text-left text-xs rounded-xs border transition-all cursor-pointer flex items-center gap-2.5 ${optionClass}`}
                              >
                                <span className="w-5 h-5 rounded-full border border-white/20 flex items-center justify-center text-[10px] font-mono-tech shrink-0">
                                  {String.fromCharCode(65 + optIdx)}
                                </span>
                                <span className="flex-1">{opt}</span>
                              </button>
                            );
                          })}
                        </div>

                        {/* Feedback if submitted */}
                        {diagnosticSubmitted && (
                          <div className={`p-2.5 rounded-xs text-xs space-y-1 ${isCorrect ? 'bg-emerald-900/20 border border-emerald-500/30 text-emerald-300' : 'bg-amber-900/20 border border-amber-500/30 text-amber-300'}`}>
                            <div className="font-bold flex items-center gap-1">
                              {isCorrect ? <Check className="w-3.5 h-3.5" /> : <AlertTriangle className="w-3.5 h-3.5" />}
                              <span>{isCorrect ? 'Correct!' : 'Key Takeaway & Working:'}</span>
                            </div>
                            <p className="text-[11px] leading-relaxed opacity-90">
                              {q.explanation}
                            </p>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Footer Controls */}
                <div className="flex items-center justify-between border-t border-white/10 pt-4">
                  <button
                    onClick={() => setShowDiagnosticModal(false)}
                    className="px-4 py-2 bg-white/5 hover:bg-white/10 text-white font-mono-tech text-xs rounded-xs cursor-pointer"
                  >
                    {diagnosticSubmitted ? 'Close' : 'Cancel'}
                  </button>

                  {!diagnosticSubmitted ? (
                    <button
                      onClick={handleSubmitDiagnostic}
                      disabled={Object.keys(selectedAnswers).length === 0}
                      className="px-5 py-2 bg-[#D4AF37] hover:bg-[#E5C158] disabled:opacity-50 text-black font-syne font-bold text-xs uppercase tracking-wider rounded-xs cursor-pointer shadow-xs"
                    >
                      Calculate Real Mastery
                    </button>
                  ) : (
                    <button
                      onClick={() => setShowDiagnosticModal(false)}
                      className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-syne font-bold text-xs uppercase tracking-wider rounded-xs cursor-pointer"
                    >
                      Apply Results to Dashboard
                    </button>
                  )}
                </div>
              </div>
            ) : null}
          </div>
        </div>
      )}

      {/* Modal 2: Add Real Revision Task */}
      {showAddTaskModal && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <div className="bg-[#121214] border border-white/20 rounded-sm max-w-md w-full p-6 space-y-4 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2">
                <Target className="w-4 h-4 text-[#D4AF37]" />
                <h3 className="font-syne text-base font-bold text-white">Add Revision Target</h3>
              </div>
              <button
                onClick={() => setShowAddTaskModal(false)}
                className="text-white/40 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddTask} className="space-y-4">
              <div>
                <label className="block font-mono-tech text-[10px] uppercase text-white/60 mb-1">
                  Task Description / Topic
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Master Lens Law and solve 3 past paper questions"
                  value={newTaskTitle}
                  onChange={(e) => setNewTaskTitle(e.target.value)}
                  className="w-full bg-[#0A0A0B] border border-white/15 text-white px-3 py-2 text-xs font-sans rounded-xs focus:outline-none focus:border-[#D4AF37]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-mono-tech text-[10px] uppercase text-white/60 mb-1">
                    Subject
                  </label>
                  <select
                    value={newTaskSubject}
                    onChange={(e) => setNewTaskSubject(e.target.value)}
                    className="w-full bg-[#0A0A0B] border border-white/15 text-white px-3 py-2 text-xs font-sans rounded-xs focus:outline-none focus:border-[#D4AF37]"
                  >
                    {subjects.map((s, idx) => (
                      <option key={`opt-${s.id || 'subj'}-${s.name}-${idx}`} value={s.name}>{s.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-mono-tech text-[10px] uppercase text-white/60 mb-1">
                    Estimated Time
                  </label>
                  <select
                    value={newTaskMinutes}
                    onChange={(e) => setNewTaskMinutes(Number(e.target.value))}
                    className="w-full bg-[#0A0A0B] border border-white/15 text-white px-3 py-2 text-xs font-sans rounded-xs focus:outline-none focus:border-[#D4AF37]"
                  >
                    <option value={15}>15 Minutes</option>
                    <option value={25}>25 Minutes (Pomodoro)</option>
                    <option value={45}>45 Minutes</option>
                    <option value={60}>60 Minutes</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-mono-tech text-[10px] uppercase text-white/60 mb-1">
                  Activity Type
                </label>
                <select
                  value={newTaskType}
                  onChange={(e) => setNewTaskType(e.target.value as any)}
                  className="w-full bg-[#0A0A0B] border border-white/15 text-white px-3 py-2 text-xs font-sans rounded-xs focus:outline-none focus:border-[#D4AF37]"
                >
                  <option value="tutor">AI Tutor Problem Solving</option>
                  <option value="flashcard">Flashcard Drill</option>
                  <option value="past_paper">Timed Past Paper</option>
                  <option value="derivation">Mathematical Derivation</option>
                  <option value="revision">Concept Revision</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setShowAddTaskModal(false)}
                  className="px-4 py-2 bg-white/5 hover:bg-white/10 text-white font-mono-tech text-xs rounded-xs cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#D4AF37] hover:bg-[#E5C158] text-black font-syne font-bold text-xs uppercase rounded-xs cursor-pointer shadow-xs"
                >
                  Add to Queue
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 3: Enroll New Curriculum Subject */}
      {showAddSubjectModal && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <div className="bg-[#121214] border border-white/20 rounded-sm max-w-md w-full p-6 space-y-4 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-[#D4AF37]" />
                <h3 className="font-syne text-base font-bold text-white">Enroll Curriculum Subject</h3>
              </div>
              <button
                onClick={() => setShowAddSubjectModal(false)}
                className="text-white/40 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddSubject} className="space-y-4">
              <div>
                <label className="block font-mono-tech text-[10px] uppercase text-white/60 mb-1">
                  Subject Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Physics, Chemistry, Biology, Economics..."
                  value={newSubjName}
                  onChange={(e) => setNewSubjName(e.target.value)}
                  className="w-full bg-[#0A0A0B] border border-white/15 text-white px-3 py-2 text-xs font-sans rounded-xs focus:outline-none focus:border-[#D4AF37]"
                />
              </div>

              <div>
                <label className="block font-mono-tech text-[10px] uppercase text-white/60 mb-1">
                  Target Grade
                </label>
                <select
                  value={newSubjTargetGrade}
                  onChange={(e) => setNewSubjTargetGrade(e.target.value)}
                  className="w-full bg-[#0A0A0B] border border-white/15 text-white px-3 py-2 text-xs font-sans rounded-xs focus:outline-none focus:border-[#D4AF37]"
                >
                  <option value="A*">Grade A* (Top 5%)</option>
                  <option value="A">Grade A (High Distinction)</option>
                  <option value="B">Grade B (Merit)</option>
                  <option value="C">Grade C (Pass)</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setShowAddSubjectModal(false)}
                  className="px-4 py-2 bg-white/5 hover:bg-white/10 text-white font-mono-tech text-xs rounded-xs cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#D4AF37] hover:bg-[#E5C158] text-black font-syne font-bold text-xs uppercase rounded-xs cursor-pointer shadow-xs"
                >
                  Enroll Subject
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 4: Candidate Profile & Curriculum Settings Modal */}
      {showSettingsModal && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-[#121214] border border-[#D4AF37]/30 rounded-sm max-w-xl w-full p-6 space-y-5 my-8 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded bg-[#D4AF37]/15 border border-[#D4AF37]/40 flex items-center justify-center text-[#D4AF37]">
                  <Settings className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white font-sans">Configure Candidate Profile & Exam Board</h3>
                  <p className="text-[11px] text-white/50 font-mono-tech">Personalize your actual student identity, exam specs, and target outcome</p>
                </div>
              </div>
              <button
                onClick={() => setShowSettingsModal(false)}
                className="text-white/40 hover:text-white p-1 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              {/* Candidate Full Name */}
              <div className="space-y-1">
                <label className="text-[11px] text-white/70 font-mono-tech uppercase">Full Candidate Name</label>
                <input
                  type="text"
                  value={studentName}
                  onChange={(e) => setStudentName(e.target.value)}
                  placeholder="e.g. Alex Taylor"
                  className="w-full bg-[#18181C] border border-[#27272A] rounded-sm px-3 py-2 text-xs text-white focus:outline-none focus:border-[#D4AF37]"
                />
              </div>

              {/* Candidate Email */}
              <div className="space-y-1">
                <label className="text-[11px] text-white/70 font-mono-tech uppercase">Candidate Email Address</label>
                <input
                  type="email"
                  value={studentEmail}
                  onChange={(e) => setStudentEmail(e.target.value)}
                  placeholder="student@example.com"
                  className="w-full bg-[#18181C] border border-[#27272A] rounded-sm px-3 py-2 text-xs text-white focus:outline-none focus:border-[#D4AF37]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Country / Jurisdiction */}
                <div className="space-y-1">
                  <label className="text-[11px] text-white/70 font-mono-tech uppercase">Country / Jurisdiction</label>
                  <select
                    value={country}
                    onChange={(e) => setCountry(e.target.value)}
                    className="w-full bg-[#18181C] border border-[#27272A] rounded-sm px-3 py-2 text-xs text-white focus:outline-none focus:border-[#D4AF37]"
                  >
                    <option value="United Kingdom">United Kingdom</option>
                    <option value="United States">United States</option>
                    <option value="Singapore">Singapore</option>
                    <option value="United Arab Emirates">United Arab Emirates</option>
                    <option value="India">India</option>
                    <option value="International / Global">International / Global</option>
                  </select>
                </div>

                {/* Exam Board */}
                <div className="space-y-1">
                  <label className="text-[11px] text-white/70 font-mono-tech uppercase">Official Exam Board</label>
                  <select
                    value={board}
                    onChange={(e) => setBoard(e.target.value)}
                    className="w-full bg-[#18181C] border border-[#27272A] rounded-sm px-3 py-2 text-xs text-white focus:outline-none focus:border-[#D4AF37]"
                  >
                    <option value="Cambridge (CAIE)">Cambridge (CAIE)</option>
                    <option value="Edexcel / Pearson">Edexcel / Pearson</option>
                    <option value="AQA">AQA</option>
                    <option value="OCR">OCR</option>
                    <option value="IB (International Baccalaureate)">IB (International Baccalaureate)</option>
                    <option value="AP / CollegeBoard">AP / CollegeBoard</option>
                  </select>
                </div>

                {/* Grade / Level */}
                <div className="space-y-1">
                  <label className="text-[11px] text-white/70 font-mono-tech uppercase">Grade Level / Year</label>
                  <select
                    value={grade}
                    onChange={(e) => setGrade(e.target.value)}
                    className="w-full bg-[#18181C] border border-[#27272A] rounded-sm px-3 py-2 text-xs text-white focus:outline-none focus:border-[#D4AF37]"
                  >
                    <option value="A-Level Year 12">A-Level Year 12</option>
                    <option value="A-Level Year 13">A-Level Year 13</option>
                    <option value="IGCSE / GCSE Year 10">IGCSE / GCSE Year 10</option>
                    <option value="IGCSE / GCSE Year 11">IGCSE / GCSE Year 11</option>
                    <option value="IB Diploma Year 1">IB Diploma Year 1</option>
                    <option value="IB Diploma Year 2">IB Diploma Year 2</option>
                    <option value="AP High School Senior">AP High School Senior</option>
                  </select>
                </div>

                {/* Target Outcome */}
                <div className="space-y-1">
                  <label className="text-[11px] text-white/70 font-mono-tech uppercase">Target Outcome</label>
                  <select
                    value={targetGrade}
                    onChange={(e) => setTargetGrade(e.target.value)}
                    className="w-full bg-[#18181C] border border-[#27272A] rounded-sm px-3 py-2 text-xs text-white focus:outline-none focus:border-[#D4AF37]"
                  >
                    <option value="A*">Grade A* (Top 5%)</option>
                    <option value="A">Grade A (Excellence)</option>
                    <option value="B">Grade B (Good)</option>
                    <option value="7 (IB High)">IB Grade 7</option>
                    <option value="5 (AP Top)">AP Score 5</option>
                  </select>
                </div>
              </div>

              {/* Target Exam Date */}
              <div className="space-y-1">
                <label className="text-[11px] text-white/70 font-mono-tech uppercase">Target Examination Date</label>
                <input
                  type="date"
                  value={targetExamDate}
                  onChange={(e) => setTargetExamDate(e.target.value)}
                  className="w-full bg-[#18181C] border border-[#27272A] rounded-sm px-3 py-2 text-xs text-white focus:outline-none focus:border-[#D4AF37]"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/10">
              <button
                type="button"
                onClick={() => setShowSettingsModal(false)}
                className="px-4 py-2 bg-white/5 hover:bg-white/10 text-white/70 text-xs font-mono-tech uppercase rounded-xs transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveSettings}
                className="px-5 py-2 bg-[#D4AF37] hover:bg-[#c49f27] text-black font-bold text-xs font-mono-tech uppercase rounded-xs transition-all cursor-pointer flex items-center gap-1.5 shadow-md"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Save Profile & Sync Cloud</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal 5: Grounded RAG Knowledge Base Library Modal */}
      {showLibraryModal && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
          <div className="bg-[#0A0A0B] border border-emerald-500/30 rounded-md max-w-5xl w-full p-4 sm:p-6 my-auto shadow-2xl space-y-4 max-h-[92vh] overflow-y-auto animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-white/10 pb-3 shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded bg-emerald-500/15 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
                  <Database className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white font-sans">Grounded Knowledge Base & Material Library</h3>
                  <p className="text-[11px] text-white/50 font-mono-tech">Upload, index, inspect, and ground your syllabus PDFs & exam notes</p>
                </div>
              </div>
              <button
                onClick={() => {
                  setShowLibraryModal(false);
                  refreshRAGStats();
                }}
                className="text-white/40 hover:text-white p-1 cursor-pointer bg-white/5 hover:bg-white/10 rounded-sm"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <IngestionView onNavigate={(tab) => {
              setShowLibraryModal(false);
              if (tab === 'flashcards' || tab === 'tutor') {
                onNavigate(tab);
              }
            }} />
          </div>
        </div>
      )}

      {/* Modal 6: AI Study Planner Modal */}
      {showPlannerModal && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
          <div className="bg-[#0A0A0B] border border-[#D4AF37]/30 rounded-md max-w-5xl w-full p-4 sm:p-6 my-auto shadow-2xl space-y-4 max-h-[92vh] overflow-y-auto animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-white/10 pb-3 shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded bg-[#D4AF37]/15 border border-[#D4AF37]/40 flex items-center justify-center text-[#D4AF37]">
                  <CalendarDays className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white font-sans">AI Revision Study Planner</h3>
                  <p className="text-[11px] text-white/50 font-mono-tech">Generate optimized study schedules calibrated to your exam date and confidence</p>
                </div>
              </div>
              <button
                onClick={() => setShowPlannerModal(false)}
                className="text-white/40 hover:text-white p-1 cursor-pointer bg-white/5 hover:bg-white/10 rounded-sm"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <StudyPlanView />
          </div>
        </div>
      )}

    </div>
  );
};
