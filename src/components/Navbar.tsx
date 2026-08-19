import React from 'react';
import { 
  GraduationCap, 
  MessageSquare, 
  CalendarDays, 
  Layers, 
  BookOpen, 
  Database, 
  Sparkles,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';

interface NavbarProps {
  activeTab: 'tutor' | 'planner' | 'flashcards' | 'curriculum' | 'ingestion';
  setActiveTab: (tab: 'tutor' | 'planner' | 'flashcards' | 'curriculum' | 'ingestion') => void;
  systemStatus: {
    groqConfigured: boolean;
    groqModel?: string;
    geminiConfigured: boolean;
    activeProvider?: string;
    documentsIndexed: number;
  };
}

export const Navbar: React.FC<NavbarProps> = ({ activeTab, setActiveTab, systemStatus }) => {
  const navItems = [
    { id: 'tutor' as const, label: 'AI Tutor', icon: MessageSquare, badge: 'RAG Grounded' },
    { id: 'planner' as const, label: 'Study Planner', icon: CalendarDays, badge: 'Spaced Rep' },
    { id: 'flashcards' as const, label: 'Flashcards', icon: Layers, badge: 'PDF Export' },
    { id: 'curriculum' as const, label: 'Curriculum Specs', icon: BookOpen, badge: 'AO1/2/3' },
    { id: 'ingestion' as const, label: 'Knowledge Base', icon: Database, badge: `${systemStatus.documentsIndexed} Chunks` },
  ];

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Brand */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-sm">
              <GraduationCap className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-lg text-slate-900 tracking-tight">EduAI Platform</span>
                <span className="px-2 py-0.5 text-[10px] font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200 rounded-full flex items-center gap-1">
                  <Sparkles className="w-2.5 h-2.5" />
                  {systemStatus.groqConfigured ? 'Groq LLM' : systemStatus.geminiConfigured ? 'Gemini LLM' : 'Multi-Agent'}
                </span>
              </div>
              <p className="text-xs text-slate-500 hidden sm:block">
                Syllabus-Grounded Tutoring, Planning & Exam Prep
              </p>
            </div>
          </div>

          {/* Nav Tabs */}
          <nav className="flex items-center gap-1 overflow-x-auto py-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  id={`nav-tab-${item.id}`}
                  onClick={() => setActiveTab(item.id)}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-medium transition-all cursor-pointer whitespace-nowrap ${
                    isActive
                      ? 'bg-blue-50 text-blue-700 font-semibold shadow-xs border border-blue-200/80'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80 border border-transparent'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-blue-600' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>

          {/* Engine Status Indicators */}
          <div className="hidden lg:flex items-center gap-2">
            <div className="flex items-center gap-1.5 px-2.5 py-1 bg-slate-100 rounded-lg text-xs text-slate-600 border border-slate-200">
              <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
              <span>LLM Engine:</span>
              <span className="font-semibold text-slate-900">
                {systemStatus.activeProvider || (systemStatus.groqConfigured ? 'Groq' : 'Adaptive RAG')}
              </span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
