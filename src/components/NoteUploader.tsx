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
      className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:border-indigo-500 transition-colors"
    >
      <input {...getInputProps()} />
      <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
      {isDragActive ? (
        <p className="text-indigo-600">Drop your notes here...</p>
      ) : (
        <div>
          <p className="text-gray-600">Drag and drop your notes here, or click to select files</p>
          <p className="text-sm text-gray-500 mt-2">Supported formats: PDF, DOC, DOCX, TXT</p>
        </div>
      )}
    </div>
  );
}