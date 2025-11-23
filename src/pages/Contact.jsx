import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Menu, X, Heart, MapPin, Phone, Clock, Send, CheckCircle, ArrowRight, Instagram, MessageCircle, ShoppingBag } from 'lucide-react';

function Contact() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [formData, setFormData] = useState({ name: '', email: '', phone: '', message: '' });
  const [formSubmitted, setFormSubmitted] = useState(false);

  useEffect(() => {
    setIsLoaded(true);
    window.scrollTo(0, 0);
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const TikTokIcon = ({ className }) => (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-5.2 1.74 2.89 2.89 0 012.31-4.64 2.93 2.93 0 01.88.13V9.4a6.84 6.84 0 00-1-.05A6.33 6.33 0 005 20.1a6.34 6.34 0 0010.86-4.43v-7a8.16 8.16 0 004.77 1.52v-3.4a4.85 4.85 0 01-1-.1z"/>
    </svg>
  );

  const handleSubmit = () => {
    if (formData.name && formData.email && formData.phone && formData.message) {
      setFormSubmitted(true);
      setTimeout(() => {
        setFormSubmitted(false);
        setFormData({ name: '', email: '', phone: '', message: '' });
      }, 3000);
    }
  };

  return (
    <div className="min-h-screen bg-[#fffbf8]">
      <nav className={`fixed top-0 w-full z-50 transition-all duration-500 ${
        scrolled ? 'bg-white/95 backdrop-blur-lg shadow-lg py-3' : 'bg-white/90 backdrop-blur-sm py-4'
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center">
            <Link to="/" className="flex items-center space-x-3 group">
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
            </Link>

            <div className="hidden lg:flex items-center space-x-1">
              {[
                { name: 'HOME', path: '/' },
                { name: 'ABOUT US', path: '/aboutus' },
                { name: 'CONTACT', path: '/contact' }
              ].map((item, index) => (
                <Link 
                  key={item.name}
                  to={item.path}
                  className={`px-5 py-2 font-bold text-sm tracking-wide rounded-lg transition-all duration-300 transform hover:scale-105 ${
                    index === 2 ? 'text-[#cb5094] bg-[#fffbf8]' : 'text-gray-600 hover:text-[#cb5094] hover:bg-[#fffbf8]'
                  }`}
                >
                  {item.name}
                </Link>
              ))}
            </div>

            <div className="flex items-center space-x-4">
              <div className="hidden md:flex items-center space-x-6">
                <Link to="/login" className="text-gray-700 font-bold text-sm tracking-wide hover:underline transition-all transform hover:scale-105">
                  LOGIN
                </Link>
                <Link to="/signup" className="text-gray-700 font-bold text-sm tracking-wide hover:underline transition-all transform hover:scale-105">
                  SIGN UP
                </Link>
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
              <Link to="/" className="block py-3 px-4 rounded-lg transition-all text-gray-700 hover:text-[#cb5094] hover:bg-[#fffbf8]">
                HOME
              </Link>
              <Link to="/aboutus" className="block py-3 px-4 rounded-lg transition-all text-gray-700 hover:text-[#cb5094] hover:bg-[#fffbf8]">
                ABOUT US
              </Link>
              <Link to="/contact" className="block py-3 px-4 rounded-lg transition-all text-[#cb5094] font-semibold bg-[#fffbf8]">
                CONTACT
              </Link>
              <Link to="/login" className="block py-3 px-4 rounded-lg transition-all text-gray-700 hover:text-[#cb5094] hover:bg-[#fffbf8]">
                LOGIN
              </Link>
              <Link to="/signup" className="block py-3 px-4 rounded-lg transition-all text-gray-700 hover:text-[#cb5094] hover:bg-[#fffbf8]">
                SIGN UP
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <section className="pt-32 pb-24 relative overflow-hidden">
        <div className="absolute inset-0 opacity-5 bg-[radial-gradient(#cb5094_1px,transparent_1px)] bg-[length:30px_30px]"></div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center mb-20">
            <h1 className="text-5xl sm:text-6xl font-serif text-[#cb5094] mb-6 relative inline-block">
              Hubungi Kami
              <span className="absolute left-0 -bottom-2 w-full h-3 bg-[#cb5094]/20 rounded-full"></span>
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
              Kami siap membantu Anda! Jangan ragu untuk menghubungi kami
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-12">
            <div className="space-y-6">
              <div className="bg-white rounded-3xl p-8 shadow-xl border border-gray-100 hover:shadow-2xl transition-all duration-300">
                <div className="flex items-start space-x-4">
                  <div className="w-14 h-14 bg-gradient-to-br from-[#cb5094] to-[#e570b3] rounded-full flex items-center justify-center flex-shrink-0 shadow-lg">
                    <MapPin className="w-7 h-7 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">Lokasi Toko</h3>
                    <p className="text-gray-600 leading-relaxed">
                      Jl. Kakak Tua No 18<br />
                      Sukajadi, Pekanbaru<br />
                      Riau, Indonesia
                    </p>
                    <a href="https://maps.google.com/?q=Jl.+Kakak+Tua+No+18+Sukajadi+Pekanbaru" target="_blank" rel="noopener noreferrer" className="inline-flex items-center text-[#cb5094] hover:text-[#b04580] mt-3 font-semibold group">
                      <span>Lihat di Maps</span>
                      <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                    </a>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-3xl p-8 shadow-xl border border-gray-100 hover:shadow-2xl transition-all duration-300">
                <div className="flex items-start space-x-4">
                  <div className="w-14 h-14 bg-gradient-to-br from-[#25d366] to-[#128c7e] rounded-full flex items-center justify-center flex-shrink-0 shadow-lg">
                    <Phone className="w-7 h-7 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">Telepon / WhatsApp</h3>
                    <p className="text-gray-600 mb-2">+62 811-7510-040</p>
                    <a href="https://wa.me/628117510040" target="_blank" rel="noopener noreferrer" className="inline-flex items-center text-[#25d366] hover:text-[#128c7e] font-semibold group">
                      <MessageCircle className="w-4 h-4 mr-2" />
                      <span>Chat via WhatsApp</span>
                    </a>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-3xl p-8 shadow-xl border border-gray-100 hover:shadow-2xl transition-all duration-300">
                <div className="flex items-start space-x-4">
                  <div className="w-14 h-14 bg-gradient-to-br from-[#cb5094] to-[#e570b3] rounded-full flex items-center justify-center flex-shrink-0 shadow-lg">
                    <Clock className="w-7 h-7 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 mb-3">Jam Operasional</h3>
                    <div className="space-y-2 text-gray-600">
                      <p className="flex justify-between">
                        <span className="font-medium">Senin - Minggu:</span>
                        <span>09.00 - 18.00 WIB</span>
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-3xl p-8 shadow-xl border border-gray-100">
              <h3 className="text-2xl font-bold text-gray-900 mb-6">Kirim Pesan</h3>
              {formSubmitted ? (
                <div className="text-center py-12">
                  <CheckCircle className="w-20 h-20 text-green-500 mx-auto mb-4 animate-bounce" />
                  <h4 className="text-2xl font-bold text-gray-900 mb-2">Pesan Terkirim!</h4>
                  <p className="text-gray-600">Terima kasih telah menghubungi kami. Kami akan segera merespons pesan Anda.</p>
                </div>
              ) : (
                <div className="space-y-6">
                  <div>
                    <label className="block text-gray-700 font-semibold mb-2">Nama Lengkap</label>
                    <input 
                      type="text" 
                      value={formData.name} 
                      onChange={(e) => setFormData({...formData, name: e.target.value})} 
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#cb5094] focus:border-transparent transition-all" 
                      placeholder="Nama Anda" 
                    />
                  </div>
                  <div>
                    <label className="block text-gray-700 font-semibold mb-2">Email</label>
                    <input 
                      type="email" 
                      value={formData.email} 
                      onChange={(e) => setFormData({...formData, email: e.target.value})} 
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#cb5094] focus:border-transparent transition-all" 
                      placeholder="email@example.com" 
                    />
                  </div>
                  <div>
                    <label className="block text-gray-700 font-semibold mb-2">Nomor Telepon</label>
                    <input 
                      type="tel" 
                      value={formData.phone} 
                      onChange={(e) => setFormData({...formData, phone: e.target.value})} 
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#cb5094] focus:border-transparent transition-all" 
                      placeholder="+62 xxx xxxx xxxx" 
                    />
                  </div>
                  <div>
                    <label className="block text-gray-700 font-semibold mb-2">Pesan</label>
                    <textarea 
                      value={formData.message} 
                      onChange={(e) => setFormData({...formData, message: e.target.value})} 
                      rows="5" 
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#cb5094] focus:border-transparent transition-all resize-none" 
                      placeholder="Tulis pesan Anda di sini..."
                    ></textarea>
                  </div>
                  <button 
                    onClick={handleSubmit}
                    className="w-full bg-gradient-to-r from-[#cb5094] to-[#e570b3] text-white font-bold py-4 rounded-xl hover:shadow-xl transition-all transform hover:-translate-y-1 flex items-center justify-center group"
                  >
                    <span>Kirim Pesan</span>
                    <Send className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

export default Contact;