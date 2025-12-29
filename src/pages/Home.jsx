import { useState, useEffect, useRef } from "react";
import {
  ArrowRight,
  Sparkles,
  Truck,
  Search,
  Grid,
  List,
  ChevronLeft,
  ChevronRight,
  Shield,
  Check,
  Package,
  User,
  Award,
  Heart,
  MapPin,
  X,
  Instagram,
  MessageCircle,
  ShoppingBag,
  Clock,
  CheckCircle,
  Zap,
  Filter,
  ChevronDown,
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { productAPI, variantAPI } from "../utils/api";
import { formatPrice } from "../utils/formatPrice";

function Home() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);

  // State produk & filter - Konsisten dengan CustomerProducts
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState(["all"]);
  const [appliedCategories, setAppliedCategories] = useState([]);
  const [tempSelectedCategories, setTempSelectedCategories] = useState([]);
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [sortBy, setSortBy] = useState("newest");
  const [viewMode, setViewMode] = useState("grid");
  const [searchQuery, setSearchQuery] = useState("");
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showSortDropdown, setShowSortDropdown] = useState(false);
  const [showStatusDropdown, setShowStatusDropdown] = useState(false);

  // Modal detail produk
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [variants, setVariants] = useState([]);
  const [selectedSize, setSelectedSize] = useState(null);
  const [selectedColor, setSelectedColor] = useState(null);
  const [selectedVariant, setSelectedVariant] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [colorImages, setColorImages] = useState({});

  const navigate = useNavigate();
  const sortDropdownRef = useRef(null);
  const statusDropdownRef = useRef(null);

  // Custom TikTok Icon
  const TikTokIcon = ({ className }) => (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-5.2 1.74 2.89 2.89 0 012.31-4.64 2.93 2.93 0 01.88.13V9.4a6.84 6.84 0 00-1-.05A6.33 6.33 0 005 20.1a6.34 6.34 0 0010.86-4.43v-7a8.16 8.16 0 004.77 1.52v-3.4a4.85 4.85 0 01-1-.1z" />
    </svg>
  );

  // Efek animasi saat load
  useEffect(() => {
    setTimeout(() => setIsLoaded(true), 100);
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Fetch produk saat mount
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        const response = await productAPI.getAll({
          active: true,
          limit: 100,
          sort: "createdAt:desc",
        });

        const productList = response.data?.data || response.data || [];
        const activeProducts = productList.filter((p) => p.aktif !== false);
        setProducts(activeProducts);

        const uniqueCats = [
          "all",
          ...new Set(
            activeProducts.map((p) => p.category?.nama).filter(Boolean)
          ),
        ];
        setCategories(uniqueCats);
      } catch (err) {
        console.error("Gagal memuat produk:", err);
        setProducts([]);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  // Click outside untuk tutup dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        sortDropdownRef.current &&
        !sortDropdownRef.current.contains(event.target)
      ) {
        setShowSortDropdown(false);
      }
      if (
        statusDropdownRef.current &&
        !statusDropdownRef.current.contains(event.target)
      ) {
        setShowStatusDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Handler modal kategori
  const handleApplyCategory = () => {
    setAppliedCategories(tempSelectedCategories);
    setShowCategoryModal(false);
  };

  const handleCategoryToggle = (category) => {
    if (tempSelectedCategories.includes(category)) {
      setTempSelectedCategories(
        tempSelectedCategories.filter((c) => c !== category)
      );
    } else {
      setTempSelectedCategories([...tempSelectedCategories, category]);
    }
  };

  const removeCategory = (category) => {
    setAppliedCategories(appliedCategories.filter((c) => c !== category));
  };

  // Sync temp dengan applied saat modal dibuka
  useEffect(() => {
    if (showCategoryModal) {
      setTempSelectedCategories(appliedCategories);
    }
  }, [showCategoryModal, appliedCategories]);

  // Modal detail produk handlers
  const openProductDetail = async (product) => {
    setSelectedProduct(product);
    setQuantity(1);
    setCurrentImageIndex(0);
    setSelectedSize(null);
    setSelectedColor(null);
    setSelectedVariant(null);

    try {
      const res = await variantAPI.getByProductId(product.id, false);
      const vars = (res.data?.data || res.data || []).filter(
        (v) => v.aktif && v.stok > 0
      );
      setVariants(vars);

      const colorImagesMap = {};
      vars.forEach((v) => {
        if (v.gambar && !colorImagesMap[v.warna]) {
          colorImagesMap[v.warna] = v.gambar;
        }
      });
      setColorImages(colorImagesMap);
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

  const handleSizeSelect = (size) => {
    setSelectedSize(size);
    if (selectedColor) {
      const variant = variants.find(
        (v) => v.ukuran === size && v.warna === selectedColor
      );
      setSelectedVariant(variant || null);
    }
  };

  const handleColorSelect = (color) => {
    setSelectedColor(color);

    if (selectedSize) {
      const variant = variants.find(
        (v) => v.ukuran === selectedSize && v.warna === color
      );
      setSelectedVariant(variant || null);
    }

    const colorImageUrl = colorImages[color];
    if (colorImageUrl && selectedProduct) {
      const productImages = getSortedProductImages(selectedProduct);
      const imageIndex = productImages.findIndex((img) => {
        const imgTrimmed = img.trim();
        const colorImgTrimmed = colorImageUrl.trim();
        return (
          imgTrimmed === colorImgTrimmed ||
          imgTrimmed.includes(colorImgTrimmed) ||
          colorImgTrimmed.includes(imgTrimmed)
        );
      });

      if (imageIndex !== -1) {
        setCurrentImageIndex(imageIndex);
      }
    }
  };

  const getSortedProductImages = (product) => {
    const allImages =
      product.gambarUrl?.split("|||").filter((url) => url) || [];

    if (Object.keys(colorImages).length === 0) {
      return allImages;
    }

    const sortedImages = [];
    const usedImages = new Set();

    const uniqueColors = [...new Set(variants.map((v) => v.warna))];
    uniqueColors.forEach((color) => {
      const imageUrl = colorImages[color];
      if (imageUrl) {
        const imgIndex = allImages.findIndex((img) => {
          const imgTrimmed = img.trim();
          const colorImgTrimmed = imageUrl.trim();
          return (
            imgTrimmed === colorImgTrimmed ||
            imgTrimmed.includes(colorImgTrimmed) ||
            colorImgTrimmed.includes(imgTrimmed)
          );
        });

        if (imgIndex !== -1 && !usedImages.has(allImages[imgIndex])) {
          sortedImages.push(allImages[imgIndex]);
          usedImages.add(allImages[imgIndex]);
        }
      }
    });

    allImages.forEach((img) => {
      if (!usedImages.has(img)) {
        sortedImages.push(img);
      }
    });

    return sortedImages.length > 0 ? sortedImages : allImages;
  };

  const getProductImages = (product) => {
    return product.gambarUrl?.split("|||").filter(Boolean) || [];
  };

  const getUniqueValues = (key) => [...new Set(variants.map((v) => v[key]))];

  const isPreOrder = (product) => product.status === "PO";
  const isReadyStock = (product) =>
    product.status === "READY" && product.aktif === true;

  // LOGIKA SEARCH SUDAH DISAMAKAN DENGAN CustomerProducts
  // Hanya cek nama produk dengan .startsWith()
  const filteredProducts = products
    .filter((p) => {
      if (searchQuery) {
        const query = searchQuery.toLowerCase().trim();
        const nama = (p.nama || "").toLowerCase().trim();
        if (!nama.startsWith(query)) return false;
      }

      if (appliedCategories.length > 0) {
        if (!appliedCategories.includes(p.category?.nama)) return false;
      }

      if (selectedStatus !== "all" && p.status !== selectedStatus) return false;

      return true;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case "price-low":
          return a.hargaDasar - b.hargaDasar;
        case "price-high":
          return b.hargaDasar - a.hargaDasar;
        case "name":
          return a.nama.localeCompare(b.nama);
        default:
          return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
      }
    });

  const statusOptions = [
    { value: "all", label: "Semua Status" },
    { value: "READY", label: "Ready Stock" },
    { value: "PO", label: "Pre Order" },
  ];

  const sortOptions = [
    { value: "newest", label: "Terbaru" },
    { value: "price-low", label: "Harga Terendah" },
    { value: "price-high", label: "Harga Tertinggi" },
    { value: "name", label: "Nama A-Z" },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-purple-50 relative overflow-hidden">
      {/* Background Animasi */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-gradient-to-br from-[#cb5094] to-[#e570b3] rounded-full blur-3xl opacity-20 animate-float"></div>
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-gradient-to-br from-[#e570b3] to-[#cb5094] rounded-full blur-3xl opacity-20 animate-float-delayed"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-br from-[#cb5094]/20 to-[#e570b3]/20 rounded-full blur-3xl opacity-10 animate-spin-slow"></div>
      </div>

      {/* Navbar */}
      <nav
        className={`fixed top-0 w-full z-50 transition-all duration-500 ${
          scrolled
            ? "bg-white/80 backdrop-blur-xl shadow-2xl py-2"
            : "bg-white/70 backdrop-blur-md py-4"
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center">
            {/* Logo */}
            <div className="flex items-center space-x-3 group cursor-pointer">
              <div
                className={`relative transition-all duration-700 ${
                  isLoaded ? "scale-100 rotate-0" : "scale-0 rotate-180"
                }`}
              >
                <div className="absolute inset-0 bg-gradient-to-br from-[#cb5094] to-[#e570b3] rounded-full blur-xl opacity-40 group-hover:opacity-70 transition-opacity"></div>
                <div className="relative w-14 h-14 bg-gradient-to-br from-[#cb5094] via-[#e570b3] to-[#cb5094] rounded-full flex items-center justify-center shadow-lg group-hover:shadow-2xl transition-all duration-300 group-hover:scale-110 animate-pulse">
                  <img
                    src="/logo.png"
                    alt="Medina Stuff Logo"
                    className="w-9 h-9 object-contain relative z-10"
                    onError={(e) => {
                      e.target.style.display = "none";
                      e.target.nextElementSibling.style.display = "block";
                    }}
                  />
                  <span className="text-2xl font-serif text-white italic font-bold relative z-10 hidden">
                    MS
                  </span>
                </div>
              </div>
              <div
                className={`hidden sm:block transition-all duration-700 delay-100 ${
                  isLoaded
                    ? "opacity-100 translate-x-0"
                    : "opacity-0 -translate-x-4"
                }`}
              >
                <div className="text-xl font-bold bg-gradient-to-r from-[#cb5094] to-[#e570b3] bg-clip-text text-transparent">
                  MyMedina
                </div>
                <div className="text-xs text-gray-500 font-medium">
                  by Medina Stuff
                </div>
              </div>
            </div>

            {/* Profile Dropdown */}
            <div className="relative">
              <button
                onClick={() => setIsProfileDropdownOpen(!isProfileDropdownOpen)}
                className="relative p-3 hover:bg-pink-50 rounded-full transition-all duration-300 group"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-[#cb5094] to-[#e570b3] rounded-full blur-md opacity-0 group-hover:opacity-30 transition-opacity"></div>
                <User className="relative w-6 h-6 text-[#cb5094] group-hover:scale-110 transition-transform" />
              </button>

              {isProfileDropdownOpen && (
                <div className="absolute top-16 right-0 w-48 bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden z-50 animate-fade-in">
                  <div className="py-2">
                    <Link
                      to="/login"
                      onClick={() => setIsProfileDropdownOpen(false)}
                      className="block px-6 py-3 text-gray-800 font-medium hover:bg-gradient-to-r hover:from-[#cb5094] hover:to-[#e570b3] hover:text-white transition-all duration-300"
                    >
                      Login
                    </Link>
                    <Link
                      to="/signup"
                      onClick={() => setIsProfileDropdownOpen(false)}
                      className="block px-6 py-3 text-gray-800 font-medium hover:bg-gradient-to-r hover:from-[#cb5094] hover:to-[#e570b3] hover:text-white transition-all duration-300 border-t border-gray-100"
                    >
                      Sign Up
                    </Link>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-28 pb-20">
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-center mb-6">
            <div className="inline-flex items-center gap-2 px-6 py-3 bg-white/80 backdrop-blur-md rounded-full shadow-lg border border-[#cb5094]/20">
              <Award className="w-5 h-5 text-[#cb5094] animate-pulse" />
              <span className="text-sm font-bold bg-gradient-to-r from-[#cb5094] to-[#e570b3] bg-clip-text text-transparent">
                Premium Collection
              </span>
            </div>
          </div>

          <div className="text-center mb-12">
            <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-tight">
              <span className="bg-gradient-to-r from-[#cb5094] via-[#e570b3] to-[#cb5094] bg-clip-text text-transparent animate-gradient">
                Elevate Your Style
              </span>
              <br />
              <span className="text-gray-800">with Elegance</span>
            </h1>

            <div className="relative max-w-2xl mx-auto group">
              <div className="absolute inset-0 bg-gradient-to-r from-[#cb5094] to-[#e570b3] rounded-full blur-xl opacity-30 group-hover:opacity-50 transition-opacity"></div>
              <div className="relative flex items-center">
                <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-[#cb5094] z-10" />
                <input
                  type="text"
                  placeholder="Cari produk impianmu..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-14 pr-6 py-3.5 rounded-full bg-white/90 backdrop-blur-md text-gray-800 text-base focus:outline-none focus:ring-4 focus:ring-[#cb5094]/30 shadow-2xl border border-[#cb5094]/10 transition-all"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Products Section */}
      <section className="py-16 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Filter Bar */}
          <div className="mb-8">
            {/* Bar utama */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
              <button
                onClick={() => setShowCategoryModal(true)}
                className="flex items-center gap-3 px-6 py-3 bg-gradient-to-r from-[#cb5094] to-[#e570b3] text-white rounded-full font-semibold shadow-lg hover:shadow-xl transition-all hover:scale-105 tracking-wide"
              >
                <Filter className="w-4 h-4" />
                <span>Kategori</span>
                {appliedCategories.length > 0 && (
                  <div className="w-6 h-6 bg-white/30 rounded-full flex items-center justify-center">
                    <span className="text-xs font-bold">
                      {appliedCategories.length}
                    </span>
                  </div>
                )}
              </button>

              <div className="flex items-center gap-4">
                <div className="relative" ref={statusDropdownRef}>
                  <button
                    onClick={() => setShowStatusDropdown(!showStatusDropdown)}
                    className="flex items-center gap-3 px-6 py-3 bg-white/80 backdrop-blur-md border-2 border-[#cb5094]/20 rounded-full font-semibold text-gray-700 hover:border-[#cb5094]/40 hover:bg-white transition-all shadow-md"
                  >
                    <span>
                      {statusOptions.find((opt) => opt.value === selectedStatus)
                        ?.label || "Semua Status"}
                    </span>
                    <ChevronDown
                      className={`w-4 h-4 transition-transform ${
                        showStatusDropdown ? "rotate-180" : ""
                      }`}
                    />
                  </button>

                  {showStatusDropdown && (
                    <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-2xl border-2 border-[#cb5094]/10 overflow-hidden z-50">
                      {statusOptions.map((option) => (
                        <button
                          key={option.value}
                          onClick={() => {
                            setSelectedStatus(option.value);
                            setShowStatusDropdown(false);
                          }}
                          className={`w-full flex items-center justify-between px-6 py-4 text-left transition-all ${
                            selectedStatus === option.value
                              ? "bg-gradient-to-r from-[#fef5fb] to-[#fff8f0] text-[#cb5094] font-bold"
                              : "text-gray-700 hover:bg-gradient-to-r hover:from-[#fef5fb]/50 hover:to-[#fff8f0]/50"
                          }`}
                        >
                          <span>{option.label}</span>
                          {selectedStatus === option.value && (
                            <Check className="w-5 h-5 text-[#cb5094]" />
                          )}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <div className="relative" ref={sortDropdownRef}>
                  <button
                    onClick={() => setShowSortDropdown(!showSortDropdown)}
                    className="flex items-center gap-3 px-6 py-3 bg-white/80 backdrop-blur-md border-2 border-[#cb5094]/20 rounded-full font-semibold text-gray-700 hover:border-[#cb5094]/40 hover:bg-white transition-all shadow-md"
                  >
                    <span>
                      {sortOptions.find((opt) => opt.value === sortBy)?.label ||
                        "Terbaru"}
                    </span>
                    <ChevronDown
                      className={`w-4 h-4 transition-transform ${
                        showSortDropdown ? "rotate-180" : ""
                      }`}
                    />
                  </button>

                  {showSortDropdown && (
                    <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-2xl border-2 border-[#cb5094]/10 overflow-hidden z-50">
                      {sortOptions.map((option) => (
                        <button
                          key={option.value}
                          onClick={() => {
                            setSortBy(option.value);
                            setShowSortDropdown(false);
                          }}
                          className={`w-full flex items-center justify-between px-6 py-4 text-left transition-all ${
                            sortBy === option.value
                              ? "bg-gradient-to-r from-[#fef5fb] to-[#fff8f0] text-[#cb5094] font-bold"
                              : "text-gray-700 hover:bg-gradient-to-r hover:from-[#fef5fb]/50 hover:to-[#fff8f0]/50"
                          }`}
                        >
                          <span>{option.label}</span>
                          {sortBy === option.value && (
                            <Check className="w-5 h-5 text-[#cb5094]" />
                          )}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex gap-2 bg-white/80 backdrop-blur-md p-1.5 rounded-full shadow-md border-2 border-[#cb5094]/10">
                  <button
                    onClick={() => setViewMode("grid")}
                    className={`p-2.5 rounded-full transition-all ${
                      viewMode === "grid"
                        ? "bg-gradient-to-r from-[#cb5094] to-[#e570b3] text-white shadow-lg"
                        : "text-gray-600 hover:bg-gray-100"
                    }`}
                  >
                    <Grid className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => setViewMode("list")}
                    className={`p-2.5 rounded-full transition-all ${
                      viewMode === "list"
                        ? "bg-gradient-to-r from-[#cb5094] to-[#e570b3] text-white shadow-lg"
                        : "text-gray-600 hover:bg-gray-100"
                    }`}
                  >
                    <List className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>

            {/* Active Categories di bawah dengan font kecil */}
            {appliedCategories.length > 0 && (
              <div className="mt-5 flex flex-wrap gap-2">
                {appliedCategories.map((category) => (
                  <div
                    key={category}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white/80 backdrop-blur-md border border-[#cb5094]/30 rounded-full shadow-sm"
                  >
                    <span className="text-xs font-medium text-[#cb5094]">
                      {category}
                    </span>
                    <button
                      onClick={() => removeCategory(category)}
                      className="w-4 h-4 flex items-center justify-center hover:bg-[#cb5094]/10 rounded-full transition-all"
                    >
                      <X className="w-2.5 h-2.5 text-[#cb5094]" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Produk Grid / List */}
          {loading ? (
            <div className="flex items-center justify-center py-24">
              <div className="text-center">
                <div className="w-16 h-16 border-4 border-[#cb5094]/20 border-t-[#cb5094] rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-gray-600">Memuat produk...</p>
              </div>
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="text-center py-24 bg-white/80 backdrop-blur-md rounded-3xl shadow-lg">
              <Package className="w-20 h-20 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-600 text-lg">
                Tidak ada produk ditemukan
              </p>
            </div>
          ) : (
            <>
              {viewMode === "grid" ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                  {filteredProducts.map((product) => {
                    const images = getProductImages(product);
                    const mainImg =
                      images[0] ||
                      "https://placehold.co/400x533/cccccc/ffffff?text=No+Image";

                    return (
                      <div
                        key={product.id}
                        onClick={() => openProductDetail(product)}
                        className="bg-white rounded-2xl shadow-md hover:shadow-xl transition-all duration-300 border border-gray-100 overflow-hidden cursor-pointer"
                      >
                        <div className="relative aspect-[3/4] overflow-hidden bg-gray-50">
                          <img
                            src={mainImg}
                            alt={product.nama}
                            className="w-full h-full object-cover"
                            onError={(e) =>
                              (e.target.src =
                                "https://placehold.co/400x533/cccccc/ffffff?text=No+Image")
                            }
                          />
                          {product.category && (
                            <div className="absolute top-3 left-3">
                              <span className="px-3 py-1 bg-pink-100 text-pink-700 text-xs font-bold rounded-full">
                                {product.category.nama}
                              </span>
                            </div>
                          )}
                        </div>

                        <div className="p-4">
                          <h3 className="font-bold text-gray-900 line-clamp-2 mb-2">
                            {product.nama}
                          </h3>
                          <div className="text-2xl font-bold text-[#cb5094]">
                            {formatPrice(product.hargaDasar)}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredProducts.map((product) => {
                    const images = getProductImages(product);
                    const mainImg =
                      images[0] ||
                      "https://placehold.co/400x533/cccccc/ffffff?text=No+Image";

                    return (
                      <div
                        key={product.id}
                        onClick={() => openProductDetail(product)}
                        className="bg-white rounded-2xl shadow-md hover:shadow-lg transition-all duration-300 border border-gray-100 overflow-hidden flex cursor-pointer"
                      >
                        <div className="w-32 h-32 sm:w-40 sm:h-40 flex-shrink-0">
                          <img
                            src={mainImg}
                            alt={product.nama}
                            className="w-full h-full object-cover"
                            onError={(e) =>
                              (e.target.src =
                                "https://placehold.co/400x533/cccccc/ffffff?text=No+Image")
                            }
                          />
                        </div>

                        <div className="flex-1 p-4 sm:p-6">
                          {product.category && (
                            <span className="inline-block px-3 py-1 bg-pink-100 text-pink-700 text-xs font-medium rounded-full mb-2">
                              {product.category.nama}
                            </span>
                          )}
                          <h3 className="font-bold text-gray-900 text-lg mb-1">
                            {product.nama}
                          </h3>
                          <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                            {product.deskripsi ||
                              "Premium quality muslimah fashion"}
                          </p>
                          <div className="text-2xl font-bold text-[#cb5094]">
                            {formatPrice(product.hargaDasar)}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          )}
        </div>
      </section>

      {/* Category Modal */}
      {showCategoryModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl">
            <div className="px-6 py-5 border-b border-gray-100 flex justify-between items-center">
              <h3 className="text-2xl font-bold text-[#cb5094] tracking-tight">
                Filter Kategori
              </h3>
              <button
                onClick={() => setShowCategoryModal(false)}
                className="w-8 h-8 flex items-center justify-center hover:bg-gray-100 rounded-full transition-all"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <div className="p-6 max-h-96 overflow-y-auto">
              <div className="space-y-3">
                {categories
                  .filter((cat) => cat !== "all")
                  .map((category) => {
                    const isSelected =
                      tempSelectedCategories.includes(category);
                    const productCount = products.filter(
                      (p) => p.category?.nama === category
                    ).length;

                    return (
                      <label
                        key={category}
                        className={`flex items-center justify-between p-4 rounded-xl cursor-pointer transition-all ${
                          isSelected
                            ? "bg-gradient-to-r from-[#cb5094] to-[#e570b3] shadow-lg"
                            : "bg-gray-50 hover:bg-gray-100"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                              isSelected
                                ? "bg-white border-white"
                                : "border-gray-300"
                            }`}
                          >
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
                          <span
                            className={`font-semibold tracking-wide ${
                              isSelected ? "text-white" : "text-gray-700"
                            }`}
                          >
                            {category}
                          </span>
                        </div>
                        <span
                          className={`text-xs font-bold px-3 py-1.5 rounded-full ${
                            isSelected
                              ? "bg-white/20 text-white"
                              : "bg-white text-gray-600"
                          }`}
                        >
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
                  : "Tutup"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Detail Produk */}
      {selectedProduct && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex items-center justify-center p-4 overflow-y-auto animate-fade-in">
          <div className="bg-white rounded-3xl max-w-4xl w-full max-h-[92vh] overflow-y-auto shadow-2xl">
            <div className="sticky top-0 bg-gradient-to-r from-[#fef5fb] to-[#fff8f0] backdrop-blur-md px-6 py-5 flex justify-between items-center z-10 border-b-2 border-[#cb5094]/10">
              <h2 className="text-xl font-bold bg-gradient-to-r from-[#cb5094] to-[#d85fa8] bg-clip-text text-transparent">
                Detail Produk
              </h2>
              <button
                onClick={closeProductDetail}
                className="w-10 h-10 bg-white hover:bg-gray-50 rounded-full flex items-center justify-center transition-all shadow-md border-2 border-[#cb5094]/20"
              >
                <X className="w-5 h-5 text-gray-700" />
              </button>
            </div>

            <div className="grid md:grid-cols-2 gap-8 p-8">
              {/* Gambar & Deskripsi */}
              <div className="space-y-4">
                <div className="relative overflow-hidden rounded-2xl bg-gray-50 aspect-square border-2 border-[#cb5094]/10">
                  {(() => {
                    const images = getSortedProductImages(selectedProduct);
                    const currentImage =
                      images[currentImageIndex] ||
                      "https://via.placeholder.com/600?text=No+Image";
                    return (
                      <>
                        <img
                          src={currentImage}
                          alt={selectedProduct.nama}
                          className="w-full h-full object-cover"
                          onError={(e) =>
                            (e.target.src =
                              "https://via.placeholder.com/600?text=No+Image")
                          }
                        />

                        {images.length > 1 && (
                          <>
                            <button
                              onClick={() =>
                                setCurrentImageIndex(
                                  (currentImageIndex - 1 + images.length) %
                                    images.length
                                )
                              }
                              className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/95 backdrop-blur-sm rounded-full flex items-center justify-center shadow-xl hover:bg-white transition-all"
                            >
                              <ChevronLeft className="w-5 h-5 text-gray-800" />
                            </button>
                            <button
                              onClick={() =>
                                setCurrentImageIndex(
                                  (currentImageIndex + 1) % images.length
                                )
                              }
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
                                      ? "bg-[#cb5094] w-8"
                                      : "bg-white/70 w-2"
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

                {getSortedProductImages(selectedProduct).length > 1 && (
                  <div className="grid grid-cols-4 gap-3">
                    {getSortedProductImages(selectedProduct)
                      .slice(0, 4)
                      .map((img, idx) => {
                        let colorLabel = "";
                        for (const [color, imageUrl] of Object.entries(
                          colorImages
                        )) {
                          const imgTrimmed = img.trim();
                          const colorImgTrimmed = imageUrl.trim();
                          if (
                            imgTrimmed === colorImgTrimmed ||
                            imgTrimmed.includes(colorImgTrimmed) ||
                            colorImgTrimmed.includes(imgTrimmed)
                          ) {
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
                                ? "border-[#cb5094] shadow-lg scale-105"
                                : "border-[#cb5094]/20 hover:border-[#cb5094]/40"
                            }`}
                          >
                            <img
                              src={img}
                              alt=""
                              className="w-full h-full object-cover"
                            />
                            {colorLabel && (
                              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent py-1 px-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <p className="text-white text-[9px] font-bold text-center truncate">
                                  {colorLabel}
                                </p>
                              </div>
                            )}
                          </button>
                        );
                      })}
                  </div>
                )}

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

              {/* Detail & Pemesanan */}
              <div className="space-y-5">
                <div>
                  {selectedProduct.category && (
                    <span className="inline-block bg-gradient-to-r from-[#cb5094]/10 to-[#d4b896]/10 text-[#cb5094] px-4 py-1.5 rounded-xl text-xs font-bold mb-3 border-2 border-[#cb5094]/20">
                      {selectedProduct.category.nama}
                    </span>
                  )}
                  <h1 className="text-3xl font-bold text-gray-900 mb-2 leading-tight">
                    {selectedProduct.nama}
                  </h1>
                </div>

                <div className="bg-gradient-to-br from-[#fef5fb] to-white rounded-2xl p-5 border-2 border-[#cb5094]/20 shadow-md">
                  <div className="text-xs text-gray-600 mb-1 font-semibold">
                    Harga
                  </div>
                  <div className="text-2xl font-bold bg-gradient-to-r from-[#cb5094] to-[#d85fa8] bg-clip-text text-transparent">
                    {formatPrice(
                      selectedVariant?.hargaOverride !== null &&
                        selectedVariant?.hargaOverride !== undefined
                        ? selectedVariant.hargaOverride
                        : selectedProduct.hargaDasar
                    )}
                  </div>
                </div>

                {variants.length > 0 && (
                  <div className="space-y-4">
                    {getUniqueValues("ukuran").length > 0 && (
                      <div>
                        <div className="font-bold text-gray-800 text-sm mb-3">
                          Ukuran{" "}
                          {selectedSize && (
                            <span className="text-[#cb5094] ml-1">
                              • {selectedSize}
                            </span>
                          )}
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {getUniqueValues("ukuran").map((size) => {
                            const hasStock = variants.some(
                              (v) => v.ukuran === size && v.aktif && v.stok > 0
                            );
                            return (
                              <button
                                key={size}
                                onClick={() => handleSizeSelect(size)}
                                disabled={!hasStock}
                                className={`min-w-[70px] px-4 py-2.5 rounded-xl text-sm font-bold transition-all ${
                                  selectedSize === size
                                    ? "bg-gradient-to-r from-[#cb5094] to-[#d85fa8] text-white shadow-lg"
                                    : hasStock
                                    ? "bg-white text-gray-700 hover:bg-gradient-to-r hover:from-[#fef5fb] hover:to-white border-2 border-[#cb5094]/20 hover:border-[#cb5094]/40"
                                    : "bg-gray-50 text-gray-300 cursor-not-allowed border-2 border-gray-100"
                                }`}
                              >
                                {size}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {getUniqueValues("warna").length > 0 && (
                      <div>
                        <div className="font-bold text-gray-800 text-sm mb-3">
                          Warna{" "}
                          {selectedColor && (
                            <span className="text-[#cb5094] ml-1">
                              • {selectedColor}
                            </span>
                          )}
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {getUniqueValues("warna").map((color) => {
                            const hasStock = variants.some(
                              (v) => v.warna === color && v.aktif && v.stok > 0
                            );
                            return (
                              <button
                                key={color}
                                onClick={() => handleColorSelect(color)}
                                disabled={!hasStock}
                                className={`min-w-[80px] px-4 py-2.5 rounded-xl text-sm font-bold transition-all ${
                                  selectedColor === color
                                    ? "bg-gradient-to-r from-[#cb5094] to-[#d85fa8] text-white shadow-lg"
                                    : hasStock
                                    ? "bg-white text-gray-700 hover:bg-gradient-to-r hover:from-[#fef5fb] hover:to-white border-2 border-[#cb5094]/20 hover:border-[#cb5094]/40"
                                    : "bg-gray-50 text-gray-300 cursor-not-allowed border-2 border-gray-100"
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
                            <div className="text-xs text-gray-600 mb-1 font-semibold">
                              Stok Tersedia
                            </div>
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
                        setQuantity(
                          Math.max(
                            1,
                            Math.min(maxStock, parseInt(e.target.value) || 1)
                          )
                        );
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
                      <div className="text-xs text-gray-600 mb-1 font-semibold">
                        Subtotal
                      </div>
                      <div className="text-4xl font-bold text-gray-900">
                        {formatPrice(
                          (selectedVariant?.hargaOverride !== null &&
                          selectedVariant?.hargaOverride !== undefined
                            ? selectedVariant.hargaOverride
                            : selectedProduct.hargaDasar) * quantity
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-gray-500 font-semibold">
                        {quantity} item
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-3 pt-3">
                  <button
                    onClick={() => navigate("/login")}
                    className="w-full bg-gradient-to-r from-[#cb5094] to-[#d85fa8] hover:from-[#b44682] hover:to-[#c54e96] text-white py-4 rounded-xl font-bold hover:shadow-2xl hover:scale-[1.02] transition-all flex items-center justify-center gap-3 shadow-xl shadow-[#cb5094]/40"
                  >
                    <Zap className="w-6 h-6" />
                    <span className="text-lg">Login untuk Belanja</span>
                  </button>
                  <button
                    onClick={() => navigate("/signup")}
                    className="w-full border-2 border-[#cb5094] text-[#cb5094] py-4 rounded-xl font-bold hover:bg-gradient-to-r hover:from-[#fef5fb] hover:to-white transition-all flex items-center justify-center gap-2"
                  >
                    <User className="w-5 h-5" />
                    Daftar Sekarang
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="bg-white py-16 border-t border-gray-100 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[#cb5094] to-transparent"></div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-12 mb-12">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-[#cb5094] to-[#e570b3] rounded-full flex items-center justify-center shadow-lg">
                  <img
                    src="/logo.png"
                    alt="Medina Stuff Logo"
                    className="w-8 h-8 object-contain"
                    onError={(e) => {
                      e.target.style.display = "none";
                      e.target.nextElementSibling.style.display = "block";
                    }}
                  />
                  <span className="text-2xl font-serif text-white italic font-bold hidden">
                    MS
                  </span>
                </div>
                <span className="text-base text-gray-600 font-medium italic tracking-wide">
                  Medina Stuff
                </span>
              </div>
              <p className="text-gray-600 leading-relaxed text-sm mb-4">
                Empowering modest fashion with elegance, style, and dignity for
                the modern Muslimah.
              </p>
            </div>

            <div>
              <h4 className="font-bold text-gray-900 mb-4 text-base relative inline-block">
                Lokasi Toko
                <span className="absolute left-0 -bottom-1 w-8 h-0.5 bg-[#cb5094]"></span>
              </h4>
              <div className="space-y-3">
                <div className="flex items-start space-x-3 group cursor-pointer">
                  <MapPin className="w-5 h-5 text-[#cb5094] flex-shrink-0 mt-0.5 group-hover:scale-110 transition-transform" />
                  <div>
                    <p className="text-gray-700 text-sm font-medium group-hover:text-[#cb5094] transition-colors">
                      Jl. Kakak Tua No 18
                    </p>
                    <p className="text-gray-600 text-sm">Sukajadi, Pekanbaru</p>
                    <p className="text-gray-500 text-xs mt-1">
                      Riau, Indonesia
                    </p>
                  </div>
                </div>
                <a
                  href="https://maps.google.com/?q=Jl.+Kakak+Tua+No+18+Sukajadi+Pekanbaru"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center text-sm text-[#cb5094] hover:underline hover:text-[#b04580] transition-all mt-2 group"
                >
                  <span className="group-hover:translate-x-1 transition-transform">
                    Lihat di Maps
                  </span>
                  <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
                </a>
              </div>
            </div>

            <div>
              <h4 className="font-bold text-gray-900 mb-4 text-base relative inline-block">
                Follow Us
                <span className="absolute left-0 -bottom-1 w-8 h-0.5 bg-[#cb5094]"></span>
              </h4>
              <div className="grid grid-cols-2 gap-4">
                <a
                  href="https://instagram.com/medina_stuff"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex flex-col items-center justify-center p-4 bg-white rounded-2xl border border-gray-100 shadow-md transition-all duration-300 transform hover:scale-105 hover:-translate-y-1 hover:shadow-xl hover:bg-gradient-to-br hover:from-[#002296] hover:via-[#C0007A] hover:via-[#EA0C5F] hover:to-[#F6BA00]"
                >
                  <Instagram className="w-7 h-7 text-[#cb5094] group-hover:text-white transition-colors mb-2" />
                  <span className="text-xs text-gray-600 group-hover:text-white transition-colors font-medium">
                    Instagram
                  </span>
                </a>

                <a
                  href="https://wa.me/628117510040"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex flex-col items-center justify-center p-4 bg-gradient-to-br from-[#fffbf8] to-white rounded-2xl hover:from-[#25d366] hover:to-[#128c7e] transition-all duration-300 transform hover:scale-105 hover:-translate-y-1 shadow-md hover:shadow-xl border border-gray-100"
                >
                  <MessageCircle className="w-7 h-7 text-[#cb5094] group-hover:text-white transition-colors mb-2" />
                  <span className="text-xs text-gray-600 group-hover:text-white transition-colors font-medium">
                    WhatsApp
                  </span>
                </a>

                <a
                  href="https://shopee.co.id/medina_stuff"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex flex-col items-center justify-center p-4 bg-gradient-to-br from-[#fffbf8] to-white rounded-2xl hover:from-[#ee4d2d] hover:to-[#c1351f] transition-all duration-300 transform hover:scale-105 hover:-translate-y-1 shadow-md hover:shadow-xl border border-gray-100"
                >
                  <ShoppingBag className="w-7 h-7 text-[#cb5094] group-hover:text-white transition-colors mb-2" />
                  <span className="text-xs text-gray-600 group-hover:text-white transition-colors font-medium">
                    Shopee
                  </span>
                </a>

                <a
                  href="https://tiktok.com/@medinastuff"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex flex-col items-center justify-center p-4 bg-gradient-to-br from-[#fffbf8] to-white rounded-2xl hover:from-[#000000] hover:to-[#333333] transition-all duration-300 transform hover:scale-105 hover:-translate-y-1 shadow-md hover:shadow-xl border border-gray-100"
                >
                  <TikTokIcon className="w-7 h-7 text-[#cb5094] group-hover:text-white transition-colors mb-2" />
                  <span className="text-xs text-gray-600 group-hover:text-white transition-colors font-medium">
                    TikTok
                  </span>
                </a>
              </div>
            </div>
          </div>

          <div className="border-t border-gray-200 pt-8 text-center">
            <p className="text-gray-600 text-sm">
              © 2025 Medina Stuff. All rights reserved. Made with{" "}
              <Heart className="inline-block w-4 h-4 text-red-500 animate-pulse mx-1" />{" "}
              for the Muslimah community.
            </p>
          </div>
        </div>
      </footer>

      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-20px); }
        }
        @keyframes float-delayed {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-15px); }
        }
        @keyframes spin-slow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes gradient {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }
        @keyframes fade-in {
          from { opacity: 0; transform: scale(0.95); }
          to { opacity: 1; transform: scale(1); }
        }
        .animate-float { animation: float 6s ease-in-out infinite; }
        .animate-float-delayed { animation: float-delayed 8s ease-in-out infinite; animation-delay: 1s; }
        .animate-spin-slow { animation: spin-slow 20s linear infinite; }
        .animate-gradient { background-size: 200% 200%; animation: gradient 3s ease infinite; }
        .animate-fade-in { animation: fade-in 0.3s ease-out; }
      `}</style>
    </div>
  );
}

export default Home;
