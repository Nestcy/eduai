import React, { useState } from 'react';
import { TopicPerformance, StudyPlanEntry } from '../types';
import { GLOBAL_SUBJECT_CATEGORIES } from '../data/curriculumData';
import { 
  CalendarDays, 
  Plus, 
  Trash2, 
  Sparkles, 
  Clock, 
  TrendingDown, 
  TrendingUp, 
  CheckCircle2, 
  Circle,
  Brain,
  Sliders,
  Award,
  AlertCircle,
  Layers,
  Wand2
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

  const [topicList, setTopicList] = useState<TopicPerformance[]>(subjectTopicPresets['Mathematics']);

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
    <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8 space-y-8">
      {/* Intro Header */}
      <div className="bg-gradient-to-r from-blue-900 to-indigo-900 rounded-3xl p-8 text-white shadow-md relative overflow-hidden">
        <div className="relative z-10 max-w-3xl space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 backdrop-blur-md rounded-full text-xs font-semibold text-blue-200">
            <Brain className="w-4 h-4 text-blue-300" />
            <span>Multi-Factor Priority Optimization Engine</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Personalized Revision & Study Planner
          </h1>
          <p className="text-sm text-blue-100/90 leading-relaxed">
            Our Planner Agent computes high-yield review priority combining 4 key signals:
            <strong className="text-white"> 35% Weakness</strong>,
            <strong className="text-white"> 25% Low Confidence</strong>,
            <strong className="text-white"> 25% Exam Frequency Weight</strong>, and
            <strong className="text-white"> 15% Knowledge Staleness</strong>.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Topic Signals Input */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-5">
            <h2 className="font-bold text-slate-900 text-base flex items-center gap-2">
              <Sliders className="w-5 h-5 text-blue-600" />
              <span>Exam & Study Parameters</span>
            </h2>

            <div className="space-y-4 text-xs">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-slate-600 font-semibold">Target Subject</label>
                  {subjectTopicPresets[subject] && (
                    <button
                      type="button"
                      onClick={() => setTopicList(subjectTopicPresets[subject])}
                      className="text-[11px] text-blue-600 hover:text-blue-700 font-bold flex items-center gap-1 cursor-pointer"
                    >
                      <Wand2 className="w-3 h-3" />
                      <span>Load {subject} Presets</span>
                    </button>
                  )}
                </div>
                <select
                  value={subject}
                  onChange={(e) => {
                    const newSub = e.target.value;
                    setSubject(newSub);
                    if (subjectTopicPresets[newSub]) {
                      setTopicList(subjectTopicPresets[newSub]);
                    }
                  }}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:ring-2 focus:ring-blue-500 font-medium"
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

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">Exam Date</label>
                  <input
                    type="date"
                    value={examDate}
                    onChange={(e) => setExamDate(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:ring-2 focus:ring-blue-500 font-medium"
                  />
                </div>

                <div>
                  <label className="block text-slate-600 font-semibold mb-1">Daily Study (Mins)</label>
                  <input
                    type="number"
                    min={20}
                    max={240}
                    step={10}
                    value={dailyMinutes}
                    onChange={(e) => setDailyMinutes(Number(e.target.value))}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:ring-2 focus:ring-blue-500 font-medium"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Add Topic Card */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <Plus className="w-4 h-4 text-blue-600" />
              <span>Add Syllabus Topic & Performance Signal</span>
            </h3>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-600 font-medium mb-1">Topic Name</label>
                <input
                  type="text"
                  placeholder="e.g. Integration by Parts"
                  value={newTopicName}
                  onChange={(e) => setNewTopicName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 font-medium mb-1">Score: {newScore}%</label>
                  <input
                    type="range"
                    min={0}
                    max={100}
                    value={newScore}
                    onChange={(e) => setNewScore(Number(e.target.value))}
                    className="w-full accent-blue-600"
                  />
                </div>

                <div>
                  <label className="block text-slate-600 font-medium mb-1">Confidence: {newConfidence}/5</label>
                  <input
                    type="range"
                    min={1}
                    max={5}
                    value={newConfidence}
                    onChange={(e) => setNewConfidence(Number(e.target.value))}
                    className="w-full accent-blue-600"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 font-medium mb-1">Exam Weight: {newWeight}</label>
                  <input
                    type="range"
                    min={0.1}
                    max={1.0}
                    step={0.05}
                    value={newWeight}
                    onChange={(e) => setNewWeight(Number(e.target.value))}
                    className="w-full accent-blue-600"
                  />
                </div>

                <div>
                  <label className="block text-slate-600 font-medium mb-1">Days Since Review: {newStaleness}d</label>
                  <input
                    type="number"
                    min={0}
                    max={90}
                    value={newStaleness}
                    onChange={(e) => setNewStaleness(Number(e.target.value))}
                    className="w-full px-2 py-1.5 bg-slate-50 border border-slate-200 rounded-lg"
                  />
                </div>
              </div>

              <button
                onClick={handleAddTopic}
                disabled={!newTopicName.trim()}
                className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-semibold text-xs transition-colors cursor-pointer disabled:opacity-40"
              >
                Add Topic to Signal Matrix
              </button>
            </div>
          </div>

          {/* Current Signal Matrix */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-3">
            <div className="flex items-center justify-between text-xs font-bold text-slate-700">
              <span>Configured Topics ({topicList.length})</span>
              <span className="text-[11px] text-slate-400">Higher weight = urgent</span>
            </div>

            <div className="space-y-2 max-h-64 overflow-y-auto">
              {topicList.map((tp, idx) => (
                <div
                  key={idx}
                  className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between text-xs"
                >
                  <div className="space-y-1">
                    <span className="font-semibold text-slate-800 block">{tp.topic}</span>
                    <div className="flex items-center gap-2 text-[11px] text-slate-500">
                      <span className="bg-red-50 text-red-700 px-1.5 py-0.5 rounded border border-red-200">
                        Score: {tp.self_reported_score}%
                      </span>
                      <span className="bg-amber-50 text-amber-700 px-1.5 py-0.5 rounded border border-amber-200">
                        Conf: {tp.confidence_level}/5
                      </span>
                      <span>Staleness: {tp.days_since_last_review}d</span>
                    </div>
                  </div>
                  <button
                    onClick={() => handleRemoveTopic(idx)}
                    className="p-1 text-slate-400 hover:text-red-600 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>

            <button
              onClick={handleGeneratePlan}
              disabled={isLoading || topicList.length === 0}
              className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-xs flex items-center justify-center gap-2 transition-colors cursor-pointer disabled:opacity-50 mt-4"
            >
              <Sparkles className="w-4 h-4 text-blue-200" />
              <span>{isLoading ? 'Computing Optimal Schedule...' : 'Generate AI Study Schedule'}</span>
            </button>
          </div>
        </div>

        {/* Right Column: Computed Schedule & Visual Timeline */}
        <div className="lg:col-span-7 space-y-6">
          {plan.length === 0 ? (
            <div className="bg-white p-12 rounded-2xl border border-dashed border-slate-300 text-center space-y-4">
              <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mx-auto">
                <CalendarDays className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-slate-800 text-base">No Study Plan Generated Yet</h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                Click <strong>"Generate AI Study Schedule"</strong> to run the Planner Agent
                and allocate your highest-priority topics spaced leading up to your exam date.
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Rationale Banner */}
              {rationale && (
                <div className="bg-blue-50 border border-blue-200 rounded-2xl p-5 shadow-xs space-y-2">
                  <div className="flex items-center gap-2 text-xs font-bold text-blue-900">
                    <Sparkles className="w-4 h-4 text-blue-600" />
                    <span>Planner Agent Rationale:</span>
                  </div>
                  <p className="text-xs text-blue-800 leading-relaxed">{rationale}</p>
                </div>
              )}

              {/* Revision Schedule Table / Cards */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CalendarDays className="w-4 h-4 text-blue-600" />
                    <span className="font-bold text-sm text-slate-900">
                      Spaced Revision Timeline ({plan.length} Sessions)
                    </span>
                  </div>
                  <span className="text-xs text-slate-500 font-medium">
                    {plan.filter((p) => p.completed).length}/{plan.length} Completed
                  </span>
                </div>

                <div className="divide-y divide-slate-100">
                  {plan.map((item, idx) => (
                    <div
                      key={idx}
                      className={`p-4 flex items-center justify-between transition-colors ${
                        item.completed ? 'bg-emerald-50/40' : 'hover:bg-slate-50/60'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => toggleTaskCompleted(idx)}
                          className="text-slate-400 hover:text-emerald-600 transition-colors"
                        >
                          {item.completed ? (
                            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                          ) : (
                            <Circle className="w-5 h-5" />
                          )}
                        </button>
                        <div>
                          <h4
                            className={`font-semibold text-xs sm:text-sm ${
                              item.completed ? 'line-through text-slate-400' : 'text-slate-800'
                            }`}
                          >
                            {item.topic}
                          </h4>
                          <div className="flex items-center gap-2 text-[11px] text-slate-500 mt-0.5">
                            <span className="font-mono">📅 {item.scheduled_date}</span>
                            <span>•</span>
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3 text-slate-400" />
                              {item.recommended_minutes} mins
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="text-right">
                        <span
                          className={`text-xs px-2.5 py-1 rounded-full font-bold ${
                            item.priority_score > 0.65
                              ? 'bg-red-50 text-red-700 border border-red-200'
                              : item.priority_score > 0.45
                              ? 'bg-amber-50 text-amber-700 border border-amber-200'
                              : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          }`}
                        >
                          Priority {item.priority_score}
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
