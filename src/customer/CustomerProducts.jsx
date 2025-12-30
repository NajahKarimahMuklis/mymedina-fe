import { useState, useEffect, useLayoutEffect, useRef } from "react";
import { useOutletContext } from "react-router-dom";
import {
  Package,
  Search,
  Grid,
  List,
  Filter,
  ChevronDown,
  X,
  Check,
  Award,
} from "lucide-react";
import { productAPI } from "../components/utils/api";
import { formatPrice } from "../components/utils/formatPrice";
import toast from "react-hot-toast";
import CustomerProductDetail from "./CustomerProductDetail";

function CustomerProducts() {
  const { searchQuery, setCartCount } = useOutletContext();

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [sortBy, setSortBy] = useState("newest");
  const [categories, setCategories] = useState(["all"]);
  const [localSearchQuery, setLocalSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState("grid");
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showSortDropdown, setShowSortDropdown] = useState(false);
  const [showStatusDropdown, setShowStatusDropdown] = useState(false);
  const [appliedCategories, setAppliedCategories] = useState([]);
  const [tempSelectedCategories, setTempSelectedCategories] = useState([]);
  const [selectedStatus, setSelectedStatus] = useState("all");

  const pollingIntervalRef = useRef(null);
  const sortDropdownRef = useRef(null);
  const statusDropdownRef = useRef(null);

  const PRODUCTS_CACHE_KEY = "cached_products_v5";
  const CACHE_DURATION = 2 * 60 * 1000; // 2 menit
  const POLLING_INTERVAL = 10 * 1000; // 10 detik

  // Update cart count saat mount
  useLayoutEffect(() => {
    const cart = JSON.parse(localStorage.getItem("cart") || "[]");
    setCartCount(cart.length);
  }, [setCartCount]);

  const fetchProductsFromAPI = async () => {
    try {
      const response = await productAPI.getAll({
        active: true,
        limit: 100,
        sort: "createdAt:desc",
      });

      const productList = response.data?.data || response.data || [];
      const activeProducts = productList.filter((p) => p.aktif !== false);

      return activeProducts;
    } catch (err) {
      console.error("Gagal memuat produk:", err);
      throw err;
    }
  };

  const syncProducts = async (showToast = false) => {
    try {
      const freshProducts = await fetchProductsFromAPI();

      setProducts(freshProducts);

      const uniqueCategories = [
        "all",
        ...new Set(freshProducts.map((p) => p.category?.nama).filter(Boolean)),
      ];
      setCategories(uniqueCategories);

      // Simpan ke localStorage
      localStorage.setItem(
        PRODUCTS_CACHE_KEY,
        JSON.stringify({
          data: freshProducts,
          categories: uniqueCategories,
          timestamp: Date.now(),
        })
      );

      cleanupCart(freshProducts);

      if (showToast) {
        console.log("✅ Products synced successfully");
      }
    } catch (err) {
      console.error("Sync error:", err);
    }
  };

  const cleanupCart = (currentProducts) => {
    const cart = JSON.parse(localStorage.getItem("cart") || "[]");
    const productIds = new Set(currentProducts.map((p) => p.id));

    const cleanedCart = cart.filter((item) => {
      if (!productIds.has(item.id)) return false;
      const product = currentProducts.find((p) => p.id === item.id);
      if (!product || product.aktif === false) return false;
      return true;
    });

    if (cleanedCart.length !== cart.length) {
      localStorage.setItem("cart", JSON.stringify(cleanedCart));
      setCartCount(cleanedCart.length);
    }
  };

  // Load produk pertama kali (dengan cache)
  useEffect(() => {
    const fetchProducts = async () => {
      const cached = localStorage.getItem(PRODUCTS_CACHE_KEY);
      if (cached) {
        try {
          const {
            data,
            categories: cachedCategories,
            timestamp,
          } = JSON.parse(cached);
          if (Date.now() - timestamp < CACHE_DURATION) {
            setProducts(data);
            setCategories(cachedCategories);
            setLoading(false);
            syncProducts(false); // update di background
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
        toast.error("Gagal memuat produk dari server");
        setProducts([]);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  // Polling setiap 10 detik setelah loading selesai
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

  // Sync saat tab menjadi aktif kembali
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden && !loading) {
        syncProducts(false);
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () =>
      document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, [loading]);

  // Update cart count saat ada perubahan cart
  useEffect(() => {
    const cart = JSON.parse(localStorage.getItem("cart") || "[]");
    setCartCount(cart.length);
  }, [setCartCount]);

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

  const openProductDetail = (product) => {
    setSelectedProduct(product);
  };

  const closeProductDetail = () => {
    setSelectedProduct(null);
  };

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

  // Fungsi untuk hapus satu kategori dari applied
  const removeCategory = (category) => {
    setAppliedCategories(appliedCategories.filter((c) => c !== category));
  };

  // Sync temp dengan applied saat modal dibuka
  useEffect(() => {
    if (showCategoryModal) {
      setTempSelectedCategories(appliedCategories);
    }
  }, [showCategoryModal, appliedCategories]);

  const combinedSearchQuery = searchQuery || localSearchQuery;

  const filteredProducts = products
    .filter((p) => {
      // Search: harus dimulai dengan query (seperti aslinya)
      if (combinedSearchQuery) {
        const query = combinedSearchQuery.toLowerCase().trim();
        const nama = (p.nama || "").toLowerCase().trim();
        if (!nama.startsWith(query)) return false;
      }

      // Filter kategori (multi)
      if (appliedCategories.length > 0) {
        if (!appliedCategories.includes(p.category?.nama)) return false;
      }

      // Filter status
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

  const sortOptions = [
    { value: "newest", label: "Terbaru" },
    { value: "price-low", label: "Harga Terendah" },
    { value: "price-high", label: "Harga Tertinggi" },
    { value: "name", label: "Nama A-Z" },
  ];

  const statusOptions = [
    { value: "all", label: "Semua Status" },
    { value: "READY", label: "Ready Stock" },
    { value: "PO", label: "Pre Order" },
  ];

  const getProductImages = (product) => {
    return product.gambarUrl?.split("|||").filter((url) => url.trim()) || [];
  };

  // Loading skeleton
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
              <div
                key={i}
                className="bg-white rounded-2xl shadow-md border-2 border-gray-100 overflow-hidden"
              >
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

      {/* Filter Bar + Active Categories di Bawah */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12 py-6 sm:py-8">
        <div className="mb-8">
          {/* Bar utama: Tombol Kategori + Dropdown Status/Sort/View */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
            {/* Tombol Kategori */}
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

            {/* Right side: Status, Sort, View Mode */}
            <div className="flex items-center gap-4">
              {/* Status Dropdown */}
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

              {/* Sort Dropdown */}
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

              {/* View Mode Toggle */}
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

          {/* Active Categories - DITURUNKAN KE BAWAH dengan font kecil */}
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
        {filteredProducts.length === 0 ? (
          <div className="text-center py-20">
            <Package className="w-20 h-20 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-gray-700 mb-2">
              Produk tidak ditemukan
            </h3>
            <p className="text-gray-500">Coba kata kunci atau filter lain</p>
          </div>
        ) : viewMode === "grid" ? (
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
                  className="bg-white rounded-2xl shadow-md hover:shadow-xl transition-all duration-300 border border-gray-100 overflow-hidden cursor-pointer group"
                >
                  <div className="relative aspect-[3/4] overflow-hidden bg-gray-50">
                    <img
                      src={mainImg}
                      alt={product.nama}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      onError={(e) =>
                        (e.target.src =
                          "https://placehold.co/400x533/cccccc/ffffff?text=No+Image")
                      }
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
            {filteredProducts.map((product) => {
              const images = getProductImages(product);
              const mainImg =
                images[0] ||
                "https://placehold.co/400x533/cccccc/ffffff?text=No+Image";

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
                        onError={(e) =>
                          (e.target.src =
                            "https://placehold.co/400x533/cccccc/ffffff?text=No+Image")
                        }
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
                          {product.deskripsi ||
                            "Premium quality muslimah fashion"}
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

      {/* Product Detail Modal */}
      {selectedProduct && (
        <CustomerProductDetail
          product={selectedProduct}
          onClose={closeProductDetail}
          setCartCount={setCartCount}
        />
      )}
    </div>
  );
}

export default CustomerProducts;
