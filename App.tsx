import React, { useState, useEffect, useRef } from 'react';
import Sidebar from './components/Sidebar';
import BlockEditor from './components/Editor/BlockEditor';
import ExpenseView from './components/ExpenseTracker/ExpenseView';
import { ViewMode, Page, BlockType, Transaction } from './types';
import { Menu, MoreHorizontal, Moon, Sun, Monitor } from 'lucide-react';

const INITIAL_PAGES: Page[] = [
  {
    id: '1',
    title: 'Project Phoenix',
    updatedAt: new Date(),
    blocks: [
      { id: 'b1', type: BlockType.Heading1, content: 'Project Phoenix Overview' },
      { id: 'b2', type: BlockType.Text, content: 'This is the main hub for our new initiative. The goal is to revolutionize personal productivity.' },
      { id: 'b3', type: BlockType.Heading2, content: 'Q4 Goals' },
      { id: 'b4', type: BlockType.Todo, content: 'Launch MVP by November', checked: false },
      { id: 'b5', type: BlockType.Todo, content: 'Secure initial funding', checked: true },
    ]
  },
  {
    id: '2',
    title: 'Reading List',
    updatedAt: new Date(),
    blocks: [
        { id: 'r1', type: BlockType.Heading1, content: 'Books to Read' },
        { id: 'r2', type: BlockType.Todo, content: 'Atomic Habits', checked: true },
        { id: 'r3', type: BlockType.Todo, content: 'The Psychology of Money', checked: false },
    ]
  }
];

const INITIAL_TRANSACTIONS: Transaction[] = [
  { id: 't1', date: '2023-10-24', merchant: 'Starbucks', amount: 5.45, category: 'Food & Drink', status: 'cleared' },
  { id: 't2', date: '2023-10-23', merchant: 'Uber', amount: 18.20, category: 'Transport', status: 'cleared' },
  { id: 't3', date: '2023-10-22', merchant: 'Netflix', amount: 15.99, category: 'Subscriptions', status: 'cleared' },
  { id: 't4', date: '2023-10-21', merchant: 'Whole Foods', amount: 84.32, category: 'Groceries', status: 'cleared' },
  { id: 't5', date: '2023-10-20', merchant: 'Shell', amount: 45.00, category: 'Transport', status: 'cleared' },
];

const App: React.FC = () => {
  const [pages, setPages] = useState<Page[]>(INITIAL_PAGES);
  const [transactions, setTransactions] = useState<Transaction[]>(INITIAL_TRANSACTIONS);
  const [currentView, setCurrentView] = useState<ViewMode>(ViewMode.Page);
  const [activePageId, setActivePageId] = useState<string | null>(INITIAL_PAGES[0].id);
  const [isSidebarOpen, setSidebarOpen] = useState(true);
  const [darkMode, setDarkMode] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const activePage = pages.find(p => p.id === activePageId);

  // Dark Mode Effect
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  // Click outside menu
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Navigation Handlers
  const handlePageSelect = (id: string) => {
    setActivePageId(id);
    setCurrentView(ViewMode.Page);
    if (window.innerWidth < 768) setSidebarOpen(false);
  };

  const handleAddPage = () => {
    const newPage: Page = {
      id: crypto.randomUUID(),
      title: 'Untitled',
      updatedAt: new Date(),
      blocks: [
        { id: crypto.randomUUID(), type: BlockType.Heading1, content: '' }
      ]
    };
    setPages([...pages, newPage]);
    setActivePageId(newPage.id);
    setCurrentView(ViewMode.Page);
  };

  const updateActivePageBlocks = (newBlocks: any[]) => {
    if (!activePageId) return;
    setPages(pages.map(p => {
        if (p.id !== activePageId) return p;
        // Simple heuristic to update title based on first H1
        const firstH1 = newBlocks.find(b => b.type === BlockType.Heading1);
        const title = firstH1 ? (firstH1.content || 'Untitled') : p.title;
        return { ...p, blocks: newBlocks, title };
    }));
  };

  return (
    <div className="flex w-full h-screen bg-white dark:bg-gray-900 text-[#37352F] dark:text-gray-100 transition-colors duration-200">
      
      {/* Sidebar (Desktop) */}
      <div className={`${isSidebarOpen ? 'block' : 'hidden'} md:block shrink-0 h-full border-r border-gray-200 dark:border-gray-800`}>
          <Sidebar 
            pages={pages}
            currentView={currentView}
            activePageId={activePageId}
            onViewChange={(view) => { setCurrentView(view); if (window.innerWidth < 768) setSidebarOpen(false); }}
            onPageSelect={handlePageSelect}
            onAddPage={handleAddPage}
          />
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-full overflow-hidden relative bg-white dark:bg-gray-900">
        
        {/* Topbar */}
        <div className="h-12 border-b border-transparent hover:border-gray-100 dark:hover:border-gray-800 flex items-center px-4 justify-between shrink-0 transition-colors z-20">
             <div className="flex items-center gap-2">
                 <button 
                    onClick={() => setSidebarOpen(!isSidebarOpen)}
                    className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded text-gray-500 dark:text-gray-400"
                 >
                     <Menu size={18}/>
                 </button>
                 <div className="text-sm breadcrumbs text-gray-600 dark:text-gray-400 flex items-center gap-1">
                     {currentView === ViewMode.Page && activePage && (
                         <>
                            <span className="opacity-70">Workspace</span>
                            <span className="opacity-40">/</span>
                            <span className="font-medium text-gray-900 dark:text-gray-100 truncate max-w-[200px]">{activePage.title}</span>
                         </>
                     )}
                     {currentView === ViewMode.Expenses && <span className="font-medium text-gray-900 dark:text-gray-100">Expenses</span>}
                     {currentView === ViewMode.Dashboard && <span className="font-medium text-gray-900 dark:text-gray-100">Dashboard</span>}
                 </div>
             </div>
             
             <div className="relative" ref={menuRef}>
                <button 
                  onClick={() => setShowMenu(!showMenu)}
                  className="text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                >
                    <MoreHorizontal size={18} />
                </button>

                {showMenu && (
                  <div className="absolute right-0 top-full mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 py-1 text-sm animate-in fade-in zoom-in-95 duration-100">
                     <div className="px-3 py-2 border-b border-gray-100 dark:border-gray-700">
                        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Appearance</p>
                        <div className="flex items-center gap-2 p-1 bg-gray-100 dark:bg-gray-900 rounded-lg">
                           <button 
                              onClick={() => setDarkMode(false)}
                              className={`flex-1 flex justify-center p-1 rounded ${!darkMode ? 'bg-white dark:bg-gray-700 shadow-sm' : 'text-gray-500'}`}
                            >
                              <Sun size={14} />
                           </button>
                           <button 
                              onClick={() => setDarkMode(true)}
                              className={`flex-1 flex justify-center p-1 rounded ${darkMode ? 'bg-white dark:bg-gray-600 shadow-sm text-white' : 'text-gray-500'}`}
                            >
                              <Moon size={14} />
                           </button>
                        </div>
                     </div>
                     <button className="w-full text-left px-4 py-2 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300">
                        Export Page
                     </button>
                     <button className="w-full text-left px-4 py-2 hover:bg-gray-50 dark:hover:bg-gray-700 text-red-600">
                        Delete Page
                     </button>
                  </div>
                )}
             </div>
        </div>

        {/* View Content */}
        <main className="flex-1 overflow-y-auto">
            {currentView === ViewMode.Page && activePage ? (
                <div className="min-h-full pb-32">
                     <div className="max-w-3xl mx-auto pt-12 px-6 sm:px-12">
                        <BlockEditor 
                            blocks={activePage.blocks} 
                            onChange={updateActivePageBlocks} 
                        />
                     </div>
                </div>
            ) : currentView === ViewMode.Expenses ? (
                <ExpenseView 
                    transactions={transactions}
                    onAddTransaction={(t) => setTransactions([t, ...transactions])}
                    onBulkAdd={(ts) => setTransactions([...ts, ...transactions])}
                />
            ) : (
                <div className="p-12 max-w-4xl mx-auto text-center space-y-4">
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Welcome to Nox</h1>
                    <p className="text-gray-600 dark:text-gray-400">Select a page from the sidebar or navigate to your Expenses.</p>
                </div>
            )}
        </main>
      </div>
    </div>
  );
};

export default App;