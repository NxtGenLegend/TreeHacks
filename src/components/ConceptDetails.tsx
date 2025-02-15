import React from 'react';
import type { LectureContent } from '../types';

interface ConceptDetailsProps {
  concept: string;
  content: LectureContent[];
  onClose: () => void;
}

export function ConceptDetails({ concept, content, onClose }: ConceptDetailsProps) {
  const relevantContent = content.filter(item => 
    item.content.toLowerCase().includes(concept.toLowerCase())
  );

  return (
    <div className="h-full flex flex-col bg-slate-800/50 rounded-xl">
      <div className="flex justify-between items-center p-6 border-b border-slate-700/50">
        <h3 className="text-xl font-semibold text-white">
          Understanding: {concept}
        </h3>
        <button
          onClick={onClose}
          className="text-slate-400 hover:text-white transition-colors"
        >
          Close
        </button>
      </div>
      
      <div className="flex-1 overflow-auto p-6 space-y-6">
        {content.map((item, index) => (
          <div key={index}>
            {item.type === 'header' ? (
              <h4 className="text-lg font-semibold text-white mb-4">
                {item.content}
              </h4>
            ) : (
              <div className="text-slate-300 whitespace-pre-line">
                {item.content}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}