import React from 'react';
import { Page, ViewMode, BlockType } from '../../types';
import {
    Plus,
    FileText,
    Folder,
    Clock,
    Star,
    Target,
    ChevronRight,
    Search
} from 'lucide-react';
import './Dashboard.css';

interface DashboardProps {
    pages: Page[];
    onPageSelect: (id: string) => void;
    onAddPage: (parentId?: string | null) => void;
    onAddFolder: () => void;
}

const Dashboard: React.FC<DashboardProps> = ({ pages, onPageSelect, onAddPage, onAddFolder }) => {
    const recentPages = [...pages]
        .filter(p => p.lastOpenedAt)
        .sort((a, b) => (b.lastOpenedAt || 0) - (a.lastOpenedAt || 0))
        .slice(0, 4);

    const favoritePages = pages.filter(p => p.isFavorite).slice(0, 5);

    const presetDatabases = [
        { name: 'Tasks', count: 0, icon: <Target size={18} /> },
        { name: 'Notes', count: pages.length, icon: <FileText size={18} /> },
        { name: 'Subjects', count: 0, icon: <Folder size={18} /> }
    ];

    const topLevelPages = pages.filter(p => !p.parentId).slice(0, 5);

    return (
        <div className="dashboard-container">
            <header className="dashboard-header animate-in fade-in slide-in-from-top-4 duration-700">
                <h1 className="dashboard-title">Good afternoon</h1>
                <p className="dashboard-subtitle">Welcome back to your workspace.</p>
            </header>

            <div className="dashboard-grid">
                {/* Quick Actions */}
                <section className="dashboard-section col-span-1 md:col-span-2">
                    <h3 className="section-title">
                        <Plus size={16} /> Quick Actions
                    </h3>
                    <div className="quick-actions-grid">
                        <button onClick={() => onAddPage(null)} className="quick-action-btn">
                            <FileText className="quick-action-icon" />
                            <span className="quick-action-label">New Page</span>
                        </button>
                        <button onClick={onAddFolder} className="quick-action-btn">
                            <Folder className="quick-action-icon" />
                            <span className="quick-action-label">New Folder</span>
                        </button>
                    </div>
                </section>

                {/* Recent Pages */}
                <section className="dashboard-section">
                    <h3 className="section-title">
                        <Clock size={16} /> Recent Pages
                    </h3>
                    <div className="page-list">
                        {recentPages.length > 0 ? (
                            recentPages.map(page => (
                                <div key={page.id} onClick={() => onPageSelect(page.id)} className="page-item">
                                    {page.type === 'folder' ? <Folder className="page-icon" /> : <FileText className="page-icon" />}
                                    <span className="page-title">{page.title}</span>
                                    <ChevronRight size={14} className="opacity-0 group-hover:opacity-100" />
                                </div>
                            ))
                        ) : (
                            <p className="text-xs text-gray-500 italic px-3">No recent pages</p>
                        )}
                    </div>
                </section>

                {/* Pinned / Favorites */}
                <section className="dashboard-section">
                    <h3 className="section-title">
                        <Star size={16} /> Pinned
                    </h3>
                    <div className="page-list">
                        {favoritePages.length > 0 ? (
                            favoritePages.map(page => (
                                <div key={page.id} onClick={() => onPageSelect(page.id)} className="page-item">
                                    {page.type === 'folder' ? <Folder className="page-icon" /> : <FileText className="page-icon" />}
                                    <span className="page-title">{page.title}</span>
                                </div>
                            ))
                        ) : (
                            <p className="text-xs text-gray-500 italic px-3">No pinned pages</p>
                        )}
                    </div>
                </section>

                {/* Today Section */}
                <section className="dashboard-section">
                    <h3 className="section-title">
                        <Target size={16} /> Today
                    </h3>
                    <div className="today-content">
                        <p className="text-sm text-gray-500">Focus on what matters today.</p>
                    </div>
                </section>



                {/* Workspace Structure */}
                <section className="dashboard-section">
                    <h3 className="section-title">
                        <Folder size={16} /> Workspace
                    </h3>
                    <div className="tree-preview">
                        {topLevelPages.map(page => (
                            <div key={page.id} className="py-1 flex items-center gap-2 cursor-pointer hover:text-gray-900 dark:hover:text-white" onClick={() => onPageSelect(page.id)}>
                                <span className="text-xs">↳</span> {page.type === 'folder' ? <Folder size={14} /> : <FileText size={14} />} {page.title}
                            </div>
                        ))}
                    </div>
                </section>
            </div>
        </div>
    );
};

export default Dashboard;
