export interface PageTextMatch {
  pageNumber: number;
  matchIndex: number;
}

export type AnnotationType = 'highlight' | 'underline' | 'strikethrough';

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


