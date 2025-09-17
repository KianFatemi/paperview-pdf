import React, { useEffect, useMemo, useState } from 'react';
import * as pdfjsLib from 'pdfjs-dist';
import pdfWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?url';

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker;

interface PDFSearchOverlayProps {
	pdfData: Uint8Array | null;
	onClose: () => void;
	setActivePage: (page: number) => void;
	onSearch?: (query: string) => void;
	onClear?: () => void;
}

interface SearchMatch {
	pageNumber: number;
	text: string;
	matchIndex: number;
	context: string;
}

const PDFSearchOverlay: React.FC<PDFSearchOverlayProps> = ({ pdfData, onClose, setActivePage, onSearch, onClear }) => {
	const [query, setQuery] = useState('');
	const [isSearching, setIsSearching] = useState(false);
	const [matches, setMatches] = useState<SearchMatch[]>([]);
	const [currentIndex, setCurrentIndex] = useState(0);
	const isDisabled = useMemo(() => !pdfData || query.trim().length === 0, [pdfData, query]);

	// Handle keyboard shortcuts
	useEffect(() => {
		const handleKeyDown = (event: KeyboardEvent) => {
			if (event.key === 'Escape') {
				onClose();
			}
		};

		document.addEventListener('keydown', handleKeyDown);
		return () => {
			document.removeEventListener('keydown', handleKeyDown);
		};
	}, [onClose]);

	useEffect(() => {
		setCurrentIndex(0);
	}, [matches.length]);

	const performSearch = async () => {
		if (!pdfData) return;
		const q = query.trim();
		if (!q) {
			setMatches([]);
			onClear?.();
			return;
		}
		setIsSearching(true);
		try {
			const doc = await pdfjsLib.getDocument(new Uint8Array(pdfData)).promise;
			const newMatches: SearchMatch[] = [];
			for (let pageNum = 1; pageNum <= doc.numPages; pageNum++) {
				const page = await doc.getPage(pageNum);
				const tc = await page.getTextContent();
				const pageText = tc.items.map((it: any) => it.str).join(' ');
				const lowerText = pageText.toLowerCase();
				const lowerQ = q.toLowerCase();
				let start = 0;
				while (true) {
					const idx = lowerText.indexOf(lowerQ, start);
					if (idx === -1) break;
					const contextStart = Math.max(0, idx - 40);
					const contextEnd = Math.min(pageText.length, idx + lowerQ.length + 40);
					const context = pageText.substring(contextStart, contextEnd);
					newMatches.push({ pageNumber: pageNum, text: pageText, matchIndex: idx, context });
					start = idx + lowerQ.length;
				}
			}
			setMatches(newMatches);
			onSearch?.(q);
		} catch (err) {
			console.error('Search failed', err);
			setMatches([]);
			onClear?.();
		} finally {
			setIsSearching(false);
		}
	};

	const gotoMatch = (index: number) => {
		if (matches.length === 0) return;
		const clamped = Math.max(0, Math.min(index, matches.length - 1));
		setCurrentIndex(clamped);
		const match = matches[clamped];
		setActivePage(match.pageNumber);
	};

	const nextMatch = () => {
		if (matches.length === 0) return;
		gotoMatch((currentIndex + 1) % matches.length);
	};

	const prevMatch = () => {
		if (matches.length === 0) return;
		gotoMatch((currentIndex - 1 + matches.length) % matches.length);
	};

	return (
		<div className="absolute top-2 right-2 z-50 bg-gray-700 text-white rounded-md shadow-lg w-[420px] max-w-[95vw]">
		<div className="p-3 border-b border-gray-600 flex items-center gap-1">
			<input
				type="text"
				value={query}
				onChange={(e) => setQuery(e.target.value)}
				placeholder="Find in document"
				className="flex-1 px-2 py-1 rounded bg-gray-800 border border-gray-600 focus:outline-none text-sm"
			/>
			<button
				onClick={performSearch}
				disabled={isDisabled || isSearching}
				className="px-2 py-1 bg-blue-600 disabled:bg-gray-600 rounded text-xs whitespace-nowrap"
			>
				{isSearching ? 'Searching…' : 'Search'}
			</button>
			<button
				onClick={() => { setMatches([]); setQuery(''); onClear?.(); }}
				disabled={isSearching}
				className="px-2 py-1 bg-gray-600 rounded text-xs"
			>
				Clear
			</button>
			<button 
				onClick={onClose} 
				className="ml-1 rounded text-white font-bold border-0 transition-colors flex-shrink-0"
				title="Close search"
				style={{ 
					backgroundColor: '#dc2626', 
					border: 'none',
					fontSize: '14px',
					width: '28px',
					height: '28px',
					display: 'flex',
					alignItems: 'center',
					justifyContent: 'center'
				}}
				onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#b91c1c'}
				onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#dc2626'}
			>
				✕
			</button>
		</div>
			<div className="p-3 flex items-center gap-2 text-sm border-b border-gray-600">
				<span>{matches.length} match{matches.length === 1 ? '' : 'es'}</span>
				<div className="ml-auto flex items-center gap-2">
					<button onClick={prevMatch} disabled={matches.length === 0} className="px-2 py-1 bg-gray-600 rounded">Prev</button>
					<span>
						{matches.length > 0 ? currentIndex + 1 : 0}/{matches.length}
					</span>
					<button onClick={nextMatch} disabled={matches.length === 0} className="px-2 py-1 bg-gray-600 rounded">Next</button>
				</div>
			</div>
			<div className="max-h-64 overflow-auto p-3 space-y-2 text-sm">
				{matches.length === 0 && !isSearching && (
					<div className="text-gray-400">No results</div>
				)}
				{matches.map((m, i) => (
					<button
						key={`${m.pageNumber}-${i}`}
						onClick={() => gotoMatch(i)}
						className={`w-full text-left p-2 rounded ${i === currentIndex ? 'bg-blue-600' : 'bg-gray-800 hover:bg-gray-700'}`}
					>
						<div className="text-xs text-gray-300">Page {m.pageNumber}</div>
						<div className="truncate">
							{m.context}
						</div>
					</button>
				))}
			</div>
		</div>
	);
};

export default PDFSearchOverlay;
