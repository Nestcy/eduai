import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { LandingView } from './components/LandingView';
import { StudentDashboardView } from './components/StudentDashboardView';
import { TutorView } from './components/TutorView';
import { StudyPlanView } from './components/StudyPlanView';
import { FlashcardView } from './components/FlashcardView';
import { CurriculumView } from './components/CurriculumView';
import { IngestionView } from './components/IngestionView';
import { VideoModal } from './components/VideoModal';
import { AuthModal } from './components/AuthModal';
import { SupabaseAuthService, StudentProfileRecord } from './lib/supabase';
import { VideoExplainerResponse } from './types';

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'tutor' | 'flashcards'>('dashboard');
  const [activeVideo, setActiveVideo] = useState<VideoExplainerResponse | null>(null);

  // Auth Modal State
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<'signin' | 'signup'>('signin');
  const [currentUser, setCurrentUser] = useState<{ email: string; name?: string } | null>(null);

  const [systemStatus, setSystemStatus] = useState({
    groqConfigured: false,
    groqModel: 'qwen/qwen3.6-27b',
    geminiConfigured: false,
    supabaseConfigured: true,
    activeProvider: 'Local Rule Engine',
    documentsIndexed: 6
  });

  // Check Supabase Auth Session on Mount & Listen for changes
  useEffect(() => {
    SupabaseAuthService.getSession().then(({ session, user }) => {
      if (user && user.email) {
        setCurrentUser({
          email: user.email,
          name: user.user_metadata?.name || user.email.split('@')[0]
        });
      }
    });

    const { data: authListener } = SupabaseAuthService.onAuthStateChange((event, session) => {
      if (session?.user && session.user.email) {
        setCurrentUser({
          email: session.user.email,
          name: session.user.user_metadata?.name || session.user.email.split('@')[0]
        });
      } else {
        setCurrentUser(null);
      }
    });

    return () => {
      authListener?.subscription?.unsubscribe();
    };
  }, []);

  useEffect(() => {
    fetch('/api/health')
      .then((res) => res.json())
      .then((data) => {
        setSystemStatus({
          groqConfigured: data.groq_configured || false,
          groqModel: data.groq_model || 'llama-3.3-70b-versatile',
          geminiConfigured: data.gemini_configured || false,
          supabaseConfigured: data.supabase_configured ?? true,
          activeProvider: data.active_llm_provider || 'Built-in Engine',
          documentsIndexed: data.documents_indexed || 6
        });
      })
      .catch((err) => {
        console.warn('System status fetch warning:', err);
      });
  }, []);

  const handleOpenAuth = (mode: 'signin' | 'signup' = 'signin') => {
    setAuthModalMode(mode);
    setAuthModalOpen(true);
  };

  const handleSignOut = async () => {
    await SupabaseAuthService.signOut();
    setCurrentUser(null);
  };

  const handleAuthSuccess = (profile: StudentProfileRecord, email: string) => {
    setCurrentUser({
      email,
      name: profile.name || email.split('@')[0]
    });
    // Refresh to reload user state
    window.location.reload();
  };

  return (
    <div className="min-h-screen bg-[#0A0A0B] text-white flex flex-col font-sans">
      {/* 1. Top Navigation Strip */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        systemStatus={systemStatus}
        currentUser={currentUser}
        onOpenAuth={handleOpenAuth}
        onSignOut={handleSignOut}
      />

      {/* 2. Workspace Body */}
      <div className="flex-1 flex flex-col min-w-0">
        <main className="flex-1 bg-[#080809] flex flex-col min-w-0 p-4 sm:p-6 overflow-y-auto">
          {!currentUser ? (
            <LandingView 
              onOpenAuth={handleOpenAuth}
              onAuthSuccess={handleAuthSuccess}
            />
          ) : (
            <>
              {activeTab === 'dashboard' && (
                <StudentDashboardView 
                  onNavigate={(tab) => setActiveTab(tab)} 
                  onOpenAuth={() => handleOpenAuth('signup')}
                  isLoggedIn={true}
                  currentUser={currentUser}
                />
              )}
              {activeTab === 'tutor' && (
                <TutorView
                  currentUser={currentUser}
                  onNavigate={(tab) => setActiveTab(tab)}
                  onOpenVideo={setActiveVideo}
                  onNavigateToIngest={() => setActiveTab('dashboard')}
                />
              )}
              {activeTab === 'flashcards' && <FlashcardView />}
            </>
          )}
        </main>
      </div>

      {/* Video Explainer Modal */}
      <VideoModal
        video={activeVideo}
        onClose={() => setActiveVideo(null)}
      />

      {/* Supabase Authentication Modal */}
      <AuthModal
        isOpen={authModalOpen}
        initialMode={authModalMode}
        onClose={() => setAuthModalOpen(false)}
        onAuthSuccess={handleAuthSuccess}
      />
    </div>
  );
};

export default App;
