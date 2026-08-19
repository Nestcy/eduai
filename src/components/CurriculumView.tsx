import React, { useState } from 'react';
import { CurriculumSummary } from '../types';
import { GlobalCurriculumPicker } from './GlobalCurriculumPicker';
import { 
  BookOpen, 
  Search, 
  Sparkles, 
  CheckCircle2, 
  FileText, 
  Award, 
  Clock, 
  Layers,
  ChevronRight,
  TrendingUp,
  Globe
} from 'lucide-react';

export const CurriculumView: React.FC = () => {
  const [country, setCountry] = useState('Global Standard (Universal)');
  const [board, setBoard] = useState('Cambridge IGCSE / A-Level');
  const [grade, setGrade] = useState('Grade 12');
  const [subject, setSubject] = useState('Mathematics');
  const [isLoading, setIsLoading] = useState(false);

  const [curriculum, setCurriculum] = useState<CurriculumSummary>({
    country: 'UK',
    curriculum_board: 'Edexcel',
    grade: 'Grade 11',
    subject: 'Mathematics',
    summary: 'Edexcel GCSE/AS-Level Mathematics curriculum specification designed to develop mathematical fluency, reasoning, and multi-step problem solving.',
    topics: [
      {
        unit: 'Unit 1: Number & Algebra',
        title: 'Equations, Functions, and Quadratic Systems',
        learning_objectives: [
          'Manipulate algebraic expressions and factorize polynomials',
          'Solve quadratic equations using factoring, completing the square, and quadratic formula',
          'Analyze function mappings, domain/range constraints, and composite inverses'
        ],
        exam_weight: '30%'
      },
      {
        unit: 'Unit 2: Calculus & Coordinate Geometry',
        title: 'Differentiation, Tangents, and Rate Analysis',
        learning_objectives: [
          'Differentiate polynomial expressions of the form ax^n',
          'Find gradients, equations of tangents, and stationary turning points',
          'Apply second derivatives to classify maxima, minima, and inflections'
        ],
        exam_weight: '35%'
      },
      {
        unit: 'Unit 3: Statistics & Applied Mechanics',
        title: 'Probability Distributions and Kinematics',
        learning_objectives: [
          'Calculate binomial and normal probability distributions',
          'Apply constant acceleration kinematic equations (SUVAT)',
          'Resolve coplanar force vectors and apply Newton\'s Second Law (F = ma)'
        ],
        exam_weight: '35%'
      }
    ],
    assessment_objectives: [
      {
        code: 'AO1',
        title: 'Mathematical Fluency & Recall',
        description: 'Accurately recall facts, terminology, definitions, standard formulas, and routine procedures.',
        weight: '35%'
      },
      {
        code: 'AO2',
        title: 'Mathematical Reasoning & Proof',
        description: 'Construct chains of reasoning, deductive arguments, and algebraic proofs.',
        weight: '35%'
      },
      {
        code: 'AO3',
        title: 'Multi-Step Problem Solving',
        description: 'Translate non-routine real-world problems into mathematical models and interpret solutions.',
        weight: '30%'
      }
    ],
    exam_structure: [
      {
        paper: 'Paper 1 (Pure Mathematics - Non-Calculator)',
        duration: '1h 30m',
        marks: 80,
        format: 'Structured questions testing foundational algebra and coordinate geometry.'
      },
      {
        paper: 'Paper 2 (Pure & Applied Mathematics - Calculator)',
        duration: '1h 30m',
        marks: 80,
        format: 'Calculator permitted; extended modelling and statistical applications.'
      }
    ]
  });

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
    <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8 space-y-8">
      {/* Search Header */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 font-bold text-slate-900 text-sm">
            <BookOpen className="w-4 h-4 text-blue-600" />
            <span>Official Syllabus & Curriculum Specification Lookup</span>
          </div>
          <span className="text-[11px] px-2.5 py-0.5 bg-blue-50 text-blue-700 font-bold rounded-lg border border-blue-200">
            60+ Countries & All Disciplines
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
          className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-xs flex items-center justify-center gap-2 transition-colors cursor-pointer disabled:opacity-50"
        >
          <Sparkles className="w-4 h-4 text-blue-200" />
          <span>{isLoading ? 'Analyzing Official Specification...' : `Discover & Summarize ${subject} Curriculum (${country})`}</span>
        </button>
      </div>

      {/* Curriculum Summary Stage */}
      {curriculum && (
        <div className="space-y-6">
          {/* Main Summary Banner */}
          <div className="bg-gradient-to-br from-slate-900 to-indigo-950 rounded-3xl p-8 text-white shadow-md space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-3 py-1 bg-blue-500/30 text-blue-200 border border-blue-400/40 rounded-full text-xs font-semibold">
                {curriculum.curriculum_board}
              </span>
              <span className="px-3 py-1 bg-indigo-500/30 text-indigo-200 border border-indigo-400/40 rounded-full text-xs font-semibold">
                {curriculum.grade}
              </span>
              <span className="px-3 py-1 bg-emerald-500/30 text-emerald-200 border border-emerald-400/40 rounded-full text-xs font-semibold">
                {curriculum.country}
              </span>
            </div>
            <h2 className="text-2xl font-bold tracking-tight">
              {curriculum.subject} Examination Specification
            </h2>
            <p className="text-sm text-slate-300 max-w-3xl leading-relaxed">
              {curriculum.summary}
            </p>
          </div>

          {/* Assessment Objectives Grid */}
          {curriculum.assessment_objectives && (
            <div className="space-y-3">
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <Award className="w-4 h-4 text-blue-600" />
                <span>Assessment Objectives (AO Breakdown)</span>
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {curriculum.assessment_objectives.map((ao, idx) => (
                  <div
                    key={idx}
                    className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <span className="px-2.5 py-0.5 bg-blue-50 text-blue-700 text-xs font-black rounded-lg border border-blue-200">
                        {ao.code}
                      </span>
                      <span className="text-xs font-bold text-slate-900">{ao.weight}</span>
                    </div>
                    <h4 className="font-bold text-slate-800 text-xs">{ao.title}</h4>
                    <p className="text-xs text-slate-500 leading-relaxed">{ao.description}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Syllabus Units Breakdown */}
          {curriculum.topics && (
            <div className="space-y-3">
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <Layers className="w-4 h-4 text-blue-600" />
                <span>Syllabus Units & Core Learning Objectives</span>
              </h3>
              <div className="space-y-4">
                {curriculum.topics.map((unit, idx) => (
                  <div
                    key={idx}
                    className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-3"
                  >
                    <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                      <div>
                        <span className="text-xs font-bold text-blue-600 uppercase tracking-wider block">
                          {unit.unit}
                        </span>
                        <h4 className="font-bold text-slate-900 text-base">{unit.title}</h4>
                      </div>
                      <span className="px-3 py-1 bg-slate-100 text-slate-700 text-xs font-bold rounded-lg border border-slate-200">
                        Exam Weight: {unit.exam_weight}
                      </span>
                    </div>

                    <div className="space-y-2">
                      <span className="text-xs font-semibold text-slate-500 block">
                        Core Examination Competencies:
                      </span>
                      <ul className="space-y-1.5 text-xs text-slate-700">
                        {unit.learning_objectives.map((obj, i) => (
                          <li key={i} className="flex items-start gap-2">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 mt-0.5 shrink-0" />
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
          {curriculum.exam_structure && (
            <div className="space-y-3">
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <FileText className="w-4 h-4 text-blue-600" />
                <span>Examination Paper Structure & Format</span>
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {curriculum.exam_structure.map((paper, idx) => (
                  <div
                    key={idx}
                    className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <h4 className="font-bold text-slate-900 text-sm">{paper.paper}</h4>
                      <span className="px-2.5 py-0.5 bg-emerald-50 text-emerald-700 text-xs font-bold rounded-lg border border-emerald-200">
                        {paper.marks} Marks
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-slate-500">
                      <Clock className="w-3.5 h-3.5" />
                      <span>Duration: {paper.duration}</span>
                    </div>
                    <p className="text-xs text-slate-600 bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                      {paper.format}
                    </p>
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
