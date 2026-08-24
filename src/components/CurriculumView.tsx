import React, { useState } from 'react';
import { CurriculumSummary } from '../types';
import { GlobalCurriculumPicker } from './GlobalCurriculumPicker';
import { 
  BookOpen, 
  Sparkles, 
  CheckCircle2, 
  FileText, 
  Award, 
  Clock, 
  Layers,
  Search,
  Globe
} from 'lucide-react';

export const CurriculumView: React.FC = () => {
  const [country, setCountry] = useState('Global Standard (Universal)');
  const [board, setBoard] = useState('Cambridge IGCSE / A-Level');
  const [grade, setGrade] = useState('Grade 12');
  const [subject, setSubject] = useState('Mathematics');
  const [isLoading, setIsLoading] = useState(false);

  // Curriculum specification state - starts null so real student info is fetched on demand
  const [curriculum, setCurriculum] = useState<CurriculumSummary | null>(null);

  const handleFetchCurriculum = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/curriculum', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          country,
          curriculum_board: board,
          grade,
          subject
        })
      });

      if (!response.ok) throw new Error('Failed to retrieve curriculum specification');
      const data = await response.json();
      setCurriculum(data);
    } catch (err: any) {
      console.error('Curriculum error:', err);
      alert('Curriculum lookup failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col min-h-full">
      {/* Hero Banner */}
      <div className="hero-banner-industrial px-8 py-10">
        <div className="badge-industrial mb-3">
          SYLLABUS GROUNDING ENGINE
        </div>
        <h1 className="font-syne text-3xl sm:text-4xl font-extrabold tracking-tight text-white mb-3 uppercase">
          Official Syllabus & Curriculum Specification
        </h1>
        <p className="max-w-3xl text-xs sm:text-sm text-white/70 leading-relaxed font-sans">
          Select your real student region, examination board, grade level, and subject below to fetch and analyze your official syllabus learning objectives and assessment criteria.
        </p>
      </div>

      <div className="p-8 space-y-8 max-w-7xl mx-auto w-full">
        {/* Search Header Container */}
        <div className="tech-card p-6 space-y-5 rounded-sm">
          <div className="flex items-center justify-between border-b border-white/10 pb-4">
            <div className="flex items-center gap-2 font-syne font-bold text-white text-sm uppercase">
              <BookOpen className="w-4 h-4 text-[#D4AF37]" />
              <span>Syllabus Specification Query</span>
            </div>
            <span className="tech-tag tech-tag-gold">
              REAL STUDENT SYLLABUS GROUNDING
            </span>
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

          <button
            onClick={handleFetchCurriculum}
            disabled={isLoading}
            className="btn-primary-industrial flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            <Sparkles className="w-4 h-4 text-black" />
            <span>
              {isLoading 
                ? 'Analyzing Official Specification...' 
                : `Fetch & Summarize ${subject} Syllabus (${board})`
              }
            </span>
          </button>
        </div>

        {/* Curriculum Summary Stage */}
        {curriculum ? (
          <div className="space-y-6">
            {/* Main Summary Banner */}
            <div className="bg-[#121214] border border-[#D4AF37]/30 p-6 sm:p-8 rounded-sm space-y-4">
              <div className="flex flex-wrap items-center gap-2">
                <span className="tech-tag tech-tag-gold">
                  {curriculum.curriculum_board}
                </span>
                <span className="tech-tag">
                  {curriculum.grade}
                </span>
                <span className="tech-tag tech-tag-terracotta">
                  {curriculum.country}
                </span>
              </div>
              <h2 className="font-syne text-2xl sm:text-3xl font-extrabold text-white uppercase tracking-tight">
                {curriculum.subject} Examination Specification
              </h2>
              <p className="text-xs sm:text-sm text-white/80 leading-relaxed max-w-4xl font-sans">
                {curriculum.summary}
              </p>
            </div>

            {/* Assessment Objectives Grid */}
            {curriculum.assessment_objectives && curriculum.assessment_objectives.length > 0 && (
              <div className="space-y-3">
                <div className="section-header-industrial">
                  <div className="square-indicator" />
                  <h2>Assessment Objectives (AO Breakdown)</h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {curriculum.assessment_objectives.map((ao, idx) => (
                    <div
                      key={idx}
                      className="tech-card p-5 space-y-2 rounded-sm border border-white/10"
                    >
                      <div className="flex items-center justify-between border-b border-white/5 pb-2">
                        <span className="label-mono text-xs font-bold text-[#D4AF37]">
                          {ao.code}
                        </span>
                        <span className="label-mono text-xs text-white/70">{ao.weight}</span>
                      </div>
                      <h4 className="font-syne font-bold text-white text-xs uppercase">{ao.title}</h4>
                      <p className="text-xs text-white/60 leading-relaxed font-sans">{ao.description}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Syllabus Units Breakdown */}
            {curriculum.topics && curriculum.topics.length > 0 && (
              <div className="space-y-3">
                <div className="section-header-industrial">
                  <div className="square-indicator" />
                  <h2>Syllabus Units & Core Learning Objectives</h2>
                </div>
                <div className="space-y-4">
                  {curriculum.topics.map((unit, idx) => (
                    <div
                      key={idx}
                      className="tech-card p-6 space-y-4 rounded-sm border border-white/10"
                    >
                      <div className="flex flex-wrap items-center justify-between border-b border-white/10 pb-3 gap-2">
                        <div>
                          <span className="label-mono text-[10px] text-[#C15B3A] uppercase tracking-wider block">
                            {unit.unit}
                          </span>
                          <h4 className="font-syne font-extrabold text-white text-base sm:text-lg">{unit.title}</h4>
                        </div>
                        <span className="tech-tag tech-tag-gold">
                          Exam Weight: {unit.exam_weight}
                        </span>
                      </div>

                      <div className="space-y-2">
                        <span className="label-mono text-[10px] text-white/50 uppercase block">
                          Core Examination Competencies:
                        </span>
                        <ul className="space-y-2 text-xs text-white/80 font-sans">
                          {unit.learning_objectives.map((obj, i) => (
                            <li key={i} className="flex items-start gap-2.5">
                              <CheckCircle2 className="w-3.5 h-3.5 text-[#D4AF37] mt-0.5 shrink-0" />
                              <span>{obj}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Exam Structure Papers */}
            {curriculum.exam_structure && curriculum.exam_structure.length > 0 && (
              <div className="space-y-3">
                <div className="section-header-industrial">
                  <div className="square-indicator" />
                  <h2>Examination Paper Structure & Format</h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {curriculum.exam_structure.map((paper, idx) => (
                    <div
                      key={idx}
                      className="tech-card p-5 space-y-3 rounded-sm border border-white/10"
                    >
                      <div className="flex items-center justify-between border-b border-white/5 pb-2">
                        <h4 className="font-syne font-bold text-white text-sm uppercase">{paper.paper}</h4>
                        <span className="tech-tag tech-tag-terracotta">
                          {paper.marks} Marks
                        </span>
                      </div>
                      <div className="flex items-center gap-2 label-mono text-xs text-white/50">
                        <Clock className="w-3.5 h-3.5 text-[#D4AF37]" />
                        <span>Duration: {paper.duration}</span>
                      </div>
                      <p className="text-xs text-white/70 bg-black/50 p-3 rounded-sm border border-white/5 font-sans">
                        {paper.format}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="border border-dashed border-white/10 p-12 text-center rounded-sm bg-[#080809] space-y-4">
            <Globe className="w-12 h-12 text-white/20 mx-auto" />
            <div className="space-y-1">
              <h3 className="font-syne text-lg font-bold text-white uppercase">
                No Syllabus Specification Loaded
              </h3>
              <p className="text-xs text-white/60 max-w-md mx-auto leading-relaxed">
                Configure your real region, board, grade, and subject above and click <span className="text-[#D4AF37] font-semibold">Fetch & Summarize</span> to load your official examination specification.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
