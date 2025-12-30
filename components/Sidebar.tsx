import React from 'react';
import { ViewMode, Page } from '../types';
import { 
  Layout, 
  CreditCard, 
  Settings, 
  Plus, 
  FileText
} from 'lucide-react';

interface SidebarProps {
  pages: Page[];
  currentView: ViewMode;
  activePageId: string | null;
  onViewChange: (mode: ViewMode) => void;
  onPageSelect: (id: string) => void;
  onAddPage: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ 
  pages, 
  currentView, 
  activePageId, 
  onViewChange, 
  onPageSelect, 
  onAddPage 
}) => {
  return (
    <div className="w-64 bg-[#F7F7F5] dark:bg-gray-900 border-r border-[#EBEBEA] dark:border-gray-800 h-screen flex flex-col text-[#37352F] dark:text-gray-300 transition-colors">
      
      {/* User / Workspace Switcher (Mock) */}
      <div className="p-4 flex items-center gap-2 hover:bg-[#EFEFED] dark:hover:bg-gray-800 cursor-pointer transition-colors m-2 rounded-md">
        <div className="w-5 h-5 bg-orange-500 rounded text-white text-xs flex items-center justify-center font-bold">N</div>
        <span className="font-medium text-sm truncate dark:text-gray-200">My Workspace</span>
        <div className="ml-auto text-xs border border-gray-300 dark:border-gray-600 rounded px-1 text-gray-500 dark:text-gray-400">Free</div>
      </div>

      {/* Main Navigation */}
      <div className="flex-1 overflow-y-auto py-2">
        <div className="px-3 mb-4">
          <SectionHeader title="Dashboard" />
          <NavItem 
            icon={<Layout size={16} />} 
            label="Home" 
            isActive={currentView === ViewMode.Dashboard} 
            onClick={() => onViewChange(ViewMode.Dashboard)} 
          />
           <NavItem 
            icon={<CreditCard size={16} />} 
            label="Expenses" 
            isActive={currentView === ViewMode.Expenses} 
            onClick={() => onViewChange(ViewMode.Expenses)} 
          />
           <NavItem 
            icon={<Settings size={16} />} 
            label="Settings" 
            isActive={currentView === ViewMode.Settings} 
            onClick={() => onViewChange(ViewMode.Settings)} 
          />
        </div>

        <div className="px-3">
           <div className="group flex items-center justify-between text-xs font-semibold text-gray-500 mb-1 px-2">
              <span>PRIVATE</span>
              <button onClick={onAddPage} className="opacity-0 group-hover:opacity-100 hover:bg-gray-200 dark:hover:bg-gray-700 rounded p-0.5 transition-opacity">
                  <Plus size={14} />
              </button>
           </div>
           
           {pages.map(page => (
             <NavItem
               key={page.id}
               icon={<FileText size={16} />}
               label={page.title}
               isActive={currentView === ViewMode.Page && activePageId === page.id}
               onClick={() => onPageSelect(page.id)}
             />
           ))}
           
           {pages.length === 0 && (
             <div className="px-2 text-xs text-gray-400 italic py-2">No pages created</div>
           )}

           <button 
             onClick={onAddPage}
             className="w-full text-left flex items-center gap-2 px-2 py-1 text-gray-500 hover:bg-[#EFEFED] dark:hover:bg-gray-800 rounded-md mt-1 transition-colors group"
            >
              <div className="w-4 h-4 flex items-center justify-center rounded bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400 group-hover:bg-gray-300 dark:group-hover:bg-gray-600">
                  <Plus size={10} />
              </div>
              <span className="text-sm">Add a page</span>
           </button>
        </div>
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-[#EBEBEA] dark:border-gray-800 text-xs text-gray-400 flex items-center gap-2">
         <div className="w-2 h-2 rounded-full bg-green-500"></div> Online
      </div>
    </div>
  );
};

const SectionHeader: React.FC<{title: string}> = ({title}) => (
  <div className="text-xs font-semibold text-gray-500 mb-1 px-2 mt-2">{title}</div>
);

const NavItem: React.FC<{ 
  icon: React.ReactNode, 
  label: string, 
  isActive: boolean, 
  onClick: () => void 
}> = ({ icon, label, isActive, onClick }) => (
  <button 
    onClick={onClick}
    className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-sm transition-colors mb-0.5
      ${isActive ? 'bg-[#EFEFED] dark:bg-gray-800 text-gray-900 dark:text-gray-100 font-medium' : 'text-gray-600 dark:text-gray-400 hover:bg-[#EFEFED] dark:hover:bg-gray-800'}`}
  >
    <span className={`${isActive ? 'text-gray-800 dark:text-gray-200' : 'text-gray-500 dark:text-gray-500'}`}>{icon}</span>
    <span className="truncate">{label}</span>
    {isActive && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-gray-400" />}
  </button>
);

export default Sidebar;