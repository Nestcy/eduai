import React from 'react';
import { 
  LayoutDashboard,
  MessageSquare, 
  CalendarDays, 
  Layers, 
  BookOpen, 
  Database,
  User,
  LogIn,
  LogOut,
  GraduationCap
} from 'lucide-react';

interface NavbarProps {
  activeTab: 'dashboard' | 'tutor' | 'flashcards';
  setActiveTab: (tab: 'dashboard' | 'tutor' | 'flashcards') => void;
  systemStatus: {
    groqConfigured: boolean;
    groqModel?: string;
    geminiConfigured: boolean;
    activeProvider?: string;
    documentsIndexed: number;
  };
  currentUser?: { email: string; name?: string } | null;
  onOpenAuth: (mode?: 'signin' | 'signup') => void;
  onSignOut: () => void;
  toggleControlPanel?: () => void;
  showControlPanel?: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({ 
  activeTab, 
  setActiveTab,
  currentUser,
  onOpenAuth,
  onSignOut
}) => {
  const navItems = [
    { id: 'dashboard' as const, num: '01', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'tutor' as const, num: '02', label: 'AI Tutor', icon: MessageSquare },
    { id: 'flashcards' as const, num: '03', label: 'Flashcards', icon: Layers },
  ];

  return (
    <header className="w-full bg-[#0A0A0B] border-b border-[#1F1F23]/80 px-4 py-2.5 shrink-0 z-40 sticky top-0 flex items-center justify-between gap-4">
      {/* Left Brand Logo */}
      <div className="flex items-center gap-2.5 shrink-0">
        <div className="w-8 h-8 rounded-sm bg-[#D4AF37]/15 border border-[#D4AF37]/40 flex items-center justify-center text-[#D4AF37]">
          <GraduationCap className="w-4 h-4" />
        </div>
        <div>
          <span className="text-sm font-semibold tracking-tight text-white font-sans">EduAI Platform</span>
          {!currentUser && (
            <span className="hidden sm:inline-block ml-2 text-[10px] font-mono-tech px-1.5 py-0.5 bg-[#D4AF37]/10 text-[#D4AF37] border border-[#D4AF37]/30 rounded-xs uppercase">
              Curriculum AI
            </span>
          )}
        </div>
      </div>

      {/* Center Nav tabs - ONLY visible when user is logged in */}
      {currentUser && (
        <div className="flex-1 flex justify-center overflow-x-auto no-scrollbar">
          <nav className="flex items-center gap-1.5 bg-[#121214] p-1 rounded-sm border border-[#1F1F23] overflow-x-auto no-scrollbar max-w-full">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  id={`nav-tab-${item.id}`}
                  onClick={() => setActiveTab(item.id)}
                  className={`flex items-center gap-2 px-3.5 py-1.5 rounded-sm font-mono-tech text-xs uppercase tracking-wider transition-all cursor-pointer whitespace-nowrap shrink-0 ${
                    isActive
                      ? 'bg-[#D4AF37]/15 text-[#D4AF37] border border-[#D4AF37]/40 font-semibold shadow-xs'
                      : 'text-white/60 hover:text-white hover:bg-white/5 border border-transparent'
                  }`}
                >
                  <span className={`text-[10px] ${isActive ? 'text-[#D4AF37] font-bold' : 'text-white/40'}`}>
                    {item.num}
                  </span>
                  <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-[#D4AF37]' : 'text-white/40'}`} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>
      )}

      {/* Right User Auth Strip */}
      <div className="shrink-0 flex items-center gap-2">
        {currentUser ? (
          <div className="flex items-center gap-2 bg-[#141418] border border-[#27272A] px-2.5 py-1 rounded-sm font-mono-tech text-xs">
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-white/80 max-w-[120px] truncate" title={currentUser.email}>
              {currentUser.name || currentUser.email.split('@')[0]}
            </span>
            <button
              onClick={onSignOut}
              title="Sign Out"
              className="text-white/40 hover:text-rose-400 p-0.5 rounded transition-colors cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-1.5 font-mono-tech text-xs">
            <button
              onClick={() => onOpenAuth('signin')}
              className="px-3 py-1.5 bg-white/5 hover:bg-white/10 text-white/80 hover:text-white border border-white/10 rounded-sm uppercase tracking-wider transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <LogIn className="w-3.5 h-3.5 text-[#D4AF37]" />
              <span>Sign In</span>
            </button>
            <button
              onClick={() => onOpenAuth('signup')}
              className="px-3 py-1.5 bg-[#D4AF37] hover:bg-[#c49f27] text-black font-semibold rounded-sm uppercase tracking-wider transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <User className="w-3.5 h-3.5" />
              <span>Sign Up</span>
            </button>
          </div>
        )}
      </div>
    </header>
  );
};

