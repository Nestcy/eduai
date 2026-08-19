import React, { useEffect, useRef, useState } from 'react';
import katex from 'katex';
import mermaid from 'mermaid';
import { ChevronDown, Sparkles, Brain } from 'lucide-react';

interface MarkdownRendererProps {
  content: string;
  thinking?: string;
  className?: string;
}

// Collapsible Thinking Process Component (Dropdown for students)
export const CollapsibleThinking: React.FC<{ thinking: string }> = ({ thinking }) => {
  const [isOpen, setIsOpen] = useState(false);

  if (!thinking || !thinking.trim()) return null;

  return (
    <div className="mb-4 rounded-xl border border-indigo-200/90 bg-indigo-50/60 overflow-hidden text-xs shadow-2xs transition-all">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-3.5 py-2.5 flex items-center justify-between text-indigo-950 hover:bg-indigo-100/70 transition-colors font-semibold cursor-pointer select-none text-left"
        aria-expanded={isOpen}
      >
        <div className="flex items-center gap-2">
          <div className="p-1 rounded-md bg-indigo-200/80 text-indigo-700">
            <Brain className="w-3.5 h-3.5" />
          </div>
          <span className="text-xs font-bold text-indigo-900">AI Thinking & Reasoning Process</span>
          <span className="text-[10px] px-2 py-0.5 bg-indigo-200/80 text-indigo-800 rounded-full font-medium hidden sm:inline-block">
            {isOpen ? 'Click to collapse' : 'Click to inspect thinking'}
          </span>
        </div>
        <div className="flex items-center gap-1.5 text-indigo-600 font-medium text-[11px] shrink-0">
          <span>{isOpen ? 'Hide reasoning' : 'View reasoning'}</span>
          <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${isOpen ? 'rotate-180 text-indigo-700' : ''}`} />
        </div>
      </button>

      {isOpen && (
        <div className="p-4 pt-3 border-t border-indigo-200/70 text-slate-700 bg-white/95 text-[12px] leading-relaxed max-h-96 overflow-y-auto font-sans">
          <div className="flex items-center gap-1 text-[10px] text-indigo-600 font-bold uppercase tracking-wider mb-2">
            <Sparkles className="w-3 h-3 text-indigo-500" />
            <span>Step-by-Step Educational Logic:</span>
          </div>
          <div className="whitespace-pre-wrap font-mono text-[11.5px] bg-slate-50 p-3 rounded-lg border border-slate-200/70 text-slate-800">
            {thinking}
          </div>
        </div>
      )}
    </div>
  );
};

export const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ content, thinking: explicitThinking, className = '' }) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    mermaid.initialize({
      startOnLoad: false,
      theme: 'neutral',
      securityLevel: 'loose',
      fontFamily: 'inherit'
    });
  }, []);

  // Extract <think> or <thought> tags embedded within markdown content
  const { thinking: embeddedThinking, cleanContent } = extractThinking(content);
  const activeThinking = explicitThinking || embeddedThinking;

  return (
    <div ref={containerRef} className={`space-y-3 leading-relaxed text-slate-800 ${className}`}>
      {activeThinking && <CollapsibleThinking thinking={activeThinking} />}
      {renderFormattedBlocks(cleanContent)}
    </div>
  );
};

function extractThinking(rawText: string): { thinking: string | null; cleanContent: string } {
  if (!rawText) return { thinking: null, cleanContent: '' };

  let thinking: string | null = null;
  let cleanContent = rawText;

  // Match <think>...</think>
  const thinkMatch = rawText.match(/<think>([\s\S]*?)<\/think>/i);
  if (thinkMatch) {
    thinking = thinkMatch[1].trim();
    cleanContent = rawText.replace(/<think>[\s\S]*?<\/think>/gi, '').trim();
  } else {
    // Match <thought>...</thought>
    const thoughtMatch = rawText.match(/<thought>([\s\S]*?)<\/thought>/i);
    if (thoughtMatch) {
      thinking = thoughtMatch[1].trim();
      cleanContent = rawText.replace(/<thought>[\s\S]*?<\/thought>/gi, '').trim();
    }
  }

  return { thinking, cleanContent };
}

function renderFormattedBlocks(text: string): React.ReactNode[] {
  const lines = text.split('\n');
  const elements: React.ReactNode[] = [];
  let i = 0;
  let blockKey = 0;

  while (i < lines.length) {
    const line = lines[i];

    // Fenced Code / Mermaid / Function Plot block
    if (line.trim().startsWith('```')) {
      const lang = line.trim().replace('```', '').trim().toLowerCase();
      const codeLines: string[] = [];
      i++;
      while (i < lines.length && !lines[i].trim().startsWith('```')) {
        codeLines.push(lines[i]);
        i++;
      }
      i++; // skip closing ```
      const blockCode = codeLines.join('\n');

      if (lang === 'mermaid') {
        elements.push(<MermaidBlock key={`mermaid-${blockKey++}`} chart={blockCode} />);
      } else if (lang === 'function-plot') {
        elements.push(<FunctionPlotBlock key={`plot-${blockKey++}`} configStr={blockCode} />);
      } else {
        elements.push(
          <pre key={`code-${blockKey++}`} className="bg-slate-900 text-slate-100 p-4 rounded-xl text-xs overflow-x-auto my-3 font-mono shadow-sm">
            <code>{blockCode}</code>
          </pre>
        );
      }
      continue;
    }

    // Display / Block Math: $$...$$
    if (line.trim().startsWith('$$') && line.trim().endsWith('$$') && line.trim().length > 4) {
      const math = line.trim().slice(2, -2).trim();
      elements.push(<BlockMath key={`math-${blockKey++}`} math={math} />);
      i++;
      continue;
    }

    // Headers
    if (line.startsWith('### ')) {
      elements.push(
        <h3 key={`h3-${blockKey++}`} className="text-lg font-bold text-slate-900 mt-4 mb-2 flex items-center gap-2">
          {renderInlineMathAndFormatting(line.slice(4))}
        </h3>
      );
      i++;
      continue;
    }
    if (line.startsWith('#### ')) {
      elements.push(
        <h4 key={`h4-${blockKey++}`} className="text-base font-semibold text-slate-800 mt-3 mb-1">
          {renderInlineMathAndFormatting(line.slice(5))}
        </h4>
      );
      i++;
      continue;
    }
    if (line.startsWith('# ')) {
      elements.push(
        <h1 key={`h1-${blockKey++}`} className="text-2xl font-black text-slate-900 mt-5 mb-3">
          {renderInlineMathAndFormatting(line.slice(2))}
        </h1>
      );
      i++;
      continue;
    }
    if (line.startsWith('## ')) {
      elements.push(
        <h2 key={`h2-${blockKey++}`} className="text-xl font-bold text-slate-900 mt-4 mb-2">
          {renderInlineMathAndFormatting(line.slice(3))}
        </h2>
      );
      i++;
      continue;
    }

    // Blockquote
    if (line.startsWith('> ')) {
      elements.push(
        <blockquote key={`quote-${blockKey++}`} className="border-l-4 border-blue-500 bg-blue-50/60 text-slate-700 pl-4 py-2 my-2 rounded-r-lg italic text-sm">
          {renderInlineMathAndFormatting(line.slice(2))}
        </blockquote>
      );
      i++;
      continue;
    }

    // Bullet List
    if (line.trim().startsWith('- ') || line.trim().startsWith('* ')) {
      const bulletItems: string[] = [];
      while (i < lines.length && (lines[i].trim().startsWith('- ') || lines[i].trim().startsWith('* '))) {
        bulletItems.push(lines[i].trim().slice(2));
        i++;
      }
      elements.push(
        <ul key={`ul-${blockKey++}`} className="list-disc list-outside pl-5 space-y-1 my-2 text-sm text-slate-700">
          {bulletItems.map((item, idx) => (
            <li key={idx}>{renderInlineMathAndFormatting(item)}</li>
          ))}
        </ul>
      );
      continue;
    }

    // Numbered List
    if (/^\d+\.\s/.test(line.trim())) {
      const numItems: string[] = [];
      while (i < lines.length && /^\d+\.\s/.test(lines[i].trim())) {
        numItems.push(lines[i].trim().replace(/^\d+\.\s/, ''));
        i++;
      }
      elements.push(
        <ol key={`ol-${blockKey++}`} className="list-decimal list-outside pl-5 space-y-1 my-2 text-sm text-slate-700">
          {numItems.map((item, idx) => (
            <li key={idx}>{renderInlineMathAndFormatting(item)}</li>
          ))}
        </ol>
      );
      continue;
    }

    // Empty line
    if (!line.trim()) {
      i++;
      continue;
    }

    // Standard Paragraph
    elements.push(
      <p key={`p-${blockKey++}`} className="text-sm leading-relaxed text-slate-700 my-1">
        {renderInlineMathAndFormatting(line)}
      </p>
    );
    i++;
  }

  return elements;
}

// Inline Math & Formatting ($...$, **...**, sources)
function renderInlineMathAndFormatting(text: string): React.ReactNode {
  // Check for inline math $...$
  const parts = text.split(/(\$[^$]+\$|\*\*[^*]+\*\*|\[Sources?:?[^\]]+\])/g);

  return parts.map((part, idx) => {
    if (!part) return null;

    if (part.startsWith('$') && part.endsWith('$') && part.length > 2) {
      const math = part.slice(1, -1);
      try {
        const html = katex.renderToString(math, { throwOnError: false, displayMode: false });
        return <span key={idx} dangerouslySetInnerHTML={{ __html: html }} className="inline-block px-0.5 text-blue-900 font-serif" />;
      } catch (e) {
        return <code key={idx} className="bg-slate-100 px-1 py-0.5 rounded text-xs text-blue-700 font-mono">{part}</code>;
      }
    }

    if (part.startsWith('**') && part.endsWith('**') && part.length > 4) {
      return <strong key={idx} className="font-semibold text-slate-900">{part.slice(2, -2)}</strong>;
    }

    if (part.startsWith('[') && part.includes('Source')) {
      return (
        <span key={idx} className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-md text-xs font-medium my-1">
          <svg className="w-3 h-3 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          {part.slice(1, -1)}
        </span>
      );
    }

    return part;
  });
}

// Block Math Component
const BlockMath: React.FC<{ math: string }> = ({ math }) => {
  try {
    const html = katex.renderToString(math, { throwOnError: false, displayMode: true });
    return (
      <div
        className="my-3 py-3 px-4 bg-slate-50 border border-slate-200 rounded-xl overflow-x-auto text-center text-slate-900 shadow-xs"
        dangerouslySetInnerHTML={{ __html: html }}
      />
    );
  } catch (e) {
    return (
      <pre className="my-2 p-3 bg-red-50 text-red-700 rounded-lg text-xs font-mono">
        {math}
      </pre>
    );
  }
};

// Mermaid Diagram Component
const MermaidBlock: React.FC<{ chart: string }> = ({ chart }) => {
  const [svg, setSvg] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    const renderChart = async () => {
      try {
        const id = `mermaid-${Math.random().toString(36).substring(2, 9)}`;
        const { svg: renderedSvg } = await mermaid.render(id, chart);
        if (isMounted) {
          setSvg(renderedSvg);
          setError(null);
        }
      } catch (err: any) {
        if (isMounted) {
          setError(err.message || 'Diagram syntax rendering error');
        }
      }
    };
    renderChart();
    return () => {
      isMounted = false;
    };
  }, [chart]);

  if (error) {
    return (
      <div className="my-3 p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 font-mono">
        <p className="font-bold mb-1">Visual Flowchart:</p>
        <pre className="whitespace-pre-wrap">{chart}</pre>
      </div>
    );
  }

  return (
    <div className="my-4 p-4 bg-white border border-slate-200 rounded-xl shadow-xs overflow-x-auto flex flex-col items-center justify-center">
      <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 self-start flex items-center gap-1.5">
        <span className="w-2 h-2 rounded-full bg-indigo-500 inline-block"></span>
        Interactive Conceptual Diagram
      </div>
      <div dangerouslySetInnerHTML={{ __html: svg }} className="w-full flex justify-center py-2" />
    </div>
  );
};

// HTML5 Canvas Mathematical Function Plotter
const FunctionPlotBlock: React.FC<{ configStr: string }> = ({ configStr }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [title, setTitle] = useState('Function Graph');

  useEffect(() => {
    try {
      const config = JSON.parse(configStr);
      if (config.title) setTitle(config.title);

      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const width = canvas.width;
      const height = canvas.height;
      const originX = width / 2;
      const originY = height / 2;
      const scaleX = width / 12; // -6 to +6
      const scaleY = height / 12;

      ctx.clearRect(0, 0, width, height);

      // Draw Grid
      ctx.strokeStyle = '#f1f5f9';
      ctx.lineWidth = 1;
      for (let x = 0; x < width; x += scaleX) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }
      for (let y = 0; y < height; y += scaleY) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }

      // Draw Axes
      ctx.strokeStyle = '#94a3b8';
      ctx.lineWidth = 1.5;
      // X axis
      ctx.beginPath();
      ctx.moveTo(0, originY);
      ctx.lineTo(width, originY);
      ctx.stroke();
      // Y axis
      ctx.beginPath();
      ctx.moveTo(originX, 0);
      ctx.lineTo(originX, height);
      ctx.stroke();

      // Axis ticks & labels
      ctx.fillStyle = '#64748b';
      ctx.font = '10px sans-serif';
      ctx.textAlign = 'center';
      for (let val = -5; val <= 5; val++) {
        if (val === 0) continue;
        const px = originX + val * scaleX;
        ctx.fillText(String(val), px, originY + 12);
        const py = originY - val * scaleY;
        ctx.fillText(String(val), originX - 10, py + 3);
      }

      // Plot Functions
      const fns = config.fns || [{ fn: 'x^2 - 5*x + 6', color: '#2563eb' }];
      fns.forEach((item: any) => {
        ctx.strokeStyle = item.color || '#2563eb';
        ctx.lineWidth = 2.5;
        ctx.beginPath();

        let first = true;
        for (let px = 0; px <= width; px += 2) {
          const x = (px - originX) / scaleX;
          let y = 0;
          try {
            // Evaluator for standard functions
            if (item.fn.includes('x^2 - 5*x + 6')) {
              y = x * x - 5 * x + 6;
            } else if (item.fn.includes('x^2 - 4')) {
              y = x * x - 4;
            } else if (item.fn.includes('x^2')) {
              y = x * x;
            } else if (item.fn.includes('sin(x)')) {
              y = Math.sin(x);
            } else if (item.fn.includes('cos(x)')) {
              y = Math.cos(x);
            } else if (item.fn.includes('2*x + 1')) {
              y = 2 * x + 1;
            } else {
              // Simple algebraic expression evaluation
              const sanitized = item.fn.replace(/x/g, `(${x})`).replace(/\^/g, '**');
              y = Function(`"use strict"; return (${sanitized});`)();
            }

            const py = originY - y * scaleY;
            if (py >= -100 && py <= height + 100) {
              if (first) {
                ctx.moveTo(px, py);
                first = false;
              } else {
                ctx.lineTo(px, py);
              }
            }
          } catch (e) {
            // skip invalid point
          }
        }
        ctx.stroke();
      });

    } catch (e) {
      console.warn('Function plot render error:', e);
    }
  }, [configStr]);

  return (
    <div className="my-4 p-4 bg-white border border-slate-200 rounded-xl shadow-xs flex flex-col items-center">
      <div className="w-full flex items-center justify-between mb-2">
        <div className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-blue-600"></span>
          {title}
        </div>
        <span className="text-[11px] text-slate-400 font-mono">Interactive Curve Plot</span>
      </div>
      <canvas
        ref={canvasRef}
        width={460}
        height={260}
        className="w-full max-w-lg rounded-lg border border-slate-100 bg-slate-50/50"
      />
    </div>
  );
};
