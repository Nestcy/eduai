import React, { useState, useEffect } from 'react';
import { VideoExplainerResponse } from '../types';
import { X, Play, Pause, RotateCcw, Sparkles, CheckCircle2, ChevronRight, Video, Volume2 } from 'lucide-react';

interface VideoModalProps {
  video: VideoExplainerResponse | null;
  onClose: () => void;
}

export const VideoModal: React.FC<VideoModalProps> = ({ video, onClose }) => {
  const [activeSceneIdx, setActiveSceneIdx] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    setActiveSceneIdx(0);
    setProgress(0);
    setIsPlaying(true);
  }, [video]);

  // Autoplay scene progress timer
  useEffect(() => {
    if (!video || !isPlaying) return;

    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          if (activeSceneIdx < video.scenes.length - 1) {
            setActiveSceneIdx((idx) => idx + 1);
            return 0;
          } else {
            setIsPlaying(false);
            return 100;
          }
        }
        return prev + 2; // ~5 seconds per scene
      });
    }, 100);

    return () => clearInterval(interval);
  }, [video, isPlaying, activeSceneIdx]);

  if (!video) return null;

  const currentScene = video.scenes[activeSceneIdx] || video.scenes[0];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-xs">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col border border-slate-200 animate-in fade-in zoom-in duration-200">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/80">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-red-600 text-white flex items-center justify-center shadow-xs">
              <Video className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                {video.title}
                <span className="text-xs px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full font-medium">
                  {video.duration}
                </span>
              </h3>
              <p className="text-xs text-slate-500">
                AI Explainer Video Agent • {video.subject} ({video.topic})
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Video Canvas / Storyboard Screen */}
        <div className="p-6 flex-1 overflow-y-auto bg-slate-950 text-white flex flex-col justify-between relative min-h-[380px]">
          {/* Animated Background Gradients */}
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-950/70 via-slate-950 to-blue-950/60 pointer-events-none" />

          {/* Top Scene Tracker */}
          <div className="relative z-10 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-1 bg-red-600/90 text-white text-[11px] font-bold tracking-wider uppercase rounded-md shadow-xs">
                Scene {activeSceneIdx + 1}/{video.scenes.length}
              </span>
              <span className="text-xs text-slate-400 font-mono">{currentScene.timestamp}</span>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-emerald-400 bg-emerald-950/80 border border-emerald-800/60 px-2.5 py-0.5 rounded-full">
              <Volume2 className="w-3.5 h-3.5" />
              <span>Voice Narration Active</span>
            </div>
          </div>

          {/* Scene Center Stage */}
          <div className="relative z-10 my-6 max-w-2xl mx-auto text-center space-y-4">
            <h4 className="text-2xl font-bold text-white tracking-tight leading-snug">
              {currentScene.title}
            </h4>

            {/* Visual Board Animation Mockup */}
            <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 shadow-inner text-left">
              <div className="text-[11px] font-semibold text-blue-400 uppercase tracking-wider mb-2 flex items-center gap-1">
                <Sparkles className="w-3 h-3" /> Visual Display:
              </div>
              <p className="text-sm text-slate-300 italic mb-3">
                "{currentScene.visualPrompt}"
              </p>

              {/* Key Concept Pills */}
              <div className="flex flex-wrap gap-2 pt-2 border-t border-slate-800">
                {currentScene.keyPoints.map((point, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-blue-950/60 border border-blue-800/60 text-blue-200 text-xs font-medium"
                  >
                    <CheckCircle2 className="w-3 h-3 text-blue-400" />
                    {point}
                  </span>
                ))}
              </div>
            </div>

            {/* Narration Script Box */}
            <div className="p-3 bg-slate-900/50 rounded-lg border border-slate-800/80 text-xs text-slate-300 leading-relaxed text-left">
              <span className="font-semibold text-slate-400 mr-2">Audio Narration:</span>
              {currentScene.narration}
            </div>
          </div>

          {/* Player Timeline Bar */}
          <div className="relative z-10 space-y-2">
            <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
              <div
                className="bg-red-500 h-full transition-all duration-100 ease-linear rounded-full"
                style={{ width: `${progress}%` }}
              />
            </div>

            {/* Playback Controls */}
            <div className="flex items-center justify-between text-xs text-slate-400">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsPlaying(!isPlaying)}
                  className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-white transition-colors"
                >
                  {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                </button>
                <button
                  onClick={() => {
                    setProgress(0);
                    setActiveSceneIdx(0);
                    setIsPlaying(true);
                  }}
                  className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-white transition-colors"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
                <span>{isPlaying ? 'Playing Scene...' : 'Paused'}</span>
              </div>

              {/* Scene Picker Buttons */}
              <div className="flex items-center gap-1">
                {video.scenes.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      setActiveSceneIdx(idx);
                      setProgress(0);
                    }}
                    className={`w-6 h-6 rounded-md text-xs font-bold transition-all ${
                      activeSceneIdx === idx
                        ? 'bg-red-600 text-white'
                        : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                    }`}
                  >
                    {idx + 1}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Footer info */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-600">
          <p className="line-clamp-1">
            <strong className="text-slate-800">Lesson Summary:</strong> {video.summary}
          </p>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-900 text-white rounded-lg hover:bg-slate-800 font-medium transition-colors cursor-pointer"
          >
            Close Explainer
          </button>
        </div>
      </div>
    </div>
  );
};
