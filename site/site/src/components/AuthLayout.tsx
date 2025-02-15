import React from 'react';
import { GraduationCap } from 'lucide-react';

interface AuthLayoutProps {
  children: React.ReactNode;
}

export function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <div className="min-h-screen bg-slate-900 flex flex-col">
      <div className="flex-1 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <div className="flex justify-center">
            <GraduationCap className="w-12 h-12 text-violet-400" />
          </div>
          <h2 className="mt-6 text-center text-3xl font-extrabold bg-gradient-to-r from-violet-400 to-indigo-400 text-transparent bg-clip-text">
            SmartStudy Hub
          </h2>
        </div>

        <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
          <div className="bg-slate-800 py-8 px-4 shadow-xl sm:rounded-lg sm:px-10 border border-slate-700/50">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}