import React, { useState, useRef, useMemo } from 'react';
import { Copy, Check, Maximize2, Minimize2, FileCode } from 'lucide-react';
import Prism from 'prismjs';
import 'prismjs/components/prism-bash.js';
import 'prismjs/components/prism-yaml.js';
import 'prismjs/components/prism-json.js';

export type SupportedLanguage = 'shell' | 'yaml' | 'json' | 'logs' | 'text';

interface CodeEditorProps {
  value: string;
  onChange?: (value: string) => void;
  language?: SupportedLanguage;
  placeholder?: string;
  readOnly?: boolean;
  minHeight?: string;
  maxHeight?: string;
  label?: string;
  showLineNumbers?: boolean;
}

// Register custom Prism grammar for execution logs
if (!Prism.languages.logs) {
  Prism.languages.logs = {
    stdout: /\[STDOUT\]|\[DEPPLOY.*?\]/i,
    stderr: /\[STDERR\]/i,
    error: {
      pattern: /\b(?:error|fatal|failed|failure|rejected|timed out|permission denied|exit code [1-9]\d*)\b/i,
      greedy: true,
    },
    success: {
      pattern: /\b(?:success|passed|ok|done|completed|listening|online)\b/i,
      greedy: true,
    },
    timestamp: {
      pattern: /\b\d{4}-\d{2}-\d{2}[T ]\d{2}:\d{2}:\d{2}(?:\.\d+)?Z?\b/,
      greedy: true,
    },
    hash: {
      pattern: /\b[0-9a-f]{7,40}\b/,
      greedy: true,
    },
    number: {
      pattern: /\b\d+\b/,
      greedy: true,
    },
  };
}

function highlightCode(code: string, language: SupportedLanguage): string {
  if (!code) return '';

  if (language === 'text') {
    return Prism.util.encode(code) as string;
  }

  let grammar = Prism.languages[language];
  let langId: string = language;

  if (language === 'shell') {
    grammar = Prism.languages.bash;
    langId = 'bash';
  }

  if (!grammar) {
    return Prism.util.encode(code) as string;
  }

  return Prism.highlight(code, grammar, langId);
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
  const [cursorPos, setCursorPos] = useState({ line: 1, col: 1 });
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const lineNumbersRef = useRef<HTMLDivElement>(null);
  const highlightOverlayRef = useRef<HTMLPreElement>(null);
  const readOnlyPreRef = useRef<HTMLPreElement>(null);

  const lines = value ? value.split('\n') : [''];
  const lineCount = Math.max(lines.length, 1);

  const updateCursorPos = (textarea: HTMLTextAreaElement) => {
    const textToCursor = textarea.value.substring(0, textarea.selectionStart);
    const lineList = textToCursor.split('\n');
    setCursorPos({
      line: lineList.length,
      col: lineList[lineList.length - 1].length + 1,
    });
  };

  // Synchronize scroll between textarea, line numbers, and highlight overlay
  const handleScroll = (e: React.UIEvent<HTMLTextAreaElement | HTMLPreElement>) => {
    const scrollTop = e.currentTarget.scrollTop;
    const scrollLeft = e.currentTarget.scrollLeft;

    if (lineNumbersRef.current) {
      lineNumbersRef.current.scrollTop = scrollTop;
    }
    if (highlightOverlayRef.current) {
      highlightOverlayRef.current.scrollTop = scrollTop;
      highlightOverlayRef.current.scrollLeft = scrollLeft;
    }
  };

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
        updateCursorPos(textarea);
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
      // invalid JSON
    }
  };

  const highlightedHtml = useMemo(() => {
    return highlightCode(value, language);
  }, [value, language]);

  const getLanguageDisplay = () => {
    switch (language) {
      case 'shell':
        return 'Shell Script (Bash)';
      case 'yaml':
        return 'YAML';
      case 'json':
        return 'JSON';
      case 'logs':
        return 'Log Stream';
      default:
        return 'Plain Text';
    }
  };

  const getFileExtension = () => {
    switch (language) {
      case 'shell':
        return '.sh';
      case 'yaml':
        return '.yml';
      case 'json':
        return '.json';
      case 'logs':
        return '.log';
      default:
        return '.txt';
    }
  };

  return (
    <div
      className={`vscode-dark-editor relative rounded-md border border-[#333333] bg-[#1e1e1e] font-mono transition-all overflow-hidden shadow-lg ${
        isExpanded ? 'fixed inset-4 z-50 flex flex-col' : 'w-full'
      }`}
    >
      {/* VS Code Titlebar & Tabs */}
      <div className="flex items-center justify-between px-2 h-9 border-b border-[#2d2d2d] bg-[#252526] select-none">
        {/* Active Tab */}
        <div className="flex items-center">
          <div className="flex items-center gap-2 px-3 py-1 bg-[#1e1e1e] border-t-2 border-[#007acc] text-xs text-[#cccccc] font-sans">
            <FileCode className="h-3.5 w-3.5 text-[#569cd6]" />
            <span className="font-medium text-white">{label || `script${getFileExtension()}`}</span>
          </div>
        </div>

        {/* Toolbar actions */}
        <div className="flex items-center gap-1.5 text-xs text-[#858585]">
          {language === 'json' && !readOnly && (
            <button
              type="button"
              onClick={formatJson}
              className="px-2 py-0.5 rounded text-[11px] text-[#cccccc] hover:text-white hover:bg-[#333333] transition"
            >
              Format
            </button>
          )}

          <button
            type="button"
            onClick={handleCopy}
            title="Copy code"
            className="flex items-center gap-1 px-2 py-0.5 rounded text-[11px] text-[#cccccc] hover:text-white hover:bg-[#333333] transition"
          >
            {copied ? <Check className="h-3 w-3 text-[#4ec9b0]" /> : <Copy className="h-3 w-3" />}
            <span>{copied ? 'Copied' : 'Copy'}</span>
          </button>

          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            title={isExpanded ? 'Exit full screen' : 'Full screen'}
            className="p-1 rounded text-[#cccccc] hover:text-white hover:bg-[#333333] transition"
          >
            {isExpanded ? <Minimize2 className="h-3.5 w-3.5" /> : <Maximize2 className="h-3.5 w-3.5" />}
          </button>
        </div>
      </div>

      {/* Editor Canvas */}
      <div
        className={`relative flex flex-1 overflow-hidden bg-[#1e1e1e] ${isExpanded ? 'h-full' : ''}`}
        style={{
          minHeight: isExpanded ? '100%' : minHeight,
          maxHeight: isExpanded ? 'none' : maxHeight,
        }}
      >
        {/* VS Code Line Numbers Gutter */}
        {showLineNumbers && (
          <div
            ref={lineNumbersRef}
            className="w-11 select-none border-r border-[#2d2d2d] bg-[#1e1e1e] py-3 text-right font-mono text-[12px] leading-5 text-[#858585] overflow-hidden pr-3 shrink-0"
            aria-hidden="true"
          >
            {Array.from({ length: lineCount }).map((_, i) => (
              <div key={i}>{i + 1}</div>
            ))}
          </div>
        )}

        {/* Content Area */}
        <div className="relative flex-1 overflow-hidden bg-[#1e1e1e]">
          {readOnly ? (
            /* Read-Only mode: direct selectable highlighted pre */
            <pre
              ref={readOnlyPreRef}
              onScroll={handleScroll}
              className="h-full w-full overflow-auto p-3 font-mono text-xs leading-5 whitespace-pre break-normal select-text selection:bg-[#264f78] selection:text-white m-0 text-[#d4d4d4]"
              dangerouslySetInnerHTML={{ __html: highlightedHtml + '\n' }}
            />
          ) : (
            /* Editable mode: synchronized overlay + textarea */
            <>
              {/* Syntax Layer (Underneath) */}
              <pre
                ref={highlightOverlayRef}
                aria-hidden="true"
                className="pointer-events-none absolute inset-0 m-0 overflow-hidden p-3 font-mono text-xs leading-5 whitespace-pre break-normal select-none text-[#d4d4d4]"
                dangerouslySetInnerHTML={{ __html: highlightedHtml + '\n' }}
              />

              {/* Textarea Input (On Top) */}
              <textarea
                ref={textareaRef}
                value={value}
                onChange={(e) => {
                  if (onChange) onChange(e.target.value);
                  updateCursorPos(e.currentTarget);
                }}
                onKeyDown={handleKeyDown}
                onKeyUp={(e) => updateCursorPos(e.currentTarget)}
                onClick={(e) => updateCursorPos(e.currentTarget)}
                onScroll={handleScroll}
                placeholder={placeholder}
                spellCheck={false}
                className="absolute inset-0 h-full w-full resize-none bg-transparent p-3 font-mono text-xs leading-5 whitespace-pre break-normal focus:outline-none selection:bg-[#264f78] selection:text-white text-transparent caret-[#ffffff]"
              />
            </>
          )}
        </div>
      </div>

      {/* VS Code Status Bar */}
      <div className="flex items-center justify-between px-3 h-6 border-t border-[#2d2d2d] bg-[#007acc] text-[11px] text-white select-none font-sans">
        <div className="flex items-center gap-3">
          <span>{getLanguageDisplay()}</span>
          <span>•</span>
          <span>UTF-8</span>
          <span>•</span>
          <span>Spaces: 2</span>
        </div>

        <div className="flex items-center gap-3 font-mono">
          <span>Ln {cursorPos.line}, Col {cursorPos.col}</span>
          <span>({lineCount} {lineCount === 1 ? 'line' : 'lines'})</span>
        </div>
      </div>
    </div>
  );
};
