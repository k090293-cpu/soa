import React, { useState, useEffect } from 'react';
import { useStudio } from '../context/StudioContext';
import { ArrowUpRight, MessageCircle } from 'lucide-react';

export const FloatingCTA: React.FC = () => {
  const { navigateTo } = useStudio();
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      // Show when scrolled down past hero (e.g. 350px)
      setIsVisible(window.scrollY > 350);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-6 right-6 z-30 animate-in fade-in slide-in-from-bottom-4 duration-200">
      <button
        onClick={() => navigateTo('contact')}
        className="group px-4 py-3 bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white rounded-full shadow-2xl shadow-blue-600/40 border border-blue-400/30 flex items-center gap-2 text-xs font-bold transition-all duration-150 hover:scale-105 cursor-pointer"
        aria-label="견적 및 제작 문의하기"
      >
        <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
        <span>프로젝트 문의하기</span>
        <ArrowUpRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
      </button>
    </div>
  );
};
