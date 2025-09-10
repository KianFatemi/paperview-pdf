import React, { useEffect, useRef } from 'react';
import * as pdfjsLib from 'pdfjs-dist';

import pdfWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?url';

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker;

interface PDFViewerProps {
  pdfData: Uint8Array | null;
}

const PDFViewer: React.FC<PDFViewerProps> = ({ pdfData }) => {
  const canvasContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!pdfData) return;

    const renderPdf = async () => {
      if (canvasContainerRef.current) {
        canvasContainerRef.current.innerHTML = '';
      }
    
      try {
        const loadingTask = pdfjsLib.getDocument(pdfData!);
        const pdf = await loadingTask.promise;
    
        for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
          const page = await pdf.getPage(pageNum);
    
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
    
          canvas.className = 'mb-4 shadow-lg';
          canvasContainerRef.current?.appendChild(canvas);
    
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
        if (canvasContainerRef.current) {
          canvasContainerRef.current.innerHTML =
            '<p class="text-red-400 p-4">Failed to load PDF.</p>';
        }
      }
    };

    renderPdf();
  }, [pdfData]);

  return (
    <div ref={canvasContainerRef} className="flex-1 overflow-auto p-4 bg-gray-800 flex flex-col items-center">
      {!pdfData && (
        <div className="text-gray-400 text-center mt-20">
          <p className="text-2xl">Please open a PDF file to begin.</p>
        </div>
      )}
    </div>
  );
};

export default PDFViewer;
