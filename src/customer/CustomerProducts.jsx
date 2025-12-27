import { useState, useEffect, useLayoutEffect, useRef } from 'react';
import { useOutletContext, useNavigate } from 'react-router-dom';
import { 
  Package, Heart, X, ShoppingCart, Truck, Shield, Check, ChevronLeft, ChevronRight, 
  Search, Grid, List, Clock, CheckCircle, Filter, ChevronDown, Zap, Award
} from 'lucide-react';
import { productAPI, variantAPI } from '../utils/api';
import { formatPrice } from '../utils/formatPrice';
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
  const [sortBy, setSortBy] = useState('newest');
  const [categories, setCategories] = useState(['all']);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [localSearchQuery, setLocalSearchQuery] = useState('');
  const [colorImages, setColorImages] = useState({});
  const [viewMode, setViewMode] = useState('grid');
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showSortDropdown, setShowSortDropdown] = useState(false);
  const [showStatusDropdown, setShowStatusDropdown] = useState(false);
  const [tempSelectedCategory, setTempSelectedCategory] = useState('all');
  const [appliedCategories, setAppliedCategories] = useState([]);
  const [tempSelectedCategories, setTempSelectedCategories] = useState([]);
  const [selectedStatus, setSelectedStatus] = useState('all');

  const pollingIntervalRef = useRef(null);
  const sortDropdownRef = useRef(null);
  const statusDropdownRef = useRef(null);

  const PRODUCTS_CACHE_KEY = 'cached_products_v5';
  const CACHE_DURATION = 2 * 60 * 1000;
  const POLLING_INTERVAL = 10 * 1000;

  useLayoutEffect(() => {
    const cart = JSON.parse(localStorage.getItem('cart') || '[]');
    setCartCount(cart.length);
  }, [setCartCount]);

  const fetchProductsFromAPI = async () => {
    try {
      const response = await productAPI.getAll({
        active: true,
        limit: 100,
        sort: 'createdAt:desc'
      });

      const productList = response.data?.data || response.data || [];
      const activeProducts = productList.filter(p => p.aktif !== false);
      
      return activeProducts;
    } catch (err) {
      console.error('Gagal memuat produk:', err);
      throw err;
    }
  };

  const syncProducts = async (showToast = false) => {
    try {
      const freshProducts = await fetchProductsFromAPI();
      
      setProducts(freshProducts);
      
      const uniqueCategories = ['all', ...new Set(freshProducts.map(p => p.category?.nama).filter(Boolean))];
      setCategories(uniqueCategories);

      localStorage.setItem(PRODUCTS_CACHE_KEY, JSON.stringify({
        data: freshProducts,
        categories: uniqueCategories,
        timestamp: Date.now()
      }));

      cleanupCart(freshProducts);
      cleanupWishlist(freshProducts);

      if (showToast) {
        console.log('✅ Products synced successfully');
      }
    } catch (err) {
      console.error('Sync error:', err);
    }
  };

  const cleanupCart = (currentProducts) => {
    const cart = JSON.parse(localStorage.getItem('cart') || '[]');
    const productIds = new Set(currentProducts.map(p => p.id));
    
    const cleanedCart = cart.filter(item => {
      if (!productIds.has(item.id)) return false;
      const product = currentProducts.find(p => p.id === item.id);
      if (!product || product.aktif === false) return false;
      return true;
    });

    if (cleanedCart.length !== cart.length) {
      localStorage.setItem('cart', JSON.stringify(cleanedCart));
      setCartCount(cleanedCart.length);
    }
  };

  const cleanupWishlist = (currentProducts) => {
    const currentWishlist = JSON.parse(localStorage.getItem('wishlist') || '[]');
    const productIds = new Set(currentProducts.map(p => p.id));
    
    const cleanedWishlist = currentWishlist.filter(id => {
      const product = currentProducts.find(p => p.id === id);
      return productIds.has(id) && product && product.aktif !== false;
    });

    if (cleanedWishlist.length !== currentWishlist.length) {
      localStorage.setItem('wishlist', JSON.stringify(cleanedWishlist));
      setWishlist(cleanedWishlist);
      setWishlistCount(cleanedWishlist.length);
    }
  };

  useEffect(() => {
    const fetchProducts = async () => {
      const cached = localStorage.getItem(PRODUCTS_CACHE_KEY);
      if (cached) {
        try {
          const { data, categories: cachedCategories, timestamp } = JSON.parse(cached);
          if (Date.now() - timestamp < CACHE_DURATION) {
            setProducts(data);
            setCategories(cachedCategories);
            setLoading(false);
            syncProducts(false);
            return;
          }
        } catch (e) {
          localStorage.removeItem(PRODUCTS_CACHE_KEY);
        }
      }

      try {
        setLoading(true);
        await syncProducts(false);
      } catch (err) {
        toast.error('Gagal memuat produk dari server');
        setProducts([]);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  useEffect(() => {
    if (!loading) {
      pollingIntervalRef.current = setInterval(() => {
        syncProducts(false);
      }, POLLING_INTERVAL);
    }

    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
    };
  }, [loading]);

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden && !loading) {
        syncProducts(false);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [loading]);

  useEffect(() => {
    const savedWishlist = JSON.parse(localStorage.getItem('wishlist') || '[]');
    setWishlist(savedWishlist);
    setWishlistCount(savedWishlist.length);
    
    const cart = JSON.parse(localStorage.getItem('cart') || '[]');
    setCartCount(cart.length);
  }, [setCartCount, setWishlistCount]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (sortDropdownRef.current && !sortDropdownRef.current.contains(event.target)) {
        setShowSortDropdown(false);
      }
      if (statusDropdownRef.current && !statusDropdownRef.current.contains(event.target)) {
        setShowStatusDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

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

      // Build colorImages from variants (since gambar is synced by color)
      const colorImagesMap = {};
      activeVariants.forEach(v => {
        if (v.gambar && !colorImagesMap[v.warna]) {
          colorImagesMap[v.warna] = v.gambar;
        }
      });
      setColorImages(colorImagesMap);

      // Save to localStorage for caching if needed
      localStorage.setItem(`colorImages-${product.id}`, JSON.stringify(colorImagesMap));
    } catch (err) {
      setVariants([]);
      setColorImages({});
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
    setColorImages({});
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

  const addToCart = (goToCheckout = false) => {
    if (!selectedProduct.aktif) {
      toast.error('Produk tidak tersedia');
      return;
    }
    
    const cart = JSON.parse(localStorage.getItem('cart') || '[]');
    
    const maxStock = selectedVariant ? selectedVariant.stok : (selectedProduct.stok || 999);

    if (selectedVariant) {
      const existingIndex = cart.findIndex(
        item => item.id === selectedProduct.id && item.variantId === selectedVariant.id
      );
      
      if (existingIndex >= 0) {
        const currentQty = cart[existingIndex].quantity;
        const newQty = currentQty + quantity;

        if (newQty > maxStock) {
          toast.error(`Stok tersedia hanya ${maxStock} pcs. Tidak bisa menambah lebih!`);
          return;
        }

        cart[existingIndex].quantity = newQty;
        toast.success(`Quantity updated! Total: ${newQty} items`);
      } else {
        if (quantity > maxStock) {
          toast.error(`Stok tersedia hanya ${maxStock} pcs`);
          return;
        }

        const variantImageUrl = colorImages[selectedVariant.warna] || null;

        const finalPrice = selectedVariant.hargaOverride !== null && selectedVariant.hargaOverride !== undefined
          ? selectedVariant.hargaOverride
          : selectedProduct.hargaDasar;

        cart.push({
          id: selectedProduct.id,
          nama: selectedProduct.nama,
          gambarUrl: selectedProduct.gambarUrl,
          category: selectedProduct.category,
          variantId: selectedVariant.id,
          variantName: `${selectedVariant.ukuran} - ${selectedVariant.warna}`,
          size: selectedVariant.ukuran,
          color: selectedVariant.warna,
          quantity,
          harga: finalPrice,
          aktif: selectedProduct.aktif,
          stok: selectedVariant.stok,
          variantImageUrl: variantImageUrl
        });
        toast.success(`${selectedProduct.nama} ditambahkan ke keranjang!`);
      }
    } else {
      const existingIndex = cart.findIndex(
        item => item.id === selectedProduct.id && !item.variantId
      );
      
      if (existingIndex >= 0) {
        const currentQty = cart[existingIndex].quantity;
        const newQty = currentQty + quantity;

        if (newQty > maxStock) {
          toast.error(`Stok tersedia hanya ${maxStock} pcs. Tidak bisa menambah lebih!`);
          return;
        }

        cart[existingIndex].quantity = newQty;
        toast.success(`Quantity updated! Total: ${newQty} items`);
      } else {
        if (quantity > maxStock) {
          toast.error(`Stok tersedia hanya ${maxStock} pcs`);
          return;
        }
        cart.push({
          id: selectedProduct.id,
          nama: selectedProduct.nama,
          gambarUrl: selectedProduct.gambarUrl,
          category: selectedProduct.category,
          quantity,
          harga: selectedProduct.hargaDasar,
          aktif: selectedProduct.aktif,
          stok: selectedProduct.stok || 999
        });
        toast.success(`${selectedProduct.nama} ditambahkan ke keranjang!`);
      }
    }
    
    localStorage.setItem('cart', JSON.stringify(cart));
    setCartCount(cart.length);
    
    closeProductDetail();

    if (goToCheckout) {
      navigate('/customer/checkout');
    }
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
    
    const colorImageUrl = colorImages[color];
    if (colorImageUrl) {
      const productImages = getSortedProductImages(selectedProduct);
      const imageIndex = productImages.findIndex(img => {
        const imgTrimmed = img.trim();
        const colorImgTrimmed = colorImageUrl.trim();
        return imgTrimmed === colorImgTrimmed || 
               imgTrimmed.includes(colorImgTrimmed) || 
               colorImgTrimmed.includes(imgTrimmed);
      });
      
      if (imageIndex !== -1) {
        setCurrentImageIndex(imageIndex);
      }
    }
  };

  const getProductImages = (product) => {
    return product.gambarUrl?.split('|||').filter(url => url) || [];
  };

  const getSortedProductImages = (product) => {
    const allImages = product.gambarUrl?.split('|||').filter(url => url) || [];
    
    if (Object.keys(colorImages).length === 0) {
      return allImages;
    }
    
    const sortedImages = [];
    const usedImages = new Set();
    
    const uniqueColors = [...new Set(variants.map(v => v.warna))];
    uniqueColors.forEach(color => {
      const imageUrl = colorImages[color];
      if (imageUrl) {
        const imgIndex = allImages.findIndex(img => {
          const imgTrimmed = img.trim();
          const colorImgTrimmed = imageUrl.trim();
          return imgTrimmed === colorImgTrimmed || 
                 imgTrimmed.includes(colorImgTrimmed) || 
                 colorImgTrimmed.includes(imgTrimmed);
        });
        
        if (imgIndex !== -1 && !usedImages.has(allImages[imgIndex])) {
          sortedImages.push(allImages[imgIndex]);
          usedImages.add(allImages[imgIndex]);
        }
      }
    });
    
    allImages.forEach(img => {
      if (!usedImages.has(img)) {
        sortedImages.push(img);
      }
    });
    
    return sortedImages.length > 0 ? sortedImages : allImages;
  };

  const getUniqueValues = (key) => {
    return [...new Set(variants.filter(v => v.aktif).map(v => v[key]))];
  };

  const isPreOrder = (product) => {
    return product.status === 'PO';
  };

  const isReadyStock = (product) => {
    return product.status === 'READY' && product.aktif === true;
  };

  const handleApplyCategory = () => {
    setAppliedCategories(tempSelectedCategories);
    setShowCategoryModal(false);
  };

  const handleCategoryToggle = (category) => {
    if (tempSelectedCategories.includes(category)) {
      setTempSelectedCategories(tempSelectedCategories.filter(c => c !== category));
    } else {
      setTempSelectedCategories([...tempSelectedCategories, category]);
    }
  };

  const clearAllFilters = () => {
    setTempSelectedCategories([]);
    setAppliedCategories([]);
    setSelectedStatus('all');
  };

  useEffect(() => {
    if (showCategoryModal) {
      setTempSelectedCategories(appliedCategories);
    }
  }, [showCategoryModal, appliedCategories]);

  const combinedSearchQuery = searchQuery || localSearchQuery;

  const filteredProducts = products
    .filter(p => {
      if (combinedSearchQuery) {
        const query = combinedSearchQuery.toLowerCase().trim();
        const nama = (p.nama || '').toLowerCase().trim();
        if (!nama.startsWith(query)) return false;
      }
      
      if (appliedCategories.length > 0) {
        if (!appliedCategories.includes(p.category?.nama)) return false;
      }

      if (selectedStatus !== 'all') {
        if (p.status !== selectedStatus) return false;
      }
      
      return true;
    })
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

  const sortOptions = [
    { value: 'newest', label: 'Terbaru' },
    { value: 'price-low', label: 'Harga Terendah' },
    { value: 'price-high', label: 'Harga Tertinggi' },
    { value: 'name', label: 'Nama A-Z' }
  ];

  const statusOptions = [
    { value: 'all', label: 'Semua Status' },
    { value: 'READY', label: 'Ready Stock' },
    { value: 'PO', label: 'Pre Order' }
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#faf8f3] via-white to-[#f9f6f0]">
        <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 pt-12">
          <div className="text-center">
            <div className="h-12 bg-gray-200 rounded-full w-96 mx-auto animate-pulse mb-4"></div>
            <div className="h-8 bg-gray-200 rounded-full w-72 mx-auto animate-pulse mb-6"></div>
            <div className="flex justify-center gap-4">
              <div className="h-10 w-32 bg-gray-200 rounded-xl animate-pulse"></div>
              <div className="h-10 w-32 bg-gray-200 rounded-xl animate-pulse"></div>
              <div className="h-10 w-32 bg-gray-200 rounded-xl animate-pulse"></div>
            </div>
          </div>

          <div className="mt-12 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
            {[...Array(20)].map((_, i) => (
              <div key={i} className="bg-white rounded-2xl shadow-md border-2 border-gray-100 overflow-hidden">
                <div className="aspect-[3/4] bg-gray-200 animate-pulse"></div>
                <div className="p-4 space-y-3">
                  <div className="h-5 bg-gray-200 rounded w-4/5 animate-pulse"></div>
                  <div className="h-4 bg-gray-200 rounded w-3/5 animate-pulse"></div>
                  <div className="h-6 bg-gray-200 rounded w-2/3 animate-pulse mt-4"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#faf8f3] via-white to-[#f9f6f0] w-full">
      {/* Hero Section */}
      <section className="relative py-16 overflow-hidden bg-gradient-to-br from-[#fef5fb] via-[#fef9f5] to-[#fff8f0] w-full">
        <div className="absolute top-0 right-10 w-[300px] h-[300px] bg-gradient-to-br from-[#cb5094]/15 via-[#d4b896]/8 to-transparent rounded-full blur-2xl"></div>
        <div className="absolute -bottom-10 left-10 w-[250px] h-[250px] bg-gradient-to-tr from-[#d4b896]/10 via-[#cb5094]/8 to-transparent rounded-full blur-2xl"></div>
        
        <div className="relative max-w-7xl mx-auto px-6 sm:px-8 lg:px-12">
          <div className="flex justify-center mb-6">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/80 backdrop-blur-md rounded-full shadow-lg border border-[#cb5094]/20">
              <Award className="w-4 h-4 text-[#cb5094] animate-pulse" />
              <span className="text-xs font-bold bg-gradient-to-r from-[#cb5094] to-[#e570b3] bg-clip-text text-transparent">
                Premium Collection
              </span>
            </div>
          </div>

          <div className="text-center mb-10">
            <h1 className="text-3xl md:text-5xl font-bold mb-6 leading-tight">
              <span className="bg-gradient-to-r from-[#cb5094] via-[#e570b3] to-[#cb5094] bg-clip-text text-transparent animate-gradient">
                Koleksi Busana Muslim
              </span>
              <br />
              <span className="text-gray-800">Penuh Berkah dan Gaya</span>
            </h1>

            <div className="relative max-w-2xl mx-auto group">
              <div className="absolute inset-0 bg-gradient-to-r from-[#cb5094] to-[#e570b3] rounded-full blur-xl opacity-30 group-hover:opacity-50 transition-opacity"></div>
              <div className="relative flex items-center">
                <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-[#cb5094] z-10" />
                <input
                  type="text"
                  placeholder="Cari produk impianmu..."
                  value={localSearchQuery}
                  onChange={(e) => setLocalSearchQuery(e.target.value)}
                  className="w-full pl-14 pr-6 py-3.5 rounded-full bg-white/90 backdrop-blur-md text-gray-800 text-base focus:outline-none focus:ring-4 focus:ring-[#cb5094]/30 shadow-2xl border border-[#cb5094]/10 transition-all"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Filter Bar - Outside white container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12 py-6 sm:py-8">
        <div className="flex flex-col sm:flex-row sm:flex-wrap items-start sm:items-center justify-between gap-3 sm:gap-4 mb-6 sm:mb-8">
          {/* Left side - Filter button and active categories */}
          <div className="flex items-center gap-2 sm:gap-3 flex-wrap w-full sm:w-auto">
            <button
              onClick={() => setShowCategoryModal(true)}
              className="flex items-center gap-2 px-4 sm:px-6 py-2.5 sm:py-3 bg-gradient-to-r from-[#cb5094] to-[#e570b3] text-white rounded-full font-semibold shadow-lg hover:shadow-xl transition-all hover:scale-105 text-xs sm:text-sm tracking-wide"
            >
              <Filter className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span>Kategori</span>
              {appliedCategories.length > 0 && (
                <div className="w-5 h-5 sm:w-6 sm:h-6 bg-white/30 rounded-full flex items-center justify-center">
                  <span className="text-xs font-bold">{appliedCategories.length}</span>
                </div>
              )}
            </button>

            {appliedCategories.length > 0 && (
              <>
                {appliedCategories.map(category => (
                  <div
                    key={category}
                    className="hidden sm:flex items-center gap-1.5 sm:gap-2 px-3 sm:px-5 py-2 sm:py-2.5 bg-white/80 backdrop-blur-md border-2 border-[#cb5094]/30 rounded-full shadow-md"
                  >
                    <span className="text-xs sm:text-sm font-semibold text-[#cb5094] tracking-wide">{category}</span>
                    <button
                      onClick={() => {
                        setAppliedCategories(appliedCategories.filter(c => c !== category));
                      }}
                      className="w-4 h-4 sm:w-5 sm:h-5 flex items-center justify-center hover:bg-[#cb5094]/10 rounded-full transition-all"
                    >
                      <X className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-[#cb5094]" />
                    </button>
                  </div>
                ))}
                <button
                  onClick={clearAllFilters}
                  className="hidden sm:block text-xs sm:text-sm font-semibold text-[#cb5094] hover:text-[#d85fa8] px-3 sm:px-5 py-2 sm:py-2.5 bg-white/60 hover:bg-white/80 backdrop-blur-md rounded-full transition-all shadow-md tracking-wide"
                >
                  Hapus Semua
                </button>
              </>
            )}
          </div>

          {/* Right side - Sort and view mode */}
          <div className="flex items-center gap-2 sm:gap-4 w-full sm:w-auto">
            {/* Status Dropdown */}
            <div className="relative flex-1 sm:flex-initial" ref={statusDropdownRef}>
              <button
                onClick={() => setShowStatusDropdown(!showStatusDropdown)}
                className="w-full sm:w-auto flex items-center justify-center gap-2 sm:gap-3 px-4 sm:px-6 py-2.5 sm:py-3 bg-white/80 backdrop-blur-md border-2 border-[#cb5094]/20 rounded-full font-semibold text-gray-700 hover:border-[#cb5094]/40 hover:bg-white transition-all shadow-md tracking-wide text-xs sm:text-sm whitespace-nowrap"
              >
                <span>{statusOptions.find(opt => opt.value === selectedStatus)?.label}</span>
                <ChevronDown className={`w-3.5 h-3.5 sm:w-4 sm:h-4 transition-transform ${showStatusDropdown ? 'rotate-180' : ''}`} />
              </button>

              {showStatusDropdown && (
                <div className="absolute right-0 mt-2 w-full sm:w-56 bg-white rounded-2xl shadow-2xl border-2 border-[#cb5094]/10 overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                  {statusOptions.map((option) => (
                    <button
                      key={option.value}
                      onClick={() => {
                        setSelectedStatus(option.value);
                        setShowStatusDropdown(false);
                      }}
                      className={`w-full flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4 text-left transition-all ${
                        selectedStatus === option.value
                          ? 'bg-gradient-to-r from-[#fef5fb] to-[#fff8f0] text-[#cb5094] font-bold'
                          : 'text-gray-700 hover:bg-gradient-to-r hover:from-[#fef5fb]/50 hover:to-[#fff8f0]/50 font-medium'
                      }`}
                    >
                      <span className="tracking-wide text-sm">{option.label}</span>
                      {selectedStatus === option.value && (
                        <Check className="w-4 h-4 sm:w-5 sm:h-5 text-[#cb5094]" />
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Custom Sort Dropdown */}
            <div className="relative flex-1 sm:flex-initial" ref={sortDropdownRef}>
              <button
                onClick={() => setShowSortDropdown(!showSortDropdown)}
                className="w-full sm:w-auto flex items-center justify-center gap-2 sm:gap-3 px-4 sm:px-6 py-2.5 sm:py-3 bg-white/80 backdrop-blur-md border-2 border-[#cb5094]/20 rounded-full font-semibold text-gray-700 hover:border-[#cb5094]/40 hover:bg-white transition-all shadow-md tracking-wide text-xs sm:text-sm whitespace-nowrap"
              >
                <span>{sortOptions.find(opt => opt.value === sortBy)?.label}</span>
                <ChevronDown className={`w-3.5 h-3.5 sm:w-4 sm:h-4 transition-transform ${showSortDropdown ? 'rotate-180' : ''}`} />
              </button>

              {showSortDropdown && (
                <div className="absolute right-0 mt-2 w-full sm:w-56 bg-white rounded-2xl shadow-2xl border-2 border-[#cb5094]/10 overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                  {sortOptions.map((option) => (
                    <button
                      key={option.value}
                      onClick={() => {
                        setSortBy(option.value);
                        setShowSortDropdown(false);
                      }}
                      className={`w-full flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4 text-left transition-all ${
                        sortBy === option.value
                          ? 'bg-gradient-to-r from-[#fef5fb] to-[#fff8f0] text-[#cb5094] font-bold'
                          : 'text-gray-700 hover:bg-gradient-to-r hover:from-[#fef5fb]/50 hover:to-[#fff8f0]/50 font-medium'
                      }`}
                    >
                      <span className="tracking-wide text-sm">{option.label}</span>
                      {sortBy === option.value && (
                        <Check className="w-4 h-4 sm:w-5 sm:h-5 text-[#cb5094]" />
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* View Mode Toggle */}
            <div className="flex gap-1.5 sm:gap-2 bg-white/80 backdrop-blur-md p-1 sm:p-1.5 rounded-full shadow-md border-2 border-[#cb5094]/10 flex-shrink-0">
              <button 
                onClick={() => setViewMode('grid')} 
                className={`p-2 sm:p-2.5 rounded-full transition-all ${
                  viewMode === 'grid' 
                    ? 'bg-gradient-to-r from-[#cb5094] to-[#e570b3] text-white shadow-lg' 
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <Grid className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>
              <button 
                onClick={() => setViewMode('list')} 
                className={`p-2 sm:p-2.5 rounded-full transition-all ${
                  viewMode === 'list' 
                    ? 'bg-gradient-to-r from-[#cb5094] to-[#e570b3] text-white shadow-lg' 
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <List className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Products Grid */}
        {filteredProducts.length === 0 ? (
          <div className="text-center py-20">
            <Package className="w-20 h-20 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-gray-700 mb-2">Produk tidak ditemukan</h3>
            <p className="text-gray-500">Coba kata kunci atau filter lain</p>
          </div>
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
            {filteredProducts.map(product => {
              const images = getProductImages(product);
              const mainImg = images[0] || 'https://placehold.co/400x533/cccccc/ffffff?text=No+Image';

              return (
                <div
                  key={product.id}
                  onClick={() => openProductDetail(product)}
                  className="bg-white rounded-2xl shadow-md hover:shadow-xl transition-all duration-300 border border-gray-100 overflow-hidden cursor-pointer group"
                >
                  <div className="relative aspect-[3/4] overflow-hidden bg-gray-50">
                    <img
                      src={mainImg}
                      alt={product.nama}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      onError={e => e.target.src = 'https://placehold.co/400x533/cccccc/ffffff?text=No+Image'}
                    />

                    {product.category && (
                      <div className="absolute top-3 right-3">
                        <span className="px-3 py-1 bg-pink-100 text-pink-700 text-xs font-bold rounded-full">
                          {product.category.nama}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="p-4 space-y-2">
                    <h3 className="font-bold text-gray-900 text-sm leading-tight line-clamp-2 min-h-[2.5rem]">
                      {product.nama}
                    </h3>
                    <div className="text-xl font-bold text-[#cb5094] pt-1">
                      {formatPrice(product.hargaDasar)}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="space-y-4">
            {filteredProducts.map(product => {
              const images = getProductImages(product);
              const mainImg = images[0] || 'https://placehold.co/400x533/cccccc/ffffff?text=No+Image';

              return (
                <div
                  key={product.id}
                  onClick={() => openProductDetail(product)}
                  className="bg-white rounded-2xl shadow-md hover:shadow-lg transition-all duration-300 border border-gray-100 overflow-hidden cursor-pointer group"
                >
                  <div className="flex items-center gap-0">
                    <div className="w-24 h-24 sm:w-32 sm:h-32 flex-shrink-0 relative overflow-hidden m-3 sm:m-4 rounded-xl">
                      <img
                        src={mainImg}
                        alt={product.nama}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        onError={e => e.target.src = 'https://placehold.co/400x533/cccccc/ffffff?text=No+Image'}
                      />
                    </div>

                    <div className="flex-1 p-3 pr-4 sm:p-5 sm:pr-6 flex flex-col justify-center min-h-[6rem] sm:min-h-[8rem]">
                      <div className="space-y-1 sm:space-y-2">
                        {product.category && (
                          <span className="inline-block px-2.5 py-0.5 sm:px-3 sm:py-1 bg-pink-100 text-pink-700 text-[10px] sm:text-xs font-bold rounded-full">
                            {product.category.nama}
                          </span>
                        )}
                        <h3 className="font-bold text-gray-900 text-sm sm:text-base line-clamp-2 leading-tight">
                          {product.nama}
                        </h3>
                        <p className="text-gray-600 text-[11px] sm:text-sm line-clamp-1">
                          {product.deskripsi || 'Premium quality muslimah fashion'}
                        </p>
                        <div className="text-lg sm:text-2xl font-bold text-[#cb5094] pt-1">
                          {formatPrice(product.hargaDasar)}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Category Modal */}
      {showCategoryModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl">
            <div className="px-6 py-5 border-b border-gray-100 flex justify-between items-center">
              <div>
                <h3 className="text-2xl font-bold text-[#cb5094] tracking-tight">Filter Kategori</h3>
                {appliedCategories.length > 0 && (
                  <button
                    onClick={clearAllFilters}
                    className="mt-1.5 text-xs text-[#cb5094] hover:text-[#d85fa8] font-semibold transition-colors flex items-center gap-1 tracking-wide"
                  >
                    <X className="w-3 h-3" />
                    Hapus semua
                  </button>
                )}
              </div>
              <button
                onClick={() => setShowCategoryModal(false)}
                className="w-8 h-8 flex items-center justify-center hover:bg-gray-100 rounded-full transition-all"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            
            <div className="p-6 max-h-96 overflow-y-auto">
              <div className="space-y-3">
                {categories.filter(cat => cat !== 'all').map(category => {
                  const isSelected = tempSelectedCategories.includes(category);
                  const productCount = products.filter(p => p.category?.nama === category).length;
                  
                  return (
                    <label
                      key={category}
                      className={`flex items-center justify-between p-4 rounded-xl cursor-pointer transition-all ${
                        isSelected
                          ? 'bg-gradient-to-r from-[#cb5094] to-[#e570b3] shadow-lg'
                          : 'bg-gray-50 hover:bg-gray-100'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                          isSelected
                            ? 'bg-white border-white'
                            : 'border-gray-300'
                        }`}>
                          {isSelected && (
                            <div className="w-2.5 h-2.5 rounded-full bg-gradient-to-br from-[#cb5094] to-[#e570b3]"></div>
                          )}
                        </div>
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleCategoryToggle(category)}
                          className="hidden"
                        />
                        <span className={`font-semibold tracking-wide ${
                          isSelected ? 'text-white' : 'text-gray-700'
                        }`}>
                          {category}
                        </span>
                      </div>
                      <span className={`text-xs font-bold px-3 py-1.5 rounded-full ${
                        isSelected
                          ? 'bg-white/20 text-white'
                          : 'bg-white text-gray-600'
                      }`}>
                        {productCount}
                      </span>
                    </label>
                  );
                })}
              </div>
            </div>

            <div className="p-6 border-t border-gray-100 flex gap-3">
              {tempSelectedCategories.length > 0 && (
                <button
                  onClick={() => setTempSelectedCategories([])}
                  className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 py-3.5 rounded-full font-bold transition-all tracking-wide"
                >
                  Reset
                </button>
              )}
              <button
                onClick={handleApplyCategory}
                className="flex-1 bg-gradient-to-r from-[#cb5094] to-[#e570b3] text-white py-3.5 rounded-full font-bold hover:shadow-xl transition-all tracking-wide"
              >
                {tempSelectedCategories.length > 0 
                  ? `Terapkan (${tempSelectedCategories.length})`
                  : 'Tutup'
                }
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Product Detail Modal */}
      {selectedProduct && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="sticky top-0 bg-gradient-to-r from-[#fef5fb] to-[#fff8f0] backdrop-blur-md px-6 py-5 flex justify-between items-center z-10 border-b-2 border-[#cb5094]/10">
              <h2 className="text-xl font-bold bg-gradient-to-r from-[#cb5094] to-[#d85fa8] bg-clip-text text-transparent">Detail Produk</h2>
              <button
                onClick={closeProductDetail}
                className="w-10 h-10 bg-white hover:bg-gray-50 rounded-full flex items-center justify-center transition-all shadow-md border-2 border-[#cb5094]/20"
              >
                <X className="w-5 h-5 text-gray-700" />
              </button>
            </div>

            <div className="grid md:grid-cols-2 gap-8 p-8">
              <div className="space-y-4">
                <div className="relative overflow-hidden rounded-2xl bg-gray-50 aspect-square border-2 border-[#cb5094]/10">
                  {(() => {
                    const images = getSortedProductImages(selectedProduct);
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
                              className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/95 backdrop-blur-sm rounded-full flex items-center justify-center shadow-xl hover:bg-white transition-all"
                            >
                              <ChevronLeft className="w-5 h-5 text-gray-800" />
                            </button>
                            <button
                              onClick={() => setCurrentImageIndex((currentImageIndex + 1) % images.length)}
                              className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/95 backdrop-blur-sm rounded-full flex items-center justify-center shadow-xl hover:bg-white transition-all"
                            >
                              <ChevronRight className="w-5 h-5 text-gray-800" />
                            </button>
                            
                            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                              {images.map((_, idx) => (
                                <button
                                  key={idx}
                                  onClick={() => setCurrentImageIndex(idx)}
                                  className={`h-2 rounded-full transition-all ${
                                    idx === currentImageIndex
                                      ? 'bg-[#cb5094] w-8'
                                      : 'bg-white/70 w-2'
                                  }`}
                                />
                              ))}
                            </div>
                          </>
                        )}

                        <div className="absolute top-4 left-4">
                          {isPreOrder(selectedProduct) ? (
                            <div className="bg-gradient-to-r from-[#d4b896] to-[#e5c9a6] text-white px-4 py-2 rounded-xl text-sm font-bold shadow-xl flex items-center gap-2">
                              <Clock className="w-4 h-4" />
                              Pre Order
                            </div>
                          ) : isReadyStock(selectedProduct) ? (
                            <div className="bg-gradient-to-r from-green-500 to-green-600 text-white px-4 py-2 rounded-xl text-sm font-bold shadow-xl flex items-center gap-2">
                              <CheckCircle className="w-4 h-4" />
                              Ready Stock
                            </div>
                          ) : null}
                        </div>
                      </>
                    );
                  })()}
                </div>

                {(() => {
                  const images = getSortedProductImages(selectedProduct);
                  if (images.length > 1) {
                    return (
                      <div className="grid grid-cols-4 gap-3">
                        {images.slice(0, 4).map((img, idx) => {
                          let colorLabel = '';
                          for (const [color, imageUrl] of Object.entries(colorImages)) {
                            const imgTrimmed = img.trim();
                            const colorImgTrimmed = imageUrl.trim();
                            if (imgTrimmed === colorImgTrimmed || 
                                imgTrimmed.includes(colorImgTrimmed) || 
                                colorImgTrimmed.includes(imgTrimmed)) {
                              colorLabel = color;
                              break;
                            }
                          }
                          
                          return (
                            <button
                              key={idx}
                              onClick={() => setCurrentImageIndex(idx)}
                              className={`relative overflow-hidden rounded-xl aspect-square border-2 transition-all group ${
                                idx === currentImageIndex
                                  ? 'border-[#cb5094] shadow-lg scale-105'
                                  : 'border-[#cb5094]/20 hover:border-[#cb5094]/40'
                              }`}
                            >
                              <img src={img} alt="" className="w-full h-full object-cover" />
                              {colorLabel && (
                                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent py-1 px-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                  <p className="text-white text-[9px] font-bold text-center truncate">{colorLabel}</p>
                                </div>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    );
                  }
                })()}

                {selectedProduct.deskripsi && (
                  <div className="bg-white rounded-2xl p-5 border-2 border-gray-100 shadow-sm">
                    <h3 className="font-bold text-gray-900 text-sm mb-3 flex items-center gap-2">
                      <div className="w-1 h-4 bg-gradient-to-b from-[#cb5094] to-[#d85fa8] rounded-full"></div>
                      Deskripsi
                    </h3>
                    <p className="text-gray-600 text-sm leading-relaxed whitespace-pre-wrap">
                      {selectedProduct.deskripsi}
                    </p>
                  </div>
                )}
              </div>

              <div className="space-y-5">
                <div>
                  {selectedProduct.category && (
                    <span className="inline-block bg-gradient-to-r from-[#cb5094]/10 to-[#d4b896]/10 text-[#cb5094] px-4 py-1.5 rounded-xl text-xs font-bold mb-3 border-2 border-[#cb5094]/20">
                      {selectedProduct.category.nama}
                    </span>
                  )}
                  <h1 className="text-3xl font-bold text-gray-900 mb-2 leading-tight">{selectedProduct.nama}</h1>
                </div>

                <div className="bg-gradient-to-br from-[#fef5fb] to-white rounded-2xl p-5 border-2 border-[#cb5094]/20 shadow-md">
                  <div className="text-xs text-gray-600 mb-1 font-semibold">Harga</div>
                  <div className="text-2xl font-bold bg-gradient-to-r from-[#cb5094] to-[#d85fa8] bg-clip-text text-transparent">
                    {formatPrice(
                      selectedVariant?.hargaOverride !== null && selectedVariant?.hargaOverride !== undefined
                        ? selectedVariant.hargaOverride
                        : selectedProduct.hargaDasar
                    )}
                  </div>
                </div>

                {variants.length > 0 && (
                  <div className="space-y-4">
                    {getUniqueValues('ukuran').length > 0 && (
                      <div>
                        <div className="font-bold text-gray-800 text-sm mb-3">
                          Ukuran {selectedSize && <span className="text-[#cb5094] ml-1">• {selectedSize}</span>}
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {getUniqueValues('ukuran').map(size => {
                            const hasStock = variants.some(v => v.ukuran === size && v.aktif && v.stok > 0);
                            return (
                              <button
                                key={size}
                                onClick={() => handleSizeSelect(size)}
                                disabled={!hasStock}
                                className={`min-w-[70px] px-4 py-2.5 rounded-xl text-sm font-bold transition-all ${
                                  selectedSize === size
                                    ? 'bg-gradient-to-r from-[#cb5094] to-[#d85fa8] text-white shadow-lg'
                                    : hasStock
                                    ? 'bg-white text-gray-700 hover:bg-gradient-to-r hover:from-[#fef5fb] hover:to-white border-2 border-[#cb5094]/20 hover:border-[#cb5094]/40'
                                    : 'bg-gray-50 text-gray-300 cursor-not-allowed border-2 border-gray-100'
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
                        <div className="font-bold text-gray-800 text-sm mb-3">
                          Warna {selectedColor && <span className="text-[#cb5094] ml-1">• {selectedColor}</span>}
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {getUniqueValues('warna').map(color => {
                            const hasStock = variants.some(v => v.warna === color && v.aktif && v.stok > 0);
                            return (
                              <button
                                key={color}
                                onClick={() => handleColorSelect(color)}
                                disabled={!hasStock}
                                className={`min-w-[80px] px-4 py-2.5 rounded-xl text-sm font-bold transition-all ${
                                  selectedColor === color
                                    ? 'bg-gradient-to-r from-[#cb5094] to-[#d85fa8] text-white shadow-lg'
                                    : hasStock
                                    ? 'bg-white text-gray-700 hover:bg-gradient-to-r hover:from-[#fef5fb] hover:to-white border-2 border-[#cb5094]/20 hover:border-[#cb5094]/40'
                                    : 'bg-gray-50 text-gray-300 cursor-not-allowed border-2 border-gray-100'
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
                      <div className="bg-gradient-to-br from-green-50 to-white border-2 border-green-300 rounded-xl p-4 shadow-sm">
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="text-xs text-gray-600 mb-1 font-semibold">Stok Tersedia</div>
                            <div className="text-xl font-bold text-green-600">
                              {selectedVariant.stok} pcs
                            </div>
                          </div>
                          <Check className="w-6 h-6 text-green-500" />
                        </div>
                      </div>
                    )}

                    {selectedSize && selectedColor && !selectedVariant && (
                      <div className="bg-gradient-to-br from-red-50 to-white border-2 border-red-300 rounded-xl p-4 text-center shadow-sm">
                        <div className="text-sm font-bold text-red-600">
                          Kombinasi ini tidak tersedia
                        </div>
                      </div>
                    )}
                  </div>
                )}

                <div className="space-y-3">
                  <div className="font-bold text-gray-800 text-sm">Jumlah</div>
                  <div className="flex items-center gap-4">
                    <button
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      className="w-10 h-10 border-2 border-[#cb5094]/30 rounded-xl font-bold hover:bg-gradient-to-r hover:from-[#cb5094] hover:to-[#d85fa8] hover:text-white hover:border-transparent transition-all"
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
                      className="w-20 text-center border-2 border-[#cb5094]/30 rounded-xl px-3 py-2.5 text-sm font-bold focus:outline-none focus:border-[#cb5094]"
                    />
                    <button
                      onClick={() => {
                        const maxStock = selectedVariant?.stok || 999;
                        setQuantity(Math.min(maxStock, quantity + 1));
                      }}
                      className="w-10 h-10 border-2 border-[#cb5094]/30 rounded-xl font-bold hover:bg-gradient-to-r hover:from-[#cb5094] hover:to-[#d85fa8] hover:text-white hover:border-transparent transition-all"
                    >
                      +
                    </button>
                    <div className="text-xs text-gray-500 font-semibold">
                      Maks: {selectedVariant?.stok || 999}
                    </div>
                  </div>
                </div>

                <div className="bg-gradient-to-br from-gray-50 to-white rounded-xl p-5 border-2 border-gray-200 shadow-sm">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-xs text-gray-600 mb-1 font-semibold">Subtotal</div>
                      <div className="text-4xl font-bold text-gray-900">
                        {formatPrice(
                          (selectedVariant?.hargaOverride !== null && selectedVariant?.hargaOverride !== undefined
                            ? selectedVariant.hargaOverride
                            : selectedProduct.hargaDasar) * quantity
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-gray-500 font-semibold">{quantity} item</div>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <button
                    onClick={() => addToCart(true)}
                    disabled={
                      !selectedProduct.aktif || 
                      (variants.length > 0 && (!selectedVariant || selectedVariant.stok === 0))
                    }
                    className="w-full bg-gradient-to-r from-[#cb5094] to-[#d85fa8] hover:from-[#b44682] hover:to-[#c54e96] text-white py-4 rounded-xl font-bold hover:shadow-2xl hover:scale-[1.02] transition-all flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 shadow-xl shadow-[#cb5094]/40"
                  >
                    <Zap className="w-6 h-6" />
                    <span className="text-lg">Beli Sekarang</span>
                  </button>

                  <button
                    onClick={() => addToCart(false)}
                    disabled={
                      !selectedProduct.aktif || 
                      (variants.length > 0 && (!selectedVariant || selectedVariant.stok === 0))
                    }
                    className="w-full border-2 border-[#cb5094] text-[#cb5094] py-4 rounded-xl font-bold hover:bg-gradient-to-r hover:from-[#fef5fb] hover:to-white transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    <ShoppingCart className="w-5 h-5" />
                    Tambah ke Keranjang
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default CustomerProducts;