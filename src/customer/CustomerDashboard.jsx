import { useState, useEffect } from "react";
import { useNavigate, useLocation, Outlet } from "react-router-dom";
import { Menu, X, ShoppingCart, Package, LogOut, Home } from "lucide-react";

function CustomerDashboard() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [cartCount, setCartCount] = useState(0);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();

  const [userData, setUserData] = useState({
    id: "",
    nama: "Guest User",
    email: "guest@example.com",
    nomorTelepon: "08123456789",
    alamat: "Belum diatur",
  });

  // Fungsi untuk membaca dan update userData dari localStorage
  const loadUserData = () => {
    try {
      const storedUser = localStorage.getItem("user");
      if (storedUser) {
        const user = JSON.parse(storedUser);
        const updatedUser = {
          id: user.id || "",
          nama: user.nama || user.name || "User",
          email: user.email || "user@example.com",
          nomorTelepon:
            user.nomorTelepon || user.phone || user.telepon || "08123456789",
          alamat: user.alamat || "Belum diatur",
        };
        setUserData(updatedUser);
      }
    } catch (err) {
      console.error("Error loading user data:", err);
    }
  };

  // Load awal + sync real-time saat localStorage berubah
  useEffect(() => {
    const checkAuthAndLoad = () => {
      const token = localStorage.getItem("accessToken");
      if (!token) {
        setIsLoading(false);
        return;
      }

      loadUserData();
      setIsLoading(false);
    };

    checkAuthAndLoad();

    // Dengarkan perubahan di localStorage (dari halaman lain atau dispatch manual)
    const handleStorageChange = (e) => {
      if (e.key === "user" || e.key === null) {
        loadUserData();
      }
    };

    window.addEventListener("storage", handleStorageChange);

    // Polling ringan setiap 2 detik untuk jaga-jaga
    const interval = setInterval(loadUserData, 2000);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
      clearInterval(interval);
    };
  }, []);

  // Update cart count real-time — HITUNG JUMLAH ITEM UNIK (cart.length), bukan total quantity
  useEffect(() => {
    const updateCartCount = () => {
      const cart = JSON.parse(localStorage.getItem("cart") || "[]");
      setCartCount(cart.length); // ← Hanya hitung jumlah produk unik di keranjang
    };

    updateCartCount();

    // Dengarkan perubahan storage (misal dari tab lain atau dispatch event)
    window.addEventListener("storage", updateCartCount);

    return () => {
      window.removeEventListener("storage", updateCartCount);
    };
  }, []);

  const handleLogout = () => setShowLogoutConfirm(true);

  const confirmLogout = () => {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("user");
    window.location.href = "/";
  };

  const cancelLogout = () => setShowLogoutConfirm(false);

  const getInitials = (name) => {
    if (!name || name === "Guest User") return "GU";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const isActiveRoute = (path) => {
    if (path === "/customer/products") {
      return (
        location.pathname === "/customer/products" ||
        location.pathname === "/customer" ||
        location.pathname === "/customer/"
      );
    }
    return location.pathname === path;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#cb5094] to-[#e570b3] flex items-center justify-center">
        <div className="text-white text-center">
          <div className="w-20 h-20 border-4 border-white/30 border-t-white rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-xl font-semibold">Memuat Toko...</p>
        </div>
      </div>
    );
  }

  const menuItems = [
    { path: "/customer/products", icon: Home, label: "Beranda" },
    { path: "/customer/orders", icon: Package, label: "Pesanan" },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 relative">
      {/* Navbar Fixed */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-lg shadow-xl border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <div className="flex items-center space-x-3">
              <button
                onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                className="lg:hidden p-2 hover:bg-pink-50 rounded-lg transition"
              >
                {isSidebarOpen ? (
                  <X className="w-6 h-6 text-[#cb5094]" />
                ) : (
                  <Menu className="w-6 h-6 text-[#cb5094]" />
                )}
              </button>

              <a
                href="/customer/products"
                className="flex items-center space-x-3"
              >
                <div className="relative w-10 h-10 bg-gradient-to-br from-[#cb5094] to-[#e570b3] rounded-full flex items-center justify-center shadow-md overflow-hidden">
                  <img
                    src="/logo.png"
                    alt="MyMedina"
                    className="w-7 h-7 object-contain z-10"
                    onError={(e) => {
                      e.target.style.display = "none";
                      e.target.nextElementSibling.style.display = "flex";
                    }}
                  />
                  <span className="absolute inset-0 flex items-center justify-center text-xl font-bold text-white z-10 hidden">
                    MM
                  </span>
                </div>
                <div className="hidden sm:block">
                  <div className="text-base font-bold text-gray-800">
                    MyMedina
                  </div>
                  <div className="text-xs text-gray-500">by Medina Stuff</div>
                </div>
              </a>
            </div>

            {/* Cart & Profile */}
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate("/customer/cart")}
                className="relative p-2 hover:bg-pink-50 rounded-full transition"
              >
                <ShoppingCart className="w-6 h-6 text-gray-700" />
                {cartCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-[#cb5094] text-white text-xs rounded-full flex items-center justify-center font-bold">
                    {cartCount}
                  </span>
                )}
              </button>

              {/* Nama user di navbar */}
              <button
                onClick={() => navigate("/customer/profile")}
                className="hidden sm:flex items-center space-x-3 hover:bg-pink-50 rounded-xl p-2 transition-all duration-200"
              >
                <div className="w-10 h-10 bg-gradient-to-br from-[#cb5094] to-[#e570b3] rounded-full flex items-center justify-center shadow-md">
                  <span className="text-sm font-bold text-white">
                    {getInitials(userData.nama)}
                  </span>
                </div>
                <div className="text-left">
                  <div className="text-sm font-bold text-gray-800">
                    {userData.nama}
                  </div>
                </div>
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="pt-16 min-h-screen pb-20 lg:pb-0 flex">
        {/* Sidebar Desktop */}
        <aside className="hidden lg:block fixed top-16 left-0 z-40 w-64 bg-white shadow-2xl h-[calc(100vh-4rem)]">
          <div className="h-full flex flex-col overflow-y-auto">
            <nav className="flex-1 p-6 space-y-2">
              {menuItems.map((item) => {
                const Icon = item.icon;
                const isActive = isActiveRoute(item.path);

                return (
                  <button
                    key={item.path}
                    onClick={() => navigate(item.path)}
                    className={`w-full flex items-center space-x-3 px-5 py-4 rounded-2xl transition-all duration-200 font-medium ${
                      isActive
                        ? "bg-gradient-to-r from-[#cb5094] to-[#e570b3] text-white shadow-lg"
                        : "text-gray-700 hover:bg-pink-50"
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span className="flex-1 text-left">{item.label}</span>
                  </button>
                );
              })}
            </nav>

            <div className="p-6 border-t border-gray-200">
              <button
                onClick={handleLogout}
                className="w-full flex items-center space-x-3 px-5 py-4 rounded-2xl text-red-600 hover:bg-red-50 transition-all duration-200 font-medium"
              >
                <LogOut className="w-5 h-5" />
                <span>Logout</span>
              </button>
            </div>
          </div>
        </aside>

        {/* Mobile Sidebar */}
        <aside
          className={`lg:hidden fixed top-16 left-0 z-40 w-64 bg-white shadow-2xl transform transition-transform duration-300 h-auto ${
            isSidebarOpen ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          <div className="p-6">
            <button
              onClick={handleLogout}
              className="w-full flex items-center space-x-3 px-5 py-4 rounded-2xl text-red-600 hover:bg-red-50 transition-all duration-200 font-medium"
            >
              <LogOut className="w-5 h-5" />
              <span>Logout</span>
            </button>
          </div>
        </aside>

        {isSidebarOpen && (
          <div
            className="fixed inset-0 bg-black/50 z-30 lg:hidden"
            onClick={() => setIsSidebarOpen(false)}
          />
        )}

        <main className="flex-1 lg:ml-64">
          <Outlet context={{ searchQuery, userData, setCartCount }} />
        </main>
      </div>

      {/* Bottom Nav Mobile */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-2xl lg:hidden z-50">
        <div className="grid grid-cols-3 h-16">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = isActiveRoute(item.path);

            return (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className={`flex flex-col items-center justify-center space-y-1 relative transition-all duration-200 ${
                  isActive ? "text-[#cb5094]" : "text-gray-600"
                }`}
              >
                <div className="relative">
                  <Icon className="w-6 h-6" />
                </div>
                <span className="text-[10px] font-medium">{item.label}</span>
                {isActive && (
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 w-12 h-1 bg-gradient-to-r from-[#cb5094] to-[#e570b3] rounded-b-full"></div>
                )}
              </button>
            );
          })}

          <button
            onClick={() => navigate("/customer/profile")}
            className={`flex flex-col items-center justify-center space-y-1 relative transition-all duration-200 ${
              isActiveRoute("/customer/profile")
                ? "text-[#cb5094]"
                : "text-gray-600"
            }`}
          >
            <div className="w-6 h-6 bg-gradient-to-br from-[#cb5094] to-[#e570b3] rounded-full flex items-center justify-center">
              <span className="text-[10px] font-bold text-white">
                {getInitials(userData.nama)}
              </span>
            </div>
            <span className="text-[10px] font-medium">Profil</span>
            {isActiveRoute("/customer/profile") && (
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-12 h-1 bg-gradient-to-r from-[#cb5094] to-[#e570b3] rounded-b-full"></div>
            )}
          </button>
        </div>
      </nav>

      {/* Popup Logout */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={cancelLogout}
          />
          <div className="relative bg-white rounded-3xl shadow-2xl max-w-sm w-full p-8 animate-in fade-in zoom-in duration-300">
            <div className="text-center mb-6">
              <div className="w-20 h-20 mx-auto mb-4 bg-gradient-to-br from-[#cb5094] to-[#e570b3] rounded-full flex items-center justify-center shadow-lg">
                <LogOut className="w-10 h-10 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-gray-800 mb-2">
                Yakin ingin keluar?
              </h3>
              <p className="text-gray-600 text-sm">
                Anda akan kembali ke halaman utama dan sesi login akan berakhir.
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={cancelLogout}
                className="flex-1 py-3.5 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold transition-all"
              >
                Batal
              </button>
              <button
                onClick={confirmLogout}
                className="flex-1 py-3.5 rounded-full bg-gradient-to-r from-[#cb5094] to-[#e570b3] hover:from-[#b44682] hover:to-[#c54e96] text-white font-bold shadow-lg hover:shadow-xl transition-all"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default CustomerDashboard;
