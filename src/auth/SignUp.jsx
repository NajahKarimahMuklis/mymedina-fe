import { useState, useEffect } from 'react';
import { Mail, Lock, Eye, EyeOff, User, Menu, X, Phone, CheckCircle, XCircle, AlertCircle } from 'lucide-react';

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
    warning: { icon: AlertCircle, bgColor: 'from-yellow-400 to-orange-500', borderColor: 'border-yellow-500' },
  };

  const config = configs[type] || configs.success;
  const Icon = config.icon;

  return (
    <div className={`fixed top-24 right-4 z-[9999] transition-all duration-300 ${isExiting ? 'translate-x-[120%] opacity-0' : 'translate-x-0 opacity-100'}`}>
      <div className={`bg-gradient-to-r ${config.bgColor} text-white rounded-2xl shadow-2xl p-5 min-w-[340px] max-w-md border-2 ${config.borderColor}`}>
        <div className="flex items-start space-x-3">
          <Icon className="w-7 h-7 flex-shrink-0 mt-0.5" />
          <p className="flex-1 text-base font-semibold leading-relaxed">{message}</p>
          <button onClick={handleClose} className="hover:bg-white/20 rounded-full p-2 transition-all flex-shrink-0">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="mt-4 h-1.5 bg-white/30 rounded-full overflow-hidden">
          <div className="h-full bg-white rounded-full animate-progress"></div>
        </div>
      </div>
    </div>
  );
}

function SignUp() {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
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

    if (!name || !email || !phone || !password || !confirmPassword) {
      showNotification('error', 'Semua kolom wajib diisi!');
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

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      showNotification('error', 'Format email tidak valid');
      return;
    }

    setIsLoading(true);

    try {
      console.log('Signing up with:', {
        nama: name.trim(),
        email: email.toLowerCase().trim(),
        nomorTelepon: phone.replace(/\D/g, ''),
      });

      const res = await fetch('http://localhost:5000/api/auth/daftar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nama: name.trim(),
          email: email.toLowerCase().trim(),
          nomorTelepon: phone.replace(/\D/g, ''),
          password,
        }),
      });

      console.log('Response status:', res.status);

      let data;
      try {
        data = await res.json();
        console.log('Response data:', data);
      } catch (parseError) {
        console.error('Failed to parse response:', parseError);
        throw new Error('Invalid response from server');
      }

      if (res.ok) {
        showNotification('success', 'Pendaftaran berhasil! 🎉 Silakan cek email untuk kode verifikasi');

        // Pastikan data.user dan data.user.id ada
        if (data.user && data.user.id) {
          setTimeout(() => {
            const verifyUrl = `/verify?userId=${data.user.id}&email=${encodeURIComponent(email.toLowerCase().trim())}`;
            console.log('Redirecting to:', verifyUrl);
            window.location.href = verifyUrl;
          }, 2000);
        } else {
          console.error('User ID not found in response:', data);
          showNotification('error', 'Pendaftaran berhasil tapi tidak dapat mengarahkan ke verifikasi. Silakan cek email Anda');
        }

      } else {
        let errorMessage = 'Terjadi kesalahan saat mendaftar';
        
        if (res.status === 409) {
          errorMessage = 'Email sudah terdaftar. Silakan login atau gunakan email lain';
        } else if (res.status === 400) {
          errorMessage = data.message || 'Data tidak valid. Periksa kembali form Anda';
        } else if (res.status === 500) {
          errorMessage = 'Terjadi kesalahan server. Silakan coba lagi';
        } else if (data.message) {
          errorMessage = Array.isArray(data.message) ? data.message.join(', ') : data.message;
        }
        
        showNotification('error', errorMessage);
      }
    } catch (err) {
      console.error('Signup error:', err);
      
      if (err.message === 'Failed to fetch') {
        showNotification('error', 'Gagal terhubung ke server. Pastikan backend berjalan di http://localhost:5000');
      } else {
        showNotification('error', 'Terjadi kesalahan: ' + err.message);
      }
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

            <div className="hidden lg:flex items-center space-x-4">
              <a href="/login" className="text-[#cb5094] font-bold text-sm tracking-wide hover:underline transition-all">
                LOGIN
              </a>
              <a href="/signup" className="bg-[#cb5094] text-white px-6 py-2 rounded-full font-bold text-sm tracking-wide hover:bg-[#b04580] transition-all">
                SIGN UP
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
              <a href="/login" className="block py-3 px-4 text-gray-700 hover:text-[#cb5094] hover:bg-[#fffbf8] rounded-lg font-bold text-sm transition-all">
                LOGIN
              </a>
              <a href="/signup" className="block py-3 px-4 text-[#cb5094] font-semibold bg-[#fffbf8] rounded-lg transition-all">
                SIGN UP
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
            <h1 className="text-4xl sm:text-5xl font-serif text-white mb-2">Halo!</h1>
            <p className="text-white/90 text-sm sm:text-base">Buat akun Anda di sini!</p>
          </div>

          <div className="space-y-4 sm:space-y-5">
            <div className="flex items-center bg-white rounded-full px-4 sm:px-5 py-3 sm:py-4 shadow-lg hover:shadow-xl transition-all duration-300">
              <User className="w-5 h-5 text-[#cb5094] mr-3 flex-shrink-0" />
              <input type="text" placeholder="Nama" value={name} onChange={(e) => setName(e.target.value)} className="flex-1 outline-none text-gray-700 placeholder-gray-400 bg-transparent text-sm sm:text-base" />
            </div>

            <div className="flex items-center bg-white rounded-full px-4 sm:px-5 py-3 sm:py-4 shadow-lg hover:shadow-xl transition-all duration-300">
              <Mail className="w-5 h-5 text-[#cb5094] mr-3 flex-shrink-0" />
              <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} className="flex-1 outline-none text-gray-700 placeholder-gray-400 bg-transparent text-sm sm:text-base" />
            </div>

            <div className="flex items-center bg-white rounded-full px-4 sm:px-5 py-3 sm:py-4 shadow-lg hover:shadow-xl transition-all duration-300">
              <Phone className="w-5 h-5 text-[#cb5094] mr-3 flex-shrink-0" />
              <input type="tel" placeholder="Nomor Telepon" value={phone} onChange={(e) => setPhone(e.target.value)} className="flex-1 outline-none text-gray-700 placeholder-gray-400 bg-transparent text-sm sm:text-base" />
            </div>

            <div className="flex items-center bg-white rounded-full px-4 sm:px-5 py-3 sm:py-4 shadow-lg hover:shadow-xl transition-all duration-300">
              <Lock className="w-5 h-5 text-[#cb5094] mr-3 flex-shrink-0" />
              <input type={showPassword ? "text" : "password"} placeholder="Buat Password" value={password} onChange={(e) => setPassword(e.target.value)} className="flex-1 outline-none text-gray-700 placeholder-gray-400 bg-transparent text-sm sm:text-base" />
              <button onClick={() => setShowPassword(!showPassword)} className="ml-2 text-[#cb5094] hover:text-[#b04580] transition-colors flex-shrink-0">
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>

            <div className="flex items-center bg-white rounded-full px-4 sm:px-5 py-3 sm:py-4 shadow-lg hover:shadow-xl transition-all duration-300">
              <Lock className="w-5 h-5 text-[#cb5094] mr-3 flex-shrink-0" />
              <input type={showConfirmPassword ? "text" : "password"} placeholder="Konfirmasi Password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="flex-1 outline-none text-gray-700 placeholder-gray-400 bg-transparent text-sm sm:text-base" onKeyPress={(e) => e.key === 'Enter' && handleSubmit(e)} />
              <button onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="ml-2 text-[#cb5094] hover:text-[#b04580] transition-colors flex-shrink-0">
                {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>

            <button
              onClick={handleSubmit}
              disabled={isLoading}
              className="w-full bg-[#7a2c5e] hover:bg-[#5d1f46] text-white font-bold py-3 sm:py-4 rounded-full text-base sm:text-lg transition-all duration-300 shadow-xl hover:shadow-2xl transform hover:-translate-y-1 active:scale-95 mt-6 disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Membuat akun...
                </span>
              ) : 'SIGN UP'}
            </button>

            <div className="text-center mt-4 sm:mt-6">
              <p className="text-white text-xs sm:text-sm">
                Sudah punya akun?{' '}
                <a href="/login" className="font-bold underline hover:text-white/80 transition-all">
                  Login di sini
                </a>
              </p>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes float { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-20px); } }
        @keyframes float-delayed { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-15px); } }
        @keyframes progress { from { width: 100%; } to { width: 0%; } }
        .animate-float { animation: float 6s ease-in-out infinite; }
        .animate-float-delayed { animation: float-delayed 8s ease-in-out infinite; animation-delay: 1s; }
        .animate-progress { animation: progress 4s linear forwards; }
      `}</style>
    </div>
  );
}

export default SignUp;