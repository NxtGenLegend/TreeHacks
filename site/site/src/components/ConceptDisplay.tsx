import React from 'react';

interface ConceptDisplayProps {
  concepts: string[];
  onConceptClick: (concept: string) => void;
  activeConcept?: string;
}

export function ConceptDisplay({ concepts, onConceptClick, activeConcept }: ConceptDisplayProps) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
      {concepts.map((concept) => (
        <button
          key={concept}
          onClick={() => onConceptClick(concept)}
          className={`
            p-4 rounded-xl text-left transition-all duration-300 transform hover:scale-105
            ${activeConcept === concept
              ? 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-lg scale-105'
              : 'bg-gradient-to-r from-slate-800 to-slate-900 text-white/90 hover:from-violet-600 hover:to-indigo-600 opacity-90 hover:opacity-100'
            }
          `}
        >
          <span className="font-medium">{concept}</span>
        </button>
      ))}
    </div>
  );
}