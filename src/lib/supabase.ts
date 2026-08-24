import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Default Supabase project configuration
const DEFAULT_SUPABASE_URL = 'https://riafffooeexfodvefcna.supabase.co';
const DEFAULT_SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJpYWZmZm9vZWV4Zm9kdmVmY25hIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODcyMzUwODYsImV4cCI6MjEwMjgxMTA4Nn0.OgFsxzrLCUCcbSI03dTiHozICxV13W3wDBbfiRwVERI';

export const SUPABASE_URL = (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_SUPABASE_URL) 
  ? (import.meta as any).env.VITE_SUPABASE_URL 
  : DEFAULT_SUPABASE_URL;

export const SUPABASE_ANON_KEY = (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_SUPABASE_ANON_KEY) 
  ? (import.meta as any).env.VITE_SUPABASE_ANON_KEY 
  : DEFAULT_SUPABASE_ANON_KEY;

let clientInstance: SupabaseClient | null = null;

/**
 * Returns a singleton instance of the Supabase client.
 */
export function getSupabase(): SupabaseClient {
  if (!clientInstance) {
    clientInstance = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
    });
  }
  return clientInstance;
}

/**
 * Supabase Authentication Service
 */
export const SupabaseAuthService = {
  /**
   * Sign up with email & password + user metadata
   */
  async signUp(email: string, password: string, metadata?: {
    name?: string;
    country?: string;
    exam_board?: string;
    current_grade?: string;
    target_grade?: string;
  }) {
    const supabase = getSupabase();
    const redirectUrl = typeof window !== 'undefined' ? window.location.origin : undefined;
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: metadata || {},
        emailRedirectTo: redirectUrl,
      },
    });
    return { user: data.user, session: data.session, error };
  },

  /**
   * Sign in with email & password
   */
  async signIn(email: string, password: string) {
    const supabase = getSupabase();
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { user: data.user, session: data.session, error };
  },

  /**
   * Sign out current user
   */
  async signOut() {
    const supabase = getSupabase();
    const { error } = await supabase.auth.signOut();
    return { error };
  },

  /**
   * Get current session and user
   */
  async getSession() {
    const supabase = getSupabase();
    const { data, error } = await supabase.auth.getSession();
    return { session: data.session, user: data.session?.user || null, error };
  },

  /**
   * Listen to auth state changes
   */
  onAuthStateChange(callback: (event: string, session: any) => void) {
    const supabase = getSupabase();
    return supabase.auth.onAuthStateChange((event, session) => {
      callback(event, session);
    });
  }
};

export interface StudentProfileRecord {
  id?: string;
  auth_user_id?: string;
  name: string;
  email?: string;
  country: string;
  exam_board: string;
  current_grade: string;
  target_grade: string;
  created_at?: string;
  updated_at?: string;
}

export interface StudentSubjectRecord {
  id?: string;
  student_id: string;
  code: string;
  name: string;
  exam_board?: string;
  level?: string;
  mastery_percentage: number;
  syllabus_coverage_percentage: number;
  confidence_rating?: string;
  created_at?: string;
  updated_at?: string;
}

export interface StudentTaskRecord {
  id?: string;
  student_id: string;
  subject_code?: string;
  title: string;
  type: string;
  priority: string;
  estimated_minutes: number;
  due_date?: string;
  completed: boolean;
  completed_at?: string;
  created_at?: string;
}

export interface ActivityLogRecord {
  id?: string;
  student_id: string;
  action_type: string;
  title: string;
  description?: string;
  duration_seconds: number;
  created_at?: string;
}

export interface FlashcardDeckRecord {
  id?: string;
  student_id: string;
  subject_code: string;
  topic_title: string;
  total_cards: number;
  cards_mastered: number;
  created_at?: string;
}

export interface FlashcardRecord {
  id?: string;
  deck_id: string;
  front_question: string;
  back_answer: string;
  mastered: boolean;
  interval_days: number;
  ease_factor: number;
  next_review_at?: string;
  created_at?: string;
}

/**
 * Supabase Data Service helper functions
 */
export const SupabaseDataService = {
  /**
   * Get or create a persistent student profile in Supabase
   */
  async getOrCreateStudent(profile: {
    name: string;
    email?: string;
    country: string;
    exam_board: string;
    current_grade: string;
    target_grade: string;
  }): Promise<StudentProfileRecord | null> {
    try {
      const supabase = getSupabase();
      
      // Try to find existing student by name or email
      let query = supabase.from('students').select('*');
      if (profile.email) {
        query = query.eq('email', profile.email);
      } else {
        query = query.eq('name', profile.name);
      }

      const { data, error } = await query.limit(1);

      if (error) {
        console.warn('Supabase get student notice:', error.message);
      }

      if (data && data.length > 0) {
        return data[0] as StudentProfileRecord;
      }

      // If not found, insert new student record
      const { data: inserted, error: insertError } = await supabase
        .from('students')
        .insert([
          {
            name: profile.name || 'Student',
            email: profile.email || null,
            country: profile.country || 'Global Standard',
            exam_board: profile.exam_board || 'Cambridge IGCSE / A-Level',
            current_grade: profile.current_grade || 'Grade 12',
            target_grade: profile.target_grade || 'A*',
          }
        ])
        .select();

      if (insertError) {
        console.warn('Supabase insert student error:', insertError.message);
        return null;
      }

      return (inserted && inserted[0]) ? (inserted[0] as StudentProfileRecord) : null;
    } catch (e: any) {
      console.warn('Supabase connection warning:', e?.message || e);
      return null;
    }
  },

  /**
   * Update student profile details in Supabase
   */
  async updateStudent(studentId: string, updates: Partial<StudentProfileRecord>): Promise<boolean> {
    try {
      const supabase = getSupabase();
      const { error } = await supabase
        .from('students')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', studentId);

      if (error) {
        console.warn('Supabase updateStudent error:', error.message);
        return false;
      }
      return true;
    } catch (e: any) {
      console.warn('Supabase updateStudent exception:', e?.message || e);
      return false;
    }
  },

  /**
   * Fetch all subjects for a student
   */
  async fetchSubjects(studentId: string): Promise<StudentSubjectRecord[]> {
    try {
      const supabase = getSupabase();
      const { data, error } = await supabase
        .from('student_subjects')
        .select('*')
        .eq('student_id', studentId)
        .order('created_at', { ascending: true });

      if (error) {
        console.warn('Supabase fetchSubjects error:', error.message);
        return [];
      }
      return data || [];
    } catch (e: any) {
      console.warn('Supabase fetchSubjects exception:', e?.message || e);
      return [];
    }
  },

  /**
   * Sync/Upsert subjects for a student
   */
  async syncSubjects(studentId: string, subjectsList: Array<{
    code: string;
    name: string;
    exam_board?: string;
    level?: string;
    mastery_percentage: number;
    syllabus_coverage_percentage: number;
    confidence_rating?: string;
  }>): Promise<boolean> {
    try {
      const supabase = getSupabase();
      
      // Delete existing and re-insert for clean synchronization
      await supabase.from('student_subjects').delete().eq('student_id', studentId);

      if (subjectsList.length === 0) return true;

      const rows = subjectsList.map(s => ({
        student_id: studentId,
        code: s.code || s.name.substring(0, 4).toUpperCase(),
        name: s.name,
        exam_board: s.exam_board || 'Cambridge (CAIE)',
        level: s.level || 'A-Level',
        mastery_percentage: s.mastery_percentage || 0,
        syllabus_coverage_percentage: s.syllabus_coverage_percentage || 0,
        confidence_rating: s.confidence_rating || 'Developing',
      }));

      const { error } = await supabase.from('student_subjects').insert(rows);
      if (error) {
        console.warn('Supabase syncSubjects error:', error.message);
        return false;
      }
      return true;
    } catch (e: any) {
      console.warn('Supabase syncSubjects exception:', e?.message || e);
      return false;
    }
  },

  /**
   * Fetch study tasks
   */
  async fetchTasks(studentId: string): Promise<StudentTaskRecord[]> {
    try {
      const supabase = getSupabase();
      const { data, error } = await supabase
        .from('student_tasks')
        .select('*')
        .eq('student_id', studentId)
        .order('created_at', { ascending: false });

      if (error) {
        console.warn('Supabase fetchTasks error:', error.message);
        return [];
      }
      return data || [];
    } catch (e: any) {
      console.warn('Supabase fetchTasks exception:', e?.message || e);
      return [];
    }
  },

  /**
   * Upsert a study task
   */
  async saveTask(task: StudentTaskRecord): Promise<StudentTaskRecord | null> {
    try {
      const supabase = getSupabase();
      if (task.id) {
        const { data, error } = await supabase
          .from('student_tasks')
          .update({
            title: task.title,
            subject_code: task.subject_code,
            type: task.type,
            priority: task.priority,
            estimated_minutes: task.estimated_minutes,
            completed: task.completed,
            completed_at: task.completed ? (task.completed_at || new Date().toISOString()) : null,
          })
          .eq('id', task.id)
          .select();

        if (error) throw error;
        return data?.[0] || null;
      } else {
        const { data, error } = await supabase
          .from('student_tasks')
          .insert([task])
          .select();

        if (error) throw error;
        return data?.[0] || null;
      }
    } catch (e: any) {
      console.warn('Supabase saveTask exception:', e?.message || e);
      return null;
    }
  },

  /**
   * Delete a study task
   */
  async deleteTask(taskId: string): Promise<boolean> {
    try {
      const supabase = getSupabase();
      const { error } = await supabase.from('student_tasks').delete().eq('id', taskId);
      return !error;
    } catch {
      return false;
    }
  },

  /**
   * Log an activity
   */
  async logActivity(log: {
    student_id: string;
    action_type: string;
    title: string;
    description?: string;
    duration_seconds?: number;
  }): Promise<boolean> {
    try {
      const supabase = getSupabase();
      const { error } = await supabase.from('activity_logs').insert([{
        student_id: log.student_id,
        action_type: log.action_type,
        title: log.title,
        description: log.description || '',
        duration_seconds: log.duration_seconds || 0,
      }]);
      return !error;
    } catch {
      return false;
    }
  },

  /**
   * Fetch activity logs
   */
  async fetchActivityLogs(studentId: string, limit = 20): Promise<ActivityLogRecord[]> {
    try {
      const supabase = getSupabase();
      const { data, error } = await supabase
        .from('activity_logs')
        .select('*')
        .eq('student_id', studentId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) return [];
      return data || [];
    } catch {
      return [];
    }
  }
};
