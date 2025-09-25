import React, { useState, useEffect } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverlay,
} from '@dnd-kit/core';
import type { DragEndEvent, DragStartEvent } from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  rectSortingStrategy,
} from '@dnd-kit/sortable';
import {
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import * as pdfjsLib from 'pdfjs-dist';
import type { PDFPage, InsertPageOptions } from '../types';
import PageThumbnail from './PageThumbnail';
import PageToolbar from './PageToolbar';
import { pdfRenderQueue } from '../utils/renderQueue';

interface SortablePageThumbnailProps {
  page: PDFPage;
  pdfDocument: pdfjsLib.PDFDocumentProxy;
  isSelected: boolean;
  onSelect: (pageId: string, isSelected: boolean) => void;
  onDoubleClick?: (pageId: string) => void;
}

const SortablePageThumbnail: React.FC<SortablePageThumbnailProps> = ({
  page,
  pdfDocument,
  isSelected,
  onSelect,
  onDoubleClick,
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: page.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`sortable-page-item ${isDragging ? 'dragging' : ''}`}
      {...attributes}
      {...listeners}
    >
      <PageThumbnail
        page={page}
        pdfDocument={pdfDocument}
        isSelected={isSelected}
        onSelect={onSelect}
        onDoubleClick={onDoubleClick}
        isDragging={isDragging}
      />
    </div>
  );
};

interface PageManagerProps {
  pdfDocument: pdfjsLib.PDFDocumentProxy | null;
  originalPdfData: Uint8Array | null;
  isOpen: boolean;
  onClose: () => void;
  onPageOrderChange: (newPageOrder: PDFPage[]) => void;
  onGoToPage?: (pageNumber: number) => void;
  onApplyToViewer?: (data: Uint8Array, doc: pdfjsLib.PDFDocumentProxy) => void;
}

const PageManager: React.FC<PageManagerProps> = ({
  pdfDocument,
  originalPdfData,
  isOpen,
  onClose,
  onPageOrderChange,
  onGoToPage,
  onApplyToViewer,
}) => {
  const [pages, setPages] = useState<PDFPage[]>([]);
  const [uploadedSources, setUploadedSources] = useState<Record<string, { exportData: Uint8Array; doc: pdfjsLib.PDFDocumentProxy }>>({});
  const [selectedPages, setSelectedPages] = useState<Set<string>>(new Set());
  const [activeId, setActiveId] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [isApplying, setIsApplying] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Initialize pages when PDF document changes
  useEffect(() => {
    if (!pdfDocument) {
      setPages([]);
      setSelectedPages(new Set());
      return;
    }

    const initializePages = () => {
      const newPages: PDFPage[] = [];
      for (let i = 1; i <= pdfDocument.numPages; i++) {
        newPages.push({
          id: `page-${i}`,
          pageNumber: i,
          originalPageNumber: i,
          sourceId: 'original',
        });
      }
      setPages(newPages);
      setSelectedPages(new Set());
      setUploadedSources({});
    };

    initializePages();
  }, [pdfDocument]);

  // Update parent when pages change
  useEffect(() => {
    onPageOrderChange(pages);
  }, [pages, onPageOrderChange]);

  // Clear render queue when component unmounts or closes
  useEffect(() => {
    return () => {
      if (!isOpen) {
        pdfRenderQueue.clear();
      }
    };
  }, [isOpen]);

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (active.id !== over?.id) {
      setPages((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id);
        const newIndex = items.findIndex((item) => item.id === over?.id);

        const newPages = arrayMove(items, oldIndex, newIndex);
        
        // Update page numbers to reflect new order
        return newPages.map((page, index) => ({
          ...page,
          pageNumber: index + 1,
        }));
      });
    }

    setActiveId(null);
  };

  const handlePageSelect = (pageId: string, isSelected: boolean) => {
    setSelectedPages((prev) => {
      const newSelection = new Set(prev);
      if (isSelected) {
        newSelection.add(pageId);
      } else {
        newSelection.delete(pageId);
      }
      return newSelection;
    });
  };

  const handlePageDoubleClick = (pageId: string) => {
    const page = pages.find(p => p.id === pageId);
    if (page && onGoToPage) {
      onGoToPage(page.pageNumber);
      onClose();
    }
  };

  const handleDeletePages = (pageIds: string[]) => {
    setPages((prev) => 
      prev.map((page) => 
        pageIds.includes(page.id) 
          ? { ...page, isDeleted: true }
          : page
      )
    );
    setSelectedPages(new Set());
  };

  const handleInsertPage = async (options: InsertPageOptions) => {
    let insertIndex = pages.length;
    
    if (options.insertAfterPageId) {
      const afterPageIndex = pages.findIndex(p => p.id === options.insertAfterPageId);
      if (afterPageIndex !== -1) {
        insertIndex = afterPageIndex + 1;
      }
    }

    if (options.type === 'blank') {
      const newPageId = `page-blank-${Date.now()}`;
      const newPage: PDFPage = {
        id: newPageId,
        pageNumber: insertIndex + 1,
        originalPageNumber: -1, // Indicates blank page
        sourceId: 'blank',
      };

      setPages((prev) => {
        const newPages = [...prev];
        newPages.splice(insertIndex, 0, newPage);
        
        // Update page numbers
        return newPages.map((page, index) => ({
          ...page,
          pageNumber: index + 1,
        }));
      });
    } else if (options.type === 'duplicate' && options.sourcePageId) {
      const sourcePage = pages.find(p => p.id === options.sourcePageId);
      if (sourcePage) {
        const newPageId = `page-duplicate-${Date.now()}`;
        const newPage: PDFPage = {
          id: newPageId,
          pageNumber: insertIndex + 1,
          originalPageNumber: sourcePage.originalPageNumber,
          sourceId: sourcePage.sourceId ?? 'original',
        };

        setPages((prev) => {
          const newPages = [...prev];
          newPages.splice(insertIndex, 0, newPage);
          
          // Update page numbers
          return newPages.map((page, index) => ({
            ...page,
            pageNumber: index + 1,
          }));
        });
      }
    } else if (options.type === 'upload' && options.fileData) {
      try {
        const viewerBytes = new Uint8Array(options.fileData);
        const exportBytes = new Uint8Array(options.fileData);
        const loadingTask = pdfjsLib.getDocument(viewerBytes);
        const doc = await loadingTask.promise;
        const sourceId = `upload-${Date.now()}`;
        setUploadedSources(prev => ({ ...prev, [sourceId]: { exportData: exportBytes, doc } }));

        const newUploadedPages: PDFPage[] = [];
        for (let i = 1; i <= doc.numPages; i++) {
          newUploadedPages.push({
            id: `${sourceId}-page-${i}`,
            pageNumber: insertIndex + i,
            originalPageNumber: i,
            sourceId,
          });
        }

        setPages((prev) => {
          const before = prev.slice(0, insertIndex);
          const after = prev.slice(insertIndex);
          const combined = [...before, ...newUploadedPages, ...after];
          return combined.map((p, idx) => ({ ...p, pageNumber: idx + 1 }));
        });
      } catch (e) {
        console.error('Failed to insert uploaded PDF pages:', e);
        alert('Failed to insert uploaded PDF.');
      }
    }
  };

  const handleDuplicatePages = (pageIds: string[]) => {
    const pagesToDuplicate = pages.filter(p => pageIds.includes(p.id));
    
    setPages((prev) => {
      let newPages = [...prev];
      
      // Insert duplicates after each original page
      pagesToDuplicate.reverse().forEach((page) => {
        const originalIndex = newPages.findIndex(p => p.id === page.id);
        if (originalIndex !== -1) {
          const duplicatePage: PDFPage = {
            id: `page-duplicate-${Date.now()}-${page.id}`,
            pageNumber: originalIndex + 2,
            originalPageNumber: page.originalPageNumber,
          };
          newPages.splice(originalIndex + 1, 0, duplicatePage);
        }
      });
      
      // Update page numbers
      return newPages.map((page, index) => ({
        ...page,
        pageNumber: index + 1,
      }));
    });
    
    setSelectedPages(new Set());
  };

  const handleSelectAll = () => {
    const selectablePageIds = pages.filter(p => !p.isDeleted).map(p => p.id);
    setSelectedPages(new Set(selectablePageIds));
  };

  const handleClearSelection = () => {
    setSelectedPages(new Set());
  };

  const handleExportPDF = async () => {
    if (!pdfDocument || !originalPdfData) {
      alert('No PDF data available for export');
      return;
    }
    
    setIsExporting(true);
    
    try {
      // Import the PDF manipulation utilities
      const { createPDFFromPages, downloadPDF, validatePageArray } = await import('../utils/pdfManipulation');
      
      // Validate the page array
      const validation = validatePageArray(pages);
      if (!validation.isValid) {
        alert(validation.error);
        return;
      }
      
      // Create the new PDF with the current page order
      const uploadedSourceBytes: Record<string, Uint8Array> = {};
      Object.entries(uploadedSources).forEach(([id, v]) => { uploadedSourceBytes[id] = v.exportData; });
      const modifiedPdfData = await createPDFFromPages(originalPdfData, pages, { uploadedSources: uploadedSourceBytes });
      
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
      const filename = `modified-document-${timestamp}.pdf`;
      
      downloadPDF(modifiedPdfData, filename);
      
    } catch (error) {
      console.error('Export failed:', error);
      alert('Failed to export PDF: ' + (error as Error).message);
    } finally {
      setIsExporting(false);
    }
  };

  const handleApplyToViewer = async () => {
    if (!pdfDocument || !originalPdfData || !onApplyToViewer) return;
    setIsApplying(true);
    try {
      const { createPDFFromPages } = await import('../utils/pdfManipulation');
      const uploadedSourceBytes: Record<string, Uint8Array> = {};
      Object.entries(uploadedSources).forEach(([id, v]) => { uploadedSourceBytes[id] = v.exportData; });
      const modifiedPdfData = await createPDFFromPages(originalPdfData, pages, { uploadedSources: uploadedSourceBytes });
      const loadingTask = pdfjsLib.getDocument(new Uint8Array(modifiedPdfData));
      const newDoc = await loadingTask.promise;
      onApplyToViewer(modifiedPdfData, newDoc);
    } catch (e) {
      console.error('Failed to apply changes to viewer:', e);
      alert('Failed to apply to viewer.');
    } finally {
      setIsApplying(false);
    }
  };

  const visiblePages = pages.filter(p => !p.isDeleted);
  const activeItem = pages.find(page => page.id === activeId);

  if (!isOpen) return null;

  return (
    <div className="page-manager-overlay fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
      <div className="page-manager-modal bg-white rounded-lg shadow-xl w-11/12 h-5/6 max-w-7xl flex flex-col">
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-800">Page Manager</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <PageToolbar
          selectedPages={selectedPages}
          pages={pages}
          onDeletePages={handleDeletePages}
          onInsertPage={handleInsertPage}
          onDuplicatePages={handleDuplicatePages}
          onSelectAll={handleSelectAll}
          onClearSelection={handleClearSelection}
          onExportPDF={handleExportPDF}
          isExporting={isExporting}
          onApplyToViewer={onApplyToViewer ? handleApplyToViewer : undefined}
          isApplying={isApplying}
        />

        <div className="flex-1 overflow-auto p-4 bg-gray-50">
          {!pdfDocument ? (
            <div className="flex items-center justify-center h-full text-gray-500">
              <div className="text-center">
                <div className="text-6xl mb-4">📄</div>
                <div className="text-xl">No PDF loaded</div>
                <div className="text-sm">Open a PDF to manage pages</div>
              </div>
            </div>
          ) : visiblePages.length === 0 ? (
            <div className="flex items-center justify-center h-full text-gray-500">
              <div className="text-center">
                <div className="text-6xl mb-4">📭</div>
                <div className="text-xl">No pages available</div>
                <div className="text-sm">All pages have been deleted</div>
              </div>
            </div>
          ) : (
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragStart={handleDragStart}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={visiblePages.map(p => p.id)}
                strategy={rectSortingStrategy}
              >
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                  {visiblePages.map((page) => {
                    const doc = page.sourceId && page.sourceId !== 'original' && page.sourceId !== 'blank'
                      ? uploadedSources[page.sourceId]?.doc
                      : pdfDocument;
                    if (!doc) return null;
                    return (
                      <SortablePageThumbnail
                        key={page.id}
                        page={page}
                        pdfDocument={doc}
                        isSelected={selectedPages.has(page.id)}
                        onSelect={handlePageSelect}
                        onDoubleClick={handlePageDoubleClick}
                      />
                    );
                  })}
                </div>
              </SortableContext>
              <DragOverlay>
                {activeItem && pdfDocument ? (
                  <PageThumbnail
                    page={activeItem}
                    pdfDocument={pdfDocument}
                    isSelected={selectedPages.has(activeItem.id)}
                    onSelect={() => {}}
                    isDragging={true}
                  />
                ) : null}
              </DragOverlay>
            </DndContext>
          )}
        </div>

        <div className="border-t border-gray-200 p-4 bg-gray-50">
          <div className="flex items-center justify-between text-sm text-gray-600">
            <div>
              Drag and drop to reorder pages • Double-click to navigate • Ctrl/Cmd+click for multi-select
            </div>
            <div>
              {visiblePages.length} page{visiblePages.length !== 1 ? 's' : ''}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PageManager;
