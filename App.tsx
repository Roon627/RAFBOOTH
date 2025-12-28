import React, { useState, useCallback, useEffect, useRef } from 'react';
import Layout from './components/Layout';
import Camera from './components/Camera';
import PhotoEditor from './components/PhotoEditor';
import { AppView, SavedPhoto, Template, User } from './types';
import { TEMPLATES } from './constants';
import { soundService } from './services/soundService';
import { apiService } from './services/apiService';

const App: React.FC = () => {
  // We want people to see the cool templates right away
  const [view, setView] = useState<AppView>(AppView.HOME);
  const [user, setUser] = useState<User | null>(null);
  const [isGuest, setIsGuest] = useState(true);
  const [selectedTemplate, setSelectedTemplate] = useState<Template>(TEMPLATES[0]);
  const [capturedImages, setCapturedImages] = useState<string[]>([]);
  const [gallery, setGallery] = useState<SavedPhoto[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  // Let's check if we already know who this is
  useEffect(() => {
    const cached = localStorage.getItem('spooky_booth_user');
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        setUser(parsed);
        setIsGuest(false);
        refreshVault(parsed.id);
      } catch (e) {
        console.error("Corrupt session data found.");
      }
    }
  }, [refreshVault]);

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
          localStorage.setItem('spooky_booth_user', JSON.stringify(res.user));
          await refreshVault(res.user.id);
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
    setView(AppView.HOME);
  };

  const logOut = () => {
    soundService.play('ghost');
    setUser(null);
    setIsGuest(true);
    localStorage.removeItem('spooky_booth_user');
    setGallery([]);
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
    if (isGuest || !user) {
      // For guests, we just trigger a browser download
      soundService.play('magic');
      const a = document.createElement('a');
      a.href = image;
      a.download = `spooky-strip-${Date.now()}.png`;
      a.click();
      alert("Strip saved to your device! Sign in next time to keep it in your permanent vault. 🎃");
      setView(AppView.HOME);
      return;
    }

    setIsLoading(true);
    soundService.play('magic');
    const photo: SavedPhoto = {
      id: Date.now().toString(),
      url: image,
      timestamp: Date.now()
    };
    
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
    if (confirm("Sure you want to delete this memory? It's permanent! 🕸️")) {
      setIsLoading(true);
      const ok = await apiService.deletePhoto(id, user.id);
      if (ok) setGallery(prev => prev.filter(p => p.id !== id));
      setIsLoading(false);
    }
  };

  const goHome = () => {
    soundService.play('pop');
    setCapturedImages([]);
    setView(AppView.HOME);
  };

  return (
    <Layout user={user} isGuest={isGuest} onLogout={logOut} onLoginClick={() => setView(AppView.AUTH)}>
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
            <h2 className="text-5xl md:text-7xl font-halloween text-orange-400 drop-shadow-[0_10px_15px_rgba(249,115,22,0.3)] uppercase">
              Spooky BOOTH
            </h2>
            <p className="text-purple-300/40 text-sm font-bold uppercase tracking-[0.4em] mt-3">
              Capture your magical moments
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-6 w-full px-4">
            {TEMPLATES.map((t) => (
              <button
                key={t.id}
                onClick={() => pickTemplate(t)}
                className="group relative flex flex-col items-center p-6 bg-white/5 border border-white/10 rounded-[2.5rem] hover:bg-white/10 hover:border-orange-500/30 transition-all transform hover:-translate-y-2 shadow-xl overflow-hidden"
              >
                <div className={`w-full aspect-[2/3.5] mb-5 rounded-2xl bg-gradient-to-b ${t.gradient} flex flex-col p-3 gap-2 border-[5px] ${t.accent} shadow-xl group-hover:scale-105 transition-transform`}>
                   {[...Array(t.photoCount)].map((_, i) => (
                     <div key={i} className="flex-1 bg-white/10 rounded-lg border border-white/10 flex items-center justify-center text-3xl">🖼️</div>
                   ))}
                </div>
                <span className="font-halloween text-xl text-white group-hover:text-orange-400 transition-colors uppercase">{t.name}</span>
                <span className="text-[10px] text-purple-300/50 font-bold uppercase tracking-widest mt-1">{t.photoCount} SNAPS</span>
              </button>
            ))}
          </div>

          <div className="mt-8 flex flex-col items-center gap-4">
            {gallery.length > 0 && (
              <button 
                onClick={() => { soundService.play('ghost'); setView(AppView.GALLERY); }}
                className="text-orange-400 hover:text-orange-300 font-bold text-sm flex items-center gap-2 bg-orange-500/10 px-8 py-3 rounded-full border border-orange-500/20"
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-2xl px-6">
            <button 
              onClick={() => { soundService.play('click'); setView(AppView.CAPTURE); }}
              className="group p-12 bg-white/5 border border-white/10 rounded-[3rem] hover:bg-orange-500/5 hover:border-orange-500/30 transition-all flex flex-col items-center gap-6 shadow-xl"
            >
              <div className="text-6xl group-hover:scale-110 transition-transform">📸</div>
              <span className="font-halloween text-2xl text-white">CAMERA</span>
            </button>
            <button 
              onClick={() => { soundService.play('click'); fileInputRef.current?.click(); }}
              className="group p-12 bg-white/5 border border-white/10 rounded-[3rem] hover:bg-purple-500/5 hover:border-purple-500/30 transition-all flex flex-col items-center gap-6 shadow-xl"
            >
              <div className="text-6xl group-hover:scale-110 transition-transform">📁</div>
              <span className="font-halloween text-2xl text-white">UPLOAD</span>
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
          <PhotoEditor images={capturedImages} template={selectedTemplate} isGuest={isGuest} onSave={saveToVault} onCancel={goHome} />
        </div>
      )}

      {/* Where all the saved strips live */}
      {view === AppView.GALLERY && (
        <div className="flex flex-col gap-10 animate-fadeIn pb-24">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6 bg-white/5 p-8 rounded-[2.5rem] border border-white/10">
            <h2 className="text-3xl font-halloween text-orange-400 uppercase">{user?.username || 'GUEST'}'S VAULT</h2>
            <button onClick={goHome} className="px-10 py-4 bg-orange-500 hover:bg-orange-400 text-white rounded-[2rem] font-halloween text-xl shadow-lg transition-all active:scale-95">NEW STRIP ✨</button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
            {gallery.map((p) => (
              <div key={p.id} className="relative group rounded-[2rem] overflow-hidden shadow-2xl border-[8px] border-white/5 hover:border-orange-500/30 transition-all bg-black/40">
                <img src={p.url} className="w-full h-auto" />
                <div className="absolute inset-0 bg-black/70 opacity-0 group-hover:opacity-100 transition-all flex flex-col items-center justify-center p-6 gap-3 backdrop-blur-sm">
                  <a href={p.url} download={`strip-${p.id}.png`} className="w-full py-3 bg-white text-black text-center font-bold rounded-xl hover:bg-orange-400 hover:text-white transition-all">DOWNLOAD</a>
                  <button onClick={() => burnPhoto(p.id)} className="w-full py-3 bg-red-600/20 text-red-400 border border-red-500/30 font-bold rounded-xl hover:bg-red-600 hover:text-white transition-all">BURN 🔥</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Loading overlay for async magic */}
      {isLoading && (
        <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center pointer-events-none">
          <div className="bg-orange-500 text-white px-8 py-4 rounded-full font-bold animate-pulse shadow-2xl flex items-center gap-3">
             <span>🔮</span> CASTING SPELL...
          </div>
        </div>
      )}
    </Layout>
  );
};

export default App;