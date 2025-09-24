import React, { useEffect, useRef, useState } from 'react';
import * as pdfjsLib from 'pdfjs-dist';
import type { PDFPage } from '../types';
import { pdfRenderQueue } from '../utils/renderQueue';

interface PageThumbnailProps {
  page: PDFPage;
  pdfDocument: pdfjsLib.PDFDocumentProxy;
  isSelected: boolean;
  onSelect: (pageId: string, isSelected: boolean) => void;
  onDoubleClick?: (pageId: string) => void;
  isDragging?: boolean;
  scale?: number;
}

const PageThumbnail: React.FC<PageThumbnailProps> = ({
  page,
  pdfDocument,
  isSelected,
  onSelect,
  onDoubleClick,
  isDragging = false,
  scale = 0.3,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const taskIdRef = useRef<string | null>(null);

  useEffect(() => {
    const renderThumbnail = async () => {
      if (!canvasRef.current || !pdfDocument || page.isDeleted) return;

      try {
        setIsLoading(true);
        setError(null);

        if (taskIdRef.current) {
          pdfRenderQueue.cancelTask(taskIdRef.current);
          taskIdRef.current = null;
        }

        if (!canvasRef.current || page.isDeleted) return;

        const pdfPage = await pdfDocument.getPage(page.originalPageNumber);
        const viewport = pdfPage.getViewport({ scale });
        
        const canvas = canvasRef.current;
        if (!canvas) return;
        
        const context = canvas.getContext('2d');
        if (!context) return;

        canvas.width = Math.floor(viewport.width);
        canvas.height = Math.floor(viewport.height);
        canvas.style.width = `${viewport.width}px`;
        canvas.style.height = `${viewport.height}px`;

        const taskId = `thumbnail-${page.id}-${Date.now()}`;
        taskIdRef.current = taskId;

        await pdfRenderQueue.addRenderTask(taskId, pdfPage, canvas, context, viewport);
        
        taskIdRef.current = null;
        setIsLoading(false);
      } catch (err) {
        if ((err as any)?.message?.includes('cancelled') || (err as any)?.message?.includes('Task cancelled')) {
          return;
        }
        console.error('Error rendering thumbnail:', err);
        setError('Failed to render thumbnail');
        setIsLoading(false);
      }
    };

    renderThumbnail();

    return () => {
      if (taskIdRef.current) {
        pdfRenderQueue.cancelTask(taskIdRef.current);
        taskIdRef.current = null;
      }
    };
  }, [pdfDocument, page.originalPageNumber, scale, page.isDeleted]);

  const handleClick = (e: React.MouseEvent) => {
    if (e.ctrlKey || e.metaKey) {
      onSelect(page.id, !isSelected);
    } else {
      onSelect(page.id, true);
    }
  };

  const handleDoubleClick = () => {
    if (onDoubleClick) {
      onDoubleClick(page.id);
    }
  };

  if (page.isDeleted) {
    return (
      <div className="page-thumbnail deleted">
        <div className="thumbnail-container bg-red-100 border-2 border-red-300 rounded-lg p-4">
          <div className="text-red-600 text-center">
            <div className="text-2xl mb-2">🗑️</div>
            <div className="text-sm">Page {page.pageNumber}</div>
            <div className="text-xs opacity-75">Deleted</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`page-thumbnail ${isDragging ? 'dragging' : ''} ${
        isSelected ? 'selected' : ''
      }`}
      onClick={handleClick}
      onDoubleClick={handleDoubleClick}
    >
      <div
        className={`thumbnail-container relative bg-white rounded-lg shadow-md transition-all duration-200 hover:shadow-lg cursor-pointer ${
          isSelected
            ? 'ring-2 ring-blue-500 ring-offset-2 ring-offset-gray-100'
            : 'hover:ring-1 hover:ring-gray-300'
        } ${isDragging ? 'opacity-50 rotate-2' : ''}`}
      >
        {isSelected && (
          <div className="absolute -top-2 -right-2 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center z-10">
            <svg
              className="w-4 h-4 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
        )}

        <div className="p-2">
          <div className="relative">
            {isLoading && (
              <div className="absolute inset-0 flex items-center justify-center bg-gray-100 rounded">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
              </div>
            )}
            
            {error && (
              <div className="absolute inset-0 flex items-center justify-center bg-gray-100 rounded text-red-500 text-xs">
                <div className="text-center">
                  <div className="text-2xl mb-1">⚠️</div>
                  <div>Error</div>
                </div>
              </div>
            )}

            <canvas
              ref={canvasRef}
              className={`border border-gray-200 rounded ${
                isLoading || error ? 'opacity-0' : 'opacity-100'
              } transition-opacity duration-200`}
              style={{ maxWidth: '150px', height: 'auto' }}
            />
          </div>

          <div className="text-center mt-2">
            <div className="text-sm font-medium text-gray-700">
              Page {page.pageNumber}
            </div>
            {page.originalPageNumber !== page.pageNumber && (
              <div className="text-xs text-gray-500">
                (orig. {page.originalPageNumber})
              </div>
            )}
          </div>
        </div>

        <div className="absolute top-1 left-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          <svg
            className="w-4 h-4 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 6h16M4 12h16M4 18h16"
            />
          </svg>
        </div>
      </div>
    </div>
  );
};

export default PageThumbnail;
