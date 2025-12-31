import React, { useState } from 'react';
import { Workspace } from '../types';
import { persistenceService } from '../services/persistenceService';
import { Plus, Users, Monitor, Check, ChevronDown, Settings, Trash2, Link as LinkIcon, Copy } from 'lucide-react';

interface WorkspaceSelectorProps {
    workspaces: Workspace[];
    activeWorkspaceId: string;
    onWorkspaceChange: (workspaceId: string) => void;
    onWorkspaceCreated: (workspace: Workspace) => void;
    onJoinRequest: () => void;
    userId: string;
    userEmail?: string;
    onWorkspaceRenamed: (id: string, name: string) => void;
    onWorkspaceDeleted: (id: string) => void;
}

export const WorkspaceSelector: React.FC<WorkspaceSelectorProps> = ({
    workspaces,
    activeWorkspaceId,
    onWorkspaceChange,
    onWorkspaceCreated,
    onJoinRequest,
    userId,
    userEmail,
    onWorkspaceRenamed,
    onWorkspaceDeleted
}) => {
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [isCreating, setIsCreating] = useState(false);
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const [editName, setEditName] = useState('');
    const [copied, setCopied] = useState(false);
    const [newWorkspaceName, setNewWorkspaceName] = useState('');

    const activeWorkspace = workspaces.find(w => w.id === activeWorkspaceId);

    const handleCopyLink = () => {
        if (!activeWorkspace?.inviteCode) return;
        const link = `${window.location.protocol}//${window.location.host}?invite=${activeWorkspace.inviteCode}`;
        navigator.clipboard.writeText(link);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleRename = async () => {
        if (!activeWorkspace || !editName.trim()) return;
        try {
            await persistenceService.renameWorkspace(activeWorkspace.id, editName);
            onWorkspaceRenamed(activeWorkspace.id, editName);
            // setIsSettingsOpen(false); // Can keep open to show success or let user close
        } catch (e) {
            console.error(e);
        }
    };

    const handleDelete = async () => {
        if (!activeWorkspace) return;
        if (confirm(`Are you sure you want to delete "${activeWorkspace.name}"? This action cannot be undone.`)) {
            try {
                await persistenceService.deleteWorkspace(activeWorkspace.id);
                onWorkspaceDeleted(activeWorkspace.id);
                setIsSettingsOpen(false);
            } catch (e) {
                console.error(e);
            }
        }
    };

    const submitCreate = async (type: 'private' | 'public') => {
        if (!newWorkspaceName.trim()) return;
        try {
            const newWs = await persistenceService.createWorkspace(userId, newWorkspaceName, type);
            onWorkspaceCreated(newWs);
            setIsCreating(false);
            setNewWorkspaceName('');
        } catch (e) {
            console.error(e);
        }
    };

    return (
        <div className="relative mb-4 px-2">
            {/* Main Switcher Button */}
            <button
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="w-full flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-[#EFEFED] dark:hover:bg-gray-800 transition-colors group"
            >
                <div className="w-5 h-5 bg-gradient-to-br from-orange-400 to-orange-600 rounded text-white text-[10px] flex items-center justify-center font-bold shadow-sm">
                    {activeWorkspace?.name.charAt(0).toUpperCase() || 'W'}
                </div>
                <div className="flex-1 flex flex-col items-start min-w-0">
                    <span className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate w-full text-left">
                        {activeWorkspace?.name || 'Loading...'}
                    </span>
                    <span className="text-[10px] text-gray-500 dark:text-gray-400 capitalize truncate leading-none">
                        {activeWorkspace?.type === 'public' ? 'Team Workspace' : 'Personal Plan'}
                    </span>
                </div>
                <ChevronDown size={14} className="text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300" />
            </button>

            {/* Dropdown Menu */}
            {isDropdownOpen && (
                <>
                    <div
                        className="fixed inset-0 z-40"
                        onClick={() => setIsDropdownOpen(false)}
                    />
                    <div className="absolute top-full left-2 right-2 mt-1 bg-white dark:bg-[#1C1C1C] border border-gray-200 dark:border-[#2C2C2C] rounded-lg shadow-xl z-50 animate-in fade-in zoom-in-95 duration-100 overflow-hidden">
                        <div className="px-3 py-2 text-[10px] font-semibold text-gray-400 uppercase tracking-wider bg-gray-50 dark:bg-[#252525]">
                            {userEmail}
                        </div>

                        <div className="max-h-60 overflow-y-auto py-1">
                            {workspaces.map(ws => (
                                <button
                                    key={ws.id}
                                    onClick={() => {
                                        onWorkspaceChange(ws.id);
                                        setIsDropdownOpen(false);
                                    }}
                                    className={`w-full text-left px-3 py-2 text-sm flex items-center justify-between hover:bg-gray-100 dark:hover:bg-[#2C2C2C] transition-colors
                                        ${ws.id === activeWorkspaceId ? 'text-blue-600 dark:text-blue-400' : 'text-gray-700 dark:text-gray-300'}`}
                                >
                                    <div className="flex items-center gap-2 truncate">
                                        <div className={`w-4 h-4 rounded flex items-center justify-center text-[10px] font-bold ${ws.type === 'public' ? 'bg-blue-100 text-blue-600' : 'bg-gray-200 text-gray-600'}`}>
                                            {ws.name.charAt(0).toUpperCase()}
                                        </div>
                                        <span className="truncate">{ws.name}</span>
                                    </div>
                                    {ws.id === activeWorkspaceId && <Check size={14} />}
                                </button>
                            ))}
                        </div>

                        <div className="border-t border-gray-100 dark:border-[#2C2C2C] p-1 bg-gray-50 dark:bg-[#252525]">
                            <button
                                onClick={() => {
                                    setEditName(activeWorkspace?.name || '');
                                    setIsSettingsOpen(true);
                                    setIsDropdownOpen(false);
                                }}
                                className="w-full text-left px-2 py-1.5 text-xs text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 hover:bg-gray-200 dark:hover:bg-[#333] rounded flex items-center gap-2 transition-colors"
                            >
                                <Settings size={14} />
                                Workspace Settings
                            </button>
                            <button
                                onClick={() => {
                                    setNewWorkspaceName('');
                                    setIsCreating(true);
                                    setIsDropdownOpen(false);
                                }}
                                className="w-full text-left px-2 py-1.5 text-xs text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 hover:bg-gray-200 dark:hover:bg-[#333] rounded flex items-center gap-2 transition-colors"
                            >
                                <Plus size={14} />
                                Create Workspace
                            </button>
                            <button
                                onClick={() => {
                                    onJoinRequest();
                                    setIsDropdownOpen(false);
                                }}
                                className="w-full text-left px-2 py-1.5 text-xs text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 hover:bg-gray-200 dark:hover:bg-[#333] rounded flex items-center gap-2 transition-colors"
                            >
                                <Users size={14} />
                                Join Team
                            </button>
                        </div>
                    </div>
                </>
            )}



            {/* Workspace Settings Modal */}
            {
                isSettingsOpen && activeWorkspace && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100]">
                        {/* Close on click outside */}
                        <div className="absolute inset-0" onClick={() => setIsSettingsOpen(false)} />

                        <div className="bg-white dark:bg-[#1C1C1C] border border-gray-200 dark:border-[#2C2C2C] p-6 rounded-xl w-96 shadow-2xl animate-in fade-in zoom-in-95 relative z-10">
                            <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-6 flex items-center gap-2">
                                <Settings size={20} />
                                Workspace Settings
                            </h2>

                            {/* Rename Section */}
                            <div className="mb-6">
                                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 block">
                                    Workspace Name
                                </label>
                                <div className="flex gap-2">
                                    <input
                                        value={editName}
                                        onChange={e => setEditName(e.target.value)}
                                        className="flex-1 bg-gray-50 dark:bg-[#2C2C2C] text-gray-900 dark:text-gray-200 px-3 py-2 rounded-lg border border-gray-200 dark:border-transparent focus:border-blue-500 outline-none text-sm"
                                    />
                                    <button
                                        onClick={handleRename}
                                        disabled={editName === activeWorkspace.name}
                                        className="px-3 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-blue-700 transition-colors"
                                    >
                                        Save
                                    </button>
                                </div>
                            </div>

                            {/* Invite Link Section (Public Only) */}
                            {activeWorkspace.type === 'public' && (
                                <div className="mb-6">
                                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 block">
                                        Invite Link
                                    </label>
                                    <div className="flex gap-2">
                                        <code className="flex-1 bg-gray-50 dark:bg-[#2C2C2C] text-gray-600 dark:text-gray-400 px-3 py-2 rounded-lg text-xs truncate border border-gray-200 dark:border-transparent font-mono">
                                            {window.location.origin}?invite={activeWorkspace.inviteCode}
                                        </code>
                                        <button
                                            onClick={handleCopyLink}
                                            className="px-3 py-2 bg-gray-100 dark:bg-[#333] text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-[#444] transition-colors"
                                            title="Copy Link"
                                        >
                                            {copied ? <Check size={16} className="text-green-500" /> : <Copy size={16} />}
                                        </button>
                                    </div>
                                    <p className="text-[10px] text-gray-500 mt-2">
                                        Share this link with anyone you want to join this workspace.
                                    </p>
                                </div>
                            )}

                            {/* Danger Zone */}
                            {!activeWorkspace.isProtected && (
                                <div className="pt-6 border-t border-gray-100 dark:border-[#2C2C2C]">
                                    <label className="text-xs font-semibold text-red-500 uppercase tracking-wider mb-2 block">
                                        Danger Zone
                                    </label>
                                    <button
                                        onClick={handleDelete}
                                        className="w-full py-2 bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400 rounded-lg text-sm font-medium hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors flex items-center justify-center gap-2"
                                    >
                                        <Trash2 size={16} />
                                        Delete Workspace
                                    </button>
                                </div>
                            )}

                            <button onClick={() => setIsSettingsOpen(false)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                            </button>
                        </div>
                    </div>
                )
            }

            {/* Creation Modal */}
            {
                isCreating && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100]">
                        <div className="bg-white dark:bg-[#1C1C1C] border border-gray-200 dark:border-[#2C2C2C] p-6 rounded-xl w-96 shadow-2xl animate-in fade-in zoom-in-95">
                            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Create Workspace</h2>
                            <input
                                autoFocus
                                placeholder="Workspace Name (e.g., Engineering Team)"
                                value={newWorkspaceName}
                                onChange={e => setNewWorkspaceName(e.target.value)}
                                className="w-full bg-gray-50 dark:bg-[#2C2C2C] text-gray-900 dark:text-gray-200 px-4 py-2 rounded-lg mb-4 border border-gray-200 dark:border-transparent focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all placeholder:text-gray-400"
                            />
                            <div className="flex gap-2 mb-4">
                                <button onClick={() => submitCreate('public')} className="flex-1 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors">
                                    Create Team
                                </button>
                                <button onClick={() => submitCreate('private')} className="flex-1 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-[#333] dark:hover:bg-[#444] text-gray-700 dark:text-gray-300 rounded-lg text-sm font-medium transition-colors">
                                    Private
                                </button>
                            </div>
                            <button onClick={() => setIsCreating(false)} className="w-full py-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 text-sm transition-colors">Cancel</button>
                        </div>
                    </div>
                )
            }
        </div >
    );
};

