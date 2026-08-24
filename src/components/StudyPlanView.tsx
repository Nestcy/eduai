import React, { useState } from 'react';
import { TopicPerformance, StudyPlanEntry } from '../types';
import { GLOBAL_SUBJECT_CATEGORIES } from '../data';
import { 
  CalendarDays, 
  Plus, 
  Trash2, 
  Sparkles, 
  Clock, 
  CheckCircle2, 
  Circle,
  Wand2,
  Calendar
} from 'lucide-react';

export const StudyPlanView: React.FC = () => {
  const [subject, setSubject] = useState('Mathematics');
  const [examDate, setExamDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 14);
    return d.toISOString().split('T')[0];
  });
  const [dailyMinutes, setDailyMinutes] = useState(60);

  const subjectTopicPresets: Record<string, TopicPerformance[]> = {
    'Mathematics': [
      { topic: 'Quadratic Equations & Discriminants', self_reported_score: 45, confidence_level: 2, exam_frequency_weight: 0.9, days_since_last_review: 12 },
      { topic: 'Differentiation & Stationary Points', self_reported_score: 60, confidence_level: 3, exam_frequency_weight: 0.85, days_since_last_review: 6 },
      { topic: 'Trigonometric Identities & Graphs', self_reported_score: 35, confidence_level: 1, exam_frequency_weight: 0.95, days_since_last_review: 20 },
      { topic: 'Linear Systems & Coordinate Geometry', self_reported_score: 85, confidence_level: 5, exam_frequency_weight: 0.6, days_since_last_review: 2 }
    ],
    'Biology': [
      { topic: 'Photosynthesis (Thylakoids & Calvin Cycle)', self_reported_score: 40, confidence_level: 2, exam_frequency_weight: 0.9, days_since_last_review: 14 },
      { topic: 'Mitochondrial Electron Transport Chain', self_reported_score: 55, confidence_level: 3, exam_frequency_weight: 0.85, days_since_last_review: 7 },
      { topic: 'Mendelian Genetics & Dihybrid Crosses', self_reported_score: 75, confidence_level: 4, exam_frequency_weight: 0.75, days_since_last_review: 4 },
      { topic: 'Enzyme Kinetics & Competitive Inhibition', self_reported_score: 30, confidence_level: 1, exam_frequency_weight: 0.95, days_since_last_review: 22 }
    ],
    'Physics': [
      { topic: 'Kinematics & Projectile Motion in 2D', self_reported_score: 50, confidence_level: 3, exam_frequency_weight: 0.85, days_since_last_review: 9 },
      { topic: 'Electromagnetic Induction & Lenz\'s Law', self_reported_score: 35, confidence_level: 1, exam_frequency_weight: 0.95, days_since_last_review: 18 },
      { topic: 'Wave Optics, Diffraction & Two-Slit Interference', self_reported_score: 65, confidence_level: 3, exam_frequency_weight: 0.7, days_since_last_review: 5 },
      { topic: 'Thermodynamics & Carnot Heat Engine Cycles', self_reported_score: 40, confidence_level: 2, exam_frequency_weight: 0.9, days_since_last_review: 15 }
    ],
    'Chemistry': [
      { topic: 'Equilibrium Constant (Kc, Kp) & Le Chatelier', self_reported_score: 45, confidence_level: 2, exam_frequency_weight: 0.9, days_since_last_review: 11 },
      { topic: 'Organic Nucleophilic Substitution (SN1 vs SN2)', self_reported_score: 30, confidence_level: 1, exam_frequency_weight: 0.95, days_since_last_review: 21 },
      { topic: 'Acid-Base Buffers & Titration Curves', self_reported_score: 60, confidence_level: 3, exam_frequency_weight: 0.8, days_since_last_review: 6 },
      { topic: 'Periodic Trends & Lattice Enthalpy Born-Haber', self_reported_score: 80, confidence_level: 4, exam_frequency_weight: 0.65, days_since_last_review: 3 }
    ],
    'Computer Science': [
      { topic: 'Dynamic Programming & Memoization', self_reported_score: 30, confidence_level: 1, exam_frequency_weight: 0.95, days_since_last_review: 25 },
      { topic: 'Graph Algorithms (Dijkstra & BFS/DFS)', self_reported_score: 50, confidence_level: 2, exam_frequency_weight: 0.9, days_since_last_review: 10 },
      { topic: 'Object Oriented Design Patterns & SOLID', self_reported_score: 75, confidence_level: 4, exam_frequency_weight: 0.7, days_since_last_review: 5 },
      { topic: 'Relational Database Normalization (3NF)', self_reported_score: 60, confidence_level: 3, exam_frequency_weight: 0.8, days_since_last_review: 8 }
    ],
    'Economics': [
      { topic: 'Monetary & Fiscal Policy Equilibrium (IS-LM)', self_reported_score: 45, confidence_level: 2, exam_frequency_weight: 0.9, days_since_last_review: 13 },
      { topic: 'Market Structures: Oligopoly & Game Theory', self_reported_score: 65, confidence_level: 3, exam_frequency_weight: 0.8, days_since_last_review: 7 },
      { topic: 'Exchange Rates & Balance of Payments Deficit', self_reported_score: 35, confidence_level: 1, exam_frequency_weight: 0.95, days_since_last_review: 19 },
      { topic: 'Price Elasticity of Supply and Consumer Surplus', self_reported_score: 85, confidence_level: 5, exam_frequency_weight: 0.6, days_since_last_review: 2 }
    ]
  };

  const [topicList, setTopicList] = useState<TopicPerformance[]>([]);

  const [newTopicName, setNewTopicName] = useState('');
  const [newScore, setNewScore] = useState(50);
  const [newConfidence, setNewConfidence] = useState(3);
  const [newWeight, setNewWeight] = useState(0.8);
  const [newStaleness, setNewStaleness] = useState(7);

  const [plan, setPlan] = useState<StudyPlanEntry[]>([]);
  const [rationale, setRationale] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);

  const handleAddTopic = () => {
    if (!newTopicName.trim()) return;
    setTopicList([
      ...topicList,
      {
        topic: newTopicName.trim(),
        self_reported_score: Number(newScore),
        confidence_level: Number(newConfidence),
        exam_frequency_weight: Number(newWeight),
        days_since_last_review: Number(newStaleness)
      }
    ]);
    setNewTopicName('');
  };

  const handleRemoveTopic = (idx: number) => {
    setTopicList(topicList.filter((_, i) => i !== idx));
  };

  const handleGeneratePlan = async () => {
    if (topicList.length === 0) return;
    setIsLoading(true);
    try {
      const response = await fetch('/api/study-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subject,
          exam_date: examDate,
          daily_minutes_available: dailyMinutes,
          topic_performance: topicList
        })
      });

      if (!response.ok) throw new Error('Failed to generate study plan');
      const data = await response.json();
      setPlan(data.plan || []);
      setRationale(data.rationale || '');
    } catch (err: any) {
      console.error('Study plan error:', err);
      alert(err.message || 'Failed to generate study plan');
    } finally {
      setIsLoading(false);
    }
  };

  const toggleTaskCompleted = (idx: number) => {
    setPlan((prev) =>
      prev.map((item, i) => (i === idx ? { ...item, completed: !item.completed } : item))
    );
  };

  return (
    <div className="flex flex-col min-h-full">
      {/* Hero Banner (Deep Industrial Style) */}
      <div className="hero-banner-industrial px-8 py-12">
        <div className="badge-industrial mb-4">
          MULTI-FACTOR OPTIMIZATION ENGINE
        </div>
        <h1 className="font-syne text-4xl sm:text-5xl font-extrabold tracking-tight text-white mb-4 leading-none uppercase">
          Personalized Revision & Study Planner
        </h1>
        <p className="max-w-3xl text-sm text-white/70 leading-relaxed font-sans">
          Our Planner Agent computes high-yield review priority combining 4 key signals:{' '}
          <span className="text-[#D4AF37] font-semibold">35% Weakness</span>,{' '}
          <span className="text-[#D4AF37] font-semibold">25% Low Confidence</span>,{' '}
          <span className="text-[#D4AF37] font-semibold">25% Exam Weight</span>, and{' '}
          <span className="text-[#D4AF37] font-semibold">15% Staleness</span>.
        </p>
      </div>

      {/* Main Grid Area */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-px bg-white/10 flex-1">
        {/* Left Column: Parameters & Signal Inputs */}
        <div className="lg:col-span-5 bg-[#0A0A0B] p-8 space-y-8">
          {/* Section: Parameters */}
          <div className="space-y-4">
            <div className="section-header-industrial">
              <div className="square-indicator" />
              <h2>Parameters</h2>
            </div>

            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block label-mono text-[10px] text-white/60 uppercase">Target Subject</label>
                  {subjectTopicPresets[subject] && (
                    <button
                      type="button"
                      onClick={() => setTopicList(subjectTopicPresets[subject])}
                      className="label-mono text-[9px] text-[#D4AF37] hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <Wand2 className="w-3 h-3" />
                      <span>Load Presets</span>
                    </button>
                  )}
                </div>
                <select
                  value={subject}
                  onChange={(e) => {
                    setSubject(e.target.value);
                  }}
                  className="w-full bg-[#111111] border border-white/10 text-white p-3 font-sans text-sm rounded-sm focus:outline-none focus:border-[#D4AF37]"
                >
                  {GLOBAL_SUBJECT_CATEGORIES.map((cat, idx) => (
                    <optgroup key={idx} label={cat.category}>
                      {cat.subjects.map((sub, sIdx) => (
                        <option key={sIdx} value={sub.split(' (')[0]}>
                          {sub}
                        </option>
                      ))}
                    </optgroup>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block label-mono text-[10px] text-white/60 uppercase mb-1.5">Exam Date</label>
                  <input
                    type="date"
                    value={examDate}
                    onChange={(e) => setExamDate(e.target.value)}
                    className="w-full bg-[#111111] border border-white/10 text-white p-3 font-sans text-sm rounded-sm focus:outline-none focus:border-[#D4AF37]"
                  />
                </div>

                <div>
                  <label className="block label-mono text-[10px] text-white/60 uppercase mb-1.5">Daily Study (Mins)</label>
                  <input
                    type="number"
                    min={20}
                    max={240}
                    step={10}
                    value={dailyMinutes}
                    onChange={(e) => setDailyMinutes(Number(e.target.value))}
                    className="w-full bg-[#111111] border border-white/10 text-white p-3 font-sans text-sm rounded-sm focus:outline-none focus:border-[#D4AF37]"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Section: Performance Matrix */}
          <div className="space-y-4">
            <div className="section-header-industrial">
              <div className="square-indicator" />
              <h2>Performance Matrix</h2>
            </div>

            <div className="bg-white/[0.03] border border-white/10 p-4 rounded-sm space-y-3">
              <div>
                <label className="block label-mono text-[10px] text-white/60 uppercase mb-1">Topic Name</label>
                <input
                  type="text"
                  placeholder="e.g. Integration by Parts"
                  value={newTopicName}
                  onChange={(e) => setNewTopicName(e.target.value)}
                  className="w-full bg-[#111111] border border-white/10 text-white p-2.5 font-sans text-xs rounded-sm focus:outline-none focus:border-[#D4AF37]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="block label-mono text-[9px] text-white/60 mb-1">Score: {newScore}%</label>
                  <input
                    type="range"
                    min={0}
                    max={100}
                    value={newScore}
                    onChange={(e) => setNewScore(Number(e.target.value))}
                    className="w-full accent-[#D4AF37]"
                  />
                </div>
                <div>
                  <label className="block label-mono text-[9px] text-white/60 mb-1">Confidence: {newConfidence}/5</label>
                  <input
                    type="range"
                    min={1}
                    max={5}
                    value={newConfidence}
                    onChange={(e) => setNewConfidence(Number(e.target.value))}
                    className="w-full accent-[#D4AF37]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="block label-mono text-[9px] text-white/60 mb-1">Exam Weight: {newWeight}</label>
                  <input
                    type="range"
                    min={0.1}
                    max={1.0}
                    step={0.05}
                    value={newWeight}
                    onChange={(e) => setNewWeight(Number(e.target.value))}
                    className="w-full accent-[#D4AF37]"
                  />
                </div>
                <div>
                  <label className="block label-mono text-[9px] text-white/60 mb-1">Staleness: {newStaleness}d</label>
                  <input
                    type="number"
                    min={0}
                    max={90}
                    value={newStaleness}
                    onChange={(e) => setNewStaleness(Number(e.target.value))}
                    className="w-full bg-[#111111] border border-white/10 text-white p-1.5 font-mono-tech text-xs rounded-sm"
                  />
                </div>
              </div>

              <button
                onClick={handleAddTopic}
                disabled={!newTopicName.trim()}
                className="w-full bg-transparent text-white border border-white/10 hover:border-[#D4AF37] p-2.5 label-mono text-[10px] uppercase transition-all cursor-pointer disabled:opacity-40"
              >
                Add Topic to Signal Matrix
              </button>
            </div>

            {/* Configured Topic List */}
            <div className="flex flex-col gap-px bg-white/10 border border-white/10 max-h-56 overflow-y-auto">
              {topicList.length === 0 ? (
                <div className="bg-[#0A0A0B] p-4 text-center text-xs text-white/50 space-y-1">
                  <p>No student topics in matrix yet.</p>
                  <p className="text-[10px] text-[#D4AF37]">Type a topic above and click "Add Topic" or click "Load Presets" to prefill sample topics.</p>
                </div>
              ) : (
                topicList.map((tp, idx) => (
                  <div key={idx} className="bg-[#0A0A0B] p-3 text-xs flex items-center justify-between">
                    <div>
                      <span className="font-sans font-medium text-white block text-xs">{tp.topic}</span>
                      <span className="label-mono text-[9px] text-white/50">
                        Score: {tp.self_reported_score}% | Conf: {tp.confidence_level}/5 | Weight: {tp.exam_frequency_weight}
                      </span>
                    </div>
                    <button
                      onClick={() => handleRemoveTopic(idx)}
                      className="text-white/40 hover:text-[#C15B3A] transition-colors p-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))
              )}
            </div>

            <button
              onClick={handleGeneratePlan}
              disabled={isLoading || topicList.length === 0}
              className="btn-primary-industrial mt-4 flex items-center justify-center gap-2"
            >
              <Sparkles className="w-4 h-4 text-black" />
              <span>{isLoading ? 'Computing Schedule...' : 'Generate AI Schedule'}</span>
            </button>
          </div>
        </div>

        {/* Right Column: Schedule / Empty State */}
        <div className="lg:col-span-7 bg-[#080809] p-8">
          {plan.length === 0 ? (
            <div className="border border-dashed border-white/10 h-[450px] flex flex-col items-center justify-center text-center p-8 text-white/40 space-y-3">
              <Calendar className="w-12 h-12 stroke-1 text-white/30" />
              <h3 className="font-syne text-white text-xl uppercase font-bold">No Schedule Yet</h3>
              <p className="text-xs max-w-sm leading-relaxed text-white/60">
                Click the generate button to run the Priority optimization agent for your syllabus.
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {rationale && (
                <div className="bg-[#121214] border border-[#D4AF37]/30 p-5 rounded-sm space-y-2">
                  <div className="label-mono text-[#D4AF37] flex items-center gap-2">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Agent Rationale</span>
                  </div>
                  <p className="text-xs text-white/80 leading-relaxed font-sans">{rationale}</p>
                </div>
              )}

              <div className="bg-[#121214] border border-white/10 rounded-sm overflow-hidden">
                <div className="p-4 border-b border-white/10 bg-black/40 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CalendarDays className="w-4 h-4 text-[#D4AF37]" />
                    <span className="font-syne font-bold text-sm text-white uppercase">
                      Spaced Revision Schedule ({plan.length} Sessions)
                    </span>
                  </div>
                  <span className="label-mono text-[10px] text-white/60">
                    {plan.filter((p) => p.completed).length}/{plan.length} COMPLETED
                  </span>
                </div>

                <div className="divide-y divide-white/5">
                  {plan.map((item, idx) => (
                    <div
                      key={idx}
                      className={`p-4 flex items-center justify-between transition-colors ${
                        item.completed ? 'bg-white/[0.02]' : 'hover:bg-white/5'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => toggleTaskCompleted(idx)}
                          className="text-white/40 hover:text-[#D4AF37] transition-colors cursor-pointer"
                        >
                          {item.completed ? (
                            <CheckCircle2 className="w-5 h-5 text-[#D4AF37]" />
                          ) : (
                            <Circle className="w-5 h-5" />
                          )}
                        </button>
                        <div>
                          <h4
                            className={`font-semibold text-xs sm:text-sm ${
                              item.completed ? 'line-through text-white/40' : 'text-white'
                            }`}
                          >
                            {item.topic}
                          </h4>
                          <div className="flex items-center gap-2 label-mono text-[10px] text-white/50 mt-0.5">
                            <span>📅 {item.scheduled_date}</span>
                            <span>•</span>
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3 text-white/40" />
                              {item.recommended_minutes} mins
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="text-right">
                        <span
                          className={`label-mono text-[9px] px-2.5 py-1 border rounded-sm ${
                            item.priority_score > 0.65
                              ? 'border-[#C15B3A] text-[#C15B3A] bg-[#C15B3A]/10'
                              : item.priority_score > 0.45
                              ? 'border-[#D4AF37] text-[#D4AF37] bg-[#D4AF37]/10'
                              : 'border-white/20 text-white/70'
                          }`}
                        >
                          PRIORITY {item.priority_score}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
