import React from 'react';
import ThumbnailView from './ThumbnailView';

interface SidebarProps {
  pdfData: Uint8Array | null;
  activePage: number;
  setActivePage: (page: number) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ pdfData, activePage, setActivePage }) => {
  return (
    <aside className="w-64 bg-gray-800 shadow-md flex flex-col">
      <div className="p-4 border-b border-gray-700">
        <h2 className="text-lg font-semibold">Thumbnails</h2>
      </div>
      <ThumbnailView
        pdfData={pdfData}
        activePage={activePage}
        setActivePage={setActivePage}
      />
    </aside>
  );
};

export default Sidebar;
