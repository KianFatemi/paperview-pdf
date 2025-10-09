
import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as pdfjsLib from 'pdfjs-dist';

import pdfWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
import { useCopyText } from '../hooks/useCopyText';
import PDFContextMenu from './PDFContextMenu';
import AnnotationLayer from './AnnotationLayer';
import FormLayer from './FormLayer';
import FormToolbar from './FormToolbar';
import { v4 as uuidv4 } from 'uuid';
import { createRoot } from 'react-dom/client';
import type { Root } from 'react-dom/client'; 
import type { Annotation as AnnotationInterface, AnnotationType, Rect, HighlightColor, StickyNote, FormField } from '../types';
import { extractAllFormFields, hasFormFields } from '../utils/formUtils'; 

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker;

interface PDFViewerProps {
  pdfData: Uint8Array | null;
  activePage: number;
  zoomLevel: number;
  searchQuery?: string;
  stickyNoteMode: boolean;
  onToggleStickyNoteMode: () => void;
  onPageChange?: (page: number) => void;
  selectedHighlightColor: HighlightColor;
  onColorChange: (color: HighlightColor) => void;
  addAnnotationRef?: React.MutableRefObject<((type: AnnotationType) => void) | null>;
}

const PDFViewer: React.FC<PDFViewerProps> = ({ pdfData, activePage, zoomLevel, searchQuery = '', stickyNoteMode, onToggleStickyNoteMode, onPageChange, selectedHighlightColor, onColorChange, addAnnotationRef }) => {
  const canvasContainerRef = useRef<HTMLDivElement>(null);
  const [pdfDocument, setPdfDocument] = useState<pdfjsLib.PDFDocumentProxy | null>(null);
  const [error, setError] = useState<string | null>(null);
  const queryRef = useRef<string>(searchQuery);
  const [annotations, setAnnotations] = useState<AnnotationInterface[]>([]); 
  const [pageScales, setPageScales] = useState<{ [key: number]: number }>({}); 
  const [stickyNotes, setStickyNotes] = useState<StickyNote[]>([]); 
  const renderRunIdRef = useRef(0);
  const [formFields, setFormFields] = useState<FormField[]>([]);
  const [hasInteractiveForms, setHasInteractiveForms] = useState(false);
  const formRootsRef = useRef<Map<number, Root>>(new Map());

  useEffect(() => {
    queryRef.current = searchQuery;
  }, [searchQuery]);

  const clearHighlightsIn = (textLayerDiv: HTMLElement) => {
    const highlights = textLayerDiv.querySelectorAll('.pdf-highlight-rect');
    highlights.forEach((el) => el.remove());
    
    const highlightedSpans = textLayerDiv.querySelectorAll('span[data-highlighted]');
    highlightedSpans.forEach((span) => {
      const originalHTML = span.getAttribute('data-original-html');
      if (originalHTML !== null) {
        span.innerHTML = originalHTML;
      }
      span.removeAttribute('data-highlighted');
      span.removeAttribute('data-original-html');
    });
  };

  const applyHighlightsIn = (textLayerDiv: HTMLElement, query: string) => {
    clearHighlightsIn(textLayerDiv);
    const q = query.trim();
    if (!q) return;

    setTimeout(() => {
      applyHighlightsImmediate(textLayerDiv, q);
    }, 50);
  };

  const applyHighlightsImmediate = (textLayerDiv: HTMLElement, query: string) => {
    const needle = query.toLowerCase();
    if (!needle) return;

    const textSpans = Array.from(textLayerDiv.querySelectorAll('span:not([data-highlighted])')) as HTMLSpanElement[];
    if (textSpans.length === 0) return;

    textSpans.forEach(span => {
      const text = span.textContent || '';
      const lowerText = text.toLowerCase();
      
      if (!lowerText.includes(needle)) return;

      span.setAttribute('data-highlighted', 'true');
      span.setAttribute('data-original-html', span.innerHTML);
      
      let highlightedHTML = '';
      let lastIndex = 0;
      let searchIndex = 0;
      
      while (true) {
        const found = lowerText.indexOf(needle, searchIndex);
        if (found === -1) break;
        
        highlightedHTML += escapeHtml(text.substring(lastIndex, found));
        
        const matchText = text.substring(found, found + needle.length);
        highlightedHTML += `<mark class="pdf-highlight">${escapeHtml(matchText)}</mark>`;
        
        lastIndex = found + needle.length;
        searchIndex = found + 1;
      }
      
      highlightedHTML += escapeHtml(text.substring(lastIndex));
      
      span.innerHTML = highlightedHTML;
    });
  };

  const escapeHtml = (text: string): string => {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  };

  useEffect(() => {
    if (!pdfData) {
      setPdfDocument(null);
      setError(null);
      setAnnotations([]); 
      return;
    }

    const loadPdf = async () => {
      try {
        setError(null);
        setAnnotations([]);
        setStickyNotes([]);
        setFormFields([]); 
        setHasInteractiveForms(false);
        
        const pdfDataCopy = new Uint8Array(pdfData);
        const loadingTask = pdfjsLib.getDocument(pdfDataCopy);
        const pdf = await loadingTask.promise;
        setPdfDocument(pdf);
        
        const hasForms = await hasFormFields(pdf);
        setHasInteractiveForms(hasForms);
        
        if (hasForms) {
          const fields = await extractAllFormFields(pdf);
          setFormFields(fields);
        }
      } catch (error) {
        console.error('Error loading PDF:', error);
        setError('Failed to load PDF');
        setPdfDocument(null);
      }
    };

    loadPdf();
  }, [pdfData]);

  useEffect(() => {
    if (!pdfDocument || !canvasContainerRef.current) return;

    let observers: ResizeObserver[] = [];
    let highlightTimeouts: NodeJS.Timeout[] = [];
    let reactRoots: Root[] = [];
    let pageObserver: IntersectionObserver | null = null;
    const runId = ++renderRunIdRef.current;

    const cleanup = () => {
      observers.forEach(observer => observer.disconnect());
      highlightTimeouts.forEach(timeout => clearTimeout(timeout));
      reactRoots.forEach(root => setTimeout(() => root.unmount(), 0));
      if (pageObserver) {
        pageObserver.disconnect();
      }
      formRootsRef.current.forEach(root => setTimeout(() => root.unmount(), 0));
      formRootsRef.current.clear();
      
      observers = [];
      highlightTimeouts = [];
      reactRoots = [];
      pageObserver = null;
      const containerEl = canvasContainerRef.current;
      if (containerEl) {
        containerEl.innerHTML = '';
      }
    };

    const renderPdf = async () => {
      try {
        const container = canvasContainerRef.current;
        if (!container) return;
        container.innerHTML = '';
        if (renderRunIdRef.current !== runId) return;

        const containerWidth = container.offsetWidth - 32;

        for (let pageNum = 1; pageNum <= pdfDocument.numPages; pageNum++) {
          if (renderRunIdRef.current !== runId) return;
          const page = await pdfDocument.getPage(pageNum);
          if (renderRunIdRef.current !== runId) return;

          
          const viewport = page.getViewport({ scale: 1 });
          const initialScale = containerWidth / viewport.width;

          
          const scale = initialScale * zoomLevel;
          const outputScale = window.devicePixelRatio || 1;
          const scaledViewport = page.getViewport({ scale });

          const pageWrapper = document.createElement('div');
          pageWrapper.className = 'relative mb-4 shadow-lg';
          pageWrapper.setAttribute('data-page-number', String(pageNum));
          
          // Add click handler for sticky note placement
          pageWrapper.style.cursor = stickyNoteMode ? 'crosshair' : 'default';
          pageWrapper.addEventListener('click', (e) => {
            if (stickyNoteMode && !e.defaultPrevented) {
              const target = e.target as HTMLElement;
              if (!target.closest('.sticky-note')) {
                const rect = pageWrapper.getBoundingClientRect();
                const x = (e.clientX - rect.left) / scale;
                const y = (e.clientY - rect.top) / scale;
                addStickyNote(pageNum, x, y);
              }
            }
          });

          const layersDiv = document.createElement('div');
          layersDiv.className = 'pdf-layers';
          layersDiv.style.position = 'relative';
          layersDiv.style.width = `${scaledViewport.width}px`;
          layersDiv.style.height = `${scaledViewport.height}px`;

          const canvasDiv = document.createElement('div');
          canvasDiv.className = 'pdf-layer__canvas';
          const canvas = document.createElement('canvas');
          const context = canvas.getContext('2d');
          if (!context) continue;

          canvas.width = Math.floor(scaledViewport.width * outputScale);
          canvas.height = Math.floor(scaledViewport.height * outputScale);

          canvas.style.width = `${scaledViewport.width}px`;
          canvas.style.height = `${scaledViewport.height}px`;

          canvasDiv.appendChild(canvas);

          const textLayerDiv = document.createElement('div');
          textLayerDiv.className = 'pdf-layer__text';
          textLayerDiv.style.position = 'absolute';
          textLayerDiv.style.left = '0px';
          textLayerDiv.style.top = '0px';
          textLayerDiv.style.width = `${scaledViewport.width}px`;
          textLayerDiv.style.height = `${scaledViewport.height}px`;
          textLayerDiv.style.zIndex = '5';
          textLayerDiv.style.setProperty('--total-scale-factor', `${scale}`);

          setPageScales((prev) => ({ ...prev, [pageNum]: scale }));

          
          const annotationLayerDiv = document.createElement('div');
          annotationLayerDiv.className = 'pdf-layer__annotation';
          annotationLayerDiv.style.position = 'absolute';
          annotationLayerDiv.style.left = '0px';
          annotationLayerDiv.style.top = '0px';
          annotationLayerDiv.style.width = `${scaledViewport.width}px`;
          annotationLayerDiv.style.height = `${scaledViewport.height}px`;

          const formLayerDiv = document.createElement('div');
          formLayerDiv.className = 'pdf-layer__form';
          formLayerDiv.style.position = 'absolute';
          formLayerDiv.style.left = '0px';
          formLayerDiv.style.top = '0px';
          formLayerDiv.style.width = `${scaledViewport.width}px`;
          formLayerDiv.style.height = `${scaledViewport.height}px`;
          formLayerDiv.style.zIndex = '20';
          formLayerDiv.style.pointerEvents = 'none';

          layersDiv.appendChild(canvasDiv);
          layersDiv.appendChild(textLayerDiv);
          layersDiv.appendChild(annotationLayerDiv);
          layersDiv.appendChild(formLayerDiv); 

          pageWrapper.appendChild(layersDiv);
          container.appendChild(pageWrapper);

          const renderContext = {
            canvasContext: context,
            viewport: scaledViewport,
            canvas,
            transform:
              outputScale !== 1 ? [outputScale, 0, 0, outputScale, 0, 0] : undefined,
          };
          
          await page.render(renderContext).promise;
          if (renderRunIdRef.current !== runId) return;

          const textContent = await page.getTextContent();
          const textLayer = new (pdfjsLib as any).TextLayer({
            textContentSource: textContent,
            container: textLayerDiv,
            viewport: scaledViewport.clone({ dontFlip: true }),
          });
          await textLayer.render();
          if (renderRunIdRef.current !== runId) return;

          await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
          
          await new Promise((resolve) => setTimeout(resolve, 100));

          if (queryRef.current && queryRef.current.trim()) {
            applyHighlightsIn(textLayerDiv, queryRef.current);
          }

          const ro = new ResizeObserver(() => {
            const timeout = setTimeout(() => {
              const q = queryRef.current;
              if (q && q.trim()) {
                applyHighlightsIn(textLayerDiv, q);
              } else {
                clearHighlightsIn(textLayerDiv);
              }
            }, 150);
            highlightTimeouts.push(timeout);
          });
          ro.observe(textLayerDiv);
          observers.push(ro);

          
          const pageAnnotations = annotations.filter((a) => a.page === pageNum);
          const pageStickyNotes = stickyNotes.filter((note) => note.page === pageNum);
          const root = createRoot(annotationLayerDiv);
          root.render(
            <AnnotationLayer 
              annotations={pageAnnotations} 
              stickyNotes={pageStickyNotes}
              scale={scale} 
              onStickyNoteUpdate={updateStickyNote}
              onStickyNoteDelete={deleteStickyNote}
            />
          );
          reactRoots.push(root);

          const pageFormFields = formFields.filter((field) => field.page === pageNum);
          if (pageFormFields.length > 0) {
            const formRoot = createRoot(formLayerDiv);
            formRoot.render(
              <FormLayer 
                fields={pageFormFields}
                scale={scale}
                onFieldChange={handleFormFieldChange}
              />
            );
            formRootsRef.current.set(pageNum, formRoot);
          } 
        }

        // Set up Intersection Observer to track the current page
        if (onPageChange && container) {
          const observerOptions = {
            root: container,
            rootMargin: '-40% 0px -40% 0px',
            threshold: 0,
          };

          const observerCallback = (entries: IntersectionObserverEntry[]) => {
            entries.forEach((entry) => {
              if (entry.isIntersecting) {
                const pageNumber = parseInt(
                  entry.target.getAttribute('data-page-number') || '0'
                );
                if (pageNumber > 0) {
                  onPageChange(pageNumber);
                }
              }
            });
          };

          pageObserver = new IntersectionObserver(observerCallback, observerOptions);

          const pageWrappers = container.querySelectorAll('[data-page-number]');
          pageWrappers.forEach((wrapper) => pageObserver?.observe(wrapper));
        }
      } catch (error) {
        console.error('Error rendering PDF:', error);
        setError('Failed to render PDF');
      }
    };

    renderPdf();
    
    return cleanup;
        
  }, [pdfDocument, zoomLevel, annotations, stickyNotes, stickyNoteMode, onPageChange]);

  useEffect(() => {
    if (!pdfDocument || formFields.length === 0) return;
    if (formRootsRef.current.size === 0) return;

    formRootsRef.current.forEach((formRoot, pageNum) => {
      const pageScale = pageScales[pageNum];
      if (!pageScale) return;

      const pageFormFields = formFields.filter((field) => field.page === pageNum);

      formRoot.render(
        <FormLayer 
          fields={pageFormFields}
          scale={pageScale}
          onFieldChange={handleFormFieldChange}
        />
      );
    });
  }, [formFields]); 

  useEffect(() => {
    if (!canvasContainerRef.current) return;
    
    const targetCanvas = canvasContainerRef.current.querySelector(
      `[data-page-number="${activePage}"]`
    );

    targetCanvas?.scrollIntoView({
      behavior: 'smooth',
      block: 'start',
    });
  }, [activePage]);

  useEffect(() => {
    const container = canvasContainerRef.current;
    if (!container) return;
    const layers = Array.from(container.querySelectorAll('.pdf-layer__text, .textLayer')) as HTMLElement[];
    
    const timeout = setTimeout(() => {
      layers.forEach((layer) => {
        if (!searchQuery || !searchQuery.trim()) {
          clearHighlightsIn(layer);
        } else {
          applyHighlightsIn(layer, searchQuery);
        }
      });
    }, 100);
    
    return () => clearTimeout(timeout);
  }, [searchQuery]);


  const { menuPosition, setMenuPosition, handleCopy } = useCopyText(canvasContainerRef);

  
  const addAnnotation = useCallback((type: AnnotationType) => {
    let color: string;
    if (type === 'highlight') {
      color = selectedHighlightColor.value;
    } else {
      color = 'red';
    }

    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) {
      return;
    }

    const range = selection.getRangeAt(0);
    const clientRects = Array.from(range.getClientRects());

    
    let node = range.startContainer as Node;
    while (node && !((node as HTMLElement).classList?.contains('pdf-layer__text'))) {
      node = node.parentNode as Node;
    }
    const textLayer = node as HTMLElement;
    if (!textLayer) {
      return;
    }

    const pageWrapper = textLayer.closest('[data-page-number]') as HTMLElement;
    const pageNum = parseInt(pageWrapper.getAttribute('data-page-number') || '0');
    if (!pageNum || !pageScales[pageNum]) {
      return;
    }

    const scale = pageScales[pageNum];
    const textLayerRect = textLayer.getBoundingClientRect();

    const rects: Rect[] = clientRects
      .filter(r => r.width > 0 && r.height > 0) 
      .map((r) => ({
        x: (r.left - textLayerRect.left) / scale,
        y: (r.top - textLayerRect.top) / scale,
        width: r.width / scale,
        height: r.height / scale,
      }));

    if (rects.length === 0) {
      return;
    }

    const newAnnotation: AnnotationInterface = {
      id: uuidv4(),
      page: pageNum,
      type,
      rects,
      color,
    };

    setAnnotations((prev) => [...prev, newAnnotation]);
    selection.removeAllRanges();
  }, [selectedHighlightColor, pageScales]);

  // Expose addAnnotation function to parent via ref
  useEffect(() => {
    if (addAnnotationRef) {
      addAnnotationRef.current = addAnnotation;
    }
  }, [addAnnotation, addAnnotationRef]);

  // Sticky note handlers
  const addStickyNote = (pageNum: number, x: number, y: number) => {
    const newNote: StickyNote = {
      id: uuidv4(),
      page: pageNum,
      x,
      y,
      text: '',
      isExpanded: true,
      timestamp: Date.now(),
    };

    setStickyNotes((prev) => [...prev, newNote]);
    onToggleStickyNoteMode(); // Exit sticky note mode after placing
  };

  const updateStickyNote = (noteId: string, updates: Partial<StickyNote>) => {
    setStickyNotes((prev) =>
      prev.map((note) => (note.id === noteId ? { ...note, ...updates } : note))
    );
  };

  const deleteStickyNote = (noteId: string) => {
    setStickyNotes((prev) => prev.filter((note) => note.id !== noteId));
  };

  // Form field handlers
  const handleFormFieldChange = (fieldId: string, value: string | boolean | string[]) => {
    setFormFields((prev) =>
      prev.map((field): FormField => {
        if (field.id === fieldId) {
          return { ...field, value } as FormField;
        }
        return field;
      })
    );
  };

  const handleFormSave = (filledPdfData: Uint8Array) => {
    console.log('Form saved successfully', filledPdfData);
  };


  return (
    <div className="flex-1 flex flex-col bg-gray-800">
      {hasInteractiveForms && pdfData && (
        <div style={{ position: 'sticky', top: 0, zIndex: 1000, width: '100%' }}>
          <FormToolbar 
            pdfData={pdfData}
            formFields={formFields}
            hasFormFields={hasInteractiveForms}
            onSave={handleFormSave}
          />
        </div>
      )}
      <div ref={canvasContainerRef} className="flex-1 overflow-auto p-4 flex flex-col items-center relative">
        {!pdfData && (
          <div className="text-gray-400 text-center mt-20">
            <p className="text-2xl">Please open a PDF file to begin.</p>
          </div>
        )}
        {error && (
          <div className="text-red-400 p-4">
            <p>{error}</p>
          </div>
        )}
        {menuPosition && (
          <PDFContextMenu
            x={menuPosition.x}
            y={menuPosition.y}
            onClose={() => setMenuPosition(null)}
            onCopy={handleCopy}
            onApplyAnnotation={addAnnotation}
            selectedHighlightColor={selectedHighlightColor}
            onColorChange={onColorChange}
          />
        )}
      </div>
    </div>
  );
};

export default PDFViewer;