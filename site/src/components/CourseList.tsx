import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Book, BarChart, Plus, Pencil, Trash2, Calendar } from 'lucide-react';
import type { Course } from '../types';

interface CourseListProps {
  courses: Course[];
  onAddCourse: (course: Omit<Course, 'id' | 'progress' | 'concepts' | 'lectures'>) => void;
  onEditCourse: (course: Course) => void;
  onDeleteCourse: (courseId: string) => void;
}

interface CourseFormData {
  name: string;
  startDate: string;
  endDate: string;
}

export function CourseList({ courses, onAddCourse, onEditCourse, onDeleteCourse }: CourseListProps) {
  const [hoveredCourse, setHoveredCourse] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);
  const [formData, setFormData] = useState<CourseFormData>({
    name: '',
    startDate: '',
    endDate: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (editingCourse) {
      onEditCourse({
        ...editingCourse,
        ...formData
      });
    } else {
      onAddCourse(formData);
    }
    
    handleCloseModal();
  };

  const handleOpenModal = (course?: Course) => {
    if (course) {
      setEditingCourse(course);
      setFormData({
        name: course.name,
        startDate: course.startDate,
        endDate: course.endDate
      });
    } else {
      setEditingCourse(null);
      setFormData({
        name: '',
        startDate: '',
        endDate: ''
      });
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingCourse(null);
    setFormData({
      name: '',
      startDate: '',
      endDate: ''
    });
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-white">Your Courses</h1>
        <button
          onClick={() => handleOpenModal()}
          className="flex items-center px-4 py-2 bg-gradient-to-r from-violet-600 to-indigo-600 text-white rounded-lg hover:from-violet-700 hover:to-indigo-700 transition-all transform hover:-translate-y-0.5"
        >
          <Plus className="w-5 h-5 mr-2" />
          Add Course
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {courses.map((course) => (
          <div
            key={course.id}
            className="relative group"
            onMouseEnter={() => setHoveredCourse(course.id)}
            onMouseLeave={() => setHoveredCourse(null)}
          >
            <Link
              to={`/course/${course.id}`}
              className="block bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl shadow-xl hover:shadow-2xl transition-all transform hover:-translate-y-1 p-6"
            >
              <div className="flex items-center justify-between mb-4">
                <Book className="w-8 h-8 text-violet-400" />
                <div className="flex items-center">
                  <BarChart className="w-4 h-4 text-slate-400 mr-2" />
                  <span className="text-sm text-slate-300">{course.progress}% Complete</span>
                </div>
              </div>
              <h3 className="text-xl font-semibold text-white mb-4">{course.name}</h3>
              <div className="flex items-center text-sm text-slate-400 mb-4">
                <Calendar className="w-4 h-4 mr-2" />
                <span>{new Date(course.startDate).toLocaleDateString()} - {new Date(course.endDate).toLocaleDateString()}</span>
              </div>
              <div className="w-full bg-slate-700 rounded-full h-2.5 overflow-hidden">
                <div
                  className="bg-gradient-to-r from-violet-600 to-indigo-600 h-2.5 rounded-full transition-all duration-500 ease-out"
                  style={{ width: `${course.progress}%` }}
                />
              </div>
            </Link>
            {hoveredCourse === course.id && (
              <div className="absolute top-4 right-4 flex space-x-2">
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    handleOpenModal(course);
                  }}
                  className="p-2 bg-slate-700 rounded-full shadow-md hover:bg-slate-600 transition-colors"
                >
                  <Pencil className="w-4 h-4 text-slate-200" />
                </button>
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    onDeleteCourse(course.id);
                  }}
                  className="p-2 bg-slate-700 rounded-full shadow-md hover:bg-red-600 transition-colors"
                >
                  <Trash2 className="w-4 h-4 text-slate-200" />
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Course Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl shadow-2xl max-w-md w-full">
            <div className="p-6 border-b border-slate-700/50">
              <h3 className="text-xl font-semibold text-white">
                {editingCourse ? 'Edit Course' : 'Add New Course'}
              </h3>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-slate-300 mb-1">
                  Course Name
                </label>
                <input
                  type="text"
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                  required
                />
              </div>
              <div>
                <label htmlFor="startDate" className="block text-sm font-medium text-slate-300 mb-1">
                  Start Date
                </label>
                <input
                  type="date"
                  id="startDate"
                  value={formData.startDate}
                  onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                  className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                  required
                />
              </div>
              <div>
                <label htmlFor="endDate" className="block text-sm font-medium text-slate-300 mb-1">
                  End Date
                </label>
                <input
                  type="date"
                  id="endDate"
                  value={formData.endDate}
                  onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                  className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                  required
                />
              </div>
              <div className="flex justify-end space-x-4 pt-4">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="px-4 py-2 text-slate-300 hover:text-white transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-gradient-to-r from-violet-600 to-indigo-600 text-white rounded-lg hover:from-violet-700 hover:to-indigo-700 transition-colors"
                >
                  {editingCourse ? 'Save Changes' : 'Add Course'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}