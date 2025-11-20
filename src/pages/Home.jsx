import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  ShoppingBag, Menu, X, Heart, ArrowRight, Sparkles, Truck,
  Instagram, MessageCircle
} from 'lucide-react';

function Home() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    setIsLoaded(true);
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="min-h-screen bg-[#fffbf8]">
      {/* Navigation */}
      <nav className={`fixed top-0 w-full z-50 transition-all duration-500 ${
        scrolled ? 'bg-white/95 backdrop-blur-lg shadow-lg py-3' : 'bg-white/90 backdrop-blur-sm py-4'
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center">
            {/* Logo */}
            <a href="#home" className="flex items-center space-x-3 group">
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
                  <div className="absolute inset-0 bg-gradient-to-br from-[#e570b3] to-[#cb5094] opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                </div>
              </div>
              <div className={`hidden sm:block transition-all duration-700 delay-100 ${isLoaded ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-4'}`}>
                <div className="text-base text-gray-600 font-medium italic tracking-wide" style={{ fontFamily: 'sans-serif' }}>
                  Medina Stuff
                </div>
              </div>
            </a>

            {/* Desktop Menu */}
            <div className="hidden lg:flex items-center space-x-1">
              {['HOME', 'ABOUT US', 'CONTACT'].map((item, index) => (
                <a 
                  key={item}
                  href={`#${item.toLowerCase().replace(' ', '')}`}
                  className={`px-5 py-2 font-bold text-sm tracking-wide rounded-lg transition-all duration-300 transform hover:scale-105 ${
                    index === 0 ? 'text-[#cb5094] bg-[#fffbf8]' : 'text-gray-600 hover:text-[#cb5094] hover:bg-[#fffbf8]'
                  }`}
                  style={{
                    opacity: isLoaded ? 1 : 0,
                    transform: isLoaded ? 'translateY(0)' : 'translateY(-20px)',
                    transition: `all 0.6s ease-out ${index * 0.1}s`
                  }}
                >
                  {item}
                </a>
              ))}
            </div>

            {/* Right Menu - LOGIN & SIGN UP dengan Link dari react-router-dom */}
            <div className="flex items-center space-x-4">
              <div className="hidden md:flex items-center space-x-6">
                <Link 
                  to="/login"
                  className="text-[#cb5094] font-bold text-sm tracking-wide hover:underline transition-all transform hover:scale-105"
                  style={{
                    opacity: isLoaded ? 1 : 0,
                    transform: isLoaded ? 'translateY(0)' : 'translateY(-20px)',
                    transition: 'all 0.6s ease-out 0.3s'
                  }}
                >
                  LOGIN
                </Link>
                <Link 
                  to="/signup"
                  className="text-[#cb5094] font-bold text-sm tracking-wide hover:underline transition-all transform hover:scale-105"
                  style={{
                    opacity: isLoaded ? 1 : 0,
                    transform: isLoaded ? 'translateY(0)' : 'translateY(-20px)',
                    transition: 'all 0.6s ease-out 0.4s'
                  }}
                >
                  SIGN UP
                </Link>
              </div>
              
              <button 
                className="relative p-2 hover:bg-[#fffbf8] rounded-full transition-all duration-300 group"
                style={{
                  opacity: isLoaded ? 1 : 0,
                  transform: isLoaded ? 'scale(1)' : 'scale(0)',
                  transition: 'all 0.6s ease-out 0.5s'
                }}
              >
                <ShoppingBag className="w-6 h-6 text-[#cb5094] group-hover:scale-110 transition-transform duration-300" />
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-[#cb5094] rounded-full text-white text-xs flex items-center justify-center font-bold animate-pulse">
                  0
                </span>
              </button>

              <button 
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="lg:hidden p-2 hover:bg-[#fffbf8] rounded-lg transition-all duration-300"
              >
                {isMenuOpen ? <X className="w-6 h-6 text-[#cb5094]" /> : <Menu className="w-6 h-6 text-[#cb5094]" />}
              </button>
            </div>
          </div>

          {/* Mobile Menu */}
          <div 
            className={`lg:hidden overflow-hidden transition-all duration-500 ${
              isMenuOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
            }`}
          >
            <div className="pt-4 space-y-1">
              <a 
                href="#home"
                className="block py-3 px-4 rounded-lg transition-all transform hover:translate-x-2 text-[#cb5094] font-semibold bg-[#fffbf8]"
              >
                HOME
              </a>
              <a 
                href="#aboutus"
                className="block py-3 px-4 rounded-lg transition-all transform hover:translate-x-2 text-gray-700 hover:text-[#cb5094] hover:bg-[#fffbf8]"
              >
                ABOUT US
              </a>
              <a 
                href="#contact"
                className="block py-3 px-4 rounded-lg transition-all transform hover:translate-x-2 text-gray-700 hover:text-[#cb5094] hover:bg-[#fffbf8]"
              >
                CONTACT
              </a>
              <Link 
                to="/login"
                className="block py-3 px-4 rounded-lg transition-all transform hover:translate-x-2 text-gray-700 hover:text-[#cb5094] hover:bg-[#fffbf8]"
              >
                LOGIN
              </Link>
              <Link 
                to="/signup"
                className="block py-3 px-4 rounded-lg transition-all transform hover:translate-x-2 text-gray-700 hover:text-[#cb5094] hover:bg-[#fffbf8]"
              >
                SIGN UP
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section id="home" className="relative min-h-screen flex items-center overflow-hidden pt-20">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-[15%] left-[8%] w-16 h-16 rounded-full bg-[#cb5094]/20 animate-float"></div>
          <div className="absolute top-[60%] left-[12%] w-12 h-12 rounded-full bg-[#cb5094]/15 animate-float-delayed"></div>
          <div className="absolute top-[25%] right-[10%] w-20 h-20 rounded-full bg-[#cb5094]/20 animate-float-slow"></div>
          
          <div 
            className="absolute left-0 top-1/2 -translate-y-1/2 w-[45%] aspect-square bg-gradient-to-br from-[#cb5094] to-[#e570b3] rounded-full transition-all duration-1000"
            style={{
              left: '-15%',
              maxWidth: '600px',
              opacity: isLoaded ? 0.95 : 0,
              transform: isLoaded ? 'translateY(-50%) scale(1)' : 'translateY(-50%) scale(0.8)'
            }}
          ></div>
          
          <div 
            className="absolute right-0 bottom-0 w-[35%] aspect-square bg-gradient-to-tl from-[#cb5094] to-[#e570b3] rounded-tl-full transition-all duration-1000 delay-200"
            style={{
              maxWidth: '500px',
              opacity: isLoaded ? 0.85 : 0,
              transform: isLoaded ? 'scale(1)' : 'scale(0.8)'
            }}
          ></div>
          
          <div className="absolute w-2 h-2 bg-[#cb5094] rounded-full animate-pulse" style={{ right: '25%', top: '20%' }}></div>
        </div>

        <div className="absolute inset-0 opacity-5 bg-[radial-gradient(#cb5094_1px,transparent_1px)] bg-[length:30px_30px]"></div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full relative z-10">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left - Image */}
            <div 
              className="relative order-2 lg:order-1 transition-all duration-1000"
              style={{
                opacity: isLoaded ? 1 : 0,
                transform: isLoaded ? 'translateX(0) scale(1)' : 'translateX(-50px) scale(0.95)'
              }}
            >
              <div className="relative w-full h-[80vh] lg:h-[95vh] mx-auto lg:ml-0">
                <div className="absolute -top-4 -left-4 w-24 h-24 border-4 border-[#cb5094]/30 rounded-full animate-spin-slow"></div>
                <div className="absolute -bottom-4 -right-4 w-32 h-32 border-4 border-[#e570b3]/30 rounded-full animate-spin-reverse"></div>
                
                <div className="relative h-full rounded-3xl overflow-visible transform hover:scale-105 transition-transform duration-500">
                  <img 
                    src="/model.png" 
                    alt="Medina Stuff Models"
                    className="w-full h-full object-cover object-bottom drop-shadow-2xl"
                    style={{ 
                      mixBlendMode: 'multiply',
                      filter: 'drop-shadow(0 25px 50px rgba(0, 0, 0, 0.15))'
                    }}
                    onError={(e) => {
                      e.target.style.display = 'none';
                      e.target.nextElementSibling.style.display = 'flex';
                    }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-br from-gray-100/50 to-gray-200/50 rounded-3xl backdrop-blur-sm hidden flex-col items-center justify-center p- for text-center">
                    <div className="mb-4 relative">
                      <Sparkles className="w-20 h-20 text-gray-300 animate-bounce" />
                      <Sparkles className="w-8 h-8 text-[#cb5094] absolute -top-2 -right-2 animate-pulse" />
                    </div>
                    <p className="text-gray-400 font-semibold mb-2">Taruh gambar di:</p>
                    <code className="text-sm text-gray-500 bg-white/80 px-4 py-2 rounded-lg shadow-inner">
                      public/model.png
                    </code>
                  </div>
                </div>
              </div>
            </div>

            {/* Right - Text */}
            <div className="relative order-1 lg:order-2 space-y-6 lg:pl-8">
              <div className="transition-all duration-1000" style={{ opacity: isLoaded ? 1 : 0, transform: isLoaded ? 'translateY(0)' : 'translateY(30px)' }}>
                <h1 className="text-5xl sm:text-6xl lg:text-7xl font-serif leading-tight mb-2">
                  <span className="text-[#cb5094] block relative inline-block">
                    Dress with Dignity,
                    <span className="absolute left-0 -bottom-2 w-full h-3 bg-[#cb5094]/20 rounded-full"></span>
                  </span>
                </h1>
                <h1 className="text-5xl sm:text-6xl lg:text-7xl font-serif leading-tight text-[#cb5094] transition-all duration-1000 delay-200"
                  style={{ opacity: isLoaded ? 1 : 0, transform: isLoaded ? 'translateY(0)' : 'translateY(30px)' }}>
                  Shine with Style
                </h1>
              </div>
              
              <p className="text-lg sm:text-xl text-[#cb5094] leading-relaxed max-w-xl transition-all duration-1000 delay-300"
                style={{ opacity: isLoaded ? 1 : 0, transform: isLoaded ? 'translateY(0)' : 'translateY(30px)' }}>
                Explore our latest collection of elegant hijabs, tunics, and dresses — designed for the modern Muslimah.
              </p>
              
              <div className="transition-all duration-1000 delay-500"
                style={{ opacity: isLoaded ? 1 : 0, transform: isLoaded ? 'translateY(0)' : 'translateY(30px)' }}>
                <button className="group relative bg-[#cb5094] text-white px-12 py-5 rounded-full text-lg font-semibold hover:bg-[#b04580] transition-all duration-300 shadow-xl hover:shadow-2xl transform hover:-translate-y-2 hover:scale-105 active:scale-95 overflow-hidden">
                  <span className="absolute inset-0 bg-gradient-to-r from-[#e570b3] to-[#cb5094] opacity-0 group-hover:opacity-100 transition-opacity duration-500"></span>
                  <span className="relative flex items-center justify-center">
                    Shop Now
                    <ArrowRight className="w-6 h-6 ml-3 transform group-hover:translate-x-2 transition-transform duration-300" />
                  </span>
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="absolute bottom-0 left-0 right-0 w-full overflow-hidden">
          <svg className="w-full h-24 md:h-32" viewBox="0 0 1200 120" preserveAspectRatio="none">
            <path d="M321.39,56.44c58-10.79,114.16-30.13,172-41.86,82.39-16.72,168.19-17.73,250.45-.39C823.78,31,906.67,72,985.66,92.83c70.05,18.48,146.53,26.09,214.34,3V120H0V95.8C57.1,105.94,133.81,113.48,198.11,104.28c67.53-9.61,126.99-39.06,189.23-42.25A714.92,714.92,0,0,1,321.39,56.44Z" fill="#cb5094" fillOpacity="0.15"></path>
          </svg>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 bg-white relative overflow-hidden">
        <div className="absolute top-10 right-10 w-64 h-64 bg-[#fffbf8] rounded-full blur-3xl opacity-50"></div>
        <div className="absolute bottom-10 left-10 w-64 h-64 bg-[#fffbf8] rounded-full blur-3xl opacity-50"></div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center mb-16">
            <h2 className="text-4xl sm:text-5xl font-serif text-gray-900 mb-4 relative inline-block">
              Why Choose Us
              <span className="absolute left-0 -bottom-2 w-full h-1.5 bg-gradient-to-r from-transparent via-[#cb5094] to-transparent rounded-full"></span>
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-10">
            {[
              { icon: Sparkles, title: "Premium Quality", description: "Carefully selected fabrics that combine comfort with elegance for your everyday wear", color: "from-pink-500 to-rose-500" },
              { icon: Heart, title: "Modern Designs", description: "Contemporary styles that celebrate modesty and fashion in perfect harmony", color: "from-purple-500 to-pink-500" },
              { icon: Truck, title: "Fast Delivery", description: "Swift and secure shipping across Indonesia, delivered right to your doorstep", color: "from-blue-500 to-cyan-500" }
            ].map((feature, index) => {
              const Icon = feature.icon;
              return (
                <div key={index} className="group relative text-center p-10 rounded-3xl bg-gradient-to-br from-white to-[#fffbf8] hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-3 cursor-pointer border border-gray-100 hover:border-[#cb5094]/30 overflow-hidden">
                  <div className={`absolute inset-0 bg-gradient-to-br ${feature.color} opacity-0 group-hover:opacity-5 transition-opacity duration-500`}></div>
                  <div className="relative z-10">
                    <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-[#cb5094] to-[#e570b3] mb-6 transform group-hover:scale-110 group-hover:rotate-12 transition-all duration-500 shadow-lg group-hover:shadow-2xl">
                      <Icon className="w-10 h-10 text-white" />
                    </div>
                    <h3 className="text-2xl font-bold text-gray-800 mb-4 group-hover:text-[#cb5094] transition-colors duration-300">
                      {feature.title}
                    </h3>
                    <p className="text-gray-600 leading-relaxed text-base">{feature.description}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white py-16 border-t border-gray-100 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[#cb5094] to-transparent"></div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-12 mb-12">
            {/* Brand */}
            <div className="sm:col-span-2 md:col-span-1">
              <div className="flex items-center space-x-2 mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-[#cb5094] to-[#e570b3] rounded-full flex items-center justify-center shadow-lg">
                  <img src="/logo.png" alt="Medina Stuff Logo" className="w-8 h-8 object-contain"
                    onError={(e) => { e.target.style.display = 'none'; e.target.nextElementSibling.style.display = 'block'; }} />
                  <span className="text-2xl font-serif text-white italic font-bold hidden">MS</span>
                </div>
                <span className="text-base text-gray-600 font-medium italic tracking-wide" style={{ fontFamily: 'sans-serif' }}>
                  Medina Stuff
                </span>
              </div>
              <p className="text-gray-600 leading-relaxed text-sm">
                Empowering modest fashion with elegance, style, and dignity for the modern Muslimah.
              </p>
            </div>

            {/* Shop */}
            <div>
              <h4 className="font-bold text-gray-900 mb-4 text-base relative inline-block">
                Shop
                <span className="absolute left-0 -bottom-1 w-8 h-0.5 bg-[#cb5094]"></span>
              </h4>
              <ul className="space-y-3">
                {['New Arrivals', 'Hijabs', 'Dresses', 'Tunics', 'Sale'].map((item) => (
                  <li key={item}>
                    <a href="#" className="text-gray-600 hover:text-[#cb5094] transition-all text-sm transform hover:translate-x-1 inline-block">
                      {item}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            {/* Support */}
            <div>
              <h4 className="font-bold text-gray-900 mb-4 text-base relative inline-block">
                Support
                <span className="absolute left-0 -bottom-1 w-8 h-0.5 bg-[#cb5094]"></span>
              </h4>
              <ul className="space-y-3">
                {['Contact Us', 'Shipping Info', 'Returns', 'Size Guide', 'FAQ'].map((item) => (
                  <li key={item}>
                    <a href="#" className="text-gray-600 hover:text-[#cb5094] transition-all text-sm transform hover:translate-x-1 inline-block">
                      {item}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            {/* Follow Us - Instagram, WhatsApp, Shopee */}
            <div>
              <h4 className="font-bold text-gray-900 mb-4 text-base relative inline-block">
                Follow Us
                <span className="absolute left-0 -bottom-1 w-8 h-0.5 bg-[#cb5094]"></span>
              </h4>
              <div className="flex gap-5">
                <a href="https://instagram.com/medinastuff" target="_blank" rel="noopener noreferrer"
                  className="w-12 h-12 bg-gradient-to-br from-[#fffbf8] to-white rounded-full flex items-center justify-center hover:from-[#cb5094] hover:to-[#e570b3] hover:text-white transition-all duration-300 transform hover:scale-110 hover:-translate-y-1 shadow-md hover:shadow-xl border border-gray-100">
                  <Instagram className="w-6 h-6 text-[#cb5094] hover:text-white" />
                </a>
                <a href="https://wa.me/6281234567890" target="_blank" rel="noopener noreferrer"
                  className="w-12 h-12 bg-gradient-to-br from-[#fffbf8] to-white rounded-full flex items-center justify-center hover:from-[#25d366] hover:to-[#128c7e] hover:text-white transition-all duration-300 transform hover:scale-110 hover:-translate-y-1 shadow-md hover:shadow-xl border border-gray-100">
                  <MessageCircle className="w-6 h-6 text-[#cb5094] hover:text-white" />
                </a>
                <a href="https://shopee.co.id/medinastuff" target="_blank" rel="noopener noreferrer"
                  className="w-12 h-12 bg-gradient-to-br from-[#fffbf8] to-white rounded-full flex items-center justify-center hover:from-[#ee4d2d] hover:to-[#c1351f] hover:text-white transition-all duration-300 transform hover:scale-110 hover:-translate-y-1 shadow-md hover:shadow-xl border border-gray-100">
                  <ShoppingBag className="w-6 h-6 text-[#cb5094] hover:text-white" />
                </a>
              </div>
            </div>
          </div>

          <div className="border-t border-gray-200 pt-8 text-center">
            <p className="text-gray-600 text-sm">
              © 2025 Medina Stuff. All rights reserved. Made with <Heart className="inline-block w-4 h-4 text-red-500 animate-pulse mx-1" /> for the Muslimah community.
            </p>
          </div>
        </div>
      </footer>

      {/* Custom Animations */}
      <style jsx>{`
        @keyframes float { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-20px)} }
        @keyframes float-delayed { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-15px)} }
        @keyframes float-slow { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-25px)} }
        @keyframes spin-slow { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
        @keyframes spin-reverse { from{transform:rotate(360deg)} to{transform:rotate(0deg)} }
        .animate-float { animation: float 6s ease-in-out infinite; }
        .animate-float-delayed { animation: float-delayed 8s ease-in-out infinite; animation-delay:1s; }
        .animate-float-slow { animation: float-slow 7s ease-in-out infinite; animation-delay:.5s; }
        .animate-spin-slow { animation: spin-slow 20s linear infinite; }
        .animate-spin-reverse { animation: spin-reverse 15s linear infinite; }
      `}</style>
    </div>
  );
}

export default Home;