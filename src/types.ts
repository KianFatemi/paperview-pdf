export interface PageTextMatch {
  pageNumber: number;
  matchIndex: number;
}

export type AnnotationType = 'highlight' | 'underline' | 'strikethrough' | 'sticky-note';

export interface HighlightColor {
  name: string;
  value: string;
}

export interface StickyNote {
  id: string;
  page: number;
  x: number; 
  y: number; 
  text: string;
  isExpanded: boolean;
  timestamp: number;
}

export interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface Annotation {
  id: string;
  page: number;
  type: AnnotationType;
  rects: Rect[]; 
  color: string; 
}

export interface PDFPage {
  id: string;
  pageNumber: number;
  originalPageNumber: number;
  sourceId?: string; 
  thumbnail?: string;
  isDeleted?: boolean;
}

export interface PageManagementState {
  pages: PDFPage[];
  selectedPages: Set<string>;
  isPageManagerOpen: boolean;
}

export type PageAction = 'reorder' | 'delete' | 'insert' | 'duplicate';

export interface InsertPageOptions {
  type: 'blank' | 'upload' | 'duplicate';
  sourcePageId?: string;
  insertAfterPageId?: string;
  fileData?: Uint8Array; // for 'upload'
}

export interface ChatMessage {
  id: string;
  type: 'user' | 'assistant';
  content: string;
  timestamp: number;
  isStreaming?: boolean;
}

export interface AIContext {
  pdfText: string;
  currentPage: number;
  totalPages: number;
  selectedText?: string;
}

