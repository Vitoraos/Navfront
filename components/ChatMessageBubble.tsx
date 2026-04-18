'use client';

import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { cn } from '@/lib/utils';
import { Bot, User } from 'lucide-react';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  isStreaming?: boolean;
}

export function ChatMessageBubble({ message }: { message: ChatMessage }) {
  const isUser = message.role === 'user';
  
  return (
    <div className={cn("flex w-full gap-4 py-4", isUser ? "flex-row-reverse" : "flex-row")}>
      <div className={cn(
        "flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center",
        isUser ? "bg-slate-900 text-white" : "bg-blue-600 text-white"
      )}>
        {isUser ? <User size={16} /> : <Bot size={16} />}
      </div>
      <div className={cn(
        "flex flex-col max-w-[80%]",
        isUser ? "items-end" : "items-start"
      )}>
        <div className={cn(
          "px-5 py-3.5 rounded-2xl",
          isUser ? "bg-slate-100 text-slate-900 rounded-tr-sm" : "bg-white border border-slate-200 text-slate-800 shadow-sm rounded-tl-sm"
        )}>
          {isUser ? (
            <p className="whitespace-pre-wrap">{message.content}</p>
          ) : (
            <div className="prose prose-sm prose-slate max-w-none 
              prose-p:leading-relaxed prose-p:my-1
              prose-pre:bg-slate-900 prose-pre:text-slate-50 prose-pre:rounded-xl
              prose-code:text-blue-600 prose-code:bg-blue-50 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded-md prose-code:before:content-none prose-code:after:content-none">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {message.content + (message.isStreaming ? '▍' : '')}
              </ReactMarkdown>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
