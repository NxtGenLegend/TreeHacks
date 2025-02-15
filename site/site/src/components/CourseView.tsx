import React, { useState } from 'react';
import { Book, FileText, BrainCircuit, Timer, Upload, MessageSquare, X, ChevronLeft, ChevronRight, Trophy, ArrowLeft, Plus, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { ConceptDisplay } from './ConceptDisplay';
import { NoteUploader } from './NoteUploader';
import { Quiz } from './Quiz';
import { Chat } from './Chat';
import { ConceptDetails } from './ConceptDetails';
import type { Course, Lecture } from '../types';

interface CourseViewProps {
  course: Course;
  onUploadNote: (file: File, type: 'lecture' | 'general' | 'exam', lectureId?: string) => Promise<void>;
  onUpdateQuizScore: (courseId: string, score: number) => void;
}

export function CourseView({ course, onUploadNote, onUpdateQuizScore }: CourseViewProps) {
  const navigate = useNavigate();
  const [selectedLecture, setSelectedLecture] = useState<Lecture | null>(null);
  const [activeConcept, setActiveConcept] = useState<string | null>(null);
  const [showQuiz, setShowQuiz] = useState(false);
  const [timeLimit, setTimeLimit] = useState(60); // minutes
  const [showUploader, setShowUploader] = useState<'lecture' | 'exam' | 'general' | null>(null);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  const handleConceptClick = (concept: string) => {
    setActiveConcept(concept === activeConcept ? null : concept);
  };

  const handleQuizComplete = (score: number) => {
    onUpdateQuizScore(course.id, score);
    setShowQuiz(false);
  };

  const handleAddLecture = () => {
    const nextNumber = course.lectures.length + 1;
    const newLecture: Lecture = {
      id: Date.now().toString(),
      courseId: course.id,
      number: nextNumber,
      title: `Lecture ${nextNumber}`,
      concepts: [],
      content: []
    };

    course.lectures = [...course.lectures, newLecture];
    setSelectedLecture(newLecture);
  };

  const handleDeleteLecture = (lecture: Lecture) => {
    if (lecture.number === 1) return; // Prevent deleting Lecture 1
    
    const updatedLectures = course.lectures.filter(l => l.id !== lecture.id);
    // Renumber remaining lectures
    updatedLectures.forEach((lecture, idx) => {
      lecture.number = idx + 1;
    });
    
    course.lectures = updatedLectures;
    if (selectedLecture?.id === lecture.id) {
      setSelectedLecture(null);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900 flex">
      {/* Sidebar */}
      <div 
        className={`${
          isSidebarCollapsed ? 'w-16' : 'w-64'
        } bg-slate-900 text-white flex flex-col border-r border-slate-700/50 transition-all duration-300 ease-in-out relative`}
      >
        {/* Back Button */}
        <div className="absolute left-0 top-0 p-4 z-10">
          <button
            onClick={() => navigate('/')}
            className="flex items-center justify-center w-8 h-8 bg-slate-800 border border-slate-700/50 rounded-full text-slate-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
        </div>

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
            <Book className="w-8 h-8 text-violet-400 mx-auto mt-8" />
          ) : (
            <>
              <div className="pt-8">
                <h2 className="text-xl font-semibold text-white pl-10">{course.name}</h2>
                <div className="mt-2 flex items-center text-sm text-slate-300 pl-10">
                  <Book className="w-4 h-4 mr-2" />
                  <span>{course.lectures.length} Lectures</span>
                </div>
              </div>
            </>
          )}
        </div>

        <nav className="flex-1 overflow-auto p-4">
          <div className="space-y-2">
            {course.lectures.map((lecture) => (
              <div key={lecture.id} className="group relative">
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
                {!isSidebarCollapsed && lecture.number !== 1 && (
                  <button
                    onClick={() => handleDeleteLecture(lecture)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:text-red-400"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}
          </div>
          {!isSidebarCollapsed && (
            <button
              onClick={handleAddLecture}
              className="w-full mt-4 flex items-center justify-center px-4 py-2 text-slate-300 hover:bg-slate-800 rounded-lg transition-colors border border-dashed border-slate-700"
            >
              <Plus className="w-5 h-5 mr-2" />
              Add Lecture
            </button>
          )}
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
      <div className="flex-1 flex flex-col overflow-hidden">
        {selectedLecture ? (
          <>
            {/* Lecture Header */}
            <div className="p-6 border-b border-slate-700/50">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-semibold text-white">
                  Lecture {selectedLecture.number}: {selectedLecture.title}
                </h3>
                <div className="flex items-center space-x-4">
                  {course.highestQuizScore && (
                    <div className="flex items-center px-3 py-1.5 bg-gradient-to-r from-amber-500/10 to-yellow-500/10 rounded-lg border border-amber-500/20">
                      <Trophy className="w-4 h-4 text-amber-400 mr-2" />
                      <span className="text-amber-300 font-medium">Best Score: {course.highestQuizScore}%</span>
                    </div>
                  )}
                  <button
                    onClick={() => setSelectedLecture(null)}
                    className="flex items-center text-slate-400 hover:text-white transition-colors"
                  >
                    <X className="w-5 h-5 mr-2" />
                    Close Lecture
                  </button>
                </div>
              </div>
              <ConceptDisplay
                concepts={selectedLecture.concepts}
                onConceptClick={handleConceptClick}
                activeConcept={activeConcept || undefined}
              />
            </div>

            {/* Lecture Content and Chat */}
            <div className="flex-1 p-6 overflow-hidden">
              <div className="h-full flex gap-6">
                {/* Left Column: Concept Details */}
                <div 
                  className={`overflow-hidden transition-all duration-500 ease-in-out ${
                    activeConcept 
                      ? 'w-1/2 opacity-100 translate-x-0' 
                      : 'w-0 opacity-0 -translate-x-full'
                  }`}
                >
                  {activeConcept && (
                    <div className="h-full">
                      <ConceptDetails
                        concept={activeConcept}
                        content={selectedLecture.content}
                        onClose={() => setActiveConcept(null)}
                      />
                    </div>
                  )}
                </div>
                
                {/* Right Column: Chat */}
                <div 
                  className={`overflow-hidden bg-slate-800/50 rounded-xl transition-all duration-500 ease-in-out ${
                    activeConcept ? 'w-1/2' : 'w-full'
                  }`}
                >
                  <Chat
                    courseId={course.id}
                    lectureId={selectedLecture.id}
                  />
                </div>
              </div>
            </div>
          </>
        ) : (
          <>
            {/* Course Overview */}
            <div className="p-6 border-b border-slate-700/50">
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-semibold text-white">{course.name}</h3>
                {course.highestQuizScore && (
                  <div className="flex items-center px-3 py-1.5 bg-gradient-to-r from-amber-500/10 to-yellow-500/10 rounded-lg border border-amber-500/20">
                    <Trophy className="w-4 h-4 text-amber-400 mr-2" />
                    <span className="text-amber-300 font-medium">Best Score: {course.highestQuizScore}%</span>
                  </div>
                )}
              </div>
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
                <div className="flex items-center space-x-4">
                  <h3 className="text-xl font-semibold text-white">Sample Exam</h3>
                  {course.highestQuizScore && (
                    <div className="flex items-center px-3 py-1.5 bg-gradient-to-r from-amber-500/10 to-yellow-500/10 rounded-lg border border-amber-500/20">
                      <Trophy className="w-4 h-4 text-amber-400 mr-2" />
                      <span className="text-amber-300 font-medium">Best: {course.highestQuizScore}%</span>
                    </div>
                  )}
                </div>
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
                timeLimit={timeLimit * 60}
                onComplete={handleQuizComplete}
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