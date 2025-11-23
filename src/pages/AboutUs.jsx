import { useState, useEffect } from 'react';
import { Menu, X, Heart, Sparkles, Truck, Instagram, MessageCircle, ShoppingBag } from 'lucide-react';

function AboutUs() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    setIsLoaded(true);
    window.scrollTo(0, 0);
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="min-h-screen bg-[#fffbf8]">
      <nav className={`fixed top-0 w-full z-50 transition-all duration-500 ${
        scrolled ? 'bg-white/95 backdrop-blur-lg shadow-lg py-3' : 'bg-white/90 backdrop-blur-sm py-4'
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center">
            <a href="/" className="flex items-center space-x-3 group">
              <div className={`relative transition-all duration-700 ${isLoaded ? 'scale-100 rotate-0' : 'scale-0 rotate-180'}`}>
                <div className="w-12 h-12 bg-gradient-to-br from-[#cb5094] to-[#e570b3] rounded-full flex items-center justify-center shadow-lg group-hover:shadow-2xl transition-all duration-300 group-hover:scale-110 relative overflow-hidden">
                  <img 
                    src="/logo.png" 
                    alt="Medina Stuff Logo" 
                    className="w-8 h-8 object-contain relative z-10"
                    onError={(e) => {
                      e.target.style.display = 'none';
                      e.target.nextElementSibling.style.display = 'block';
                    }}
                  />
                  <span className="text-2xl font-serif text-white italic font-bold relative z-10 hidden">MS</span>
                </div>
              </div>
              <div className={`hidden sm:block transition-all duration-700 delay-100 ${isLoaded ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-4'}`}>
                <div className="text-base text-gray-600 font-medium italic tracking-wide">
                  Medina Stuff
                </div>
              </div>
            </a>

            <div className="hidden lg:flex items-center space-x-1">
              {[
                { name: 'HOME', path: '/' },
                { name: 'ABOUT US', path: '/aboutus' },
                { name: 'CONTACT', path: '/contact' }
              ].map((item, index) => (
                <a 
                  key={item.name}
                  href={item.path}
                  className={`px-5 py-2 font-bold text-sm tracking-wide rounded-lg transition-all duration-300 transform hover:scale-105 ${
                    index === 1 ? 'text-[#cb5094] bg-[#fffbf8]' : 'text-gray-600 hover:text-[#cb5094] hover:bg-[#fffbf8]'
                  }`}
                >
                  {item.name}
                </a>
              ))}
            </div>

            <div className="flex items-center space-x-4">
              <div className="hidden md:flex items-center space-x-6">
                <a href="/login" className="text-[#cb5094] font-bold text-sm tracking-wide hover:underline transition-all transform hover:scale-105">
                  LOGIN
                </a>
                <a href="/signup" className="text-[#cb5094] font-bold text-sm tracking-wide hover:underline transition-all transform hover:scale-105">
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
          </div>

          <div className={`lg:hidden overflow-hidden transition-all duration-500 ${isMenuOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'}`}>
            <div className="pt-4 space-y-1">
              <a href="/" className="block py-3 px-4 rounded-lg transition-all text-gray-700 hover:text-[#cb5094] hover:bg-[#fffbf8]">
                HOME
              </a>
              <a href="/aboutus" className="block py-3 px-4 rounded-lg transition-all text-[#cb5094] font-semibold bg-[#fffbf8]">
                ABOUT US
              </a>
              <a href="/contact" className="block py-3 px-4 rounded-lg transition-all text-gray-700 hover:text-[#cb5094] hover:bg-[#fffbf8]">
                CONTACT
              </a>
              <a href="/login" className="block py-3 px-4 rounded-lg transition-all text-gray-700 hover:text-[#cb5094] hover:bg-[#fffbf8]">
                LOGIN
              </a>
              <a href="/signup" className="block py-3 px-4 rounded-lg transition-all text-gray-700 hover:text-[#cb5094] hover:bg-[#fffbf8]">
                SIGN UP
              </a>
            </div>
          </div>
        </div>
      </nav>

      <section className="pt-32 pb-24 relative overflow-hidden">
        <div className="absolute inset-0 opacity-5 bg-[radial-gradient(#cb5094_1px,transparent_1px)] bg-[length:30px_30px]"></div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center mb-20">
            <h1 className="text-5xl sm:text-6xl font-serif text-[#cb5094] mb-6 relative inline-block">
              Tentang Kami
              <span className="absolute left-0 -bottom-2 w-full h-3 bg-[#cb5094]/20 rounded-full"></span>
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
              Perjalanan kami dalam menghadirkan fashion muslim modern yang elegan dan berkualitas
            </p>
          </div>

          <div className="max-w-4xl mx-auto mb-24">
            <div className="relative">
              <div className="absolute -top-6 -left-6 w-32 h-32 bg-[#cb5094]/10 rounded-full blur-2xl"></div>
              <div className="absolute -bottom-6 -right-6 w-32 h-32 bg-[#e570b3]/10 rounded-full blur-2xl"></div>
              <div className="relative bg-white rounded-3xl p-8 sm:p-12 shadow-xl border border-gray-100">
                <div className="flex justify-center mb-8">
                  <div className="w-20 h-20 bg-gradient-to-br from-[#cb5094] to-[#e570b3] rounded-full flex items-center justify-center shadow-lg">
                    <Sparkles className="w-10 h-10 text-white" />
                  </div>
                </div>
                <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-6 text-center">Cerita Kami</h2>
                <div className="space-y-6 text-gray-600 text-center leading-relaxed">
                  <p className="text-base sm:text-lg">
                    Medina Stuff lahir dari passion untuk menyediakan pilihan fashion muslim yang tidak hanya indah, tetapi juga nyaman dan sesuai dengan nilai-nilai kesederhanaan modern.
                  </p>
                  <p className="text-base sm:text-lg">
                    Didirikan di Pekanbaru, kami memulai dengan komitmen sederhana: setiap wanita muslimah berhak tampil percaya diri dengan busana yang memancarkan keanggunan dan martabat.
                  </p>
                  <p className="text-base sm:text-lg">
                    Kini, kami telah melayani ribuan pelanggan di seluruh Indonesia dengan koleksi hijab, tunik, dan dress yang dirancang khusus untuk Anda.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

export default AboutUs;