import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { TutorView } from './components/TutorView';
import { StudyPlanView } from './components/StudyPlanView';
import { FlashcardView } from './components/FlashcardView';
import { CurriculumView } from './components/CurriculumView';
import { IngestionView } from './components/IngestionView';
import { VideoModal } from './components/VideoModal';
import { VideoExplainerResponse } from './types';

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'tutor' | 'planner' | 'flashcards' | 'curriculum' | 'ingestion'>('tutor');
  const [activeVideo, setActiveVideo] = useState<VideoExplainerResponse | null>(null);

  const [systemStatus, setSystemStatus] = useState({
    groqConfigured: false,
    groqModel: 'llama-3.3-70b-versatile',
    geminiConfigured: false,
    activeProvider: 'Local Rule Engine',
    documentsIndexed: 6
  });

  useEffect(() => {
    fetch('/api/health')
      .then((res) => res.json())
      .then((data) => {
        setSystemStatus({
          groqConfigured: data.groq_configured || false,
          groqModel: data.groq_model || 'llama-3.3-70b-versatile',
          geminiConfigured: data.gemini_configured || false,
          activeProvider: data.active_llm_provider || 'Built-in Engine',
          documentsIndexed: data.documents_indexed || 6
        });
      })
      .catch((err) => {
        console.warn('System status fetch warning:', err);
      });
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans">
      {/* Top Navbar */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        systemStatus={systemStatus}
      />

      {/* Main View Router */}
      <div className="flex-1">
        {activeTab === 'tutor' && (
          <TutorView
            onOpenVideo={setActiveVideo}
            onNavigateToIngest={() => setActiveTab('ingestion')}
          />
        )}
        {activeTab === 'planner' && <StudyPlanView />}
        {activeTab === 'flashcards' && <FlashcardView />}
        {activeTab === 'curriculum' && <CurriculumView />}
        {activeTab === 'ingestion' && <IngestionView />}
      </div>

      {/* Video Explainer Modal */}
      <VideoModal
        video={activeVideo}
        onClose={() => setActiveVideo(null)}
      />
    </div>
  );
};

export default App;
