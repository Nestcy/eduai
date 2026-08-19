import React, { useState, useRef, useEffect } from 'react';
import { TutorMessage, RetrievedChunk, VideoExplainerResponse } from '../types';
import { MarkdownRenderer } from './MarkdownRenderer';
import { GlobalCurriculumPicker } from './GlobalCurriculumPicker';
import { 
  Send, 
  Sparkles, 
  Video, 
  BookOpen, 
  RotateCcw, 
  Compass, 
  Bot, 
  User, 
  Loader2,
  FileText,
  HelpCircle,
  TrendingUp,
  Paperclip,
  Database,
  X,
  Upload
} from 'lucide-react';

interface TutorViewProps {
  onOpenVideo: (video: VideoExplainerResponse) => void;
  onNavigateToIngest?: () => void;
}

export const TutorView: React.FC<TutorViewProps> = ({ onOpenVideo, onNavigateToIngest }) => {
  const [country, setCountry] = useState('Global Standard (Universal)');
  const [board, setBoard] = useState('Cambridge IGCSE / A-Level');
  const [grade, setGrade] = useState('Grade 12');
  const [subject, setSubject] = useState('Mathematics');

  const [inputQuestion, setInputQuestion] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isVideoLoading, setIsVideoLoading] = useState(false);

  // Quick attached file state
  const [attachedFileName, setAttachedFileName] = useState<string | null>(null);
  const [attachedFileText, setAttachedFileText] = useState<string | null>(null);
  const [isUploadingAttachment, setIsUploadingAttachment] = useState(false);
  const chatFileInputRef = useRef<HTMLInputElement>(null);

  // Vector store status
  const [totalIndexedDocs, setTotalIndexedDocs] = useState<number>(1);
  const [totalChunks, setTotalChunks] = useState<number>(6);

  useEffect(() => {
    fetch('/api/documents')
      .then(res => res.json())
      .then(data => {
        if (data.documents) setTotalIndexedDocs(data.documents.length);
        if (data.totalChunks) setTotalChunks(data.totalChunks);
      })
      .catch(() => {});
  }, []);

  const [messages, setMessages] = useState<TutorMessage[]>([
    {
      id: 'welcome-1',
      sender: 'tutor',
      text: `### Welcome to your AI Tutor! 🎓

I am your personalized **${subject}** tutor grounded directly in the **${board} (${country})** syllabus for **${grade}**.

I can help you with:
1. **Step-by-step problem solutions** with formatted LaTeX math equations
2. **Visual concept diagrams** & biochemical/physical pathway flowcharts
3. **Interactive function curve plots**
4. **On-demand AI explainer videos** for difficult topics

Ask any question below, or select one of the suggested syllabus topics!`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);

  const samplePrompts = [
    {
      subject: 'Mathematics',
      text: 'Explain quadratic formula and discriminant with a function curve plot of y = x^2 - 5x + 6'
    },
    {
      subject: 'Biology',
      text: 'How do the light-dependent and Calvin cycle stages of photosynthesis interact with a diagram?'
    },
    {
      subject: 'Physics',
      text: 'Derive the Work-Energy theorem W_net = ΔK from Newton\'s second law with steps'
    },
    {
      subject: 'Chemistry',
      text: 'Explain Le Chatelier\'s Principle for reversible reactions at dynamic equilibrium'
    }
  ];

  const handleChatFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setAttachedFileName(file.name);
      setIsUploadingAttachment(true);

      const reader = new FileReader();
      const isText = file.name.match(/\.(txt|md|csv|json|py|ts|html)$/i);

      if (isText) {
        reader.onload = () => {
          const text = reader.result as string;
          setAttachedFileText(text);
          setIsUploadingAttachment(false);
        };
        reader.readAsText(file);
      } else {
        reader.onload = () => {
          const dataUrl = reader.result as string;
          const base64 = dataUrl.split(',')[1] || '';
          // Auto-index into vector store in background so tutor can retrieve immediately
          fetch('/api/ingest', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              country,
              curriculum_board: board,
              grade,
              subject,
              files: [{ name: file.name, type: file.type, size: file.size, base64 }]
            })
          })
            .then(res => res.json())
            .then(d => {
              setAttachedFileText(`[Ingested ${file.name} (${d.num_chunks || 1} vector chunks)]`);
              setTotalChunks(prev => prev + (d.num_chunks || 1));
              setTotalIndexedDocs(prev => prev + 1);
            })
            .catch(() => {})
            .finally(() => setIsUploadingAttachment(false));
        };
        reader.readAsDataURL(file);
      }
    }
  };

  const handleSendMessage = async (queryText?: string) => {
    let textToSend = queryText || inputQuestion;
    if (!textToSend.trim() && !attachedFileText) return;
    if (isLoading) return;

    if (attachedFileName && attachedFileText) {
      if (!attachedFileText.startsWith('[Ingested')) {
        textToSend = `[Attached Document: ${attachedFileName}]\n${attachedFileText.slice(0, 1500)}\n\nQuestion: ${textToSend}`;
      } else {
        textToSend = `[Referencing uploaded file: ${attachedFileName}]\n${textToSend}`;
      }
    }

    const studentMsg: TutorMessage = {
      id: `msg-${Date.now()}`,
      sender: 'student',
      text: queryText || inputQuestion || `Question regarding ${attachedFileName}`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages((prev) => [...prev, studentMsg]);
    setInputQuestion('');
    setAttachedFileName(null);
    setAttachedFileText(null);
    setIsLoading(true);

    try {
      const response = await fetch('/api/tutor/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: textToSend,
          country,
          curriculum_board: board,
          grade,
          subject
        })
      });

      if (!response.ok) {
        throw new Error(`Tutor service error (${response.status})`);
      }

      const data = await response.json();

      const tutorMsg: TutorMessage = {
        id: `tutor-${Date.now()}`,
        sender: 'tutor',
        text: data.answer || 'I could not generate an answer for this question.',
        thinking: data.thinking || undefined,
        sources: data.sources || [],
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        suggestedVideoTopic: textToSend.slice(0, 40)
      };

      setMessages((prev) => [...prev, tutorMsg]);
    } catch (err: any) {
      console.error('Tutor error:', err);
      const errorMsg: TutorMessage = {
        id: `err-${Date.now()}`,
        sender: 'tutor',
        text: `### ⚠️ Tutor Agent Notice\n\n${err.message || 'Unable to connect to tutor agent.'}\n\nPlease check your network connection or provide a Gemini API key in settings.`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenerateVideo = async (topic: string) => {
    setIsVideoLoading(true);
    try {
      const response = await fetch('/api/tutor/video', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic,
          subject,
          context: `Syllabus level: ${grade} ${board}`
        })
      });

      if (!response.ok) throw new Error('Video generation failed');
      const data = await response.json();
      onOpenVideo(data);
    } catch (err) {
      console.error('Video error:', err);
      alert('Video generation failed. Please try again.');
    } finally {
      setIsVideoLoading(false);
    }
  };

  return (
    <div className="flex flex-col lg:flex-row gap-6 max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
      {/* Left Sidebar: Curriculum Scope Selector */}
      <aside className="w-full lg:w-80 shrink-0 space-y-5">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between text-slate-900 font-bold text-sm">
            <div className="flex items-center gap-2">
              <Compass className="w-4 h-4 text-blue-600" />
              <span>Curriculum Grounding</span>
            </div>
            <span className="text-[10px] px-2 py-0.5 bg-blue-50 text-blue-700 font-bold rounded-md border border-blue-200">
              Global Support
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
        </div>

        {/* Vector Grounding Index Badge & Ingest Shortcut */}
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50/50 p-4 rounded-2xl border border-blue-200/80 shadow-xs space-y-2.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-blue-900 font-bold text-xs">
              <Database className="w-4 h-4 text-blue-600" />
              <span>RAG Syllabus Memory</span>
            </div>
            <span className="text-[10px] font-bold px-2 py-0.5 bg-blue-100 text-blue-800 rounded-md">
              {totalChunks} Chunks
            </span>
          </div>
          <p className="text-[11px] text-blue-700/80 leading-relaxed">
            Answers are grounded in {totalIndexedDocs} active syllabus document{totalIndexedDocs !== 1 ? 's' : ''} and formula sheets.
          </p>
          {onNavigateToIngest && (
            <button
              type="button"
              onClick={onNavigateToIngest}
              className="w-full py-1.5 bg-white hover:bg-blue-600 hover:text-white text-blue-700 font-bold text-[11px] rounded-lg border border-blue-300 transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs"
            >
              <Upload className="w-3 h-3" />
              <span>Upload More Syllabus PDFs</span>
            </button>
          )}
        </div>

        {/* Suggested Prompts */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <span>High-Yield Syllabus Inquiries</span>
          </div>
          <div className="space-y-2">
            {samplePrompts.map((p, idx) => (
              <button
                key={idx}
                onClick={() => {
                  setSubject(p.subject);
                  handleSendMessage(p.text);
                }}
                className="w-full text-left p-2.5 rounded-xl bg-slate-50 hover:bg-blue-50/70 border border-slate-200/80 hover:border-blue-300 transition-all text-xs text-slate-700 cursor-pointer group"
              >
                <span className="font-semibold text-blue-600 block mb-0.5 group-hover:underline">
                  {p.subject}
                </span>
                <span className="line-clamp-2">{p.text}</span>
              </button>
            ))}
          </div>
        </div>
      </aside>

      {/* Main Chat Area */}
      <main className="flex-1 flex flex-col bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden h-[750px]">
        {/* Chat Header */}
        <div className="px-6 py-3.5 border-b border-slate-200 bg-slate-50/70 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-xs">
              <Bot className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-bold text-slate-900 text-sm">
                AI Subject Specialist: {subject}
              </h2>
              <p className="text-xs text-slate-500">
                {board} • {grade} • {country} Syllabus Spec
              </p>
            </div>
          </div>

          <button
            onClick={() =>
              setMessages([
                {
                  id: `welcome-${Date.now()}`,
                  sender: 'tutor',
                  text: `Chat session reset for **${subject}** (${board} ${grade}). What would you like to explore?`,
                  timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                }
              ])
            }
            className="p-2 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 text-xs flex items-center gap-1 transition-colors"
            title="Reset Conversation"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Reset</span>
          </button>
        </div>

        {/* Message Thread */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex gap-3 max-w-3xl ${
                msg.sender === 'student' ? 'ml-auto flex-row-reverse' : 'mr-auto'
              }`}
            >
              {/* Avatar */}
              <div
                className={`w-8 h-8 rounded-xl shrink-0 flex items-center justify-center text-xs font-bold ${
                  msg.sender === 'student'
                    ? 'bg-indigo-600 text-white'
                    : 'bg-gradient-to-tr from-blue-600 to-indigo-600 text-white'
                }`}
              >
                {msg.sender === 'student' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
              </div>

              {/* Message Bubble */}
              <div
                className={`rounded-2xl p-4 sm:p-5 shadow-xs ${
                  msg.sender === 'student'
                    ? 'bg-indigo-600 text-white'
                    : 'bg-slate-50 border border-slate-200 text-slate-800'
                }`}
              >
                {msg.sender === 'student' ? (
                  <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.text}</p>
                ) : (
                  <div>
                    <MarkdownRenderer content={msg.text} thinking={msg.thinking} />

                    {/* Cited Sources */}
                    {msg.sources && msg.sources.length > 0 && (
                      <div className="mt-4 pt-3 border-t border-slate-200/80">
                        <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1">
                          <FileText className="w-3 h-3 text-emerald-600" />
                          Curriculum Sources Grounding:
                        </div>
                        <div className="space-y-1.5">
                          {msg.sources.map((src, idx) => (
                            <div
                              key={idx}
                              className="text-xs bg-white p-2 rounded-lg border border-slate-200 text-slate-600"
                            >
                              <div className="font-semibold text-slate-800 flex items-center justify-between">
                                <span>📄 {src.source}</span>
                                {src.page && <span className="text-[10px] text-slate-400">Page {src.page}</span>}
                              </div>
                              <p className="text-[11px] text-slate-500 mt-1 line-clamp-2 italic">
                                "{src.content}"
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Explainer Video Action Button */}
                    <div className="mt-4 pt-2 flex items-center justify-between">
                      <button
                        onClick={() => handleGenerateVideo(subject)}
                        disabled={isVideoLoading}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 rounded-xl text-xs font-semibold transition-all cursor-pointer shadow-xs disabled:opacity-50"
                      >
                        {isVideoLoading ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Video className="w-3.5 h-3.5 text-red-600" />
                        )}
                        <span>Request AI Explainer Video Lesson</span>
                      </button>
                      <span className="text-[10px] text-slate-400 font-mono">{msg.timestamp}</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="flex gap-3 mr-auto max-w-xl animate-pulse">
              <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center">
                <Bot className="w-4 h-4" />
              </div>
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 flex items-center gap-3">
                <Loader2 className="w-4 h-4 text-blue-600 animate-spin" />
                <span className="text-xs text-slate-600 font-medium">
                  Tutor Agent formulating grounded answer with LaTeX math & diagrams...
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Input Bar */}
        <div className="p-4 border-t border-slate-200 bg-white space-y-2">
          {/* Attached File Preview Tag */}
          {attachedFileName && (
            <div className="flex items-center gap-2 p-2 bg-blue-50 border border-blue-200 rounded-xl text-xs text-blue-900 w-fit">
              <FileText className="w-4 h-4 text-blue-600 shrink-0" />
              <span className="font-semibold truncate max-w-xs">{attachedFileName}</span>
              {isUploadingAttachment ? (
                <span className="text-[10px] text-blue-600 animate-pulse font-medium">Extracting vectors...</span>
              ) : (
                <span className="text-[10px] text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded-md font-bold">
                  Grounding Attached
                </span>
              )}
              <button
                type="button"
                onClick={() => {
                  setAttachedFileName(null);
                  setAttachedFileText(null);
                }}
                className="text-slate-400 hover:text-red-600 p-0.5 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="flex items-center gap-2"
          >
            <input
              ref={chatFileInputRef}
              type="file"
              accept=".pdf,.txt,.md,.markdown,.csv,.json,.doc,.docx"
              onChange={handleChatFileSelect}
              className="hidden"
            />

            <button
              type="button"
              onClick={() => chatFileInputRef.current?.click()}
              title="Attach PDF or Study File for Instant RAG Grounding"
              className="p-3 bg-slate-50 hover:bg-blue-50 text-slate-500 hover:text-blue-600 border border-slate-200 rounded-xl transition-colors cursor-pointer shrink-0"
            >
              <Paperclip className="w-4 h-4" />
            </button>

            <input
              type="text"
              id="tutor-question-input"
              value={inputQuestion}
              onChange={(e) => setInputQuestion(e.target.value)}
              placeholder={`Ask any ${subject} question (e.g. formulas, mechanisms, proofs)...`}
              className="flex-1 px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500 font-medium"
            />

            <button
              type="submit"
              id="tutor-send-button"
              disabled={isLoading || (!inputQuestion.trim() && !attachedFileText)}
              className="px-5 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold text-sm flex items-center gap-2 transition-colors disabled:opacity-50 cursor-pointer shadow-xs shrink-0"
            >
              <span>Ask Tutor</span>
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      </main>
    </div>
  );
};
