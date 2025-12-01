// src/Catalog/CustProduct.jsx
import { useState } from 'react';
import {
  Heart,
  ShoppingCart,
  Package,
  Clock,
  XCircle,
  Check,
} from 'lucide-react';

// Pastikan path ini benar sesuai struktur folder kamu
import DetailProduct from './DetailProduct';

function CustProduct({
  onAddToCart,
  onBuyNow,
  wishlist = [],           // <-- dari parent (CustomerDashboard)
  onToggleWishlist,        // <-- dari parent
}) {
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState('All');

  // Data produk tetap sama (bisa diganti dengan API nanti)
  const [products] = useState([
    { id: 1, name: 'Elegant Silk Hijab', price: 125000, image: 'https://images.unsplash.com/photo-1609709295948-17d77cb2a69b?w=500', category: 'Hijabs', stock: 15, status: 'ready', description: 'Premium silk hijab with elegant design and comfortable fabric. Perfect for daily wear and special occasions.' },
    { id: 2, name: 'Modern Tunic Dress',   price: 285000, image: 'https://images.unsplash.com/photo-1609709295948-17d77cb2a69b?w=500', category: 'Dresses', stock: 0,  status: 'sold-out', description: 'Contemporary tunic dress with modern cuts.' },
    { id: 3, name: 'Cotton Daily Hijab',   price: 95000,  image: 'https://images.unsplash.com/photo-1609709295948-17d77cb2a69b?w=500', category: 'Hijabs', stock: 20, status: 'ready', description: 'Soft cotton hijab perfect for everyday use.' },
    { id: 4, name: 'Classic Black Abaya',   price: 345000, image: 'https://images.unsplash.com/photo-1609709295948-17d77cb2a69b?w=500', category: 'Abayas', stock: 5,  status: 'pre-order', description: 'Timeless black abaya with elegant embroidery.' },
    { id: 5, name: 'Printed Chiffon Hijab',price: 150000, image: 'https://images.unsplash.com/photo-1609709295948-17d77cb2a69b?w=500', category: 'Hijabs', stock: 12, status: 'ready', description: 'Beautiful printed chiffon hijab.' },
    { id: 6, name: 'Modest Tunic Set',     price: 195000, image: 'https://images.unsplash.com/photo-1609709295948-17d77cb2a69b?w=500', category: 'Tunics', stock: 0,  status: 'sold-out', description: 'Complete tunic set with matching pants.' },
    { id: 7, name: 'Luxury Satin Hijab',   price: 175000, image: 'https://images.unsplash.com/photo-1609709295948-17d77cb2a69b?w=500', category: 'Hijabs', stock: 10, status: 'ready', description: 'Luxurious satin hijab with smooth texture.' },
    { id: 8, name: 'Embroidered Abaya',    price: 425000, image: 'https://images.unsplash.com/photo-1609709295948-17d77cb2a69b?w=500', category: 'Abayas', stock: 3,  status: 'pre-order', description: 'Exquisite embroidered abaya.' },
  ]);

  const categories = [
    { id: 'All',     image: '/all.png',     label: 'All' },
    { id: 'Hijabs',  image: '/hijabs.png',  label: 'Hijabs' },
    { id: 'Dresses', image: '/dresses.png', label: 'Dresses' },
    { id: 'Abayas',  image: '/abayas.png',  label: 'Abayas' },
    { id: 'Tunics',  image: '/tunics.png',  label: 'Tunics' },
  ];

  const getStatusBadge = (status) => {
    switch (status) {
      case 'ready':     return { text: 'Ready Stock', color: 'bg-green-500',  icon: Package };
      case 'pre-order': return { text: 'Pre Order',  color: 'bg-amber-500', icon: Clock };
      case 'sold-out':  return { text: 'Sold Out',   color: 'bg-red-500',   icon: XCircle };
      default:          return { text: 'Unknown',    color: 'bg-gray-500',  icon: Package };
    }
  };

  const toggleWishlistLocal = (productId) => {
    // Panggil fungsi dari parent supaya wishlist di dashboard ikut update
    if (onToggleWishlist) {
      onToggleWishlist(productId);
    }
  };

  const formatPrice = price => new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(price);

  const handleAddToCart = (product, size = 'M', color = 'Black') => {
    if (onAddToCart && product.status !== 'sold-out') {
      onAddToCart(product, size, color);
    }
  };

  const handleBuyNow = (product, size = 'M', color = 'Black') => {
    if (onBuyNow && product.status !== 'sold-out') {
      onBuyNow(product, size, color);
    }
  };

  const filteredProducts = products.filter(p => 
    selectedCategory === 'All' || p.category === selectedCategory
  );

  return (
    <>
      {/* HEADER CANTIK TETAP SAMA */}
      <div className="relative mb-8">
        <div className="relative bg-gradient-to-br from-[#cb5094] via-[#d55ba0] to-[#e570b3] text-white px-4 pb-8 overflow-hidden">
          <div className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-30" style={{ backgroundImage: 'url(/bg.png)' }}></div>

          <div className="py-6">
            <div className="absolute inset-0 overflow-hidden">
              <div className="absolute top-5 left-10 w-24 h-24 bg-white/10 rounded-full blur-2xl animate-pulse"></div>
              <div className="absolute bottom-5 right-10 w-28 h-28 bg-white/10 rounded-full blur-2xl animate-pulse" style={{ animationDelay: '1s' }}></div>
              <div className="absolute top-1/2 left-1/2 w-40 h-40 bg-white/5 rounded-full blur-2xl animate-pulse" style={{ animationDelay: '2s' }}></div>
            </div>

            <div className="absolute inset-0 overflow-hidden pointer-events-none">
              {[...Array(25)].map((_, i) => (
                <div
                  key={i}
                  className="absolute bg-white rounded-full animate-fall"
                  style={{
                    width: `${Math.random() * 4 + 2}px`,
                    height: `${Math.random() * 4 + 2}px`,
                    left: `${Math.random() * 100}%`,
                    top: `-${Math.random() * 20}%`,
                    animationDelay: `${Math.random() * 5}s`,
                    animationDuration: `${8 + Math.random() * 6}s`,
                    opacity: 0.2 + Math.random() * 0.3,
                  }}
                />
              ))}
            </div>

            <div className="max-w-7xl mx-auto relative z-10">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-3xl md:text-4xl font-serif mb-2 leading-tight">
                    ·—Our Products
                  </h1>
                  <p className="text-sm md:text-base font-serif opacity-90">
                    Discover Your Perfect Style
                  </p>
                </div>

                <div className="hidden lg:flex flex-col gap-1.5">
                  {['Free Shipping', 'Authentic', 'Premium'].map((text, idx) => (
                    <div key={idx} className="bg-white/70 backdrop-blur-sm rounded-full pl-1 pr-3 py-0.5 flex items-center gap-1.5 shadow-sm hover:shadow-md transition-all">
                      <div className="w-6 h-6 rounded-full bg-[#cb5094] flex items-center justify-center">
                        <Check className="w-3.5 h-3.5 text-white" strokeWidth={3} />
                      </div>
                      <span className="text-xs font-semibold text-[#cb5094]">{text}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Wave */}
        <div className="absolute bottom-0 left-0 right-0 h-16 -mb-5 overflow-hidden">
          <svg viewBox="0 0 1440 64" fill="none" xmlns="http://www.w3.org/2000/svg" className="absolute bottom-0 w-full">
            <path d="M0 16 L1440 16 L1440 64 L0 64 Z" fill="#e570b3" fillOpacity="0.5"/>
          </svg>
          <svg viewBox="0 0 1440 64" fill="none" xmlns="http://www.w3.org/2000/svg" className="absolute bottom-0 w-full">
            <path d="M0 32 L1440 32 L1440 64 L0 64 Z" fill="#f0a3d1" fillOpacity="0.7"/>
          </svg>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">

        {/* KATEGORI */}
        <div className="mb-10">
          <h3 className="text-lg font-semibold text-gray-800 mb-5">Shop by Category</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
            {categories.map(cat => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className="group relative flex flex-col items-center transition-all duration-300"
              >
                <div className={`relative w-24 h-24 rounded-full bg-gradient-to-br from-pink-50 to-purple-50 flex items-center justify-center transition-all ${selectedCategory === cat.id ? 'ring-4 ring-[#cb5094] shadow-lg scale-110' : 'shadow-md hover:scale-105'}`}>
                  <img
                    src={cat.image}
                    alt={cat.label}
                    onError={e => { e.target.src = '/placeholder.png'; }} // fallback kalau gambar ga ada
                    className="w-14 h-14 object-contain drop-shadow-lg group-hover:scale-110 transition-transform"
                  />
                  {selectedCategory === cat.id && (
                    <div className="absolute -top-1.5 -right-1.5 w-7 h-7 bg-[#cb5094] rounded-full flex items-center justify-center shadow-lg">
                      <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                  )}
                </div>
                <span className={`mt-2.5 text-sm font-semibold ${selectedCategory === cat.id ? 'text-[#cb5094]' : 'text-gray-700'}`}>
                  {cat.label}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* GRID PRODUK */}
        {filteredProducts.length === 0 ? (
          <div className="bg-white rounded-3xl shadow-xl p-16 text-center border border-pink-100">
            <Package className="w-24 h-24 text-gray-300 mx-auto mb-4" />
            <h3 className="text-2xl font-serif text-gray-800 mb-2">No products found</h3>
            <button
              onClick={() => setSelectedCategory('All')}
              className="mt-4 bg-gradient-to-r from-[#cb5094] to-[#e570b3] text-white px-8 py-3 rounded-full font-medium hover:scale-105 transition"
            >
              View All Products
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredProducts.map(product => {
              const isWishlisted = wishlist.includes(product.id);
              const { text: badgeText, color: badgeColor, icon: BadgeIcon } = getStatusBadge(product.status);

              return (
                <div
                  key={product.id}
                  className="bg-white rounded-3xl shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden group border border-pink-50"
                >
                  <div className="relative aspect-square overflow-hidden bg-gray-100">
                    <img
                      src={product.image}
                      alt={product.name}
                      className={`w-full h-full object-cover group-hover:scale-110 transition-transform duration-500 ${product.status === 'sold-out' ? 'grayscale opacity-60' : ''}`}
                    />

                    {/* Wishlist Button */}
                    <button
                      onClick={() => toggleWishlistLocal(product.id)}
                      className="absolute top-3 right-3 w-11 h-11 bg-white/95 backdrop-blur-sm rounded-full flex items-center justify-center shadow-lg hover:scale-110 transition z-10"
                    >
                      <Heart className={`w-5 h-5 transition-all ${isWishlisted ? 'fill-[#cb5094] text-[#cb5094] scale-110' : 'text-gray-600'}`} />
                    </button>

                    {/* Status Badge */}
                    <div className={`absolute top-3 left-3 ${badgeColor} text-white text-xs px-3 py-1.5 rounded-full font-bold shadow-lg flex items-center gap-1.5`}>
                      <BadgeIcon className="w-3.5 h-3.5" />
                      {badgeText}
                    </div>

                    {/* Low Stock Badge */}
                    {product.stock > 0 && product.stock < 10 && product.status === 'ready' && (
                      <span className="absolute bottom-3 left-3 bg-orange-500 text-white text-xs px-3 py-1 rounded-full font-bold animate-pulse shadow-lg">
                        Only {product.stock} left!
                      </span>
                    )}

                    {/* Quick View */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end justify-center pb-6">
                      <button
                        onClick={() => setSelectedProduct(product)}
                        className="bg-white text-gray-800 px-6 py-2.5 rounded-full font-medium hover:bg-gray-100 transition transform translate-y-4 group-hover:translate-y-0 shadow-xl"
                      >
                        View Details
                      </button>
                    </div>
                  </div>

                  <div className="p-5">
                    <h3 className="font-serif text-lg text-gray-800 mb-2 line-clamp-2">
                      {product.name}
                    </h3>
                    <p className="text-sm text-gray-500 mb-3">Stock: {product.stock}</p>
                    <div className="flex items-center justify-between">
                      <p className="text-xl font-bold text-[#cb5094] font-serif">
                        {formatPrice(product.price)}
                      </p>
                      <button
                        onClick={() => handleAddToCart(product)}
                        disabled={product.status === 'sold-out'}
                        className={`w-12 h-12 rounded-full flex items-center justify-center transition-all shadow-lg ${
                          product.status === 'sold-out'
                            ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                            : 'bg-gradient-to-br from-[#cb5094] to-[#e570b3] text-white hover:scale-110'
                        }`}
                      >
                        <ShoppingCart className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* MODAL DETAIL */}
      {selectedProduct && (
        <DetailProduct
          product={selectedProduct}
          onClose={() => setSelectedProduct(null)}
          onAddToCart={handleAddToCart}
          onBuyNow={handleBuyNow}
          isWishlisted={wishlist.includes(selectedProduct.id)}
          onToggleWishlist={toggleWishlistLocal}
        />
      )}

      {/* Animasi */}
      <style jsx>{`
        @keyframes slide-up { from { opacity: 0; transform: translateY(30px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes fall {
          0% { transform: translateY(-100px); opacity: 0; }
          10% { opacity: 1; }
          100% { transform: translateY(120vh) translateX(30px); opacity: 0; }
        }
        .animate-slide-up { animation: slide-up 0.8s ease-out; }
        .animate-fall { animation: fall linear infinite; }
      `}</style>
    </>
  );
}

export default CustProduct;