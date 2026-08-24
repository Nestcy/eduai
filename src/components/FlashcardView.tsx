import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Flashcard, IngestedDocument, StudentSubjectProfile } from '../types';
import { 
  GLOBAL_SUBJECT_CATEGORIES, 
  ALL_FLAT_SUBJECTS 
} from '../data/curriculumData';
import { GlobalCurriculumPicker } from './GlobalCurriculumPicker';
import { MarkdownRenderer } from './MarkdownRenderer';
import confetti from 'canvas-confetti';
import { jsPDF } from 'jspdf';
import { 
  Layers, 
  Sparkles, 
  RotateCw, 
  CheckCircle2, 
  Download, 
  ChevronLeft, 
  ChevronRight, 
  BookOpen, 
  Award,
  Tag,
  FileText,
  Upload,
  SlidersHorizontal,
  Grid,
  Play,
  Shuffle,
  Plus,
  Search,
  Check,
  FileCheck2,
  GraduationCap,
  Globe,
  FileUp,
  Folder,
  Eye,
  X,
  Brain,
  Target,
  Volume2,
  VolumeX,
  Lightbulb,
  AlertTriangle,
  HelpCircle,
  MessageSquare,
  Flame,
  ArrowRight,
  Copy,
  Zap,
  TrendingUp
} from 'lucide-react';

export const FlashcardView: React.FC = () => {
  // 1. Student Curriculum Selection State (Synchronized with localStorage)
  const [country, setCountry] = useState<string>(() => {
    return localStorage.getItem('eduai_country') || 'Global Standard (Universal)';
  });
  const [board, setBoard] = useState<string>(() => {
    return localStorage.getItem('eduai_board') || 'Cambridge IGCSE / A-Level';
  });
  const [grade, setGrade] = useState<string>(() => {
    return localStorage.getItem('eduai_grade') || 'Grade 12';
  });
  const [subject, setSubject] = useState<string>(() => {
    return localStorage.getItem('eduai_subject') || 'Mathematics';
  });

  // Save changes to localStorage for unified cross-tab curriculum experience
  useEffect(() => {
    localStorage.setItem('eduai_country', country);
    localStorage.setItem('eduai_board', board);
    localStorage.setItem('eduai_grade', grade);
    localStorage.setItem('eduai_subject', subject);
  }, [country, board, grade, subject]);

  // Curriculum Picker modal state
  const [showCurriculumPicker, setShowCurriculumPicker] = useState(false);

  // 3. Generation Source & Topic Configuration
  const [sourceMode, setSourceMode] = useState<'curriculum' | 'uploaded_material' | 'custom_notes'>('curriculum');
  const [topic, setTopic] = useState('Quadratic Equations, Discriminants & Polynomials');
  const [numCards, setNumCards] = useState<number>(8);
  const [isLoading, setIsLoading] = useState(false);

  // 4. Uploaded Materials State (RAG Store)
  const [uploadedDocs, setUploadedDocs] = useState<IngestedDocument[]>([]);
  const [selectedDocTitles, setSelectedDocTitles] = useState<string[]>(['all']);
  const [docSearchQuery, setDocSearchQuery] = useState<string>('');

  // Quick In-Page Note / File Ingestion State
  const [showQuickUpload, setShowQuickUpload] = useState(false);
  const [quickNotesText, setQuickNotesText] = useState('');
  const [quickDocTitle, setQuickDocTitle] = useState('');
  const [isQuickIngesting, setIsQuickIngesting] = useState(false);
  const quickFileInputRef = useRef<HTMLInputElement>(null);

  // Fetch uploaded documents & check incoming navigation shortcuts
  const fetchUploadedDocuments = async () => {
    try {
      const res = await fetch('/api/documents');
      const data = await res.json();
      if (data.documents) {
        setUploadedDocs(data.documents);
      }
    } catch (err) {
      console.warn('Error fetching uploaded documents for flashcards:', err);
    }
  };

  useEffect(() => {
    fetchUploadedDocuments();
    const savedDoc = localStorage.getItem('eduai_flashcard_doc');
    const savedSource = localStorage.getItem('eduai_flashcard_source');
    if (savedDoc || savedSource === 'uploaded_material') {
      setSourceMode('uploaded_material');
      if (savedDoc) {
        setSelectedDocTitles([savedDoc]);
        localStorage.removeItem('eduai_flashcard_doc');
      }
      localStorage.removeItem('eduai_flashcard_source');
    }
  }, []);

  // Multi-document toggle logic
  const toggleSelectDoc = (docTitle: string) => {
    if (docTitle === 'all') {
      setSelectedDocTitles(['all']);
      return;
    }
    setSelectedDocTitles(prev => {
      const filtered = prev.filter(t => t !== 'all');
      if (filtered.includes(docTitle)) {
        const next = filtered.filter(t => t !== docTitle);
        return next.length === 0 ? ['all'] : next;
      } else {
        return [...filtered, docTitle];
      }
    });
  };

  // 5. Study Mode & Active Deck State
  const [studyMode, setStudyMode] = useState<'flip' | 'quiz' | 'list'>('flip');
  const [flashcards, setFlashcards] = useState<Flashcard[]>([]);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [masteredIds, setMasteredIds] = useState<Set<number>>(new Set());

  // Deep-Dive Tutor Modal State for active card
  const [deepDiveCard, setDeepDiveCard] = useState<Flashcard | null>(null);
  const [tutorExplanation, setTutorExplanation] = useState<string>('');
  const [isTutorExplaining, setIsTutorExplaining] = useState(false);

  // Audio Speech Synthesis state
  const [isSpeaking, setIsSpeaking] = useState(false);

  // Quiz Mode self-testing state
  const [quizInput, setQuizInput] = useState('');
  const [isAnswerRevealed, setIsAnswerRevealed] = useState(false);
  const [listSearchQuery, setListSearchQuery] = useState('');
  const [difficultyFilter, setDifficultyFilter] = useState<string>('all');

  // Dynamic Topic Presets Aligned with Grade, Board & Subject
  const topicPresets: Record<string, string[]> = useMemo(() => ({
    'Biology': [
      'Photosynthesis & Cellular Respiration',
      'Genetics, DNA Replication & Transcription',
      'Enzyme Kinetics, Allosteric Sites & Inhibitors',
      'Cell Membrane Transport & Osmoregulation',
      'Immune System, Monoclonal Antibodies & Vaccination',
      'Ecology, Biogeochemical Cycles & Energy Flow'
    ],
    'Mathematics': [
      'Quadratic Equations, Discriminants & Polynomials',
      'Calculus: Derivatives, Product/Chain Rules & Tangents',
      'Integration by Parts & Definite Integrals',
      'Trigonometric Identities, Graphs & Proofs',
      'Probability Distributions, Binomial & Normal Curves',
      'Vectors, Dot Products & 3D Planes'
    ],
    'Physics': [
      'Newton\'s Laws, Kinematics & Momentum Conservation',
      'Electromagnetic Induction & Faraday/Lenz Laws',
      'Wave Mechanics, Interference & Doppler Effect',
      'Thermodynamics, Ideal Gas Laws & Entropy',
      'Quantum Phenomena & Photoelectric Work Function',
      'Electric Circuits, Kirchhoff\'s Laws & Capacitors'
    ],
    'Chemistry': [
      'Le Chatelier\'s Principle & Equilibrium Constant (Kc)',
      'Periodic Trends, Electronegativity & Ionic Bonding',
      'Organic Reaction Mechanisms (SN1, SN2, Electrophilic)',
      'Thermochemistry, Enthalpy Cycles & Hess\'s Law',
      'Acid-Base Equilibria, pH Calculations & Buffers',
      'Redox Reactions, Electrochemical Cells & Standard Potentials'
    ],
    'Computer Science': [
      'Binary Search Trees, Graph Traversal (DFS/BFS)',
      'Time Complexity (Big-O Notation) & Sorting Algorithms',
      'Object-Oriented Programming, Encapsulation & Polymorphism',
      'Relational Databases, Normalization & SQL Queries',
      'Networking: TCP/IP Stack, DNS & Routing Protocols',
      'Boolean Logic, Logic Gates & Karnaugh Maps'
    ],
    'Economics': [
      'Price Elasticity of Demand & Supply Mechanisms',
      'Monetary Policy, Central Bank Rates & Inflation Dynamics',
      'Fiscal Multipliers, Aggregate Demand & Keynesian Curves',
      'Market Structures: Monopoly, Oligopoly & Perfect Competition',
      'Comparative Advantage, Exchange Rates & Trade Tariffs',
      'Market Failures, Externalities & Public Goods'
    ]
  }), []);

  // Generate Flashcards Action with RAG and Adaptive AI Tutor profile
  const handleGenerateCards = async () => {
    if (sourceMode === 'curriculum' && !topic.trim()) return;
    if (sourceMode === 'custom_notes' && !quickNotesText.trim()) return;

    setIsLoading(true);
    try {
      const payload: any = {
        country,
        board,
        grade,
        subject,
        topic: sourceMode === 'custom_notes' ? (quickDocTitle || 'Custom Notes') : topic,
        num_cards: numCards,
        source_mode: sourceMode === 'custom_notes' ? 'custom_text' : sourceMode
      };

      if (sourceMode === 'uploaded_material') {
        payload.selected_document = selectedDocTitles.includes('all') ? 'all' : selectedDocTitles.join(', ');
      } else if (sourceMode === 'custom_notes') {
        payload.custom_text = quickNotesText;
      }

      const response = await fetch('/api/flashcards', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!response.ok) throw new Error('Flashcard generation failed');
      const data = await response.json();

      if (data.flashcards && data.flashcards.length > 0) {
        setFlashcards(data.flashcards);
        setCurrentIndex(0);
        setIsFlipped(false);
        setMasteredIds(new Set());
        setIsAnswerRevealed(false);
        setQuizInput('');
        
        // Confetti celebration
        confetti({
          particleCount: 45,
          spread: 65,
          origin: { y: 0.65 }
        });
      }
    } catch (err: any) {
      console.error('Flashcard generation error:', err);
      alert('Failed to generate flashcards. Please check your connection and try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Quick Ingest Handler for on-the-fly document upload
  const handleQuickFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];
    setIsQuickIngesting(true);

    try {
      const reader = new FileReader();
      reader.onload = async (event) => {
        const base64 = event.target?.result as string;
        const res = await fetch('/api/ingest', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            country,
            curriculum_board: board,
            grade,
            subject,
            files: [{
              name: file.name,
              type: file.type || 'application/pdf',
              base64
            }]
          })
        });

        if (res.ok) {
          await fetchUploadedDocuments();
          setSelectedDocTitles([file.name]);
          setSourceMode('uploaded_material');
          setShowQuickUpload(false);
          confetti({ particleCount: 35, spread: 50, origin: { y: 0.8 } });
        } else {
          alert('Failed to index file. Please ensure it contains readable text.');
        }
        setIsQuickIngesting(false);
      };
      reader.readAsDataURL(file);
    } catch (err) {
      console.error('Quick upload error:', err);
      setIsQuickIngesting(false);
    }
  };

  // AI Tutor Deep-Dive on Specific Flashcard
  const handleAskTutorDeepDive = async (card: Flashcard) => {
    setDeepDiveCard(card);
    setIsTutorExplaining(true);
    setTutorExplanation('');

    try {
      const prompt = `As an empathetic, expert AI Tutor, provide a clear, step-by-step masterclass on this flashcard concept:
Subject: ${subject} (${board} ${grade})
Topic: ${card.topic || topic}
Question: ${card.question}
Answer: ${card.answer}

Please break this down into:
1. 🎯 The Big Picture intuition in plain language.
2. 📐 Step-by-step mathematical proof / mechanism breakdown.
3. ⚠️ The top 2 Examiner Traps students fall into on this exact question.
4. 🧠 A memorable mnemonic or mental model.`;

      const res = await fetch('/api/tutor/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: prompt,
          subject,
          grade,
          curriculum_board: board,
          country
        })
      });

      if (!res.ok) throw new Error('Tutor explanation failed');
      const data = await res.json();
      setTutorExplanation(data.answer || 'Detailed pedagogical explanation generated.');
    } catch (e: any) {
      setTutorExplanation(`### Concept Deep-Dive\n\n**Core Principle:** ${card.answer}\n\n**Tutor Tip:** ${card.tutor_tip || 'Focus on precise SI units and algebraic substitution.'}`);
    } finally {
      setIsTutorExplaining(false);
    }
  };

  // Text-to-Speech audio readout
  const handleSpeakCard = (text: string) => {
    if (!('speechSynthesis' in window)) return;
    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }

    const cleanText = text.replace(/[$#*_`]/g, '');
    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.rate = 1.0;
    utterance.pitch = 1.0;
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);
    
    setIsSpeaking(true);
    window.speechSynthesis.speak(utterance);
  };

  const handleFlip = () => {
    setIsFlipped(!isFlipped);
  };

  const handleNext = () => {
    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }
    setIsFlipped(false);
    setIsAnswerRevealed(false);
    setQuizInput('');
    setCurrentIndex((prev) => (prev + 1) % flashcards.length);
  };

  const handlePrev = () => {
    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }
    setIsFlipped(false);
    setIsAnswerRevealed(false);
    setQuizInput('');
    setCurrentIndex((prev) => (prev - 1 + flashcards.length) % flashcards.length);
  };

  const handleShuffle = () => {
    const shuffled = [...flashcards].sort(() => Math.random() - 0.5);
    setFlashcards(shuffled);
    setCurrentIndex(0);
    setIsFlipped(false);
    setMasteredIds(new Set());
  };

  const handleMasterCard = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const updated = new Set(masteredIds);
    updated.add(currentIndex);
    setMasteredIds(updated);

    confetti({
      particleCount: 45,
      spread: 60,
      origin: { y: 0.7 }
    });

    setTimeout(() => {
      handleNext();
    }, 400);
  };

  // PDF Export
  const handleExportPDF = () => {
    const doc = new jsPDF();
    
    // Header Banner
    doc.setFillColor(15, 23, 42);
    doc.rect(0, 0, 210, 38, 'F');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.setTextColor(255, 255, 255);
    doc.text(`EduAI AI Flashcards: ${subject}`, 14, 18);

    doc.setFontSize(9.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(203, 213, 225);
    doc.text(`Curriculum: ${board} (${country}) • ${grade} • Topic: ${topic || 'Core Material'}`, 14, 27);

    let y = 38;
    flashcards.forEach((card, idx) => {
      if (y > 230) {
        doc.addPage();
        y = 20;
      }

      // Card container box
      doc.setFillColor(248, 250, 252);
      doc.setDrawColor(226, 232, 240);
      doc.roundedRect(14, y, 182, 48, 3, 3, 'FD');

      // Header Tag
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.setTextColor(37, 99, 235);
      doc.text(`Card #${idx + 1} [${card.difficulty || 'Intermediate'}]`, 18, y + 8);

      // Question
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.setTextColor(15, 23, 42);
      doc.text(`Q: ${card.question.replace(/[$]/g, '')}`, 18, y + 16, { maxWidth: 172 });

      // Answer
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(51, 65, 85);
      doc.text(`A: ${card.answer.replace(/[$]/g, '')}`, 18, y + 26, { maxWidth: 172 });

      // Tutor Tip
      if (card.tutor_tip) {
        doc.setFontSize(8);
        doc.setTextColor(180, 83, 9);
        doc.text(`${card.tutor_tip}`, 18, y + 37, { maxWidth: 172 });
      }

      // Source footer tag
      doc.setFontSize(7.5);
      doc.setTextColor(100, 116, 139);
      doc.text(`Source: ${card.source || 'Syllabus Grounded'}`, 18, y + 44);

      y += 54;
    });

    doc.save(`EduAI_Flashcards_${subject.replace(/[^a-zA-Z0-9]/g, '_')}_${(topic || 'StudyPack').replace(/[^a-zA-Z0-9]/g, '_')}.pdf`);
  };

  // Export JSON for Anki / Quizlet
  const handleExportJSON = () => {
    const exportData = {
      deckTitle: `${subject} - ${topic || 'Revision'} (${board})`,
      curriculum: { country, board, grade, subject },
      generatedAt: new Date().toISOString(),
      cards: flashcards.map(c => ({
        front: c.question,
        back: c.answer,
        tag: c.topic,
        difficulty: c.difficulty,
        tutor_tip: c.tutor_tip,
        key_formula: c.key_formula,
        source: c.source
      }))
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `flashcards-${subject.toLowerCase()}-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const currentCard = flashcards[currentIndex] || flashcards[0];
  const isMastered = masteredIds.has(currentIndex);

  const coreSubjectsForCurriculum = [
    'Mathematics',
    'Biology',
    'Physics',
    'Chemistry',
    'Computer Science',
    'Economics'
  ];

  return (
    <div className="max-w-5xl mx-auto py-6 px-4 sm:px-6 lg:px-8 space-y-6">
      
      {/* 1. Header Banner & Curriculum Picker */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-600 text-white rounded-xl shadow-xs">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <span>AI Flashcard Generator</span>
                <span className="px-2 py-0.5 bg-blue-50 text-blue-700 text-[11px] font-semibold rounded-md border border-blue-200">
                  RAG & Syllabus Grounded
                </span>
              </h1>
              <p className="text-xs text-slate-500">
                Generate tailored flashcards from uploaded learning materials and syllabus standards.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowCurriculumPicker(!showCurriculumPicker)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-colors cursor-pointer border border-slate-200"
            >
              <GraduationCap className="w-3.5 h-3.5 text-blue-600" />
              <span>{board.split(' (')[0]} • {grade}</span>
              <SlidersHorizontal className="w-3 h-3 text-slate-400 ml-1" />
            </button>

            <button
              onClick={handleExportPDF}
              disabled={flashcards.length === 0}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold transition-colors cursor-pointer disabled:opacity-50"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export PDF</span>
            </button>
          </div>
        </div>

        {/* Global Curriculum Picker Expander */}
        {showCurriculumPicker && (
          <div className="pt-4 border-t border-slate-100 animate-in fade-in duration-200">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <Globe className="w-3.5 h-3.5 text-blue-600" />
                Customize Student Curriculum & Exam Board
              </span>
              <button
                onClick={() => setShowCurriculumPicker(false)}
                className="text-xs text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                Close
              </button>
            </div>
            <GlobalCurriculumPicker
              country={country}
              setCountry={setCountry}
              board={board}
              setBoard={setBoard}
              grade={grade}
              setGrade={setGrade}
              subject={subject}
              setSubject={setSubject}
            />
          </div>
        )}

        {/* Dynamic Subject Quick Select */}
        <div className="space-y-2 pt-2 border-t border-slate-100">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Active Subject:
            </span>
            <span className="text-[11px] text-blue-600 font-semibold">
              {subject} ({grade})
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            {coreSubjectsForCurriculum.map((subName) => {
              const isActive = subject.toLowerCase() === subName.toLowerCase() || subject.toLowerCase().startsWith(subName.toLowerCase());
              return (
                <button
                  key={subName}
                  onClick={() => {
                    setSubject(subName);
                    const presets = topicPresets[subName];
                    if (presets && presets.length > 0) {
                      setTopic(presets[0]);
                    }
                  }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                    isActive
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200/60'
                  }`}
                >
                  <BookOpen className="w-3 h-3 opacity-70" />
                  <span>{subName}</span>
                </button>
              );
            })}

            <select
              value={subject}
              onChange={(e) => {
                const val = e.target.value;
                setSubject(val);
                const presets = topicPresets[val.split(' (')[0]];
                if (presets && presets.length > 0) {
                  setTopic(presets[0]);
                }
              }}
              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-medium rounded-xl border border-slate-200 cursor-pointer focus:ring-2 focus:ring-blue-500"
            >
              <option value="">More Subjects...</option>
              {GLOBAL_SUBJECT_CATEGORIES.map((cat, cIdx) => (
                <optgroup key={cIdx} label={cat.category}>
                  {cat.subjects.map((sub, sIdx) => (
                    <option key={sIdx} value={sub.split(' (')[0]}>
                      {sub}
                    </option>
                  ))}
                </optgroup>
              ))}
            </select>
          </div>
        </div>
      </div>



      {/* 3. Source Selection & Generation Controls */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-5">
        
        {/* Source Mode Switcher */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
            Flashcard Generation Source
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            {/* Option A: Uploaded Materials Mode (RAG) */}
            <button
              type="button"
              onClick={() => {
                setSourceMode('uploaded_material');
                fetchUploadedDocuments();
              }}
              className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer flex items-start gap-3 ${
                sourceMode === 'uploaded_material'
                  ? 'bg-emerald-50/60 border-emerald-500 ring-2 ring-emerald-500/20 text-slate-900'
                  : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-600'
              }`}
            >
              <FileCheck2 className={`w-5 h-5 mt-0.5 shrink-0 ${sourceMode === 'uploaded_material' ? 'text-emerald-600' : 'text-slate-400'}`} />
              <div>
                <div className="text-xs font-bold flex items-center gap-1.5">
                  <span>Uploaded Learning Materials</span>
                  {uploadedDocs.length > 0 && (
                    <span className="px-1.5 py-0.2 bg-emerald-100 text-emerald-800 text-[10px] rounded-full font-bold">
                      {uploadedDocs.length}
                    </span>
                  )}
                </div>
                <div className="text-[11px] text-slate-500 leading-tight mt-0.5">
                  RAG-grounded in your PDFs, past papers & lecture notes
                </div>
              </div>
            </button>

            {/* Option B: Curriculum Mode */}
            <button
              type="button"
              onClick={() => setSourceMode('curriculum')}
              className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer flex items-start gap-3 ${
                sourceMode === 'curriculum'
                  ? 'bg-blue-50/60 border-blue-500 ring-2 ring-blue-500/20 text-slate-900'
                  : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-600'
              }`}
            >
              <GraduationCap className={`w-5 h-5 mt-0.5 shrink-0 ${sourceMode === 'curriculum' ? 'text-blue-600' : 'text-slate-400'}`} />
              <div>
                <div className="text-xs font-bold">Curriculum & Exam Board</div>
                <div className="text-[11px] text-slate-500 leading-tight mt-0.5">
                  Generate from {board.split(' (')[0]} {grade} standards
                </div>
              </div>
            </button>

            {/* Option C: Paste Custom Notes */}
            <button
              type="button"
              onClick={() => setSourceMode('custom_notes')}
              className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer flex items-start gap-3 ${
                sourceMode === 'custom_notes'
                  ? 'bg-indigo-50/60 border-indigo-500 ring-2 ring-indigo-500/20 text-slate-900'
                  : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-600'
              }`}
            >
              <FileText className={`w-5 h-5 mt-0.5 shrink-0 ${sourceMode === 'custom_notes' ? 'text-indigo-600' : 'text-slate-400'}`} />
              <div>
                <div className="text-xs font-bold">Paste Lecture Notes</div>
                <div className="text-[11px] text-slate-500 leading-tight mt-0.5">
                  Instant deck from raw text or class summaries
                </div>
              </div>
            </button>
          </div>
        </div>

        {/* Source Mode: Uploaded Materials (RAG Store) */}
        {sourceMode === 'uploaded_material' && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                <FileCheck2 className="w-4 h-4 text-emerald-600" />
                <span>Select Material(s) from your RAG Knowledge Base:</span>
                {uploadedDocs.length > 0 && (
                  <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-mono font-bold rounded-full">
                    {uploadedDocs.length} Materials
                  </span>
                )}
              </div>
              <button
                onClick={() => setShowQuickUpload(!showQuickUpload)}
                className="inline-flex items-center gap-1 text-xs text-emerald-700 hover:text-emerald-900 font-semibold cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Upload New Material</span>
              </button>
            </div>

            {/* Quick Upload Dropzone */}
            {showQuickUpload && (
              <div className="p-4 bg-emerald-50/60 border border-dashed border-emerald-300 rounded-xl space-y-3 animate-in fade-in duration-200">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-emerald-950">
                    Quick Upload Material into RAG Store
                  </span>
                  <button
                    onClick={() => setShowQuickUpload(false)}
                    className="text-emerald-700 hover:text-emerald-900 text-xs cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <p className="text-[11px] text-emerald-800">
                  Upload lecture handouts, past exam papers, or textbook chapters (PDF, TXT, MD). They will immediately be indexed and selected for flashcards.
                </p>
                <input
                  type="file"
                  ref={quickFileInputRef}
                  onChange={handleQuickFileUpload}
                  accept=".pdf,.txt,.md,.docx,.csv"
                  className="hidden"
                />
                <button
                  type="button"
                  disabled={isQuickIngesting}
                  onClick={() => quickFileInputRef.current?.click()}
                  className="w-full py-3 bg-white hover:bg-emerald-50 text-emerald-800 border border-emerald-300 font-semibold rounded-xl text-xs flex items-center justify-center gap-2 cursor-pointer shadow-xs disabled:opacity-50"
                >
                  <FileUp className="w-4 h-4 text-emerald-600" />
                  <span>{isQuickIngesting ? 'Extracting & Indexing Material...' : 'Browse / Drop File (PDF, TXT, MD)'}</span>
                </button>
              </div>
            )}

            {uploadedDocs.length === 0 ? (
              <div className="p-6 bg-slate-50 border border-dashed border-slate-200 rounded-xl text-center space-y-3">
                <FileText className="w-8 h-8 text-slate-400 mx-auto" />
                <div>
                  <div className="text-xs font-bold text-slate-700">No RAG Store Materials Found</div>
                  <div className="text-[11px] text-slate-500 mt-0.5 max-w-md mx-auto">
                    Upload your syllabus PDFs, class notes, or past papers to generate cards grounded strictly in your selected study materials.
                  </div>
                </div>
                <button
                  onClick={() => setShowQuickUpload(true)}
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold transition-colors cursor-pointer shadow-xs"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>Upload Study Material Now</span>
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {/* Search Bar for RAG Materials */}
                {uploadedDocs.length > 2 && (
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Search materials by title or subject..."
                      value={docSearchQuery}
                      onChange={(e) => setDocSearchQuery(e.target.value)}
                      className="w-full pl-9 pr-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-medium text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                    />
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                  </div>
                )}

                {/* Selection Status Banner */}
                <div className="p-2.5 bg-emerald-50/80 border border-emerald-200 rounded-xl flex items-center justify-between text-xs text-emerald-900 font-medium">
                  <div className="flex items-center gap-2 truncate">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span className="truncate">
                      {selectedDocTitles.includes('all') ? (
                        <>Grounded in: <strong>All {subject} RAG Store Materials</strong> ({uploadedDocs.reduce((acc, d) => acc + d.chunkCount, 0)} total chunks)</>
                      ) : (
                        <>Grounded in: <strong>{selectedDocTitles.length} Selected Material{selectedDocTitles.length !== 1 ? 's' : ''}</strong> ({selectedDocTitles.join(', ')})</>
                      )}
                    </span>
                  </div>
                  {!selectedDocTitles.includes('all') && (
                    <button
                      onClick={() => setSelectedDocTitles(['all'])}
                      className="text-[10px] font-bold text-emerald-700 hover:underline shrink-0 ml-2"
                    >
                      Reset to All
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-60 overflow-y-auto pr-1">
                  {/* Option for All Documents */}
                  <div
                    onClick={() => toggleSelectDoc('all')}
                    className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                      selectedDocTitles.includes('all')
                        ? 'bg-emerald-50 border-emerald-400 ring-2 ring-emerald-500/20'
                        : 'bg-slate-50 hover:bg-slate-100 border-slate-200'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="p-1.5 bg-emerald-100 text-emerald-700 rounded-lg">
                        <Folder className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-xs font-bold text-slate-800">
                          All RAG Store Materials
                        </div>
                        <div className="text-[10px] text-slate-500">
                          Synthesize across all indexed notes & past papers
                        </div>
                      </div>
                    </div>
                    {selectedDocTitles.includes('all') && (
                      <Check className="w-4 h-4 text-emerald-600 font-bold" />
                    )}
                  </div>

                  {/* Individual Filtered Documents */}
                  {uploadedDocs
                    .filter(doc => !docSearchQuery || doc.title.toLowerCase().includes(docSearchQuery.toLowerCase()) || doc.subject.toLowerCase().includes(docSearchQuery.toLowerCase()))
                    .map((doc) => {
                      const isSelected = !selectedDocTitles.includes('all') && (selectedDocTitles.includes(doc.title) || selectedDocTitles.includes(doc.id));
                      return (
                        <div
                          key={doc.id}
                          onClick={() => toggleSelectDoc(doc.title)}
                          className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                            isSelected
                              ? 'bg-emerald-50 border-emerald-400 ring-2 ring-emerald-500/20'
                              : 'bg-slate-50 hover:bg-slate-100 border-slate-200'
                          }`}
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div className={`p-1.5 rounded-lg shrink-0 ${isSelected ? 'bg-emerald-200 text-emerald-800' : 'bg-slate-200 text-slate-700'}`}>
                              <FileText className="w-4 h-4" />
                            </div>
                            <div className="min-w-0">
                              <div className="text-xs font-bold text-slate-800 truncate">
                                {doc.title}
                              </div>
                              <div className="text-[10px] text-slate-500 flex items-center gap-1.5">
                                <span className="font-semibold text-slate-600">{doc.subject}</span>
                                <span>•</span>
                                <span>{doc.chunkCount} chunks</span>
                              </div>
                            </div>
                          </div>
                          {isSelected && (
                            <Check className="w-4 h-4 text-emerald-600 font-bold shrink-0 ml-2" />
                          )}
                        </div>
                      );
                    })}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 text-xs pt-1">
                  <div className="sm:col-span-8">
                    <label className="block text-slate-600 font-semibold mb-1">
                      Focus Topic / Chapter within Material (Optional)
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. All concepts, or specific chapter..."
                      value={topic}
                      onChange={(e) => setTopic(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                    />
                  </div>

                  <div className="sm:col-span-4">
                    <label className="block text-slate-600 font-semibold mb-1">Card Count</label>
                    <div className="flex items-center gap-1.5">
                      {[4, 8, 12, 16].map((count) => (
                        <button
                          key={count}
                          type="button"
                          onClick={() => setNumCards(count)}
                          className={`flex-1 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer border ${
                            numCards === count
                              ? 'bg-emerald-600 text-white border-emerald-600'
                              : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                          }`}
                        >
                          {count}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Source Mode: Curriculum Standards */}
        {sourceMode === 'curriculum' && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 text-xs">
              <div className="sm:col-span-8">
                <label className="block text-slate-600 font-semibold mb-1">
                  Target Syllabus Topic / Core Concept
                </label>
                <input
                  type="text"
                  placeholder="e.g. Photosynthesis, Quadratic Equations, Doppler Effect, etc."
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-medium focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                />
              </div>

              <div className="sm:col-span-4">
                <label className="block text-slate-600 font-semibold mb-1">Card Count</label>
                <div className="flex items-center gap-1.5">
                  {[4, 8, 12, 16].map((count) => (
                    <button
                      key={count}
                      type="button"
                      onClick={() => setNumCards(count)}
                      className={`flex-1 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer border ${
                        numCards === count
                          ? 'bg-blue-600 text-white border-blue-600'
                          : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {count}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Suggested Presets */}
            <div className="pt-1">
              <div className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-500 mb-2">
                <Tag className="w-3 h-3 text-blue-600" />
                <span>Suggested High-Yield Topics for {subject} ({grade}):</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {(topicPresets[subject] || [
                  'Fundamental Principles & Definitions',
                  'Core Formulas, Derivations & Mechanisms',
                  'Advanced Multi-Step Exam Problems',
                  'Examiner Traps & Marking Criteria'
                ]).map((preset, pIdx) => (
                  <button
                    key={pIdx}
                    type="button"
                    onClick={() => setTopic(preset)}
                    className={`text-[11px] px-2.5 py-1.5 rounded-lg border transition-all cursor-pointer ${
                      topic === preset
                        ? 'bg-blue-50 text-blue-700 border-blue-300 font-semibold shadow-2xs'
                        : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {preset}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Source Mode: Custom Notes */}
        {sourceMode === 'custom_notes' && (
          <div className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 text-xs">
              <div className="sm:col-span-8">
                <label className="block text-slate-600 font-semibold mb-1">
                  Notes Title / Deck Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. Week 4 Bioenergetics Lecture Notes"
                  value={quickDocTitle}
                  onChange={(e) => setQuickDocTitle(e.target.value)}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                />
              </div>

              <div className="sm:col-span-4">
                <label className="block text-slate-600 font-semibold mb-1">Card Count</label>
                <div className="flex items-center gap-1.5">
                  {[4, 8, 12, 16].map((count) => (
                    <button
                      key={count}
                      type="button"
                      onClick={() => setNumCards(count)}
                      className={`flex-1 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer border ${
                        numCards === count
                          ? 'bg-indigo-600 text-white border-indigo-600'
                          : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {count}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div>
              <label className="block text-slate-600 font-semibold mb-1 text-xs">
                Paste Class Notes / Text Content
              </label>
              <textarea
                rows={4}
                value={quickNotesText}
                onChange={(e) => setQuickNotesText(e.target.value)}
                placeholder="Paste revision notes, key formulas, lecture transcript, or study summary here..."
                className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
              />
            </div>
          </div>
        )}

        {/* LLM Grounding Summary Bar */}
        <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-xs">
          <div className="flex flex-wrap items-center gap-2 text-slate-700">
            <span className="font-bold text-slate-900 flex items-center gap-1">
              <Brain className="w-3.5 h-3.5 text-blue-600" />
              <span>LLM Grounding Configured:</span>
            </span>
            <span className="px-2 py-0.5 bg-blue-100/80 text-blue-800 rounded-md font-semibold text-[11px] border border-blue-200">
              {board}
            </span>
            <span className="px-2 py-0.5 bg-purple-100/80 text-purple-800 rounded-md font-semibold text-[11px] border border-purple-200">
              {grade}
            </span>
            <span className="px-2 py-0.5 bg-indigo-100/80 text-indigo-800 rounded-md font-semibold text-[11px] border border-indigo-200">
              {subject}
            </span>
            {topic && (
              <span className="px-2 py-0.5 bg-emerald-100/80 text-emerald-800 rounded-md font-semibold text-[11px] border border-emerald-200 truncate max-w-[180px]">
                Topic: {topic}
              </span>
            )}
          </div>
          <div className="text-[11px] text-slate-500 font-medium shrink-0 flex items-center gap-1">
            <FileText className="w-3 h-3 text-slate-400" />
            <span>
              {sourceMode === 'uploaded_material' && `Embedded Material: ${selectedDocTitles.includes('all') ? 'All RAG Store Docs' : selectedDocTitles.join(', ')}`}
              {sourceMode === 'curriculum' && `Embedded Syllabus: ${board} (${country})`}
              {sourceMode === 'custom_notes' && 'Embedded Notes: Custom Text'}
            </span>
          </div>
        </div>

        {/* Generate Action Button */}
        <div className="pt-2 flex items-center justify-between gap-4">
          <div className="text-xs text-slate-500 hidden sm:block">
            {sourceMode === 'uploaded_material' && `Grounded in ${selectedDocTitles.includes('all') ? 'All Uploaded RAG Materials' : selectedDocTitles.join(', ')}`}
            {sourceMode === 'curriculum' && `Aligned to ${board.split(' (')[0]} • ${grade} • ${subject}`}
            {sourceMode === 'custom_notes' && 'Instant deck generation from pasted text'}
          </div>

          <button
            onClick={handleGenerateCards}
            disabled={isLoading || (sourceMode === 'custom_notes' && !quickNotesText.trim())}
            className={`w-full sm:w-auto px-6 py-3 rounded-xl font-bold text-xs text-white transition-all cursor-pointer flex items-center justify-center gap-2 shadow-xs disabled:opacity-50 ${
              sourceMode === 'uploaded_material'
                ? 'bg-emerald-600 hover:bg-emerald-700'
                : sourceMode === 'custom_notes'
                ? 'bg-indigo-600 hover:bg-indigo-700'
                : 'bg-blue-600 hover:bg-blue-700'
            }`}
          >
            <Sparkles className="w-4 h-4 text-white/90 animate-pulse" />
            <span>{isLoading ? 'Synthesizing Grounded Flashcards...' : `Generate ${numCards} Grounded Flashcards`}</span>
          </button>
        </div>
      </div>

      {/* 4. Flashcard Study Stage & Deck Viewer */}
      {flashcards.length > 0 && (
        <div className="space-y-5">
          
          {/* Deck Controls & Mode Toggles */}
          <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3">
            
            {/* View Mode Selector */}
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
              <button
                onClick={() => setStudyMode('flip')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  studyMode === 'flip'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <RotateCw className="w-3.5 h-3.5 text-blue-600" />
                <span>3D Flip Mode</span>
              </button>

              <button
                onClick={() => setStudyMode('quiz')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  studyMode === 'quiz'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Play className="w-3.5 h-3.5 text-emerald-600" />
                <span>Self-Quiz Mode</span>
              </button>

              <button
                onClick={() => setStudyMode('list')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  studyMode === 'list'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Grid className="w-3.5 h-3.5 text-indigo-600" />
                <span>All Cards ({flashcards.length})</span>
              </button>
            </div>

            {/* Deck Operations */}
            <div className="flex items-center gap-2">
              <button
                onClick={handleShuffle}
                title="Shuffle Deck"
                className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition-colors cursor-pointer"
              >
                <Shuffle className="w-4 h-4" />
              </button>

              <button
                onClick={handleExportJSON}
                title="Export JSON for Anki / Quizlet"
                className="inline-flex items-center gap-1 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
              >
                <Download className="w-3.5 h-3.5 text-slate-500" />
                <span>Anki Export</span>
              </button>

              <div className="h-4 w-px bg-slate-200 mx-1" />

              <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 bg-amber-50 px-2.5 py-1 rounded-xl border border-amber-200">
                <Award className="w-4 h-4 text-amber-500" />
                <span>{masteredIds.size} / {flashcards.length} Mastered</span>
              </div>
            </div>
          </div>

          {/* MODE A: 3D Flip Card View */}
          {studyMode === 'flip' && (
            <div className="flex flex-col items-center space-y-5">
              
              {/* Progress & Metadata Bar */}
              <div className="w-full max-w-2xl space-y-1.5">
                <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-800">Card {currentIndex + 1} of {flashcards.length}</span>
                    {currentCard.difficulty && (
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        currentCard.difficulty === 'Foundational' ? 'bg-emerald-100 text-emerald-800' :
                        currentCard.difficulty === 'Mastery' ? 'bg-purple-100 text-purple-800' :
                        currentCard.difficulty === 'Exam-Trap' ? 'bg-rose-100 text-rose-800' :
                        'bg-blue-100 text-blue-800'
                      }`}>
                        {currentCard.difficulty}
                      </span>
                    )}
                    {currentCard.cognitive_level && (
                      <span className="text-[10px] text-slate-400 border border-slate-200 px-1.5 py-0.2 rounded-md">
                        {currentCard.cognitive_level}
                      </span>
                    )}
                  </div>
                  <span>{Math.round((masteredIds.size / flashcards.length) * 100)}% Mastered</span>
                </div>

                <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-emerald-500 transition-all duration-300 rounded-full"
                    style={{ width: `${(masteredIds.size / flashcards.length) * 100}%` }}
                  />
                </div>
              </div>

              {/* 3D Flip Card Container */}
              <div
                onClick={handleFlip}
                className="w-full max-w-2xl min-h-[380px] perspective-1000 cursor-pointer select-none"
              >
                <div
                  className={`w-full min-h-[380px] relative transition-transform duration-500 transform-style-preserve-3d rounded-3xl shadow-lg border border-slate-200 ${
                    isFlipped ? 'rotate-y-180' : ''
                  }`}
                >
                  {/* FRONT SIDE: Question & Weakness Hook */}
                  <div className="absolute inset-0 bg-white rounded-3xl p-7 backface-hidden flex flex-col justify-between overflow-y-auto">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="px-2.5 py-1 bg-blue-50 text-blue-700 text-[11px] font-bold rounded-lg border border-blue-200/60 uppercase tracking-wider">
                          Question • {currentCard.topic || subject}
                        </span>

                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleSpeakCard(currentCard.question);
                            }}
                            className="p-1.5 text-slate-400 hover:text-blue-600 rounded-lg hover:bg-slate-100 transition-colors"
                            title="Read question out loud"
                          >
                            {isSpeaking ? <VolumeX className="w-4 h-4 text-blue-600 animate-pulse" /> : <Volume2 className="w-4 h-4" />}
                          </button>
                          <span className="text-xs text-slate-400 flex items-center gap-1">
                            <RotateCw className="w-3.5 h-3.5" /> Tap to reveal answer
                          </span>
                        </div>
                      </div>


                    </div>

                    <div className="my-auto py-4 text-center px-4">
                      <div className="text-lg sm:text-xl font-bold text-slate-900 leading-snug">
                        <MarkdownRenderer content={currentCard.question} />
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-4 border-t border-slate-100 text-xs text-slate-400">
                      <span className="truncate max-w-[320px]">
                        {currentCard.source?.includes('pdf') ? '📄 ' : '📘 '}
                        {currentCard.source || `${board} ${grade} Specification`}
                      </span>
                      {isMastered ? (
                        <span className="text-emerald-600 font-semibold flex items-center gap-1">
                          <CheckCircle2 className="w-4 h-4" /> Mastered
                        </span>
                      ) : (
                        <span className="text-slate-400">Space / Click to Flip</span>
                      )}
                    </div>
                  </div>

                  {/* BACK SIDE: Answer, Key Formula, Tutor Tip & Deep Dive */}
                  <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-950 text-white rounded-3xl p-7 backface-hidden rotate-y-180 flex flex-col justify-between shadow-xl overflow-y-auto">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="px-2.5 py-1 bg-indigo-500/30 text-indigo-200 text-[11px] font-bold rounded-lg border border-indigo-400/40 uppercase tracking-wider">
                          Official Model Answer
                        </span>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleSpeakCard(currentCard.answer);
                            }}
                            className="p-1.5 text-indigo-300 hover:text-white rounded-lg hover:bg-white/10 transition-colors"
                            title="Read answer out loud"
                          >
                            {isSpeaking ? <VolumeX className="w-4 h-4 text-indigo-300 animate-pulse" /> : <Volume2 className="w-4 h-4" />}
                          </button>
                          <span className="text-xs text-indigo-200/70 flex items-center gap-1">
                            <RotateCw className="w-3.5 h-3.5" /> Tap to view question
                          </span>
                        </div>
                      </div>

                      {/* Key Formula Callout if available */}
                      {currentCard.key_formula && (
                        <div className="p-2.5 bg-indigo-900/60 border border-indigo-500/40 rounded-xl text-xs text-indigo-100 flex items-center gap-2">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-300">Key Formula:</span>
                          <span className="font-mono">{currentCard.key_formula}</span>
                        </div>
                      )}
                    </div>

                    <div className="my-auto py-3 px-2 overflow-y-auto max-h-48 text-left">
                      <div className="text-sm sm:text-base font-medium text-slate-100 leading-relaxed">
                        <MarkdownRenderer content={currentCard.answer} />
                      </div>

                      {/* AI Tutor Tip / Examiner Trap */}
                      {currentCard.tutor_tip && (
                        <div className="mt-3 p-3 bg-amber-500/20 border border-amber-400/30 rounded-xl text-xs text-amber-200 flex items-start gap-2">
                          <Lightbulb className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                          <div className="leading-snug">{currentCard.tutor_tip}</div>
                        </div>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-2 pt-4 border-t border-indigo-800/80">
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleAskTutorDeepDive(currentCard);
                          }}
                          className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 shadow-xs cursor-pointer"
                        >
                          <MessageSquare className="w-3.5 h-3.5" />
                          <span>Ask AI Tutor Deep-Dive</span>
                        </button>
                      </div>

                      <button
                        type="button"
                        onClick={handleMasterCard}
                        className="px-4 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-xs cursor-pointer"
                      >
                        <CheckCircle2 className="w-4 h-4" /> Mark as Mastered
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Navigation Controls */}
              <div className="flex items-center gap-4">
                <button
                  onClick={handlePrev}
                  className="p-3.5 bg-white hover:bg-slate-100 text-slate-700 rounded-2xl border border-slate-200 shadow-xs transition-colors cursor-pointer"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <button
                  onClick={handleFlip}
                  className="px-8 py-3.5 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl font-bold text-xs transition-colors flex items-center gap-2 shadow-xs cursor-pointer"
                >
                  <RotateCw className="w-4 h-4" />
                  <span>{isFlipped ? 'Show Question' : 'Reveal Answer'}</span>
                </button>
                <button
                  onClick={handleNext}
                  className="p-3.5 bg-white hover:bg-slate-100 text-slate-700 rounded-2xl border border-slate-200 shadow-xs transition-colors cursor-pointer"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            </div>
          )}

          {/* MODE B: Self-Quiz Active Recall Mode */}
          {studyMode === 'quiz' && (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 max-w-2xl mx-auto space-y-6">
              <div className="flex items-center justify-between text-xs text-slate-500">
                <span className="font-bold text-slate-700">Quiz Card {currentIndex + 1} of {flashcards.length}</span>
                <span>Topic: {currentCard.topic || subject}</span>
              </div>

              <div className="p-5 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                <div className="text-xs font-bold text-blue-600 uppercase tracking-wider">Active Recall Question</div>
                <div className="text-base font-bold text-slate-900 leading-snug">
                  <MarkdownRenderer content={currentCard.question} />
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-xs font-semibold text-slate-600">
                  Type your recall answer (or key derivations and terminology):
                </label>
                <textarea
                  rows={3}
                  value={quizInput}
                  onChange={(e) => setQuizInput(e.target.value)}
                  placeholder="Test your active recall before revealing the answer..."
                  className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                />
              </div>

              {!isAnswerRevealed ? (
                <button
                  onClick={() => setIsAnswerRevealed(true)}
                  className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer shadow-xs flex items-center justify-center gap-2"
                >
                  <Eye className="w-4 h-4" />
                  <span>Check Model Answer</span>
                </button>
              ) : (
                <div className="space-y-4 animate-in fade-in duration-200">
                  <div className="p-5 bg-emerald-50 border border-emerald-200 rounded-xl space-y-3">
                    <div className="text-xs font-bold text-emerald-900 flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <span>Official Syllabus Model Answer:</span>
                    </div>
                    <div className="text-xs text-emerald-950 font-medium leading-relaxed">
                      <MarkdownRenderer content={currentCard.answer} />
                    </div>
                    {currentCard.tutor_tip && (
                      <div className="p-2.5 bg-white/80 border border-emerald-300 rounded-lg text-xs text-emerald-900 font-medium">
                        {currentCard.tutor_tip}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-3">
                    <button
                      onClick={handleMasterCard}
                      className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer shadow-xs"
                    >
                      I Got This Right (Mastered)
                    </button>
                    <button
                      onClick={handleNext}
                      className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
                    >
                      Next Question →
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* MODE C: List View of All Cards with Search & Filters */}
          {studyMode === 'list' && (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="relative flex-1 max-w-sm">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Search cards in this deck..."
                    value={listSearchQuery}
                    onChange={(e) => setListSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <select
                    value={difficultyFilter}
                    onChange={(e) => setDifficultyFilter(e.target.value)}
                    className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-700 cursor-pointer"
                  >
                    <option value="all">All Difficulties</option>
                    <option value="Foundational">Foundational</option>
                    <option value="Intermediate">Intermediate</option>
                    <option value="Mastery">Mastery</option>
                    <option value="Exam-Trap">Exam-Trap</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {flashcards
                  .filter(c => {
                    const matchesSearch = !listSearchQuery || 
                      c.question.toLowerCase().includes(listSearchQuery.toLowerCase()) ||
                      c.answer.toLowerCase().includes(listSearchQuery.toLowerCase());
                    const matchesDiff = difficultyFilter === 'all' || c.difficulty === difficultyFilter;
                    return matchesSearch && matchesDiff;
                  })
                  .map((card, idx) => (
                    <div
                      key={idx}
                      className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between space-y-3"
                    >
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="px-2 py-0.5 bg-blue-50 text-blue-700 text-[10px] font-bold rounded-md uppercase tracking-wider">
                            Card #{idx + 1} • {card.topic || subject}
                          </span>
                          {masteredIds.has(idx) && (
                            <span className="text-emerald-600 text-[11px] font-bold flex items-center gap-1">
                              <CheckCircle2 className="w-3.5 h-3.5" /> Mastered
                            </span>
                          )}
                        </div>
                        <h4 className="text-sm font-bold text-slate-900 leading-snug">
                          <MarkdownRenderer content={card.question} />
                        </h4>
                        <div className="text-xs text-slate-600 leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-100">
                          <MarkdownRenderer content={card.answer} />
                        </div>
                        {card.tutor_tip && (
                          <div className="text-[11px] text-amber-800 bg-amber-50 p-2 rounded-lg border border-amber-200">
                            {card.tutor_tip}
                          </div>
                        )}
                      </div>

                      <div className="text-[10px] text-slate-400 pt-2 border-t border-slate-100 flex items-center justify-between">
                        <span className="truncate max-w-[200px]">
                          {card.source || 'Syllabus Grounded'}
                        </span>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleAskTutorDeepDive(card)}
                            className="text-xs text-indigo-600 hover:text-indigo-800 font-semibold cursor-pointer"
                          >
                            AI Explain
                          </button>
                          <button
                            onClick={() => {
                              const updated = new Set(masteredIds);
                              if (updated.has(idx)) {
                                updated.delete(idx);
                              } else {
                                updated.add(idx);
                              }
                              setMasteredIds(updated);
                            }}
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-md cursor-pointer transition-colors ${
                              masteredIds.has(idx)
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                            }`}
                          >
                            {masteredIds.has(idx) ? 'Mastered ✓' : 'Mark Mastered'}
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          )}

        </div>
      )}

      {/* 5. AI Tutor Deep-Dive Modal */}
      {deepDiveCard && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-2xl w-full max-h-[85vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-5 bg-gradient-to-r from-indigo-900 to-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-indigo-500/30 rounded-xl">
                  <Brain className="w-5 h-5 text-indigo-300" />
                </div>
                <div>
                  <h3 className="text-sm font-bold">AI Tutor Concept Masterclass</h3>
                  <p className="text-[11px] text-indigo-200/80">{subject} • {deepDiveCard.topic || topic}</p>
                </div>
              </div>
              <button
                onClick={() => setDeepDiveCard(null)}
                className="p-1 text-slate-400 hover:text-white rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-4 flex-1">
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl">
                <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-wider block mb-1">
                  Card Prompt
                </span>
                <p className="text-sm font-bold text-slate-900">
                  {deepDiveCard.question}
                </p>
              </div>

              {isTutorExplaining ? (
                <div className="py-12 text-center space-y-3">
                  <div className="w-8 h-8 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto" />
                  <p className="text-xs font-semibold text-slate-600">
                    AI Tutor is formulating step-by-step intuitive proof & examiner pitfalls...
                  </p>
                </div>
              ) : (
                <div className="text-xs leading-relaxed text-slate-800 space-y-3">
                  <MarkdownRenderer content={tutorExplanation} />
                </div>
              )}
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
              <span className="text-xs text-slate-500">
                Socratic AI Tutor Explanation • Exam Specification Standard
              </span>
              <button
                onClick={() => setDeepDiveCard(null)}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl cursor-pointer"
              >
                Got It, Return to Flashcards
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
