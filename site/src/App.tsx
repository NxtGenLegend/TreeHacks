import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, useParams, useNavigate, Navigate } from 'react-router-dom';
import { GraduationCap } from 'lucide-react';
import { CourseList } from './components/CourseList';
import { CourseView } from './components/CourseView';
import { LoginPage } from './components/LoginPage';
import type { Course } from './types';


const MOCK_COURSES: Course[] = [
  {
    id: '1',
    name: 'Introduction to Computer Science',
    startDate: '2024-03-01',
    endDate: '2024-06-30',
    progress: 75,
    concepts: ['Variables', 'Functions', 'Algorithms', 'Data Types', 'Control Flow', 'Arrays'],
    highestQuizScore: 85,
    lectures: [
      {
        id: 'l1',
        courseId: '1',
        number: 1,
        title: 'Introduction to Programming',
        concepts: ['Variables', 'Data Types', 'Basic Syntax'],
        content: [
          {
            type: 'header',
            content: 'Understanding Variables'
          },
          {
            type: 'paragraph',
            content: 'Variables are fundamental building blocks in programming that act as containers for storing data. Think of them as labeled boxes where you can store different types of information. Each variable has a name (the label) and a value (the content inside the box).'
          },
          {
            type: 'header',
            content: 'Types of Variables'
          },
          {
            type: 'paragraph',
            content: 'In programming, we work with several basic types of variables:\n\n1. Numbers: Used for mathematical operations and counting\n2. Strings: Used for text and characters\n3. Booleans: Used for true/false values\n4. Arrays: Used for lists of values\n\nEach type serves a specific purpose and has its own rules for how it can be used and manipulated.'
          }
        ]
      }
    ]
  },
  {
    id: '2',
    name: 'Linear Algebra',
    startDate: '2024-03-15',
    endDate: '2024-07-15',
    progress: 45,
    concepts: ['Vectors', 'Matrices', 'Eigenvalues', 'Linear Transformations', 'Vector Spaces'],
    highestQuizScore: 92,
    lectures: [
      {
        id: 'l2',
        courseId: '2',
        number: 1,
        title: 'Vectors and Vector Operations',
        concepts: ['Vectors', 'Vector Addition', 'Scalar Multiplication', 'Dot Product'],
        content: [
          {
            type: 'header',
            content: 'Introduction to Vectors'
          },
          {
            type: 'paragraph',
            content: 'Vectors are mathematical objects that have both magnitude and direction. In two-dimensional space, a vector can be thought of as an arrow pointing from the origin to a specific point. The vector is defined by its components, which represent how far the arrow extends in each direction.'
          },
          {
            type: 'header',
            content: 'Vector Addition'
          },
          {
            type: 'paragraph',
            content: 'When we add two vectors, we combine their components. This is like moving in one direction according to the first vector, then moving in another direction according to the second vector. The result is a new vector that represents the total movement.\n\nFor example, if vector A moves 3 units right and 2 units up, and vector B moves 1 unit right and 4 units up, their sum would move 4 units right (3+1) and 6 units up (2+4).'
          },
          {
            type: 'header',
            content: 'The Dot Product'
          },
          {
            type: 'paragraph',
            content: 'The dot product is a way to multiply two vectors that results in a single number. This operation is crucial in physics for calculating work and in computer graphics for determining angles between vectors.\n\nWhen we take the dot product of two vectors, we multiply their corresponding components and add the results. The dot product tells us about the relationship between the vectors - specifically, how much they point in the same direction.'
          },
          {
            type: 'header',
            content: 'Vector Magnitude'
          },
          {
            type: 'paragraph',
            content: 'The magnitude of a vector is its length - how far it extends from its starting point to its endpoint. We calculate this using the Pythagorean theorem in multiple dimensions.\n\nFor a two-dimensional vector, if you move 3 units right and 4 units up, the magnitude would be 5 units (using a^2 + b^2 = c^2). This is like finding the length of the hypotenuse of a right triangle.'
          }
        ]
      },
      {
        id: 'l3',
        courseId: '2',
        number: 2,
        title: 'Matrices and Linear Transformations',
        concepts: ['Matrices', 'Matrix Operations', 'Linear Transformations'],
        content: [
          {
            type: 'header',
            content: 'Understanding Matrices'
          },
          {
            type: 'paragraph',
            content: 'A matrix is a rectangular array of numbers arranged in rows and columns. Think of it as a table of values where each position has specific meaning. Matrices are powerful tools used in computer graphics, data analysis, and solving systems of equations.'
          },
          {
            type: 'header',
            content: 'Linear Transformations'
          },
          {
            type: 'paragraph',
            content: 'Linear transformations are special operations that change vectors in predictable ways while preserving important properties. Every linear transformation can be represented by a matrix.\n\nCommon transformations include:\n1. Rotation: Spinning objects around a point\n2. Scaling: Making objects larger or smaller\n3. Reflection: Flipping objects across a line\n4. Shear: Slanting objects while keeping some lines parallel'
          }
        ]
      }
    ]
  }
];

function App() {
  const [courses, setCourses] = useState(MOCK_COURSES);

  const handleAddCourse = (newCourse: Omit<Course, 'id' | 'progress' | 'concepts' | 'lectures'>) => {
    const course: Course = {
      ...newCourse,
      id: Date.now().toString(),
      progress: 0,
      concepts: [],
      lectures: []
    };
    setCourses([...courses, course]);
  };

  const handleEditCourse = (updatedCourse: Course) => {
    setCourses(courses.map(course => 
      course.id === updatedCourse.id ? updatedCourse : course
    ));
  };

  const handleDeleteCourse = (courseId: string) => {
    setCourses(courses.filter(course => course.id !== courseId));
  };

  const handleUploadNote = async (file: File, type: 'lecture' | 'general' | 'exam', lectureId?: string) => {
    console.log('Uploading note:', { file, type, lectureId });
  };

  const handleUpdateQuizScore = (courseId: string, score: number) => {
    setCourses(courses.map(course => {
      if (course.id === courseId) {
        return {
          ...course,
          highestQuizScore: Math.max(score, course.highestQuizScore || 0)
        };
      }
      return course;
    }));
  };

  const [zoomUrl, setZoomUrl] = useState('');

  return (
    <Router>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route
          path="/"
          element={
            <div className="min-h-screen bg-slate-900">
              <nav className="bg-slate-800/50 backdrop-blur-md sticky top-0 z-50 border-b border-slate-700/50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <GraduationCap className="w-8 h-8 text-violet-400" />
                      <span className="ml-2 text-xl font-bold bg-gradient-to-r from-violet-400 to-indigo-400 text-transparent bg-clip-text">
                        SmartStudy Hub
                      </span>
                    </div>
                  </div>
                </div>
              </nav>

              <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <CourseList
                  courses={courses}
                  onAddCourse={handleAddCourse}
                  onEditCourse={handleEditCourse}
                  onDeleteCourse={handleDeleteCourse}
                />
              </main>
            </div>
          }
        />
        <Route
          path="/join_zoom"
          element={
            <div className="min-h-screen bg-slate-900 flex items-center justify-center">
              <div className="bg-slate-800/50 p-8 rounded-lg max-w-lg w-full">
                <h1 className="text-2xl font-bold text-white mb-4">Join Zoom Meeting</h1>
                <p className="text-white opacity-80 mb-4">
                  Please click the button below to join the Zoom meeting for your course.
                </p>
                <input
                  type="text"
                  placeholder="Enter Zoom URL"
                  className="w-full p-2 mb-4 rounded-md bg-slate-700 text-white"
                  onChange={(e) => setZoomUrl(e.target.value)}
                />
                <button
                  className="bg-gradient-to-r from-violet-600 to-indigo-600 text-white px-4 py-2 rounded-md"
                  onClick={() => window.open(zoomUrl, '_blank')}
                >
                  Join Zoom Meeting
                </button>
              </div>
            </div>
          }>
        </Route>
        <Route
          path="/course/:id"
          element={
            <CourseRoute
              courses={courses}
              onUploadNote={handleUploadNote}
              onUpdateQuizScore={handleUpdateQuizScore}
            />
          }
        />
      </Routes>
    </Router>
  );
}

function CourseRoute({ 
  courses, 
  onUploadNote, 
  onUpdateQuizScore 
}: { 
  courses: Course[],
  onUploadNote: (file: File, type: 'lecture' | 'general' | 'exam', lectureId?: string) => Promise<void>,
  onUpdateQuizScore: (courseId: string, score: number) => void
}) {
  const { id } = useParams();
  const navigate = useNavigate();
  const course = courses.find(c => c.id === id);

  if (!course) {
    navigate('/');
    return null;
  }

  return (
    <CourseView
      course={course}
      onUploadNote={onUploadNote}
      onUpdateQuizScore={onUpdateQuizScore}
    />
  );
}

export default App;