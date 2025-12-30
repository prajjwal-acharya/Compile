import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Block, BlockType } from '../../types';
import { 
  GripVertical, Plus, CheckSquare, X, 
  Bold, Italic, Underline, 
  Heading1, Heading2, Heading3, Heading4, Heading5, Heading6,
  List, ListOrdered, Quote, Minus, Type
} from 'lucide-react';
import { suggestNextBlock } from '../../services/geminiService';

interface BlockEditorProps {
  blocks: Block[];
  onChange: (blocks: Block[]) => void;
}

// --- Icons & Types Configuration ---
const BLOCK_TYPES = [
  { type: BlockType.Text, label: 'Text', icon: <Type size={16} /> },
  { type: BlockType.Heading1, label: 'Heading 1', icon: <Heading1 size={16} /> },
  { type: BlockType.Heading2, label: 'Heading 2', icon: <Heading2 size={16} /> },
  { type: BlockType.Heading3, label: 'Heading 3', icon: <Heading3 size={16} /> },
  { type: BlockType.Todo, label: 'To-do List', icon: <CheckSquare size={16} /> },
  { type: BlockType.Bullet, label: 'Bullet List', icon: <List size={16} /> },
  { type: BlockType.Number, label: 'Numbered List', icon: <ListOrdered size={16} /> },
  { type: BlockType.Quote, label: 'Quote', icon: <Quote size={16} /> },
  { type: BlockType.Divider, label: 'Divider', icon: <Minus size={16} /> },
  { type: BlockType.Heading4, label: 'Heading 4', icon: <Heading4 size={16} /> },
  { type: BlockType.Heading5, label: 'Heading 5', icon: <Heading5 size={16} /> },
  { type: BlockType.Heading6, label: 'Heading 6', icon: <Heading6 size={16} /> },
];

const BlockEditor: React.FC<BlockEditorProps> = ({ blocks, onChange }) => {
  const [focusedBlockId, setFocusedBlockId] = useState<string | null>(null);
  const [loadingSuggestion, setLoadingSuggestion] = useState(false);
  
  // Drag and Drop State
  const [draggedBlockId, setDraggedBlockId] = useState<string | null>(null);

  // Slash Menu State
  const [slashMenuOpen, setSlashMenuOpen] = useState(false);
  const [slashMenuFilter, setSlashMenuFilter] = useState('');
  const [slashMenuIndex, setSlashMenuIndex] = useState<number>(-1); 
  const [slashMenuPosition, setSlashMenuPosition] = useState({ top: 0, left: 0 });

  // Floating Toolbar State
  const [toolbarPosition, setToolbarPosition] = useState<{top: number, left: number} | null>(null);
  const editorRef = useRef<HTMLDivElement>(null);

  // Update specific block
  const updateBlock = (id: string, updates: Partial<Block>) => {
    const newBlocks = blocks.map(b => b.id === id ? { ...b, ...updates } : b);
    onChange(newBlocks);
  };

  // Add new block
  const addBlock = (index: number, type: BlockType = BlockType.Text) => {
    const newBlock: Block = {
      id: crypto.randomUUID(),
      type,
      content: '',
      checked: false
    };
    const newBlocks = [...blocks];
    newBlocks.splice(index + 1, 0, newBlock);
    onChange(newBlocks);
    setFocusedBlockId(newBlock.id);
  };

  const removeBlock = (id: string) => {
    if (blocks.length <= 1) return;
    const index = blocks.findIndex(b => b.id === id);
    const newBlocks = blocks.filter(b => b.id !== id);
    onChange(newBlocks);
    if (index > 0) {
      setFocusedBlockId(newBlocks[index - 1].id);
    }
  };

  // Reorder Logic
  const handleDragStart = (e: React.DragEvent, id: string) => {
      e.dataTransfer.effectAllowed = "move";
      setDraggedBlockId(id);
      // Create a ghost image if needed, or default to browser's
  };

  const handleDragOver = (e: React.DragEvent, targetId: string) => {
      e.preventDefault(); // Necessary to allow dropping
      if (!draggedBlockId || draggedBlockId === targetId) return;
  };

  const handleDrop = (e: React.DragEvent, targetId: string) => {
      e.preventDefault();
      if (!draggedBlockId || draggedBlockId === targetId) return;

      const oldIndex = blocks.findIndex(b => b.id === draggedBlockId);
      const newIndex = blocks.findIndex(b => b.id === targetId);
      
      if (oldIndex < 0 || newIndex < 0) return;

      const newBlocks = [...blocks];
      const [movedBlock] = newBlocks.splice(oldIndex, 1);
      newBlocks.splice(newIndex, 0, movedBlock);
      
      onChange(newBlocks);
      setDraggedBlockId(null);
  };

  // Trigger slash menu
  const openSlashMenu = (index: number, rect: DOMRect) => {
    setSlashMenuIndex(index);
    setSlashMenuPosition({ top: rect.bottom + window.scrollY + 5, left: rect.left + window.scrollX });
    setSlashMenuOpen(true);
    setSlashMenuFilter('');
  };

  const closeSlashMenu = () => {
    setSlashMenuOpen(false);
    setSlashMenuIndex(-1);
  };

  const handleSlashSelect = (type: BlockType) => {
    if (slashMenuIndex === -1) return;
    const block = blocks[slashMenuIndex];
    let newContent = block.content;
    if (newContent.endsWith('/')) newContent = newContent.slice(0, -1);
    
    updateBlock(block.id, { type, content: newContent });
    closeSlashMenu();
    setFocusedBlockId(block.id);
  };

  // Selection Change Handler
  useEffect(() => {
    const handleSelectionChange = () => {
        const selection = window.getSelection();
        if (!selection || selection.isCollapsed) {
            setToolbarPosition(null);
            return;
        }

        const range = selection.getRangeAt(0);
        const rect = range.getBoundingClientRect();

        if (rect.width > 0 && editorRef.current && editorRef.current.contains(selection.anchorNode)) {
             setToolbarPosition({
                top: rect.top - 40,
                left: rect.left
             });
        } else {
             if (!editorRef.current?.contains(selection.anchorNode)) {
                 setToolbarPosition(null);
             }
        }
    };

    document.addEventListener('selectionchange', handleSelectionChange);
    return () => document.removeEventListener('selectionchange', handleSelectionChange);
  }, []);


  return (
    <div ref={editorRef} className="w-full max-w-4xl mx-auto py-8 relative">
      
      {/* Floating Toolbar */}
      {toolbarPosition && (
          <FloatingToolbar position={toolbarPosition} />
      )}

      <div className="space-y-1">
        {blocks.map((block, index) => (
          <EditableBlock
            key={block.id}
            block={block}
            isFocused={focusedBlockId === block.id}
            onUpdate={(updates) => updateBlock(block.id, updates)}
            onFocus={() => setFocusedBlockId(block.id)}
            onAddNext={() => addBlock(index, block.type === BlockType.Bullet ? BlockType.Bullet : block.type === BlockType.Number ? BlockType.Number : block.type === BlockType.Todo ? BlockType.Todo : BlockType.Text)}
            onDelete={() => removeBlock(block.id)}
            onOpenMenu={(rect) => openSlashMenu(index, rect)}
            slashMenuOpen={slashMenuOpen && slashMenuIndex === index}
            onSlashFilterChange={setSlashMenuFilter}
            onNavigateUp={() => index > 0 && setFocusedBlockId(blocks[index - 1].id)}
            onNavigateDown={() => index < blocks.length - 1 && setFocusedBlockId(blocks[index + 1].id)}
            onRequestSuggestion={() => {
                 if (!loadingSuggestion) {
                    setLoadingSuggestion(true);
                    suggestNextBlock(blocks.map(b => b.content).join('\n')).then(text => {
                        updateBlock(block.id, { content: block.content + " " + text });
                        setLoadingSuggestion(false);
                    });
                 }
            }}
            onDragStart={(e) => handleDragStart(e, block.id)}
            onDragOver={(e) => handleDragOver(e, block.id)}
            onDrop={(e) => handleDrop(e, block.id)}
          />
        ))}
      </div>

      {slashMenuOpen && (
        <SlashMenu 
            position={slashMenuPosition} 
            filter={slashMenuFilter} 
            onSelect={handleSlashSelect} 
            onClose={closeSlashMenu} 
        />
      )}

      {loadingSuggestion && (
          <div className="text-xs text-purple-500 animate-pulse mt-4 flex items-center gap-1 justify-center">
             <span className="i-lucide-sparkles w-3 h-3"/> AI is writing...
          </div>
       )}
    </div>
  );
};

// --- Sub Components ---

const FloatingToolbar = ({ position }: { position: { top: number, left: number } }) => {
    const handleFormat = (command: string) => {
        document.execCommand(command, false);
    };

    return (
        <div 
            className="fixed z-50 bg-gray-900 dark:bg-gray-700 text-white rounded-lg px-2 py-1.5 flex items-center gap-1 shadow-xl animate-in fade-in zoom-in-95 duration-200"
            style={{ top: position.top, left: position.left }}
            onMouseDown={(e) => e.preventDefault()} 
        >
             <ToolbarBtn onClick={() => handleFormat('bold')} icon={<Bold size={14}/>} />
             <ToolbarBtn onClick={() => handleFormat('italic')} icon={<Italic size={14}/>} />
             <ToolbarBtn onClick={() => handleFormat('underline')} icon={<Underline size={14}/>} />
        </div>
    )
}

const ToolbarBtn = ({ onClick, icon }: { onClick: () => void, icon: React.ReactNode }) => (
    <button 
        onClick={onClick} 
        className="p-1.5 hover:bg-gray-700 dark:hover:bg-gray-600 rounded text-gray-300 hover:text-white transition-colors"
    >
        {icon}
    </button>
)

const SlashMenu = ({ position, filter, onSelect, onClose }: { position: {top: number, left: number}, filter: string, onSelect: (t: BlockType) => void, onClose: () => void }) => {
    const menuRef = useRef<HTMLDivElement>(null);
    const selectedItemRef = useRef<HTMLButtonElement>(null);
    const [selectedIndex, setSelectedIndex] = useState(0);

    const filteredOptions = BLOCK_TYPES.filter(t => t.label.toLowerCase().includes(filter.toLowerCase()));

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                onClose();
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [onClose]);

    useEffect(() => {
        setSelectedIndex(0);
    }, [filter]);

    useEffect(() => {
        if (selectedItemRef.current) {
            selectedItemRef.current.scrollIntoView({ block: 'nearest' });
        }
    }, [selectedIndex]);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'ArrowDown') {
                e.preventDefault();
                setSelectedIndex(prev => Math.min(prev + 1, filteredOptions.length - 1));
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                setSelectedIndex(prev => Math.max(prev - 1, 0));
            } else if (e.key === 'Enter') {
                e.preventDefault();
                if (filteredOptions[selectedIndex]) {
                    onSelect(filteredOptions[selectedIndex].type);
                }
            } else if (e.key === 'Escape') {
                onClose();
            }
        };
        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [selectedIndex, filteredOptions, onSelect, onClose]);

    if (filteredOptions.length === 0) return null;

    return (
        <div 
            ref={menuRef}
            className="fixed bg-white dark:bg-gray-800 shadow-xl border border-gray-200 dark:border-gray-700 rounded-lg w-64 max-h-80 overflow-y-auto z-50 flex flex-col p-1 animate-in fade-in zoom-in-95 duration-100"
            style={{ top: position.top, left: position.left }}
        >
            <div className="text-xs font-semibold text-gray-400 px-2 py-1.5 uppercase tracking-wider">Basic blocks</div>
            {filteredOptions.map((option, idx) => (
                <button
                    key={option.type}
                    ref={idx === selectedIndex ? selectedItemRef : null}
                    onClick={() => onSelect(option.type)}
                    className={`flex items-center gap-2 px-2 py-1.5 rounded text-sm text-left ${idx === selectedIndex ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300' : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'}`}
                >
                    <div className="p-1 border border-gray-200 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-500 dark:text-gray-400 shadow-sm">{option.icon}</div>
                    <span>{option.label}</span>
                </button>
            ))}
        </div>
    )
}

interface EditableBlockProps {
  block: Block;
  isFocused: boolean;
  onUpdate: (updates: Partial<Block>) => void;
  onFocus: () => void;
  onAddNext: () => void;
  onDelete: () => void;
  onOpenMenu: (rect: DOMRect) => void;
  slashMenuOpen: boolean;
  onSlashFilterChange: (filter: string) => void;
  onNavigateUp: () => void;
  onNavigateDown: () => void;
  onRequestSuggestion: () => void;
  onDragStart: (e: React.DragEvent) => void;
  onDragOver: (e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent) => void;
}

const EditableBlock: React.FC<EditableBlockProps> = ({ 
    block, isFocused, onUpdate, onFocus, onAddNext, onDelete, 
    onOpenMenu, slashMenuOpen, onSlashFilterChange, onNavigateUp, onNavigateDown, onRequestSuggestion,
    onDragStart, onDragOver, onDrop
}) => {
  const contentRef = useRef<HTMLDivElement>(null);

  // Sync content updates
  useEffect(() => {
    if (contentRef.current && block.content !== contentRef.current.innerHTML) {
      contentRef.current.innerHTML = block.content;
    }
  }, [block.content]);

  // Focus Management
  useEffect(() => {
    if (isFocused && contentRef.current) {
        if (document.activeElement !== contentRef.current) {
             contentRef.current.focus();
             const range = document.createRange();
             range.selectNodeContents(contentRef.current);
             range.collapse(false);
             const sel = window.getSelection();
             sel?.removeAllRanges();
             sel?.addRange(range);
        }
    }
  }, [isFocused]);

  // Handle Input
  const handleInput = (e: React.FormEvent<HTMLDivElement>) => {
    const newContent = e.currentTarget.innerHTML;
    const textContent = e.currentTarget.innerText; 

    if (slashMenuOpen) {
        const match = textContent.match(/\/(.*)$/);
        if (match) {
            onSlashFilterChange(match[1]);
        } else {
            onSlashFilterChange(textContent); 
        }
    }

    if (textContent.endsWith('\u00A0') || textContent.endsWith(' ')) { 
        const cleanText = textContent.trim();
        let matchedType: BlockType | null = null;
        if (cleanText === '#') matchedType = BlockType.Heading1;
        else if (cleanText === '##') matchedType = BlockType.Heading2;
        else if (cleanText === '###') matchedType = BlockType.Heading3;
        else if (cleanText === '####') matchedType = BlockType.Heading4;
        else if (cleanText === '#####') matchedType = BlockType.Heading5;
        else if (cleanText === '######') matchedType = BlockType.Heading6;
        else if (cleanText === '>') matchedType = BlockType.Quote;
        else if (cleanText === '-' || cleanText === '*') matchedType = BlockType.Bullet;
        else if (cleanText === '[]') matchedType = BlockType.Todo;
        else if (cleanText === '1.') matchedType = BlockType.Number;
        else if (cleanText === '---') matchedType = BlockType.Divider;

        if (matchedType) {
            onUpdate({ type: matchedType, content: '' }); 
            if (contentRef.current) contentRef.current.innerHTML = '';
            return;
        }
    }

    onUpdate({ content: newContent });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === '/') {
        setTimeout(() => {
             if (contentRef.current) {
                 const rect = contentRef.current.getBoundingClientRect();
                 onOpenMenu(rect);
             }
        }, 0);
    }

    if (e.key === 'Enter' && !e.shiftKey) {
       if (!slashMenuOpen) {
           e.preventDefault();
           onAddNext();
       }
    } else if (e.key === 'Backspace') {
        if (!contentRef.current?.textContent) {
            e.preventDefault();
            if (block.type !== BlockType.Text) {
                onUpdate({ type: BlockType.Text });
            } else {
                onDelete();
            }
        }
    } else if (e.key === 'ArrowUp') {
        if (!slashMenuOpen) {
            e.preventDefault();
            onNavigateUp();
        }
    } else if (e.key === 'ArrowDown') {
         if (!slashMenuOpen) {
            e.preventDefault();
            onNavigateDown();
        }
    } else if (e.key === 'Tab') {
        e.preventDefault();
        onRequestSuggestion();
    }
  };

  const getBlockStyles = () => {
      switch(block.type) {
        case BlockType.Heading1: return "text-4xl font-bold mt-6 mb-2 dark:text-gray-100";
        case BlockType.Heading2: return "text-3xl font-bold mt-5 mb-2 dark:text-gray-100";
        case BlockType.Heading3: return "text-2xl font-semibold mt-4 mb-2 dark:text-gray-200";
        case BlockType.Heading4: return "text-xl font-semibold mt-3 mb-1 dark:text-gray-200";
        case BlockType.Heading5: return "text-lg font-semibold mt-2 mb-1 dark:text-gray-300";
        case BlockType.Heading6: return "text-base font-semibold mt-2 mb-1 text-gray-500 dark:text-gray-400 uppercase";
        case BlockType.Quote: return "border-l-4 border-gray-900 dark:border-gray-500 pl-4 py-1 my-2 italic text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-800 rounded-r";
        case BlockType.Divider: return "hidden"; 
        default: return "text-base py-1 dark:text-gray-300";
      }
  };

  if (block.type === BlockType.Divider) {
      return (
          <div className="group relative py-2" onClick={onFocus}>
               <hr className={`border-gray-200 dark:border-gray-700 ${isFocused ? 'border-blue-300 dark:border-blue-500' : ''}`} />
               {isFocused && <div className="absolute right-0 top-0 text-xs text-gray-400">Divider</div>}
               <div ref={contentRef} contentEditable className="absolute opacity-0 w-0 h-0 overflow-hidden" onKeyDown={handleKeyDown} onFocus={onFocus}/>
          </div>
      )
  }

  const isEmpty = !block.content || block.content === '<br>';
  const showPlaceholder = isFocused && isEmpty;

  return (
    <div 
        className="group flex items-start relative -ml-12 pl-12"
        draggable="true"
        onDragStart={onDragStart}
        onDragOver={onDragOver}
        onDrop={onDrop}
    >
      {/* Handle Column - Positioned absolutely in the padding area to prevent content overlap but keeping fixed layout */}
      <div 
        className="absolute left-0 top-1.5 w-8 flex justify-end items-center opacity-0 group-hover:opacity-100 transition-opacity select-none"
        contentEditable={false}
      >
        <div className="flex items-center gap-0.5 p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700 cursor-grab active:cursor-grabbing text-gray-400 dark:text-gray-500">
            <button onClick={onAddNext} className="hover:text-gray-600 dark:hover:text-gray-300"><Plus size={14} /></button>
            <GripVertical size={14} />
        </div>
      </div>
      
      {/* Content Column */}
      <div className="flex-1 min-w-0 flex items-start relative">
         {block.type === BlockType.Bullet && <span className="mr-2 text-xl leading-6 select-none dark:text-gray-300">•</span>}
         {block.type === BlockType.Number && <span className="mr-2 text-base leading-7 font-medium text-gray-500 select-none dark:text-gray-400">1.</span>}
         {block.type === BlockType.Todo && (
             <div 
                className="mr-2 mt-1.5 cursor-pointer text-gray-400 hover:text-blue-500 select-none" 
                contentEditable={false} 
                onClick={() => onUpdate({checked: !block.checked})}
             >
                {block.checked ? <CheckSquare size={18} className="text-blue-500"/> : <div className="w-[18px] h-[18px] border-2 border-current rounded" />}
             </div>
         )}

         <div
            ref={contentRef}
            contentEditable
            suppressContentEditableWarning
            className={`
                w-full outline-none
                ${getBlockStyles()}
                ${block.checked && block.type === BlockType.Todo ? 'line-through text-gray-400 dark:text-gray-600' : ''}
                ${showPlaceholder ? 'before:content-[attr(placeholder)] before:text-gray-300 dark:before:text-gray-600 before:absolute before:pointer-events-none' : ''}
            `}
            onInput={handleInput}
            onKeyDown={handleKeyDown}
            onFocus={onFocus}
            onBlur={() => { /* Save handled onInput */ }}
            placeholder={block.type === BlockType.Text ? "Type '/' for commands" : `Heading ${block.type.replace('h', '')}`}
          />
      </div>
    </div>
  );
};

export default BlockEditor;