'use client';

import React, { useState, useRef, useEffect } from 'react';
import { FileUploader } from '@/components/FileUploader';
import { ChatMessageBubble, ChatMessage } from '@/components/ChatMessageBubble';
import { Send, Settings, TerminalSquare, AlertCircle, FileText, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'motion/react';

export default function Home() {
  const [settings, setSettings] = useState({
    endpointUrl: "http://localhost:8000",
    pat: "",
    repo: "",
    branch: "main",
    selectedFiles: "",
  });
  
  const [skillMd, setSkillMd] = useState<{content: string, filename: string} | null>(null);
  const [sessionId] = useState(() => crypto.randomUUID());
  
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      content: input,
    };

    setMessages(prev => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    const assistantMessageId = crypto.randomUUID();
    setMessages(prev => [...prev, {
      id: assistantMessageId,
      role: 'assistant',
      content: '',
      isStreaming: true
    }]);

    try {
      const selectedFilesArray = settings.selectedFiles
        .split('\n')
        .map(f => f.trim())
        .filter(f => f.length > 0);

      const response = await fetch(`${settings.endpointUrl.replace(/\/$/, '')}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: userMessage.content,
          session_id: sessionId,
          pat: settings.pat,
          repo: settings.repo,
          branch: settings.branch,
          skill_md: skillMd?.content || "",
          selected_files: selectedFilesArray
        })
      });

      if (!response.ok) {
        const err = await response.text();
        throw new Error(err || 'Response not ok');
      }

      if (!response.body) throw new Error("No response body");

      const reader = response.body.getReader();
      const decoder = new TextDecoder("utf-8");
      
      let done = false;
      let accumulatedContent = '';
      let buffer = '';

      while (!done) {
        const { value, done: readerDone } = await reader.read();
        done = readerDone;
        if (value) {
          buffer += decoder.decode(value, { stream: true });
          
          let newlineIndex;
          while ((newlineIndex = buffer.indexOf('\n')) >= 0) {
            const line = buffer.slice(0, newlineIndex).trim();
            buffer = buffer.slice(newlineIndex + 1);
            
            if (line.startsWith('data:')) {
              const data = line.slice(5).trim();
              if (data === '[DONE]') {
                done = true;
                break;
              }
              if (!data) continue;
              
              try {
                const parsed = JSON.parse(data);
                if (parsed.error) {
                   throw new Error(parsed.error);
                }
                if (parsed.text) {
                  accumulatedContent += parsed.text;
                  setMessages(prev => prev.map(msg => 
                    msg.id === assistantMessageId 
                      ? { ...msg, content: accumulatedContent } 
                      : msg
                  ));
                }
              } catch (e) {
                console.error("Failed to parse SSE chunk:", data, e);
                // The chunk might have been split mid-JSON.
                // Mobile Debug push
                setMessages(prev => {
                  const hasDebug = prev.find(m => m.id === 'debug-error');
                  const errorMsg = `\nFailed parsing chunk:\n${data}\nError: ${e instanceof Error ? e.message : 'Unknown'}`;
                  if (hasDebug) {
                     return prev.map(m => m.id === 'debug-error' ? { ...m, content: m.content + errorMsg } : m);
                  }
                  return [{ id: 'debug-error', role: 'assistant', content: errorMsg }, ...prev];
                });
              }
            }
          }
        }
      }
    } catch (error) {
      console.error(error);
      const errorMessage = error instanceof Error ? error.message : "Something went wrong";
      setMessages(prev => prev.map(msg => 
        msg.id === assistantMessageId 
          ? { ...msg, content: msg.content + `\n\n**Error:** ${errorMessage}` } 
          : msg
      ));
      
      // Mobile Debug push
      setMessages(prev => {
        const hasDebug = prev.find(m => m.id === 'debug-error');
        const errLog = `\n[CRITICAL ERROR] ${errorMessage}`;
        if (hasDebug) {
           return prev.map(m => m.id === 'debug-error' ? { ...m, content: m.content + errLog } : m);
        }
        return [{ id: 'debug-error', role: 'assistant', content: errLog }, ...prev];
      });
      
    } finally {
      setMessages(prev => prev.map(msg => 
        msg.id === assistantMessageId 
          ? { ...msg, isStreaming: false } 
          : msg
      ));
      setIsLoading(false);
    }
  };

  return (
    <main className="h-screen flex overflow-hidden bg-white text-slate-900 font-sans">
      {/* Sidebar / Configuration */}
      <AnimatePresence>
        {isSidebarOpen && (
          <motion.aside
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 340, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            className="h-full border-r border-slate-200 bg-slate-50 flex-shrink-0 flex flex-col overflow-y-auto"
          >
            <div className="p-5 border-b border-slate-200 bg-white sticky top-0 z-10 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white">
                  <TerminalSquare size={16} strokeWidth={2} />
                </div>
                <h1 className="font-semibold tracking-tight text-slate-900">NavGuard AI</h1>
              </div>
              <button 
                onClick={() => setIsSidebarOpen(false)}
                className="p-1.5 rounded-md hover:bg-slate-100 text-slate-500 transition-colors"
                aria-label="Close sidebar"
              >
                <X size={16} />
              </button>
            </div>
            
            <div className="p-5 flex flex-col gap-6">
              <div className="space-y-4">
                <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Backend Config</h2>
                
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700">Endpoint URL</label>
                  <input 
                    type="url"
                    value={settings.endpointUrl}
                    onChange={(e) => setSettings({...settings, endpointUrl: e.target.value})}
                    className="w-full text-sm px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    placeholder="http://localhost:8000"
                  />
                </div>
              </div>

              <div className="space-y-4">
                <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Repository Specs</h2>
                
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700">GitHub PAT</label>
                  <input 
                    type="password"
                    value={settings.pat}
                    onChange={(e) => setSettings({...settings, pat: e.target.value})}
                    className="w-full text-sm px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    placeholder="ghp_..."
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-700">Repository</label>
                    <input 
                      type="text"
                      value={settings.repo}
                      onChange={(e) => setSettings({...settings, repo: e.target.value})}
                      className="w-full text-sm px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                      placeholder="owner/repo"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-700">Branch</label>
                    <input 
                      type="text"
                      value={settings.branch}
                      onChange={(e) => setSettings({...settings, branch: e.target.value})}
                      className="w-full text-sm px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                      placeholder="main"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700">Selected Files (one per line)</label>
                  <textarea 
                    value={settings.selectedFiles}
                    onChange={(e) => setSettings({...settings, selectedFiles: e.target.value})}
                    rows={4}
                    className="w-full text-sm px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 resize-none font-mono text-xs"
                    placeholder="src/main.py&#10;README.md"
                  />
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Agent Skill</h2>
                </div>
                
                {skillMd ? (
                  <div className="p-4 bg-blue-50 border border-blue-100 rounded-xl relative group">
                    <div className="flex items-start gap-3">
                      <FileText className="text-blue-500 mt-0.5 shrink-0" size={18} />
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-slate-900 truncate pr-6">{skillMd.filename}</p>
                        <p className="text-xs text-slate-500 mt-1">{(skillMd.content.length / 1024).toFixed(1)} KB loaded</p>
                      </div>
                    </div>
                    <button 
                      onClick={() => setSkillMd(null)}
                      className="absolute top-3 right-3 p-1.5 bg-white/50 hover:bg-white text-slate-400 hover:text-red-500 rounded-md transition-colors"
                      title="Remove file"
                    >
                      <X size={14} />
                    </button>
                  </div>
                ) : (
                  <FileUploader 
                    onFileLoaded={(content, filename) => setSkillMd({ content, filename })} 
                  />
                )}
              </div>
            </div>
            
            <div className="mt-auto p-5 border-t border-slate-200 bg-slate-50">
               <p className="text-xs text-slate-400 text-center flex items-center justify-center gap-1">
                 Session: <span className="font-mono">{sessionId.slice(0, 8)}</span>
               </p>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col h-full bg-white relative">
        {/* Header */}
        <header className="h-16 border-b border-slate-200 flex items-center px-4 shrink-0 gap-3">
          {!isSidebarOpen && (
            <button 
              onClick={() => setIsSidebarOpen(true)}
              className="p-2 rounded-lg hover:bg-slate-100 text-slate-600 transition-colors"
            >
              <Settings size={18} />
            </button>
          )}
          <div>
            <h2 className="font-medium text-slate-900 leading-none">Code Assistant</h2>
            <p className="text-xs text-slate-500 mt-1">NavGuard Contextual Engine</p>
          </div>
        </header>

        {/* Debug Banner (Visible only on error) */}
        {messages.some(m => m.id === 'debug-error') && (
          <div className="bg-red-50 p-3 text-xs text-red-600 font-mono overflow-auto max-h-32 border-b border-red-100 shrink-0">
             <strong>Debug Log:</strong>
             <pre className="whitespace-pre-wrap">{messages.find(m => m.id === 'debug-error')?.content}</pre>
          </div>
        )}

        {/* Chat Messages */}
        <div className="flex-1 overflow-y-auto px-4 py-6 sm:px-6 md:px-12 scroll-smooth">
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center max-w-sm mx-auto">
              <div className="w-16 h-16 bg-blue-50 text-blue-500 rounded-2xl flex items-center justify-center mb-6 shadow-sm">
                <TerminalSquare size={32} />
              </div>
              <h3 className="text-xl font-semibold text-slate-900 mb-2">How can I help?</h3>
              <p className="text-slate-500 text-sm">
                Ensure your PAT, repository, and files are specified in the sidebar. Ask me to refactor, explain, or generate new code based on your SKILL.md.
              </p>
            </div>
          ) : (
            <div className="max-w-3xl mx-auto flex flex-col">
              {messages.map((msg) => (
                <ChatMessageBubble key={msg.id} message={msg} />
              ))}
              <div ref={messagesEndRef} className="h-4" />
            </div>
          )}
        </div>

        {/* Input Area */}
        <div className="p-4 sm:p-6 bg-white shrink-0 safe-bottom">
          <div className="max-w-3xl mx-auto relative">
            {(!settings.pat || !settings.repo || !settings.selectedFiles) && messages.length === 0 && (
              <div className="absolute -top-12 left-0 right-0 flex justify-center pointer-events-none">
                 <div className="bg-amber-100 border border-amber-200 text-amber-800 text-xs font-semibold px-4 py-2 rounded-full flex items-center gap-2 shadow-sm">
                   <AlertCircle size={14} />
                   Configuration incomplete in sidebar
                 </div>
              </div>
            )}
            <form 
              onSubmit={handleSubmit}
              className="relative rounded-2xl border border-slate-200 bg-white shadow-sm focus-within:ring-2 focus-within:ring-blue-500/20 focus-within:border-blue-500 transition-all overflow-hidden flex"
            >
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSubmit(e);
                  }
                }}
                placeholder="Ask about the selected files..."
                className="w-full max-h-48 min-h-[56px] py-4 pl-4 pr-12 focus:outline-none resize-none bg-transparent text-sm"
                rows={1}
              />
              <button
                type="submit"
                disabled={isLoading || !input.trim() || !settings.pat || !settings.repo}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-xl bg-blue-600 text-white disabled:opacity-50 disabled:bg-slate-100 disabled:text-slate-400 transition-colors"
                aria-label="Send message"
              >
                <Send size={16} className={cn(isLoading && "animate-pulse")} />
              </button>
            </form>
            <div className="text-center mt-3">
              <span className="text-[11px] text-slate-400">NavGuard AI can make mistakes. Consider verifying important information.</span>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
