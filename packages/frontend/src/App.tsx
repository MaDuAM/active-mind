// frontend/src/App.tsx

import { useState, lazy, Suspense, useEffect, useMemo, useRef } from 'react';
import { Routes, Route } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import { usePaginatedEntries, useTopics } from './hooks';
import { Login } from './components/Login';
import { Dashboard } from './pages/Dashboard';
import { Trash } from './pages/Trash';
import TopicView from './pages/TopicView';
import { Sidebar } from './components/Sidebar';
import { SearchLayer } from './components/SearchLayer';
import { useSearch } from './hooks/useSearch';
import { ErrorBoundary } from './components/ErrorBoundary';
import { MenuOverlay } from './components/MenuOverlay';
import { NotFound } from './pages/NotFound';
import { MobileBottomBar } from './components/MobileBottomBar';
import { useMediaQuery } from './hooks/useMediaQuery';

const EntryDetail = lazy(() => import('./components/EntryDetail'));

function AppContent() {
  const { user, loading: authLoading } = useAuth();
  const isMobile = useMediaQuery('(max-width: 639px)');

  const { data: entriesResponse, isLoading: entriesLoading } = usePaginatedEntries(
    undefined,
    !!user
  );
  const { data: topics = [], isLoading: topicsLoading } = useTopics(!!user);
  const entries = entriesResponse?.pages.flatMap((page) => page.data) || [];

  const [selectedView, setSelectedView] = useState<'dashboard' | 'topic' | 'trash'>('dashboard');
  const [selectedTopicId, setSelectedTopicId] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchMode, setSearchMode] = useState<'idle' | 'suggesting' | 'searching'>('idle');
  const [selectedEntryId, setSelectedEntryId] = useState<number | null>(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showNewEntryForm, setShowNewEntryForm] = useState(false);
  const [darkMode, setDarkMode] = useState(() => {
    return localStorage.getItem('darkMode') === 'true';
  });
  const [showMobileSearch, setShowMobileSearch] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);

  // ============================================
  // TASTATUR-SHORTCUT: ⌘N / Ctrl+N → New Entry
  // ============================================
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'n') {
        e.preventDefault();
        setShowNewEntryForm(true);
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  const searchResults = useSearch(entries, searchTerm, { maxResults: 50 });
  
  const suggestions = useMemo(() => {
    if (!searchTerm.trim() || searchMode !== 'suggesting') return [];
    const words = new Set<string>();
    for (const entry of entries) {
      const text = [entry.essenceText, entry.essenceShort, entry.actionName, entry.benefit, entry.pauseReason]
        .filter(Boolean)
        .join(' ');
      const matches = text.toLowerCase().split(/\s+/).filter(w => w.includes(searchTerm.toLowerCase()));
      matches.forEach(w => words.add(w));
      if (words.size >= 5) break;
    }
    return Array.from(words).slice(0, 5);
  }, [entries, searchTerm, searchMode]);

  const filteredEntries = searchMode === 'searching' ? searchResults : [];

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);
  const toggleDarkMode = () => {
    setDarkMode((prev) => {
      const newValue = !prev;
      localStorage.setItem('darkMode', String(newValue));
      return newValue;
    });
  };

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (searchMode === 'searching') {
          setSearchMode('idle');
          setSearchTerm('');
        } else if (searchMode === 'suggesting') {
          setSearchMode('idle');
          setSearchTerm('');
        }
      }
    };
    document.addEventListener('keydown', handleEsc);
    return () => document.removeEventListener('keydown', handleEsc);
  }, [searchMode]);

  const handleTopicDeleted = () => {
    setSelectedView('dashboard');
    setSelectedTopicId(null);
  };

  const handleSelectTopic = (topicId: number | null) => {
    setSearchTerm('');
    setSearchMode('idle');
    setSelectedEntryId(null);
    if (topicId === null) {
      setSelectedView('dashboard');
      setSelectedTopicId(null);
    } else {
      setSelectedView('topic');
      setSelectedTopicId(topicId);
    }
  };

  const handleSelectTrash = () => {
    setSearchTerm('');
    setSearchMode('idle');
    setSelectedEntryId(null);
    setSelectedView('trash');
    setSelectedTopicId(null);
  };

  const handleSelectEntry = (id: number) => {
    setSelectedEntryId(id);
    setSearchTerm('');
    setSearchMode('idle');
  };

  const handleSearch = () => {
    if (searchTerm.trim()) {
      setSearchMode('searching');
      inputRef.current?.blur();
    }
  };

  const handleCloseSearch = () => {
    setSearchMode('idle');
    setSearchTerm('');
    setShowMobileSearch(false);
  };

  const handleInputChange = (value: string) => {
    setSearchTerm(value);
    if (value.trim()) {
      setSearchMode('suggesting');
    } else {
      setSearchMode('idle');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && searchTerm.trim()) {
      e.preventDefault();
      handleSearch();
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    setSearchTerm(suggestion);
    setSearchMode('searching');
    inputRef.current?.blur();
  };

  // ============================================
  // MOBILE: Search öffnen (Bottom Bar)
  // ============================================
  const handleMobileSearchOpen = () => {
    setShowMobileSearch(true);
    setTimeout(() => {
      const mobileInput = document.getElementById('mobile-search-input');
      if (mobileInput) {
        (mobileInput as HTMLInputElement).focus();
      }
    }, 100);
  };

  const handleMobileSearchClose = () => {
    setShowMobileSearch(false);
    setSearchTerm('');
    setSearchMode('idle');
  };

  const isLoading = authLoading || entriesLoading || topicsLoading;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[var(--bg-secondary)]">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-gold-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <div className="text-sm text-[var(--text-secondary)]">Loading ActiveMind...</div>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Login />;
  }

  return (
    <div className="h-screen bg-[var(--bg-secondary)] flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-[var(--bg-primary)]/80 backdrop-blur-sm border-b border-[var(--border-color)] px-4 py-2 shadow-md shadow-black/5 dark:shadow-white/5 shrink-0">
        <div className="flex items-center justify-between gap-4 max-w-full relative">
          {/* Logo centered on mobile, left on desktop */}
          <div className="flex-1 sm:flex-none flex items-center justify-center sm:justify-start gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" className="w-8 h-8 shrink-0">
              <circle cx="50" cy="50" r="42" fill="none" stroke="#B8860B" strokeWidth="2.5" />
              <text x="51" y="65" fontFamily="'Montserrat', sans-serif" fontSize="44" fontWeight="300" fill="#B8860B" textAnchor="middle">AM</text>
            </svg>
            <span className="text-xl font-medium text-gold-500 tracking-tight">ActiveMind</span>
          </div>

          {/* Search bar - Desktop only */}
          <div className="hidden sm:flex flex-1 max-w-xs md:max-w-sm mx-auto relative">
            <div className="relative flex items-center w-full">
              <input
                ref={inputRef}
                type="text"
                placeholder="Search ..."
                value={searchTerm}
                onChange={(e) => handleInputChange(e.target.value)}
                onKeyDown={handleKeyDown}
                className="w-full input rounded-full pl-4 pr-12 transition peer"
                autoFocus={searchMode === 'suggesting'}
              />
              <button
                onClick={handleSearch}
                className="absolute right-1.5 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-transparent text-slate-400 hover:bg-gold-500 hover:!text-white transition flex items-center justify-center p-1.5 peer-focus:text-gold-500"
                aria-label="Search"
              >
                <svg className="w-full h-full" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="11" cy="11" r="8" />
                  <line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
              </button>
            </div>

            {searchMode === 'suggesting' && suggestions.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-[var(--bg-card)] border border-[var(--border-color)] rounded-card shadow-dropdown z-[150] overflow-hidden">
                {suggestions.map((suggestion, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSuggestionClick(suggestion)}
                    className="w-full text-left px-4 py-2 text-sm text-[var(--text-primary)] hover:bg-[var(--bg-secondary)] transition"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Burger menu - desktop only */}
          <div className="hidden sm:flex items-center gap-2 shrink-0">
            <button
              onClick={toggleMenu}
              className="shrink-0 w-10 h-10 rounded-full flex items-center justify-center text-[var(--text-secondary)] hover:bg-gold-500 hover:text-white transition-all duration-200 hover:scale-105 p-1.5 group"
              aria-label="Menu"
            >
              <svg className="w-full h-full transition-colors duration-200" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                <line x1="3" y1="6" x2="21" y2="6" className="transition-colors duration-200 group-hover:stroke-white" />
                <line x1="3" y1="12" x2="21" y2="12" className="transition-colors duration-200 group-hover:stroke-white" />
                <line x1="3" y1="18" x2="21" y2="18" className="transition-colors duration-200 group-hover:stroke-white" />
              </svg>
            </button>
          </div>

          {/* Mobile: Placeholder for balance */}
          <div className="sm:hidden w-8" />
        </div>
      </header>

      {/* Main area */}
      <div className="flex flex-1 h-full overflow-hidden relative">
        <Sidebar
          onSelectTopic={handleSelectTopic}
          onSelectTrash={handleSelectTrash}
          selectedView={selectedView}
          selectedTopicId={selectedTopicId}
          isMobileOpen={isMobileSidebarOpen}
          onMobileClose={() => setIsMobileSidebarOpen(false)}
        />
        <main className="flex-1 overflow-y-auto pb-20 sm:pb-0">
          <div className="p-6 max-w-5xl mx-auto">
            {selectedView === 'dashboard' && <Dashboard onOpenEntry={setSelectedEntryId} showNewEntryForm={showNewEntryForm} setShowNewEntryForm={setShowNewEntryForm} />}
            {selectedView === 'topic' && selectedTopicId && (
              <TopicView topicId={selectedTopicId} onOpenEntry={setSelectedEntryId} onTopicDeleted={handleTopicDeleted} showNewEntryForm={showNewEntryForm} setShowNewEntryForm={setShowNewEntryForm} />
            )}
            {/* Desktop: Trash in the main area */}
            {selectedView === 'trash' && !isMobile && <Trash />}
          </div>
        </main>
      </div>

      {/* Mobile: Trash Overlay */}
      {selectedView === 'trash' && isMobile && (
        <div className="fixed inset-0 z-[200] bg-[var(--bg-card)] flex flex-col animate-in fade-in duration-200">
          <div className="flex-1 overflow-y-auto p-4">
            <Trash />
          </div>
          <div className="shrink-0 px-4 py-4 flex justify-center border-t border-[var(--border-color)]">
            <button
              onClick={() => setSelectedView('dashboard')}
              className="w-12 h-12 rounded-full flex items-center justify-center bg-[var(--bg-secondary)] text-[var(--text-muted)] hover:bg-gold-500 hover:text-white transition-colors text-2xl"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Mobile: Mobile Search Overlay */}
      {showMobileSearch && (
        <div className="fixed inset-0 z-[200] bg-black/30 backdrop-blur-sm" onClick={handleMobileSearchClose}>
          <div className="absolute top-0 left-0 right-0 bg-[var(--bg-card)] p-4 border-b border-[var(--border-color)]" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-3">
              <button
                onClick={handleMobileSearchClose}
                className="w-10 h-10 rounded-full flex items-center justify-center text-[var(--text-muted)] hover:bg-[var(--bg-secondary)] transition shrink-0"
                aria-label="Close search"
              >
                ✕
              </button>
              <div className="relative flex-1">
                <input
                  id="mobile-search-input"
                  type="text"
                  placeholder="Search ..."
                  value={searchTerm}
                  onChange={(e) => handleInputChange(e.target.value)}
                  onKeyDown={handleKeyDown}
                  className="w-full input rounded-full pl-4 pr-12 transition"
                  autoFocus
                />
                <button
                  onClick={handleSearch}
                  className="absolute right-1.5 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-transparent text-slate-400 hover:bg-gold-500 hover:!text-white transition flex items-center justify-center p-1.5"
                  aria-label="Search"
                >
                  <svg className="w-full h-full" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="11" cy="11" r="8" />
                    <line x1="21" y1="21" x2="16.65" y2="16.65" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Mobile: Mobile Bottom Bar */}
      <MobileBottomBar
        onSearch={handleMobileSearchOpen}
        onDashboard={() => {
          setSelectedView('dashboard');
          setSelectedTopicId(null);
        }}
        onTopics={() => setIsMobileSidebarOpen(true)}
        onNewEntry={() => setShowNewEntryForm(true)}
        onMenu={toggleMenu}
      />

      {/* SearchLayer */}
      {searchMode === 'searching' && (
        <>
          {/* Desktop: Blur-Overlay */}
          {!isMobile && (
            <div 
              className="fixed inset-0 z-[100] backdrop-blur-sm bg-black/5 dark:bg-white/5" 
              onClick={handleCloseSearch} 
            />
          )}
          <SearchLayer
            entries={filteredEntries}
            topics={topics}
            onSelectEntry={handleSelectEntry}
            onClose={handleCloseSearch}
            onHoverEntry={() => import('./components/EntryDetail')}
            searchTerm={searchTerm}
            isMobile={isMobile}
          />
        </>
      )}

      {/* EntryDetail Overlay */}
      {selectedEntryId && (
        <Suspense fallback={<div className="fixed top-1/2 right-6">Loading ...</div>}>
          <ErrorBoundary fallback={
            <div className="fixed top-1/2 right-6 bg-[var(--bg-card)] p-6 border border-error rounded-card shadow-card max-w-sm">
              <h3 className="text-error font-semibold">Entry could not be loaded</h3>
              <button onClick={() => setSelectedEntryId(null)} className="mt-3 btn-secondary">Close</button>
            </div>
          }>
            <EntryDetail entryId={selectedEntryId} onClose={() => setSelectedEntryId(null)} />
          </ErrorBoundary>
        </Suspense>
      )}

      {/* Menu Overlay */}
      <MenuOverlay 
        isOpen={isMenuOpen} 
        onClose={() => setIsMenuOpen(false)} 
        darkMode={darkMode} 
        onToggleDarkMode={toggleDarkMode}
        onSelectTrash={handleSelectTrash}
      />
    </div>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <Routes>
        <Route path="/" element={<AppContent />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </ErrorBoundary>
  );
}

export default App;