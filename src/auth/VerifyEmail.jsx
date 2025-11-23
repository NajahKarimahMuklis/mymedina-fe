import { useState, useEffect, useRef } from 'react';
import { CheckCircle, XCircle, Loader2, ArrowRight, Home, Mail } from 'lucide-react';

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
  };

  const config = configs[type] || configs.success;
  const Icon = config.icon;

  return (
    <div className={`fixed top-24 right-4 z-[100] transition-all duration-300 ${isExiting ? 'translate-x-[120%] opacity-0' : 'translate-x-0 opacity-100'}`}>
      <div className={`bg-gradient-to-r ${config.bgColor} text-white rounded-2xl shadow-2xl p-4 min-w-[320px] max-w-md border-2 ${config.borderColor}`}>
        <div className="flex items-start space-x-3">
          <Icon className="w-6 h-6 mt-0.5 flex-shrink-0" />
          <p className="flex-1 text-sm font-medium leading-relaxed">{message}</p>
          <button onClick={handleClose} className="hover:bg-white/20 rounded-full p-1 transition">
            <XCircle className="w-5 h-5" />
          </button>
        </div>
        <div className="mt-3 h-1 bg-white/30 rounded-full overflow-hidden">
          <div className="h-full bg-white rounded-full animate-progress"></div>
        </div>
      </div>
    </div>
  );
}

export default function VerifyEmail() {

  const userId = new URLSearchParams(window.location.search).get('userId') || 'demo-user-id';
  const userEmail = new URLSearchParams(window.location.search).get('email') || 'user@example.com';
  
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [notification, setNotification] = useState(null);
  const [isResending, setIsResending] = useState(false);
  const inputRefs = useRef([]);

  useEffect(() => {
    setTimeout(() => setIsLoaded(true), 100);
    if (inputRefs.current[0]) {
      inputRefs.current[0].focus();
    }
  }, []);

  const showNotification = (type, message) => {
    setNotification({ type, message, id: Date.now() });
  };

  const handleChange = (index, value) => {
    if (value && !/^\d$/.test(value)) return;

    const newCode = [...code];
    newCode[index] = value;
    setCode(newCode);

    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    const newCode = pastedData.split('');
    
    while (newCode.length < 6) newCode.push('');
    
    setCode(newCode);
    
    const nextEmptyIndex = newCode.findIndex(c => !c);
    const focusIndex = nextEmptyIndex === -1 ? 5 : nextEmptyIndex;
    inputRefs.current[focusIndex]?.focus();
  };

  const handleVerify = async () => {
    const verificationCode = code.join('');
    
    if (verificationCode.length !== 6) {
      showNotification('error', 'Masukkan kode verifikasi 6 digit');
      return;
    }

    setIsVerifying(true);

    try {
      console.log('Verifying with:', { userId, verificationCode });
      
      const response = await fetch(
        `http://localhost:5000/api/auth/verifikasi-email/${userId}/${verificationCode}`,
        { 
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      console.log('Response status:', response.status);

      let data;
      try {
        data = await response.json();
        console.log('Response data:', data);
      } catch (parseError) {
        console.error('Failed to parse JSON:', parseError);
        throw new Error('Invalid response from server');
      }

      if (response.ok) {
        showNotification('success', 'Email berhasil diverifikasi! Mengarahkan ke halaman login...');
        
        setTimeout(() => {
          window.location.href = '/login';
        }, 2000);
      } else {
        const errorMessage = data.message || data.error || 'Kode verifikasi salah atau sudah kadaluarsa';
        
        if (response.status === 404) {
          showNotification('error', 'User tidak ditemukan. Silakan daftar ulang');
        } else if (response.status === 400) {
          showNotification('error', errorMessage);
        } else if (response.status === 500) {
          showNotification('error', 'Terjadi kesalahan server. Silakan coba lagi');
        } else {
          showNotification('error', errorMessage);
        }
        
        setCode(['', '', '', '', '', '']);
        inputRefs.current[0]?.focus();
      }
    } catch (err) {
      console.error('Verification error:', err);
      
      if (err.message === 'Failed to fetch') {
        showNotification('error', 'Gagal terhubung ke server. Pastikan backend berjalan di http://localhost:5000');
      } else {
        showNotification('error', 'Terjadi kesalahan: ' + err.message);
      }
    } finally {
      setIsVerifying(false);
    }
  };

  const handleResend = async () => {
    if (!userId || userId === 'demo-user-id') {
      showNotification('error', 'User ID tidak valid. Silakan daftar ulang');
      return;
    }

    setIsResending(true);
    
    try {
      console.log('Resending verification to userId:', userId);
      
      const response = await fetch('http://localhost:5000/api/auth/resend-verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      });

      console.log('Resend response status:', response.status);

      let data;
      try {
        data = await response.json();
        console.log('Resend response data:', data);
      } catch (parseError) {
        console.error('Failed to parse resend response:', parseError);
        throw new Error('Invalid response from server');
      }

      if (response.ok) {
        showNotification('success', 'Kode verifikasi baru telah dikirim ke email Anda');
        setCode(['', '', '', '', '', '']);
        inputRefs.current[0]?.focus();
      } else {
        const errorMessage = data.message || 'Gagal mengirim ulang kode verifikasi';
        showNotification('error', errorMessage);
      }
    } catch (err) {
      console.error('Resend error:', err);
      
      if (err.message === 'Failed to fetch') {
        showNotification('error', 'Gagal terhubung ke server. Pastikan backend berjalan');
      } else {
        showNotification('error', 'Terjadi kesalahan: ' + err.message);
      }
    } finally {
      setIsResending(false);
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

            <div className="flex items-center space-x-4">
              <a href="/" className="text-[#cb5094] font-bold text-sm tracking-wide hover:underline transition-all flex items-center gap-2">
                <Home className="w-4 h-4" />
                <span className="hidden sm:inline">BERANDA</span>
              </a>
            </div>
          </div>
        </div>
      </nav>

      <div className="relative z-10 w-full max-w-lg px-4 pt-24 sm:pt-28 pb-8">
        <div 
          className="bg-gradient-to-br from-[#cb5094] to-[#e570b3] rounded-3xl shadow-2xl p-6 sm:p-8 lg:p-10 transition-all duration-1000"
          style={{
            opacity: isLoaded ? 1 : 0,
            transform: isLoaded ? 'translateY(0) scale(1)' : 'translateY(30px) scale(0.95)'
          }}
        >
          <div className="text-center mb-8">
            <div className="mx-auto w-20 h-20 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center mb-4 shadow-xl">
              <Mail className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-3xl sm:text-4xl font-serif text-white mb-2">
              Verifikasi Email
            </h1>
            <p className="text-white/90 text-sm sm:text-base leading-relaxed px-4">
              Masukkan kode 6 digit yang telah dikirim ke
            </p>
            <p className="text-white font-semibold text-sm sm:text-base mt-1">
              {userEmail}
            </p>
          </div>

          <div className="flex justify-center gap-2 sm:gap-3 mb-6">
            {code.map((digit, index) => (
              <input
                key={index}
                ref={(el) => (inputRefs.current[index] = el)}
                type="text"
                maxLength={1}
                value={digit}
                onChange={(e) => handleChange(index, e.target.value)}
                onKeyDown={(e) => handleKeyDown(index, e)}
                onPaste={index === 0 ? handlePaste : undefined}
                className="w-12 h-14 sm:w-14 sm:h-16 text-center text-2xl font-bold bg-white text-[#cb5094] rounded-xl shadow-lg focus:outline-none focus:ring-4 focus:ring-white/50 transition-all duration-300"
                disabled={isVerifying}
              />
            ))}
          </div>

          <button
            onClick={handleVerify}
            disabled={isVerifying || code.join('').length !== 6}
            className="w-full bg-[#7a2c5e] hover:bg-[#5d1f46] text-white font-bold py-4 rounded-full text-base sm:text-lg transition-all duration-300 shadow-xl hover:shadow-2xl transform hover:-translate-y-1 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed mb-4"
          >
            {isVerifying ? (
              <span className="flex items-center justify-center">
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Memverifikasi...
              </span>
            ) : (
              <span className="flex items-center justify-center">
                Verifikasi
                <ArrowRight className="w-5 h-5 ml-2" />
              </span>
            )}
          </button>

          <div className="text-center">
            <p className="text-white/80 text-sm mb-2">
              Tidak menerima kode?
            </p>
            <button
              onClick={handleResend}
              disabled={isResending}
              className="text-white font-bold text-sm hover:underline transition-all disabled:opacity-50"
            >
              {isResending ? 'Mengirim...' : 'Kirim Ulang Kode'}
            </button>
          </div>

          <div className="text-center mt-6 pt-6 border-t border-white/20">
            <a 
              href="/login" 
              className="text-white text-sm hover:underline transition-all flex items-center justify-center gap-2"
            >
              Sudah punya akun? Login
            </a>
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