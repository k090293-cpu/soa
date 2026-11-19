import React, { useState, useEffect } from 'react';
import { useStudio } from '../context/StudioContext';
import { ArrowUpRight, Lock, Menu, X, ShieldCheck, Sun, Moon } from 'lucide-react';

export const Header: React.FC = () => {
  const {
    navigateTo,
    currentPage,
    setIsAdminModalOpen,
    isAdminLoggedIn,
    config,
    menuContent,
    theme,
    toggleTheme,
  } = useStudio();
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navItems = (menuContent.navMenus && menuContent.navMenus.length > 0
    ? menuContent.navMenus.filter((m) => m.enabled !== false)
    : [
        { id: '1', label: 'HOME', page: 'home' as const, enabled: true },
        { id: '2', label: 'ABOUT', page: 'about' as const, enabled: true },
        { id: '3', label: 'WORKS', page: 'works' as const, enabled: true },
        { id: '4', label: 'SERVICE', page: 'service' as const, enabled: true },
        { id: '5', label: 'CONTACT', page: 'contact' as const, enabled: true },
      ]
  );

  const handleNavClick = (page: 'home' | 'about' | 'works' | 'service' | 'contact') => {
    setMobileMenuOpen(false);
    navigateTo(page);
  };

  return (
    <>
      {/* Top Studio Status Announcement Bar */}
      {config.statusBanner && (
        <aside aria-label="Studio status announcement" className="w-full bg-zinc-950/90 border-b border-zinc-800/80 text-[11px] md:text-xs text-zinc-300 py-1.5 px-4 text-center tracking-tight transition-all">
          <div className="max-w-7xl mx-auto flex items-center justify-center gap-2">
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-blue-500" />
            <span className="font-medium text-zinc-200">{config.statusBanner}</span>
          </div>
        </aside>
      )}

      {/* Main Navigation Bar */}
      <header
        className={`sticky top-0 z-40 w-full transition-all duration-200 ${
          isScrolled
            ? 'bg-[var(--app-header-bg)] backdrop-blur-md border-b border-zinc-800 shadow-lg shadow-black/20'
            : 'bg-transparent border-b border-zinc-800/30'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 md:h-20 flex items-center justify-between gap-2 sm:gap-4 lg:gap-8">
          {/* Zone 1: Brand Wordmark */}
          <button
            onClick={() => handleNavClick('home')}
            className="text-left font-display font-extrabold text-[15px] sm:text-base md:text-lg lg:text-xl tracking-tight text-white hover:text-blue-400 transition-colors whitespace-nowrap min-w-0 truncate flex items-center gap-1.5 cursor-pointer"
          >
            <span className="truncate">PORTFOLIO_SO.A</span>
            <span className="text-blue-500 font-black shrink-0">.</span>
          </button>

          {/* Zone 2: Navigation Links for Each Dedicated Page */}
          {/* 링크형 내비게이션은 lg 이상에서만 노출합니다.
              md 구간(768~1023px)에서는 브랜드 + 액션 버튼과 함께 들어가지 않아
              바깥으로 밀려나므로, 햄버거 메뉴로 통일합니다. */}
          <nav className="hidden lg:flex items-center gap-6 lg:gap-8 text-xs font-semibold tracking-wider">
            {navItems.map((item) => {
              const isActive = currentPage === item.page;
              return (
                <button
                  key={item.page}
                  onClick={() => handleNavClick(item.page)}
                  className={`transition-colors cursor-pointer whitespace-nowrap shrink-0 relative py-1 group ${
                    isActive ? 'text-white' : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  <span>{item.label}</span>
                  <span
                    className={`absolute bottom-0 left-0 h-0.5 bg-blue-500 transition-all duration-200 ${
                      isActive ? 'w-full' : 'w-0 group-hover:w-full'
                    }`}
                  />
                </button>
              );
            })}
          </nav>

          {/* Zone 3: Primary Action & Admin Lock */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            {/* Theme toggle (다크 / 화이트) — 좁은 화면에서는 햄버거 메뉴 안으로 이동 */}
            <button
              onClick={toggleTheme}
              title={theme === 'dark' ? '화이트 모드로 전환' : '다크 모드로 전환'}
              aria-label={theme === 'dark' ? '화이트 모드로 전환' : '다크 모드로 전환'}
              className="hidden sm:flex p-2 rounded-lg border border-zinc-800 hover:border-zinc-700 bg-zinc-900/60 text-zinc-400 hover:text-zinc-200 text-xs items-center gap-1.5 transition-colors cursor-pointer"
            >
              {theme === 'dark' ? (
                <Sun className="w-3.5 h-3.5 text-amber-400" />
              ) : (
                <Moon className="w-3.5 h-3.5 text-blue-400" />
              )}
              <span className="hidden lg:inline text-[11px] font-medium">
                {theme === 'dark' ? 'Light' : 'Dark'}
              </span>
            </button>

            {/* Admin entry trigger — 좁은 화면에서는 햄버거 메뉴 안으로 이동 */}
            <button
              onClick={() => setIsAdminModalOpen(true)}
              title={isAdminLoggedIn ? '관리자 대시보드 열기' : '관리자 로그인'}
              className={`hidden sm:flex p-2 rounded-lg border text-xs items-center gap-1.5 transition-colors cursor-pointer ${
                isAdminLoggedIn
                  ? 'border-blue-500/50 bg-blue-500/10 text-blue-400 hover:bg-blue-500/20'
                  : 'border-zinc-800 hover:border-zinc-700 bg-zinc-900/60 text-zinc-400 hover:text-zinc-200'
              }`}
            >
              {isAdminLoggedIn ? <ShieldCheck className="w-3.5 h-3.5 text-blue-400" /> : <Lock className="w-3.5 h-3.5" />}
              <span className="hidden sm:inline text-[11px] font-medium">{isAdminLoggedIn ? '관리자' : 'Admin'}</span>
            </button>

            {/* Primary Action Button */}
            <button
              onClick={() => handleNavClick('contact')}
              className="px-3 sm:px-4 py-2 text-[11px] sm:text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 active:bg-blue-700 rounded-lg transition-all duration-150 flex items-center gap-1.5 shadow-md shadow-blue-600/20 whitespace-nowrap shrink-0 cursor-pointer"
            >
              <span>프로젝트 문의</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>

            {/* Mobile Hamburger Toggle (lg 미만에서는 항상 노출) */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 -mr-1 text-zinc-400 hover:text-white rounded-lg focus:outline-none shrink-0"
              aria-label="Toggle menu"
              aria-expanded={mobileMenuOpen}
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Dropdown Menu */}
        {mobileMenuOpen && (
          <div className="lg:hidden border-b border-zinc-800 bg-[var(--app-surface-3)] px-6 py-5 space-y-3">
            {navItems.map((item) => (
              <button
                key={item.page}
                onClick={() => handleNavClick(item.page)}
                className={`block w-full text-left py-2 text-sm font-medium transition-colors cursor-pointer ${
                  currentPage === item.page ? 'text-blue-400 font-bold' : 'text-zinc-300 hover:text-white'
                }`}
              >
                {item.label}
              </button>
            ))}
            <div className="pt-3 border-t border-zinc-800 flex items-center justify-between gap-3">
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  setIsAdminModalOpen(true);
                }}
                className="text-xs text-zinc-400 hover:text-white flex items-center gap-1.5 cursor-pointer"
              >
                <Lock className="w-3.5 h-3.5" />
                <span>관리자 로그인</span>
              </button>
              {/* 좁은 화면에서 헤더에서 빠진 테마 전환을 여기서 제공합니다. */}
              <button
                onClick={toggleTheme}
                aria-label={theme === 'dark' ? '화이트 모드로 전환' : '다크 모드로 전환'}
                className="sm:hidden text-xs text-zinc-400 hover:text-white flex items-center gap-1.5 cursor-pointer"
              >
                {theme === 'dark' ? <Sun className="w-3.5 h-3.5 text-amber-400" /> : <Moon className="w-3.5 h-3.5 text-blue-400" />}
                <span>{theme === 'dark' ? '화이트 모드' : '다크 모드'}</span>
              </button>
            </div>
          </div>
        )}
      </header>
    </>
  );
};
