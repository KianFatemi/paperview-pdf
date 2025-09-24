import React, { useRef } from 'react';
import type { PDFPage, InsertPageOptions } from '../types';

interface PageToolbarProps {
  selectedPages: Set<string>;
  pages: PDFPage[];
  onDeletePages: (pageIds: string[]) => void;
  onInsertPage: (options: InsertPageOptions) => void;
  onDuplicatePages: (pageIds: string[]) => void;
  onSelectAll: () => void;
  onClearSelection: () => void;
  onExportPDF: () => void;
  isExporting?: boolean;
}

const PageToolbar: React.FC<PageToolbarProps> = ({
  selectedPages,
  pages,
  onDeletePages,
  onInsertPage,
  onDuplicatePages,
  onSelectAll,
  onClearSelection,
  onExportPDF,
  isExporting = false,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const selectedPageIds = Array.from(selectedPages);
  const hasSelection = selectedPages.size > 0;
  const allPagesSelected = selectedPages.size === pages.filter(p => !p.isDeleted).length;

  const handleDeletePages = () => {
    if (!hasSelection) return;
    
    const confirmMessage = selectedPages.size === 1 
      ? 'Are you sure you want to delete this page?' 
      : `Are you sure you want to delete ${selectedPages.size} pages?`;
      
    if (window.confirm(confirmMessage)) {
      onDeletePages(selectedPageIds);
    }
  };

  const handleInsertBlankPage = () => {
    const insertAfterPageId = selectedPageIds.length > 0 ? selectedPageIds[selectedPageIds.length - 1] : undefined;
    onInsertPage({
      type: 'blank',
      insertAfterPageId,
    });
  };

  const handleInsertFromFile = () => {
    fileInputRef.current?.click();
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type === 'application/pdf') {
      const insertAfterPageId = selectedPageIds.length > 0 ? selectedPageIds[selectedPageIds.length - 1] : undefined;
      
      // Read file and convert to options format
      const reader = new FileReader();
      reader.onload = (e) => {
        const arrayBuffer = e.target?.result as ArrayBuffer;
        if (arrayBuffer) {
          onInsertPage({
            type: 'upload',
            insertAfterPageId,
            fileData: new Uint8Array(arrayBuffer),
          });
        }
      };
      reader.readAsArrayBuffer(file);
    } else {
      alert('Please select a PDF file.');
    }
    
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleDuplicatePages = () => {
    if (!hasSelection) return;
    onDuplicatePages(selectedPageIds);
  };

  const handleSelectToggle = () => {
    if (allPagesSelected) {
      onClearSelection();
    } else {
      onSelectAll();
    }
  };

  return (
    <div className="page-toolbar bg-white border-b border-gray-200 p-4 flex items-center justify-between shadow-sm">
      <div className="flex items-center space-x-4">
        <div className="flex items-center space-x-2">
          <button
            onClick={handleSelectToggle}
            className="px-3 py-1.5 text-sm border border-gray-300 rounded hover:bg-gray-50 transition-colors"
          >
            {allPagesSelected ? 'Deselect All' : 'Select All'}
          </button>
          
          {hasSelection && (
            <button
              onClick={onClearSelection}
              className="px-3 py-1.5 text-sm text-gray-600 hover:text-gray-800 transition-colors"
            >
              Clear Selection
            </button>
          )}
        </div>

        <div className="text-sm text-gray-600">
          {hasSelection ? (
            <span>{selectedPages.size} page{selectedPages.size !== 1 ? 's' : ''} selected</span>
          ) : (
            <span>{pages.filter(p => !p.isDeleted).length} page{pages.filter(p => !p.isDeleted).length !== 1 ? 's' : ''} total</span>
          )}
        </div>
      </div>

      <div className="flex items-center space-x-2">
        <div className="flex items-center space-x-1">
          <button
            onClick={handleInsertBlankPage}
            className="flex items-center space-x-1 px-3 py-1.5 text-sm bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
            title="Insert blank page"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            <span>Blank Page</span>
          </button>

          <button
            onClick={handleInsertFromFile}
            className="flex items-center space-x-1 px-3 py-1.5 text-sm bg-green-500 text-white rounded hover:bg-green-600 transition-colors"
            title="Insert pages from PDF file"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
            <span>From File</span>
          </button>

          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf"
            onChange={handleFileSelect}
            className="hidden"
          />
        </div>

        <div className="flex items-center space-x-1 border-l border-gray-300 pl-2">
          <button
            onClick={handleDuplicatePages}
            disabled={!hasSelection}
            className="flex items-center space-x-1 px-3 py-1.5 text-sm border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            title="Duplicate selected pages"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
            <span>Duplicate</span>
          </button>

          <button
            onClick={handleDeletePages}
            disabled={!hasSelection}
            className="flex items-center space-x-1 px-3 py-1.5 text-sm bg-red-500 text-white rounded hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            title="Delete selected pages"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
            <span>Delete</span>
          </button>
        </div>
      </div>

      <div className="flex items-center">
        <button
          onClick={onExportPDF}
          disabled={isExporting}
          className="flex items-center space-x-2 px-4 py-2 bg-indigo-500 text-white rounded hover:bg-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isExporting ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              <span>Exporting...</span>
            </>
          ) : (
            <>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <span>Export PDF</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default PageToolbar;
