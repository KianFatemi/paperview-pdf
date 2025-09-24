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
}

