import React, { useState, useEffect } from 'react';
import { useTimer } from 'react-timer-hook';
import { Timer, AlertCircle } from 'lucide-react';
import type { Question } from '../types';

interface QuizProps {
  questions: Question[];
  timeLimit: number;
  onComplete: (score: number) => void;
}

export function Quiz({ questions, timeLimit, onComplete }: QuizProps) {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<string[]>([]);
  const [showWarning, setShowWarning] = useState(false);

  const expiryTimestamp = new Date();
  expiryTimestamp.setSeconds(expiryTimestamp.getSeconds() + timeLimit);

  const {
    seconds,
    minutes,
    hours,
    isRunning,
    pause,
    resume
  } = useTimer({
    expiryTimestamp,
    onExpire: () => handleComplete(),
    autoStart: true
  });

  const handleAnswer = (answer: string) => {
    const newAnswers = [...answers];
    newAnswers[currentQuestion] = answer;
    setAnswers(newAnswers);

    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    } else {
      handleComplete();
    }
  };

  const handleComplete = () => {
    const score = answers.reduce((acc, curr, idx) => {
      return curr === questions[idx].correctAnswer ? acc + 1 : acc;
    }, 0);
    onComplete((score / questions.length) * 100);
  };

  const formatTime = (hours: number, minutes: number, seconds: number) => {
    return `${hours.toString().padStart(2, '0')}:${minutes
      .toString()
      .padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  useEffect(() => {
    if (isRunning && minutes === 5 && seconds === 0) {
      setShowWarning(true);
      setTimeout(() => setShowWarning(false), 5000);
    }
  }, [minutes, seconds, isRunning]);

  const question = questions[currentQuestion];

  return (
    <div className="max-w-2xl mx-auto">
      <div className="sticky top-0 bg-white shadow-md rounded-lg p-4 mb-8">
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <Timer className="w-5 h-5 text-gray-500" />
            <span className="text-lg font-semibold text-gray-800">
              {formatTime(hours, minutes, seconds)}
            </span>
          </div>
          <div className="flex items-center space-x-4">
            <button
              onClick={isRunning ? pause : resume}
              className="px-4 py-2 text-sm font-medium text-indigo-600 hover:text-indigo-700"
            >
              {isRunning ? 'Pause' : 'Resume'}
            </button>
            <div className="flex items-center space-x-2">
              <span className="text-sm font-medium text-gray-600">
                Question {currentQuestion + 1}/{questions.length}
              </span>
              <div className="w-32 bg-gray-200 rounded-full h-2">
                <div
                  className="bg-indigo-600 h-2 rounded-full transition-all duration-300"
                  style={{
                    width: `${((currentQuestion + 1) / questions.length) * 100}%`,
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {showWarning && (
        <div className="fixed top-4 right-4 bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-lg shadow-lg">
          <div className="flex items-center">
            <AlertCircle className="w-5 h-5 text-yellow-400 mr-3" />
            <p className="text-yellow-700">5 minutes remaining!</p>
          </div>
        </div>
      )}

      <div className="bg-white rounded-lg shadow-lg p-8">
        <h3 className="text-xl font-semibold text-gray-800 mb-6">{question.question}</h3>

        <div className="space-y-4">
          {question.type === 'mcq' && question.options?.map((option, idx) => (
            <button
              key={idx}
              onClick={() => handleAnswer(option)}
              className="w-full text-left p-4 rounded-lg border-2 border-gray-200 hover:border-indigo-500 hover:bg-indigo-50 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
            >
              <span className="inline-block w-8 h-8 rounded-full bg-gray-100 text-gray-700 font-medium text-center leading-8 mr-3">
                {String.fromCharCode(65 + idx)}
              </span>
              {option}
            </button>
          ))}
          {question.type === 'text' && (
            <div className="space-y-2">
              <textarea
                className="w-full p-4 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200"
                rows={6}
                placeholder="Enter your answer..."
                onBlur={(e) => handleAnswer(e.target.value)}
              />
              <p className="text-sm text-gray-500">
                Press Tab or click outside to save your answer
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}