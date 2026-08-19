import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Flashcard, IngestedDocument } from '../types';
import { 
  GLOBAL_SUBJECT_CATEGORIES, 
  ALL_FLAT_SUBJECTS
} from '../data/curriculumData';
import { GlobalCurriculumPicker } from './GlobalCurriculumPicker';
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
  X
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
    return localStorage.getItem('eduai_subject') || 'Biology';
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

  // 2. Generation Source & Topic Configuration
  const [sourceMode, setSourceMode] = useState<'curriculum' | 'uploaded_material' | 'custom_notes'>('curriculum');
  const [topic, setTopic] = useState('Photosynthesis & Cellular Respiration');
  const [numCards, setNumCards] = useState<number>(8);
  const [isLoading, setIsLoading] = useState(false);

  // 3. Uploaded Materials State
  const [uploadedDocs, setUploadedDocs] = useState<IngestedDocument[]>([]);
  const [selectedDocId, setSelectedDocId] = useState<string>('all');

  // Quick In-Page Note / File Ingestion State
  const [showQuickUpload, setShowQuickUpload] = useState(false);
  const [quickNotesText, setQuickNotesText] = useState('');
  const [quickDocTitle, setQuickDocTitle] = useState('');
  const [isQuickIngesting, setIsQuickIngesting] = useState(false);
  const quickFileInputRef = useRef<HTMLInputElement>(null);

  // Fetch uploaded documents
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
  }, []);

  // 4. Study Mode & Active Deck State
  const [studyMode, setStudyMode] = useState<'flip' | 'quiz' | 'list'>('flip');
  const [flashcards, setFlashcards] = useState<Flashcard[]>([
    {
      id: '1',
      question: 'Where do the light-dependent reactions of photosynthesis occur in chloroplasts?',
      answer: 'On the thylakoid membranes within chloroplasts, where chlorophyll pigments absorb photon energy and photolyze water.',
      topic: 'Photosynthesis',
      source: 'Cambridge_International_AS_A_Level_Biology_9700.pdf, p. 42'
    },
    {
      id: '2',
      question: 'What enzyme catalyzes carbon fixation in the Calvin cycle?',
      answer: 'RuBisCO (Ribulose-1,5-bisphosphate carboxylase-oxygenase) attaches atmospheric CO2 to the 5-carbon sugar RuBP.',
      topic: 'Photosynthesis',
      source: 'Cambridge_International_AS_A_Level_Biology_9700.pdf, p. 42'
    },
    {
      id: '3',
      question: 'What is the net ATP yield from one molecule of glucose during glycolysis?',
      answer: 'Net yield is 2 ATP molecules (4 produced, 2 invested in phosphorylation) along with 2 NADH and 2 Pyruvate molecules.',
      topic: 'Cellular Respiration',
      source: 'Cambridge_International_AS_A_Level_Biology_9700.pdf, p. 65'
    },
    {
      id: '4',
      question: 'State the final electron acceptor in the mitochondrial electron transport chain.',
      answer: 'Molecular Oxygen (O2), which binds electrons and matrix protons (H+) to produce water (H2O).',
      topic: 'Cellular Respiration',
      source: 'Cambridge_International_AS_A_Level_Biology_9700.pdf, p. 65'
    }
  ]);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [masteredIds, setMasteredIds] = useState<Set<number>>(new Set());

  // Quiz Mode self-testing state
  const [quizInput, setQuizInput] = useState('');
  const [isAnswerRevealed, setIsAnswerRevealed] = useState(false);
  const [listSearchQuery, setListSearchQuery] = useState('');

  // 5. Dynamic Topic Presets Aligned with Grade, Board & Subject
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
    ],
    'World History': [
      'Causes and Consequences of World War I',
      'The Industrial Revolution & Socioeconomic Transformation',
      'Cold War Geopolitics, Nuclear Deterrence & Decolonization',
      'The Enlightenment & Social Contract Theories',
      'The Age of Revolutions (American, French & Haitian)',
      'Imperialism and Global Resistance Movements'
    ],
    'Psychology': [
      'Classical & Operant Conditioning (Pavlov, Skinner)',
      'Memory Models: Multi-Store Model & Working Memory',
      'Cognitive Biases, Heuristics & Schema Theory',
      'Neurotransmitters & Brain Hemispheric Lateralization',
      'Piaget\'s & Vygotsky\'s Theories of Cognitive Development',
      'Social Influence, Conformity & Asch/Milgram Experiments'
    ]
  }), []);

  // Generate Flashcards Action
  const handleGenerateCards = async () => {
    if (sourceMode === 'curriculum' && !topic.trim()) return;
    if (sourceMode === 'custom_notes' && !quickNotesText.trim()) return;

    setIsLoading(true);
    try {
      const selectedDoc = uploadedDocs.find(d => d.id === selectedDocId || d.title === selectedDocId);
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
        payload.selected_document = selectedDocId === 'all' ? 'all' : (selectedDoc?.title || selectedDocId);
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
      }
    } catch (err: any) {
      console.error('Flashcard generation error:', err);
      alert('Failed to generate flashcards. Please try again.');
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
          setSelectedDocId(file.name);
          setSourceMode('uploaded_material');
          setShowQuickUpload(false);
          // Confetti celebration
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

  const handleFlip = () => {
    setIsFlipped(!isFlipped);
  };

  const handleNext = () => {
    setIsFlipped(false);
    setIsAnswerRevealed(false);
    setQuizInput('');
    setCurrentIndex((prev) => (prev + 1) % flashcards.length);
  };

  const handlePrev = () => {
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

  const handleMasterCard = (e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = new Set(masteredIds);
    updated.add(currentIndex);
    setMasteredIds(updated);

    // Confetti effect
    confetti({
      particleCount: 50,
      spread: 60,
      origin: { y: 0.7 }
    });

    // Auto advance
    setTimeout(() => {
      handleNext();
    }, 450);
  };

  // PDF Export
  const handleExportPDF = () => {
    const doc = new jsPDF();
    
    // Header Banner
    doc.setFillColor(30, 41, 59);
    doc.rect(0, 0, 210, 36, 'F');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.setTextColor(255, 255, 255);
    doc.text(`EduAI Exam Flashcard Pack: ${subject}`, 14, 18);

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(203, 213, 225);
    doc.text(`Curriculum: ${board} (${country}) • ${grade} • Topic: ${topic || 'Core Review'}`, 14, 28);

    let y = 46;
    flashcards.forEach((card, idx) => {
      if (y > 240) {
        doc.addPage();
        y = 20;
      }

      // Card container box
      doc.setFillColor(248, 250, 252);
      doc.setDrawColor(226, 232, 240);
      doc.roundedRect(14, y, 182, 38, 3, 3, 'FD');

      // Question
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10.5);
      doc.setTextColor(15, 23, 42);
      doc.text(`Q${idx + 1}: ${card.question}`, 18, y + 9, { maxWidth: 172 });

      // Answer
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9.5);
      doc.setTextColor(51, 65, 85);
      doc.text(`A: ${card.answer}`, 18, y + 22, { maxWidth: 172 });

      // Source footer tag
      doc.setFontSize(7.5);
      doc.setTextColor(100, 116, 139);
      doc.text(`Source: ${card.source || 'Syllabus Context'}`, 18, y + 33);

      y += 44;
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

  // Quick subject list for the active curriculum
  const coreSubjectsForCurriculum = [
    'Biology',
    'Mathematics',
    'Physics',
    'Chemistry',
    'Computer Science',
    'Economics',
    'World History',
    'Psychology'
  ];

  return (
    <div className="max-w-5xl mx-auto py-8 px-4 sm:px-6 lg:px-8 space-y-6">
      
      {/* 1. Unified Curriculum Banner & Alignment Bar */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-blue-600 text-white rounded-xl shadow-xs">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <span>AI Exam Flashcard Engine</span>
                <span className="px-2 py-0.5 bg-blue-50 text-blue-700 text-[11px] font-semibold rounded-md border border-blue-200">
                  RAG & Syllabus Grounded
                </span>
              </h1>
              <p className="text-xs text-slate-500">
                Generate high-yield recall flashcards aligned with your official curriculum or grounded in your uploaded materials.
              </p>
            </div>
          </div>

          {/* Curriculum Quick Status & Switcher */}
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
                Close Picker
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

        {/* Dynamic Subject Tabs Aligned with Curriculum */}
        <div className="space-y-2 pt-2 border-t border-slate-100">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Select Subject for {board.split(' (')[0]}:
            </span>
            <span className="text-[11px] text-blue-600 font-medium">
              Current: {subject}
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

            {/* Comprehensive Subject Selector Dropdown */}
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
              <option value="">More Subjects ({ALL_FLAT_SUBJECTS.length}+)...</option>
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

      {/* 2. Source Selection & Generation Controls */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-5">
        
        {/* Source Mode Switcher */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
            Flashcard Generation Source
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            {/* Option A: Curriculum Mode */}
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

            {/* Option B: Uploaded Materials Mode */}
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
                  <span>My Uploaded Materials</span>
                  {uploadedDocs.length > 0 && (
                    <span className="px-1.5 py-0.2 bg-emerald-100 text-emerald-800 text-[10px] rounded-full font-bold">
                      {uploadedDocs.length}
                    </span>
                  )}
                </div>
                <div className="text-[11px] text-slate-500 leading-tight mt-0.5">
                  Grounded strictly in your PDFs & notes
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

        {/* Source-Specific Inputs */}
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
                  {[5, 8, 12, 16].map((count) => (
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

            {/* Suggested High-Yield Topic Presets */}
            <div className="pt-2">
              <div className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-500 mb-2">
                <Tag className="w-3 h-3 text-blue-600" />
                <span>Suggested High-Yield Syllabus Topics for {subject} ({grade}):</span>
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

        {/* Source Mode: Uploaded Materials */}
        {sourceMode === 'uploaded_material' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                <FileCheck2 className="w-4 h-4 text-emerald-600" />
                <span>Select from Your Uploaded Documents & Notes:</span>
              </div>
              <button
                onClick={() => setShowQuickUpload(!showQuickUpload)}
                className="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 font-semibold cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Upload New Material</span>
              </button>
            </div>

            {/* Quick Upload Dropzone if expanded */}
            {showQuickUpload && (
              <div className="p-4 bg-emerald-50/50 border border-dashed border-emerald-300 rounded-xl space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-emerald-900">
                    Quick Upload Document for Instant Flashcards
                  </span>
                  <button
                    onClick={() => setShowQuickUpload(false)}
                    className="text-emerald-700 hover:text-emerald-900 text-xs"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <p className="text-[11px] text-emerald-800">
                  Upload lecture handouts, textbook chapters, or class summaries (PDF, TXT, MD). They will be indexed into your personal library.
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
                  <span>{isQuickIngesting ? 'Extracting & Indexing...' : 'Browse / Drop File (PDF, TXT, MD)'}</span>
                </button>
              </div>
            )}

            {uploadedDocs.length === 0 ? (
              <div className="p-6 bg-slate-50 border border-dashed border-slate-200 rounded-xl text-center space-y-3">
                <FileText className="w-8 h-8 text-slate-400 mx-auto" />
                <div>
                  <div className="text-xs font-bold text-slate-700">No Uploaded Materials Found Yet</div>
                  <div className="text-[11px] text-slate-500 mt-0.5">
                    Upload your class notes, syllabus PDF, or textbook chapter to generate cards strictly from your materials.
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
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-56 overflow-y-auto pr-1">
                  {/* Option for All Documents under current subject */}
                  <div
                    onClick={() => setSelectedDocId('all')}
                    className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                      selectedDocId === 'all'
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
                          All Uploaded {subject} Materials
                        </div>
                        <div className="text-[10px] text-slate-500">
                          Synthesize across all indexed notes & chapters
                        </div>
                      </div>
                    </div>
                    {selectedDocId === 'all' && (
                      <Check className="w-4 h-4 text-emerald-600 font-bold" />
                    )}
                  </div>

                  {/* Individual Documents */}
                  {uploadedDocs.map((doc) => {
                    const isSelected = selectedDocId === doc.id || selectedDocId === doc.title;
                    return (
                      <div
                        key={doc.id}
                        onClick={() => setSelectedDocId(doc.title)}
                        className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                          isSelected
                            ? 'bg-emerald-50 border-emerald-400 ring-2 ring-emerald-500/20'
                            : 'bg-slate-50 hover:bg-slate-100 border-slate-200'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="p-1.5 bg-slate-200 text-slate-700 rounded-lg shrink-0">
                            <FileText className="w-4 h-4 text-slate-600" />
                          </div>
                          <div className="min-w-0">
                            <div className="text-xs font-bold text-slate-800 truncate">
                              {doc.title}
                            </div>
                            <div className="text-[10px] text-slate-500 flex items-center gap-2">
                              <span>{doc.subject}</span>
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
                      {[5, 8, 12, 16].map((count) => (
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

        {/* Source Mode: Custom Notes Scratchpad */}
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
                  {[5, 8, 12, 16].map((count) => (
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

        {/* Generate Action Button */}
        <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-4">
          <div className="text-xs text-slate-500 hidden sm:block">
            {sourceMode === 'curriculum' && `Aligned to ${board.split(' (')[0]} • ${grade} • ${subject}`}
            {sourceMode === 'uploaded_material' && `Grounded in ${selectedDocId === 'all' ? 'All Uploaded Materials' : selectedDocId}`}
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
            <span>{isLoading ? 'Synthesizing High-Yield Cards...' : `Generate ${numCards} Exam Flashcards`}</span>
          </button>
        </div>
      </div>

      {/* 3. Flashcard Study Stage & Deck Viewer */}
      {flashcards.length > 0 && (
        <div className="space-y-5">
          
          {/* Deck Controls & Study Mode Toggles */}
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
                title="Export JSON for Anki"
                className="inline-flex items-center gap-1 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
              >
                <Download className="w-3.5 h-3.5 text-slate-500" />
                <span>Anki JSON</span>
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
            <div className="flex flex-col items-center space-y-6">
              
              {/* Progress Bar */}
              <div className="w-full max-w-xl space-y-1.5">
                <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
                  <span>Card {currentIndex + 1} of {flashcards.length}</span>
                  <span>{Math.round((masteredIds.size / flashcards.length) * 100)}% Mastery</span>
                </div>
                <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-emerald-500 transition-all duration-300 rounded-full"
                    style={{ width: `${(masteredIds.size / flashcards.length) * 100}%` }}
                  />
                </div>
              </div>

              {/* 3D Flip Card Stage */}
              <div
                onClick={handleFlip}
                className="w-full max-w-xl h-88 perspective-1000 cursor-pointer select-none"
              >
                <div
                  className={`w-full h-full relative transition-transform duration-500 transform-style-preserve-3d rounded-3xl shadow-md border border-slate-200 ${
                    isFlipped ? 'rotate-y-180' : ''
                  }`}
                >
                  {/* Front Side (Question) */}
                  <div className="absolute inset-0 bg-white rounded-3xl p-8 backface-hidden flex flex-col justify-between">
                    <div className="flex items-center justify-between">
                      <span className="px-2.5 py-1 bg-blue-50 text-blue-700 text-[11px] font-bold rounded-lg border border-blue-200/60 uppercase tracking-wider">
                        Question • {currentCard.topic || subject}
                      </span>
                      <span className="text-xs text-slate-400 flex items-center gap-1">
                        <RotateCw className="w-3.5 h-3.5" /> Tap to reveal answer
                      </span>
                    </div>

                    <div className="my-auto text-center px-4">
                      <h3 className="text-xl sm:text-2xl font-bold text-slate-900 leading-snug">
                        {currentCard.question}
                      </h3>
                    </div>

                    <div className="flex items-center justify-between pt-4 border-t border-slate-100 text-xs text-slate-400">
                      <span className="truncate max-w-[300px]">
                        {currentCard.source?.includes('pdf') ? '📄 ' : '📘 '}
                        {currentCard.source || `${board} ${grade} Specification`}
                      </span>
                      {isMastered && (
                        <span className="text-emerald-600 font-semibold flex items-center gap-1">
                          <CheckCircle2 className="w-4 h-4" /> Mastered
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Back Side (Answer) */}
                  <div className="absolute inset-0 bg-gradient-to-br from-indigo-950 via-slate-900 to-slate-950 text-white rounded-3xl p-8 backface-hidden rotate-y-180 flex flex-col justify-between shadow-xl">
                    <div className="flex items-center justify-between">
                      <span className="px-2.5 py-1 bg-indigo-500/30 text-indigo-200 text-[11px] font-bold rounded-lg border border-indigo-400/40 uppercase tracking-wider">
                        Key Answer & Explanation
                      </span>
                      <span className="text-xs text-indigo-200/70 flex items-center gap-1">
                        <RotateCw className="w-3.5 h-3.5" /> Tap to view question
                      </span>
                    </div>

                    <div className="my-auto text-center px-4 overflow-y-auto max-h-48">
                      <p className="text-base sm:text-lg font-medium text-slate-100 leading-relaxed">
                        {currentCard.answer}
                      </p>
                    </div>

                    <div className="flex items-center justify-between pt-4 border-t border-indigo-800/80">
                      <button
                        onClick={handleMasterCard}
                        className="px-4 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-xs cursor-pointer"
                      >
                        <CheckCircle2 className="w-4 h-4" /> Mark as Mastered
                      </button>
                      <span className="text-xs text-indigo-300">
                        {currentCard.topic || subject}
                      </span>
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

          {/* MODE B: Self-Quiz Testing Mode */}
          {studyMode === 'quiz' && (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 max-w-2xl mx-auto space-y-6">
              <div className="flex items-center justify-between text-xs text-slate-500">
                <span className="font-bold text-slate-700">Quiz Question {currentIndex + 1} / {flashcards.length}</span>
                <span>Topic: {currentCard.topic || subject}</span>
              </div>

              <div className="p-5 bg-slate-50 rounded-2xl border border-slate-200">
                <h3 className="text-lg font-bold text-slate-900 leading-snug">
                  {currentCard.question}
                </h3>
              </div>

              <div className="space-y-2">
                <label className="block text-xs font-semibold text-slate-600">
                  Type your recall answer (or state key terms):
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
                  <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl space-y-1.5">
                    <div className="text-xs font-bold text-emerald-900 flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <span>Official Syllabus Answer & Key Points:</span>
                    </div>
                    <p className="text-xs text-emerald-950 font-medium leading-relaxed">
                      {currentCard.answer}
                    </p>
                    <div className="text-[10px] text-emerald-700 pt-1">
                      Source: {currentCard.source || `${board} Specification`}
                    </div>
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

          {/* MODE C: List View of All Cards */}
          {studyMode === 'list' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between gap-3">
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
                <div className="text-xs text-slate-500">
                  Showing {flashcards.filter(c => 
                    !listSearchQuery || 
                    c.question.toLowerCase().includes(listSearchQuery.toLowerCase()) ||
                    c.answer.toLowerCase().includes(listSearchQuery.toLowerCase())
                  ).length} of {flashcards.length} cards
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {flashcards
                  .filter(c => 
                    !listSearchQuery || 
                    c.question.toLowerCase().includes(listSearchQuery.toLowerCase()) ||
                    c.answer.toLowerCase().includes(listSearchQuery.toLowerCase())
                  )
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
                          {card.question}
                        </h4>
                        <p className="text-xs text-slate-600 leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-100">
                          {card.answer}
                        </p>
                      </div>

                      <div className="text-[10px] text-slate-400 pt-2 border-t border-slate-100 flex items-center justify-between">
                        <span className="truncate max-w-[220px]">
                          {card.source || 'Syllabus Context'}
                        </span>
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
                  ))}
              </div>
            </div>
          )}

        </div>
      )}

    </div>
  );
};
