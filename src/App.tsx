import React, { useState } from 'react';
import Toolbar from './components/Toolbar';
import Sidebar from './components/Sidebar';
import PDFViewer from './components/PDFViewer';

function App() {

  const [pdfData, setPdfData] = useState<Uint8Array | null>(null);

  return (

    <div className="flex h-screen bg-gray-800 font-sans">
      
      <Sidebar />

      <main className="flex-1 flex flex-col overflow-hidden">
        

        <Toolbar setPdfData={setPdfData} />
        
        <PDFViewer pdfData={pdfData} />

      </main>
    </div>
  );
}

export default App;
