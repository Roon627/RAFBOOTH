import React, { useState, useMemo } from 'react';
import { soundService } from '../services/soundService';
import { User } from '../types';

interface LayoutProps {
  children: React.ReactNode;
  user?: User | null;
  isGuest?: boolean;
  onLogout?: () => void;
  onLoginClick?: () => void;
  onHomeClick?: () => void;
  navItems?: Array<{
    key: string;
    label: string;
    icon?: string;
    onClick: () => void;
    active?: boolean;
    disabled?: boolean;
    badge?: number;
  }>;
}

const Layout: React.FC<LayoutProps> = ({ children, user, isGuest, onLogout, onLoginClick, onHomeClick, navItems }) => {
  const [isMuted, setIsMuted] = useState(soundService.isMuted());
  const [navOpen, setNavOpen] = useState(false);

  // Handle the sound toggle logic
  const toggleMute = () => {
    const newMute = !isMuted;
    soundService.setMuted(newMute);
    setIsMuted(newMute);
    if (!newMute) soundService.play('pop');
  };

  const toggleNavMenu = () => {
    if (!navOpen) soundService.play('pop');
    setNavOpen((prev) => !prev);
  };

  const handleNavClick = (handler: () => void) => {
    handler();
    setNavOpen(false);
  };

  // Generate some random embers for the background so they look organic
  const embers = useMemo(() => {
    return Array.from({ length: 12 }).map((_, i) => ({
      id: i,
      left: `${Math.random() * 100}%`,
      duration: `${6 + Math.random() * 8}s`,
      delay: `${Math.random() * 5}s`,
      size: `${Math.random() * 4 + 1}px`
    }));
  }, []);

  return (
    <div className="flex flex-col min-h-screen relative">
      {/* 
         Spooky Background Layer 
         This is purely for vibes - mist, rising sparks, and floating icons 
      */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        {/* Soft mist drifting by */}
        <div className="absolute inset-0 bg-gradient-to-t from-purple-900/10 to-transparent opacity-20 animate-mist"></div>
        
        {/* Those little orange sparks rising from the bottom */}
        {embers.map((ember) => (
          <div
            key={ember.id}
            className="absolute bottom-[-10px] bg-orange-500 rounded-full blur-[1px] animate-ember"
            style={{
              left: ember.left,
              width: ember.size,
              height: ember.size,
              '--duration': ember.duration,
              animationDelay: ember.delay
            } as any}
          ></div>
        ))}

        {/* Just some floating assets to fill the negative space */}
        <div className="absolute top-[12%] left-[4%] text-6xl opacity-10 animate-spooky-float select-none">🦇</div>
        <div className="absolute top-[45%] right-[6%] text-7xl opacity-5 animate-spooky-float select-none" style={{ animationDelay: '-1s' }}>👻</div>
        <div className="absolute bottom-[25%] left-[8%] text-5xl opacity-5 animate-spooky-float select-none" style={{ animationDelay: '-3s' }}>🕷️</div>
        
        {/* Creepy little eyes that blink occasionally */}
        <div className="absolute top-[25%] right-[22%] flex gap-2 animate-eye-blink opacity-15">
          <div className="w-2 h-2 bg-red-600 rounded-full shadow-[0_0_8px_#dc2626]"></div>
          <div className="w-2 h-2 bg-red-600 rounded-full shadow-[0_0_8px_#dc2626]"></div>
        </div>
      </div>

      <header className="px-4 sm:px-6 py-4 flex flex-wrap md:flex-nowrap items-center gap-3 sticky top-0 z-50 bg-[#050510]/80 backdrop-blur-md border-b border-purple-900/30">
        <div className="flex items-center gap-3 min-w-[200px] order-1">
          <span className="text-2xl sm:text-3xl animate-spooky-sway inline-block">🎃</span>
          <button
            onClick={onHomeClick || onLoginClick}
            className="text-lg sm:text-3xl font-halloween text-orange-500 drop-shadow-[0_0_15px_rgba(249,115,22,0.4)] tracking-tighter leading-tight text-left"
            title="Back to home"
          >
            SPOOKY <span className="text-purple-400">BOOTH</span>
          </button>
        </div>

        {navItems && navItems.length > 0 && (
          <div className="order-3 md:order-2 flex-1 flex justify-center">
            <div className="relative w-full md:w-auto flex justify-center">
              <button
                onClick={toggleNavMenu}
                className="md:hidden px-4 py-2 rounded-full bg-white/10 text-white/80 text-[11px] font-bold uppercase tracking-[0.35em] border border-white/15"
              >
                {navOpen ? 'Close Menu ✕' : 'Menu ☰'}
              </button>
              <nav
                className={`${navOpen ? 'flex' : 'hidden'} md:flex flex-col md:flex-row items-stretch md:items-center justify-center gap-2 bg-[#050510]/95 md:bg-transparent border border-white/10 md:border-0 rounded-3xl md:rounded-none p-4 md:p-0 absolute md:static top-[calc(100%+0.75rem)] md:top-auto left-1/2 md:left-auto -translate-x-1/2 md:translate-x-0 w-[calc(100vw-1.5rem)] md:w-auto shadow-lg md:shadow-none z-40`}
              >
                {navItems.map(item => (
                  <button
                    key={item.key}
                    onClick={() => handleNavClick(item.onClick)}
                    disabled={item.disabled}
                    className={`flex items-center justify-center gap-2 px-5 py-2 rounded-full border text-[10px] font-bold uppercase tracking-[0.35em] transition-all w-full md:w-auto ${
                      item.active
                        ? 'bg-orange-500/20 text-orange-200 border-orange-500/40 shadow-lg shadow-orange-500/20'
                        : 'bg-white/5 text-white/40 border-white/10 hover:bg-white/10 hover:text-white'
                    } ${item.disabled ? 'opacity-40 cursor-not-allowed' : ''}`.trim()}
                  >
                    {item.icon && <span className="text-sm">{item.icon}</span>}
                    <span>{item.label}</span>
                    {item.badge !== undefined && (
                      <span className="ml-2 px-2 py-0.5 rounded-full bg-white/10 text-white/60 text-[9px] font-semibold">
                        {item.badge}
                      </span>
                    )}
                  </button>
                ))}
              </nav>
            </div>
          </div>
        )}

        <div className="flex items-center gap-3 sm:gap-4 ml-auto order-2 md:order-3">
          {user ? (
            <div className="flex items-center gap-3 sm:gap-4 bg-white/5 border border-white/10 px-3 sm:px-4 py-2 rounded-full backdrop-blur-md">
               <span className="text-xs text-orange-400 font-bold uppercase tracking-widest hidden sm:inline">User: {user.username}</span>
               <button 
                 onClick={onLogout}
                 className="text-[10px] text-white/40 hover:text-red-400 font-bold uppercase transition-colors"
               >
                 Logout
               </button>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              {isGuest && (
                <span className="hidden md:inline text-[10px] text-purple-300 font-bold uppercase tracking-widest border border-purple-300/20 px-3 py-1 rounded-full">
                  Guest Mode 🕯️
                </span>
              )}
              <button 
                onClick={onLoginClick}
                className="bg-orange-500 hover:bg-orange-600 text-white px-5 py-2 rounded-full text-xs font-bold uppercase transition-all shadow-lg shadow-orange-500/20 active:scale-95"
              >
                Sign In 🔮
              </button>
            </div>
          )}
          
          <button 
            onClick={toggleMute}
            className="p-2.5 rounded-full bg-white/5 hover:bg-white/10 transition-colors border border-white/10 text-xl"
          >
            {isMuted ? '🔇' : '🔊'}
          </button>
        </div>
      </header>

      {/* Main app content goes here */}
      <main className="flex-1 flex flex-col relative z-10 w-full max-w-6xl mx-auto px-4 py-6">
        {children}
      </main>
      
      <footer className="p-8 text-center relative z-10 mt-auto">
        <div className="w-full h-px bg-gradient-to-r from-transparent via-purple-900/30 to-transparent mb-6"></div>
        <p className="text-xs text-purple-400/30 font-bold uppercase tracking-[0.3em]">
          © 2026 Spooky BOOTH • Happy New Year 2026 🎉
        </p>
      </footer>
    </div>
  );
};

export default Layout;
