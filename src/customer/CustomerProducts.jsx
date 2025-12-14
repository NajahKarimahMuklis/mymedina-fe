import { useState, useEffect } from 'react';
import { useOutletContext, useNavigate } from 'react-router-dom';
import { Package, Heart, X, ShoppingCart, Truck, Shield, Check, ChevronLeft, ChevronRight, Grid, List, Sparkles } from 'lucide-react';
import { productAPI, variantAPI } from '../utils/api';
import { formatPrice, getStatusLabel, getStatusColor } from '../utils/formatPrice';
import toast from 'react-hot-toast';

function CustomerProducts() {
  const { searchQuery, setCartCount, setWishlistCount } = useOutletContext();
  const navigate = useNavigate();
  
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [wishlist, setWishlist] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [variants, setVariants] = useState([]);
  const [selectedVariant, setSelectedVariant] = useState(null);
  const [selectedSize, setSelectedSize] = useState(null);
  const [selectedColor, setSelectedColor] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [viewMode, setViewMode] = useState('grid');
  const [sortBy, setSortBy] = useState('newest');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [categories, setCategories] = useState(['all']);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        const response = await productAPI.getAll({
          active: true,
          limit: 100,
          sort: 'createdAt:desc'
        });

        const productList = response.data?.data || response.data || [];
        const activeProducts = productList.filter(p => p.aktif !== false);
        setProducts(activeProducts);
        
        const uniqueCategories = ['all', ...new Set(activeProducts.map(p => p.category?.nama).filter(Boolean))];
        setCategories(uniqueCategories);
      } catch (err) {
        console.error('Gagal memuat produk:', err);
        toast.error('Gagal memuat produk dari server');
        setProducts([]);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  useEffect(() => {
    const savedWishlist = JSON.parse(localStorage.getItem('wishlist') || '[]');
    setWishlist(savedWishlist);
    
    const cart = JSON.parse(localStorage.getItem('cart') || '[]');
    const totalCount = cart.reduce((sum, item) => sum + item.quantity, 0);
    setCartCount(totalCount);
  }, [setCartCount]);

  const openProductDetail = async (product) => {
    setSelectedProduct(product);
    setQuantity(1);
    setCurrentImageIndex(0);
    setSelectedSize(null);
    setSelectedColor(null);
    setSelectedVariant(null);
    
    try {
      const variantsResponse = await variantAPI.getByProductId(product.id, false);
      const variantsData = variantsResponse.data?.data || variantsResponse.data || [];
      const activeVariants = variantsData.filter(v => v.aktif && v.stok > 0);
      
      setVariants(activeVariants);
    } catch (err) {
      console.error('Error fetching variants:', err);
      setVariants([]);
    }
  };

  const closeProductDetail = () => {
    setSelectedProduct(null);
    setVariants([]);
    setSelectedVariant(null);
    setSelectedSize(null);
    setSelectedColor(null);
    setQuantity(1);
    setCurrentImageIndex(0);
  };

  const toggleWishlist = (productId) => {
    let newWishlist;
    if (wishlist.includes(productId)) {
      newWishlist = wishlist.filter(id => id !== productId);
      toast.success('Dihapus dari wishlist');
    } else {
      newWishlist = [...wishlist, productId];
      toast.success('Ditambahkan ke wishlist');
    }
    setWishlist(newWishlist);
    localStorage.setItem('wishlist', JSON.stringify(newWishlist));
    setWishlistCount(newWishlist.length);
  };

  const addToCart = () => {
    if (!selectedProduct.aktif) {
      toast.error('Produk tidak tersedia');
      return;
    }
    
    const cart = JSON.parse(localStorage.getItem('cart') || '[]');
    
    if (selectedVariant) {
      const key = `${selectedProduct.id}-${selectedVariant.id}`;
      const existingIndex = cart.findIndex(item => item.key === key);
      
      if (existingIndex >= 0) {
        cart[existingIndex].quantity += quantity;
      } else {
        cart.push({
          ...selectedProduct,
          variantId: selectedVariant.id,
          variantName: `${selectedVariant.ukuran} - ${selectedVariant.warna}`,
          size: selectedVariant.ukuran,
          color: selectedVariant.warna,
          quantity,
          key,
          harga: selectedVariant.hargaOverride || selectedProduct.hargaDasar
        });
      }
    } else {
      const key = `${selectedProduct.id}-base`;
      const existingIndex = cart.findIndex(item => item.key === key);
      
      if (existingIndex >= 0) {
        cart[existingIndex].quantity += quantity;
      } else {
        cart.push({
          ...selectedProduct,
          quantity,
          key,
          harga: selectedProduct.hargaDasar
        });
      }
    }
    
    localStorage.setItem('cart', JSON.stringify(cart));
    const totalCount = cart.reduce((sum, item) => sum + item.quantity, 0);
    setCartCount(totalCount);
    
    toast.success(`${selectedProduct.nama} ditambahkan ke keranjang!`);
    closeProductDetail();
  };

  const handleSizeSelect = (size) => {
    setSelectedSize(size);
    if (selectedColor) {
      const variant = variants.find(v => v.ukuran === size && v.warna === selectedColor);
      setSelectedVariant(variant || null);
    }
  };

  const handleColorSelect = (color) => {
    setSelectedColor(color);
    if (selectedSize) {
      const variant = variants.find(v => v.ukuran === selectedSize && v.warna === color);
      setSelectedVariant(variant || null);
    }
  };

  const getProductImages = (product) => {
    return product.gambarUrl?.split('|||').filter(url => url) || [];
  };

  const getUniqueValues = (key) => {
    return [...new Set(variants.filter(v => v.aktif).map(v => v[key]))];
  };

  const filteredProducts = products
    .filter(p => selectedCategory === 'all' || p.category?.nama === selectedCategory)
    .filter(p => 
      p.nama?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.deskripsi?.toLowerCase().includes(searchQuery.toLowerCase())
    )
    .sort((a, b) => {
      switch (sortBy) {
        case 'price-low':
          return a.hargaDasar - b.hargaDasar;
        case 'price-high':
          return b.hargaDasar - a.hargaDasar;
        case 'name':
          return a.nama.localeCompare(b.nama);
        default:
          return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
      }
    });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-rose-50 via-white to-pink-50">
        <div className="text-center">
          <div className="relative w-16 h-16 mx-auto mb-4">
            <div className="absolute inset-0 border-3 border-pink-100 rounded-full"></div>
            <div className="absolute inset-0 border-3 border-t-[#cb5094] rounded-full animate-spin"></div>
          </div>
          <p className="text-gray-600 text-sm">Memuat produk...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FCF9EA]">
      {/* Hero Header */}
      <div className="relative overflow-hidden border-b border-[#cb5094]/10 -mx-6 -mt-6">
        {/* Animated Background Elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-12 -left-12 w-48 h-48 bg-[#cb5094]/5 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute top-1/2 -right-16 w-40 h-40 bg-[#cb5094]/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
          <div className="absolute -bottom-8 left-1/3 w-32 h-32 bg-[#cb5094]/5 rounded-full blur-3xl animate-pulse delay-500"></div>
        </div>
        
        <div className="px-4 sm:px-6 relative z-10">
          <div className="grid lg:grid-cols-2 gap-8 items-center">
            {/* Left Content */}
            <div className="py-10 sm:py-12">
              {/* Badge with animation */}
              <div className="inline-flex items-center gap-2 bg-gradient-to-r from-[#cb5094] to-[#cb5094]/80 text-white px-4 py-1.5 rounded-full mb-4 text-xs font-semibold shadow-lg shadow-[#cb5094]/30">
                <Sparkles className="w-3.5 h-3.5 animate-spin-slow" />
                <span className="animate-fade-in">Premium Collection 2025</span>
              </div>
              
              {/* Main Title with staggered animation */}
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-3 leading-tight">
                <span className="inline-block text-transparent bg-clip-text bg-gradient-to-r from-gray-900 via-[#cb5094] to-gray-900 animate-fade-in-up">
                  Our Products
                </span>
              </h1>
              
              {/* Subtitle */}
              <p className="text-sm sm:text-base text-gray-700 mb-6 max-w-md animate-fade-in-up delay-150 leading-relaxed">
                Discover the latest fashion muslimah collections with premium quality and elegant designs
              </p>
              
              {/* Trust Badges */}
              <div className="flex flex-wrap items-center gap-4 sm:gap-6">
                <div className="flex items-center gap-2 group animate-fade-in-up delay-300">
                  <div className="relative">
                    <div className="absolute inset-0 bg-[#cb5094] rounded-full blur-md opacity-30 group-hover:opacity-50 transition-opacity"></div>
                    <div className="relative w-10 h-10 bg-[#cb5094] rounded-full flex items-center justify-center transform group-hover:scale-110 transition-transform shadow-lg">
                      <Check className="w-4 h-4 text-white" />
                    </div>
                  </div>
                  <div>
                    <div className="text-xs font-bold text-gray-900">100% Original</div>
                    <div className="text-xs text-gray-600">Authentic</div>
                  </div>
                </div>
                
                <div className="flex items-center gap-2 group animate-fade-in-up delay-500">
                  <div className="relative">
                    <div className="absolute inset-0 bg-[#cb5094] rounded-full blur-md opacity-30 group-hover:opacity-50 transition-opacity"></div>
                    <div className="relative w-10 h-10 bg-white border-2 border-[#cb5094] rounded-full flex items-center justify-center transform group-hover:scale-110 transition-transform shadow-lg">
                      <Truck className="w-4 h-4 text-[#cb5094]" />
                    </div>
                  </div>
                  <div>
                    <div className="text-xs font-bold text-gray-900">Free Shipping</div>
                    <div className="text-xs text-gray-600">Min. 100K</div>
                  </div>
                </div>
                
                <div className="flex items-center gap-2 group animate-fade-in-up delay-700">
                  <div className="relative">
                    <div className="absolute inset-0 bg-[#cb5094] rounded-full blur-md opacity-30 group-hover:opacity-50 transition-opacity"></div>
                    <div className="relative w-10 h-10 bg-[#cb5094] rounded-full flex items-center justify-center transform group-hover:scale-110 transition-transform shadow-lg">
                      <Shield className="w-4 h-4 text-white" />
                    </div>
                  </div>
                  <div>
                    <div className="text-xs font-bold text-gray-900">Secure</div>
                    <div className="text-xs text-gray-600">Protected</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Image */}
            <div className="hidden lg:block relative h-[280px] animate-fade-in-up delay-300">
              <div className="absolute inset-0 bg-gradient-to-l from-transparent via-white/50 to-white z-10"></div>
              <img
                src="/bg.png"
                alt="Fashion Store"
                className="absolute inset-0 w-full h-full object-cover object-center rounded-l-3xl shadow-2xl"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#cb5094]/20 via-transparent to-transparent rounded-l-3xl"></div>
            </div>
          </div>
        </div>
        
        {/* Decorative bottom wave */}
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-[#cb5094]/20 to-transparent"></div>
      </div>

      <style jsx>{`
        @keyframes gradient {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }
        @keyframes spin-slow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes fade-in-up {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-gradient {
          animation: gradient 3s ease infinite;
        }
        .animate-spin-slow {
          animation: spin-slow 3s linear infinite;
        }
        .animate-fade-in {
          animation: fade-in 0.6s ease-out forwards;
        }
        .animate-fade-in-up {
          animation: fade-in-up 0.8s ease-out forwards;
          opacity: 0;
        }
        .delay-150 {
          animation-delay: 150ms;
        }
        .delay-300 {
          animation-delay: 300ms;
        }
        .delay-500 {
          animation-delay: 500ms;
        }
        .delay-700 {
          animation-delay: 700ms;
        }
        .delay-900 {
          animation-delay: 900ms;
        }
        .delay-1000 {
          animation-delay: 1000ms;
        }
      `}</style>

      <div className="container mx-auto px-4 sm:px-6 py-8">
        {/* Filters */}
        <div className="bg-white rounded-2xl shadow-sm border border-[#cb5094]/10 p-4 sm:p-5 mb-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-wrap gap-2">
              {categories.map(cat => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-4 py-2 rounded-full text-sm font-semibold transition-all ${
                    selectedCategory === cat
                      ? 'bg-[#cb5094] text-white shadow-md'
                      : 'bg-white text-gray-700 border border-gray-200 hover:border-[#cb5094]'
                  }`}
                >
                  {cat === 'all' ? 'All' : cat}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-3">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-4 py-2 border border-gray-200 rounded-full text-sm focus:outline-none focus:border-[#cb5094] bg-white"
              >
                <option value="newest">Newest</option>
                <option value="price-low">Price: Low to High</option>
                <option value="price-high">Price: High to Low</option>
                <option value="name">Name: A-Z</option>
              </select>

              <div className="flex gap-1 bg-gray-50 p-1 rounded-full">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 rounded-full transition-all ${
                    viewMode === 'grid' ? 'bg-white shadow-sm' : 'text-gray-500'
                  }`}
                >
                  <Grid className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 rounded-full transition-all ${
                    viewMode === 'list' ? 'bg-white shadow-sm' : 'text-gray-500'
                  }`}
                >
                  <List className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
          
          <div className="mt-3 pt-3 border-t border-gray-100">
            <p className="text-gray-600 text-xs">
              {filteredProducts.length > 0 
                ? `Showing ${filteredProducts.length} products`
                : searchQuery 
                ? `No results for "${searchQuery}"`
                : 'No products available'
              }
            </p>
          </div>
        </div>

        {/* Products Grid */}
        {filteredProducts.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-sm border border-[#cb5094]/10 p-12 text-center">
            <Package className="w-16 h-16 text-gray-200 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-gray-900 mb-2">No Products Found</h2>
            <p className="text-gray-500 mb-4">Try different keywords or filters</p>
            <button
              onClick={() => {
                setSelectedCategory('all');
                setSortBy('newest');
              }}
              className="bg-[#cb5094] text-white px-6 py-2 rounded-full text-sm font-semibold hover:bg-[#b44682] transition-all"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <div className={viewMode === 'grid' 
            ? "grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4" 
            : "space-y-4"
          }>
            {filteredProducts.map(product => {
              const images = getProductImages(product);
              const mainImage = images[0] || 'https://via.placeholder.com/400?text=No+Image';
              
              return viewMode === 'grid' ? (
                <div
                  key={product.id}
                  className="group bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-lg hover:border-[#cb5094] transition-all duration-300 cursor-pointer"
                  onClick={() => openProductDetail(product)}
                >
                  <div className="relative overflow-hidden aspect-[3/4]">
                    <img
                      src={mainImage}
                      alt={product.nama}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      onError={(e) => e.target.src = 'https://via.placeholder.com/400?text=No+Image'}
                    />
                    
                    <div className="absolute inset-0 bg-gradient-to-t from-[#cb5094]/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                    
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleWishlist(product.id);
                      }}
                      className="absolute top-2 right-2 w-8 h-8 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center shadow-md hover:scale-110 transition-all"
                    >
                      <Heart
                        className={`w-4 h-4 ${
                          wishlist.includes(product.id)
                            ? 'fill-[#cb5094] text-[#cb5094]'
                            : 'text-gray-400'
                        }`}
                      />
                    </button>

                    {product.category && (
                      <div className="absolute top-2 left-2 bg-white/90 backdrop-blur-sm text-[#cb5094] px-2 py-1 rounded-lg text-xs font-semibold">
                        {product.category.nama}
                      </div>
                    )}
                  </div>

                  <div className="p-3">
                    <h3 className="font-semibold text-gray-900 text-sm mb-1 line-clamp-2 min-h-[40px]">
                      {product.nama}
                    </h3>

                    <div className="flex items-center justify-between">
                      <div className="text-lg font-bold text-[#cb5094]">
                        {formatPrice(product.hargaDasar)}
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div
                  key={product.id}
                  className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-lg hover:border-[#cb5094] transition-all cursor-pointer"
                  onClick={() => openProductDetail(product)}
                >
                  <div className="flex gap-4 p-4">
                    <div className="relative w-32 h-32 flex-shrink-0 rounded-lg overflow-hidden">
                      <img
                        src={mainImage}
                        alt={product.nama}
                        className="w-full h-full object-cover"
                        onError={(e) => e.target.src = 'https://via.placeholder.com/400?text=No+Image'}
                      />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1 min-w-0">
                          {product.category && (
                            <span className="inline-block bg-[#cb5094]/10 text-[#cb5094] px-2 py-0.5 rounded text-xs font-semibold mb-1">
                              {product.category.nama}
                            </span>
                          )}
                          <h3 className="font-bold text-gray-900 text-base mb-1 truncate">
                            {product.nama}
                          </h3>
                        </div>
                        
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleWishlist(product.id);
                          }}
                          className="ml-2 flex-shrink-0"
                        >
                          <Heart
                            className={`w-5 h-5 ${
                              wishlist.includes(product.id)
                                ? 'fill-[#cb5094] text-[#cb5094]'
                                : 'text-gray-300'
                            }`}
                          />
                        </button>
                      </div>

                      <p className="text-gray-600 text-sm mb-2 line-clamp-1">
                        {product.deskripsi || 'Premium quality product'}
                      </p>

                      <div className="flex items-center justify-between">
                        <div className="text-xl font-bold text-[#cb5094]">
                          {formatPrice(product.hargaDasar)}
                        </div>

                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            openProductDetail(product);
                          }}
                          className="bg-[#cb5094] text-white px-4 py-2 rounded-full text-sm font-semibold hover:bg-[#b44682] transition-all flex items-center gap-2"
                        >
                          <ShoppingCart className="w-4 h-4" />
                          View
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Product Detail Modal */}
      {selectedProduct && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="sticky top-0 bg-white px-6 py-4 flex justify-between items-center z-10 border-b border-gray-100">
              <h2 className="text-lg font-bold text-gray-900">Product Details</h2>
              <button
                onClick={closeProductDetail}
                className="w-8 h-8 bg-gray-100 hover:bg-gray-200 rounded-full flex items-center justify-center transition-all"
              >
                <X className="w-4 h-4 text-gray-700" />
              </button>
            </div>

            <div className="grid md:grid-cols-2 gap-6 p-6">
              {/* Image Gallery */}
              <div className="space-y-3">
                <div className="relative overflow-hidden rounded-xl bg-gray-50 aspect-square">
                  {(() => {
                    const images = getProductImages(selectedProduct);
                    const currentImage = images[currentImageIndex] || 'https://via.placeholder.com/600?text=No+Image';
                    
                    return (
                      <>
                        <img
                          src={currentImage}
                          alt={selectedProduct.nama}
                          className="w-full h-full object-cover"
                          onError={(e) => e.target.src = 'https://via.placeholder.com/600?text=No+Image'}
                        />
                        
                        {images.length > 1 && (
                          <>
                            <button
                              onClick={() => setCurrentImageIndex((currentImageIndex - 1 + images.length) % images.length)}
                              className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center shadow-lg hover:bg-white transition-all"
                            >
                              <ChevronLeft className="w-4 h-4 text-gray-800" />
                            </button>
                            <button
                              onClick={() => setCurrentImageIndex((currentImageIndex + 1) % images.length)}
                              className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center shadow-lg hover:bg-white transition-all"
                            >
                              <ChevronRight className="w-4 h-4 text-gray-800" />
                            </button>
                            
                            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
                              {images.map((_, idx) => (
                                <button
                                  key={idx}
                                  onClick={() => setCurrentImageIndex(idx)}
                                  className={`h-1.5 rounded-full transition-all ${
                                    idx === currentImageIndex
                                      ? 'bg-[#cb5094] w-6'
                                      : 'bg-white/70 w-1.5'
                                  }`}
                                />
                              ))}
                            </div>
                          </>
                        )}

                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleWishlist(selectedProduct.id);
                          }}
                          className="absolute top-3 right-3 w-9 h-9 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center shadow-lg hover:scale-110 transition-all"
                        >
                          <Heart
                            className={`w-5 h-5 ${
                              wishlist.includes(selectedProduct.id)
                                ? 'fill-[#cb5094] text-[#cb5094]'
                                : 'text-gray-400'
                            }`}
                          />
                        </button>
                      </>
                    );
                  })()}
                </div>

                {/* Thumbnail Gallery */}
                {(() => {
                  const images = getProductImages(selectedProduct);
                  if (images.length > 1) {
                    return (
                      <div className="grid grid-cols-4 gap-2">
                        {images.slice(0, 4).map((img, idx) => (
                          <button
                            key={idx}
                            onClick={() => setCurrentImageIndex(idx)}
                            className={`relative overflow-hidden rounded-lg aspect-square border-2 transition-all ${
                              idx === currentImageIndex
                                ? 'border-[#cb5094]'
                                : 'border-gray-200 hover:border-gray-300'
                            }`}
                          >
                            <img src={img} alt="" className="w-full h-full object-cover" />
                          </button>
                        ))}
                      </div>
                    );
                  }
                })()}
              </div>

              {/* Product Info */}
              <div className="space-y-4">
                <div>
                  {selectedProduct.category && (
                    <span className="inline-block bg-pink-50 text-[#cb5094] px-3 py-1 rounded-full text-xs font-semibold mb-2 border border-pink-100">
                      {selectedProduct.category.nama}
                    </span>
                  )}
                  <h1 className="text-2xl font-bold text-gray-900 mb-1">{selectedProduct.nama}</h1>
                  <code className="text-xs text-gray-400 bg-gray-50 px-2 py-1 rounded">{selectedProduct.slug}</code>
                </div>

                <div className="bg-gradient-to-br from-pink-50 to-white rounded-xl p-4 border border-pink-100">
                  <div className="text-xs text-gray-600 mb-1">Price</div>
                  <div className="text-3xl font-bold text-[#cb5094]">
                    {formatPrice(selectedVariant?.hargaOverride || selectedProduct.hargaDasar)}
                  </div>
                  {selectedProduct.berat && (
                    <div className="text-xs text-gray-600 mt-2 flex items-center gap-1">
                      <Package className="w-3 h-3" />
                      Weight: <span className="font-semibold">{selectedProduct.berat}g</span>
                    </div>
                  )}
                </div>

                {/* Variants */}
                {variants.length > 0 && (
                  <div className="space-y-3">
                    {getUniqueValues('ukuran').length > 0 && (
                      <div>
                        <div className="font-semibold text-gray-800 text-sm mb-2">Size {selectedSize && <span className="text-[#cb5094]">• {selectedSize}</span>}</div>
                        <div className="flex flex-wrap gap-2">
                          {getUniqueValues('ukuran').map(size => {
                            const hasStock = variants.some(v => v.ukuran === size && v.aktif && v.stok > 0);
                            return (
                              <button
                                key={size}
                                onClick={() => handleSizeSelect(size)}
                                disabled={!hasStock}
                                className={`min-w-[60px] px-3 py-2 rounded-lg text-sm font-semibold transition-all ${
                                  selectedSize === size
                                    ? 'bg-[#cb5094] text-white'
                                    : hasStock
                                    ? 'bg-gray-50 text-gray-700 hover:bg-gray-100 border border-gray-200'
                                    : 'bg-gray-50 text-gray-300 cursor-not-allowed border border-gray-100'
                                }`}
                              >
                                {size}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {getUniqueValues('warna').length > 0 && (
                      <div>
                        <div className="font-semibold text-gray-800 text-sm mb-2">Color {selectedColor && <span className="text-[#cb5094]">• {selectedColor}</span>}</div>
                        <div className="flex flex-wrap gap-2">
                          {getUniqueValues('warna').map(color => {
                            const hasStock = variants.some(v => v.warna === color && v.aktif && v.stok > 0);
                            return (
                              <button
                                key={color}
                                onClick={() => handleColorSelect(color)}
                                disabled={!hasStock}
                                className={`min-w-[70px] px-3 py-2 rounded-lg text-sm font-semibold transition-all ${
                                  selectedColor === color
                                    ? 'bg-[#cb5094] text-white'
                                    : hasStock
                                    ? 'bg-gray-50 text-gray-700 hover:bg-gray-100 border border-gray-200'
                                    : 'bg-gray-50 text-gray-300 cursor-not-allowed border border-gray-100'
                                }`}
                              >
                                {color}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {selectedVariant && (
                      <div className="bg-green-50 border border-green-200 rounded-xl p-3">
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="text-xs text-gray-600 mb-0.5">Stock Available</div>
                            <div className="text-lg font-bold text-green-600">
                              {selectedVariant.stok} pcs
                            </div>
                          </div>
                          <Check className="w-5 h-5 text-green-500" />
                        </div>
                      </div>
                    )}

                    {selectedSize && selectedColor && !selectedVariant && (
                      <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-center">
                        <div className="text-sm font-semibold text-red-600">
                          This combination is not available
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Quantity */}
                <div className="space-y-2">
                  <div className="font-semibold text-gray-800 text-sm">Quantity</div>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      className="w-9 h-9 border border-gray-300 rounded-lg font-bold hover:border-[#cb5094] hover:text-[#cb5094] transition-all"
                    >
                      -
                    </button>
                    <input
                      type="number"
                      value={quantity}
                      onChange={(e) => {
                        const maxStock = selectedVariant?.stok || 999;
                        setQuantity(Math.max(1, Math.min(maxStock, parseInt(e.target.value) || 1)));
                      }}
                      className="w-16 text-center border border-gray-300 rounded-lg px-3 py-2 text-sm font-semibold focus:outline-none focus:border-[#cb5094]"
                    />
                    <button
                      onClick={() => {
                        const maxStock = selectedVariant?.stok || 999;
                        setQuantity(Math.min(maxStock, quantity + 1));
                      }}
                      className="w-9 h-9 border border-gray-300 rounded-lg font-bold hover:border-[#cb5094] hover:text-[#cb5094] transition-all"
                    >
                      +
                    </button>
                    <div className="text-xs text-gray-500">
                      Max: {selectedVariant?.stok || 999}
                    </div>
                  </div>
                </div>

                {/* Subtotal */}
                <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-xs text-gray-600 mb-0.5">Subtotal</div>
                      <div className="text-2xl font-bold text-gray-900">
                        {formatPrice((selectedVariant?.hargaOverride || selectedProduct.hargaDasar) * quantity)}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs text-gray-500">{quantity} item(s)</div>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="space-y-2">
                  <button
                    onClick={addToCart}
                    disabled={
                      !selectedProduct.aktif || 
                      (variants.length > 0 && (!selectedVariant || selectedVariant.stok === 0))
                    }
                    className="w-full bg-[#cb5094] text-white py-3 rounded-full font-semibold hover:bg-[#b44682] transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ShoppingCart className="w-4 h-4" />
                    {variants.length > 0 && !selectedVariant
                      ? 'Select Variant First'
                      : 'Add to Cart'
                    }
                  </button>

                  <button
                    onClick={() => toggleWishlist(selectedProduct.id)}
                    className="w-full border border-[#cb5094] text-[#cb5094] py-3 rounded-full font-semibold hover:bg-pink-50 transition-all flex items-center justify-center gap-2"
                  >
                    <Heart className={`w-4 h-4 ${wishlist.includes(selectedProduct.id) ? 'fill-current' : ''}`} />
                    {wishlist.includes(selectedProduct.id) ? 'Remove from Wishlist' : 'Add to Wishlist'}
                  </button>
                </div>

                {/* Description */}
                {selectedProduct.deskripsi && (
                  <div className="border-t border-gray-100 pt-4">
                    <h3 className="font-semibold text-gray-900 text-sm mb-2">Description</h3>
                    <p className="text-gray-600 text-sm leading-relaxed whitespace-pre-wrap">
                      {selectedProduct.deskripsi}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default CustomerProducts;