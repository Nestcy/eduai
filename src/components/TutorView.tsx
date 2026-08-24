import React, { useState, useRef, useEffect } from 'react';
import { TutorMessage, VideoExplainerResponse } from '../types';
import { StudentSubject } from './StudentDashboardView';
import { MarkdownRenderer } from './MarkdownRenderer';
import { 
  Send, 
  Sparkles, 
  Video, 
  BookOpen, 
  RotateCcw, 
  Bot, 
  User, 
  Loader2,
  FileText,
  Paperclip,
  X,
  Compass,
  Target,
  Layers,
  ChevronDown,
  ArrowRight,
  TrendingUp,
  AlertCircle,
  Brain
} from 'lucide-react';

interface TutorViewProps {
  currentUser?: { email: string; name?: string } | null;
  onOpenVideo: (video: VideoExplainerResponse) => void;
  onNavigateToIngest?: () => void;
  onNavigate?: (tab: 'dashboard' | 'tutor' | 'flashcards') => void;
}

export const TutorView: React.FC<TutorViewProps> = ({ 
  currentUser, 
  onOpenVideo, 
  onNavigateToIngest,
  onNavigate 
}) => {
  // Load real student profile from localStorage or props
  const studentName = currentUser?.name || localStorage.getItem('eduai_student_name') || 'Alexander Sterling';
  const studentEmail = currentUser?.email || 'student@eduai.org';

  const [country, setCountry] = useState<string>(() => localStorage.getItem('eduai_country') || 'United Kingdom (UK)');
  const [board, setBoard] = useState<string>(() => localStorage.getItem('eduai_board') || 'Cambridge IGCSE / A-Level');
  const [grade, setGrade] = useState<string>(() => localStorage.getItem('eduai_grade') || 'A-Level / Year 13');
  const [subject, setSubject] = useState<string>(() => localStorage.getItem('eduai_subject') || 'Mathematics');

  // Load real enrolled subjects with mastery and weaknesses
  const [enrolledSubjects, setEnrolledSubjects] = useState<StudentSubject[]>(() => {
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
      } catch {}
    }
    return [
      {
        id: 'subj-1',
        name: 'Mathematics',
        category: 'Pure & Applied',
        masteryScore: 84,
        targetGrade: 'A*',
        syllabusProgress: 76,
        studyMinutes: 1420,
        examDate: '2026-05-18',
        examPaper: 'Paper 1 & Paper 3'
      },
      {
        id: 'subj-2',
        name: 'Physics',
        category: 'Physical Sciences',
        masteryScore: 68,
        targetGrade: 'A*',
        syllabusProgress: 62,
        studyMinutes: 980,
        examDate: '2026-05-22',
        examPaper: 'Paper 2 & Paper 4'
      },
      {
        id: 'subj-3',
        name: 'Chemistry',
        category: 'Chemical Sciences',
        masteryScore: 72,
        targetGrade: 'A',
        syllabusProgress: 65,
        studyMinutes: 840,
        examDate: '2026-05-28',
        examPaper: 'Paper 1 & Paper 2'
      },
      {
        id: 'subj-4',
        name: 'Computer Science',
        category: 'Computing & Logic',
        masteryScore: 91,
        targetGrade: 'A*',
        syllabusProgress: 88,
        studyMinutes: 1100,
        examDate: '2026-06-02',
        examPaper: 'Paper 1 & Practical'
      }
    ];
  });

  // Find active subject profile
  const activeSubjectProfile = enrolledSubjects.find(s => s.name.toLowerCase() === subject.toLowerCase()) || enrolledSubjects[0] || {
    id: 'subj-curr',
    name: subject,
    category: 'Curriculum Subject',
    masteryScore: 75,
    targetGrade: 'A*',
    syllabusProgress: 60,
    studyMinutes: 400,
    examDate: '2026-05-20',
    examPaper: 'Standard Paper'
  };

  const [inputQuestion, setInputQuestion] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isVideoLoading, setIsVideoLoading] = useState(false);
  const [showSubjectSwitcher, setShowSubjectSwitcher] = useState(false);

  // Quick attached file state
  const [attachedFileName, setAttachedFileName] = useState<string | null>(null);
  const [attachedFileText, setAttachedFileText] = useState<string | null>(null);
  const [isUploadingAttachment, setIsUploadingAttachment] = useState(false);
  const chatFileInputRef = useRef<HTMLInputElement>(null);

  // Vector store status
  const [totalIndexedDocs, setTotalIndexedDocs] = useState<number>(1);
  const [totalChunks, setTotalChunks] = useState<number>(6);

  useEffect(() => {
    fetch('/api/documents')
      .then(res => res.json())
      .then(data => {
        if (data.documents) setTotalIndexedDocs(data.documents.length);
        if (data.totalChunks) setTotalChunks(data.totalChunks);
      })
      .catch(() => {});
  }, []);

  // Adaptive initial welcome message calibrated to student profile
  const [messages, setMessages] = useState<TutorMessage[]>(() => [
    {
      id: 'welcome-1',
      sender: 'tutor',
      text: `### Welcome back, ${studentName}! 🎓

I am your dedicated **${subject}** Socratic AI Tutor, calibrated specifically to your **${board}** (${grade}) syllabus target: **${activeSubjectProfile.targetGrade}**.

**Current Candidate Profile Overview:**
- **Current Subject Mastery:** ${activeSubjectProfile.masteryScore}%
- **Syllabus Progress:** ${activeSubjectProfile.syllabusProgress}%

How can I assist your revision today? Feel free to ask about challenging derivations, exam mark schemes, or past paper questions!`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);

  // Update initial message when subject changes
  const handleSelectSubject = (newSubject: string) => {
    setSubject(newSubject);
    localStorage.setItem('eduai_subject', newSubject);
    setShowSubjectSwitcher(false);

    const subProfile = enrolledSubjects.find(s => s.name.toLowerCase() === newSubject.toLowerCase());

    setMessages([
      {
        id: `welcome-${Date.now()}`,
        sender: 'tutor',
        text: `### Switched to ${newSubject} Specialist 📐\n\nConnected to the **${board} ${grade}** syllabus for **${studentName}**, aiming for **${subProfile?.targetGrade || 'A*'}** (Current Mastery: ${subProfile?.masteryScore || 70}%).\n\nWhat concept or past-paper problem shall we explore?`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
    ]);
  };

  // High-yield inquiries generated for active subjects
  const getAdaptiveSamplePrompts = () => {
    const list: Array<{ subject: string; text: string; category: string; badge?: string }> = [];

    list.push({
      subject: subject,
      category: 'Exam Practice',
      badge: 'High Yield',
      text: `Guide me step-by-step through a challenging ${board} exam-style problem in ${subject} with LaTeX steps and rationale.`
    });

    enrolledSubjects.forEach(s => {
      if (s.name !== activeSubjectProfile.name) {
        list.push({
          subject: s.name,
          category: 'Enrolled Subject',
          text: `Explain the core concepts and common exam traps in ${s.name} (${s.targetGrade} standard).`
        });
      }
    });

    if (list.length < 4) {
      list.push({
        subject: subject,
        category: 'Concept Proof',
        text: `Derive the foundational principles for ${subject} under ${board} assessment guidelines.`
      });
      list.push({
        subject: subject,
        category: 'Curve Analysis',
        text: `Plot and explain key functional graphs with critical inflection points for ${subject}.`
      });
    }

    return list.slice(0, 6);
  };

  const adaptivePrompts = getAdaptiveSamplePrompts();

  const handleChatFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setAttachedFileName(file.name);
      setIsUploadingAttachment(true);

      const reader = new FileReader();
      const isText = file.name.match(/\.(txt|md|csv|json|py|ts|html)$/i);

      if (isText) {
        reader.onload = () => {
          const text = reader.result as string;
          setAttachedFileText(text);
          setIsUploadingAttachment(false);
        };
        reader.readAsText(file);
      } else {
        reader.onload = () => {
          const dataUrl = reader.result as string;
          const base64 = dataUrl.split(',')[1] || '';
          // Auto-index into vector store in background so tutor can retrieve immediately
          fetch('/api/ingest', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              country,
              curriculum_board: board,
              grade,
              subject,
              files: [{ name: file.name, type: file.type, size: file.size, base64 }]
            })
          })
            .then(res => res.json())
            .then(d => {
              setAttachedFileText(`[Ingested ${file.name} (${d.num_chunks || 1} vector chunks)]`);
              setTotalChunks(prev => prev + (d.num_chunks || 1));
              setTotalIndexedDocs(prev => prev + 1);
            })
            .catch(() => {})
            .finally(() => setIsUploadingAttachment(false));
        };
        reader.readAsDataURL(file);
      }
    }
  };

  const handleSendMessage = async (queryText?: string) => {
    let textToSend = queryText || inputQuestion;
    if (!textToSend.trim() && !attachedFileText) return;
    if (isLoading) return;

    if (attachedFileName && attachedFileText) {
      if (!attachedFileText.startsWith('[Ingested')) {
        textToSend = `[Attached Document: ${attachedFileName}]\n${attachedFileText.slice(0, 1500)}\n\nQuestion: ${textToSend}`;
      } else {
        textToSend = `[Referencing uploaded file: ${attachedFileName}]\n${textToSend}`;
      }
    }

    const studentMsg: TutorMessage = {
      id: `msg-${Date.now()}`,
      sender: 'student',
      text: queryText || inputQuestion || `Question regarding ${attachedFileName}`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages((prev) => [...prev, studentMsg]);
    setInputQuestion('');
    setAttachedFileName(null);
    setAttachedFileText(null);
    setIsLoading(true);

    try {
      // Build sliding conversation buffer memory from previous messages
      const historyBuffer = messages.slice(-10).map(m => ({
        sender: m.sender,
        text: m.text
      }));

      const response = await fetch('/api/tutor/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: textToSend,
          country,
          curriculum_board: board,
          grade,
          subject,
          student_name: studentName,
          target_grade: activeSubjectProfile.targetGrade,
          mastery_score: activeSubjectProfile.masteryScore,
          history: historyBuffer
        })
      });

      if (!response.ok) {
        throw new Error(`Tutor service error (${response.status})`);
      }

      const data = await response.json();

      const tutorMsg: TutorMessage = {
        id: `msg-${Date.now() + 1}`,
        sender: 'tutor',
        text: data.answer || 'I could not generate an answer at this time.',
        thinking: data.thinking || undefined,
        sources: data.sources || [],
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        suggestedVideoTopic: data.suggested_video_topic
      };

      setMessages((prev) => [...prev, tutorMsg]);
    } catch (err: any) {
      const errorMsg: TutorMessage = {
        id: `msg-err-${Date.now()}`,
        sender: 'tutor',
        text: `### ⚠️ Tutor Agent Notice\n\n${err.message || 'Unable to connect to tutor agent.'}\n\nPlease verify your connection or inspect server logs.`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenerateVideo = async (topic: string) => {
    setIsVideoLoading(true);
    try {
      const response = await fetch('/api/tutor/video', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic,
          subject,
          context: `Syllabus level: ${grade} ${board}`
        })
      });

      if (!response.ok) throw new Error('Video generation failed');
      const data = await response.json();
      onOpenVideo(data);
    } catch (err) {
      console.error('Video error:', err);
    } finally {
      setIsVideoLoading(false);
    }
  };

  return (
    <div className="flex flex-col lg:flex-row gap-6 max-w-7xl mx-auto py-2 px-2 sm:px-4 lg:px-6">
      
      {/* Left Sidebar: Adaptive Student Inquiries & Syllabus Diagnostics */}
      <aside className="w-full lg:w-80 shrink-0 space-y-4">
        
        {/* Adaptive High-Yield Inquiries based on Student's Real Profile */}
        <div className="p-4 bg-[#121214] border border-[#1F1F23] rounded-sm space-y-3 shadow-xs">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-xs font-mono-tech uppercase font-bold text-[#D4AF37]">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Adaptive Syllabus Drills</span>
            </div>
            <span className="text-[9px] font-mono-tech text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded-xs border border-emerald-500/20">
              Personalized
            </span>
          </div>

          <p className="text-[11px] text-white/50 leading-relaxed font-sans">
            Calibrated to <strong className="text-white/80">{studentName}</strong>'s current <strong className="text-[#D4AF37]">{subject}</strong> performance metrics:
          </p>

          <div className="space-y-2">
            {adaptivePrompts.map((p, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => {
                  if (p.subject !== subject) {
                    handleSelectSubject(p.subject);
                  }
                  handleSendMessage(p.text);
                }}
                className="w-full text-left p-2.5 rounded-xs bg-[#0A0A0B] hover:bg-white/5 border border-white/10 hover:border-[#D4AF37]/50 transition-all text-xs text-white/80 cursor-pointer group"
              >
                <div className="flex items-center justify-between gap-1 mb-1">
                  <span className="font-mono-tech font-bold text-[#D4AF37] text-[10px] group-hover:underline">
                    0{idx+1} // {p.subject.toUpperCase()}
                  </span>
                  {p.badge && (
                    <span className="text-[9px] font-mono-tech text-rose-400 bg-rose-500/10 px-1.5 py-0.2 rounded-xs border border-rose-500/20">
                      {p.badge}
                    </span>
                  )}
                </div>
                <span className="line-clamp-2 text-[11px] text-white/70 group-hover:text-white leading-relaxed font-sans">
                  {p.text}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Quick Student RAG Library Status */}
        <div className="p-4 bg-[#121214] border border-[#1F1F23] rounded-sm space-y-2 text-xs">
          <div className="flex items-center justify-between text-[11px] font-mono-tech text-white/60">
            <span className="flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-blue-400" />
              <span>Grounded Knowledge Base</span>
            </span>
            <span className="text-blue-400 font-bold font-mono-tech">
              {totalIndexedDocs} Docs ({totalChunks} Chunks)
            </span>
          </div>
          <p className="text-[10px] text-white/40 leading-relaxed">
            Attach textbooks, mark schemes, or student notes directly below to ground the tutor on your class material.
          </p>
        </div>

      </aside>

      {/* Main Chat Area */}
      <main className="flex-1 flex flex-col bg-[#121214] rounded-sm border border-[#1F1F23] overflow-hidden min-h-[720px] shadow-sm">
        
        {/* Chat Header: Adaptive Student & Curriculum Status */}
        <div className="p-4 sm:p-5 border-b border-[#1F1F23] bg-[#0A0A0B] flex flex-col gap-3.5">
          
          {/* Top Row: Candidate Identity, Subject Specialist & Socratic Status */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            
            {/* Candidate & Subject Indicator */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-sm bg-[#D4AF37] text-black flex items-center justify-center font-bold shadow-xs">
                <Bot className="w-5 h-5" />
              </div>
              
              <div>
                <div className="flex items-center gap-2 text-[10px] font-mono-tech text-white/50 uppercase tracking-wider">
                  <span className="text-[#D4AF37] font-bold">CANDIDATE: {studentName.toUpperCase()}</span>
                  <span>•</span>
                  <span className="flex items-center gap-1 text-emerald-400">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    <span>Socratic Engine Active</span>
                  </span>
                  <span>•</span>
                  <span className="flex items-center gap-1 text-blue-400 font-semibold bg-blue-500/10 px-1.5 py-0.2 rounded-xs border border-blue-500/20">
                    <Brain className="w-3 h-3 text-blue-400" />
                    <span>Buffer Memory ({messages.length} turns)</span>
                  </span>
                </div>

                <div className="flex items-center gap-2 mt-0.5">
                  <h2 className="font-syne font-extrabold text-white text-base tracking-tight">
                    {subject} Socratic Specialist
                  </h2>

                  {/* Subject Quick Selector Dropdown */}
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setShowSubjectSwitcher(!showSubjectSwitcher)}
                      className="px-2 py-0.5 bg-white/5 hover:bg-white/10 text-white/70 hover:text-white border border-white/10 rounded-xs font-mono-tech text-[10px] flex items-center gap-1 transition-colors cursor-pointer"
                      title="Switch active revision subject"
                    >
                      <span>Switch Subject</span>
                      <ChevronDown className="w-3 h-3" />
                    </button>

                    {showSubjectSwitcher && (
                      <div className="absolute left-0 mt-1.5 w-60 bg-[#121214] border border-[#1F1F23] rounded-xs shadow-xl p-1.5 z-50 space-y-1 animate-in fade-in duration-100">
                        <div className="px-2 py-1 text-[9px] font-mono-tech uppercase text-white/40 border-b border-white/5">
                          Select Enrolled Subject:
                        </div>
                        {enrolledSubjects.map((s, idx) => (
                          <button
                            key={s.id || `tutor-subj-${s.name}-${idx}`}
                            type="button"
                            onClick={() => handleSelectSubject(s.name)}
                            className={`w-full text-left px-2.5 py-1.5 rounded-xs text-xs font-mono-tech flex items-center justify-between transition-colors cursor-pointer ${
                              s.name.toLowerCase() === subject.toLowerCase()
                                ? 'bg-[#D4AF37]/20 text-[#D4AF37] font-bold'
                                : 'text-white/70 hover:bg-white/5 hover:text-white'
                            }`}
                          >
                            <span className="truncate">{s.name}</span>
                            <span className="text-[10px] px-1.5 py-0.2 bg-white/10 rounded-xs text-white/80">
                              {s.masteryScore}% • {s.targetGrade}
                            </span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Right Side: Curriculum Badges & Reset */}
            <div className="flex items-center gap-2">
              <div className="px-2.5 py-1 bg-[#D4AF37]/15 text-[#D4AF37] border border-[#D4AF37]/40 rounded-xs font-mono-tech text-[10px] font-bold uppercase tracking-wider hidden sm:inline-block">
                {grade}
              </div>
              <div className="px-2.5 py-1 bg-white/5 text-white/80 border border-white/10 rounded-xs font-mono-tech text-[10px] uppercase tracking-wider hidden sm:inline-block">
                {board.split(' ')[0]} ({country.split(' ')[0]})
              </div>
              
              <button
                type="button"
                onClick={() =>
                  setMessages([
                    {
                      id: `welcome-${Date.now()}`,
                      sender: 'tutor',
                      text: `Chat session reset for **${studentName}** on **${subject}** (${board} ${grade}). What topic or derivation would you like to explore?`,
                      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                    }
                  ])
                }
                className="p-2 rounded-xs border border-white/10 text-white/60 hover:text-white hover:bg-white/5 text-xs flex items-center gap-1 transition-colors cursor-pointer"
                title="Reset Conversation"
              >
                <RotateCcw className="w-3.5 h-3.5 text-[#D4AF37]" />
              </button>
            </div>

          </div>

          {/* Bottom Row: Real Student Mastery Bar & Active Focus Chips */}
          <div className="pt-2.5 border-t border-white/10 flex flex-wrap items-center justify-between gap-3 text-xs">
            
            {/* Real Mastery Progress Meter */}
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5 text-[11px] font-mono-tech text-white/60">
                <Target className="w-3.5 h-3.5 text-[#D4AF37]" />
                <span>Subject Mastery:</span>
                <strong className="text-white font-bold">{activeSubjectProfile.masteryScore}%</strong>
                <span className="text-[10px] text-[#D4AF37] bg-[#D4AF37]/10 px-1.5 py-0.2 rounded-xs border border-[#D4AF37]/30">
                  Target: {activeSubjectProfile.targetGrade}
                </span>
              </div>

              <div className="w-24 sm:w-32 bg-white/10 rounded-full h-1.5 overflow-hidden">
                <div 
                  className="bg-[#D4AF37] h-full rounded-full transition-all duration-300"
                  style={{ width: `${activeSubjectProfile.masteryScore}%` }}
                />
              </div>
            </div>



          </div>

        </div>

        {/* Message Thread */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5 bg-[#080809]">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex gap-3 max-w-3xl ${
                msg.sender === 'student' ? 'ml-auto flex-row-reverse' : 'mr-auto'
              }`}
            >
              {/* Avatar */}
              <div
                className={`w-8 h-8 rounded-sm shrink-0 flex items-center justify-center text-xs font-bold font-mono-tech ${
                  msg.sender === 'student'
                    ? 'bg-[#C15B3A] text-white'
                    : 'bg-[#D4AF37] text-black'
                }`}
              >
                {msg.sender === 'student' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
              </div>

              {/* Message Bubble */}
              <div
                className={`rounded-sm p-4 sm:p-5 border ${
                  msg.sender === 'student'
                    ? 'bg-[#C15B3A]/15 border-[#C15B3A]/40 text-white'
                    : 'bg-[#121214] border-white/10 text-white/90 shadow-sm'
                }`}
              >
                <div className="font-mono-tech text-[10px] text-[#D4AF37] mb-2 flex items-center gap-3">
                  <span>ID: {msg.sender === 'student' ? `${studentName.toUpperCase()}` : `SOCRATIC_${subject.toUpperCase()}_BOT`}</span>
                  <span>•</span>
                  <span>{msg.timestamp}</span>
                </div>

                {msg.sender === 'student' ? (
                  <p className="text-sm leading-relaxed whitespace-pre-wrap font-sans">{msg.text}</p>
                ) : (
                  <div>
                    <MarkdownRenderer content={msg.text} thinking={msg.thinking} />

                    {/* Cited Sources */}
                    {msg.sources && msg.sources.length > 0 && (
                      <div className="mt-4 pt-3 border-t border-white/10">
                        <div className="text-[10px] font-mono-tech text-[#C15B3A] uppercase tracking-wider mb-2 flex items-center gap-1">
                          <FileText className="w-3 h-3 text-[#D4AF37]" />
                          Curriculum Sources Grounding:
                        </div>
                        <div className="space-y-1.5">
                          {msg.sources.map((src, idx) => (
                            <div
                              key={idx}
                              className="text-xs bg-[#0A0A0B] p-2.5 rounded-xs border border-white/10 text-white/70 font-mono-tech"
                            >
                              <div className="font-semibold text-[#D4AF37] flex items-center justify-between text-[11px]">
                                <span>📄 {src.source}</span>
                                {src.page && <span className="text-[10px] text-white/40">Page {src.page}</span>}
                              </div>
                              <p className="text-[11px] text-white/50 mt-1 line-clamp-2 italic font-sans">
                                "{src.content}"
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Explainer Video Action Button */}
                    <div className="mt-4 pt-2 flex items-center justify-between border-t border-white/5">
                      <button
                        type="button"
                        onClick={() => handleGenerateVideo(msg.suggestedVideoTopic || subject)}
                        disabled={isVideoLoading}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 rounded-xs text-xs font-mono-tech font-semibold transition-all cursor-pointer shadow-xs disabled:opacity-50"
                      >
                        {isVideoLoading ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Video className="w-3.5 h-3.5 text-rose-400" />
                        )}
                        <span>Request AI Video Lesson on {msg.suggestedVideoTopic || subject}</span>
                      </button>
                      <span className="text-[10px] text-white/30 font-mono-tech">{msg.timestamp}</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="flex gap-3 mr-auto max-w-xl animate-pulse">
              <div className="w-8 h-8 rounded-sm bg-[#D4AF37] text-black flex items-center justify-center">
                <Bot className="w-4 h-4" />
              </div>
              <div className="bg-[#121214] border border-white/10 rounded-sm p-4 flex items-center gap-3">
                <Loader2 className="w-4 h-4 text-[#D4AF37] animate-spin" />
                <span className="text-xs text-white/70 font-medium font-sans">
                  Socratic Tutor formulating step-by-step guidance calibrated for {studentName}...
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Input Bar */}
        <div className="p-4 border-t border-[#1F1F23] bg-[#0A0A0B] space-y-2">
          {/* Attached File Preview Tag */}
          {attachedFileName && (
            <div className="flex items-center gap-2 p-2 bg-blue-500/10 border border-blue-500/30 rounded-xs text-xs text-blue-300 w-fit">
              <FileText className="w-4 h-4 text-blue-400 shrink-0" />
              <span className="font-semibold truncate max-w-xs">{attachedFileName}</span>
              {isUploadingAttachment ? (
                <span className="text-[10px] text-blue-400 animate-pulse font-medium">Extracting vectors...</span>
              ) : (
                <span className="text-[10px] text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded-xs font-bold border border-emerald-500/20">
                  Grounding Attached
                </span>
              )}
              <button
                type="button"
                onClick={() => {
                  setAttachedFileName(null);
                  setAttachedFileText(null);
                }}
                className="text-white/40 hover:text-rose-400 p-0.5 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="flex items-center gap-2"
          >
            <input
              ref={chatFileInputRef}
              type="file"
              accept=".pdf,.txt,.md,.markdown,.csv,.json,.doc,.docx"
              onChange={handleChatFileSelect}
              className="hidden"
            />

            <button
              type="button"
              onClick={() => chatFileInputRef.current?.click()}
              title="Attach PDF or Study File for Instant RAG Grounding"
              className="p-3 bg-[#121214] hover:bg-white/10 text-white/60 hover:text-[#D4AF37] border border-white/10 rounded-xs transition-colors cursor-pointer shrink-0"
            >
              <Paperclip className="w-4 h-4" />
            </button>

            <input
              type="text"
              id="tutor-question-input"
              value={inputQuestion}
              onChange={(e) => setInputQuestion(e.target.value)}
              placeholder={`Ask any ${subject} question (e.g. formulas, mechanisms, proofs, weak topics)...`}
              className="flex-1 px-4 py-3 bg-[#121214] border border-white/15 focus:border-[#D4AF37] rounded-xs text-sm text-white placeholder-white/40 focus:outline-hidden font-sans"
            />

            <button
              type="submit"
              id="tutor-send-button"
              disabled={isLoading || (!inputQuestion.trim() && !attachedFileText)}
              className="px-5 py-3 bg-[#D4AF37] hover:bg-[#E5C158] text-black rounded-xs font-syne font-bold text-xs uppercase flex items-center gap-2 transition-colors disabled:opacity-40 cursor-pointer shrink-0"
            >
              <span>Ask Tutor</span>
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>

      </main>

    </div>
  );
};
