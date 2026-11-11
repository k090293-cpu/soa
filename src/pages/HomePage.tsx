import React from 'react';
import { Hero } from '../components/Hero';
import { About } from '../components/About';
import { Works } from '../components/Works';
import { Services } from '../components/Services';
import { Process } from '../components/Process';
import { Trust } from '../components/Trust';
import { Contact } from '../components/Contact';
import { useStudio } from '../context/StudioContext';
import { ArrowRight, Sparkles } from 'lucide-react';

export const HomePage: React.FC = () => {
  const { navigateTo } = useStudio();

  return (
    <div className="space-y-0 animate-in fade-in duration-200">
      {/* 01. HERO */}
      <Hero />

      {/* 02. ABOUT HIGHLIGHTS */}
      <div className="relative">
        <About />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12 -mt-10 flex justify-end">
          <button
            onClick={() => navigateTo('about')}
            className="text-xs font-bold text-blue-400 hover:text-blue-300 flex items-center gap-1.5 transition-colors cursor-pointer group"
          >
            <span>SO.A 디자이너 소개 & 상세 경력 페이지로 이동</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
      </div>

      {/* 03. SELECTED WORKS */}
      <div className="relative">
        <Works />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12 -mt-10 flex justify-end">
          <button
            onClick={() => navigateTo('works')}
            className="text-xs font-bold text-blue-400 hover:text-blue-300 flex items-center gap-1.5 transition-colors cursor-pointer group"
          >
            <span>전체 포트폴리오 & 케이스 스터디 아카이브 보기</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
      </div>

      {/* 04. SERVICES */}
      <div className="relative">
        <Services />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12 -mt-10 flex justify-end">
          <button
            onClick={() => navigateTo('service')}
            className="text-xs font-bold text-blue-400 hover:text-blue-300 flex items-center gap-1.5 transition-colors cursor-pointer group"
          >
            <span>서비스별 상세 작업 범위 & 견적 가이드 보기</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
      </div>

      {/* 05. PROCESS */}
      <Process />

      {/* 06. TRUST */}
      <Trust />

      {/* 07. CONTACT */}
      <Contact />
    </div>
  );
};
