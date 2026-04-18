'use client';

import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { FileText, Download, RotateCcw } from 'lucide-react';
import { motion } from 'motion/react';

interface MarkdownViewerProps {
  content: string;
  filename: string;
  onReset: () => void;
}

export function MarkdownViewer({ content, filename, onReset }: MarkdownViewerProps) {
  // Simple file download function for exporting
  const handleExport = () => {
    const blob = new Blob([content], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `exported-${filename}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.5 }}
      className="w-full max-w-5xl mx-auto my-12"
    >
      <div className="bg-white border text-left border-slate-200 shadow-xl shadow-slate-200/40 rounded-3xl overflow-hidden">
        {/* Header toolbar */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-50 border-b border-slate-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center text-blue-600">
              <FileText size={20} strokeWidth={2} />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-slate-800">{filename}</h2>
              <p className="text-xs text-slate-500 font-mono mt-0.5">{content.length.toLocaleString()} bytes</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <button 
              onClick={handleExport}
              className="px-4 py-2 text-sm font-medium text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 hover:text-slate-900 transition-colors flex items-center gap-2"
            >
              <Download size={16} />
              <span className="hidden sm:inline">Export</span>
            </button>
            <button 
              onClick={onReset}
              className="px-4 py-2 text-sm font-medium text-white bg-slate-900 rounded-lg hover:bg-slate-800 transition-colors flex items-center gap-2 shadow-sm"
            >
              <RotateCcw size={16} />
              <span className="hidden sm:inline">Upload New</span>
            </button>
          </div>
        </div>

        {/* Markdown Content */}
        <div className="p-8 sm:p-12 font-sans bg-white">
          <div className="prose prose-slate prose-blue max-w-none 
            prose-headings:font-semibold prose-headings:tracking-tight 
            prose-h1:text-4xl prose-h2:text-3xl prose-h3:text-2xl 
            prose-p:text-slate-600 prose-p:leading-relaxed
            prose-a:text-blue-600 hover:prose-a:text-blue-500 prose-a:no-underline hover:prose-a:underline
            prose-code:text-blue-600 prose-code:bg-blue-50 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded-md prose-code:before:content-none prose-code:after:content-none
            prose-pre:bg-slate-900 prose-pre:text-white prose-pre:rounded-xl prose-pre:shadow-lg
            prose-blockquote:border-l-4 prose-blockquote:border-blue-500 prose-blockquote:bg-blue-50/50 prose-blockquote:py-2 prose-blockquote:px-6 prose-blockquote:not-italic prose-blockquote:text-slate-700
            prose-img:rounded-xl prose-img:shadow-md
            prose-hr:border-slate-200">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {content}
            </ReactMarkdown>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
