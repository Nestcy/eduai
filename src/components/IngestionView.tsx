import React, { useState, useEffect, useRef } from 'react';
import { 
  Database, 
  Upload, 
  FileText, 
  CheckCircle2, 
  Sparkles, 
  Plus, 
  HardDrive, 
  Globe,
  Trash2,
  Search,
  FileCode,
  FileType,
  FileSpreadsheet,
  File,
  Eye,
  X,
  RefreshCw,
  ExternalLink,
  ChevronRight,
  AlertCircle,
  HelpCircle,
  Cpu,
  BookOpen,
  ArrowRight,
  Clock,
  ShieldCheck,
  Layers
} from 'lucide-react';
import { GlobalCurriculumPicker } from './GlobalCurriculumPicker';
import { IngestedDocument, IngestedChunk, UploadedFileItem, SearchResultChunk, IngestionJobStatus } from '../types';

// Code-configured optimal RAG Vector & Chunking Parameters
const DEFAULT_CHUNK_SIZE = 800;
const DEFAULT_CHUNK_OVERLAP = 100;

interface IngestionViewProps {
  onNavigate?: (tab: string) => void;
}

export const IngestionView: React.FC<IngestionViewProps> = ({ onNavigate }) => {
  const [country, setCountry] = useState('Global Standard (Universal)');
  const [board, setBoard] = useState('Cambridge IGCSE / A-Level');
  const [grade, setGrade] = useState('Grade 12');
  const [subject, setSubject] = useState('Mathematics');

  // Modes: 'files' | 'paste' | 'packs'
  const [ingestMode, setIngestMode] = useState<'files' | 'paste' | 'packs'>('files');

  // File Upload State
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFileItem[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Manual Text Ingestion State
  const [title, setTitle] = useState('');
  const [notesText, setNotesText] = useState('');

  // Submission & Loading State
  const [isLoading, setIsLoading] = useState(false);
  const [activeJob, setActiveJob] = useState<IngestionJobStatus | null>(null);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Vector Store Stats & Documents
  const [documents, setDocuments] = useState<IngestedDocument[]>([]);
  const [totalChunks, setTotalChunks] = useState(0);

  // Document Inspection Modal State
  const [inspectingDoc, setInspectingDoc] = useState<IngestedDocument | null>(null);
  const [docChunks, setDocChunks] = useState<IngestedChunk[]>([]);
  const [isLoadingChunks, setIsLoadingChunks] = useState(false);

  // RAG Search Tester State
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<SearchResultChunk[]>([]);
  const [hasSearched, setHasSearched] = useState(false);

  const fetchDocuments = async () => {
    try {
      const res = await fetch('/api/documents');
      if (res.ok) {
        const data = await res.json();
        setDocuments(data.documents || []);
        setTotalChunks(data.totalChunks || 0);
      }
    } catch (e) {
      console.warn('Failed to load documents list:', e);
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, []);

  // Format Bytes helper
  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
  };

  // Get File Icon helper
  const getFileIcon = (fileName: string) => {
    const ext = fileName.split('.').pop()?.toLowerCase();
    switch (ext) {
      case 'pdf':
        return <FileText className="w-5 h-5 text-red-500 shrink-0" />;
      case 'docx':
      case 'doc':
        return <FileText className="w-5 h-5 text-blue-500 shrink-0" />;
      case 'md':
      case 'markdown':
        return <FileType className="w-5 h-5 text-purple-500 shrink-0" />;
      case 'csv':
      case 'json':
        return <FileSpreadsheet className="w-5 h-5 text-emerald-500 shrink-0" />;
      case 'py':
      case 'ts':
      case 'js':
        return <FileCode className="w-5 h-5 text-amber-500 shrink-0" />;
      default:
        return <File className="w-5 h-5 text-slate-500 shrink-0" />;
    }
  };

  // Handle Drag & Drop Events
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processSelectedFiles(Array.from(e.dataTransfer.files));
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processSelectedFiles(Array.from(e.target.files));
    }
  };

  // Process and read files as Base64 / Text
  const processSelectedFiles = (files: File[]) => {
    const newItems: UploadedFileItem[] = files.map(file => ({
      id: `upload-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      file,
      name: file.name,
      size: file.size,
      type: file.type || 'application/octet-stream',
      status: 'reading'
    }));

    setUploadedFiles(prev => [...prev, ...newItems]);

    // Read each file asynchronously
    newItems.forEach(item => {
      const reader = new FileReader();
      const isTextFile = item.name.match(/\.(txt|md|csv|json|py|ts|js|html)$/i);

      if (isTextFile) {
        reader.onload = () => {
          const textContent = reader.result as string;
          setUploadedFiles(current =>
            current.map(f =>
              f.id === item.id
                ? {
                    ...f,
                    status: 'ready',
                    text: textContent,
                    extractedChars: textContent.length,
                    previewSnippet: textContent.slice(0, 200)
                  }
                : f
            )
          );
        };
        reader.onerror = () => {
          setUploadedFiles(current =>
            current.map(f => (f.id === item.id ? { ...f, status: 'error', error: 'Failed to read file' } : f))
          );
        };
        reader.readAsText(item.file);
      } else {
        // Read as Data URL (base64) for PDF, DOCX, binary files
        reader.onload = () => {
          const dataUrl = reader.result as string;
          const base64Data = dataUrl.split(',')[1] || '';
          setUploadedFiles(current =>
            current.map(f =>
              f.id === item.id
                ? {
                    ...f,
                    status: 'ready',
                    base64: base64Data,
                    extractedChars: Math.round(item.file.size * 0.7),
                    previewSnippet: `Binary / PDF document (${formatBytes(item.file.size)}) ready for text extraction.`
                  }
                : f
            )
          );
        };
        reader.onerror = () => {
          setUploadedFiles(current =>
            current.map(f => (f.id === item.id ? { ...f, status: 'error', error: 'Failed to read binary' } : f))
          );
        };
        reader.readAsDataURL(item.file);
      }
    });
  };

  const handleRemoveUploadedFile = (id: string) => {
    setUploadedFiles(prev => prev.filter(f => f.id !== id));
  };

  // Execute Document & File Ingestion with Background Polling & 90s Retry Awareness
  const handleExecuteIngestion = async () => {
    setIsLoading(true);
    setSuccessMsg('');
    setErrorMsg('');

    const generatedJobId = `job-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    
    // Setup initial active job state
    setActiveJob({
      jobId: generatedJobId,
      status: 'processing',
      currentStep: 1,
      totalSteps: ingestMode === 'files' ? uploadedFiles.length : 1,
      currentPage: 1,
      totalPages: 1,
      activeModel: 'qwen/qwen3.6-27b',
      retryCountdown: 0,
      chunksAdded: 0,
      fileName: ingestMode === 'files' ? uploadedFiles[0]?.name || 'Document' : (title || 'Study Notes'),
      message: 'Initializing OCR pipeline with Qwen 27B Vision and step chunking...'
    });

    // Start background status poller
    const poller = setInterval(async () => {
      try {
        const res = await fetch(`/api/ingest/status/${generatedJobId}`);
        if (res.ok) {
          const jobData = await res.json();
          setActiveJob(jobData);
          if (jobData.chunksAdded > 0) {
            setTotalChunks(prev => Math.max(prev, jobData.chunksAdded));
          }
        }
      } catch (err) {
        // Poll error ignored
      }
    }, 1200);

    try {
      const payload: any = {
        jobId: generatedJobId,
        country,
        curriculum_board: board,
        grade,
        subject,
        chunkSize: DEFAULT_CHUNK_SIZE,
        chunkOverlap: DEFAULT_CHUNK_OVERLAP
      };

      if (ingestMode === 'files') {
        if (uploadedFiles.length === 0) {
          setErrorMsg('Please upload at least one file before indexing.');
          setIsLoading(false);
          clearInterval(poller);
          setActiveJob(null);
          return;
        }

        const stillReading = uploadedFiles.some(f => f.status === 'reading');
        if (stillReading) {
          setErrorMsg('Files are still being read in the browser. Please wait a moment and click Ingest again.');
          setIsLoading(false);
          clearInterval(poller);
          setActiveJob(null);
          return;
        }

        payload.files = uploadedFiles.map(f => ({
          name: f.name,
          type: f.type,
          size: f.size,
          base64: f.base64,
          text: f.text
        }));
      } else if (ingestMode === 'paste') {
        if (!notesText.trim()) {
          setErrorMsg('Please paste syllabus text or notes to index.');
          setIsLoading(false);
          clearInterval(poller);
          setActiveJob(null);
          return;
        }
        payload.title = title.trim() || `${subject}_Study_Notes.pdf`;
        payload.text = notesText;
      }

      const response = await fetch('/api/ingest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      clearInterval(poller);

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.detail || 'Ingestion failed');
      }

      const data = await response.json();
      setSuccessMsg(
        data.message ||
          `Successfully ingested ${data.num_chunks} chunks into collection "${data.collection_name}"!`
      );

      // Reset inputs on success
      if (ingestMode === 'files') {
        setUploadedFiles([]);
      } else {
        setNotesText('');
        setTitle('');
      }

      fetchDocuments();
    } catch (err: any) {
      clearInterval(poller);
      console.error('Ingestion error:', err);
      setErrorMsg(err.message || 'Ingestion encountered an error. Please verify the document format.');
    } finally {
      clearInterval(poller);
      setIsLoading(false);
      // Keep completed active job banner briefly, then fade
      setTimeout(() => {
        setActiveJob(null);
      }, 6000);
    }
  };

  // Quick Ingest Official Preloaded Syllabus Packs
  const handleIngestSyllabusPack = async (packSubject: string, packTitle: string, packContent: string) => {
    setIsLoading(true);
    setSuccessMsg('');
    setErrorMsg('');

    try {
      const response = await fetch('/api/ingest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          country,
          curriculum_board: board,
          grade,
          subject: packSubject,
          title: packTitle,
          text: packContent,
          chunkSize: DEFAULT_CHUNK_SIZE,
          chunkOverlap: DEFAULT_CHUNK_OVERLAP
        })
      });

      if (!response.ok) throw new Error('Failed to index syllabus pack');
      const data = await response.json();
      setSuccessMsg(`Successfully added "${packTitle}" (${data.num_chunks} chunks) to vector knowledge!`);
      fetchDocuments();
    } catch (e: any) {
      setErrorMsg(e.message || 'Failed to ingest pack');
    } finally {
      setIsLoading(false);
    }
  };

  // Inspect Chunks Modal
  const handleInspectDocument = async (doc: IngestedDocument) => {
    setInspectingDoc(doc);
    setIsLoadingChunks(true);
    setDocChunks([]);

    try {
      const res = await fetch(`/api/chunks?source=${encodeURIComponent(doc.title)}&subject=${encodeURIComponent(doc.subject)}`);
      if (res.ok) {
        const data = await res.json();
        setDocChunks(data.chunks || []);
      }
    } catch (err) {
      console.error('Failed to load chunks:', err);
    } finally {
      setIsLoadingChunks(false);
    }
  };

  // Delete Document
  const handleDeleteDocument = async (doc: IngestedDocument) => {
    if (!confirm(`Are you sure you want to remove all indexed chunks for "${doc.title}"?`)) {
      return;
    }

    try {
      const res = await fetch('/api/documents/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ source: doc.title, subject: doc.subject })
      });

      if (res.ok) {
        setDocuments(prev => prev.filter(d => !(d.title === doc.title && d.subject === doc.subject)));
        fetchDocuments();
      }
    } catch (e) {
      alert('Failed to delete document');
    }
  };

  // RAG Search & Similarity Tester
  const handleTestSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    setHasSearched(true);

    try {
      const res = await fetch('/api/rag/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: searchQuery,
          subject,
          board,
          limit: 6
        })
      });

      if (res.ok) {
        const data = await res.json();
        setSearchResults(data.chunks || []);
      }
    } catch (err) {
      console.error('Search error:', err);
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8 space-y-8">
      {/* Top Banner with Stats & Controls */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-slate-900 font-bold text-base">
            <Database className="w-5 h-5 text-blue-600" />
            <span>RAG Vector Store & Document Ingestion</span>
          </div>
          <p className="text-xs text-slate-500 mt-1 max-w-2xl">
            Upload official PDF syllabi, books, and past exam marking schemes. Scanned pages are transcribed via <span className="font-semibold text-slate-700">Qwen 3.6 27B Vision</span> with automated 90-second background rate-limit recovery and stepped book embedding.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2.5 bg-blue-50 px-3.5 py-1.5 rounded-xl border border-blue-200 text-xs">
            <Cpu className="w-4 h-4 text-blue-600" />
            <span className="text-blue-800 font-medium">OCR Engine:</span>
            <span className="font-bold text-blue-950">Qwen 27B (Groq)</span>
          </div>

          <div className="flex items-center gap-2.5 bg-emerald-50 px-3.5 py-1.5 rounded-xl border border-emerald-200 text-xs">
            <HardDrive className="w-4 h-4 text-emerald-600" />
            <span className="text-emerald-800 font-medium">Vector Index:</span>
            <span className="font-bold text-emerald-950">{totalChunks} Chunks</span>
          </div>

          <button
            onClick={fetchDocuments}
            title="Refresh Knowledge Index"
            className="p-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-slate-600 hover:text-slate-900 transition-colors cursor-pointer"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Live Active Job / 90s Rate Limit Cooldown Tracker */}
      {activeJob && (
        <div className={`p-4 rounded-2xl border transition-all space-y-3 ${
          activeJob.status === 'waiting_retry'
            ? 'bg-amber-50 border-amber-300 text-amber-900 shadow-sm'
            : activeJob.status === 'completed'
            ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
            : 'bg-blue-50 border-blue-200 text-blue-900'
        }`}>
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2.5 min-w-0">
              {activeJob.status === 'waiting_retry' ? (
                <Clock className="w-5 h-5 text-amber-600 animate-spin shrink-0" />
              ) : activeJob.status === 'completed' ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              ) : (
                <RefreshCw className="w-5 h-5 text-blue-600 animate-spin shrink-0" />
              )}
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-bold text-xs">
                    {activeJob.status === 'waiting_retry'
                      ? 'Groq Rate Limit Protection (90s Background Cooldown Active)'
                      : activeJob.status === 'completed'
                      ? 'Document Embedding Completed'
                      : 'Stepped Book Embedding & OCR in Progress'}
                  </span>
                  <span className="text-[10px] px-2 py-0.5 rounded-md font-mono font-bold bg-white/80 border border-current">
                    Model: {activeJob.activeModel || 'qwen/qwen3.6-27b'}
                  </span>
                </div>
                <p className="text-[11px] opacity-90 mt-0.5 truncate">{activeJob.message}</p>
              </div>
            </div>

            <div className="text-right shrink-0">
              {activeJob.status === 'waiting_retry' && (
                <span className="px-3 py-1 bg-amber-200/80 text-amber-950 font-bold text-xs rounded-xl font-mono">
                  Resuming in {activeJob.retryCountdown}s
                </span>
              )}
              {activeJob.status === 'processing' && (
                <span className="px-2.5 py-1 bg-blue-200/60 text-blue-950 font-semibold text-[11px] rounded-lg">
                  Step {activeJob.currentStep || 1} / {activeJob.totalSteps || 1}
                </span>
              )}
            </div>
          </div>

          {/* Progress Visual Bar */}
          {activeJob.status === 'waiting_retry' ? (
            <div className="space-y-1">
              <div className="w-full bg-amber-200/70 h-2 rounded-full overflow-hidden">
                <div 
                  className="bg-amber-600 h-full rounded-full transition-all duration-1000"
                  style={{ width: `${Math.max(5, Math.round(((90 - (activeJob.retryCountdown || 0)) / 90) * 100))}%` }}
                />
              </div>
              <p className="text-[10px] text-amber-700">
                Groq per-minute token/request limit encountered. Waiting in background to let the quota refresh, then resuming OCR automatically without losing progress.
              </p>
            </div>
          ) : (
            <div className="w-full bg-blue-200/60 h-1.5 rounded-full overflow-hidden">
              <div 
                className="bg-blue-600 h-full rounded-full transition-all duration-300"
                style={{ 
                  width: `${activeJob.totalPages ? Math.round(((activeJob.currentPage || 1) / activeJob.totalPages) * 100) : 50}%` 
                }}
              />
            </div>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: File Upload & Ingestion Pipeline (7 Cols) */}
        <div className="lg:col-span-7 space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 font-bold text-slate-900 text-sm">
                <Upload className="w-4 h-4 text-blue-600" />
                <span>Ingest Curriculum & Study Files</span>
              </div>
              <div className="flex items-center gap-1.5 text-[10px] px-2.5 py-0.5 bg-emerald-50 text-emerald-700 font-bold rounded-md border border-emerald-200">
                <ShieldCheck className="w-3 h-3" />
                <span>Rate-Limit Protected</span>
              </div>
            </div>

            {/* Target Curriculum Grounding Metadata */}
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
                <Globe className="w-3.5 h-3.5 text-blue-600" />
                <span>Target Curriculum Scope for Ingested Chunks</span>
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

            {/* Ingestion Mode Switcher */}
            <div className="flex bg-slate-100 p-1 rounded-xl text-xs font-semibold text-slate-600">
              <button
                type="button"
                onClick={() => setIngestMode('files')}
                className={`flex-1 py-2 rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  ingestMode === 'files'
                    ? 'bg-white text-blue-600 font-bold shadow-xs'
                    : 'hover:text-slate-900'
                }`}
              >
                <Upload className="w-3.5 h-3.5" />
                <span>Upload Files (PDF / Books / Docs)</span>
              </button>
              <button
                type="button"
                onClick={() => setIngestMode('paste')}
                className={`flex-1 py-2 rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  ingestMode === 'paste'
                    ? 'bg-white text-blue-600 font-bold shadow-xs'
                    : 'hover:text-slate-900'
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Paste Raw Text</span>
              </button>
              <button
                type="button"
                onClick={() => setIngestMode('packs')}
                className={`flex-1 py-2 rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  ingestMode === 'packs'
                    ? 'bg-white text-blue-600 font-bold shadow-xs'
                    : 'hover:text-slate-900'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Official Packs</span>
              </button>
            </div>

            {/* Mode 1: File Upload & Drag-and-Drop */}
            {ingestMode === 'files' && (
              <div className="space-y-4">
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept=".pdf,.txt,.md,.markdown,.csv,.json,.doc,.docx,.py,.ts"
                  onChange={handleFileSelect}
                  className="hidden"
                />

                {/* Drag and Drop Zone */}
                <div
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-2xl p-8 text-center transition-all cursor-pointer flex flex-col items-center justify-center gap-3 ${
                    isDragging
                      ? 'border-blue-500 bg-blue-50/50 scale-[1.01]'
                      : 'border-slate-300 hover:border-blue-400 bg-slate-50/60 hover:bg-blue-50/30'
                  }`}
                >
                  <div className="w-12 h-12 rounded-2xl bg-blue-100 text-blue-600 flex items-center justify-center shadow-xs">
                    <Upload className="w-6 h-6" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs font-bold text-slate-800">
                      Drag and drop study files here, or <span className="text-blue-600 underline">browse files</span>
                    </p>
                    <p className="text-[11px] text-slate-500">
                      Supports Multi-Page PDF Books, Markdown (.md), Plain Text (.txt), Word (.docx), CSV, JSON
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center justify-center gap-1.5 pt-1">
                    {['.PDF', '.DOCX', '.MD', '.TXT', '.CSV', '.JSON'].map((fmt, fIdx) => (
                      <span key={fIdx} className="text-[10px] px-2 py-0.5 bg-white border border-slate-200 rounded-md font-mono text-slate-600">
                        {fmt}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Selected Files Queue */}
                {uploadedFiles.length > 0 && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                      <span>Ready to Index ({uploadedFiles.length} file{uploadedFiles.length > 1 ? 's' : ''})</span>
                      <button
                        type="button"
                        onClick={() => setUploadedFiles([])}
                        className="text-[11px] text-red-600 hover:underline cursor-pointer"
                      >
                        Clear All
                      </button>
                    </div>

                    <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                      {uploadedFiles.map(item => (
                        <div
                          key={item.id}
                          className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between text-xs gap-3"
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            {getFileIcon(item.name)}
                            <div className="min-w-0">
                              <p className="font-bold text-slate-900 truncate">{item.name}</p>
                              <p className="text-[11px] text-slate-500">
                                {formatBytes(item.size)} • {item.extractedChars ? `${item.extractedChars.toLocaleString()} chars` : 'Ready'}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            {item.status === 'reading' && (
                              <span className="text-[10px] px-2 py-0.5 bg-amber-50 text-amber-700 border border-amber-200 rounded-md animate-pulse">
                                Reading...
                              </span>
                            )}
                            {item.status === 'ready' && (
                              <span className="text-[10px] px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-md font-semibold">
                                Ready
                              </span>
                            )}
                            {item.status === 'error' && (
                              <span className="text-[10px] px-2 py-0.5 bg-red-50 text-red-700 border border-red-200 rounded-md font-semibold">
                                Error
                              </span>
                            )}
                            <button
                              type="button"
                              onClick={() => handleRemoveUploadedFile(item.id)}
                              className="p-1 text-slate-400 hover:text-red-600 transition-colors cursor-pointer"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Mode 2: Direct Text / Notes Paste */}
            {ingestMode === 'paste' && (
              <div className="space-y-3 text-xs">
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">Document Title / File Name</label>
                  <input
                    type="text"
                    placeholder="e.g. Cambridge_A_Level_Pure_Maths_Ch4.pdf"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:ring-2 focus:ring-blue-500 font-medium"
                  />
                </div>

                <div>
                  <label className="block text-slate-600 font-semibold mb-1">
                    Text / Syllabus Content to Chunk & Index
                  </label>
                  <textarea
                    rows={7}
                    placeholder="Paste textbook excerpts, definitions, formulas, or marking criteria here..."
                    value={notesText}
                    onChange={(e) => setNotesText(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-xs font-mono leading-relaxed focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            )}

            {/* Mode 3: Preloaded High-Yield Syllabus Packs */}
            {ingestMode === 'packs' && (
              <div className="space-y-3 text-xs">
                <p className="text-slate-500 text-[11px]">
                  Click to instantly ingest curated, high-yield syllabus specifications and past paper marking schemes into your active vector store:
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {[
                    {
                      sub: 'Mathematics',
                      title: 'Cambridge_A_Level_Pure_Maths_Core_Formulae.pdf',
                      desc: 'Integration by parts, differential equations, vectors, complex numbers, and trigonometric proofs.',
                      content: 'Cambridge International AS & A Level Mathematics (9709) Pure Mathematics 3:\n1. Integration: Integration by parts integral(u dv/dx dx) = uv - integral(v du/dx dx). Substitution method using u = g(x).\n2. Differential Equations: Separable first-order differential equations dy/dx = f(x)g(y) -> integral(1/g(y) dy) = integral(f(x) dx).\n3. Vectors: Vector equation of a line r = a + t b. Scalar product a . b = |a||b| cos(theta). Distance from point to line.\n4. Complex Numbers: De Moivre\'s theorem (cos theta + i sin theta)^n = cos(n theta) + i sin(n theta). Roots of polynomial equations with real coefficients.'
                    },
                    {
                      sub: 'Biology',
                      title: 'IB_Biology_HL_Cellular_Genetics_Mastery.pdf',
                      desc: 'DNA replication, transcription/translation, enzyme kinetics, and mitochondrial electron transport chain.',
                      content: 'IB Biology Higher Level (HL) Topic 2 & Topic 7 Molecular Biology & Nucleic Acids:\n1. DNA Replication: Helicase unwinds the double helix; DNA polymerase III adds dNTPs in 5\' to 3\' direction; DNA polymerase I replaces RNA primers; DNA ligase joins Okazaki fragments on lagging strand.\n2. Enzyme Inhibition: Competitive inhibitors bind active site (Km increases, Vmax unaffected); Non-competitive/allosteric inhibitors bind allosteric site altering conformation (Vmax decreases, Km unchanged).\n3. Cellular Respiration: Glycolysis in cytosol; Link reaction and Krebs cycle in mitochondrial matrix; Electron transport chain on inner mitochondrial cristae generating proton gradient for ATP synthase.'
                    },
                    {
                      sub: 'Physics',
                      title: 'AP_Physics_C_Electromagnetism_Marking_Guide.pdf',
                      desc: 'Gauss\'s Law, Ampere\'s Law, Faraday\'s Induction, and Maxwell equations.',
                      content: 'AP Physics C: Electricity and Magnetism Core Course Framework:\n1. Gauss\'s Law: Electric flux through closed surface equals enclosed charge divided by epsilon_0: oint E . dA = Q_enc / epsilon_0.\n2. Ampere\'s Law: Line integral of B around closed loop equals mu_0 * I_enc: oint B . dl = mu_0 I_enc.\n3. Faraday\'s Law & Lenz\'s Law: Induced electromotive force emf = - dPhi_B / dt. The induced current flows in a direction such that its magnetic field opposes the change in flux.\n4. LC Oscillations: Total energy E = 1/2 L i^2 + 1/2 q^2 / C is constant with angular frequency omega = 1 / sqrt(LC).'
                    },
                    {
                      sub: 'Chemistry',
                      title: 'Edexcel_A_Level_Organic_Mechanisms.pdf',
                      desc: 'SN1/SN2 nucleophilic substitutions, electrophilic addition, and equilibrium calculations.',
                      content: 'Edexcel A-Level Chemistry Advanced Organic Chemistry Mechanisms:\n1. Nucleophilic Substitution: SN1 mechanism occurs in two steps via tertiary carbocation intermediate (rate = k[haloalkane]). SN2 mechanism is single concerted step with backside attack in primary haloalkanes causing inversion of configuration (rate = k[haloalkane][nucleophile]).\n2. Equilibrium Constant Kp: For gas-phase reaction aA(g) + bB(g) <=> cC(g) + dD(g), Kp = (pC^c * pD^d) / (pA^a * pB^b) where partial pressure p_i = mole fraction x_i * P_total.\n3. Buffer Solutions: pH = pKa + log([A-] / [HA]) (Henderson-Hasselbalch equation).'
                    }
                  ].map((pack, pIdx) => (
                    <div
                      key={pIdx}
                      className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2 hover:border-blue-300 transition-all flex flex-col justify-between"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-slate-900 text-xs">{pack.sub}</span>
                          <span className="text-[10px] px-2 py-0.5 bg-blue-100 text-blue-700 rounded-md font-semibold">
                            High Yield
                          </span>
                        </div>
                        <p className="text-[11px] font-semibold text-blue-600 truncate">{pack.title}</p>
                        <p className="text-[11px] text-slate-500 leading-relaxed">{pack.desc}</p>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleIngestSyllabusPack(pack.sub, pack.title, pack.content)}
                        disabled={isLoading}
                        className="w-full py-1.5 bg-white hover:bg-blue-600 hover:text-white text-blue-600 border border-blue-200 rounded-lg font-bold text-[11px] transition-colors flex items-center justify-center gap-1 cursor-pointer disabled:opacity-50"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Add to Vector Store</span>
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Action Button */}
            <div className="space-y-3 pt-2">
              <button
                onClick={handleExecuteIngestion}
                disabled={
                  isLoading ||
                  (ingestMode === 'files' && uploadedFiles.length === 0) ||
                  (ingestMode === 'paste' && !notesText.trim())
                }
                className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-xs flex items-center justify-center gap-2 transition-colors cursor-pointer disabled:opacity-50"
              >
                <Cpu className="w-4 h-4 text-blue-200" />
                <span>
                  {isLoading
                    ? (activeJob?.status === 'waiting_retry'
                        ? `Rate Limit Cooldown (${activeJob.retryCountdown}s)...`
                        : 'Embedding Chunks via Qwen 27B...')
                    : ingestMode === 'files'
                    ? `Index & Embed ${uploadedFiles.length} File${uploadedFiles.length > 1 ? 's' : ''} (Qwen 27B Vision)`
                    : 'Index Content for Tutor RAG'}
                </span>
              </button>

              {successMsg && (
                <div className="p-3.5 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-xl text-xs flex items-center gap-2 font-medium">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>{successMsg}</span>
                </div>
              )}

              {errorMsg && (
                <div className="p-3.5 bg-red-50 text-red-800 border border-red-200 rounded-xl text-xs flex items-center gap-2 font-medium">
                  <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Active Collections & RAG Search Tester (5 Cols) */}
        <div className="lg:col-span-5 space-y-6">
          {/* Live RAG Retrieval Search Tester */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <Search className="w-4 h-4 text-blue-600" />
                <span>Test RAG Vector Search</span>
              </h3>
              <span className="text-[10px] px-2 py-0.5 bg-blue-50 text-blue-700 font-bold rounded-md border border-blue-200">
                Similarity Engine
              </span>
            </div>

            <form onSubmit={handleTestSearch} className="space-y-3 text-xs">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Test a query (e.g. 'Photosynthesis light reactions', 'Discriminant quadratic')"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:ring-2 focus:ring-blue-500 font-medium text-xs"
                />
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              </div>

              <button
                type="submit"
                disabled={isSearching || !searchQuery.trim()}
                className="w-full py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl transition-colors cursor-pointer flex items-center justify-center gap-1.5 disabled:opacity-50"
              >
                <Sparkles className="w-3.5 h-3.5 text-blue-300" />
                <span>{isSearching ? 'Searching Vectors...' : 'Run Similarity Query'}</span>
              </button>
            </form>

            {/* Search Results Display */}
            {hasSearched && (
              <div className="space-y-3 pt-2 border-t border-slate-100">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-800">
                    Retrieved Chunks ({searchResults.length})
                  </span>
                  <span className="text-[11px] text-slate-400">Ranked by Cosine Score</span>
                </div>

                {searchResults.length === 0 ? (
                  <p className="text-xs text-slate-400 text-center py-4 bg-slate-50 rounded-xl">
                    No relevant chunks found for this query in current scope. Try indexing more notes.
                  </p>
                ) : (
                  <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
                    {searchResults.map((chunk, cIdx) => (
                      <div
                        key={cIdx}
                        className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs space-y-1.5 hover:border-blue-300 transition-all"
                      >
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="font-bold text-blue-700 bg-blue-100/60 px-2 py-0.5 rounded-md">
                            Rank #{chunk.rank}
                          </span>
                          <span className="text-slate-500 font-mono">
                            {chunk.source} (p. {chunk.page})
                          </span>
                        </div>
                        <p className="text-slate-800 text-[11px] leading-relaxed line-clamp-3 font-mono">
                          {chunk.content}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Active Knowledge Collections in Memory */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <FileText className="w-4 h-4 text-blue-600" />
                <span>Active Syllabus Documents</span>
              </h3>
              <span className="text-[11px] text-slate-500 font-medium">
                {documents.length} Source{documents.length !== 1 ? 's' : ''}
              </span>
            </div>

            <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
              {documents.length === 0 ? (
                <p className="text-xs text-slate-400 text-center py-6">
                  No documents in memory yet. Upload your first file on the left!
                </p>
              ) : (
                documents.map((doc, idx) => (
                  <div
                    key={idx}
                    className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs space-y-2 hover:border-slate-300 transition-all"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 space-y-0.5">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-bold text-slate-900 truncate">{doc.title}</span>
                          <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded-md font-semibold text-[10px]">
                            {doc.subject}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500">
                          {doc.board} • {doc.grade}
                        </p>
                      </div>

                      <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-md font-bold text-[10px] shrink-0">
                        {doc.chunkCount} Chunks
                      </span>
                    </div>

                    <div className="flex items-center justify-between pt-1 border-t border-slate-100 gap-1">
                      <button
                        type="button"
                        onClick={() => {
                          localStorage.setItem('eduai_flashcard_doc', doc.title);
                          localStorage.setItem('eduai_flashcard_source', 'uploaded_material');
                          if (onNavigate) onNavigate('flashcards');
                        }}
                        title="Generate Flashcards strictly from this RAG material"
                        className="text-[11px] text-emerald-700 hover:text-emerald-800 font-bold flex items-center gap-1 cursor-pointer bg-emerald-50 hover:bg-emerald-100 px-2 py-0.5 rounded-md border border-emerald-200 transition-colors"
                      >
                        <Layers className="w-3 h-3 text-emerald-600" />
                        <span>Flashcards</span>
                      </button>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleInspectDocument(doc)}
                          className="text-[11px] text-blue-600 hover:text-blue-700 font-bold flex items-center gap-1 cursor-pointer"
                        >
                          <Eye className="w-3 h-3" />
                          <span>Chunks</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleDeleteDocument(doc)}
                          className="text-[11px] text-red-500 hover:text-red-700 flex items-center gap-1 cursor-pointer"
                        >
                          <Trash2 className="w-3 h-3" />
                          <span>Remove</span>
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Modal: Inspect Active Document Chunks */}
      {inspectingDoc && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white max-w-3xl w-full rounded-2xl border border-slate-200 shadow-xl overflow-hidden flex flex-col max-h-[85vh]">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2 min-w-0">
                <FileText className="w-5 h-5 text-blue-600 shrink-0" />
                <div className="min-w-0">
                  <h4 className="font-bold text-slate-900 text-sm truncate">{inspectingDoc.title}</h4>
                  <p className="text-[11px] text-slate-500">
                    {inspectingDoc.subject} • {inspectingDoc.board} • {inspectingDoc.chunkCount} Chunks Indexed
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setInspectingDoc(null)}
                className="p-1 text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 overflow-y-auto space-y-3 flex-1 text-xs">
              {isLoadingChunks ? (
                <div className="text-center py-8 text-slate-400">Loading indexed vector chunks...</div>
              ) : docChunks.length === 0 ? (
                <div className="text-center py-8 text-slate-400">No individual chunk records found.</div>
              ) : (
                docChunks.map((c, i) => (
                  <div key={i} className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5">
                    <div className="flex items-center justify-between text-[11px] text-slate-500">
                      <span className="font-bold text-slate-900">Chunk {i + 1} (Page {c.page || 1})</span>
                      <span className="font-mono">{c.charCount || c.content.length} chars</span>
                    </div>
                    <p className="text-slate-800 font-mono text-[11px] leading-relaxed whitespace-pre-wrap">
                      {c.content}
                    </p>
                  </div>
                ))
              )}
            </div>

            <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-end">
              <button
                type="button"
                onClick={() => setInspectingDoc(null)}
                className="px-4 py-2 bg-slate-900 text-white font-bold text-xs rounded-xl cursor-pointer hover:bg-slate-800"
              >
                Close Inspector
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
