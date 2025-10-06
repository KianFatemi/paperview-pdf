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
  type: 'upload' | 'duplicate';
  sourcePageId?: string;
  insertAfterPageId?: string;
  fileData?: Uint8Array; 
}

export interface ChatMessage {
  id: string;
  type: 'user' | 'assistant';
  content: string;
  timestamp: number;
  isStreaming?: boolean;
  searchResults?: SemanticSearchResult[];
}

export interface AIContext {
  pdfText: string;
  currentPage: number;
  totalPages: number;
  selectedText?: string;
}

export interface SemanticSearchResult {
  pageNumber: number;
  snippet: string;
  relevanceScore?: number;
}

export interface SemanticSearchResponse {
  results: SemanticSearchResult[];
  summary: string;
}


export type FormFieldType = 'text' | 'checkbox' | 'radio' | 'select' | 'button' | 'signature';

export interface FormFieldOption {
  value: string;
  displayValue: string;
}

export interface FormFieldBase {
  id: string;
  name: string;
  type: FormFieldType;
  page: number;
  rect: Rect;
  value: string | boolean | string[];
  defaultValue?: string | boolean | string[];
  required?: boolean;
  readOnly?: boolean;
}

export interface TextFormField extends FormFieldBase {
  type: 'text';
  value: string;
  multiline?: boolean;
  maxLength?: number;
  placeholder?: string;
}

export interface CheckboxFormField extends FormFieldBase {
  type: 'checkbox';
  value: boolean;
  exportValue?: string;
}

export interface RadioFormField extends FormFieldBase {
  type: 'radio';
  value: string;
  groupName: string;
  exportValue: string;
}

export interface SelectFormField extends FormFieldBase {
  type: 'select';
  value: string | string[];
  options: FormFieldOption[];
  multiSelect?: boolean;
}

export interface ButtonFormField extends FormFieldBase {
  type: 'button';
  value: string;
  buttonType: 'push' | 'submit' | 'reset';
}

export interface SignatureFormField extends FormFieldBase {
  type: 'signature';
  value: string;
}

export type FormField = TextFormField | CheckboxFormField | RadioFormField | SelectFormField | ButtonFormField | SignatureFormField;

export interface FormData {
  fields: FormField[];
  modified: boolean;
}

