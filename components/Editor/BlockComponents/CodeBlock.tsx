import React, { useEffect, useRef, useState, useMemo } from 'react';
import { EditorView, keymap, lineNumbers } from '@codemirror/view';
import { EditorState, Extension, Compartment } from '@codemirror/state';
import { defaultKeymap, indentWithTab } from '@codemirror/commands';
import { syntaxHighlighting, defaultHighlightStyle } from '@codemirror/language';
import { oneDark } from '@codemirror/theme-one-dark';
import { javascript } from '@codemirror/lang-javascript';
import { python } from '@codemirror/lang-python';
import { html } from '@codemirror/lang-html';
import { css } from '@codemirror/lang-css';
import { json } from '@codemirror/lang-json';
import { markdown } from '@codemirror/lang-markdown';
import { cpp } from '@codemirror/lang-cpp';
import { java } from '@codemirror/lang-java';
import { ChevronDown, Trash2, Info } from 'lucide-react';

interface CodeBlockProps {
    content: string;
    language?: string;
    onChange: (content: string) => void;
    onLanguageChange: (language: string) => void;
    onFocus: () => void;
    onBlur: () => void;
    onDelete: () => void;
    onExit: () => void;
}

const LANGUAGES = [
    { value: 'plaintext', label: 'Plain Text' },
    { value: 'javascript', label: 'JavaScript' },
    { value: 'typescript', label: 'TypeScript' },
    { value: 'python', label: 'Python' },
    { value: 'java', label: 'Java' },
    { value: 'c', label: 'C' },
    { value: 'cpp', label: 'C++' },
    { value: 'html', label: 'HTML' },
    { value: 'css', label: 'CSS' },
    { value: 'json', label: 'JSON' },
    { value: 'markdown', label: 'Markdown' },
];

export const CodeBlock: React.FC<CodeBlockProps> = ({
    content,
    language = 'plaintext',
    onChange,
    onLanguageChange,
    onFocus,
    onBlur,
    onDelete,
    onExit
}) => {
    const editorRef = useRef<HTMLDivElement>(null);
    const viewRef = useRef<EditorView | null>(null);
    const [toolbarVisible, setToolbarVisible] = useState(false);
    const [isDarkMode, setIsDarkMode] = useState(false);
    const [showHint, setShowHint] = useState(false);

    // Store callbacks in refs to prevent stale closures
    const callbacksRef = useRef({ onChange, onFocus, onBlur, onDelete, onExit });
    useEffect(() => {
        callbacksRef.current = { onChange, onFocus, onBlur, onDelete, onExit };
    }, [onChange, onFocus, onBlur, onDelete, onExit]);

    // Compartments for dynamic reconfiguration
    const languageCompartment = useMemo(() => new Compartment(), []);
    const themeCompartment = useMemo(() => new Compartment(), []);

    // Theme detection
    useEffect(() => {
        const checkTheme = () => {
            setIsDarkMode(document.documentElement.classList.contains('dark'));
        };
        checkTheme();
        const observer = new MutationObserver(checkTheme);
        observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
        return () => observer.disconnect();
    }, []);

    const getLanguageExtension = (lang: string): Extension => {
        switch (lang) {
            case 'javascript': return javascript();
            case 'typescript': return javascript({ typescript: true });
            case 'python': return python();
            case 'java': return java();
            case 'c': return cpp();
            case 'cpp': return cpp();
            case 'html': return html();
            case 'css': return css();
            case 'json': return json();
            case 'markdown': return markdown();
            default: return [];
        }
    };

    // Initialize Editor
    useEffect(() => {
        if (!editorRef.current) return;

        const startState = EditorState.create({
            doc: content,
            extensions: [
                // CUSTOM KEYMAPS MUST COME FIRST to take priority
                keymap.of([
                    {
                        key: "Shift-Enter",
                        run: () => {
                            callbacksRef.current.onExit();
                            return true;
                        },
                        preventDefault: true
                    },
                    {
                        key: "Backspace",
                        run: (view) => {
                            if (view.state.doc.length === 0) {
                                callbacksRef.current.onDelete();
                                return true;
                            }
                            return false;
                        }
                    }
                ]),
                // Default keymaps come after
                keymap.of([indentWithTab, ...defaultKeymap]),
                lineNumbers(),
                EditorView.lineWrapping,
                EditorView.updateListener.of((update) => {
                    if (update.docChanged) {
                        callbacksRef.current.onChange(update.state.doc.toString());
                    }
                    if (update.focusChanged || update.selectionSet) {
                        if (update.view.hasFocus) {
                            callbacksRef.current.onFocus();
                            const line = update.state.doc.lineAt(update.state.selection.main.head);
                            setShowHint(line.number === update.state.doc.lines);
                        } else {
                            callbacksRef.current.onBlur();
                            setShowHint(false);
                        }
                    }
                }),
                EditorView.theme({
                    "&": {
                        backgroundColor: "transparent !important",
                        height: "100%",
                    },
                    ".cm-scroller": {
                        fontFamily: "monospace",
                        lineHeight: "1.5"
                    },
                    ".cm-content": {
                        padding: "0"
                    },
                    ".cm-gutters": {
                        backgroundColor: "transparent",
                        color: "rgba(156, 163, 175, 0.4)",
                        border: "none",
                        marginRight: "8px"
                    }
                }),
                EditorView.domEventHandlers({
                    keydown: (event, view) => {
                        // Fallback DOM-level handler for Shift+Enter
                        if (event.shiftKey && event.key === 'Enter') {
                            event.preventDefault();
                            event.stopPropagation();
                            callbacksRef.current.onExit();
                            return true;
                        }
                        return false;
                    }
                }),
                languageCompartment.of(getLanguageExtension(language)),
                themeCompartment.of(isDarkMode ? oneDark : [syntaxHighlighting(defaultHighlightStyle, { fallback: true })])
            ]
        });

        const view = new EditorView({
            state: startState,
            parent: editorRef.current
        });

        viewRef.current = view;

        return () => {
            view.destroy();
        };
    }, []); // eslint-disable-next-line react-hooks/exhaustive-deps

    // Update Language & Theme
    useEffect(() => {
        if (!viewRef.current) return;

        viewRef.current.dispatch({
            effects: [
                languageCompartment.reconfigure(getLanguageExtension(language)),
                themeCompartment.reconfigure(isDarkMode ? oneDark : [syntaxHighlighting(defaultHighlightStyle, { fallback: true })])
            ]
        });
    }, [language, isDarkMode, languageCompartment, themeCompartment]);

    // Update Content (External Sync)
    useEffect(() => {
        if (viewRef.current && content !== viewRef.current.state.doc.toString()) {
            const tr = viewRef.current.state.update({
                changes: { from: 0, to: viewRef.current.state.doc.length, insert: content }
            });
            viewRef.current.dispatch(tr);
        }
    }, [content]);

    return (
        <div
            className="relative w-full font-mono text-[14px] bg-[#f7f6f3] dark:bg-gray-800 rounded-md border border-gray-200 dark:border-gray-700 group/code"
            onMouseEnter={() => setToolbarVisible(true)}
            onMouseLeave={() => setToolbarVisible(false)}
        >
            {/* Toolbar */}
            <div className={`absolute top-2 left-2 z-10 flex items-center gap-2 transition-opacity duration-200 ${toolbarVisible ? 'opacity-100' : 'opacity-0'}`}>
                <div className="relative group/select">
                    <select
                        value={language}
                        onChange={(e) => onLanguageChange(e.target.value)}
                        className="appearance-none bg-white dark:bg-gray-700 text-xs text-gray-600 dark:text-gray-300 px-2 py-1 pr-6 rounded border border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500 focus:outline-none cursor-pointer"
                    >
                        {LANGUAGES.map(lang => (
                            <option key={lang.value} value={lang.value}>
                                {lang.label}
                            </option>
                        ))}
                    </select>
                    <ChevronDown size={12} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                </div>
                <button
                    onClick={onDelete}
                    className="p-1 bg-white dark:bg-gray-700 rounded border border-gray-200 dark:border-gray-600 hover:bg-red-50 dark:hover:bg-red-900/20 text-gray-400 hover:text-red-500 transition-colors"
                    title="Delete block"
                >
                    <Trash2 size={14} />
                </button>
            </div>

            <div className="pt-10 pb-3 px-1 min-h-[3rem]">
                <div ref={editorRef} className="w-full h-full" />
            </div>

            {/* Hint Footer */}
            <div className={`absolute bottom-1 right-2 pointer-events-none transition-opacity duration-200 ${showHint ? 'opacity-100' : 'opacity-0'}`}>
                <span className="text-[10px] text-gray-400 dark:text-gray-500 flex items-center gap-1">
                    <Info size={10} /> Shift + Enter to exit
                </span>
            </div>
        </div>
    );
};
