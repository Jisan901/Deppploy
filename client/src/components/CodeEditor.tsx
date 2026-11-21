import React, { useState, useRef, useMemo } from 'react';
import { Copy, Check, Terminal, Maximize2, Minimize2 } from 'lucide-react';

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

// Minimal High-Contrast Monochrome Syntax Highlighting Tokenizer
function highlightCode(code: string, language: SupportedLanguage): string {
  if (!code) return '';

  // Escape HTML to prevent injection
  const escape = (str: string) =>
    str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');

  if (language === 'text') {
    return escape(code);
  }

  const lines = code.split('\n');

  const highlightedLines = lines.map((line) => {
    let escaped = escape(line);

    if (language === 'shell') {
      // 1. Comments: #...
      escaped = escaped.replace(/(#.*)$/, '<span class="text-neutral-500 italic">$1</span>');

      // 2. Double and single quoted strings
      escaped = escaped.replace(
        /(&quot;.*?&quot;|&#39;.*?&#39;|".*?"|'.*?')/g,
        '<span class="text-neutral-300 font-normal">$1</span>',
      );

      // 3. Environment variables: $VAR, ${VAR}
      escaped = escaped.replace(
        /(\$\{?[A-Za-z0-9_]+\}?)/g,
        '<span class="text-white font-bold underline decoration-neutral-700 underline-offset-2">$1</span>',
      );

      // 4. Shell operators: &&, ||, |, ;, >, >>, <
      escaped = escaped.replace(
        /(&amp;&amp;|\|\||\||&gt;&gt;|&gt;|&lt;|;)/g,
        '<span class="text-neutral-400 font-bold">$1</span>',
      );

      // 5. Common command verbs
      escaped = escaped.replace(
        /\b(git|pnpm|npm|yarn|pm2|docker|compose|node|curl|echo|export|cd|mkdir|rm|cp|mv|cat|grep|sed|awk|systemctl|exit|sh|bash)\b/g,
        '<span class="text-white font-bold">$1</span>',
      );

      // 6. Command flags: --flag, -f
      escaped = escaped.replace(
        /(\s)(--?[a-zA-Z0-9_-]+)/g,
        '$1<span class="text-neutral-400 font-medium">$2</span>',
      );

      return escaped;
    }

    if (language === 'yaml') {
      // 1. Comments
      escaped = escaped.replace(/(#.*)$/, '<span class="text-neutral-500 italic">$1</span>');

      // 2. YAML Keys (e.g. name:, steps:, runs-on:)
      escaped = escaped.replace(
        /^(\s*)([a-zA-Z0-9_-]+)(:)/g,
        '$1<span class="text-white font-bold">$2</span><span class="text-neutral-600">:</span>',
      );

      // 3. List dashes
      escaped = escaped.replace(/^(\s*)(- )/g, '$1<span class="text-neutral-400 font-bold">$2</span>');

      // 4. Strings
      escaped = escaped.replace(
        /(&quot;.*?&quot;|&#39;.*?&#39;|".*?"|'.*?')/g,
        '<span class="text-neutral-300">$1</span>',
      );

      // 5. Booleans and numbers
      escaped = escaped.replace(
        /\b(true|false|null|yes|no|\d+)\b/g,
        '<span class="text-neutral-300 font-semibold">$1</span>',
      );

      return escaped;
    }

    if (language === 'json') {
      // 1. JSON Keys: "key":
      escaped = escaped.replace(
        /(&quot;.*?&quot;|".*?")(?=\s*:)/g,
        '<span class="text-white font-bold">$1</span>',
      );

      // 2. JSON String values
      escaped = escaped.replace(
        /(:\s*)(&quot;.*?&quot;|".*?")/g,
        '$1<span class="text-neutral-300">$2</span>',
      );

      // 3. Numbers, booleans, null
      escaped = escaped.replace(
        /\b(-?\d+(?:\.\d+)?|true|false|null)\b/g,
        '<span class="text-neutral-200 font-semibold">$1</span>',
      );

      // 4. Brackets and braces
      escaped = escaped.replace(
        /([{}[\],])/g,
        '<span class="text-neutral-600">$1</span>',
      );

      return escaped;
    }

    if (language === 'logs') {
      // 1. Section headers: [STDOUT], [STDERR], [DEPPLOY]
      escaped = escaped.replace(
        /(\[STDOUT\]|\[STDERR\]|\[DEPPLOY.*?\])/gi,
        '<span class="px-1.5 py-0.5 rounded bg-neutral-800 text-white font-bold uppercase text-[10px]">$1</span>',
      );

      // 2. Failure keywords: error, fatal, failed, exception
      escaped = escaped.replace(
        /\b(error|fatal|failed|failure|rejected|timed out|permission denied|exit code [1-9]\d*)\b/gi,
        '<span class="px-1 py-0.2 rounded bg-neutral-900 border border-neutral-700 text-white font-bold uppercase text-[10px]">$1</span>',
      );

      // 3. Success keywords: success, passed, ok, listening
      escaped = escaped.replace(
        /\b(success|passed|ok|done|completed|listening|online)\b/gi,
        '<span class="text-white font-bold underline decoration-white underline-offset-2">$1</span>',
      );

      // 4. ISO Timestamps
      escaped = escaped.replace(
        /(\d{4}-\d{2}-\d{2}[T ]\d{2}:\d{2}:\d{2}(?:\.\d+)?Z?)/g,
        '<span class="text-neutral-500 font-mono text-[10px]">$1</span>',
      );

      // 5. Git commit hashes: 7 to 40 hex digits
      escaped = escaped.replace(
        /\b([0-9a-f]{7,40})\b/g,
        '<span class="text-neutral-400 underline decoration-neutral-800">$1</span>',
      );

      return escaped;
    }

    return escaped;
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
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const lineNumbersRef = useRef<HTMLDivElement>(null);
  const highlightOverlayRef = useRef<HTMLPreElement>(null);

  const lines = value ? value.split('\n') : [''];
  const lineCount = Math.max(lines.length, 1);

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

  // Support Tab key indentation
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

  // Pre-generate highlighted HTML string
  const highlightedHtml = useMemo(() => {
    return highlightCode(value, language);
  }, [value, language]);

  return (
    <div
      className={`relative rounded-lg border border-neutral-800 bg-black font-mono transition-all overflow-hidden ${
        isExpanded ? 'fixed inset-4 z-50 flex flex-col shadow-2xl' : 'w-full'
      }`}
    >
      {/* Editor Header Toolbar */}
      <div className="flex items-center justify-between px-3 py-1.5 border-b border-neutral-800 bg-neutral-950 text-[11px] text-neutral-400 select-none">
        <div className="flex items-center gap-2">
          <Terminal className="h-3.5 w-3.5 text-neutral-400" />
          <span className="font-semibold text-white tracking-wide">{label || language.toUpperCase()}</span>
          <span className="text-neutral-700">|</span>
          <span className="text-neutral-500 font-mono text-[10px]">{language} mode</span>
          <span className="text-neutral-700">·</span>
          <span className="text-neutral-500 font-mono text-[10px]">{lineCount} {lineCount === 1 ? 'line' : 'lines'}</span>
        </div>

        <div className="flex items-center gap-1.5">
          {language === 'json' && !readOnly && (
            <button
              type="button"
              onClick={formatJson}
              className="px-2 py-0.5 rounded border border-neutral-800 text-[10px] text-neutral-300 hover:text-white hover:bg-neutral-900 transition"
            >
              Format JSON
            </button>
          )}

          <button
            type="button"
            onClick={handleCopy}
            title="Copy code"
            className="flex items-center gap-1 px-2 py-0.5 rounded border border-neutral-800 text-neutral-300 hover:text-white hover:bg-neutral-900 transition text-[10px]"
          >
            {copied ? <Check className="h-3 w-3 text-white" /> : <Copy className="h-3 w-3" />}
            <span>{copied ? 'Copied' : 'Copy'}</span>
          </button>

          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            title={isExpanded ? 'Collapse' : 'Expand editor'}
            className="p-1 rounded text-neutral-400 hover:text-white hover:bg-neutral-900 transition"
          >
            {isExpanded ? <Minimize2 className="h-3 w-3" /> : <Maximize2 className="h-3 w-3" />}
          </button>
        </div>
      </div>

      {/* Editor Main Canvas */}
      <div
        className={`relative flex flex-1 overflow-hidden ${isExpanded ? 'h-full' : ''}`}
        style={{
          minHeight: isExpanded ? '100%' : minHeight,
          maxHeight: isExpanded ? 'none' : maxHeight,
        }}
      >
        {/* Line Numbers Gutter */}
        {showLineNumbers && (
          <div
            ref={lineNumbersRef}
            className="w-10 select-none border-r border-neutral-900 bg-neutral-950 py-3 text-right font-mono text-[11px] leading-5 text-neutral-600 overflow-hidden pr-2.5 shrink-0"
            aria-hidden="true"
          >
            {Array.from({ length: lineCount }).map((_, i) => (
              <div key={i}>{i + 1}</div>
            ))}
          </div>
        )}

        {/* Highlight & Textarea Container */}
        <div className="relative flex-1 overflow-hidden">
          {/* Highlighted Render Layer */}
          <pre
            ref={highlightOverlayRef}
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 m-0 overflow-hidden p-3 font-mono text-xs leading-5 whitespace-pre break-normal select-none"
            dangerouslySetInnerHTML={{ __html: highlightedHtml + '\n' }}
          />

          {/* Interactive Textarea Layer */}
          <textarea
            ref={textareaRef}
            value={value}
            readOnly={readOnly}
            onChange={(e) => onChange && onChange(e.target.value)}
            onKeyDown={handleKeyDown}
            onScroll={handleScroll}
            placeholder={placeholder}
            spellCheck={false}
            className={`absolute inset-0 h-full w-full resize-none bg-transparent p-3 font-mono text-xs leading-5 whitespace-pre break-normal focus:outline-none selection:bg-neutral-800 selection:text-white ${
              readOnly
                ? 'text-transparent caret-transparent'
                : 'text-transparent caret-white'
            }`}
          />
        </div>
      </div>
    </div>
  );
};
