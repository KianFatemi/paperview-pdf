import { useState } from 'react';
import Toolbar from './components/Toolbar';
import Sidebar from './components/Sidebar';
import PDFViewer from './components/PDFViewer';
import PDFSearchOverlay from './components/PDFSearchOverlay';

function App() {

  const [pdfData, setPdfData] = useState<Uint8Array | null>(null);
  const [activePage, setActivePage] = useState<number>(1);
  const [zoomLevel, setZoomLevel] = useState<number>(1.0);
  const [isSearchOpen, setIsSearchOpen] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');

  const handleZoomIn = () => setZoomLevel((prevZoom) => prevZoom + 0.1);
  const handleZoomOut = () => setZoomLevel((prevZoom) => Math.max(0.1, prevZoom - 0.1));
  const handleFitToScreen = () => setZoomLevel(1.0); 

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
          handleZoomIn={handleZoomIn}
          handleZoomOut={handleZoomOut}
          handleFitToScreen={handleFitToScreen}
          onOpenSearch={() => setIsSearchOpen(true)}
        />
        <div className="relative flex-1 flex min-h-0">
          <PDFViewer 
            pdfData={pdfData} 
            activePage={activePage} 
            zoomLevel={zoomLevel}
            searchQuery={searchQuery}
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
        </div>
      </main>
    </div>
  );
}

export default App;