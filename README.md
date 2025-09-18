# PaperView 📄

A cross platform PDF viewer built with Electron, React, and TypeScript. PaperView provides a clean interface for viewing and searching through PDF documents.

## Features

- **PDF Viewing**: High quality PDF rendering with smooth scrolling
- **Full-Text Search**: Search through PDF content with highlighted results and context preview
- **Thumbnail Navigation**: Quick page navigation with thumbnail sidebar
- **Zoom Controls**: Zoom in and zoom out with fit to screen
- **Modern UI**: Clean, dark-themed interface built with Tailwind CSS
- **Cross-Platform**: Works on Windows, macOS, and Linux

## Tech Stack

- **Frontend**: React 19 + TypeScript
- **Desktop**: Electron 38
- **PDF Engine**: PDF.js 5.4
- **Styling**: Tailwind CSS 4.1
- **Build Tool**: Vite 7

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-username/paperview.git
   cd paperview
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start development server**
   ```bash
   npm run dev
   ```

4. **Build for production**
   ```bash
   npm run build
   ```

5. **Build Electron app**
   ```bash
   npm run electron:build
   ```

## Project Structure

```
paperview/
├── electron/              # Electron main process files
│   ├── main.ts            # Main Electron process
│   └── preload.ts         # Preload script
├── src/
│   ├── components/        # React components
│   │   ├── PDFViewer.tsx      # Main PDF display component
│   │   ├── PDFSearchOverlay.tsx # Search functionality
│   │   ├── Sidebar.tsx        # Thumbnail navigation
│   │   ├── Toolbar.tsx        # Top toolbar with controls
│   │   └── ThumbnailView.tsx  # Page thumbnails
│   ├── App.tsx            # Main application component
│   ├── main.tsx           # React entry point
│   └── types.ts           # TypeScript type definitions
├── dist-electron/         # Built Electron files
└── public/               # Static assets
```

## 🎮 Usage

### Opening PDFs
- Click the "Open PDF" button in the toolbar
- Or drag and drop a PDF file into the application

### Navigation
- **Sidebar Thumbnails**: Click any thumbnail to jump to that page
- **Zoom Controls**: Use +/- buttons or fit-to-screen in the toolbar
- **Keyboard Shortcuts**: 
  - `Ctrl/Cmd + F`: Open search overlay
  - `Escape`: Close search overlay

### Search Features
- **Full Text Search**: Enter text in the search box to find all occurrences
- **Navigation**: Use Previous/Next buttons to jump between search results
- **Context Preview**: See surrounding text for each match
- **Page Jump**: Click any search result to navigate directly to that page


## Roadmap

- [ ] Annotation support
- [ ] Bookmarks functionality  
- [ ] Print support
- [ ] Recent files list
- [ ] PDF edits
