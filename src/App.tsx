import { useState, useCallback } from 'react';
import Toolbar from './components/Toolbar';
import Sidebar from './components/Sidebar';
import PDFViewer from './components/PDFViewer';
import PDFSearchOverlay from './components/PDFSearchOverlay';
import PageManager from './components/PageManager';
import AISidePanel from './components/AISidePanel';
import AIButton from './components/AIButton';
import type { PDFPage, PageManagementState } from './types';
import * as pdfjsLib from 'pdfjs-dist';

function App() {

  const [pdfData, setPdfData] = useState<Uint8Array | null>(null);
  const [pdfDocument, setPdfDocument] = useState<pdfjsLib.PDFDocumentProxy | null>(null);
  const [activePage, setActivePage] = useState<number>(1);
  const [zoomLevel, setZoomLevel] = useState<number>(1.0);
  const [isSearchOpen, setIsSearchOpen] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [stickyNoteMode, setStickyNoteMode] = useState<boolean>(false);
  const [pageManagement, setPageManagement] = useState<PageManagementState>({
    pages: [],
    selectedPages: new Set(),
    isPageManagerOpen: false,
  });
  const [isAIPanelOpen, setIsAIPanelOpen] = useState<boolean>(false);

  const handleZoomIn = useCallback(() => setZoomLevel((prevZoom) => prevZoom + 0.1), []);
  const handleZoomOut = useCallback(() => setZoomLevel((prevZoom) => Math.max(0.1, prevZoom - 0.1)), []);
  const handleFitToScreen = useCallback(() => setZoomLevel(1.0), []);

  const handleOpenPageManager = useCallback(() => {
    setPageManagement(prev => ({ ...prev, isPageManagerOpen: true }));
  }, []);

  const handleClosePageManager = useCallback(() => {
    setPageManagement(prev => ({ ...prev, isPageManagerOpen: false }));
  }, []);

  const handlePageOrderChange = useCallback((newPageOrder: PDFPage[]) => {
    setPageManagement(prev => ({ ...prev, pages: newPageOrder }));
  }, []);

  const handleGoToPage = useCallback((pageNumber: number) => {
    setActivePage(pageNumber);
  }, []);

  const handleToggleAIPanel = useCallback(() => {
    setIsAIPanelOpen(prev => !prev);
  }, []); 

  return (
    <div className="flex h-screen bg-gray-800 font-sans">
      <Sidebar 
        pdfData={pdfData} 
        activePage={activePage}
        setActivePage={setActivePage} 
      />
      <main className="flex-1 flex flex-col overflow-hidden relative min-h-0">
        <Toolbar 
          setPdfData={setPdfData}
          setPdfDocument={setPdfDocument}
          handleZoomIn={handleZoomIn}
          handleZoomOut={handleZoomOut}
          handleFitToScreen={handleFitToScreen}
          onOpenSearch={() => setIsSearchOpen(true)}
          onOpenPageManager={handleOpenPageManager}
          zoomLevel={zoomLevel}
          stickyNoteMode={stickyNoteMode}
          onToggleStickyNoteMode={() => setStickyNoteMode(!stickyNoteMode)}
        />
        <div className="relative flex-1 flex min-h-0">
          <PDFViewer 
            pdfData={pdfData} 
            activePage={activePage} 
            zoomLevel={zoomLevel}
            searchQuery={searchQuery}
            stickyNoteMode={stickyNoteMode}
            onToggleStickyNoteMode={() => setStickyNoteMode(!stickyNoteMode)}
          />
          {isSearchOpen && (
            <PDFSearchOverlay
              pdfData={pdfData}
              onClose={() => setIsSearchOpen(false)}
              setActivePage={setActivePage}
              onSearch={(q) => setSearchQuery(q)}
              onClear={() => setSearchQuery('')}
            />
          )}
          
          <div className="absolute bottom-6 right-6 z-10">
            <AIButton
              isOpen={isAIPanelOpen}
              onClick={handleToggleAIPanel}
              disabled={!pdfDocument}
            />
          </div>
        </div>
      </main>
      
      <PageManager
        pdfDocument={pdfDocument}
        originalPdfData={pdfData}
        isOpen={pageManagement.isPageManagerOpen}
        onClose={handleClosePageManager}
        onPageOrderChange={handlePageOrderChange}
        onGoToPage={handleGoToPage}
        onApplyToViewer={(data, doc) => {
          setPdfData(data);
          setPdfDocument(doc);
          setActivePage(1);
        }}
      />
      
      <AISidePanel
        isOpen={isAIPanelOpen}
        onClose={() => setIsAIPanelOpen(false)}
        pdfDocument={pdfDocument}
        currentPage={activePage}
      />
    </div>
  );
}

export default App;