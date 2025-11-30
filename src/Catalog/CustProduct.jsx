import { useState } from 'react';
import { Heart, ShoppingCart, Package, Clock, XCircle, Check } from 'lucide-react';
import DetailProduct from './DetailProduct';

function CustProduct({ onAddToCart, onBuyNow }) {
  const [wishlist, setWishlist] = useState([1, 3, 5]);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState('All');

  const [products] = useState([
    { id: 1, name: 'Elegant Silk Hijab', price: 125000, image: 'https://images.unsplash.com/photo-1583391733956-6c78276477e2?w=500', category: 'Hijabs', stock: 15, status: 'ready', description: 'Premium silk hijab with elegant design and comfortable fabric. Perfect for daily wear and special occasions.' },
    { id: 2, name: 'Modern Tunic Dress', price: 285000, image: 'https://images.unsplash.com/photo-1596783074918-c84cb06531ca?w=500', category: 'Dresses', stock: 0, status: 'sold-out', description: 'Contemporary tunic dress with modern cuts. Made from high-quality breathable fabric for all-day comfort.' },
    { id: 3, name: 'Cotton Daily Hijab', price: 95000, image: 'https://images.unsplash.com/photo-1601924357840-3c115e5e1bb5?w=500', category: 'Hijabs', stock: 20, status: 'ready', description: 'Soft cotton hijab perfect for everyday use. Lightweight and easy to style in various ways.' },
    { id: 4, name: 'Classic Black Abaya', price: 345000, image: 'https://images.unsplash.com/photo-1609709295948-17d77cb2a69b?w=500', category: 'Abayas', stock: 5, status: 'pre-order', description: 'Timeless black abaya with elegant embroidery details. Premium fabric with excellent drape and flow.' },
    { id: 5, name: 'Printed Chiffon Hijab', price: 150000, image: 'https://images.unsplash.com/photo-1582627991900-7ab4ec1cf56b?w=500', category: 'Hijabs', stock: 12, status: 'ready', description: 'Beautiful printed chiffon hijab with unique patterns. Lightweight and stylish for any occasion.' },
    { id: 6, name: 'Modest Tunic Set', price: 195000, image: 'https://images.unsplash.com/photo-1617127365659-c47fa864d8bc?w=500', category: 'Tunics', stock: 0, status: 'sold-out', description: 'Complete tunic set with matching pants. Comfortable fabric and modest design for everyday elegance.' },
    { id: 7, name: 'Luxury Satin Hijab', price: 175000, image: 'https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=500', category: 'Hijabs', stock: 10, status: 'ready', description: 'Luxurious satin hijab with smooth texture and elegant shine. Perfect for formal events.' },
    { id: 8, name: 'Embroidered Abaya', price: 425000, image: 'https://images.unsplash.com/photo-1606760859157-5e1551e44d2e?w=500', category: 'Abayas', stock: 3, status: 'pre-order', description: 'Exquisite embroidered abaya with intricate handwork. A statement piece for special occasions.' },
  ]);

  const categories = [
    { id: 'All', image: '/all.png', label: 'All' },
    { id: 'Hijabs', image: '/hijabs.png', label: 'Hijabs' },
    { id: 'Dresses', image: '/dresses.png', label: 'Dresses' },
    { id: 'Abayas', image: '/abayas.png', label: 'Abayas' },
    { id: 'Tunics', image: '/tunics.png', label: 'Tunics' },
  ];

  const getStatusBadge = (status) => {
    switch(status) {
      case 'ready':
        return { text: 'Ready Stock', color: 'bg-green-500', icon: Package };
      case 'pre-order':
        return { text: 'Pre Order', color: 'bg-amber-500', icon: Clock };
      case 'sold-out':
        return { text: 'Sold Out', color: 'bg-red-500', icon: XCircle };
      default:
        return { text: 'Unknown', color: 'bg-gray-500', icon: Package };
    }
  };

  const toggleWishlist = (productId) => {
    setWishlist(prev =>
      prev.includes(productId)
        ? prev.filter(id => id !== productId)
        : [...prev, productId]
    );
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(price);
  };

  const handleAddToCart = (product, size = 'M', color = 'Black') => {
    if (onAddToCart && product.status !== 'sold-out') {
      onAddToCart(product, size, color);
    }
  };

  const handleBuyNow = (product, size, color) => {
    if (onBuyNow && product.status !== 'sold-out') {
      onBuyNow(product, size, color);
    }
  };

  const filteredProducts = products.filter(product => 
    selectedCategory === 'All' || product.category === selectedCategory
  );

  return (
    <div className="min-h-screen bg-[#fffbf8]">
      {/* Header Section - Proporsional */}
      <div className="relative mb-8">
        {/* Main Header Box */}
        <div className="relative bg-gradient-to-br from-[#cb5094] via-[#d55ba0] to-[#e570b3] text-white px-4 pb-8 overflow-hidden">
          {/* Background Image */}
          <div 
            className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-30"
            style={{ backgroundImage: 'url(/bg.png)' }}
          ></div>

          <div className="py-6">
            {/* Animated Background Elements */}
            <div className="absolute inset-0 overflow-hidden">
              <div className="absolute top-5 left-10 w-24 h-24 bg-white/10 rounded-full blur-2xl animate-pulse"></div>
              <div className="absolute bottom-5 right-10 w-28 h-28 bg-white/10 rounded-full blur-2xl animate-pulse" style={{ animationDelay: '1s' }}></div>
              <div className="absolute top-1/2 left-1/2 w-40 h-40 bg-white/5 rounded-full blur-2xl animate-pulse" style={{ animationDelay: '2s' }}></div>
            </div>

            {/* Falling Sparkles Animation */}
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
                    filter: 'blur(0.5px)'
                  }}
                ></div>
              ))}
            </div>

            <div className="max-w-7xl mx-auto relative z-10">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-3xl md:text-4xl font-serif mb-2 animate-slide-up leading-tight">
                  ·—̳͟͞͞♡ Our Products
                  </h1>
                  
                  <p className="text-sm md:text-base font-serif opacity-90 animate-slide-up" style={{ animationDelay: '0.1s' }}>
                    Discover Your Perfect Style 🛍️
                  </p>
                </div>

                {/* Benefits - Ultra Compact Minimalist */}
                <div className="hidden lg:flex flex-col gap-1.5">
                  {/* Free Shipping */}
                  <div className="bg-white/70 backdrop-blur-sm rounded-full pl-1 pr-3 py-0.5 flex items-center gap-1.5 shadow-sm hover:shadow-md transition-all">
                    <div className="w-6 h-6 rounded-full bg-[#cb5094] flex items-center justify-center flex-shrink-0">
                      <Check className="w-3.5 h-3.5 text-white" strokeWidth={3} />
                    </div>
                    <span className="text-xs font-semibold text-[#cb5094]">Free Shipping</span>
                  </div>

                  {/* Authentic */}
                  <div className="bg-white/70 backdrop-blur-sm rounded-full pl-1 pr-3 py-0.5 flex items-center gap-1.5 shadow-sm hover:shadow-md transition-all">
                    <div className="w-6 h-6 rounded-full bg-[#cb5094] flex items-center justify-center flex-shrink-0">
                      <Check className="w-3.5 h-3.5 text-white" strokeWidth={3} />
                    </div>
                    <span className="text-xs font-semibold text-[#cb5094]">Authentic</span>
                  </div>

                  {/* Premium */}
                  <div className="bg-white/70 backdrop-blur-sm rounded-full pl-1 pr-3 py-0.5 flex items-center gap-1.5 shadow-sm hover:shadow-md transition-all">
                    <div className="w-6 h-6 rounded-full bg-[#cb5094] flex items-center justify-center flex-shrink-0">
                      <Check className="w-3.5 h-3.5 text-white" strokeWidth={3} />
                    </div>
                    <span className="text-xs font-semibold text-[#cb5094]">Premium</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Layered Straight Waves at Bottom */}
        <div className="absolute bottom-0 left-0 right-0 h-16 -mb-5">
          {/* Wave Layer 2 - Back (darkest pink) */}
          <svg viewBox="0 0 1440 64" fill="none" xmlns="http://www.w3.org/2000/svg" className="absolute bottom-0 w-full h-auto">
            <path d="M0 16 L1440 16 L1440 64 L0 64 Z" fill="#e570b3" fillOpacity="0.5"/>
          </svg>
          
          {/* Wave Layer 1 - Front (medium pink) */}
          <svg viewBox="0 0 1440 64" fill="none" xmlns="http://www.w3.org/2000/svg" className="absolute bottom-0 w-full h-auto">
            <path d="M0 32 L1440 32 L1440 64 L0 64 Z" fill="#f0a3d1" fillOpacity="0.7"/>
          </svg>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
        {/* Category Cards - Proporsional dan Balance */}
        <div className="mb-8">
          <h3 className="text-lg font-semibold text-gray-800 mb-5">Shop by Category</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
            {categories.map(category => (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                className="group relative flex flex-col items-center transition-all duration-300"
              >
                {/* Circle Image Container */}
                <div className={`relative w-24 h-24 rounded-full bg-gradient-to-br from-pink-50 to-purple-50 flex items-center justify-center transition-all duration-300 ${
                  selectedCategory === category.id
                    ? 'ring-4 ring-[#cb5094] shadow-lg scale-110'
                    : 'shadow-md hover:shadow-lg hover:scale-105'
                }`}>
                  <img 
                    src={category.image} 
                    alt={category.label}
                    className="w-14 h-14 object-contain drop-shadow-lg group-hover:scale-110 transition-transform duration-300"
                  />
                  
                  {/* Selected Indicator */}
                  {selectedCategory === category.id && (
                    <div className="absolute -top-1.5 -right-1.5 w-7 h-7 bg-[#cb5094] rounded-full flex items-center justify-center shadow-lg">
                      <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                  )}
                </div>
                
                {/* Label */}
                <span className={`mt-2.5 text-sm font-semibold transition-colors ${
                  selectedCategory === category.id
                    ? 'text-[#cb5094]'
                    : 'text-gray-700'
                }`}>
                  {category.label}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Products Grid - Proporsional */}
        {filteredProducts.length === 0 ? (
          <div className="bg-white rounded-3xl shadow-xl p-12 text-center border border-pink-100">
            <div className="text-gray-300 mb-4">
              <Package className="w-24 h-24 mx-auto" />
            </div>
            <h3 className="text-2xl font-serif text-gray-800 mb-2">No products found</h3>
            <p className="text-gray-600 mb-6">Try selecting a different category</p>
            <button
              onClick={() => setSelectedCategory('All')}
              className="bg-gradient-to-r from-[#cb5094] to-[#e570b3] text-white px-8 py-3 rounded-full hover:shadow-lg transition-all hover:scale-105 font-medium"
            >
              View All Products
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredProducts.map((product) => {
              const isWishlisted = wishlist.includes(product.id);
              const statusBadge = getStatusBadge(product.status);
              const StatusIcon = statusBadge.icon;
              
              return (
                <div
                  key={product.id}
                  className="bg-white rounded-3xl shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden group relative border border-pink-50"
                >
                  {/* Product Image */}
                  <div className="relative aspect-square overflow-hidden bg-gray-100">
                    <img
                      src={product.image}
                      alt={product.name}
                      className={`w-full h-full object-cover group-hover:scale-110 transition-transform duration-500 ${
                        product.status === 'sold-out' ? 'grayscale opacity-60' : ''
                      }`}
                    />
                    
                    {/* Wishlist Button */}
                    <button
                      onClick={() => toggleWishlist(product.id)}
                      className="absolute top-3 right-3 w-11 h-11 bg-white/95 backdrop-blur-sm rounded-full flex items-center justify-center shadow-lg hover:bg-white transition-all hover:scale-110 z-10"
                    >
                      <Heart
                        className={`w-5 h-5 transition-all ${
                          isWishlisted ? 'fill-[#cb5094] text-[#cb5094] scale-110' : 'text-gray-600'
                        }`}
                      />
                    </button>

                    {/* Status Badge */}
                    <div className={`absolute top-3 left-3 ${statusBadge.color} text-white text-xs px-3 py-1.5 rounded-full font-bold shadow-lg flex items-center gap-1.5`}>
                      <StatusIcon className="w-3.5 h-3.5" />
                      {statusBadge.text}
                    </div>

                    {/* Stock Badge for Low Stock */}
                    {product.stock > 0 && product.stock < 10 && product.status === 'ready' && (
                      <span className="absolute bottom-3 left-3 bg-orange-500 text-white text-xs px-3 py-1 rounded-full font-bold shadow-lg animate-pulse">
                        Only {product.stock} left!
                      </span>
                    )}

                    {/* Quick Actions Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end justify-center pb-6">
                      <button
                        onClick={() => setSelectedProduct(product)}
                        className="bg-white text-gray-800 px-6 py-2.5 rounded-full font-medium hover:bg-gray-100 transition transform translate-y-4 group-hover:translate-y-0 shadow-xl"
                      >
                        View Details
                      </button>
                    </div>
                  </div>

                  {/* Product Info */}
                  <div className="p-5">
                    <h3 className="font-serif text-lg text-gray-800 mb-3 line-clamp-2 min-h-[3.5rem]">
                      {product.name}
                    </h3>
                    
                    {/* Stock Info */}
                    <div className="mb-3">
                      <span className="text-sm text-gray-500 font-medium">Stock: {product.stock}</span>
                    </div>

                    {/* Price and Add to Cart */}
                    <div className="flex items-center justify-between">
                      <p className="text-xl font-bold text-[#cb5094] font-serif">{formatPrice(product.price)}</p>
                      
                      <button
                        onClick={() => handleAddToCart(product)}
                        disabled={product.status === 'sold-out'}
                        className={`w-12 h-12 rounded-full flex items-center justify-center transition-all shadow-lg hover:shadow-xl ${
                          product.status === 'sold-out'
                            ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                            : 'bg-gradient-to-br from-[#cb5094] to-[#e570b3] text-white hover:scale-110'
                        }`}
                        title={product.status === 'sold-out' ? 'Sold Out' : 'Add to Cart'}
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

      {/* Detail Product Modal */}
      {selectedProduct && (
        <DetailProduct
          product={selectedProduct}
          onClose={() => setSelectedProduct(null)}
          onAddToCart={handleAddToCart}
          onBuyNow={handleBuyNow}
          isWishlisted={wishlist.includes(selectedProduct.id)}
          onToggleWishlist={toggleWishlist}
        />
      )}

      <style jsx>{`
        @keyframes slide-up {
          from { 
            opacity: 0;
            transform: translateY(30px);
          }
          to { 
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        @keyframes fall {
          0% {
            transform: translateY(-100px) translateX(0);
            opacity: 0;
          }
          10% {
            opacity: 1;
          }
          90% {
            opacity: 1;
          }
          100% {
            transform: translateY(120vh) translateX(20px);
            opacity: 0;
          }
        }
        
        .animate-slide-up {
          animation: slide-up 0.8s ease-out;
        }
        
        .animate-fall {
          animation: fall linear infinite;
        }
      `}</style>
    </div>
  );
}

export default CustProduct;