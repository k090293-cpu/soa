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
  const { currentPage, activeProjectDetail, setActiveProjectDetail } = useStudio();

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
    <div className="min-h-screen bg-[#0b0c10] text-[#f3f4f6] selection:bg-blue-600 selection:text-white flex flex-col font-sans">
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

      {/* Admin Panel Modal (Password: 1012) */}
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
