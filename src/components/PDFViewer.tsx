import React, { useEffect, useRef, useState } from 'react';
import * as pdfjsLib from 'pdfjs-dist';

import pdfWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?url';

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker;

interface PDFViewerProps {
  pdfData: Uint8Array | null;
  activePage: number;
}

const PDFViewer: React.FC<PDFViewerProps> = ({ pdfData, activePage }) => {
  const canvasContainerRef = useRef<HTMLDivElement>(null);
  const [pdfDocument, setPdfDocument] = useState<pdfjsLib.PDFDocumentProxy | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!pdfData) {
      setPdfDocument(null);
      setError(null);
      return;
    }

    const loadPdf = async () => {
      try {
        setError(null);
        // Create a copy of the data to avoid sharing issues
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

    const renderPdf = async () => {
      try {
        // Clear existing content
        if (canvasContainerRef.current) {
          canvasContainerRef.current.innerHTML = '';
        }

        for (let pageNum = 1; pageNum <= pdfDocument.numPages; pageNum++) {
          const page = await pdfDocument.getPage(pageNum);

          const scale = 1.5;
          const viewport = page.getViewport({ scale });

          const canvas = document.createElement('canvas');
          const context = canvas.getContext('2d');
          if (!context) continue;

          const outputScale = window.devicePixelRatio || 1;

          canvas.width = Math.floor(viewport.width * outputScale);
          canvas.height = Math.floor(viewport.height * outputScale);

          canvas.style.width = `${viewport.width}px`;
          canvas.style.height = `${viewport.height}px`;

          canvas.setAttribute('data-page-number', String(pageNum));
          canvas.className = 'mb-4 shadow-lg';

          if (canvasContainerRef.current) {
            canvasContainerRef.current.appendChild(canvas);
          }

          const renderContext = {
            canvasContext: context,
            viewport,
            canvas,
            transform:
              outputScale !== 1 ? [outputScale, 0, 0, outputScale, 0, 0] : undefined,
          };
          
          await page.render(renderContext).promise;
        }
      } catch (error) {
        console.error('Error rendering PDF:', error);
        setError('Failed to render PDF');
      }
    };

    renderPdf();
  }, [pdfDocument]);

  useEffect(() => {
    if (!canvasContainerRef.current) return;
    
    const targetCanvas = canvasContainerRef.current.querySelector(
      `canvas[data-page-number="${activePage}"]`
    );

    targetCanvas?.scrollIntoView({
      behavior: 'smooth',
      block: 'start',
    });
  }, [activePage]);

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
    </div>
  );
};

export default PDFViewer;
