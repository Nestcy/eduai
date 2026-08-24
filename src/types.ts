export interface RetrievedChunk {
  content: string;
  source: string;
  page?: number;
  score?: number;
  metadata?: Record<string, any>;
}

export interface TopicPerformance {
  topic: string;
  self_reported_score: number; // 0..100
  confidence_level: number; // 1..5
  exam_frequency_weight: number; // 0..1
  days_since_last_review: number; // >= 0
}

export interface StudyPlanEntry {
  topic: string;
  priority_score: number;
  recommended_minutes: number;
  scheduled_date: string;
  completed?: boolean;
}

export interface Flashcard {
  id?: string;
  question: string;
  answer: string;
  topic?: string;
  source?: string;
  difficulty?: 'Foundational' | 'Intermediate' | 'Mastery' | 'Exam-Trap' | string;
  tutor_tip?: string;
  key_formula?: string;
  cognitive_level?: 'Recall' | 'Application' | 'Calculation' | 'Conceptual Analysis' | string;
}

export interface StudentSubjectProfile {
  subject: string;
  masteryScore: number; // 0..100
  lastAssessed?: string;
  notes?: string;
}

export interface CurriculumTopic {
  unit: string;
  title: string;
  learning_objectives: string[];
  exam_weight: string;
}

export interface CurriculumSummary {
  country: string;
  curriculum_board: string;
  grade: string;
  subject: string;
  summary: string;
  topics?: CurriculumTopic[];
  assessment_objectives?: { code: string; title: string; description: string; weight: string }[];
  exam_structure?: { paper: string; duration: string; marks: number; format: string }[];
}

export interface VideoScene {
  timestamp: string;
  title: string;
  narration: string;
  visualPrompt: string;
  keyPoints: string[];
}

export interface VideoExplainerResponse {
  topic: string;
  subject: string;
  title: string;
  duration: string;
  scenes: VideoScene[];
  video_url?: string;
  summary: string;
}

export interface TutorMessage {
  id: string;
  sender: 'student' | 'tutor';
  text: string;
  thinking?: string;
  sources?: RetrievedChunk[];
  timestamp: string;
  suggestedVideoTopic?: string;
}

export interface IngestedDocument {
  id: string;
  title: string;
  subject: string;
  board: string;
  grade: string;
  country?: string;
  chunkCount: number;
  totalChars?: number;
  firstSnippet?: string;
  uploadedAt: string;
}

export interface IngestedChunk {
  id: string;
  collection: string;
  content: string;
  source: string;
  page?: number;
  subject: string;
  board?: string;
  grade?: string;
  charCount?: number;
  tokenCount?: number;
  uploadedAt?: string;
}

export interface UploadedFileItem {
  id: string;
  file: File;
  name: string;
  size: number;
  type: string;
  base64?: string;
  text?: string;
  status: 'pending' | 'reading' | 'ready' | 'error';
  extractedChars?: number;
  previewSnippet?: string;
  error?: string;
}

export interface SearchResultChunk {
  rank: number;
  source: string;
  page: number;
  subject: string;
  board?: string;
  grade?: string;
  content: string;
  charCount: number;
  tokenEstimate: number;
}

export interface IngestionJobStatus {
  jobId: string;
  status: 'idle' | 'processing' | 'waiting_retry' | 'completed' | 'error';
  currentStep: number;
  totalSteps: number;
  currentPage: number;
  totalPages: number;
  activeModel: string;
  retryCountdown: number;
  chunksAdded: number;
  fileName: string;
  message: string;
  logs?: string[];
  updatedAt?: string;
}
