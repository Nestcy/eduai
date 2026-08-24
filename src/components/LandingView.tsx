import React, { useState } from 'react';
import { 
  GraduationCap, 
  Sparkles, 
  BrainCircuit, 
  BookOpen, 
  Target, 
  Calendar, 
  FileText, 
  ShieldCheck, 
  ArrowRight, 
  CheckCircle2, 
  Database,
  LogIn,
  UserPlus,
  Zap,
  Award,
  Globe,
  Layers,
  TrendingUp,
  Clock
} from 'lucide-react';
import { AuthModal } from './AuthModal';
import { StudentProfileRecord } from '../lib/supabase';

interface LandingViewProps {
  onOpenAuth: (mode?: 'signin' | 'signup') => void;
  onAuthSuccess?: (profile: StudentProfileRecord, email: string) => void;
}

export const LandingView: React.FC<LandingViewProps> = ({ onOpenAuth, onAuthSuccess }) => {
  const [internalAuthModalOpen, setInternalAuthModalOpen] = useState(false);
  const [internalAuthMode, setInternalAuthMode] = useState<'signin' | 'signup'>('signup');

  const handleOpenLocalAuth = (mode: 'signin' | 'signup') => {
    if (onOpenAuth) {
      onOpenAuth(mode);
    } else {
      setInternalAuthMode(mode);
      setInternalAuthModalOpen(true);
    }
  };

  const examBoards = [
    { name: 'Cambridge (CAIE)', detail: 'IGCSE & A-Level' },
    { name: 'Edexcel / Pearson', detail: 'GCSE & International A-Level' },
    { name: 'AQA', detail: 'GCSE & A-Level Specifications' },
    { name: 'OCR', detail: 'A-Level Sciences & Mathematics' },
    { name: 'IB Diploma Programme', detail: 'HL & SL Core Syllabus' },
    { name: 'AP / CollegeBoard', detail: 'Calculus, Physics & Sciences' }
  ];

  const keyFeatures = [
    {
      id: 'feature-socratic',
      icon: BrainCircuit,
      badge: 'Socratic Methodology',
      title: 'Guided Step-by-Step AI Tutoring',
      description: 'Unlike standard answer-bots, the Socratic tutor guides candidates through multi-step derivations, hinting at foundational principles to build genuine exam mastery.',
      tag: 'Deep Understanding'
    },
    {
      id: 'feature-diagnostics',
      icon: Target,
      badge: 'Specification Mapped',
      title: 'Real-Time Mastery & Weakness Detection',
      description: 'Pinpoint precise syllabus vulnerabilities before mock examinations. Diagnostic scores dynamically calibrate based on your practice accuracy and confidence ratings.',
      tag: 'Adaptive Engine'
    },
    {
      id: 'feature-flashcards',
      icon: BookOpen,
      badge: 'Active Recall',
      title: 'Spaced-Repetition Leitner Flashcards',
      description: 'Automated revision intervals powered by proven spaced-repetition algorithms, complete with interactive flip states, formula rendering, and mastery progression.',
      tag: 'Optimal Retention'
    },
    {
      id: 'feature-planner',
      icon: Calendar,
      badge: 'Target Countdown',
      title: 'Milestone Study & Exam Planner',
      description: 'Calculates high-priority revision workloads based on days remaining until your official paper, scheduling timed study sessions and syllabus objectives.',
      tag: 'Goal Focused'
    },
    {
      id: 'feature-ingestion',
      icon: FileText,
      badge: 'Vision & OCR',
      title: 'Official Document & Paper Ingestion',
      description: 'Upload official past papers, mark schemes, and school notes (PDF, TXT, MD) to expand the AI tutor’s knowledge base with your exact curriculum specifications.',
      tag: 'Custom Grounding'
    },
    {
      id: 'feature-cloud',
      icon: Database,
      badge: 'Supabase Cloud',
      title: 'Persistent State & Multi-Device Sync',
      description: 'Your enrolled subjects, study timer minutes, flashcard mastery, and candidate notes are securely synced and accessible across desktop, tablet, and mobile.',
      tag: 'Encrypted Cloud'
    }
  ];

  const valueProps = [
    { title: 'Topic-by-Topic Mastery', desc: 'Track syllabus coverage percentage with instant visual progress bars.' },
    { title: 'Zero-Hallucination Grounding', desc: 'AI answers are strictly anchored to verified course specifications and mark schemes.' },
    { title: 'A* / Grade 7 Target Benchmarks', desc: 'Personalized target grade calculations calibrated against official grade boundaries.' }
  ];

  return (
    <div className="w-full space-y-12 pb-12 font-sans selection:bg-[#D4AF37]/30 selection:text-white">
      
      {/* 1. Hero Section */}
      <section className="relative overflow-hidden bg-[#0C0C0E] border border-[#1F1F24] rounded-md p-6 sm:p-10 md:p-12 shadow-2xl">
        {/* Ambient background glow */}
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-[#D4AF37]/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-[#3ECF8E]/10 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-4xl mx-auto text-center space-y-6 relative z-10">
          
          {/* Eyebrow badge */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-[#D4AF37]/10 border border-[#D4AF37]/30 rounded-sm text-[#D4AF37] text-xs font-mono-tech uppercase tracking-wider shadow-xs">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Standardized Curriculum Intelligence</span>
          </div>

          {/* Main Hero Heading */}
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-white font-sans leading-[1.12]">
            Master your entire syllabus with precision Socratic guidance.
          </h1>

          {/* Subtitle */}
          <p className="text-sm sm:text-base text-white/60 max-w-2xl mx-auto leading-relaxed">
            Eliminate revision guesswork. Experience step-by-step Socratic problem solving, curriculum-grounded active recall flashcards, and automated mastery diagnostics tailored to your target exam paper.
          </p>

          {/* Call-to-Action Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
            <button
              id="hero-create-account-btn"
              onClick={() => handleOpenLocalAuth('signup')}
              className="w-full sm:w-auto px-8 py-3.5 bg-[#D4AF37] hover:bg-[#c49f27] text-black font-bold text-xs font-mono-tech uppercase tracking-wider rounded-sm transition-all flex items-center justify-center gap-2 cursor-pointer shadow-xl hover:shadow-2xl hover:scale-[1.02]"
            >
              <UserPlus className="w-4 h-4" />
              <span>Create Free Account & Start Sync</span>
              <ArrowRight className="w-4 h-4 ml-1" />
            </button>

            <button
              id="hero-signin-btn"
              onClick={() => handleOpenLocalAuth('signin')}
              className="w-full sm:w-auto px-7 py-3.5 bg-[#141418] hover:bg-[#1A1A20] text-white border border-[#27272A] hover:border-white/30 text-xs font-mono-tech uppercase tracking-wider rounded-sm transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <LogIn className="w-4 h-4 text-[#D4AF37]" />
              <span>Sign In to Existing Profile</span>
            </button>
          </div>

          {/* Trust & Cloud Indicators */}
          <div className="flex flex-wrap items-center justify-center gap-6 text-xs text-white/50 font-mono-tech pt-4 border-t border-[#1F1F24]">
            <div className="flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-[#3ECF8E]" />
              <span>Supabase Cloud Persistence</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Zap className="w-4 h-4 text-[#D4AF37]" />
              <span>Zero-Hallucination Grounding</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Award className="w-4 h-4 text-blue-400" />
              <span>A* & Level 7 Target Calibration</span>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Exam Boards Showcase */}
      <section className="bg-[#0F0F13] border border-[#1F1F24] rounded-md p-6 space-y-4">
        <div className="text-center space-y-1">
          <p className="text-[11px] font-mono-tech uppercase tracking-widest text-[#D4AF37]">
            Official Exam Board Specification Support
          </p>
          <h3 className="text-lg font-semibold text-white tracking-tight">
            Calibrated for Global Standardized Curricula
          </h3>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {examBoards.map((board, idx) => (
            <div 
              key={idx}
              className="p-3 bg-[#141418] border border-[#232329] rounded-sm text-center space-y-1 hover:border-[#D4AF37]/40 transition-colors"
            >
              <div className="text-xs font-semibold text-white font-mono-tech">{board.name}</div>
              <div className="text-[10px] text-white/40">{board.detail}</div>
            </div>
          ))}
        </div>
      </section>

      {/* 3. Platform Key Features Showcase */}
      <section className="space-y-6">
        <div className="text-center space-y-2 max-w-2xl mx-auto">
          <div className="inline-flex items-center gap-1.5 text-xs font-mono-tech uppercase text-[#D4AF37] tracking-wider">
            <Layers className="w-3.5 h-3.5" />
            <span>Platform Capabilities</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold text-white font-sans tracking-tight">
            Everything required for top-band examination performance.
          </h2>
          <p className="text-xs sm:text-sm text-white/50">
            A unified suite of study tools engineered around cognitive science, active recall, and official exam specifications.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {keyFeatures.map((feat) => {
            const Icon = feat.icon;
            return (
              <div 
                key={feat.id}
                id={feat.id}
                className="p-5 bg-[#0F0F13] border border-[#1F1F24] hover:border-[#D4AF37]/40 rounded-sm flex flex-col justify-between space-y-4 transition-all hover:bg-[#121217] group"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="w-10 h-10 rounded-sm bg-[#D4AF37]/10 border border-[#D4AF37]/30 flex items-center justify-center text-[#D4AF37] group-hover:scale-105 transition-transform">
                      <Icon className="w-5 h-5" />
                    </div>
                    <span className="text-[10px] font-mono-tech uppercase tracking-wider px-2 py-0.5 bg-white/5 text-white/50 border border-white/10 rounded-xs">
                      {feat.tag}
                    </span>
                  </div>

                  <div>
                    <span className="text-[10px] font-mono-tech uppercase text-[#D4AF37] tracking-wider block mb-1">
                      {feat.badge}
                    </span>
                    <h3 className="text-base font-semibold text-white tracking-tight">
                      {feat.title}
                    </h3>
                  </div>

                  <p className="text-xs text-white/60 leading-relaxed">
                    {feat.description}
                  </p>
                </div>

                <div className="pt-2 border-t border-[#1C1C22] flex items-center justify-between text-[11px] font-mono-tech text-white/40 group-hover:text-[#D4AF37] transition-colors">
                  <span>Interactive Component</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* 4. Value Propositions Grid */}
      <section className="bg-[#0D0D10] border border-[#1F1F24] rounded-md p-6 sm:p-8 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {valueProps.map((vp, idx) => (
            <div key={idx} className="flex items-start gap-3">
              <div className="w-7 h-7 rounded bg-[#D4AF37]/15 border border-[#D4AF37]/40 flex items-center justify-center text-[#D4AF37] shrink-0 mt-0.5">
                <CheckCircle2 className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-white font-sans">{vp.title}</h4>
                <p className="text-xs text-white/50 leading-relaxed mt-1 font-sans">{vp.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 5. Bottom Action Banner */}
      <section className="bg-[#121216] border border-[#27272A] rounded-md p-8 text-center space-y-5">
        <div className="w-12 h-12 rounded-sm bg-[#D4AF37]/15 border border-[#D4AF37]/40 flex items-center justify-center text-[#D4AF37] mx-auto">
          <GraduationCap className="w-6 h-6" />
        </div>

        <div className="space-y-2 max-w-xl mx-auto">
          <h3 className="text-2xl font-bold text-white tracking-tight">
            Ready to start your targeted exam preparation?
          </h3>
          <p className="text-xs sm:text-sm text-white/50">
            Create your candidate profile, enroll in your exam board subjects, and sync your study schedule instantly.
          </p>
        </div>

        <div className="pt-2">
          <button
            id="bottom-signup-cta-btn"
            onClick={() => handleOpenLocalAuth('signup')}
            className="px-8 py-3.5 bg-[#D4AF37] hover:bg-[#c49f27] text-black font-bold text-xs font-mono-tech uppercase tracking-wider rounded-sm transition-all inline-flex items-center gap-2 cursor-pointer shadow-xl hover:scale-105"
          >
            <UserPlus className="w-4 h-4" />
            <span>Create Free Account Now</span>
          </button>
        </div>
      </section>

      {/* Internal Auth Modal Fallback */}
      {internalAuthModalOpen && (
        <AuthModal
          isOpen={internalAuthModalOpen}
          initialMode={internalAuthMode}
          onClose={() => setInternalAuthModalOpen(false)}
          onAuthSuccess={(profile, email) => {
            setInternalAuthModalOpen(false);
            if (onAuthSuccess) onAuthSuccess(profile, email);
          }}
        />
      )}
    </div>
  );
};
