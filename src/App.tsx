import React from 'react';
import { StudioProvider, useStudio } from './context/StudioContext';
import { HomePage } from './pages/HomePage';
import { AboutPage } from './pages/AboutPage';
import { WorksPage } from './pages/WorksPage';
import { ServicePage } from './pages/ServicePage';
import { ContactPage } from './pages/ContactPage';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { FloatingCTA } from './components/FloatingCTA';
import { ProjectDetailModal } from './components/ProjectDetailModal';
import { AdminModal } from './components/admin/AdminModal';

const AppContent: React.FC = () => {
  const { currentPage, activeProjectDetail, setActiveProjectDetail, isHydrated } = useStudio();

  // 저장본에 IndexedDB 미디어 참조(idb-media://)가 남아 있으면, 실제 이미지로 복원되기 전에
  // <img src="idb-media://..."> 가 렌더되어 브라우저가 알 수 없는 스킴 오류를 냅니다.
  // 복원이 끝날 때까지 아주 짧게 대기 화면을 보여 줍니다.
  // (참조가 없는 일반 방문자는 isHydrated 가 처음부터 true 라 이 화면을 보지 않습니다)
  if (!isHydrated) {
    return (
      <div className="min-h-screen bg-[var(--app-bg)] text-[var(--app-fg)] flex items-center justify-center font-sans">
        <div className="flex flex-col items-center gap-3">
          <div className="w-6 h-6 rounded-full border-2 border-zinc-600 border-t-blue-500 animate-spin" />
          <p className="text-xs text-zinc-400 tracking-wide">이미지 불러오는 중…</p>
        </div>
      </div>
    );
  }

  const renderCurrentPage = () => {
    switch (currentPage) {
      case 'about':
        return <AboutPage />;
      case 'works':
        return <WorksPage />;
      case 'service':
        return <ServicePage />;
      case 'contact':
        return <ContactPage />;
      case 'home':
      default:
        return <HomePage />;
    }
  };

  return (
    <div className="min-h-screen bg-[var(--app-bg)] text-[var(--app-fg)] selection:bg-blue-600 selection:text-white flex flex-col font-sans">
      {/* Top Header with Menu Navigation */}
      <Header />

      {/* Dedicated Page View based on active menu */}
      <main className="flex-1">
        {renderCurrentPage()}
      </main>

      {/* Global Footer */}
      <Footer />

      {/* Conversion Floating Button */}
      <FloatingCTA />

      {/* Deep-Dive Case Study Modal */}
      {activeProjectDetail && (
        <ProjectDetailModal
          project={activeProjectDetail}
          onClose={() => setActiveProjectDetail(null)}
        />
      )}

      {/* Admin Panel Modal */}
      <AdminModal />
    </div>
  );
};

export default function App() {
  return (
    <StudioProvider>
      <AppContent />
    </StudioProvider>
  );
}
