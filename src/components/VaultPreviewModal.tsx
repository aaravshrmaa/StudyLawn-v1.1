import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  X,
  Download,
  Copy,
  Check,
  Edit3,
  Save,
  Pencil,
  FileText,
  FileImage,
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut,
} from 'lucide-react';
import { VaultFileItem } from './TestsTab';

interface VaultPreviewModalProps {
  file: VaultFileItem;
  folderId: string | null;
  allFiles: VaultFileItem[];
  onClose: () => void;
  onNavigateFile: (file: VaultFileItem) => void;
  onRenameFile: (file: VaultFileItem) => void;
  onSaveTextFile: (fileId: string, newContent: string) => void;
  onDownloadFile: (file: VaultFileItem) => void;
  onShowToast: (msg: string) => void;
}

export const VaultPreviewModal: React.FC<VaultPreviewModalProps> = ({
  file,
  folderId: _folderId,
  allFiles,
  onClose,
  onNavigateFile,
  onRenameFile: _onRenameFile,
  onSaveTextFile,
  onDownloadFile,
  onShowToast,
}) => {
  // Image Zoom & Pan State (1x = fit, 2.2x = zoomed)
  const [isZoomed, setIsZoomed] = useState<boolean>(false);
  const [panPosition, setPanPosition] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  // Text Note State
  const [isEditingText, setIsEditingText] = useState<boolean>(false);
  const [textContent, setTextContent] = useState<string>(file.data || '');
  const [copiedNotification, setCopiedNotification] = useState<boolean>(false);
  const [isTextLarge, setIsTextLarge] = useState<boolean>(false);

  const imageRef = useRef<HTMLImageElement>(null);
  const totalFiles = allFiles.length;
  const currentIndex = allFiles.findIndex((f) => f.id === file.id);

  // Reset states on file change
  useEffect(() => {
    setIsZoomed(false);
    setPanPosition({ x: 0, y: 0 });
    setIsEditingText(false);
    setTextContent(file.data || '');
    setIsTextLarge(false);
  }, [file.id, file.data]);

  // Keyboard navigation & Esc to close
  const navigateRelative = useCallback(
    (direction: 'prev' | 'next') => {
      if (totalFiles <= 1) return;
      const nextIdx =
        direction === 'next'
          ? (currentIndex + 1) % totalFiles
          : (currentIndex - 1 + totalFiles) % totalFiles;
      onNavigateFile(allFiles[nextIdx]);
    },
    [allFiles, currentIndex, totalFiles, onNavigateFile]
  );

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'ArrowRight' && !isEditingText) {
        navigateRelative('next');
      } else if (e.key === 'ArrowLeft' && !isEditingText) {
        navigateRelative('prev');
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose, navigateRelative, isEditingText]);

  // Click-to-Zoom Image Toggle: upon one click it zooms, upon another it zooms out
  const handleImageClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    // If we just finished a drag movement, don't trigger zoom toggle
    if (Math.abs(panPosition.x) > 15 || Math.abs(panPosition.y) > 15) return;

    if (isZoomed) {
      // Zoom out back to normal 1x
      setIsZoomed(false);
      setPanPosition({ x: 0, y: 0 });
    } else {
      // Zoom in to 2.2x centered
      setIsZoomed(true);
      setPanPosition({ x: 0, y: 0 });
    }
  };

  // Pan dragging when zoomed in
  const handleMouseDown = (e: React.MouseEvent) => {
    if (!isZoomed) return;
    setIsDragging(true);
    setDragStart({ x: e.clientX - panPosition.x, y: e.clientY - panPosition.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !isZoomed) return;
    setPanPosition({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y,
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Touch drag support for mobile
  const handleTouchStart = (e: React.TouchEvent) => {
    if (!isZoomed || e.touches.length !== 1) return;
    setIsDragging(true);
    setDragStart({
      x: e.touches[0].clientX - panPosition.x,
      y: e.touches[0].clientY - panPosition.y,
    });
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging || !isZoomed || e.touches.length !== 1) return;
    setPanPosition({
      x: e.touches[0].clientX - dragStart.x,
      y: e.touches[0].clientY - dragStart.y,
    });
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
  };

  // Copy text content
  const handleCopyText = async () => {
    try {
      await navigator.clipboard.writeText(isEditingText ? textContent : file.data || '');
      setCopiedNotification(true);
      onShowToast('Note copied to clipboard');
      setTimeout(() => setCopiedNotification(false), 2000);
    } catch {
      onShowToast('Failed to copy note');
    }
  };

  // Save edited text note
  const handleSaveText = () => {
    onSaveTextFile(file.id, textContent);
    setIsEditingText(false);
    onShowToast('Note saved successfully');
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/95 backdrop-blur-md flex flex-col justify-between select-none animate-fadeIn"
      onClick={onClose}
    >
      {/* ─── Top Header Bar on Black Background ─── */}
      <header
        className="w-full px-4 sm:px-6 py-3 flex items-center justify-between z-30 bg-black/60 border-b border-white/10 shrink-0"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Left: File Info */}
        <div className="flex items-center gap-2.5 min-w-0 flex-1">
          <div className="p-1.5 bg-white/10 text-white rounded-lg shrink-0">
            {file.type === 'image' ? (
              <FileImage className="w-4 h-4" />
            ) : (
              <FileText className="w-4 h-4" />
            )}
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="font-sans font-medium text-sm text-white truncate">
              {file.name}
            </h3>
            <div className="flex items-center gap-2 font-mono text-[11px] text-neutral-400">
              <span className="uppercase text-neutral-300 font-bold">
                {file.extension || (file.type === 'image' ? 'Image' : 'Note')}
              </span>
              {totalFiles > 1 && (
                <>
                  <span>&bull;</span>
                  <span>
                    {currentIndex + 1} of {totalFiles}
                  </span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Right: Actions & Close X Button */}
        <div className="flex items-center gap-2 shrink-0">
          {file.type === 'text' && (
            <>
              <button
                type="button"
                onClick={handleCopyText}
                className="p-2 text-neutral-300 hover:text-white hover:bg-white/10 rounded-lg cursor-pointer transition-colors"
                title="Copy Text"
              >
                {copiedNotification ? (
                  <Check className="w-4 h-4 text-emerald-400" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
              </button>

              {isEditingText ? (
                <button
                  type="button"
                  onClick={handleSaveText}
                  className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold rounded-lg cursor-pointer flex items-center gap-1.5 transition-colors"
                  title="Save Note"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>Save</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setIsEditingText(true)}
                  className="p-2 text-neutral-300 hover:text-white hover:bg-white/10 rounded-lg cursor-pointer transition-colors"
                  title="Edit Note"
                >
                  <Edit3 className="w-4 h-4" />
                </button>
              )}
            </>
          )}

          <button
            type="button"
            onClick={() => onDownloadFile(file)}
            className="p-2 text-neutral-300 hover:text-white hover:bg-white/10 rounded-lg cursor-pointer transition-colors"
            title="Download File"
          >
            <Download className="w-4 h-4" />
          </button>

          {/* Prominent Close X Option on Black Background */}
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-white/90 hover:text-white hover:bg-white/20 active:scale-95 rounded-full cursor-pointer transition-all ml-1 bg-white/10 border border-white/20 shadow-md"
            title="Close (Esc)"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* ─── Main Viewport Area ─── */}
      <main
        className="flex-1 w-full min-h-0 relative flex items-center justify-center p-3 sm:p-6 overflow-hidden"
        onClick={onClose}
      >
        {/* Navigation Next/Prev Arrows */}
        {totalFiles > 1 && (
          <>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                navigateRelative('prev');
              }}
              className="absolute left-3 sm:left-6 top-1/2 -translate-y-1/2 z-30 p-3 bg-black/70 hover:bg-white/20 text-white border border-white/20 hover:border-white/40 transition-all cursor-pointer rounded-full shadow-2xl backdrop-blur-xs"
              title="Previous file (Left arrow)"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>

            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                navigateRelative('next');
              }}
              className="absolute right-3 sm:right-6 top-1/2 -translate-y-1/2 z-30 p-3 bg-black/70 hover:bg-white/20 text-white border border-white/20 hover:border-white/40 transition-all cursor-pointer rounded-full shadow-2xl backdrop-blur-xs"
              title="Next file (Right arrow)"
            >
              <ChevronRight className="w-6 h-6" />
            </button>
          </>
        )}

        {/* ─── Normal Image Popup Mode: Click to Zoom In / Zoom Out ─── */}
        {file.type === 'image' ? (
          <div
            className={`w-full h-full flex items-center justify-center relative overflow-hidden ${
              isZoomed ? (isDragging ? 'cursor-grabbing' : 'cursor-zoom-out') : 'cursor-zoom-in'
            }`}
            onClick={handleImageClick}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          >
            <div
              className={`transition-transform ease-out ${
                isDragging ? 'duration-0' : 'duration-200'
              } flex items-center justify-center max-w-full max-h-full`}
              style={{
                transform: `translate3d(${panPosition.x}px, ${panPosition.y}px, 0) scale(${
                  isZoomed ? 2.2 : 1
                })`,
                transformOrigin: 'center center',
              }}
            >
              <img
                ref={imageRef}
                src={file.data}
                alt={file.name}
                draggable={false}
                className="max-w-[92vw] max-h-[calc(100vh-140px)] sm:max-h-[calc(100vh-160px)] object-contain shadow-2xl rounded-lg select-none"
              />
            </div>
          </div>
        ) : (
          /* ─── Normal Text Popup Mode ─── */
          <div
            className="w-full max-w-3xl max-h-[calc(100vh-140px)] sm:max-h-[calc(100vh-160px)] bg-[#14161d] border border-white/20 rounded-2xl shadow-2xl flex flex-col overflow-hidden text-neutral-100 z-20"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header of Note Popup */}
            <div className="bg-[#1c1f28] px-4 py-3 border-b border-white/10 flex items-center justify-between text-xs font-mono shrink-0">
              <div className="flex items-center gap-2">
                <span
                  className={`w-2 h-2 rounded-full ${
                    isEditingText ? 'bg-amber-400 animate-pulse' : 'bg-emerald-400'
                  }`}
                />
                <span className="font-semibold text-white">
                  {isEditingText ? 'Editing Note' : 'Note Reader'}
                </span>
              </div>

              {/* Text zoom toggle */}
              <button
                type="button"
                onClick={() => setIsTextLarge((prev) => !prev)}
                className="px-2.5 py-1 bg-white/10 hover:bg-white/20 text-white rounded-md cursor-pointer transition-colors flex items-center gap-1.5"
                title={isTextLarge ? 'Normal Text Size' : 'Large Text Size'}
              >
                {isTextLarge ? <ZoomOut className="w-3.5 h-3.5" /> : <ZoomIn className="w-3.5 h-3.5" />}
                <span>{isTextLarge ? 'Standard Size' : 'Zoom Text'}</span>
              </button>
            </div>

            {/* Note Content */}
            <div className="flex-1 overflow-auto p-4 sm:p-6 font-mono bg-[#0f1117] text-neutral-200">
              {isEditingText ? (
                <textarea
                  value={textContent}
                  onChange={(e) => setTextContent(e.target.value)}
                  style={{
                    fontSize: isTextLarge ? '18px' : '14px',
                    lineHeight: '1.7',
                  }}
                  className="w-full h-full min-h-[300px] bg-transparent text-neutral-100 font-mono outline-none resize-none p-0 whitespace-pre-wrap break-words"
                  placeholder="Type your notes..."
                  autoFocus
                />
              ) : (
                <pre
                  style={{
                    fontSize: isTextLarge ? '18px' : '14px',
                    lineHeight: '1.7',
                  }}
                  className="w-full font-mono whitespace-pre-wrap break-words select-text text-neutral-100"
                >
                  {file.data || '(Empty note file)'}
                </pre>
              )}
            </div>
          </div>
        )}
      </main>

      {/* ─── Bottom Status Hint ─── */}
      <footer
        className="w-full px-4 py-2.5 bg-black/60 border-t border-white/10 text-center font-mono text-xs text-neutral-400 shrink-0 z-20"
        onClick={(e) => e.stopPropagation()}
      >
        {file.type === 'image' ? (
          <span>
            {isZoomed ? 'Click image to Zoom Out' : 'Click image to Zoom In'} &bull; Click black background or &times; to close
          </span>
        ) : (
          <span>Click black background or &times; to close &bull; Esc</span>
        )}
      </footer>
    </div>
  );
};
