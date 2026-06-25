import { useRef, useEffect, useCallback } from 'react';

/**
 * Lightweight rich text editor supporting bold formatting.
 * 
 * - Stores values as plain text with **bold** markdown markers
 * - The toolbar provides a Bold toggle button (also Ctrl+B)
 * - Renders a contentEditable div that converts to/from markdown
 */

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  rows?: number;
  placeholder?: string;
}

/* ── Conversion helpers ──────────────────────────────────────────────────── */

/** Convert markdown **bold** to <b> tags for display */
function markdownToHtml(md: string): string {
  if (!md) return '';
  // Escape HTML entities first
  let html = md
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
  // Convert **text** → <b>text</b>
  html = html.replace(/\*\*(.+?)\*\*/g, '<b>$1</b>');
  // Preserve line breaks
  html = html.replace(/\n/g, '<br>');
  return html;
}

/** Convert HTML from contentEditable back to markdown with **bold** */
function htmlToMarkdown(html: string): string {
  if (!html) return '';
  // Create a temp element to parse HTML
  const temp = document.createElement('div');
  temp.innerHTML = html;

  function walk(node: Node): string {
    if (node.nodeType === Node.TEXT_NODE) {
      return node.textContent || '';
    }
    if (node.nodeType === Node.ELEMENT_NODE) {
      const el = node as HTMLElement;
      const tag = el.tagName.toLowerCase();
      const childText = Array.from(el.childNodes).map(walk).join('');

      if (tag === 'b' || tag === 'strong') {
        return `**${childText}**`;
      }
      if (tag === 'br') {
        return '\n';
      }
      if (tag === 'div' || tag === 'p') {
        // contentEditable wraps new lines in <div> sometimes
        return '\n' + childText;
      }
      return childText;
    }
    return '';
  }

  const result = Array.from(temp.childNodes).map(walk).join('');
  // Clean up leading newline that can appear from first <div>
  return result.replace(/^\n/, '');
}

/* ── Component ───────────────────────────────────────────────────────────── */

export default function RichTextEditor({ value, onChange, rows = 3, placeholder }: RichTextEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const isInternalUpdate = useRef(false);

  // Sync external value → editor (only when not actively editing)
  useEffect(() => {
    if (isInternalUpdate.current) {
      isInternalUpdate.current = false;
      return;
    }
    const el = editorRef.current;
    if (!el) return;
    const html = markdownToHtml(value);
    if (el.innerHTML !== html) {
      el.innerHTML = html;
    }
  }, [value]);

  const emitChange = useCallback(() => {
    const el = editorRef.current;
    if (!el) return;
    isInternalUpdate.current = true;
    const md = htmlToMarkdown(el.innerHTML);
    onChange(md);
  }, [onChange]);

  const handleBold = useCallback(() => {
    document.execCommand('bold', false);
    editorRef.current?.focus();
    emitChange();
  }, [emitChange]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'b' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      document.execCommand('bold', false);
      emitChange();
    }
  }, [emitChange]);

  const isBoldActive = () => {
    return document.queryCommandState('bold');
  };

  return (
    <div className="rich-text-editor">
      {/* Toolbar */}
      <div className="rte-toolbar">
        <button
          type="button"
          className={`rte-btn ${isBoldActive() ? 'rte-btn-active' : ''}`}
          onMouseDown={e => e.preventDefault()} // prevent blur
          onClick={handleBold}
          title="Bold (Ctrl+B)"
        >
          <strong>B</strong>
        </button>
        <span className="rte-hint">Select text and click <strong>B</strong> or press <kbd>Ctrl+B</kbd> to bold</span>
      </div>

      {/* Editor area */}
      <div
        ref={editorRef}
        className="rte-content input"
        contentEditable
        role="textbox"
        aria-multiline="true"
        data-placeholder={placeholder || 'Type here…'}
        style={{
          minHeight: `${rows * 1.6}em`,
          resize: 'vertical',
          overflowY: 'auto',
          whiteSpace: 'pre-wrap',
          wordBreak: 'break-word',
        }}
        onInput={emitChange}
        onKeyDown={handleKeyDown}
      />
    </div>
  );
}
