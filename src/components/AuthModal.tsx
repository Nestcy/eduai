import React, { useState, useEffect } from 'react';
import { 
  Lock, 
  Mail, 
  User, 
  LogIn, 
  UserPlus, 
  X, 
  CheckCircle2, 
  AlertCircle, 
  Loader2, 
  Globe, 
  GraduationCap, 
  BookOpen,
  ArrowRight,
  ShieldCheck
} from 'lucide-react';
import { SupabaseAuthService, SupabaseDataService, StudentProfileRecord } from '../lib/supabase';
import confetti from 'canvas-confetti';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAuthSuccess: (profile: StudentProfileRecord, email: string) => void;
  initialMode?: 'signin' | 'signup';
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  onAuthSuccess,
  initialMode = 'signin'
}) => {
  const [mode, setMode] = useState<'signin' | 'signup'>(initialMode);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [country, setCountry] = useState('United Kingdom');
  const [examBoard, setExamBoard] = useState('Cambridge (CAIE)');
  const [currentGrade, setCurrentGrade] = useState('A-Level Year 12');
  const [targetGrade, setTargetGrade] = useState('A*');

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    setMode(initialMode);
    setErrorMsg(null);
    setSuccessMsg(null);
  }, [initialMode, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!email || !password) {
      setErrorMsg('Please enter both your email address and password.');
      return;
    }

    if (mode === 'signup' && !name.trim()) {
      setErrorMsg('Please enter your full candidate name.');
      return;
    }

    if (password.length < 6) {
      setErrorMsg('Password must be at least 6 characters long.');
      return;
    }

    setLoading(true);

    try {
      if (mode === 'signup') {
        const { user, session, error } = await SupabaseAuthService.signUp(email, password, {
          name: name.trim(),
          country,
          exam_board: examBoard,
          current_grade: currentGrade,
          target_grade: targetGrade
        });

        if (error) {
          setErrorMsg(error.message || 'Failed to create student account. Please try again.');
          setLoading(false);
          return;
        }

        // Create or link student database record in Supabase
        const student = await SupabaseDataService.getOrCreateStudent({
          name: name.trim(),
          email,
          country,
          exam_board: examBoard,
          current_grade: currentGrade,
          target_grade: targetGrade
        });

        confetti({ particleCount: 40, spread: 60 });
        setSuccessMsg('Account created successfully! Synchronizing study profile...');
        setTimeout(() => {
          if (student) {
            onAuthSuccess(student, email);
          }
          onClose();
        }, 1000);
      } else {
        // Sign In
        const { user, session, error } = await SupabaseAuthService.signIn(email, password);

        if (error) {
          setErrorMsg(error.message || 'Invalid email or password. Please verify and retry.');
          setLoading(false);
          return;
        }

        // Fetch or create student record for this user
        const student = await SupabaseDataService.getOrCreateStudent({
          name: user?.user_metadata?.name || email.split('@')[0],
          email,
          country: user?.user_metadata?.country || country,
          exam_board: user?.user_metadata?.exam_board || examBoard,
          current_grade: user?.user_metadata?.current_grade || currentGrade,
          target_grade: user?.user_metadata?.target_grade || 'A*'
        });

        confetti({ particleCount: 30, spread: 50 });
        setSuccessMsg('Welcome back! Loading your enrolled subjects & mastery history...');
        setTimeout(() => {
          if (student) {
            onAuthSuccess(student, email);
          }
          onClose();
        }, 800);
      }
    } catch (err: any) {
      console.warn('Auth error:', err);
      setErrorMsg(err?.message || 'An unexpected error occurred during authentication.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        id="auth-modal-card"
        className="w-full max-w-lg bg-[#0F0F12] border border-[#27272A] rounded-md shadow-2xl overflow-hidden flex flex-col my-auto"
      >
        {/* Header */}
        <div className="bg-[#141418] border-b border-[#27272A] px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded bg-[#D4AF37]/15 border border-[#D4AF37]/40 flex items-center justify-center text-[#D4AF37]">
              {mode === 'signup' ? <UserPlus className="w-4 h-4" /> : <LogIn className="w-4 h-4" />}
            </div>
            <div>
              <h2 className="text-base font-semibold text-white font-sans tracking-tight">
                {mode === 'signup' ? 'Create Student Account' : 'Student Account Sign In'}
              </h2>
              <p className="text-xs text-white/50 font-mono-tech">
                {mode === 'signup' ? 'Save subjects, diagnostics & flashcards to Supabase' : 'Access your synced study schedule & progress'}
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1 rounded-sm text-white/40 hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Toggle */}
        <div className="grid grid-cols-2 p-1.5 bg-[#121215] border-b border-[#27272A]">
          <button
            type="button"
            onClick={() => { setMode('signin'); setErrorMsg(null); setSuccessMsg(null); }}
            className={`py-2 text-xs font-mono-tech uppercase tracking-wider rounded-sm transition-all cursor-pointer font-medium ${
              mode === 'signin'
                ? 'bg-[#D4AF37]/15 text-[#D4AF37] border border-[#D4AF37]/40 shadow-xs'
                : 'text-white/50 hover:text-white hover:bg-white/5'
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => { setMode('signup'); setErrorMsg(null); setSuccessMsg(null); }}
            className={`py-2 text-xs font-mono-tech uppercase tracking-wider rounded-sm transition-all cursor-pointer font-medium ${
              mode === 'signup'
                ? 'bg-[#D4AF37]/15 text-[#D4AF37] border border-[#D4AF37]/40 shadow-xs'
                : 'text-white/50 hover:text-white hover:bg-white/5'
            }`}
          >
            Create Account
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto max-h-[75vh]">
          {errorMsg && (
            <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-sm text-rose-300 text-xs flex items-start gap-2 animate-in fade-in">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-sm text-emerald-300 text-xs flex items-start gap-2 animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{successMsg}</span>
            </div>
          )}

          {mode === 'signup' && (
            <div className="space-y-1.5">
              <label className="text-xs font-mono-tech uppercase text-white/70 tracking-wider flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-[#D4AF37]" /> Full Candidate Name
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., Alexander Wright"
                className="w-full bg-[#18181C] border border-[#27272A] rounded-sm px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-[#D4AF37] transition-colors"
              />
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-xs font-mono-tech uppercase text-white/70 tracking-wider flex items-center gap-1.5">
              <Mail className="w-3.5 h-3.5 text-[#D4AF37]" /> Email Address
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="candidate@school.edu or name@example.com"
              className="w-full bg-[#18181C] border border-[#27272A] rounded-sm px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-[#D4AF37] transition-colors"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-mono-tech uppercase text-white/70 tracking-wider flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5 text-[#D4AF37]" /> Password
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••••••"
              className="w-full bg-[#18181C] border border-[#27272A] rounded-sm px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-[#D4AF37] transition-colors"
            />
            {mode === 'signup' && (
              <p className="text-[11px] text-white/40 font-mono-tech">Minimum 6 characters</p>
            )}
          </div>

          {mode === 'signup' && (
            <p className="text-[11px] text-white/50 font-mono-tech bg-white/5 p-2.5 rounded-sm border border-white/10 flex items-center gap-2">
              <GraduationCap className="w-4 h-4 text-[#D4AF37] shrink-0" />
              <span>You can configure your full exam board, country, and enrolled subjects directly from your student dashboard once signed in.</span>
            </p>
          )}

          <div className="pt-2">
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-[#D4AF37] hover:bg-[#c49f27] text-black font-semibold text-xs font-mono-tech uppercase tracking-wider rounded-sm transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Processing with Supabase...</span>
                </>
              ) : mode === 'signup' ? (
                <>
                  <UserPlus className="w-4 h-4" />
                  <span>Create Account & Start Sync</span>
                </>
              ) : (
                <>
                  <LogIn className="w-4 h-4" />
                  <span>Sign In & Restore Progress</span>
                </>
              )}
            </button>
          </div>

          <div className="flex items-center justify-center gap-2 text-xs text-white/40 pt-1 font-mono-tech">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>Encrypted & Secured by Supabase Cloud PostgreSQL</span>
          </div>
        </form>
      </div>
    </div>
  );
};
