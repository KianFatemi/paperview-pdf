
import React, { useEffect, useRef, useState } from 'react';
import * as pdfjsLib from 'pdfjs-dist';

import pdfWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
import { useCopyText } from '../hooks/useCopyText';
import PDFContextMenu from './PDFContextMenu';

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker;

interface PDFViewerProps {
  pdfData: Uint8Array | null;
  activePage: number;
  zoomLevel: number;
  searchQuery?: string;
}

const PDFViewer: React.FC<PDFViewerProps> = ({ pdfData, activePage, zoomLevel, searchQuery = '' }) => {
  const canvasContainerRef = useRef<HTMLDivElement>(null);
  const [pdfDocument, setPdfDocument] = useState<pdfjsLib.PDFDocumentProxy | null>(null);
  const [error, setError] = useState<string | null>(null);
  const queryRef = useRef<string>(searchQuery);

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
      return;
    }

    const loadPdf = async () => {
      try {
        setError(null);
        const pdfDataCopy = new Uint8Array(pdfData);
        const loadingTask = pdfjsLib.getDocument(pdfDataCopy);
        const pdf = await loadingTask.promise;
        setPdfDocument(pdf);
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

    const cleanup = () => {
      observers.forEach(observer => observer.disconnect());
      highlightTimeouts.forEach(timeout => clearTimeout(timeout));
      observers = [];
      highlightTimeouts = [];
    };

    const renderPdf = async () => {
      try {
        const container = canvasContainerRef.current;
        if (!container) return;
        container.innerHTML = '';

        const containerWidth = container.offsetWidth - 32;

        for (let pageNum = 1; pageNum <= pdfDocument.numPages; pageNum++) {
          const page = await pdfDocument.getPage(pageNum);

          
          const viewport = page.getViewport({ scale: 1 });
          const initialScale = containerWidth / viewport.width;

          
          const scale = initialScale * zoomLevel;
          const outputScale = window.devicePixelRatio || 1;
          const scaledViewport = page.getViewport({ scale });

          const pageWrapper = document.createElement('div');
          pageWrapper.className = 'relative mb-4 shadow-lg';
          pageWrapper.setAttribute('data-page-number', String(pageNum));

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
          textLayerDiv.style.setProperty('--total-scale-factor', `${scale}`);

          layersDiv.appendChild(canvasDiv);
          layersDiv.appendChild(textLayerDiv);
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

          const textContent = await page.getTextContent();
          const textLayer = new (pdfjsLib as any).TextLayer({
            textContentSource: textContent,
            container: textLayerDiv,
            viewport: scaledViewport.clone({ dontFlip: true }),
          });
          await textLayer.render();

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
        }
      } catch (error) {
        console.error('Error rendering PDF:', error);
        setError('Failed to render PDF');
      }
    };

    renderPdf();
    
    return cleanup;
        
  }, [pdfDocument, zoomLevel]); 

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

  return (
    <div ref={canvasContainerRef} className="flex-1 overflow-auto p-4 bg-gray-800 flex flex-col items-center">
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
        />
      )}
    </div>
  );
};

export default PDFViewer;