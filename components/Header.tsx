
import React from 'react';

const Header: React.FC = () => {
  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-2">
            <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-200">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
              </svg>
            </div>
            <span className="text-xl font-bold text-gray-900 tracking-tight">talk to mee!</span>
          </div>
          <nav className="hidden md:flex space-x-8">
            <a href="#" className="text-gray-500 hover:text-indigo-600 px-3 py-2 text-sm font-medium transition-colors">Dashboard</a>
            <a href="#" className="text-gray-500 hover:text-indigo-600 px-3 py-2 text-sm font-medium transition-colors">Resources</a>
            <a href="#" className="text-gray-500 hover:text-indigo-600 px-3 py-2 text-sm font-medium transition-colors">Settings</a>
          </nav>
          <div className="flex items-center space-x-4">
            <button className="bg-indigo-50 text-indigo-700 px-4 py-2 rounded-lg text-sm font-semibold hover:bg-indigo-100 transition-all">
              TH / EN
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
