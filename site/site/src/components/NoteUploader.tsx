import React, { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload } from 'lucide-react';

interface NoteUploaderProps {
  courseId: string;
  onUpload: (file: File, type: 'lecture' | 'general', lectureNumber?: number) => Promise<void>;
}

export function NoteUploader({ courseId, onUpload }: NoteUploaderProps) {
  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (file) {
      // For demo purposes, we'll assume it's a lecture note
      onUpload(file, 'lecture', 1);
    }
  }, [onUpload]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop });

  return (
    <div
      {...getRootProps()}
      className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
        isDragActive 
          ? 'border-violet-500 bg-violet-500/10' 
          : 'border-slate-700 hover:border-violet-500 bg-slate-800/50'
      }`}
    >
      <input {...getInputProps()} />
      <Upload className={`w-12 h-12 mx-auto mb-4 ${isDragActive ? 'text-violet-400' : 'text-slate-400'}`} />
      {isDragActive ? (
        <p className="text-violet-400">Drop your notes here...</p>
      ) : (
        <div>
          <p className="text-slate-300">Drag and drop your notes here, or click to select files</p>
          <p className="text-sm text-slate-500 mt-2">Supported formats: PDF, DOC, DOCX, TXT</p>
        </div>
      )}
    </div>
  );
}