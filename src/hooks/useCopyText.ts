import { useEffect, useState } from 'react';

export const useCopyText = (containerRef: React.RefObject<HTMLDivElement | null>) => {
  const [menuPosition, setMenuPosition] = useState<{ x: number; y: number } | null>(null);
  const [selectedText, setSelectedText] = useState<string>('');

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleContextMenu = (e: MouseEvent) => {
      const selection = window.getSelection();
      if (selection && selection.toString().trim()) {
        e.preventDefault();
        
        const text = selection.toString().trim();
        setSelectedText(text);
        
        let x = e.clientX;
        let y = e.clientY;
        
        const menuWidth = 120; // Approximate menu width
        const menuHeight = 40; // Approximate menu height
        const padding = 10;
        
        if (x + menuWidth + padding > window.innerWidth) {
          x = window.innerWidth - menuWidth - padding;
        }
        
        if (y + menuHeight + padding > window.innerHeight) {
          y = e.clientY - menuHeight - padding;
        }
        
        x = Math.max(padding, x);
        y = Math.max(padding, y);
        
        setMenuPosition({ x, y });
      }
    };

    container.addEventListener('contextmenu', handleContextMenu);
    return () => container.removeEventListener('contextmenu', handleContextMenu);
  }, [containerRef]);

  useEffect(() => {
    const handleKeyDown = async (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'c') {
        const text = window.getSelection()?.toString() || '';
        if (text) {
          e.preventDefault();
          await navigator.clipboard.writeText(text);
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    if (!menuPosition) return;

    const handleClick = () => {
      setMenuPosition(null);
      setSelectedText('');
    };
    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, [menuPosition]);

  const handleCopy = async () => {
    if (selectedText) {
      try {
        await navigator.clipboard.writeText(selectedText);
        console.log('Text copied successfully:', selectedText);
      } catch (error) {
        console.error('Failed to copy text:', error);
        try {
          const textArea = document.createElement('textarea');
          textArea.value = selectedText;
          document.body.appendChild(textArea);
          textArea.select();
          document.execCommand('copy');
          document.body.removeChild(textArea);
          console.log('Text copied using fallback method');
        } catch (fallbackError) {
          console.error('Fallback copy method also failed:', fallbackError);
        }
      }
    }
    setMenuPosition(null);
    setSelectedText('');
  };

  return { menuPosition, setMenuPosition, handleCopy };
};
