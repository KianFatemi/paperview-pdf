import React, { useEffect, useState, useCallback } from 'react';
import * as pdfjsLib from 'pdfjs-dist';

// Define the shape of props
interface ThumbnailViewProps {
  pdfData: Uint8Array | null;
  activePage: number;
  setActivePage: (page: number) => void;
}

// Define the structure for a thumbnail's state
interface Thumbnail {
  pageNumber: number;
  dataUrl: string;
}

/**
 * Renders a scrollable list of PDF page thumbnails.
 */
const ThumbnailView: React.FC<ThumbnailViewProps> = ({ pdfData, activePage, setActivePage }) => {
  const [thumbnails, setThumbnails] = useState<Thumbnail[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);

  const generateThumbnails = useCallback(async (pdfDataCopy: Uint8Array) => {
    try {
      setIsGenerating(true);
      const loadingTask = pdfjsLib.getDocument(pdfDataCopy);
      const pdf = await loadingTask.promise;
      const thumbs: Thumbnail[] = [];

      // Loop through all pages to generate their thumbnails
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        // Use a low scale for fast rendering
        const viewport = page.getViewport({ scale: 0.3 });
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        if (!context) continue;

        canvas.height = viewport.height;
        canvas.width = viewport.width;

        await page.render({ canvasContext: context, viewport: viewport, canvas: canvas }).promise;

        // Store the thumbnail as a data URL for easy display
        thumbs.push({ pageNumber: i, dataUrl: canvas.toDataURL() });
      }
      setThumbnails(thumbs);
    } catch (error) {
      console.error("Failed to generate thumbnails:", error);
      setThumbnails([]);
    } finally {
      setIsGenerating(false);
    }
  }, []);

  useEffect(() => {
    if (!pdfData) {
      setThumbnails([]); // Clear thumbnails if no PDF is loaded
      setIsGenerating(false);
      return;
    }

    // Create a copy of the data to avoid sharing issues
    const pdfDataCopy = new Uint8Array(pdfData);
    generateThumbnails(pdfDataCopy);
  }, [pdfData, generateThumbnails]); // Rerun only when a new PDF is loaded

  return (
    <div className="flex-1 overflow-auto p-2 space-y-2">
      {isGenerating && (
        <div className="text-center text-gray-400 py-4">
          <p>Generating thumbnails...</p>
        </div>
      )}
      {thumbnails.map(({ pageNumber, dataUrl }) => (
        <div
          key={pageNumber}
          onClick={() => setActivePage(pageNumber)}
          // Apply a border if the thumbnail corresponds to the active page
          className={`cursor-pointer p-1 rounded-md transition-all duration-150 ${
            activePage === pageNumber
              ? 'bg-blue-500 ring-2 ring-blue-300'
              : 'bg-gray-700 hover:bg-gray-600'
          }`}
        >
          <img src={dataUrl} alt={`Page ${pageNumber}`} className="w-full h-auto rounded-sm shadow-md" />
          <p className="text-center text-xs mt-1">{pageNumber}</p>
        </div>
      ))}
    </div>
  );
};

export default ThumbnailView;

