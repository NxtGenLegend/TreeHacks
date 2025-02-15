import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Book, BarChart, Plus, Pencil, Trash2 } from 'lucide-react';
import type { Course } from '../types';

interface CourseListProps {
  courses: Course[];
  onAddCourse: () => void;
  onEditCourse: (course: Course) => void;
  onDeleteCourse: (courseId: string) => void;
}

export function CourseList({ courses, onAddCourse, onEditCourse, onDeleteCourse }: CourseListProps) {
  const [hoveredCourse, setHoveredCourse] = useState<string | null>(null);

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-white">Your Courses</h1>
        <button
          onClick={onAddCourse}
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
              <h3 className="text-xl font-semibold text-white mb-2">{course.name}</h3>
              <p className="text-slate-300 mb-4">{course.description}</p>
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
                    onEditCourse(course);
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
    </div>
  );
}