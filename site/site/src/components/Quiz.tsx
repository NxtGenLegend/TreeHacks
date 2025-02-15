import React, { useState, useEffect } from 'react';
import { useTimer } from 'react-timer-hook';
import { Timer, AlertCircle, ArrowLeft, ArrowRight, CheckCircle, XCircle } from 'lucide-react';
import type { Question } from '../types';

// Placeholder questions that would normally come from AI
const MOCK_QUESTIONS: Question[] = [
  {
    id: '1',
    type: 'mcq',
    question: 'What is a vector in linear algebra?',
    options: [
      'A scalar quantity with only magnitude',
      'A mathematical object with both magnitude and direction',
      'A matrix with one row',
      'A complex number with real and imaginary parts'
    ],
    correctAnswer: 'A mathematical object with both magnitude and direction',
    explanation: 'A vector is a mathematical object that has both magnitude (size) and direction. This is what distinguishes it from a scalar, which only has magnitude.'
  },
  {
    id: '2',
    type: 'mcq',
    question: 'Which operation combines two vectors component-wise?',
    options: [
      'Vector multiplication',
      'Dot product',
      'Vector addition',
      'Cross product'
    ],
    correctAnswer: 'Vector addition',
    explanation: 'Vector addition is performed by adding the corresponding components of two vectors. For example, (a1, b1) + (a2, b2) = (a1+a2, b1+b2).'
  },
  {
    id: '3',
    type: 'text',
    question: 'Explain how the dot product of two vectors relates to the angle between them.',
    correctAnswer: 'The dot product of two vectors equals the product of their magnitudes times the cosine of the angle between them',
    explanation: 'The dot product a·b = |a||b|cos(θ) gives us information about how parallel two vectors are. When the angle is 0°, cos(θ)=1, and when the angle is 90°, cos(θ)=0.'
  }
];

interface QuizProps {
  questions?: Question[];
  timeLimit: number;
  onComplete: (score: number) => void;
}

export function Quiz({ questions = MOCK_QUESTIONS, timeLimit, onComplete }: QuizProps) {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<string[]>(new Array(questions.length).fill(''));
  const [showWarning, setShowWarning] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);

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

  const currentQuestion = questions[currentQuestionIndex];

  const handleAnswer = (answer: string) => {
    const newAnswers = [...answers];
    newAnswers[currentQuestionIndex] = answer;
    setAnswers(newAnswers);
    setShowFeedback(true);
  };

  const handleNext = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
      setShowFeedback(false);
    } else {
      handleComplete();
    }
  };

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
      setShowFeedback(false);
    }
  };

  const handleComplete = () => {
    const score = answers.reduce((acc, answer, index) => {
      return answer === questions[index].correctAnswer ? acc + 1 : acc;
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

  const isAnswered = answers[currentQuestionIndex] !== '';
  const isCorrect = answers[currentQuestionIndex] === currentQuestion.correctAnswer;

  return (
    <div className="max-w-3xl mx-auto">
      {/* Timer and Progress */}
      <div className="sticky top-0 bg-slate-800 rounded-lg p-4 mb-8">
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <Timer className="w-5 h-5 text-slate-400" />
            <span className="text-lg font-semibold text-white">
              {formatTime(hours, minutes, seconds)}
            </span>
          </div>
          <div className="flex items-center space-x-4">
            <button
              onClick={isRunning ? pause : resume}
              className="px-4 py-2 text-sm font-medium text-violet-400 hover:text-violet-300"
            >
              {isRunning ? 'Pause' : 'Resume'}
            </button>
            <div className="flex items-center space-x-2">
              <span className="text-sm font-medium text-slate-400">
                Question {currentQuestionIndex + 1}/{questions.length}
              </span>
              <div className="w-32 bg-slate-700 rounded-full h-2">
                <div
                  className="bg-gradient-to-r from-violet-600 to-indigo-600 h-2 rounded-full transition-all duration-300"
                  style={{
                    width: `${((currentQuestionIndex + 1) / questions.length) * 100}%`,
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Warning */}
      {showWarning && (
        <div className="fixed top-4 right-4 bg-yellow-900/50 border-l-4 border-yellow-500 p-4 rounded-lg shadow-lg backdrop-blur-sm">
          <div className="flex items-center">
            <AlertCircle className="w-5 h-5 text-yellow-500 mr-3" />
            <p className="text-yellow-200">5 minutes remaining!</p>
          </div>
        </div>
      )}

      {/* Question */}
      <div className="bg-slate-800 rounded-lg shadow-lg p-8 mb-6">
        <h3 className="text-xl font-semibold text-white mb-6">{currentQuestion.question}</h3>

        <div className="space-y-4">
          {currentQuestion.type === 'mcq' && currentQuestion.options?.map((option, idx) => (
            <button
              key={idx}
              onClick={() => !showFeedback && handleAnswer(option)}
              disabled={showFeedback}
              className={`w-full text-left p-4 rounded-lg border-2 transition-all duration-200 ${
                showFeedback
                  ? option === currentQuestion.correctAnswer
                    ? 'border-green-500 bg-green-500/10 text-white'
                    : option === answers[currentQuestionIndex]
                    ? 'border-red-500 bg-red-500/10 text-white'
                    : 'border-slate-700 text-slate-400'
                  : 'border-slate-700 hover:border-violet-500 hover:bg-slate-700/50 text-white'
              }`}
            >
              <div className="flex items-center">
                <span className="inline-block w-8 h-8 rounded-full bg-slate-700 text-white font-medium text-center leading-8 mr-3">
                  {String.fromCharCode(65 + idx)}
                </span>
                {option}
                {showFeedback && option === currentQuestion.correctAnswer && (
                  <CheckCircle className="w-5 h-5 text-green-500 ml-2" />
                )}
                {showFeedback && option === answers[currentQuestionIndex] && option !== currentQuestion.correctAnswer && (
                  <XCircle className="w-5 h-5 text-red-500 ml-2" />
                )}
              </div>
            </button>
          ))}
          {currentQuestion.type === 'text' && (
            <div className="space-y-2">
              <textarea
                className="w-full p-4 bg-slate-700 border-2 border-slate-600 rounded-lg text-white focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all duration-200"
                rows={6}
                placeholder="Enter your answer..."
                value={answers[currentQuestionIndex]}
                onChange={(e) => !showFeedback && setAnswers(prev => {
                  const newAnswers = [...prev];
                  newAnswers[currentQuestionIndex] = e.target.value;
                  return newAnswers;
                })}
                disabled={showFeedback}
              />
              {!showFeedback && (
                <div className="flex justify-end">
                  <button
                    onClick={() => handleAnswer(answers[currentQuestionIndex])}
                    className="px-4 py-2 bg-violet-600 text-white rounded-lg hover:bg-violet-700 transition-colors"
                  >
                    Submit Answer
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Feedback */}
        {showFeedback && (
          <div className={`mt-6 p-4 rounded-lg ${
            isCorrect ? 'bg-green-500/10 border-2 border-green-500' : 'bg-red-500/10 border-2 border-red-500'
          }`}>
            <div className="flex items-start space-x-3">
              {isCorrect ? (
                <CheckCircle className="w-6 h-6 text-green-500 mt-1" />
              ) : (
                <XCircle className="w-6 h-6 text-red-500 mt-1" />
              )}
              <div>
                <h4 className="font-semibold text-white mb-2">
                  {isCorrect ? 'Correct!' : 'Incorrect'}
                </h4>
                <p className="text-slate-300">{currentQuestion.explanation}</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Navigation */}
      <div className="flex justify-between">
        <button
          onClick={handlePrevious}
          disabled={currentQuestionIndex === 0}
          className="flex items-center px-4 py-2 text-slate-400 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <ArrowLeft className="w-5 h-5 mr-2" />
          Previous
        </button>
        <button
          onClick={handleNext}
          disabled={!isAnswered}
          className={`flex items-center px-6 py-2 rounded-lg ${
            !isAnswered
              ? 'bg-slate-700 text-slate-500 cursor-not-allowed'
              : 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white hover:from-violet-700 hover:to-indigo-700'
          }`}
        >
          {currentQuestionIndex === questions.length - 1 ? 'Finish' : 'Next'}
          <ArrowRight className="w-5 h-5 ml-2" />
        </button>
      </div>
    </div>
  );
}