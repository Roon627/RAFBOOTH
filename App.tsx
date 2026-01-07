import React, { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import Layout from './components/Layout';
import Camera from './components/Camera';
import PhotoEditor from './components/PhotoEditor';
import AdminPanel from './components/AdminPanel';
import { AdminGalleryPhoto, AdminHelpSummary, AdminSnapshot, AppView, PopupMode, SavedPhoto, Template, User } from './types';
import { TEMPLATES } from './constants';
import { soundService } from './services/soundService';
import { apiService } from './services/apiService';

const SESSION_KEY = 'chinggus_user';
const LEGACY_SESSION_KEY = 'spooky_booth_user';

const App: React.FC = () => {
  // We want people to see the cool templates right away
  const [view, setView] = useState<AppView>(AppView.HOME);
  const [user, setUser] = useState<User | null>(null);
  const [isGuest, setIsGuest] = useState(true);
  const [selectedTemplate, setSelectedTemplate] = useState<Template>(TEMPLATES[0]);
  const [capturedImages, setCapturedImages] = useState<string[]>([]);
  const [gallery, setGallery] = useState<SavedPhoto[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [pendingImage, setPendingImage] = useState<string | null>(null);
  const [popup, setPopup] = useState<{ message: string; mode: PopupMode; onConfirm?: () => void } | null>(null);
  const [screenshotWarned, setScreenshotWarned] = useState(false);
  const [adminSnapshot, setAdminSnapshot] = useState<AdminSnapshot | null>(null);
  const [adminLoading, setAdminLoading] = useState(false);
  const [adminError, setAdminError] = useState<string | null>(null);
  const [adminTab, setAdminTab] = useState<'wall' | 'stats' | 'users' | 'help'>('wall');
  const [adminGallery, setAdminGallery] = useState<AdminGalleryPhoto[]>([]);
  const [adminGalleryLoading, setAdminGalleryLoading] = useState(false);
  const [adminGalleryError, setAdminGalleryError] = useState<string | null>(null);
  const [adminHelp, setAdminHelp] = useState<AdminHelpSummary | null>(null);
  const [adminHelpLoading, setAdminHelpLoading] = useState(false);
  const [adminHelpError, setAdminHelpError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const showInfo = useCallback((message: string) => {
    setPopup({ message, mode: 'info' });
  }, []);

  const showConfirm = useCallback((message: string, onConfirm: () => void) => {
    setPopup({ message, mode: 'confirm', onConfirm });
  }, []);

  // Login form states
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [authForm, setAuthForm] = useState({ username: '', password: '' });
  const [authError, setAuthError] = useState('');

  const refreshVault = useCallback(async (userId: number) => {
    setIsLoading(true);
    const photos = await apiService.getPhotos(userId);
    setGallery(photos);
    setIsLoading(false);
  }, []);

  const loadAdminSnapshot = useCallback(async (silent: boolean = false) => {
    if (!user?.isAdmin) return;
    if (!silent) setAdminLoading(true);
    setAdminError(null);
    try {
      const res = await apiService.adminSnapshot();
      if (res.success && res.data) {
        setAdminSnapshot(res.data);
      } else {
        setAdminSnapshot(null);
        setAdminError(res.error || 'Unable to load admin data right now.');
      }
    } catch (err) {
      setAdminSnapshot(null);
      setAdminError('Unable to load admin data right now.');
    } finally {
      if (!silent) setAdminLoading(false);
    }
  }, [user]);

  const loadAdminGallery = useCallback(async () => {
    if (!user?.isAdmin) return;
    setAdminGalleryLoading(true);
    setAdminGalleryError(null);
    try {
      const res = await apiService.adminAllPhotos();
      if (res.success && res.photos) {
        setAdminGallery(res.photos);
      } else {
        setAdminGallery([]);
        setAdminGalleryError(res.error || 'Unable to load the wall right now.');
      }
    } catch (err) {
      setAdminGallery([]);
      setAdminGalleryError('Unable to load the wall right now.');
    } finally {
      setAdminGalleryLoading(false);
    }
  }, [user]);

  const loadAdminHelp = useCallback(async () => {
    if (!user?.isAdmin) return;
    setAdminHelpLoading(true);
    setAdminHelpError(null);
    try {
      const res = await apiService.adminHelp();
      if (res.success && res.help) {
        setAdminHelp(res.help);
      } else {
        setAdminHelp(null);
        setAdminHelpError(res.error || 'Unable to load the help brief right now.');
      }
    } catch (err) {
      setAdminHelp(null);
      setAdminHelpError('Unable to load the help brief right now.');
    } finally {
      setAdminHelpLoading(false);
    }
  }, [user]);

  const refreshAdminView = useCallback(() => {
    if (!user?.isAdmin) return;
    if (adminTab === 'wall') {
      void loadAdminGallery();
    } else if (adminTab === 'help') {
      void loadAdminHelp();
    } else {
      void loadAdminSnapshot();
    }
  }, [user, adminTab, loadAdminGallery, loadAdminHelp, loadAdminSnapshot]);

  const handleAdminDeleteUser = useCallback(async (targetId: number) => {
    if (!user?.isAdmin) return;
    if (targetId === user.id) {
      showInfo("You can't delete your own account from here.");
      return;
    }
    setAdminError(null);
    setAdminLoading(true);
    try {
      const ok = await apiService.adminDeleteUser(targetId);
      if (!ok) throw new Error('Failed');
      soundService.play('ghost');
      showInfo('User removed from the vault.');
      await loadAdminSnapshot(true);
    } catch (err) {
      soundService.play('error');
      setAdminError('Unable to delete that user right now.');
    } finally {
      setAdminLoading(false);
    }
  }, [user, loadAdminSnapshot, showInfo]);

  const handleAdminToggleRole = useCallback(async (targetId: number, nextValue: boolean) => {
    if (!user?.isAdmin) return;
    if (targetId === user.id) {
      showInfo('You already have full access here.');
      return;
    }
    setAdminError(null);
    setAdminLoading(true);
    try {
      const ok = await apiService.adminSetRole(targetId, nextValue);
      if (!ok) throw new Error('Failed');
      soundService.play('success');
      await loadAdminSnapshot(true);
      showInfo(nextValue ? 'Promoted to admin.' : 'Admin access revoked.');
    } catch (err) {
      soundService.play('error');
      setAdminError('Unable to update that role right now.');
    } finally {
      setAdminLoading(false);
    }
  }, [user, loadAdminSnapshot, showInfo]);

  // Let's check if we already know who this is
  useEffect(() => {
    let cached = localStorage.getItem(SESSION_KEY);
    let migrated = false;
    if (!cached) {
      cached = localStorage.getItem(LEGACY_SESSION_KEY);
      migrated = Boolean(cached);
    }
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        setUser(parsed);
        setIsGuest(false);
        refreshVault(parsed.id);
        if (migrated) {
          localStorage.setItem(SESSION_KEY, cached);
          localStorage.removeItem(LEGACY_SESSION_KEY);
        }
      } catch (e) {
        console.error("Corrupt session data found.");
      }
    }
  }, [refreshVault]);

  useEffect(() => {
    if (view === AppView.ADMIN) {
      if (!user?.isAdmin) {
        setView(AppView.HOME);
        return;
      }
      if (adminTab === 'wall') {
        void loadAdminGallery();
      } else if (adminTab === 'help') {
        void loadAdminHelp();
      } else {
        void loadAdminSnapshot();
      }
    }
  }, [view, user, adminTab, loadAdminSnapshot, loadAdminGallery, loadAdminHelp]);

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    setIsLoading(true);
    soundService.play('pop');

    try {
      if (authMode === 'login') {
        const res = await apiService.login(authForm.username, authForm.password);
        if (res.success && res.user) {
          setUser(res.user);
          setIsGuest(false);
          setAdminTab('wall');
          setAdminGallery([]);
          setAdminGalleryError(null);
          setAdminHelp(null);
          setAdminHelpError(null);
          setAdminHelpLoading(false);
          localStorage.setItem(SESSION_KEY, JSON.stringify(res.user));
          localStorage.removeItem(LEGACY_SESSION_KEY);
          await refreshVault(res.user.id);
          if (pendingImage) {
            const photo: SavedPhoto = { id: Date.now().toString(), url: pendingImage, timestamp: Date.now() };
            const ok = await apiService.savePhoto(photo, res.user.id);
            if (ok) setGallery(prev => [photo, ...prev]);
            setPendingImage(null);
          }
          setView(AppView.HOME);
        } else {
          setAuthError(res.error || 'The spell failed. Check your name or password.');
          soundService.play('error');
        }
      } else {
        const res = await apiService.register(authForm.username, authForm.password);
        if (res.success) {
          setAuthMode('login');
          setAuthError('Account created! Now you can sign in.');
          soundService.play('magic');
        } else {
          setAuthError(res.error || 'The ritual was interrupted.');
          soundService.play('error');
        }
      }
    } catch (err) {
      setAuthError('Lost connection to the spirit world.');
    } finally {
      setIsLoading(false);
    }
  };

  const startGuestSession = () => {
    soundService.play('ghost');
    setUser(null);
    setIsGuest(true);
    localStorage.removeItem(SESSION_KEY);
    localStorage.removeItem(LEGACY_SESSION_KEY);
    setAdminSnapshot(null);
    setAdminError(null);
    setAdminLoading(false);
    setAdminTab('wall');
    setAdminGallery([]);
    setAdminGalleryError(null);
    setAdminHelp(null);
    setAdminHelpError(null);
    setAdminHelpLoading(false);
    setAdminGalleryLoading(false);
    setView(AppView.HOME);
  };

  const logOut = () => {
    soundService.play('ghost');
    setUser(null);
    setIsGuest(true);
    localStorage.removeItem(SESSION_KEY);
    localStorage.removeItem(LEGACY_SESSION_KEY);
    setGallery([]);
    setAdminSnapshot(null);
    setAdminError(null);
    setAdminLoading(false);
    setAdminTab('wall');
    setAdminGallery([]);
    setAdminGalleryError(null);
    setAdminGalleryLoading(false);
    setAdminHelp(null);
    setAdminHelpError(null);
    setAdminHelpLoading(false);
    setView(AppView.HOME);
  };

  // If someone wants to upload their own pics instead of using the cam
  const onFilePicked = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      soundService.play('magic');
      const loaded: string[] = [];
      let count = 0;
      const target = selectedTemplate.photoCount;
      const selectedFiles = Array.from(files).slice(0, target);
      
      selectedFiles.forEach((file: File) => {
        const reader = new FileReader();
        reader.onload = (ev) => {
          loaded.push(ev.target?.result as string);
          count++;
          if (count === selectedFiles.length) {
            setCapturedImages(loaded);
            setView(AppView.EDIT);
          }
        };
        reader.readAsDataURL(file);
      });
    }
  };

  const pickTemplate = (template: Template) => {
    soundService.play('pop');
    setSelectedTemplate(template);
    setCapturedImages([]);
    setView(AppView.SOURCE_SELECT);
  };

  const onCaptureComplete = useCallback((img: string) => {
    soundService.play('shutter');
    setCapturedImages(prev => {
      const newList = [...prev, img];
      if (newList.length >= selectedTemplate.photoCount) {
        // Move to the editor after a tiny delay so it doesn't feel jarring
        setTimeout(() => setView(AppView.EDIT), 350);
      }
      return newList;
    });
  }, [selectedTemplate.photoCount]);

  const saveToVault = async (image: string) => {
    const photo: SavedPhoto = {
      id: Date.now().toString(),
      url: image,
      timestamp: Date.now()
    };
    
    if (isGuest || !user) {
      setPendingImage(image);
      soundService.play('magic');
      showInfo("We saved this strip. Sign in or create an account to drop it into your vault! 🎉");
      setView(AppView.AUTH);
      return;
    }

    setIsLoading(true);
    soundService.play('magic');
    const ok = await apiService.savePhoto(photo, user.id);
    if (ok) {
      setGallery(prev => [photo, ...prev]);
      setView(AppView.GALLERY);
    } else {
      soundService.play('error');
    }
    setIsLoading(false);
  };

  const burnPhoto = async (id: string) => {
    if (!user) return;
    soundService.play('ghost');
    showConfirm("Sure you want to delete this memory? It's permanent! 🕸️", async () => {
      setIsLoading(true);
      const ok = await apiService.deletePhoto(id, user.id);
      if (ok) setGallery(prev => prev.filter(p => p.id !== id));
      setIsLoading(false);
    });
  };

  const openVault = useCallback(() => {
    if (!user) {
      soundService.play('pop');
      showInfo('Sign in to unlock your Chinggus vault.');
      setView(AppView.AUTH);
      return;
    }
    soundService.play('ghost');
    setView(AppView.GALLERY);
  }, [user, showInfo]);

  const goHome = useCallback(() => {
    soundService.play('pop');
    setCapturedImages([]);
    setView(AppView.HOME);
  }, []);

  const openAdmin = useCallback((nextTab: 'wall' | 'stats' | 'users' | 'help') => {
    if (!user?.isAdmin) return;
    soundService.play('pop');
    setAdminTab(nextTab);
    setView(AppView.ADMIN);
  }, [user]);

  const navItems = useMemo(() => {
    const items: { key: string; label: string; icon: string; onClick: () => void; active: boolean; disabled?: boolean; badge?: number }[] = [
      {
        key: 'home',
        label: 'Templates',
        icon: '🏠',
        active: view === AppView.HOME,
        onClick: goHome
      },
      {
        key: 'vault',
        label: 'Vault',
        icon: '🗃️',
        active: view === AppView.GALLERY,
        onClick: openVault,
        badge: user ? gallery.length : undefined
      }
    ];

    if (user?.isAdmin) {
      items.push(
        {
          key: 'admin-wall',
          label: 'Wall of Fame',
          icon: '🖼️',
          active: view === AppView.ADMIN && adminTab === 'wall',
          onClick: () => openAdmin('wall'),
          badge: adminGallery.length || undefined
        },
        {
          key: 'admin-stats',
          label: 'Live Stats',
          icon: '📊',
          active: view === AppView.ADMIN && adminTab === 'stats',
          onClick: () => openAdmin('stats'),
          badge: adminSnapshot?.stats.totalPhotos
        },
        {
          key: 'admin-users',
          label: 'Users',
          icon: '🧑‍💻',
          active: view === AppView.ADMIN && adminTab === 'users',
          onClick: () => openAdmin('users'),
          badge: adminSnapshot?.users.length
        },
        {
          key: 'admin-help',
          label: 'Help Brief',
          icon: '📝',
          active: view === AppView.ADMIN && adminTab === 'help',
          onClick: () => openAdmin('help')
        }
      );
    }

    return items;
  }, [view, goHome, openVault, user, gallery.length, openAdmin, adminSnapshot, adminTab, adminGallery.length]);

  // Light screenshot deterrent: when the page is blurred/hidden during edit or viewing saved strips, show a warning popup once per session
  useEffect(() => {
    const handleVisibility = () => {
      if (screenshotWarned) return;
      if (view === AppView.EDIT || view === AppView.GALLERY) {
        setScreenshotWarned(true);
        showInfo("Screenshots spotted? Save to your vault instead—it's safer (and looks better)! 📸");
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);
    window.addEventListener('blur', handleVisibility);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibility);
      window.removeEventListener('blur', handleVisibility);
    };
  }, [view, screenshotWarned, showInfo]);

  return (
      <Layout
      user={user}
      isGuest={isGuest}
      onLogout={logOut}
      onLoginClick={() => setView(AppView.AUTH)}
        onHomeClick={goHome}
        navItems={navItems}
    >
      <input type="file" multiple accept="image/*" className="hidden" ref={fileInputRef} onChange={onFilePicked} />

      {/* Login / Register Screen */}
      {view === AppView.AUTH && (
        <div className="flex flex-col items-center py-16 animate-fadeIn min-h-[70vh]">
          <div className="w-full max-w-md bg-black/60 border border-white/10 p-10 rounded-[3rem] backdrop-blur-2xl relative z-10 shadow-2xl">
             <button onClick={goHome} className="absolute top-6 right-8 text-white/20 hover:text-white transition-colors">✕</button>

             <div className="text-center mb-10">
               <span className="text-6xl block animate-spooky-float mb-4">🔮</span>
               <h2 className="text-4xl font-halloween text-orange-400">SIGN IN</h2>
               <p className="text-purple-300/40 text-[10px] font-bold uppercase tracking-widest mt-2">Access your ghoulish vault</p>
             </div>

             <form onSubmit={handleAuthSubmit} className="space-y-5">
                <input 
                  type="text" required placeholder="User Name" value={authForm.username}
                  onChange={(e) => setAuthForm({...authForm, username: e.target.value})}
                  className="w-full bg-black/40 border border-white/5 rounded-2xl px-6 py-4 text-white focus:border-orange-500 outline-none transition-all placeholder:text-white/10"
                />
                <input 
                  type="password" required placeholder="Spell Word" value={authForm.password}
                  onChange={(e) => setAuthForm({...authForm, password: e.target.value})}
                  className="w-full bg-black/40 border border-white/5 rounded-2xl px-6 py-4 text-white focus:border-orange-500 outline-none transition-all placeholder:text-white/10"
                />

                {authError && <div className="text-red-400 text-xs text-center bg-red-400/5 p-3 rounded-xl border border-red-400/10">{authError}</div>}

                <button type="submit" disabled={isLoading} className="w-full py-5 bg-gradient-to-r from-orange-500 to-red-600 text-white font-halloween text-2xl rounded-[2rem] shadow-lg hover:scale-[1.02] active:scale-95 transition-all">
                  {isLoading ? 'WORKING...' : (authMode === 'login' ? 'LOGIN' : 'JOIN US')}
                </button>
             </form>

             <div className="mt-8 flex flex-col items-center gap-6">
                <button 
                  onClick={() => { setAuthMode(authMode === 'login' ? 'register' : 'login'); setAuthError(''); soundService.play('pop'); }}
                  className="text-purple-300/40 hover:text-orange-400 font-bold text-xs transition-colors"
                >
                  {authMode === 'login' ? "New here? Register now" : "Back to Login"}
                </button>
                <div className="w-full h-px bg-white/5"></div>
                <button onClick={startGuestSession} className="text-white/20 hover:text-white font-bold text-[10px] uppercase tracking-widest">Continue as Guest 👻</button>
             </div>
          </div>
        </div>
      )}

      {/* Main Home Screen with Templates */}
      {view === AppView.HOME && (
        <div className="flex flex-col items-center gap-12 py-8 animate-fadeIn">
            <div className="text-center">
              <h2 className="text-5xl md:text-7xl font-halloween heading-main text-orange-400 drop-shadow-[0_10px_15px_rgba(249,115,22,0.3)] uppercase">
              Chinggus
            </h2>
            <p className="text-purple-300/40 text-sm font-bold uppercase tracking-[0.4em] mt-3">
              Capture your magical moments
            </p>
          </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-x-3 gap-y-5 sm:gap-4 w-full max-w-5xl px-3 sm:px-6 mx-auto justify-items-center">
              {TEMPLATES.map((t) => (
                <button
                  key={t.id}
                  onClick={() => pickTemplate(t)}
                  className="group relative flex w-full max-w-[180px] flex-col items-center rounded-2xl sm:rounded-[2rem] border border-white/10 bg-white/5 p-4 sm:p-5 hover:-translate-y-2 hover:bg-white/10 hover:border-orange-500/30 transition-all shadow-xl overflow-hidden"
                >
                  <div className={`w-full aspect-[3/4] mb-3 sm:mb-4 rounded-xl border-[2px] sm:border-[4px] ${t.accent} bg-black/40 overflow-hidden flex items-center justify-center shadow-xl group-hover:scale-105 transition-transform`}>
                    <img
                      src={t.frameUrl}
                      alt={`${t.name} template preview`}
                      className="w-full h-full object-contain"
                      loading="lazy"
                    />
                  </div>
                <span className="font-halloween text-base sm:text-lg text-white group-hover:text-orange-400 transition-colors uppercase text-center">{t.name}</span>
                <span className="mt-1 text-[9px] sm:text-[10px] text-purple-300/50 font-bold uppercase tracking-widest">{t.photoCount} SNAPS</span>
              </button>
            ))}
          </div>

      <div className="mt-8 pt-2 grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-xl px-2 sm:px-0 justify-items-center">
            {!user && (
              <div className="col-span-full w-full text-center text-xs sm:text-sm text-orange-200 bg-orange-500/10 border border-orange-500/30 rounded-2xl px-4 py-3">
                Saving your strips requires an account. Create one or sign in to keep your magic forever.
              </div>
            )}
            {gallery.length > 0 && (
              <button 
                onClick={openVault}
                className="text-orange-400 hover:text-orange-300 font-bold text-sm flex items-center justify-center gap-2 bg-orange-500/10 px-6 py-3 rounded-full border border-orange-500/20 w-full"
              >
                OPEN VAULT ({gallery.length}) →
              </button>
            )}
            {!user && <p className="text-[10px] text-white/20 font-bold uppercase tracking-widest">Sign in to save your memories forever 🕸️</p>}
          </div>
        </div>
      )}

      {/* Step 2: Camera or Upload? */}
      {view === AppView.SOURCE_SELECT && (
        <div className="flex flex-col items-center gap-10 py-20 animate-slideUp">
          <h2 className="text-4xl font-halloween text-white uppercase">Choose Your Source</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 w-full max-w-2xl px-4 sm:px-6">
            <button 
              onClick={() => { soundService.play('click'); setView(AppView.CAPTURE); }}
              className="group p-8 sm:p-10 bg-white/5 border border-white/10 rounded-[1.75rem] sm:rounded-[3rem] hover:bg-orange-500/5 hover:border-orange-500/30 transition-all flex flex-col items-center gap-5 sm:gap-6 shadow-xl"
            >
              <div className="text-5xl sm:text-6xl group-hover:scale-110 transition-transform">📸</div>
              <span className="font-halloween text-xl sm:text-2xl text-white">CAMERA</span>
            </button>
            <button 
              onClick={() => { soundService.play('click'); fileInputRef.current?.click(); }}
              className="group p-8 sm:p-10 bg-white/5 border border-white/10 rounded-[1.75rem] sm:rounded-[3rem] hover:bg-purple-500/5 hover:border-purple-500/30 transition-all flex flex-col items-center gap-5 sm:gap-6 shadow-xl"
            >
              <div className="text-5xl sm:text-6xl group-hover:scale-110 transition-transform">📁</div>
              <span className="font-halloween text-xl sm:text-2xl text-white">UPLOAD</span>
            </button>
          </div>
          <button onClick={goHome} className="text-white/20 hover:text-white font-bold uppercase tracking-widest text-xs">← Back to Designs</button>
        </div>
      )}

      {/* The actual photo booth logic */}
      {view === AppView.CAPTURE && (
        <div className="animate-slideUp py-8">
          <Camera currentPhotoIndex={capturedImages.length} totalPhotos={selectedTemplate.photoCount} onCapture={onCaptureComplete} onCancel={goHome} />
        </div>
      )}

      {/* Adding filters and stickers */}
      {view === AppView.EDIT && (
        <div className="animate-slideUp">
          <PhotoEditor images={capturedImages} template={selectedTemplate} isGuest={isGuest} onSave={saveToVault} onCancel={goHome} onPopup={showInfo} />
        </div>
      )}

      {/* Where all the saved strips live */}
      {view === AppView.GALLERY && (
        <div className="flex flex-col gap-10 animate-fadeIn pb-24">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6 bg-white/5 p-8 rounded-[2.5rem] border border-white/10">
            <h2 className="text-3xl font-halloween text-orange-400 uppercase">{user?.username || 'GUEST'}'S VAULT</h2>
            <button onClick={goHome} className="px-10 py-4 bg-orange-500 hover:bg-orange-400 text-white rounded-[2rem] font-halloween text-xl shadow-lg transition-all active:scale-95">NEW STRIP ✨</button>
          </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 sm:gap-6 xl:gap-8">
            {gallery.map((p) => (
                <div key={p.id} className="relative group overflow-hidden rounded-xl sm:rounded-[2rem] shadow-2xl border-[4px] sm:border-[8px] border-white/5 hover:border-orange-500/30 transition-all bg-black/40">
                <img
                  src={p.url}
                    className="w-full h-auto select-none"
                  onContextMenu={(e) => { e.preventDefault(); showInfo("Hands off! Join in to save your own spooks. 🎃"); }}
                  draggable={false}
                />
                  <div className="absolute inset-0 bg-black/70 opacity-0 group-hover:opacity-100 transition-all flex flex-col items-center justify-center p-4 sm:p-6 gap-2 sm:gap-3 backdrop-blur-sm">
                    <a href={p.url} download={`strip-${p.id}.png`} className="w-full py-2 sm:py-3 bg-white text-black text-center font-bold rounded-lg sm:rounded-xl hover:bg-orange-400 hover:text-white transition-all">DOWNLOAD</a>
                    <button onClick={() => burnPhoto(p.id)} className="w-full py-2 sm:py-3 bg-red-600/20 text-red-400 border border-red-500/30 font-bold rounded-lg sm:rounded-xl hover:bg-red-600 hover:text-white transition-all">BURN 🔥</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {view === AppView.ADMIN && user?.isAdmin && (
        <AdminPanel
          mode={adminTab}
          snapshot={adminSnapshot}
          gallery={adminGallery}
          help={adminHelp}
          loading={
            adminTab === 'wall'
              ? adminGalleryLoading
              : adminTab === 'help'
                ? adminHelpLoading
                : adminLoading
          }
          error={
            adminTab === 'wall'
              ? adminGalleryError
              : adminTab === 'help'
                ? adminHelpError
                : adminError
          }
          helpError={adminHelpError}
          onRefresh={refreshAdminView}
          onDeleteUser={handleAdminDeleteUser}
          onToggleAdmin={handleAdminToggleRole}
          currentUserId={user.id}
        />
      )}

      {/* Loading overlay for async magic */}
      {isLoading && (
        <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center pointer-events-none">
          <div className="bg-orange-500 text-white px-8 py-4 rounded-full font-bold animate-pulse shadow-2xl flex items-center gap-3">
             <span>🔮</span> CASTING SPELL...
          </div>
        </div>
      )}

      {popup && (
        <div className="fixed inset-0 z-[200] bg-black/70 backdrop-blur-sm flex items-center justify-center px-4">
          <div className="bg-[#0b0b1a] border border-white/10 rounded-3xl shadow-2xl max-w-sm w-full p-6 text-center">
            <div className="text-4xl mb-3">✨</div>
            <p className="text-white mb-6 text-sm">{popup.message}</p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              {popup.mode === 'confirm' && (
                <button
                  onClick={() => { popup.onConfirm?.(); setPopup(null); }}
                  className="flex-1 bg-orange-500 text-white py-3 rounded-2xl font-bold hover:bg-orange-400 transition-all"
                >
                  Do it!
                </button>
              )}
              <button
                onClick={() => setPopup(null)}
                className="flex-1 bg-white/10 text-white py-3 rounded-2xl font-bold hover:bg-white/20 transition-all"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default App;
