import { useState, useEffect } from 'react';
import { Mail, Menu, X } from 'lucide-react';

function ForgotPassword() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [isLoaded, setIsLoaded] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    setTimeout(() => setIsLoaded(true), 100);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim()) {
      alert('Email wajib diisi');
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch('http://localhost:5000/api/auth/lupa-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.toLowerCase().trim() }),
      });

      const data = await res.json();

      if (res.ok) {
        alert('Jika email terdaftar, link reset password telah dikirim ke email Anda.');
        setEmail('');
      } else {
        alert(data.message || 'Terjadi kesalahan');
      }
    } catch (err) {
      alert('Gagal terhubung ke server');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#fffbf8] relative overflow-hidden flex items-center justify-center">
      {/* Background Decorations */}
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

      {/* Navigation Bar — 100% SAMA DENGAN LOGIN & SIGNUP */}
      <nav className="fixed top-0 w-full z-50 bg-white/90 backdrop-blur-sm shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16 sm:h-20">
            {/* LOGO — IDENTIK */}
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

            {/* Desktop Menu */}
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

            {/* Mobile Menu Button */}
            <button 
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="lg:hidden p-2 hover:bg-[#fffbf8] rounded-lg transition-all duration-300"
            >
              {isMenuOpen ? <X className="w-6 h-6 text-[#cb5094]" /> : <Menu className="w-6 h-6 text-[#cb5094]" />}
            </button>
          </div>

          {/* Mobile Menu */}
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

      {/* Forgot Password Card */}
      <div className="relative z-10 w-full max-w-md px-4 pt-24 sm:pt-28 pb-8">
        <div 
          className="bg-gradient-to-br from-[#cb5094] to-[#e570b3] rounded-3xl shadow-2xl p-6 sm:p-8 lg:p-12 transition-all duration-1000"
          style={{ opacity: isLoaded ? 1 : 0, transform: isLoaded ? 'translateY(0) scale(1)' : 'translateY(30px) scale(0.95)' }}
        >
          <div className="text-center mb-6 sm:mb-8">
            <h1 className="text-4xl sm:text-5xl font-serif text-white mb-2">
              Lupa Password?
            </h1>
            <p className="text-white/90 text-sm sm:text-base">
              Masukkan email Anda, kami akan kirim link reset
            </p>
          </div>

          <div className="space-y-5">
            <div className="flex items-center bg-white rounded-full px-4 sm:px-5 py-3 sm:py-4 shadow-lg hover:shadow-xl transition-all duration-300">
              <Mail className="w-5 h-5 text-[#cb5094] mr-3 flex-shrink-1760" />
              <input
                type="email"
                placeholder="Email Anda"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="flex-1 outline-none text-gray-700 placeholder-gray-400 bg-transparent text-sm sm:text-base"
              />
            </div>

            <button
              onClick={handleSubmit}
              disabled={isLoading}
              className="w-full bg-[#7a2c5e] hover:bg-[#5d1f46] text-white font-bold py-3 sm:py-4 rounded-full text-base sm:text-lg transition-all duration-300 shadow-xl hover:shadow-2xl transform hover:-translate-y-1 active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Mengirim...' : 'KIRIM LINK RESET'}
            </button>

            <div className="text-center">
              <a href="/login" className="text-white text-xs sm:text-sm hover:underline transition-all">
                Kembali ke Login
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Custom Animations */}
      <style>{`
        @keyframes float { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-20px); } }
        @keyframes float-delayed { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-15px); } }
        .animate-float { animation: float 6s ease-in-out infinite; }
        .animate-float-delayed { animation: float-delayed 8s ease-in-out infinite; animation-delay: 1s; }
      `}</style>
    </div>
  );
}

export default ForgotPassword;