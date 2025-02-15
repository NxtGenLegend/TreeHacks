import React, { useState, useEffect } from 'react';
import { Book, FileText, Video, X, ChevronLeft, ChevronRight, ArrowLeft, Plus, Trash2, Pencil } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Chat } from './Chat';
import { NoteUploader } from './NoteUploader';
import type { Course, Lecture } from '../types';

interface CourseViewProps {
  course: Course;
  onUploadNote: (file: File, type: 'lecture' | 'general' | 'exam', lectureId?: string) => Promise<void>;
  onUpdateQuizScore: (courseId: string, score: number) => void;
}

interface ZoomMeeting {
  link: string;
  lectureNumber: number;
  title: string;
}

export function CourseView({ course, onUploadNote }: CourseViewProps) {
  const navigate = useNavigate();
  const [selectedLecture, setSelectedLecture] = useState<Lecture | null>(null);
  const [showUploader, setShowUploader] = useState<'lecture' | 'general' | null>(null);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [zoomMeetings, setZoomMeetings] = useState<Record<number, string>>({});
  const [showZoomPrompt, setShowZoomPrompt] = useState(false);
  const [editingLecture, setEditingLecture] = useState<Lecture | null>(null);
  const [zoomForm, setZoomForm] = useState<ZoomMeeting>({
    link: '',
    lectureNumber: course.lectures.length + 1,
    title: ''
  });
  const [createNewLecture, setCreateNewLecture] = useState(false);

  // Set default lecture to Lecture 1
  useEffect(() => {
    if (course.lectures.length > 0 && !selectedLecture) {
      setSelectedLecture(course.lectures[0]);
    }
  }, [course.lectures]);

  const handleAddLecture = (number: number, title: string) => {
    const newLecture: Lecture = {
      id: Date.now().toString(),
      courseId: course.id,
      number,
      title,
      concepts: [],
      content: []
    };

    // Insert the lecture in the correct position
    const updatedLectures = [...course.lectures];
    const insertIndex = updatedLectures.findIndex(l => l.number >= number);
    
    if (insertIndex === -1) {
      updatedLectures.push(newLecture);
    } else {
      // Shift numbers of existing lectures
      for (let i = insertIndex; i < updatedLectures.length; i++) {
        updatedLectures[i].number++;
      }
      updatedLectures.splice(insertIndex, 0, newLecture);
    }

    course.lectures = updatedLectures;
    setSelectedLecture(newLecture);
    return newLecture;
  };

  const handleUpdateLecture = (lecture: Lecture, newNumber: number, newTitle: string) => {
    const updatedLectures = course.lectures.filter(l => l.id !== lecture.id);
    
    const updatedLecture = {
      ...lecture,
      number: newNumber,
      title: newTitle
    };

    // Insert at the correct position
    const insertIndex = updatedLectures.findIndex(l => l.number >= newNumber);
    
    if (insertIndex === -1) {
      updatedLectures.push(updatedLecture);
    } else {
      updatedLectures.splice(insertIndex, 0, updatedLecture);
    }

    // Renumber all lectures
    updatedLectures.sort((a, b) => a.number - b.number);
    updatedLectures.forEach((lecture, idx) => {
      lecture.number = idx + 1;
    });

    course.lectures = updatedLectures;
    setSelectedLecture(updatedLecture);
    setEditingLecture(null);
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
      setSelectedLecture(updatedLectures[0]); // Default back to Lecture 1
    }
  };

  const handleZoomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    let targetLecture = course.lectures.find(l => l.number === zoomForm.lectureNumber);
    
    if (!targetLecture && createNewLecture) {
      targetLecture = handleAddLecture(zoomForm.lectureNumber, zoomForm.title);
    }

    if (targetLecture) {
      setZoomMeetings(prev => ({
        ...prev,
        [targetLecture!.number]: zoomForm.link
      }));
      setSelectedLecture(targetLecture);
    }

    setShowZoomPrompt(false);
    setCreateNewLecture(false);
    setZoomForm({
      link: '',
      lectureNumber: course.lectures.length + 1,
      title: ''
    });
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
                {editingLecture?.id === lecture.id ? (
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      const form = e.target as HTMLFormElement;
                      const number = parseInt(form.lectureNumber.value);
                      const title = form.lectureTitle.value;
                      handleUpdateLecture(lecture, number, title);
                    }}
                    className="flex flex-col space-y-2 p-2 bg-slate-800 rounded-lg"
                  >
                    <input
                      name="lectureNumber"
                      type="number"
                      defaultValue={lecture.number}
                      min="1"
                      className="px-2 py-1 bg-slate-700 border border-slate-600 rounded text-white text-sm"
                      placeholder="Number"
                    />
                    <input
                      name="lectureTitle"
                      type="text"
                      defaultValue={lecture.title.replace(`Lecture ${lecture.number} - `, '')}
                      className="px-2 py-1 bg-slate-700 border border-slate-600 rounded text-white text-sm"
                      placeholder="Title"
                    />
                    <div className="flex justify-end space-x-2">
                      <button
                        type="button"
                        onClick={() => setEditingLecture(null)}
                        className="px-2 py-1 text-sm text-slate-400 hover:text-white"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="px-2 py-1 text-sm bg-violet-600 text-white rounded hover:bg-violet-700"
                      >
                        Save
                      </button>
                    </div>
                  </form>
                ) : (
                  <button
                    onClick={() => setSelectedLecture(lecture)}
                    className={`w-full text-left px-4 py-2 rounded-lg transition-colors ${
                      selectedLecture?.id === lecture.id
                        ? 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white'
                        : 'text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    {isSidebarCollapsed ? lecture.number : `Lecture ${lecture.number} - ${lecture.title.replace(`Lecture ${lecture.number} - `, '')}`}
                  </button>
                )}
                {!isSidebarCollapsed && !editingLecture && (
                  <div className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity flex space-x-1">
                    <button
                      onClick={() => setEditingLecture(lecture)}
                      className="p-1 hover:text-violet-400"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    {lecture.number !== 1 && (
                      <button
                        onClick={() => handleDeleteLecture(lecture)}
                        className="p-1 hover:text-red-400"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
          {!isSidebarCollapsed && (
            <button
              onClick={() => {
                setCreateNewLecture(true);
                setZoomForm(prev => ({
                  ...prev,
                  lectureNumber: course.lectures.length + 1,
                  title: ''
                }));
                setShowZoomPrompt(true);
              }}
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
              onClick={() => {
                setCreateNewLecture(false);
                setShowZoomPrompt(true);
              }}
              className="w-full flex items-center px-4 py-2 text-slate-300 hover:bg-slate-800 rounded-lg transition-colors"
            >
              <Video className="w-5 h-5 mr-3" />
              Join Zoom Meeting
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
        {selectedLecture && (
          <>
            {/* Lecture Header */}
            <div className="p-6 border-b border-slate-700/50">
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-semibold text-white">
                  Lecture {selectedLecture.number} - {selectedLecture.title.replace(`Lecture ${selectedLecture.number} - `, '')}
                </h3>
              </div>
            </div>

            {/* Lecture Content and Chat */}
            <div className="flex-1 p-6 overflow-hidden">
              <div className="h-full flex gap-6">
                {/* Left Column: Zoom Meeting */}
                <div className={`w-1/2 bg-slate-800/50 rounded-xl overflow-hidden ${
                  !zoomMeetings[selectedLecture.number] && 'hidden'
                }`}>
                  {zoomMeetings[selectedLecture.number] && (
                    <iframe
                      src={zoomMeetings[selectedLecture.number]}
                      allow="camera; microphone; fullscreen; display-capture; autoplay"
                      className="w-full h-full"
                    />
                  )}
                </div>
                
                {/* Right Column: Chat */}
                <div className={`overflow-hidden bg-slate-800/50 rounded-xl transition-all duration-500 ease-in-out ${
                  zoomMeetings[selectedLecture.number] ? 'w-1/2' : 'w-full'
                }`}>
                  <Chat
                    courseId={course.id}
                    lectureId={selectedLecture.id}
                  />
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Zoom Link Modal */}
      {showZoomPrompt && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl shadow-2xl max-w-md w-full">
            <div className="p-6 border-b border-slate-700/50">
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-semibold text-white">
                  {createNewLecture ? 'Create New Lecture' : 'Join Zoom Meeting'}
                </h3>
                <button
                  onClick={() => {
                    setShowZoomPrompt(false);
                    setCreateNewLecture(false);
                  }}
                  className="text-slate-400 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
            <form onSubmit={handleZoomSubmit} className="p-6">
              <div className="space-y-4">
                <div>
                  <label htmlFor="lectureNumber" className="block text-sm font-medium text-slate-300 mb-1">
                    Lecture Number
                  </label>
                  <input
                    type="number"
                    id="lectureNumber"
                    min="1"
                    value={zoomForm.lectureNumber}
                    onChange={(e) => setZoomForm(prev => ({ ...prev, lectureNumber: parseInt(e.target.value) }))}
                    className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                    required
                  />
                </div>
                {(createNewLecture || !course.lectures.find(l => l.number === zoomForm.lectureNumber)) && (
                  <div>
                    <label htmlFor="lectureTitle" className="block text-sm font-medium text-slate-300 mb-1">
                      Lecture Title
                    </label>
                    <input
                      type="text"
                      id="lectureTitle"
                      value={zoomForm.title}
                      onChange={(e) => setZoomForm(prev => ({ ...prev, title: e.target.value }))}
                      className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                      placeholder="e.g., Introduction to Thermodynamics"
                      required={createNewLecture}
                    />
                  </div>
                )}
                <div>
                  <label htmlFor="zoomLink" className="block text-sm font-medium text-slate-300 mb-1">
                    Zoom Meeting URL
                  </label>
                  <input
                    type="url"
                    id="zoomLink"
                    value={zoomForm.link}
                    onChange={(e) => setZoomForm(prev => ({ ...prev, link: e.target.value }))}
                    placeholder="https://zoom.us/j/..."
                    className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                    required
                  />
                </div>
                <div className="flex justify-end space-x-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowZoomPrompt(false);
                      setCreateNewLecture(false);
                    }}
                    className="px-4 py-2 text-slate-300 hover:text-white transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2 bg-gradient-to-r from-violet-600 to-indigo-600 text-white rounded-lg hover:from-violet-700 hover:to-indigo-700 transition-colors"
                  >
                    {createNewLecture ? 'Create & Join' : 'Join Meeting'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Note Uploader Modal */}
      {showUploader && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl shadow-2xl max-w-xl w-full">
            <div className="p-6 border-b border-slate-700/50">
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-semibold text-white">
                  Upload Course Notes
                </h3>
                <button
                  onClick={() => setShowUploader(null)}
                  className="text-slate-400 hover:text-white"
                >
                  <X className="w-5 h-5" />
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