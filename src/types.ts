export interface Course {
  id: string;
  name: string;
  description: string;
  progress: number;
  concepts: string[];
  lectures: Lecture[];
}

export interface Lecture {
  id: string;
  courseId: string;
  number: number;
  title: string;
  concepts: string[];
  content: LectureContent[];
}

export interface LectureContent {
  type: 'header' | 'paragraph';
  content: string;
  hasLatex?: boolean;
}

export interface Note {
  id: string;
  courseId: string;
  lectureId?: string;
  title: string;
  content: string;
  type: 'lecture' | 'general' | 'exam';
  createdAt: string;
}

export interface Question {
  id: string;
  question: string;
  options?: string[];
  correctAnswer: string;
  type: 'mcq' | 'text';
  explanation?: string;
}

export interface Quiz {
  id: string;
  courseId: string;
  lectureId?: string;
  title: string;
  questions: Question[];
  timeLimit: number;
  createdAt: string;
}

export interface UserProgress {
  courseId: string;
  lectureId?: string;
  completed: boolean;
  score: number;
  timeSpent: number;
}