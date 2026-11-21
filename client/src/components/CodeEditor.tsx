import React, { useState, useRef, useEffect } from 'react';
import { Copy, Check, Terminal, Maximize2, Minimize2 } from 'lucide-react';

interface CodeEditorProps {
  value: string;
  onChange?: (value: string) => void;
  language?: 'shell' | 'json' | 'text';
  placeholder?: string;
  readOnly?: boolean;
  minHeight?: string;
  maxHeight?: string;
  label?: string;
  showLineNumbers?: boolean;
}

export const CodeEditor: React.FC<CodeEditorProps> = ({
  value,
  onChange,
  language = 'shell',
  placeholder = '',
  readOnly = false,
  minHeight = '140px',
  maxHeight = '420px',
  label,
  showLineNumbers = true,
}) => {
  const [copied, setCopied] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const lineNumbersRef = useRef<HTMLDivElement>(null);

  const lines = value ? value.split('\n') : [''];
  const lineCount = Math.max(lines.length, 1);

  // Sync scroll between textarea and line numbers gutter
  const handleScroll = (e: React.UIEvent<HTMLTextAreaElement>) => {
    if (lineNumbersRef.current) {
      lineNumbersRef.current.scrollTop = e.currentTarget.scrollTop;
    }
  };

  // Support Tab key indentation inside editor
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (readOnly) return;
    if (e.key === 'Tab') {
      e.preventDefault();
      const textarea = e.currentTarget;
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;

      const indent = '  ';
      const newValue = value.substring(0, start) + indent + value.substring(end);
      if (onChange) onChange(newValue);

      setTimeout(() => {
        textarea.selectionStart = textarea.selectionEnd = start + indent.length;
      }, 0);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const formatJson = () => {
    if (readOnly || !onChange) return;
    try {
      const parsed = JSON.parse(value);
      onChange(JSON.stringify(parsed, null, 2));
    } catch {
      // invalid JSON, ignore
    }
  };

  return (
    <div
      className={`relative rounded-lg border border-neutral-800 bg-black font-mono transition-all ${
        isExpanded ? 'fixed inset-4 z-50 flex flex-col shadow-2xl' : 'w-full'
      }`}
    >
      {/* Editor Header Toolbar */}
      <div className="flex items-center justify-between px-3 py-1.5 border-b border-neutral-800 bg-neutral-950/80 text-[11px] text-neutral-400 select-none">
        <div className="flex items-center gap-2">
          <Terminal className="h-3.5 w-3.5 text-neutral-400" />
          <span className="font-semibold text-neutral-200">{label || language.toUpperCase()}</span>
          <span className="text-neutral-600">|</span>
          <span className="text-neutral-500">{lineCount} {lineCount === 1 ? 'line' : 'lines'}</span>
          <span className="text-neutral-600">·</span>
          <span className="text-neutral-500">{value.length} chars</span>
        </div>

        <div className="flex items-center gap-1">
          {language === 'json' && !readOnly && (
            <button
              type="button"
              onClick={formatJson}
              className="px-2 py-0.5 rounded text-[10px] text-neutral-300 hover:text-white hover:bg-neutral-800 transition"
            >
              Prettify JSON
            </button>
          )}

          <button
            type="button"
            onClick={handleCopy}
            title="Copy code"
            className="p-1 rounded text-neutral-400 hover:text-white hover:bg-neutral-800 transition flex items-center gap-1 text-[10px]"
          >
            {copied ? <Check className="h-3 w-3 text-white" /> : <Copy className="h-3 w-3" />}
            <span>{copied ? 'Copied' : 'Copy'}</span>
          </button>

          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            title={isExpanded ? 'Collapse' : 'Expand editor'}
            className="p-1 rounded text-neutral-400 hover:text-white hover:bg-neutral-800 transition"
          >
            {isExpanded ? <Minimize2 className="h-3 w-3" /> : <Maximize2 className="h-3 w-3" />}
          </button>
        </div>
      </div>

      {/* Editor Main Canvas */}
      <div
        className={`relative flex flex-1 overflow-hidden ${
          isExpanded ? 'h-full' : ''
        }`}
        style={{
          minHeight: isExpanded ? '100%' : minHeight,
          maxHeight: isExpanded ? 'none' : maxHeight,
        }}
      >
        {/* Line Numbers Gutter */}
        {showLineNumbers && (
          <div
            ref={lineNumbersRef}
            className="w-10 select-none border-r border-neutral-900 bg-neutral-950 py-3 text-right font-mono text-[11px] leading-5 text-neutral-600 overflow-hidden pr-2.5"
            aria-hidden="true"
          >
            {Array.from({ length: lineCount }).map((_, i) => (
              <div key={i}>{i + 1}</div>
            ))}
          </div>
        )}

        {/* Textarea Input / Display */}
        <textarea
          ref={textareaRef}
          value={value}
          readOnly={readOnly}
          onChange={(e) => onChange && onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          onScroll={handleScroll}
          placeholder={placeholder}
          spellCheck={false}
          className="flex-1 resize-none bg-transparent p-3 font-mono text-xs leading-5 text-neutral-100 placeholder-neutral-700 focus:outline-none overflow-auto whitespace-pre selection:bg-neutral-800 selection:text-white"
        />
      </div>
    </div>
  );
};
