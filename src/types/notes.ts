export interface Note {
  id: number;
  user_id: string;
  title: string;
  content: string;
  tags: string[];
  is_pinned: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateNoteRequest {
  title: string;
  content: string;
  tags?: string[];
  isPinned?: boolean;
}

export interface UpdateNoteRequest {
  title?: string;
  content?: string;
  tags?: string[];
  isPinned?: boolean;
}

export interface NoteFilters {
  search?: string;
  tag?: string;
  pinned?: 'true' | 'false';
}

export interface AIAssistRequest {
  action: 'fix_grammar' | 'generate_code' | 'summarize';
  content: string;
  selectedText?: string;
  noteId?: number;
}

export interface AIAssistResponse {
  result: string;
  action: string;
}