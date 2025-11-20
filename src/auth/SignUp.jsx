import { useState, useEffect } from 'react';
import { Mail, Lock, Eye, EyeOff, User, Menu, X } from 'lucide-react';

function SignUp() {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');           // ← tambahan untuk nomorTelepon
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoaded, setIsLoaded] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Animasi masuk
  useEffect(() => {
    setTimeout(() => setIsLoaded(true), 100);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validasi sederhana
    if (!name || !email || !phone || !password || !confirmPassword) {
      alert('Semua kolom wajib diisi');
      return;
    }
    if (password !== confirmPassword) {
      alert('Password tidak cocok');
      return;
    }
    if (password.length < 8) {
      alert('Password minimal 8 karakter');
      return;
    }

    setIsLoading(true);

    try {
      const res = await fetch('http://localhost:5000/api/auth/daftar', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          nama: name.trim(),
          email: email.toLowerCase().trim(),
          nomorTelepon: phone.replace(/\D/g, ''), // hapus karakter selain angka
          password,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        // Sukses
        alert('Pendaftaran berhasil! Silakan cek email untuk verifikasi.');
        // Redirect ke login
        window.location.href = '/login';
      } else {
        // Error dari backend
        if (Array.isArray(data.message)) {
          alert(data.message.join('\n'));
        } else {
          alert(data.message || 'Terjadi kesalahan saat mendaftar');
        }
      }
    } catch (err) {
      console.error(err);
      alert('Gagal terhubung ke server. Pastikan backend berjalan.');
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
          style={{
            opacity: isLoaded ? 0.95 : 0,
            transform: isLoaded ? 'scale(1)' : 'scale(0.8)'
          }}
        ></div>
        
        <div 
          className="absolute right-0 top-0 w-[400px] h-[400px] bg-gradient-to-bl from-[#cb5094] to-[#e570b3] rounded-bl-full transition-all duration-1000 delay-200"
          style={{
            opacity: isLoaded ? 0.85 : 0,
            transform: isLoaded ? 'scale(1)' : 'scale(0.8)'
          }}
        ></div>

        <div className="absolute top-[20%] left-[15%] w-16 h-16 rounded-full bg-[#cb5094]/20 animate-float"></div>
        <div className="absolute bottom-[30%] right-[20%] w-12 h-12 rounded-full bg-[#cb5094]/15 animate-float-delayed"></div>
      </div>

      {/* Navigation Bar - Responsive */}
      <nav className="fixed top-0 w-full z-50 bg-white/90 backdrop-blur-sm shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16 sm:h-20">
            {/* Logo */}
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
          <div 
            className={`lg:hidden overflow-hidden transition-all duration-500 ${
              isMenuOpen ? 'max-h-64 opacity-100 pb-4' : 'max-h-0 opacity-0'
            }`}
          >
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

      {/* Sign Up Card */}
      <div className="relative z-10 w-full max-w-md px-4 pt-24 sm:pt-28 pb-8">
        <div 
          className="bg-gradient-to-br from-[#cb5094] to-[#e570b3] rounded-3xl shadow-2xl p-6 sm:p-8 lg:p-12 transition-all duration-1000"
          style={{
            opacity: isLoaded ? 1 : 0,
            transform: isLoaded ? 'translateY(0) scale(1)' : 'translateY(30px) scale(0.95)'
          }}
        >
          {/* Header */}
          <div className="text-center mb-6 sm:mb-8">
            <h1 className="text-4xl sm:text-5xl font-serif text-white mb-2">
              Hello!
            </h1>
            <p className="text-white/90 text-sm sm:text-base">
              Create your account
            </p>
          </div>

          {/* Form */}
          <div className="space-y-4 sm:space-y-5">
            {/* Name Input */}
            <div className="relative">
              <div className="flex items-center bg-white rounded-full px-4 sm:px-5 py-3 sm:py-4 shadow-lg hover:shadow-xl transition-all duration-300">
                <User className="w-5 h-5 text-[#cb5094] mr-3 flex-shrink-0" />
                <input
                  type="text"
                  placeholder="Name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="flex-1 outline-none text-gray-700 placeholder-gray-400 bg-transparent text-sm sm:text-base"
                />
              </div>
            </div>

            {/* Email Input */}
            <div className="relative">
              <div className="flex items-center bg-white rounded-full px-4 sm:px-5 py-3 sm:py-4 shadow-lg hover:shadow-xl transition-all duration-300">
                <Mail className="w-5 h-5 text-[#cb5094] mr-3 flex-shrink-0" />
                <input
                  type="email"
                  placeholder="Email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="flex-1 outline-none text-gray-700 placeholder-gray-400 bg-transparent text-sm sm:text-base"
                />
              </div>
            </div>

            {/* Phone Input - BARU */}
            <div className="relative">
              <div className="flex items-center bg-white rounded-full px-4 sm:px-5 py-3 sm:py-4 shadow-lg hover:shadow-xl transition-all duration-300">
                <User className="w-5 h-5 text-[#cb5094] mr-3 flex-shrink-0" />
                <input
                  type="tel"
                  placeholder="Phone Number"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="flex-1 outline-none text-gray-700 placeholder-gray-400 bg-transparent text-sm sm:text-base"
                />
              </div>
            </div>

            {/* Create Password Input */}
            <div className="relative">
              <div className="flex items-center bg-white rounded-full px-4 sm:px-5 py-3 sm:py-4 shadow-lg hover:shadow-xl transition-all duration-300">
                <Lock className="w-5 h-5 text-[#cb5094] mr-3 flex-shrink-0" />
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Create Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="flex-1 outline-none text-gray-700 placeholder-gray-400 bg-transparent text-sm sm:text-base"
                />
                <button
                  onClick={() => setShowPassword(!showPassword)}
                  className="ml-2 text-[#cb5094] hover:text-[#b04580] transition-colors flex-shrink-0"
                >
                  {showPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>

            {/* Confirm Password Input */}
            <div className="relative">
              <div className="flex items-center bg-white rounded-full px-4 sm:px-5 py-3 sm:py-4 shadow-lg hover:shadow-xl transition-all duration-300">
                <Lock className="w-5 h-5 text-[#cb5094] mr-3 flex-shrink-0" />
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="Confirm Password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="flex-1 outline-none text-gray-700 placeholder-gray-400 bg-transparent text-sm sm:text-base"
                />
                <button
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="ml-2 text-[#cb5094] hover:text-[#b04580] transition-colors flex-shrink-0"
                >
                  {showConfirmPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>

            {/* Sign Up Button */}
            <button
              onClick={handleSubmit}
              disabled={isLoading}
              className="w-full bg-[#7a2c5e] hover:bg-[#5d1f46] text-white font-bold py-3 sm:py-4 rounded-full text-base sm:text-lg transition-all duration-300 shadow-xl hover:shadow-2xl transform hover:-translate-y-1 active:scale-95 mt-6 disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Mendaftar...' : 'SIGN UP'}
            </button>

            {/* Sign In Link */}
            <div className="text-center mt-4 sm:mt-6">
              <p className="text-white text-xs sm:text-sm">
                Already have an account?{' '}
                <a 
                  href="/login" 
                  className="font-bold underline hover:text-white/80 transition-all"
                >
                  Login
                </a>
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Custom Animations */}
      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-20px); }
        }
        @keyframes float-delayed {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-15px); }
        }
        .animate-float {
          animation: float 6s ease-in-out infinite;
        }
        .animate-float-delayed {
          animation: float-delayed 8s ease-in-out infinite;
          animation-delay: 1s;
        }
      `}</style>
    </div>
  );
}

export default SignUp;