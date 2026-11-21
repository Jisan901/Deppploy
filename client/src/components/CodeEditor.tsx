import React, { useState, useRef, useMemo } from 'react';
import { Copy, Check, Terminal, Maximize2, Minimize2, FileCode } from 'lucide-react';

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

// Authentic VS Code Dark+ (Default Dark Modern) Syntax Highlighting
function highlightCode(code: string, language: SupportedLanguage): string {
  if (!code) return '';

  const escape = (str: string) =>
    str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');

  if (language === 'text') {
    return `<span style="color: #d4d4d4;">${escape(code)}</span>`;
  }

  const lines = code.split('\n');

  const highlightedLines = lines.map((line) => {
    let escaped = escape(line);

    if (language === 'shell') {
      // 1. Comments: #6a9955 (VS Code green italic)
      escaped = escaped.replace(
        /(#.*)$/,
        '<span style="color: #6a9955; font-style: italic;">$1</span>',
      );

      // 2. Strings: #ce9178 (VS Code orange-brown)
      escaped = escaped.replace(
        /(&quot;.*?&quot;|&#39;.*?&#39;|".*?"|'.*?')/g,
        '<span style="color: #ce9178;">$1</span>',
      );

      // 3. Environment Variables: #9cdcfe (VS Code light blue variable)
      escaped = escaped.replace(
        /(\$\{?[A-Za-z0-9_]+\}?)/g,
        '<span style="color: #9cdcfe; font-weight: 600;">$1</span>',
      );

      // 4. Command flags: #9cdcfe
      escaped = escaped.replace(
        /(\s)(--?[a-zA-Z0-9_-]+)/g,
        '$1<span style="color: #9cdcfe;">$2</span>',
      );

      // 5. Common CLI commands & functions: #dcdcaa (VS Code function yellow)
      escaped = escaped.replace(
        /\b(git|pnpm|npm|yarn|pm2|docker|compose|node|curl|echo|export|cd|mkdir|rm|cp|mv|cat|grep|sed|awk|systemctl|exit|sh|bash)\b/g,
        '<span style="color: #dcdcaa; font-weight: 600;">$1</span>',
      );

      // 6. Keywords & operators: #569cd6 (VS Code blue keyword)
      escaped = escaped.replace(
        /\b(if|then|else|elif|fi|for|while|in|do|done|case|esac|return|function)\b/g,
        '<span style="color: #569cd6; font-weight: 600;">$1</span>',
      );

      // 7. Operators: #d4d4d4
      escaped = escaped.replace(
        /(&amp;&amp;|\|\||\||&gt;&gt;|&gt;|&lt;|;)/g,
        '<span style="color: #d4d4d4; font-weight: bold;">$1</span>',
      );

      return escaped;
    }

    if (language === 'yaml') {
      // 1. Comments: #6a9955
      escaped = escaped.replace(
        /(#.*)$/,
        '<span style="color: #6a9955; font-style: italic;">$1</span>',
      );

      // 2. YAML Keys: #9cdcfe (light blue)
      escaped = escaped.replace(
        /^(\s*)([a-zA-Z0-9_-]+)(:)/g,
        '$1<span style="color: #9cdcfe; font-weight: 600;">$2</span><span style="color: #d4d4d4;">:</span>',
      );

      // 3. List dashes: #569cd6
      escaped = escaped.replace(
        /^(\s*)(- )/g,
        '$1<span style="color: #569cd6; font-weight: bold;">$2</span>',
      );

      // 4. Strings: #ce9178
      escaped = escaped.replace(
        /(&quot;.*?&quot;|&#39;.*?&#39;|".*?"|'.*?')/g,
        '<span style="color: #ce9178;">$1</span>',
      );

      // 5. Numbers: #b5cea8
      escaped = escaped.replace(
        /\b(\d+)\b/g,
        '<span style="color: #b5cea8;">$1</span>',
      );

      // 6. Booleans & Null: #569cd6
      escaped = escaped.replace(
        /\b(true|false|null|yes|no)\b/g,
        '<span style="color: #569cd6; font-weight: 600;">$1</span>',
      );

      return escaped;
    }

    if (language === 'json') {
      // 1. JSON Keys: #9cdcfe (VS Code property blue)
      escaped = escaped.replace(
        /(&quot;.*?&quot;|".*?")(?=\s*:)/g,
        '<span style="color: #9cdcfe;">$1</span>',
      );

      // 2. JSON String values: #ce9178 (orange)
      escaped = escaped.replace(
        /(:\s*)(&quot;.*?&quot;|".*?")/g,
        '$1<span style="color: #ce9178;">$2</span>',
      );

      // 3. Numbers: #b5cea8 (green)
      escaped = escaped.replace(
        /\b(-?\d+(?:\.\d+)?)\b/g,
        '<span style="color: #b5cea8;">$1</span>',
      );

      // 4. Booleans / null: #569cd6 (blue)
      escaped = escaped.replace(
        /\b(true|false|null)\b/g,
        '<span style="color: #569cd6; font-weight: 600;">$1</span>',
      );

      // 5. Brackets / braces: #ffd700 / #da70d6
      escaped = escaped.replace(
        /([{}])/g,
        '<span style="color: #ffd700;">$1</span>',
      );
      escaped = escaped.replace(
        /([[\],])/g,
        '<span style="color: #da70d6;">$1</span>',
      );

      return escaped;
    }

    if (language === 'logs') {
      // 1. Stream markers: [STDOUT], [STDERR], [DEPPLOY] -> #4ec9b0 / #569cd6
      escaped = escaped.replace(
        /(\[STDOUT\]|\[DEPPLOY.*?\])/gi,
        '<span style="color: #4ec9b0; font-weight: bold; background: rgba(78, 201, 176, 0.12); padding: 1px 4px; border-radius: 3px;">$1</span>',
      );
      escaped = escaped.replace(
        /(\[STDERR\])/gi,
        '<span style="color: #f48771; font-weight: bold; background: rgba(244, 135, 113, 0.15); padding: 1px 4px; border-radius: 3px;">$1</span>',
      );

      // 2. Failure keywords: #f48771 (VS Code red/salmon)
      escaped = escaped.replace(
        /\b(error|fatal|failed|failure|rejected|timed out|permission denied|exit code [1-9]\d*)\b/gi,
        '<span style="color: #f48771; font-weight: 600; text-decoration: underline decoration-dashed;">$1</span>',
      );

      // 3. Success keywords: #4ec9b0 (VS Code cyan/teal)
      escaped = escaped.replace(
        /\b(success|passed|ok|done|completed|listening|online)\b/gi,
        '<span style="color: #4ec9b0; font-weight: 600;">$1</span>',
      );

      // 4. Timestamps: #858585
      escaped = escaped.replace(
        /(\d{4}-\d{2}-\d{2}[T ]\d{2}:\d{2}:\d{2}(?:\.\d+)?Z?)/g,
        '<span style="color: #858585;">$1</span>',
      );

      // 5. Commit hashes / hex: #b5cea8
      escaped = escaped.replace(
        /\b([0-9a-f]{7,40})\b/g,
        '<span style="color: #b5cea8;">$1</span>',
      );

      return escaped;
    }

    return `<span style="color: #d4d4d4;">${escaped}</span>`;
  });

  return highlightedLines.join('\n');
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
  const handleScroll = (e: React.UIEvent<HTMLTextAreaElement>) => {
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
      className={`relative rounded-md border border-[#333333] bg-[#1e1e1e] font-mono transition-all overflow-hidden shadow-lg ${
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
          {/* Syntax Layer (Underneath) */}
          <pre
            ref={highlightOverlayRef}
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 m-0 overflow-hidden p-3 font-mono text-xs leading-5 whitespace-pre break-normal select-none"
            dangerouslySetInnerHTML={{ __html: highlightedHtml + '\n' }}
          />

          {/* Textarea Input (On Top) */}
          <textarea
            ref={textareaRef}
            value={value}
            readOnly={readOnly}
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
            className={`absolute inset-0 h-full w-full resize-none bg-transparent p-3 font-mono text-xs leading-5 whitespace-pre break-normal focus:outline-none selection:bg-[#264f78] selection:text-white ${
              readOnly
                ? 'text-transparent caret-transparent'
                : 'text-transparent caret-[#ffffff]'
            }`}
          />
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
