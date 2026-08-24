import React, { useState, useEffect } from 'react';
import { Database, Plus, Terminal } from 'lucide-react';

interface ControlPanelProps {
  documentsIndexed: number;
  onNavigateToIngest?: () => void;
}

export const ControlPanel: React.FC<ControlPanelProps> = ({
  documentsIndexed,
  onNavigateToIngest
}) => {
  const [country, setCountry] = useState<string>(() => {
    return localStorage.getItem('eduai_country') || 'United Kingdom (GCSE / A-Level)';
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

  useEffect(() => {
    localStorage.setItem('eduai_country', country);
    localStorage.setItem('eduai_board', board);
    localStorage.setItem('eduai_grade', grade);
    localStorage.setItem('eduai_subject', subject);
  }, [country, board, grade, subject]);

  return (
    <aside className="w-full lg:w-[320px] bg-[#0d0d0e] border-l border-white/10 p-6 flex flex-col justify-between shrink-0 overflow-y-auto">
      <div className="space-y-6">
        {/* Section 1: Configuration */}
        <div className="space-y-3">
          <div className="label-mono text-[#C15B3A] font-bold flex items-center justify-between">
            <span>Configuration</span>
            <Terminal className="w-3.5 h-3.5 text-[#D4AF37]" />
          </div>

          <div className="space-y-3">
            <div>
              <label className="block label-mono text-[9px] uppercase tracking-wider text-white/60 mb-1">
                Region / Country
              </label>
              <select
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                className="w-full bg-[#111111] border border-white/10 text-white p-3 font-sans text-xs rounded-sm focus:outline-none focus:border-[#D4AF37]"
              >
                <option value="United Kingdom (GCSE / A-Level)">United Kingdom (GCSE)</option>
                <option value="United States (AP / SAT / High School)">United States (AP / SAT)</option>
                <option value="Global Standard (Universal)">Global Standard</option>
                <option value="India (CBSE / ICSE / JEE)">India (CBSE / ICSE)</option>
                <option value="International Baccalaureate (IB)">IB Diploma Programme</option>
              </select>
            </div>

            <div>
              <label className="block label-mono text-[9px] uppercase tracking-wider text-white/60 mb-1">
                Exam Board
              </label>
              <select
                value={board}
                onChange={(e) => setBoard(e.target.value)}
                className="w-full bg-[#111111] border border-white/10 text-white p-3 font-sans text-xs rounded-sm focus:outline-none focus:border-[#D4AF37]"
              >
                <option value="Cambridge IGCSE / A-Level">Cambridge IGCSE</option>
                <option value="Edexcel / Pearson">Edexcel / Pearson</option>
                <option value="AQA (Assessment and Qualifications Alliance)">AQA</option>
                <option value="IB Diploma Programme">IB Diploma Programme</option>
                <option value="College Board AP">College Board AP</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block label-mono text-[9px] uppercase tracking-wider text-white/60 mb-1">
                  Grade Level
                </label>
                <select
                  value={grade}
                  onChange={(e) => setGrade(e.target.value)}
                  className="w-full bg-[#111111] border border-white/10 text-white p-2.5 font-sans text-xs rounded-sm focus:outline-none focus:border-[#D4AF37]"
                >
                  <option value="Grade 12">Grade 12</option>
                  <option value="Grade 11">Grade 11</option>
                  <option value="Grade 10">Grade 10</option>
                  <option value="Grade 9">Grade 9</option>
                </select>
              </div>

              <div>
                <label className="block label-mono text-[9px] uppercase tracking-wider text-white/60 mb-1">
                  Subject
                </label>
                <select
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="w-full bg-[#111111] border border-white/10 text-white p-2.5 font-sans text-xs rounded-sm focus:outline-none focus:border-[#D4AF37]"
                >
                  <option value="Mathematics">Math</option>
                  <option value="Biology">Biology</option>
                  <option value="Physics">Physics</option>
                  <option value="Chemistry">Chemistry</option>
                  <option value="Computer Science">Computer Sci</option>
                  <option value="Economics">Economics</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Section 2: Stat Card (Deep Industrial Style) */}
        <div className="stat-card-industrial">
          <div className="label-mono mb-1 text-white/60">Memory Index</div>
          <div className="stat-value-industrial">
            {documentsIndexed > 0 ? `${documentsIndexed * 5}_CHUNKS` : '30_CHUNKS'}
          </div>
          <div className="label-mono text-[0.55rem] opacity-50 mt-1">
            Active Syllabus Grounding
          </div>
          <button
            onClick={onNavigateToIngest}
            className="w-full mt-4 py-2 bg-[#000000] hover:bg-white/5 border border-white/10 text-[#D4AF37] font-mono-tech text-xs transition-all cursor-pointer flex items-center justify-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>+ INDEX PDF</span>
          </button>
        </div>

        {/* Section 3: Recent Triggers (Deep Industrial Style) */}
        <div className="space-y-2">
          <div className="label-mono text-[#C15B3A] mb-3">
            Recent Triggers
          </div>

          <div className="flex flex-col">
            {[
              'Calculus Derivation Breakdown',
              'Organic Reaction Mechanism Proof',
              'Newton Law Vector Schematics',
              'Le Chatelier Equilibrium Curves'
            ].map((trigger, idx) => (
              <div key={idx} className="trigger-item-industrial cursor-pointer">
                <span>{trigger}</span>
                <span className="text-[#D4AF37] text-[10px]">▶</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Footer System Status */}
      <div className="mt-8 pt-4 border-t border-white/10 label-mono text-[0.55rem] text-white/30 text-center leading-tight">
        SECURE_CONNECTION_ESTABLISHED<br />// GROUNDING_SYNC_OK
      </div>
    </aside>
  );
};
