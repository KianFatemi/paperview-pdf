import React, { useState } from 'react';
import Toolbar from './components/Toolbar';
import Sidebar from './components/Sidebar';
import PDFViewer from './components/PDFViewer';

function App() {

  const [pdfData, setPdfData] = useState<Uint8Array | null>(null);
  const [activePage, setActivePage] = useState<number>(1);

  return (

    <div className="flex h-screen bg-gray-800 font-sans">
      
      <Sidebar 
        pdfData={pdfData} 
        activePage={activePage}
        setActivePage={setActivePage} 
      />
      <main className="flex-1 flex flex-col overflow-hidden">

        <Toolbar setPdfData={setPdfData} />
        
        <PDFViewer 
          pdfData={pdfData} 
          activePage={activePage} 
        />

      </main>
    </div>
  );
}

export default App;
