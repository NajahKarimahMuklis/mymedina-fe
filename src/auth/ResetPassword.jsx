import { useState, useEffect } from 'react';
import { Lock, Eye, EyeOff, Menu, X, CheckCircle, XCircle, AlertCircle } from 'lucide-react';

const BACKEND_URL = import.meta.env?.VITE_BACKEND_URL || 'http://localhost:5000/api';

function Notification({ type, message, onClose }) {
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => handleClose(), 4000);
    return () => clearTimeout(timer);
  }, []);

  const handleClose = () => {
    setIsExiting(true);
    setTimeout(() => onClose && onClose(), 300);
  };

  const configs = {
    success: { icon: CheckCircle, bgColor: 'from-green-400 to-emerald-500', borderColor: 'border-green-500' },
    error: { icon: XCircle, bgColor: 'from-red-400 to-rose-500', borderColor: 'border-red-500' },
    warning: { icon: AlertCircle, bgColor: 'from-yellow-400 to-orange-500', borderColor: 'border-yellow-500' }
  };

  const config = configs[type] || configs.success;
  const Icon = config.icon;

  return (
    <div className={`fixed top-24 right-4 z-[100] transition-all duration-300 ${
      isExiting ? 'translate-x-[120%] opacity-0' : 'translate-x-0 opacity-100'
    }`}>
      <div className={`bg-gradient-to-r ${config.bgColor} text-white rounded-2xl shadow-2xl p-4 min-w-[320px] max-w-md border-2 ${config.borderColor}`}>
        <div className="flex items-start space-x-3">
          <div className="flex-shrink-0 mt-0.5">
            <Icon className="w-6 h-6" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium leading-relaxed">{message}</p>
          </div>
          <button onClick={handleClose} className="flex-shrink-0 hover:bg-white/20 rounded-full p-1 transition">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="mt-3 h-1 bg-white/30 rounded-full overflow-hidden">
          <div className="h-full bg-white rounded-full animate-progress"></div>
        </div>
      </div>
    </div>
  );
}

export default function ResetPassword() {

  const getTokenFromUrl = () => {
    const params = new URLSearchParams(window.location.search);
    const queryToken = params.get('token');
    if (queryToken) return queryToken;
    
    const pathParts = window.location.pathname.split('/');
    return pathParts[pathParts.length - 1];
  };

  const token = getTokenFromUrl();

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoaded, setIsLoaded] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [notification, setNotification] = useState(null);

  useEffect(() => {
    setTimeout(() => setIsLoaded(true), 100);
  }, []);

  const showNotification = (type, message) => {
    setNotification({ type, message, id: Date.now() });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!token || token === 'reset-password') {
      showNotification("error", "Token tidak ditemukan di URL. Silakan gunakan link dari email");
      return;
    }

    if (!password || !confirmPassword) {
      showNotification('error', 'Semua field wajib diisi');
      return;
    }

    if (password !== confirmPassword) {
      showNotification('error', 'Password tidak cocok. Silakan periksa kembali');
      return;
    }

    if (password.length < 8) {
      showNotification('warning', 'Password minimal 8 karakter untuk keamanan akun Anda');
      return;
    }

    setIsLoading(true);

    try {
      const res = await fetch(`${BACKEND_URL}/auth/reset-password/${token}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ passwordBaru: password })
      });

      const data = await res.json();

      if (res.ok) {
        showNotification("success", "Password berhasil direset! 🎉 Silakan login dengan password baru");
        setTimeout(() => window.location.href = "/login", 2000);
      } else {
        showNotification("error", data.message || "Token tidak valid atau sudah kadaluarsa. Silakan minta link baru");
      }
    } catch (err) {
      console.error('Error:', err);
      showNotification("error", "Gagal terhubung ke server. Pastikan backend berjalan di " + BACKEND_URL);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#fffbf8] relative overflow-hidden flex items-center justify-center">

      {notification && (
        <Notification
          key={notification.id}
          type={notification.type}
          message={notification.message}
          onClose={() => setNotification(null)}
        />
      )}

      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div 
          className="absolute left-0 bottom-0 w-[500px] h-[500px] bg-gradient-to-br from-[#cb5094] to-[#e570b3] rounded-tr-full transition-all duration-1000"
          style={{ opacity: isLoaded ? 0.95 : 0, transform: isLoaded ? 'scale(1)' : 'scale(0.8)' }}
        ></div>
        <div 
          className="absolute right-0 top-0 w-[400px] h-[400px] bg-gradient-to-bl from-[#cb5094] to-[#e570b3] rounded-bl-full transition-all duration-1000 delay-200"
          style={{ opacity: isLoaded ? 0.85 : 0, transform: isLoaded ? 'scale(1)' : 'scale(0.8)' }}
        ></div>
        <div className="absolute top-[20%] left-[15%] w-16 h-16 rounded-full bg-[#cb5094]/20 animate-float"></div>
        <div className="absolute bottom-[30%] right-[20%] w-12 h-12 rounded-full bg-[#cb5094]/15 animate-float-delayed"></div>
        <div className="absolute top-[60%] left-[25%] w-8 h-8 rounded-full bg-[#e570b3]/15 animate-float"></div>
        <div className="absolute top-[15%] right-[30%] w-10 h-10 rounded-full bg-[#cb5094]/10 animate-float-delayed"></div>
      </div>

      <nav className="fixed top-0 w-full z-50 bg-white/90 backdrop-blur-sm shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16 sm:h-20">
            <a href="/" className="flex items-center space-x-2 sm:space-x-3 group">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-[#cb5094] to-[#e570b3] rounded-full flex items-center justify-center shadow-lg group-hover:shadow-2xl transition-all duration-300 group-hover:scale-110">
                <img 
                  src="/logo.png" 
                  alt="Medina Stuff Logo" 
                  className="w-6 h-6 sm:w-8 sm:h-8 object-contain"
                  onError={(e) => {
                    e.target.style.display = 'none';
                    e.target.nextElementSibling.style.display = 'block';
                  }}
                />
                <span className="text-xl sm:text-2xl font-serif text-white italic font-bold hidden">MS</span>
              </div>
              <div className="hidden sm:block">
                <div className="text-sm sm:text-base text-gray-600 font-medium italic tracking-wide">
                  Medina Stuff
                </div>
              </div>
            </a>

            <div className="hidden lg:flex items-center space-x-6 xl:space-x-8">
              <a href="/" className="text-gray-600 hover:text-[#cb5094] font-bold text-sm tracking-wide transition-all">
                HOME
              </a>
              <a href="/#aboutus" className="text-gray-600 hover:text-[#cb5094] font-bold text-sm tracking-wide transition-all">
                ABOUT US
              </a>
              <a href="/#contact" className="text-gray-600 hover:text-[#cb5094] font-bold text-sm tracking-wide transition-all">
                CONTACT
              </a>
              <a href="/login" className="text-[#cb5094] font-bold text-sm tracking-wide hover:underline transition-all">
                LOGIN
              </a>
            </div>

            <button 
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="lg:hidden p-2 hover:bg-[#fffbf8] rounded-lg transition-all duration-300"
            >
              {isMenuOpen ? <X className="w-6 h-6 text-[#cb5094]" /> : <Menu className="w-6 h-6 text-[#cb5094]" />}
            </button>
          </div>

          <div className={`lg:hidden overflow-hidden transition-all duration-500 ${isMenuOpen ? 'max-h-64 opacity-100 pb-4' : 'max-h-0 opacity-0'}`}>
            <div className="space-y-1">
              <a href="/" className="block py-3 px-4 text-gray-600 hover:text-[#cb5094] hover:bg-[#fffbf8] rounded-lg font-bold text-sm transition-all">
                HOME
              </a>
              <a href="/#aboutus" className="block py-3 px-4 text-gray-600 hover:text-[#cb5094] hover:bg-[#fffbf8] rounded-lg font-bold text-sm transition-all">
                ABOUT US
              </a>
              <a href="/#contact" className="block py-3 px-4 text-gray-600 hover:text-[#cb5094] hover:bg-[#fffbf8] rounded-lg font-bold text-sm transition-all">
                CONTACT
              </a>
              <a href="/login" className="block py-3 px-4 text-[#cb5094] hover:bg-[#fffbf8] rounded-lg font-bold text-sm transition-all">
                LOGIN
              </a>
            </div>
          </div>
        </div>
      </nav>

      <div className="relative z-10 w-full max-w-md px-4 pt-24 sm:pt-28 pb-8">
        <div 
          className="bg-gradient-to-br from-[#cb5094] to-[#e570b3] rounded-3xl shadow-2xl p-6 sm:p-8 lg:p-12 transition-all duration-1000"
          style={{ opacity: isLoaded ? 1 : 0, transform: isLoaded ? 'translateY(0) scale(1)' : 'translateY(30px) scale(0.95)' }}
        >

          <div className="text-center mb-6 sm:mb-8">
            <div className="mb-4">
              <div className="inline-flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 bg-white/20 backdrop-blur-sm rounded-full">
                <Lock className="w-8 h-8 sm:w-10 sm:h-10 text-white" />
              </div>
            </div>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-serif text-white mb-2 font-bold">
              Buat Password Baru
            </h1>
            <p className="text-white/90 text-sm sm:text-base">
              Masukkan password baru Anda
            </p>
            {(!token || token === 'reset-password') && (
              <div className="mt-4 bg-red-500/20 backdrop-blur-sm border border-red-300/30 rounded-xl p-3">
                <p className="text-white text-xs sm:text-sm">
                  ⚠️ Token tidak ditemukan! Gunakan link dari email
                </p>
              </div>
            )}
          </div>

          <div className="space-y-5">
            <div className="flex items-center bg-white rounded-full px-4 sm:px-5 py-3 sm:py-4 shadow-lg hover:shadow-xl transition-all duration-300 group">
              <Lock className="w-5 h-5 text-[#cb5094] mr-3 flex-shrink-0 group-hover:scale-110 transition-transform" />
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Password Baru (min. 8 karakter)"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="flex-1 outline-none text-gray-700 placeholder-gray-400 bg-transparent text-sm sm:text-base"
              />
              <button 
                type="button" 
                onClick={() => setShowPassword(!showPassword)} 
                className="ml-2 text-[#cb5094] hover:text-[#b04580] flex-shrink-0 transition-colors"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>

            <div className="flex items-center bg-white rounded-full px-4 sm:px-5 py-3 sm:py-4 shadow-lg hover:shadow-xl transition-all duration-300 group">
              <Lock className="w-5 h-5 text-[#cb5094] mr-3 flex-shrink-0 group-hover:scale-110 transition-transform" />
              <input
                type={showConfirm ? "text" : "password"}
                placeholder="Konfirmasi Password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSubmit(e)}
                className="flex-1 outline-none text-gray-700 placeholder-gray-400 bg-transparent text-sm sm:text-base"
              />
              <button 
                type="button" 
                onClick={() => setShowConfirm(!showConfirm)} 
                className="ml-2 text-[#cb5094] hover:text-[#b04580] flex-shrink-0 transition-colors"
              >
                {showConfirm ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>

            {password.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-white/80 text-xs sm:text-sm">
                  <span>Kekuatan Password:</span>
                  <span className="font-semibold">
                    {password.length < 8 ? 'Lemah' : password.length < 12 ? 'Sedang' : 'Kuat'}
                  </span>
                </div>
                <div className="h-2 bg-white/20 rounded-full overflow-hidden backdrop-blur-sm">
                  <div 
                    className={`h-full rounded-full transition-all duration-300 ${
                      password.length < 8 
                        ? 'w-1/3 bg-red-400' 
                        : password.length < 12 
                        ? 'w-2/3 bg-yellow-400' 
                        : 'w-full bg-green-400'
                    }`}
                  ></div>
                </div>
              </div>
            )}

            <button
              onClick={handleSubmit}
              disabled={isLoading || !token || token === 'reset-password'}
              className="w-full bg-[#7a2c5e] hover:bg-[#5d1f46] text-white font-bold py-3 sm:py-4 rounded-full text-base sm:text-lg transition-all duration-300 shadow-xl hover:shadow-2xl transform hover:-translate-y-1 active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed disabled:transform-none"
            >
              {isLoading ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Menyimpan...
                </span>
              ) : (
                <span className="flex items-center justify-center">
                  <Lock className="w-5 h-5 mr-2" />
                  SIMPAN PASSWORD BARU
                </span>
              )}
            </button>

            <div className="text-center pt-2">
              <a 
                href="/login" 
                className="inline-flex items-center text-white text-xs sm:text-sm hover:underline transition-all group"
              >
                <span className="mr-1 group-hover:-translate-x-1 transition-transform">←</span>
                Kembali ke Login
              </a>
            </div>

            <div className="mt-6 pt-6 border-t border-white/20">
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
                <p className="text-white/90 text-xs sm:text-sm text-center leading-relaxed">
                  🔒 <strong>Tips Keamanan:</strong><br />
                  Gunakan kombinasi huruf besar, kecil, angka, dan simbol untuk password yang lebih aman
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes float { 
          0%, 100% { transform: translateY(0); } 
          50% { transform: translateY(-20px); } 
        }
        @keyframes float-delayed { 
          0%, 100% { transform: translateY(0); } 
          50% { transform: translateY(-15px); } 
        }
        @keyframes progress { 
          from { width: 100%; } 
          to { width: 0%; } 
        }
        .animate-float { 
          animation: float 6s ease-in-out infinite; 
        }
        .animate-float-delayed { 
          animation: float-delayed 8s ease-in-out infinite; 
          animation-delay: 1s; 
        }
        .animate-progress { 
          animation: progress 4s linear forwards; 
        }
      `}</style>
    </div>
  );
}