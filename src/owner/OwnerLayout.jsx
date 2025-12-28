import { useState, useEffect } from "react";
import { useNavigate, useLocation, Outlet } from "react-router-dom";
import {
  BarChart3,
  LogOut,
  FileText,
  DollarSign,
  Users,
  ShoppingCart,
  Package,
  Menu,
  X,
} from "lucide-react";

function OwnerLayout({ children }) {
  const [isLoading, setIsLoading] = useState(true);
  const [ownerData, setOwnerData] = useState({
    nama: "Owner",
    email: "owner@medinastuff.com",
    role: "OWNER",
  });
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const checkAuth = () => {
      try {
        const token = localStorage.getItem("accessToken");
        const storedUser = localStorage.getItem("user");

        if (!token || !storedUser) {
          navigate("/login", { replace: true });
          return;
        }

        const user = JSON.parse(storedUser);
        const userRole = (user.role || "").toString().trim().toUpperCase();

        if (userRole !== "OWNER") {
          if (userRole === "ADMIN") {
            navigate("/admin/dashboard", { replace: true });
          } else if (userRole === "CUSTOMER") {
            navigate("/customer/products", { replace: true });
          } else {
            navigate("/login", { replace: true });
          }
          return;
        }

        setOwnerData({
          nama: user.nama || "Owner",
          email: user.email || "owner@medinastuff.com",
          role: userRole,
        });
      } catch (err) {
        console.error("Error parsing user data:", err);
        localStorage.clear();
        navigate("/login", { replace: true });
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, [navigate]);

  const handleLogout = () => {
    localStorage.clear();
    navigate("/login", { replace: true });
  };

  const getInitials = (name) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const menuItems = [
    {
      tab: "overview",
      icon: BarChart3,
      label: "Overview",
      description: "Ringkasan & Laporan",
    },
    {
      tab: "sales",
      icon: DollarSign,
      label: "Penjualan",
      description: "Laporan keuangan",
    },
    {
      tab: "customers",
      icon: Users,
      label: "Pelanggan",
      description: "Data & perilaku",
    },
    {
      tab: "orders",
      icon: ShoppingCart,
      label: "Pesanan",
      description: "Status & tracking",
    },
    {
      tab: "inventory",
      icon: Package,
      label: "Inventori",
      description: "Stok produk",
    },
    {
      tab: "category",
      icon: FileText,
      label: "Kategori",
      description: "Performa kategori",
    },
  ];

  // Tentukan tab aktif berdasarkan URL query ?tab=
  const searchParams = new URLSearchParams(location.search);
  const currentTab = searchParams.get("tab") || "overview";

  const handleMenuClick = (tab) => {
    navigate(`/owner/dashboard?tab=${tab}`);
    setIsSidebarOpen(false); // Tutup sidebar di mobile
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#cb5094] to-[#e570b3] flex items-center justify-center">
        <div className="text-white text-center">
          <div className="w-20 h-20 border-4 border-white/30 border-t-white rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-xl font-semibold">Loading Owner Panel...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Navbar Fixed */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-lg shadow-xl border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo & Hamburger */}
            <div className="flex items-center space-x-4">
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
                href="/owner/dashboard"
                className="flex items-center space-x-3 group"
              >
                <div className="relative w-12 h-12 bg-gradient-to-br from-[#cb5094] to-[#e570b3] rounded-full flex items-center justify-center shadow-lg group-hover:scale-110 transition-all duration-300 overflow-hidden">
                  <img
                    src="/logo.png"
                    alt="MyMedina"
                    className="w-8 h-8 object-contain z-10"
                    onError={(e) => {
                      e.target.style.display = "none";
                      e.target.nextElementSibling.style.display = "flex";
                    }}
                  />
                  <span className="absolute inset-0 flex items-center justify-center text-2xl font-bold text-white z-10 hidden">
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

            {/* Profil Owner - Tanpa kotak pink */}
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-[#cb5094] to-[#e570b3] rounded-full flex items-center justify-center shadow-md">
                <span className="text-sm font-bold text-white">
                  {getInitials(ownerData.nama)}
                </span>
              </div>
              <div className="hidden sm:block text-left">
                <div className="text-sm font-bold text-gray-800">
                  {ownerData.nama}
                </div>
                <div className="text-xs text-[#cb5094] font-semibold">
                  Owner
                </div>
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile Sidebar */}
      <aside
        className={`lg:hidden fixed top-16 left-0 z-40 w-64 bg-white shadow-2xl transform transition-transform duration-300 h-full ${
          isSidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="h-full flex flex-col overflow-y-auto">
          <nav className="flex-1 p-6 space-y-2">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentTab === item.tab;

              return (
                <button
                  key={item.tab}
                  onClick={() => handleMenuClick(item.tab)}
                  className={`w-full flex items-center space-x-3 px-5 py-4 rounded-2xl transition-all duration-200 font-medium group ${
                    isActive
                      ? "bg-gradient-to-r from-[#cb5094] to-[#e570b3] text-white shadow-lg"
                      : "text-gray-700 hover:bg-pink-50"
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <div className="flex-1 text-left">
                    <div className="font-semibold">{item.label}</div>
                    <div
                      className={`text-xs ${
                        isActive ? "text-white/80" : "text-gray-500"
                      }`}
                    >
                      {item.description}
                    </div>
                  </div>
                </button>
              );
            })}
          </nav>

          <div className="p-6 border-t border-gray-200">
            <button
              onClick={handleLogout}
              className="w-full flex items-center space-x-3 px-5 py-4 rounded-2xl text-red-600 hover:bg-red-50 transition-all duration-200 font-medium group"
            >
              <LogOut className="w-5 h-5 group-hover:rotate-12 transition-transform" />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Overlay Mobile */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Main Layout */}
      <div className="pt-16 min-h-screen flex">
        {/* Sidebar Desktop */}
        <aside className="hidden lg:block w-64 bg-white shadow-2xl fixed top-16 left-0 h-[calc(100vh-4rem)] overflow-y-auto">
          <div className="h-full flex flex-col">
            <nav className="flex-1 p-6 space-y-2">
              {menuItems.map((item) => {
                const Icon = item.icon;
                const isActive = currentTab === item.tab;

                return (
                  <button
                    key={item.tab}
                    onClick={() => handleMenuClick(item.tab)}
                    className={`w-full flex items-center space-x-3 px-5 py-4 rounded-2xl transition-all duration-200 font-medium group ${
                      isActive
                        ? "bg-gradient-to-r from-[#cb5094] to-[#e570b3] text-white shadow-lg"
                        : "text-gray-700 hover:bg-pink-50"
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <div className="flex-1 text-left">
                      <div className="font-semibold">{item.label}</div>
                      <div
                        className={`text-xs ${
                          isActive ? "text-white/80" : "text-gray-500"
                        }`}
                      >
                        {item.description}
                      </div>
                    </div>
                  </button>
                );
              })}
            </nav>

            <div className="p-6 border-t border-gray-200">
              <button
                onClick={handleLogout}
                className="w-full flex items-center space-x-3 px-5 py-4 rounded-2xl text-red-600 hover:bg-red-50 transition-all duration-200 font-medium group"
              >
                <LogOut className="w-5 h-5 group-hover:rotate-12 transition-transform" />
                <span>Logout</span>
              </button>
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 lg:ml-64">
          <div className="max-w-7xl mx-auto">{children || <Outlet />}</div>
        </main>
      </div>
    </div>
  );
}

export default OwnerLayout;
