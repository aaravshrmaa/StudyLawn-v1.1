import React, { useState, useEffect, useRef } from 'react';
import {
  Folder,
  FolderPlus,
  FileText,
  FileImage,
  FileCode,
  File,
  Trash2,
  ChevronRight,
  ChevronLeft,
  ArrowLeft,
  ArrowUp,
  X,
  Upload,
  Plus,
  Search,
  Grid,
  List as ListIcon,
  Copy,
  Check,
  Download,
  Edit3,
  Eye,
  Save,
  HardDrive,
  Calendar,
  Clock,
  Sparkles,
  CheckCircle2,
  Maximize2,
  ArrowUpDown,
  Pencil,
} from 'lucide-react';
import { localStore } from '../lib/storage';
import { VaultPreviewModal } from './VaultPreviewModal';

export interface VaultFileItem {
  id: string;
  name: string;
  userNamed?: boolean;
  type: 'image' | 'text' | 'document';
  extension?: string;
  data: string; // base64 for images, plain text string for text files
  sizeBytes?: number;
  createdAt: string;
  updatedAt?: string;
}

export interface TestRecord {
  id: string;
  name: string;
  date: string;
  parentId?: string | null;
  images?: string[]; // Legacy compatibility
  files?: VaultFileItem[]; // Unified files
  notes?: string;
  serialNumber?: number;
}

export const TestsTab: React.FC = () => {
  const [tests, setTests] = useState<TestRecord[]>(() => {
    return localStore.getSync<TestRecord[]>('test_records', []);
  });
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortOrder, setSortOrder] = useState<'latest' | 'oldest' | 'name'>('latest');
  const [viewMode, setViewMode] = useState<'grid' | 'details'>('grid');

  // Modals & Active Viewers
  const [newFolderName, setNewFolderName] = useState('');
  const [showNewFolderModal, setShowNewFolderModal] = useState(false);

  // New Text File state
  const [showNewTextModal, setShowNewTextModal] = useState(false);
  const [newTextFileName, setNewTextFileName] = useState('');
  const [newTextContent, setNewTextContent] = useState('');

  // Naming & Renaming state for files
  const [namingFile, setNamingFile] = useState<{ folderId: string; fileId: string; currentName: string } | null>(null);
  const [customFileNameInput, setCustomFileNameInput] = useState('');

  // Renaming state for folders
  const [folderToRename, setFolderToRename] = useState<{ id: string; name: string } | null>(null);
  const [renameFolderInput, setRenameFolderInput] = useState('');

  // Active File Viewer (Preview)
  const [activePreviewFile, setActivePreviewFile] = useState<VaultFileItem | null>(null);
  const [activePreviewFolderId, setActivePreviewFolderId] = useState<string | null>(null);
  const [isEditingTextFile, setIsEditingTextFile] = useState(false);
  const [editTextContent, setEditTextContent] = useState('');
  const [saveSuccessToast, setSaveSuccessToast] = useState<string | null>(null);
  const [copiedNotification, setCopiedNotification] = useState(false);

  // Deletion confirm
  const [itemToDelete, setItemToDelete] = useState<{ id: string; type: 'folder' | 'file'; fileId?: string; name: string } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    localStore.get<TestRecord[]>('test_records', []).then((saved) => {
      if (saved && saved.length > 0) setTests(saved);
    });
  }, []);

  const saveTests = (newTests: TestRecord[]) => {
    setTests(newTests);
    localStore.set('test_records', newTests);
  };

  const showToast = (msg: string) => {
    setSaveSuccessToast(msg);
    setTimeout(() => {
      setSaveSuccessToast(null);
    }, 2500);
  };

  // Helper: Get files for a folder with legacy migration
  const getFolderFiles = (record: TestRecord): VaultFileItem[] => {
    if (record.files && record.files.length > 0) {
      return record.files;
    }
    if (record.images && record.images.length > 0) {
      return record.images.map((img, idx) => ({
        id: `legacy-img-${record.id}-${idx}`,
        name: `Scan_${String(idx + 1).padStart(2, '0')}.png`,
        userNamed: false,
        type: 'image',
        extension: 'png',
        data: img,
        sizeBytes: Math.round(img.length * 0.75),
        createdAt: record.date || new Date().toLocaleDateString(),
      }));
    }
    return [];
  };

  const currentFolder = tests.find((t) => t.id === currentFolderId);
  const currentFiles = currentFolder ? getFolderFiles(currentFolder) : [];

  // Folder Breadcrumbs
  const getBreadcrumbs = () => {
    const crumbs: { id: string | null; name: string }[] = [{ id: null, name: 'Vault Root' }];
    const path: { id: string; name: string }[] = [];
    let curr = currentFolder;
    while (curr) {
      path.unshift({ id: curr.id, name: curr.name });
      curr = tests.find((t) => t.id === curr?.parentId);
    }
    return [...crumbs, ...path];
  };

  // Navigation
  const navigateToFolder = (folderId: string | null) => {
    setCurrentFolderId(folderId);
    setSearchQuery('');
  };

  const navigateUp = () => {
    if (!currentFolderId) return;
    if (currentFolder && currentFolder.parentId) {
      navigateToFolder(currentFolder.parentId);
    } else {
      navigateToFolder(null);
    }
  };

  // Ensure user has a selected folder context, or transparently create "General Notes"
  const ensureFolderAndGetId = (customList?: TestRecord[]): { folderId: string; list: TestRecord[] } => {
    const listToUse = customList || tests;
    if (currentFolderId) {
      return { folderId: currentFolderId, list: listToUse };
    }
    // Check if default folder already exists
    let defaultFolder = listToUse.find((t) => !t.parentId && t.name.toLowerCase() === 'general notes');
    let updatedList = [...listToUse];
    if (!defaultFolder) {
      defaultFolder = {
        id: `folder-default-${Date.now()}`,
        name: 'General Notes',
        date: new Date().toLocaleDateString(),
        parentId: null,
        images: [],
        files: [],
      };
      updatedList = [defaultFolder, ...updatedList];
    }
    setCurrentFolderId(defaultFolder.id);
    return { folderId: defaultFolder.id, list: updatedList };
  };

  // Folder Creation
  const handleCreateFolder = (e: React.FormEvent) => {
    e.preventDefault();
    const siblingCount = tests.filter((t) => t.parentId === currentFolderId).length;
    const nextSerial = siblingCount + 1;
    const nameToUse = newFolderName.trim() || (currentFolderId ? `Subfolder #${nextSerial}` : `Folder #${nextSerial}`);

    const newFolder: TestRecord = {
      id: Date.now().toString(),
      name: nameToUse,
      date: new Date().toLocaleDateString(),
      parentId: currentFolderId,
      images: [],
      files: [],
      serialNumber: nextSerial,
    };
    saveTests([newFolder, ...tests]);
    setNewFolderName('');
    setShowNewFolderModal(false);
    showToast(`Created folder "${nameToUse}"`);
  };

  const getNextUntitledIndex = (existingFiles: VaultFileItem[]): number => {
    let highest = 0;
    existingFiles.forEach((f) => {
      const match = f.name.match(/^[Uu]ntitled\s*(\d+)/i);
      if (match) {
        const n = parseInt(match[1], 10);
        if (n > highest) highest = n;
      }
    });
    return highest + 1;
  };

  // Create New Text File / Note
  const handleCreateTextFile = (e: React.FormEvent) => {
    e.preventDefault();
    const { folderId, list } = ensureFolderAndGetId();
    const activeFolder = list.find((t) => t.id === folderId);
    const existingFiles = activeFolder ? getFolderFiles(activeFolder) : [];

    const userGaveName = Boolean(newTextFileName.trim());
    let fileName = newTextFileName.trim();
    if (!fileName) {
      const nextNum = getNextUntitledIndex(existingFiles);
      fileName = `Untitled ${nextNum}.txt`;
    } else if (!fileName.includes('.')) {
      fileName += '.txt';
    }

    const ext = fileName.split('.').pop()?.toLowerCase() || 'txt';
    const newFile: VaultFileItem = {
      id: `file-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      name: fileName,
      userNamed: userGaveName,
      type: 'text',
      extension: ext,
      data: newTextContent,
      sizeBytes: new Blob([newTextContent]).size,
      createdAt: new Date().toLocaleDateString(),
      updatedAt: new Date().toLocaleDateString(),
    };

    const updated = list.map((t) => {
      if (t.id === folderId) {
        const existing = getFolderFiles(t);
        return {
          ...t,
          files: [newFile, ...existing],
        };
      }
      return t;
    });

    saveTests(updated);
    setNewTextFileName('');
    setNewTextContent('');
    setShowNewTextModal(false);
    showToast(`Created file "${fileName}"`);
  };

  // Upload Files (Photos and Text files)
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const { folderId, list } = ensureFolderAndGetId();
    const activeFolder = list.find((t) => t.id === folderId);
    const existingFiles = activeFolder ? getFolderFiles(activeFolder) : [];
    let currentUntitledIndex = getNextUntitledIndex(existingFiles);

    Array.from(files).forEach((file: File) => {
      const isImg = file.type.startsWith('image/');
      const ext = file.name.split('.').pop()?.toLowerCase() || (isImg ? 'png' : 'txt');
      const assignedName = ext ? `Untitled ${currentUntitledIndex}.${ext}` : `Untitled ${currentUntitledIndex}`;
      currentUntitledIndex++;
      const reader = new FileReader();

      if (isImg) {
        reader.onload = (uploadEvent) => {
          const base64 = uploadEvent.target?.result as string;
          if (base64) {
            const newFile: VaultFileItem = {
              id: `file-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
              name: assignedName,
              userNamed: false,
              type: 'image',
              extension: ext,
              data: base64,
              sizeBytes: file.size,
              createdAt: new Date().toLocaleDateString(),
            };
            setTests((prev) => {
              const activeFolderId = folderId;
              // Make sure to preserve any newly created default folder in tests
              let currentTests = prev;
              if (!currentTests.some(t => t.id === activeFolderId)) {
                const defaultFolderObj = list.find(t => t.id === activeFolderId);
                if (defaultFolderObj) currentTests = [defaultFolderObj, ...prev];
              }
              const updated = currentTests.map((t) => {
                if (t.id === activeFolderId) {
                  const currFiles = getFolderFiles(t);
                  return { ...t, files: [newFile, ...currFiles] };
                }
                return t;
              });
              localStore.set('test_records', updated);
              return updated;
            });
            showToast(`Uploaded ${assignedName}`);
          }
        };
        reader.readAsDataURL(file);
      } else {
        // Read as Text
        reader.onload = (uploadEvent) => {
          const textContent = uploadEvent.target?.result as string;
          const newFile: VaultFileItem = {
            id: `file-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
            name: assignedName,
            userNamed: false,
            type: 'text',
            extension: ext,
            data: textContent || '',
            sizeBytes: file.size,
            createdAt: new Date().toLocaleDateString(),
          };
          setTests((prev) => {
            const activeFolderId = folderId;
            let currentTests = prev;
            if (!currentTests.some(t => t.id === activeFolderId)) {
              const defaultFolderObj = list.find(t => t.id === activeFolderId);
              if (defaultFolderObj) currentTests = [defaultFolderObj, ...prev];
            }
            const updated = currentTests.map((t) => {
              if (t.id === activeFolderId) {
                const currFiles = getFolderFiles(t);
                return { ...t, files: [newFile, ...currFiles] };
              }
              return t;
            });
            localStore.set('test_records', updated);
            return updated;
          });
          showToast(`Uploaded ${assignedName}`);
        };
        reader.readAsText(file);
      }
    });

    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Folder Renaming Handlers
  const handleOpenRenameFolderModal = (folder: TestRecord, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setFolderToRename({ id: folder.id, name: folder.name });
    setRenameFolderInput(folder.name);
  };

  const handleSaveFolderName = (e: React.FormEvent) => {
    e.preventDefault();
    if (!folderToRename) return;
    const trimmed = renameFolderInput.trim();
    if (!trimmed) return;
    const updated = tests.map((t) => (t.id === folderToRename.id ? { ...t, name: trimmed } : t));
    saveTests(updated);
    showToast(`Renamed folder to "${trimmed}"`);
    setFolderToRename(null);
    setRenameFolderInput('');
  };

  // Delete Handlers
  const confirmDeleteFolder = (id: string, name: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setItemToDelete({ id, type: 'folder', name });
  };

  const confirmDeleteFile = (folderId: string, fileId: string, name: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setItemToDelete({ id: folderId, type: 'file', fileId, name });
  };

  const executeDelete = () => {
    if (!itemToDelete) return;

    if (itemToDelete.type === 'folder') {
      const getDescendantIds = (parentId: string, allTests: TestRecord[]): string[] => {
        const children = allTests.filter((t) => t.parentId === parentId);
        let ids = children.map((c) => c.id);
        children.forEach((c) => {
          ids = [...ids, ...getDescendantIds(c.id, allTests)];
        });
        return ids;
      };

      const toDeleteIds = [itemToDelete.id, ...getDescendantIds(itemToDelete.id, tests)];
      const updated = tests.filter((t) => !toDeleteIds.includes(t.id));
      saveTests(updated);

      if (currentFolderId && toDeleteIds.includes(currentFolderId)) {
        setCurrentFolderId(null);
      }
      showToast(`Deleted folder "${itemToDelete.name}"`);
    } else if (itemToDelete.type === 'file' && itemToDelete.fileId) {
      const updated = tests.map((t) => {
        if (t.id === itemToDelete.id) {
          const remainingFiles = getFolderFiles(t).filter((f) => f.id !== itemToDelete.fileId);
          return {
            ...t,
            files: remainingFiles,
            images: [], // keep in sync
          };
        }
        return t;
      });
      saveTests(updated);
      if (activePreviewFile?.id === itemToDelete.fileId) {
        setActivePreviewFile(null);
      }
      showToast(`Deleted file "${itemToDelete.name}"`);
    }

    setItemToDelete(null);
  };

  // Naming & Renaming Handlers
  const handleOpenNameModal = (folderId: string, file: VaultFileItem, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setNamingFile({
      folderId,
      fileId: file.id,
      currentName: file.userNamed ? file.name : '',
    });
    setCustomFileNameInput(file.userNamed ? file.name : '');
  };

  const handleSaveFileName = (e: React.FormEvent) => {
    e.preventDefault();
    if (!namingFile) return;
    const trimmed = customFileNameInput.trim();
    if (!trimmed) return;

    const updated = tests.map((t) => {
      if (t.id === namingFile.folderId) {
        const files = getFolderFiles(t).map((f) => {
          if (f.id === namingFile.fileId) {
            return {
              ...f,
              name: trimmed,
              userNamed: true,
            };
          }
          return f;
        });
        return { ...t, files };
      }
      return t;
    });

    saveTests(updated);
    if (activePreviewFile?.id === namingFile.fileId) {
      setActivePreviewFile((prev) => (prev ? { ...prev, name: trimmed, userNamed: true } : null));
    }
    showToast(`Saved name "${trimmed}"`);
    setNamingFile(null);
    setCustomFileNameInput('');
  };

  // Preview Open
  const openFilePreview = (file: VaultFileItem, folderId: string) => {
    setActivePreviewFile(file);
    setActivePreviewFolderId(folderId);
    setEditTextContent(file.data);
    setIsEditingTextFile(false);
  };

  // Save Edited Text File from Modal
  const handleSaveTextFileFromModal = (fileId: string, newContent: string) => {
    if (!activePreviewFolderId) return;

    const updated = tests.map((t) => {
      if (t.id === activePreviewFolderId) {
        const files = getFolderFiles(t).map((f) => {
          if (f.id === fileId) {
            return {
              ...f,
              data: newContent,
              sizeBytes: new Blob([newContent]).size,
              updatedAt: new Date().toLocaleDateString(),
            };
          }
          return f;
        });
        return { ...t, files };
      }
      return t;
    });

    saveTests(updated);
    setActivePreviewFile((prev) =>
      prev && prev.id === fileId
        ? {
            ...prev,
            data: newContent,
            sizeBytes: new Blob([newContent]).size,
            updatedAt: new Date().toLocaleDateString(),
          }
        : prev
    );
    showToast('Changes saved to file.');
  };

  // Download File
  const handleDownloadFile = (file: VaultFileItem) => {
    const element = document.createElement('a');
    if (file.type === 'image') {
      element.href = file.data;
      element.download = file.name;
    } else {
      const blob = new Blob([file.data], { type: 'text/plain;charset=utf-8' });
      element.href = URL.createObjectURL(blob);
      element.download = file.name;
    }
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  // Copy Text
  const copyFileText = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedNotification(true);
    setTimeout(() => setCopiedNotification(false), 2000);
  };

  // Filter & Sort
  const currentSubFolders = tests.filter((t) => t.parentId === currentFolderId);
  const filteredSubFolders = currentSubFolders.filter((f) =>
    f.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredFiles = currentFiles.filter((f) =>
    f.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Helper for sorting timestamp
  const getItemTimestamp = (item: { id: string; createdAt?: string; date?: string }): number => {
    const idMatch = item.id.match(/\d{10,13}/);
    if (idMatch) {
      return parseInt(idMatch[0], 10);
    }
    const dateStr = item.createdAt || item.date;
    if (dateStr) {
      const parsed = Date.parse(dateStr);
      if (!isNaN(parsed)) return parsed;
    }
    return 0;
  };

  const sortedSubFolders = [...filteredSubFolders].sort((a, b) => {
    if (sortOrder === 'name') return a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' });
    const timeA = getItemTimestamp(a);
    const timeB = getItemTimestamp(b);
    if (sortOrder === 'oldest') return timeA - timeB;
    return timeB - timeA; // 'latest'
  });

  const sortedFiles = [...filteredFiles].sort((a, b) => {
    if (sortOrder === 'name') {
      return a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' });
    }
    const timeA = getItemTimestamp(a);
    const timeB = getItemTimestamp(b);
    if (sortOrder === 'oldest') return timeA - timeB;
    return timeB - timeA; // 'latest'
  });

  // Helper formatting
  const formatBytes = (bytes?: number) => {
    if (!bytes || bytes === 0) return '0 KB';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  // Keyboard navigation for image preview
  const imageFiles = currentFiles.filter((f) => f.type === 'image');
  const currentImageIdx = activePreviewFile
    ? imageFiles.findIndex((f) => f.id === activePreviewFile.id)
    : -1;

  const navigatePreview = (direction: 'next' | 'prev') => {
    if (imageFiles.length <= 1 || currentImageIdx === -1) return;
    const newIdx =
      direction === 'next'
        ? (currentImageIdx + 1) % imageFiles.length
        : (currentImageIdx - 1 + imageFiles.length) % imageFiles.length;
    setActivePreviewFile(imageFiles[newIdx]);
  };

  return (
    <div className="space-y-6 animate-fadeIn pb-14 font-sans text-[var(--ink)]">
      {/* ─── Header Section ─── */}
      <section className="pb-3 flex flex-col md:flex-row md:items-end justify-between gap-3 border-b border-[var(--border)]">
        <div>
          <div className="editorial-label text-[10px] mb-0.5">Knowledge Archive</div>
          <h1 className="font-serif text-2xl sm:text-4xl font-semibold text-[var(--ink)] tracking-tight">
            Vault
          </h1>
          <p className="font-sans text-xs text-[var(--muted)] mt-0.5">
            Store study documents, textbook scans, and personalized notes in a clean, unified workspace.
          </p>
        </div>

        {/* Global Quick Actions - Equal and Always Visible */}
        <div className="grid grid-cols-3 gap-2 sm:flex sm:items-center sm:gap-2 w-full sm:w-auto">
          <button
            type="button"
            onClick={() => setShowNewFolderModal(true)}
            className="btn-editorial py-2 px-3 text-xs flex items-center justify-center gap-1.5 w-full sm:w-auto text-center"
          >
            <FolderPlus className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">New Folder</span>
          </button>
          <button
            type="button"
            onClick={() => setShowNewTextModal(true)}
            className="btn-editorial py-2 px-3 text-xs flex items-center justify-center gap-1.5 w-full sm:w-auto text-center"
          >
            <FileText className="w-3.5 h-3.5 text-[var(--accent)] shrink-0" />
            <span className="truncate">New Note</span>
          </button>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="bg-[var(--accent)] text-[var(--accent-text)] hover:opacity-90 transition-opacity cursor-pointer font-bold font-mono text-xs uppercase tracking-wider py-2 px-3 flex items-center justify-center gap-1.5 w-full sm:w-auto shadow-xs text-center"
          >
            <Upload className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">Upload</span>
          </button>
        </div>
      </section>

      {/* Hidden File Input (Accepts Images, Code & Text Files) */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="image/*,.txt,.md,.json,.csv,.log,.js,.ts,.py,.html,.css"
        onChange={handleFileUpload}
        className="hidden"
      />

      {/* ─── Windows Explorer Shell Container - Completely Borderless and Flat ─── */}
      <div className="overflow-hidden flex flex-col space-y-4">
        {/* Explorer Address Bar & Toolbar */}
        <div className="p-2 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 border-b border-[var(--border)]">
          {/* Navigation Controls & Breadcrumbs Address Bar */}
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <button
              type="button"
              onClick={navigateUp}
              disabled={!currentFolderId}
              className={`p-1 border border-[var(--border)] bg-[var(--card-bg)] transition-colors ${
                currentFolderId ? 'text-[var(--ink)] hover:bg-[var(--surface-subtle)] cursor-pointer' : 'text-[var(--muted)]/40 cursor-not-allowed'
              }`}
              title="Up one folder"
            >
              <ArrowUp className="w-3.5 h-3.5" />
            </button>

            {/* Breadcrumb Address Bar */}
            <div className="flex-1 flex items-center gap-1 bg-[var(--card-bg)] border border-[var(--border)] px-2.5 py-1 font-mono text-[11px] text-[var(--ink)] overflow-x-auto">
              <HardDrive className="w-3 h-3 text-[var(--accent)] shrink-0 mr-1" />
              {getBreadcrumbs().map((crumb, idx, arr) => (
                <React.Fragment key={crumb.id || 'root'}>
                  <button
                    type="button"
                    onClick={() => navigateToFolder(crumb.id)}
                    className={`hover:text-[var(--accent)] hover:underline whitespace-nowrap cursor-pointer ${
                      idx === arr.length - 1 ? 'font-bold text-[var(--ink)]' : 'text-[var(--muted)]'
                    }`}
                  >
                    {crumb.name}
                  </button>
                  {idx < arr.length - 1 && <ChevronRight className="w-2.5 h-2.5 text-[var(--muted)] shrink-0" />}
                </React.Fragment>
              ))}
            </div>
          </div>

          {/* Search & View Controls */}
          <div className="flex items-center gap-2 shrink-0">
            <div className="relative">
              <Search className="w-3 h-3 text-[var(--muted)] absolute left-2 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-[var(--card-bg)] border border-[var(--border)] pl-7 pr-2.5 py-1 font-mono text-[11px] text-[var(--ink)] outline-none w-28 sm:w-36 placeholder:text-[var(--muted)]"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-1.5 top-1/2 -translate-y-1/2 text-[var(--muted)] hover:text-[var(--ink)]"
                >
                  <X className="w-2.5 h-2.5" />
                </button>
              )}
            </div>

            {/* Sort Selector: Latest, Oldest, Name */}
            <div className="flex items-center gap-1 border border-[var(--border)] bg-[var(--card-bg)] px-2 py-0.5 font-mono text-[11px]">
              <ArrowUpDown className="w-3 h-3 text-[var(--muted)] shrink-0" />
              <select
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value as 'latest' | 'oldest' | 'name')}
                className="bg-transparent text-[var(--ink)] outline-none cursor-pointer text-[11px]"
                title="Sort by latest, oldest, or name"
              >
                <option value="latest">Latest</option>
                <option value="oldest">Oldest</option>
                <option value="name">Name</option>
              </select>
            </div>

            {/* View Mode: Grid vs List */}
            <div className="flex items-center border border-[var(--border)] bg-[var(--card-bg)] p-0.5">
              <button
                type="button"
                onClick={() => setViewMode('grid')}
                className={`p-1 transition-colors cursor-pointer ${viewMode === 'grid' ? 'bg-[var(--accent)] text-[var(--accent-text)]' : 'text-[var(--muted)] hover:text-[var(--ink)]'}`}
                title="Card View"
              >
                <Grid className="w-3 h-3" />
              </button>
              <button
                type="button"
                onClick={() => setViewMode('details')}
                className={`p-1 transition-colors cursor-pointer ${viewMode === 'details' ? 'bg-[var(--accent)] text-[var(--accent-text)]' : 'text-[var(--muted)] hover:text-[var(--ink)]'}`}
                title="List View"
              >
                <ListIcon className="w-3 h-3" />
              </button>
            </div>
          </div>
        </div>

        {/* ─── Explorer Body (Two-Pane Layout - Collapsed Left Pane for Absolute Simplicity) ─── */}
        <div className="min-h-[420px] flex flex-col">
          {/* Right Main Files & Folders View (Spanning Full Width) */}
          <div className="w-full py-2 space-y-5 flex flex-col justify-between">
            <div className="space-y-5">
              {sortedSubFolders.length > 0 && (
                <div className="space-y-3">
                  <div className="editorial-label text-[11px] flex items-center justify-between">
                    <span>Folders ({sortedSubFolders.length})</span>
                  </div>

                  {viewMode === 'grid' ? (
                    /* Explorer Grid View for Folders (Same card size and structure as files) */
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      {sortedSubFolders.map((folder) => {
                        const files = getFolderFiles(folder);
                        const subChildCount = tests.filter((c) => c.parentId === folder.id).length;

                        return (
                          <div
                            key={folder.id}
                            onClick={() => navigateToFolder(folder.id)}
                            className="group relative bg-[var(--card-bg)] border border-[var(--border)] hover:border-[var(--accent)] transition-all cursor-pointer flex flex-col rounded-sm overflow-hidden shadow-xs hover:shadow-md"
                          >
                            {/* Folder Graphic / Thumbnail Box (aspect-16/10 exact same as files) */}
                            <div className="aspect-[16/10] w-full bg-[var(--surface-subtle)] overflow-hidden relative border-b border-[var(--border)] flex flex-col items-center justify-center p-4">
                              <div className="relative group-hover:scale-105 transition-transform duration-200 flex flex-col items-center justify-center">
                                <Folder
                                  className="w-16 h-16 sm:w-20 sm:h-20 text-[var(--accent)] drop-shadow-xs"
                                  fill="currentColor"
                                  fillOpacity={0.16}
                                  strokeWidth={1.5}
                                />
                              </div>

                              {/* Top Right Actions Overlay */}
                              <div className="absolute top-2 right-2 flex items-center gap-1.5 z-10 opacity-90 group-hover:opacity-100">
                                <button
                                  type="button"
                                  onClick={(e) => handleOpenRenameFolderModal(folder, e)}
                                  className="p-1.5 bg-black/75 hover:bg-[var(--accent)] text-white hover:text-black rounded-xs transition-colors cursor-pointer shadow-xs"
                                  title="Rename folder"
                                >
                                  <Pencil className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={(e) => confirmDeleteFolder(folder.id, folder.name, e)}
                                  className="p-1.5 bg-black/75 hover:bg-[#f87171] text-white rounded-xs transition-colors cursor-pointer shadow-xs"
                                  title="Delete folder"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>

                              {/* Top Left Badge */}
                              <div className="absolute top-2 left-2 px-1.5 py-0.5 bg-black/75 text-white font-mono text-[9px] font-bold uppercase tracking-wider rounded-xs">
                                FOLDER
                              </div>
                            </div>

                            {/* Card Footer Info */}
                            <div className="p-2.5 sm:p-3 bg-[var(--card-bg)] min-h-[44px] flex items-center justify-between">
                              <div className="flex items-center gap-2 min-w-0 flex-1">
                                <Folder className="w-3.5 h-3.5 text-[var(--accent)] shrink-0" />
                                <span
                                  className="font-sans font-semibold text-xs sm:text-sm text-[var(--ink)] group-hover:text-[var(--accent)] truncate"
                                  title={folder.name}
                                >
                                  {folder.name}
                                </span>
                              </div>
                              <div className="font-mono text-[10px] text-[var(--muted)] shrink-0 pl-1">
                                {files.length} {files.length === 1 ? 'file' : 'files'}
                                {subChildCount > 0 ? ` &bull; ${subChildCount} dirs` : ''}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    /* Explorer Details / List View for Folders */
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                      {sortedSubFolders.map((folder, idx) => {
                        const files = getFolderFiles(folder);
                        const subChildCount = tests.filter((c) => c.parentId === folder.id).length;
                        const displaySerial = folder.serialNumber || idx + 1;

                        return (
                          <div
                            key={folder.id}
                            onClick={() => navigateToFolder(folder.id)}
                            className="p-3 bg-[var(--surface-subtle)] border border-[var(--border)] hover:border-[var(--accent)] transition-all cursor-pointer flex items-center justify-between group rounded-sm shadow-xs"
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              <span className="font-mono text-xs text-[var(--muted)] tabular-nums shrink-0">
                                {String(displaySerial).padStart(2, '0')}
                              </span>
                              <Folder className="w-4 h-4 text-[var(--accent)] shrink-0" />
                              <div className="truncate">
                                <div className="font-sans font-semibold text-xs sm:text-sm text-[var(--ink)] group-hover:text-[var(--accent)] truncate">
                                  {folder.name}
                                </div>
                                <div className="font-mono text-[10px] text-[var(--muted)]">
                                  {files.length} {files.length === 1 ? 'file' : 'files'}
                                  {subChildCount > 0 ? ` &bull; ${subChildCount} dirs` : ''}
                                </div>
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={(e) => confirmDeleteFolder(folder.id, folder.name, e)}
                              className="text-[var(--muted)] hover:text-[#f87171] p-1.5 transition-colors cursor-pointer"
                              title="Delete folder"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* Files Section (Rectangular Boxes) */}
              {currentFolderId && (
                <div className="space-y-3">
                  <div className="editorial-label text-[11px] flex items-center justify-between">
                    <span>Files &amp; Documents ({sortedFiles.length})</span>
                    <span className="font-mono text-[10px] text-[var(--muted)] lowercase">
                      {formatBytes(sortedFiles.reduce((acc, f) => acc + (f.sizeBytes || 0), 0))}
                    </span>
                  </div>

                  {sortedFiles.length === 0 ? (
                    <div className="border border-dashed border-[var(--border-strong)] p-10 text-center space-y-3 bg-[var(--surface-subtle)]/40">
                      <div className="w-10 h-10 mx-auto rounded-full bg-[var(--card-bg)] border border-[var(--border)] flex items-center justify-center text-[var(--muted)]">
                        <FileText className="w-5 h-5" />
                      </div>
                      <div className="space-y-1">
                        <p className="font-sans font-medium text-sm text-[var(--ink)]">
                          This folder is empty
                        </p>
                        <p className="font-sans text-xs text-[var(--muted)] max-w-sm mx-auto">
                          Upload screenshots, photos, review notes, or create a new text file directly.
                        </p>
                      </div>
                      <div className="flex items-center justify-center gap-3 pt-2">
                        <button
                          type="button"
                          onClick={() => setShowNewTextModal(true)}
                          className="btn-editorial py-1.5 px-3 text-xs inline-flex items-center gap-1.5"
                        >
                          <FileText className="w-3.5 h-3.5 text-[var(--accent)]" />
                          <span>+ New Note</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          className="bg-[var(--accent)] text-[var(--accent-text)] font-bold font-mono text-xs uppercase tracking-wider py-1.5 px-3 hover:opacity-90 transition-opacity cursor-pointer inline-flex items-center gap-1.5"
                        >
                          <Upload className="w-3.5 h-3.5" />
                          <span>Upload Files</span>
                        </button>
                      </div>
                    </div>
                  ) : viewMode === 'grid' ? (
                    /* ─── Visual Preview Cards (Matches user reference image) ─── */
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      {sortedFiles.map((file) => {
                        const isImg = file.type === 'image';

                        return (
                          <div
                            key={file.id}
                            onClick={() => openFilePreview(file, currentFolder.id)}
                            className="group relative bg-[#0d0e12] border border-[var(--border)] hover:border-[var(--accent)] transition-all cursor-pointer overflow-hidden shadow-md flex flex-col justify-between aspect-16/10 min-h-[190px]"
                          >
                            {/* Background Image Preview / Text Preview */}
                            {isImg ? (
                              <div className="absolute inset-0 w-full h-full bg-[#0a0c10] overflow-hidden">
                                <img
                                  src={file.data}
                                  alt={file.name}
                                  loading="lazy"
                                  decoding="async"
                                  className="w-full h-full object-cover object-center group-hover:scale-102 transition-transform duration-300"
                                />
                                <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-black/75 pointer-events-none" />
                              </div>
                            ) : (
                              <div className="absolute inset-0 w-full h-full bg-[#14161d] p-4 flex flex-col justify-between overflow-hidden">
                                <pre className="font-mono text-xs text-neutral-300 line-clamp-6 whitespace-pre-wrap select-none opacity-80">
                                  {file.data || '(Empty note)'}
                                </pre>
                                <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-transparent to-black/80 pointer-events-none" />
                              </div>
                            )}

                            {/* Top Bar: Badge on Left, Actions on Right */}
                            <div className="relative z-10 p-2.5 flex items-center justify-between gap-2">
                              <span className="px-2 py-0.5 bg-white text-black font-mono font-bold text-[10px] tracking-wider uppercase shadow-md select-none">
                                {file.extension || (isImg ? 'PNG' : 'TXT')}
                              </span>

                              <div className="flex items-center gap-1">
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDownloadFile(file);
                                  }}
                                  className="p-1.5 bg-black/70 hover:bg-black text-white hover:text-[var(--accent-text)] transition-colors cursor-pointer shadow-sm"
                                  title="Download file"
                                >
                                  <Download className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={(e) => handleOpenNameModal(currentFolder.id, file, e)}
                                  className="p-1.5 bg-black/70 hover:bg-black text-white hover:text-[var(--accent-text)] transition-colors cursor-pointer shadow-sm"
                                  title="Rename file"
                                >
                                  <Pencil className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={(e) => confirmDeleteFile(currentFolder.id, file.id, file.name, e)}
                                  className="p-1.5 bg-black/70 hover:bg-red-600 text-white transition-colors cursor-pointer shadow-sm"
                                  title="Delete file"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>

                            {/* Bottom Info Overlay */}
                            <div className="relative z-10 p-2.5 bg-black/60 backdrop-blur-xs border-t border-white/10 flex items-center justify-between gap-2 text-white font-mono text-[11px]">
                              <span className="font-sans font-medium text-xs text-white truncate drop-shadow-sm flex-1">
                                {file.name}
                              </span>
                              <span className="text-neutral-400 text-[10px] tabular-nums shrink-0">
                                {file.sizeBytes ? formatBytes(file.sizeBytes) : '0 KB'}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    /* ─── Details List View ─── */
                    <div className="border border-[var(--border)] overflow-hidden font-mono text-xs">
                      <table className="w-full text-left">
                        <thead className="bg-[var(--surface-subtle)] border-b border-[var(--border)] text-[10px] text-[var(--muted)] uppercase tracking-wider">
                          <tr>
                            <th className="p-2.5 font-bold">Name</th>
                            <th className="p-2.5 font-bold">Type</th>
                            <th className="p-2.5 font-bold">Size</th>
                            <th className="p-2.5 font-bold">Date</th>
                            <th className="p-2.5 font-bold text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[var(--border)]">
                          {sortedFiles.map((file) => (
                            <tr
                              key={file.id}
                              onClick={() => openFilePreview(file, currentFolder.id)}
                              className="hover:bg-[var(--surface-subtle)] cursor-pointer transition-colors"
                            >
                              <td className="p-2.5 flex items-center gap-2 min-w-0">
                                {file.type === 'image' ? (
                                  <FileImage className="w-4 h-4 text-[var(--accent)] shrink-0" />
                                ) : (
                                  <FileText className="w-4 h-4 text-[var(--accent)] shrink-0" />
                                )}
                                <div className="flex items-center gap-1.5 min-w-0">
                                  <span className="font-sans font-medium text-[var(--ink)] truncate">
                                    {file.name}
                                  </span>
                                  <button
                                    type="button"
                                    onClick={(e) => handleOpenNameModal(currentFolder.id, file, e)}
                                    className="p-0.5 text-[var(--muted)] hover:text-[var(--accent)] cursor-pointer"
                                    title="Rename file"
                                  >
                                    <Pencil className="w-3 h-3" />
                                  </button>
                                </div>
                              </td>
                              <td className="p-2.5 text-[var(--muted)] uppercase text-[11px]">
                                {file.extension || file.type}
                              </td>
                              <td className="p-2.5 text-[var(--muted)] text-[11px] tabular-nums">
                                {formatBytes(file.sizeBytes)}
                              </td>
                              <td className="p-2.5 text-[var(--muted)] text-[11px] tabular-nums">
                                {file.createdAt}
                              </td>
                              <td className="p-2.5 text-right">
                                <div className="inline-flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                                  <button
                                    type="button"
                                    onClick={() => handleDownloadFile(file)}
                                    className="p-1 text-[var(--muted)] hover:text-[var(--ink)]"
                                    title="Download"
                                  >
                                    <Download className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={(e) => confirmDeleteFile(currentFolder.id, file.id, file.name, e)}
                                    className="p-1 text-[var(--muted)] hover:text-[#f87171]"
                                    title="Delete"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}

              {/* Root Empty State when no folders exist */}
              {!currentFolderId && sortedSubFolders.length === 0 && (
                <div className="border border-dashed border-[var(--border-strong)] p-12 text-center space-y-3 bg-[var(--surface-subtle)]/40">
                  <div className="w-12 h-12 mx-auto rounded-full bg-[var(--card-bg)] border border-[var(--border)] flex items-center justify-center text-[var(--accent)]">
                    <FolderPlus className="w-6 h-6" />
                  </div>
                  <div className="space-y-1">
                    <h3 className="font-serif text-xl font-semibold text-[var(--ink)]">
                      Vault is Empty
                    </h3>
                    <p className="font-sans text-xs text-[var(--muted)] max-w-sm mx-auto">
                      Create your first folder to organize problem sets, review scans, formula notes, and documents.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowNewFolderModal(true)}
                    className="btn-editorial py-2 px-5 text-xs inline-flex items-center gap-2 mt-2"
                  >
                    <FolderPlus className="w-4 h-4" />
                    <span>Create First Folder</span>
                  </button>
                </div>
              )}
            </div>

            {/* Explorer Status Bar */}
            <div className="pt-4 border-t border-[var(--border)] flex flex-wrap items-center justify-between text-[11px] font-mono text-[var(--muted)]">
              <div>
                {currentFolder ? (
                  <span>
                    {sortedSubFolders.length} folders, {sortedFiles.length} files in {currentFolder.name}
                  </span>
                ) : (
                  <span>{sortedSubFolders.length} root folders</span>
                )}
              </div>
              <div>STUDYLAWN EXPLORER &bull; LOCAL STORAGE</div>
            </div>
          </div>
        </div>
      </div>

      {/* ─── Modal 1: New Folder Modal ─── */}
      {showNewFolderModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="editorial-card w-full max-w-md p-6 bg-[var(--card-bg)] border border-[var(--border-strong)] shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-[var(--border)] pb-3">
              <div className="flex items-center gap-2">
                <FolderPlus className="w-5 h-5 text-[var(--accent)]" />
                <h3 className="font-serif text-xl font-semibold text-[var(--ink)]">
                  {currentFolderId ? 'Create Subfolder' : 'Create New Folder'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowNewFolderModal(false)}
                className="text-[var(--muted)] hover:text-[var(--ink)] cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateFolder} className="space-y-4 font-mono text-xs">
              <div className="space-y-1">
                <label className="editorial-label block">Folder Name</label>
                <input
                  type="text"
                  autoFocus
                  required
                  placeholder="e.g. Mathematics Review, Physics Paper 1, Active Recall..."
                  value={newFolderName}
                  onChange={(e) => setNewFolderName(e.target.value)}
                  className="w-full bg-[var(--surface-subtle)] border border-[var(--border-strong)] p-2.5 text-[var(--ink)] font-sans text-sm outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2 border-t border-[var(--border)]">
                <button
                  type="button"
                  onClick={() => setShowNewFolderModal(false)}
                  className="btn-editorial py-2 px-4 text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-[var(--accent)] text-[var(--accent-text)] font-bold font-mono text-xs uppercase tracking-wider py-2 px-5 hover:opacity-90 cursor-pointer"
                >
                  Create
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── Modal 2: New Text File Modal ─── */}
      {showNewTextModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="editorial-card w-full max-w-2xl p-6 bg-[var(--card-bg)] border border-[var(--border-strong)] shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-[var(--border)] pb-3">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-[var(--accent)]" />
                <h3 className="font-serif text-xl font-semibold text-[var(--ink)]">
                  New Text Document / Note
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowNewTextModal(false)}
                className="text-[var(--muted)] hover:text-[var(--ink)] cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateTextFile} className="space-y-4 font-mono text-xs">
              <div className="space-y-1">
                <label className="editorial-label block">Document Name</label>
                <input
                  type="text"
                  placeholder="e.g. Lecture_Notes.txt or leave blank for Untitled..."
                  value={newTextFileName}
                  onChange={(e) => setNewTextFileName(e.target.value)}
                  className="w-full bg-[var(--surface-subtle)] border border-[var(--border-strong)] p-2.5 text-[var(--ink)] font-sans text-sm outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="editorial-label block">Content</label>
                <textarea
                  rows={8}
                  placeholder="Type your study notes, formulas, calculations, or review bullet points here..."
                  value={newTextContent}
                  onChange={(e) => setNewTextContent(e.target.value)}
                  className="w-full bg-[var(--surface-subtle)] border border-[var(--border-strong)] p-3 text-[var(--ink)] font-mono text-xs outline-none leading-relaxed"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2 border-t border-[var(--border)]">
                <button
                  type="button"
                  onClick={() => setShowNewTextModal(false)}
                  className="btn-editorial py-2 px-4 text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-[var(--accent)] text-[var(--accent-text)] font-bold font-mono text-xs uppercase tracking-wider py-2 px-5 hover:opacity-90 cursor-pointer"
                >
                  Save Document
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── Modal: Name / Rename File Modal ─── */}
      {namingFile && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="editorial-card w-full max-w-md p-6 bg-[var(--card-bg)] border border-[var(--border-strong)] shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-[var(--border)] pb-3">
              <div className="flex items-center gap-2">
                <Edit3 className="w-5 h-5 text-[var(--accent)]" />
                <h3 className="font-serif text-xl font-semibold text-[var(--ink)]">
                  {namingFile.currentName ? 'Rename File' : 'Name File'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setNamingFile(null)}
                className="text-[var(--muted)] hover:text-[var(--ink)] cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveFileName} className="space-y-4 font-mono text-xs">
              <div className="space-y-1">
                <label className="editorial-label block">File Name</label>
                <input
                  type="text"
                  autoFocus
                  required
                  placeholder="e.g. Biology Summary, Formula Sheet, Cell Diagram..."
                  value={customFileNameInput}
                  onChange={(e) => setCustomFileNameInput(e.target.value)}
                  className="w-full bg-[var(--surface-subtle)] border border-[var(--border-strong)] p-2.5 text-[var(--ink)] font-sans text-sm outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2 border-t border-[var(--border)]">
                <button
                  type="button"
                  onClick={() => setNamingFile(null)}
                  className="btn-editorial py-2 px-4 text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-[var(--accent)] text-[var(--accent-text)] font-bold font-mono text-xs uppercase tracking-wider py-2 px-5 hover:opacity-90 cursor-pointer"
                >
                  Save Name
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── Modal: Rename Folder Modal ─── */}
      {folderToRename && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="editorial-card w-full max-w-md p-6 bg-[var(--card-bg)] border border-[var(--border-strong)] shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-[var(--border)] pb-3">
              <div className="flex items-center gap-2">
                <Pencil className="w-5 h-5 text-[var(--accent)]" />
                <h3 className="font-serif text-xl font-semibold text-[var(--ink)]">
                  Rename Folder
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setFolderToRename(null)}
                className="text-[var(--muted)] hover:text-[var(--ink)] cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveFolderName} className="space-y-4 font-mono text-xs">
              <div className="space-y-1">
                <label className="editorial-label block">Folder Name</label>
                <input
                  type="text"
                  autoFocus
                  required
                  placeholder="e.g. Mathematics, Active Recall Notes..."
                  value={renameFolderInput}
                  onChange={(e) => setRenameFolderInput(e.target.value)}
                  className="w-full bg-[var(--surface-subtle)] border border-[var(--border-strong)] p-2.5 text-[var(--ink)] font-sans text-sm outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2 border-t border-[var(--border)]">
                <button
                  type="button"
                  onClick={() => setFolderToRename(null)}
                  className="btn-editorial py-2 px-4 text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-[var(--accent)] text-[var(--accent-text)] font-bold font-mono text-xs uppercase tracking-wider py-2 px-5 hover:opacity-90 cursor-pointer"
                >
                  Save Name
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── Modal 3: Rich Preview Viewer (Images & Text with Zoom & Pan) ─── */}
      {activePreviewFile && (
        <VaultPreviewModal
          file={activePreviewFile}
          folderId={activePreviewFolderId}
          allFiles={sortedFiles}
          onClose={() => setActivePreviewFile(null)}
          onNavigateFile={(nextFile) => {
            setActivePreviewFile(nextFile);
            setEditTextContent(nextFile.data || '');
            setIsEditingTextFile(false);
          }}
          onRenameFile={(fileToRename) => {
            if (activePreviewFolderId) {
              handleOpenNameModal(activePreviewFolderId, fileToRename);
            }
          }}
          onSaveTextFile={handleSaveTextFileFromModal}
          onDownloadFile={handleDownloadFile}
          onShowToast={showToast}
        />
      )}

      {/* ─── Modal 4: Delete Confirmation Modal ─── */}
      {itemToDelete && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="editorial-card w-full max-w-md p-6 bg-[var(--card-bg)] border border-[var(--border-strong)] shadow-2xl space-y-4">
            <div className="flex items-center gap-2 text-[#f87171]">
              <Trash2 className="w-5 h-5" />
              <h3 className="font-serif text-xl font-semibold text-[var(--ink)]">
                Confirm Delete
              </h3>
            </div>

            <p className="font-sans text-sm text-[var(--muted)]">
              Are you sure you want to permanently delete{' '}
              <strong className="text-[var(--ink)]">&quot;{itemToDelete.name}&quot;</strong>
              {itemToDelete.type === 'folder' ? ' and all contents inside it?' : '?'}
            </p>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-[var(--border)]">
              <button
                type="button"
                onClick={() => setItemToDelete(null)}
                className="btn-editorial py-2 px-4 text-xs"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={executeDelete}
                className="bg-[#f87171] text-black font-bold font-mono text-xs uppercase tracking-wider py-2 px-5 hover:opacity-90 cursor-pointer"
              >
                Delete Permanently
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Floating Save/Action Toast */}
      {saveSuccessToast && (
        <div className="fixed bottom-6 right-6 z-50 bg-[var(--ink)] text-[var(--bg)] px-4 py-2.5 border border-[var(--border-strong)] shadow-xl font-mono text-xs flex items-center gap-2 animate-fadeIn">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{saveSuccessToast}</span>
        </div>
      )}
    </div>
  );
};
