import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { Book, FileText, BrainCircuit, Timer, Upload, MessageSquare, X, ChevronLeft, ChevronRight } from 'lucide-react';
import { ConceptDisplay } from './ConceptDisplay';
import { NoteUploader } from './NoteUploader';
import { Quiz } from './Quiz';
import { Chat } from './Chat';
import { ConceptDetails } from './ConceptDetails';
import type { Course, Lecture } from '../types';

interface CourseViewProps {
  course: Course;
  onUploadNote: (file: File, type: 'lecture' | 'general' | 'exam', lectureId?: string) => Promise<void>;
}

export function CourseView({ course, onUploadNote }: CourseViewProps) {
  const [selectedLecture, setSelectedLecture] = useState<Lecture | null>(null);
  const [activeConcept, setActiveConcept] = useState<string | null>(null);
  const [showQuiz, setShowQuiz] = useState(false);
  const [timeLimit, setTimeLimit] = useState(60); // minutes
  const [showUploader, setShowUploader] = useState<'lecture' | 'exam' | 'general' | null>(null);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  const handleConceptClick = (concept: string) => {
    setActiveConcept(concept === activeConcept ? null : concept);
  };

  return (
    <div className="flex h-[calc(100vh-4rem)]">
      {/* Sidebar */}
      <div 
        className={`${
          isSidebarCollapsed ? 'w-16' : 'w-64'
        } bg-slate-900 text-white flex flex-col border-r border-slate-700/50 transition-all duration-300 ease-in-out relative`}
      >
        {/* Collapse Toggle */}
        <button
          onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
          className="absolute -right-4 top-1/2 transform -translate-y-1/2 w-8 h-8 bg-slate-800 border border-slate-700/50 rounded-full flex items-center justify-center text-slate-400 hover:text-white transition-colors z-10"
        >
          {isSidebarCollapsed ? (
            <ChevronRight className="w-5 h-5" />
          ) : (
            <ChevronLeft className="w-5 h-5" />
          )}
        </button>

        <div className={`p-4 border-b border-slate-700/50 ${isSidebarCollapsed ? 'text-center' : ''}`}>
          {isSidebarCollapsed ? (
            <Book className="w-8 h-8 text-violet-400 mx-auto" />
          ) : (
            <>
              <h2 className="text-xl font-semibold text-white">{course.name}</h2>
              <div className="mt-2 flex items-center text-sm text-slate-300">
                <Book className="w-4 h-4 mr-2" />
                <span>{course.lectures.length} Lectures</span>
              </div>
            </>
          )}
        </div>

        <nav className="flex-1 overflow-auto p-4">
          <ul className="space-y-2">
            {course.lectures.map((lecture) => (
              <li key={lecture.id}>
                <button
                  onClick={() => setSelectedLecture(lecture)}
                  className={`w-full text-left px-4 py-2 rounded-lg transition-colors ${
                    selectedLecture?.id === lecture.id
                      ? 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white'
                      : 'text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  {isSidebarCollapsed ? lecture.number : `Lecture ${lecture.number}`}
                </button>
              </li>
            ))}
          </ul>
        </nav>

        {!isSidebarCollapsed && (
          <div className="p-4 border-t border-slate-700/50 space-y-2">
            <button
              onClick={() => setShowQuiz(true)}
              className="w-full flex items-center px-4 py-2 text-slate-300 hover:bg-slate-800 rounded-lg transition-colors"
            >
              <BrainCircuit className="w-5 h-5 mr-3" />
              Take Sample Exam
            </button>
            <button
              onClick={() => setShowUploader('exam')}
              className="w-full flex items-center px-4 py-2 text-slate-300 hover:bg-slate-800 rounded-lg transition-colors"
            >
              <Upload className="w-5 h-5 mr-3" />
              Upload Sample Exam
            </button>
            <button
              onClick={() => setShowUploader('general')}
              className="w-full flex items-center px-4 py-2 text-slate-300 hover:bg-slate-800 rounded-lg transition-colors"
            >
              <FileText className="w-5 h-5 mr-3" />
              Upload Course Notes
            </button>
          </div>
        )}
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden bg-slate-900">
        {selectedLecture ? (
          <>
            {/* Lecture Header */}
            <div className="p-6 border-b border-slate-700/50">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-semibold text-white">
                  Lecture {selectedLecture.number}: {selectedLecture.title}
                </h3>
                <button
                  onClick={() => setSelectedLecture(null)}
                  className="flex items-center text-slate-400 hover:text-white transition-colors"
                >
                  <X className="w-5 h-5 mr-2" />
                  Close Lecture
                </button>
              </div>
              <ConceptDisplay
                concepts={selectedLecture.concepts}
                onConceptClick={handleConceptClick}
                activeConcept={activeConcept || undefined}
              />
            </div>

            {/* Lecture Content and Chat */}
            <div className="flex-1 grid grid-cols-2 gap-6 p-6 overflow-hidden">
              {/* Left Column: Concept Details or Empty */}
              <div className="overflow-auto">
                {activeConcept && (
                  <ConceptDetails
                    concept={activeConcept}
                    content={selectedLecture.content}
                    onClose={() => setActiveConcept(null)}
                  />
                )}
              </div>
              
              {/* Right Column: Chat */}
              <div className="overflow-hidden bg-slate-800/50 rounded-xl">
                <Chat
                  courseId={course.id}
                  lectureId={selectedLecture.id}
                />
              </div>
            </div>
          </>
        ) : (
          <>
            {/* Course Overview */}
            <div className="p-6 border-b border-slate-700/50">
              <h3 className="text-xl font-semibold text-white">Course Overview</h3>
              <p className="mt-2 text-slate-300">{course.description}</p>
            </div>

            {/* Course Chat */}
            <div className="flex-1 p-6">
              <div className="h-full bg-slate-800/50 rounded-xl overflow-hidden">
                <Chat courseId={course.id} />
              </div>
            </div>
          </>
        )}
      </div>

      {/* Modals */}
      {showQuiz && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-auto">
            <div className="p-6 border-b border-slate-700/50">
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-semibold text-white">Sample Exam</h3>
                <div className="flex items-center space-x-4">
                  <div className="flex items-center">
                    <Timer className="w-5 h-5 text-slate-400 mr-2" />
                    <input
                      type="number"
                      value={timeLimit}
                      onChange={(e) => setTimeLimit(parseInt(e.target.value))}
                      className="w-20 px-2 py-1 bg-slate-700 border border-slate-600 rounded text-white"
                    />
                    <span className="ml-2 text-slate-300">minutes</span>
                  </div>
                  <button
                    onClick={() => setShowQuiz(false)}
                    className="text-slate-400 hover:text-white"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
            <div className="p-6">
              <Quiz
                questions={[]}
                timeLimit={timeLimit * 60}
                onComplete={(score) => {
                  console.log('Quiz completed with score:', score);
                  setShowQuiz(false);
                }}
              />
            </div>
          </div>
        </div>
      )}

      {showUploader && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl shadow-2xl max-w-xl w-full">
            <div className="p-6 border-b border-slate-700/50">
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-semibold text-white">
                  Upload {showUploader === 'exam' ? 'Sample Exam' : 'Course Notes'}
                </h3>
                <button
                  onClick={() => setShowUploader(null)}
                  className="text-slate-400 hover:text-white"
                >
                  Close
                </button>
              </div>
            </div>
            <div className="p-6">
              <NoteUploader
                courseId={course.id}
                onUpload={(file) => {
                  onUploadNote(file, showUploader, selectedLecture?.id);
                  setShowUploader(null);
                }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}