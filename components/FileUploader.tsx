'use client';

import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { UploadCloud, File, AlertCircle, X, ShieldCheck } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '@/lib/utils';

interface FileUploaderProps {
  onFileLoaded: (content: string, filename: string) => void;
}

export function FileUploader({ onFileLoaded }: FileUploaderProps) {
  const [error, setError] = useState<string | null>(null);

  const onDrop = useCallback((acceptedFiles: File[], rejectedFiles: any[]) => {
    setError(null);
    if (rejectedFiles.length > 0) {
      setError('Please upload a valid .md or .txt file.');
      return;
    }

    const file = acceptedFiles[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const text = e.target?.result;
        if (typeof text === 'string') {
          onFileLoaded(text, file.name);
        }
      };
      reader.onerror = () => {
        setError('Failed to read file. Please try again.');
      };
      reader.readAsText(file);
    }
  }, [onFileLoaded]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'text/markdown': ['.md', '.markdown'],
      'text/plain': ['.txt']
    },
    maxFiles: 1,
    multiple: false
  });

  return (
    <div className="w-full">
      <div
        {...getRootProps()}
        className={cn(
          "relative group cursor-pointer overflow-hidden rounded-xl border border-dashed transition-all duration-200 ease-out",
          "hover:border-blue-500/50 hover:bg-blue-50/50",
          isDragActive ? "border-blue-500 bg-blue-50/80" : "border-slate-300 bg-slate-50"
        )}
      >
        <input {...getInputProps()} />
        <div className="flex flex-col items-center justify-center py-6 px-4 text-center z-10 relative">
          <UploadCloud size={24} className={cn("mb-2 transition-colors", isDragActive ? "text-blue-500" : "text-slate-400")} />
          <h3 className="text-sm font-medium text-slate-700 mb-1">
            {isDragActive ? "Drop here" : "Upload SKILL.md"}
          </h3>
          <p className="text-xs text-slate-500">
            Click or drag here
          </p>
        </div>
      </div>

      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, height: 0, marginTop: 0 }}
            animate={{ opacity: 1, height: 'auto', marginTop: 16 }}
            exit={{ opacity: 0, height: 0, marginTop: 0 }}
            className="overflow-hidden"
          >
            <div className="bg-red-50 text-red-600 text-sm font-medium px-4 py-3 rounded-xl border border-red-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertCircle size={16} />
                {error}
              </div>
              <button onClick={() => setError(null)} className="text-red-400 hover:text-red-600 transition-colors p-1">
                <X size={16} />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
