import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import {
  DollarSign,
 ShoppingCart,
 
  BarChart2,
  TrendingUp,
  Sparkles,
  Download,
  Filter,
  X,
  RefreshCw,
  CheckCircle,
  AlertCircle,
  LogOut,

  Clock,
} from "lucide-react";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import api from "../utils/api";
import { formatPrice } from "../utils/formatPrice";

function Notification({ type, message, onClose }) {
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      handleClose();
    }, 4000);
    return () => clearTimeout(timer);
  }, []);

  const handleClose = () => {
    setIsExiting(true);
    setTimeout(() => onClose && onClose(), 300);
  };

  const configs = {
    success: { bgColor: "bg-green-500", shadowColor: "shadow-green-500/50" },
    error: { bgColor: "bg-red-500", shadowColor: "shadow-red-500/50" },
  };
  const config = configs[type] || configs.success;
  const Icon = type === "success" ? CheckCircle : AlertCircle;

  return (
    <div
      className={`fixed top-20 left-1/2 -translate-x-1/2 z-[100] transition-all duration-300 ${
        isExiting ? "-translate-y-20 opacity-0" : "translate-y-0 opacity-100"
      }`}
    >
      <div
        className={`flex items-center gap-3 ${config.bgColor} text-white rounded-full px-6 py-3.5 shadow-2xl ${config.shadowColor} min-w-[300px] max-w-lg backdrop-blur-md border border-white/20`}
      >
        <Icon className="w-6 h-6 flex-shrink-0" />
        <p className="text-sm font-medium flex-1 text-center">{message}</p>
        <button
          onClick={handleClose}
          className="hover:bg-white/20 rounded-full p-1.5 transition-all"
        >
          <X className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}

function DateRangePicker({
  startDate,
  endDate,
  onStartDateChange,
  onEndDateChange,
  onApply,
  onReset,
}) {
  return (
    <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
      <div className="flex flex-col sm:flex-row gap-3 flex-1 w-full">
        <div className="flex-1">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Dari Tanggal
          </label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => onStartDateChange(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#cb5094] focus:border-transparent"
          />
        </div>
        <div className="flex-1">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Sampai Tanggal
          </label>
          <input
            type="date"
            value={endDate}
            onChange={(e) => onEndDateChange(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#cb5094] focus:border-transparent"
          />
        </div>
      </div>
      <div className="flex gap-2 w-full sm:w-auto mt-6">
        <button
          onClick={onApply}
          className="flex-1 sm:flex-none bg-[#cb5094] text-white px-6 py-2 rounded-xl font-semibold hover:bg-[#b34583] transition-all flex items-center justify-center gap-2"
        >
          <Filter className="w-4 h-4" />
          Terapkan
        </button>
        <button
          onClick={onReset}
          className="flex-1 sm:flex-none bg-gray-200 text-gray-700 px-6 py-2 rounded-xl font-semibold hover:bg-gray-300 transition-all"
        >
          Reset
        </button>
      </div>
    </div>
  );
}

const COLORS = ["#cb5094", "#e570b3", "#f18bc9", "#faa6df", "#ff9ec7"];

function OwnerDashboard() {
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const currentTab = searchParams.get("tab") || "overview";

  const [dashboardData, setDashboardData] = useState({
    totalRevenue: 0,
    totalOrders: 0,
    pendingOrders: 0,
    completedOrders: 0,
    monthlyRevenue: [],
    topProducts: [],
  });

  const [salesReport, setSalesReport] = useState(null);

  const defaultStart = new Date();
  defaultStart.setFullYear(defaultStart.getFullYear() - 1);
  const defaultStartStr = defaultStart.toISOString().split("T")[0];
  const defaultEndStr = new Date().toISOString().split("T")[0];

  const [dateRange, setDateRange] = useState({
    startDate: "",
    endDate: "",
  });

  const [loading, setLoading] = useState(true);
  const [reportLoading, setReportLoading] = useState(false);
  const [notification, setNotification] = useState(null);

  const showNotification = (type, message) => {
    setNotification({ type, message, id: Date.now() });
  };

  useEffect(() => {
    if (currentTab === "overview" || currentTab === "sales") {
      loadDashboardData();
    } else {
      loadReportData();
    }
  }, [currentTab, dateRange]);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false); // State untuk popup logout

  const handleLogout = () => {
    setShowLogoutConfirm(true);
  };

  const confirmLogout = () => {
    try {
      localStorage.removeItem("accessToken");
      localStorage.removeItem("user");
      localStorage.removeItem("cart"); // optional: bersihkan cart
      window.location.href = "/";
    } catch (err) {
      console.error("Logout error:", err);
    }
  };

  const cancelLogout = () => {
    setShowLogoutConfirm(false);
  };
  const loadDashboardData = async () => {
    try {
      setLoading(true);

      const ordersResponse = await api.get("orders/admin/all", {
        params: { page: 1, limit: 1000 },
      });

      const orders =
        ordersResponse.data.data || ordersResponse.data.orders || [];

      const revenueStatuses = ["PAID", "PROCESSING", "SHIPPED", "COMPLETED"];
      const paidOrders = orders.filter((o) =>
        revenueStatuses.includes(o.status)
      );

      // Calculate total revenue
      const totalRevenue = paidOrders.reduce(
        (sum, o) => sum + Number(o.total || 0),
        0
      );

      const totalOrders = orders.length;
      const pendingOrders = orders.filter((o) =>
        ["PENDING_PAYMENT", "PAID", "PROCESSING"].includes(o.status)
      ).length;
      const completedOrders = orders.filter(
        (o) => o.status === "COMPLETED"
      ).length;

      // Monthly revenue calculation
      const monthlyData = [];
      const currentDate = new Date();
      for (let i = 5; i >= 0; i--) {
        const date = new Date(
          currentDate.getFullYear(),
          currentDate.getMonth() - i,
          1
        );
        const monthName = date.toLocaleString("id-ID", {
          month: "short",
          year: "numeric",
        });

        const monthRevenue = paidOrders
          .filter((o) => {
            const orderDate = new Date(o.dibuatPada || o.createdAt);
            return (
              orderDate.getMonth() === date.getMonth() &&
              orderDate.getFullYear() === date.getFullYear()
            );
          })
          .reduce((sum, o) => sum + Number(o.total || 0), 0);

        monthlyData.push({ name: monthName, revenue: monthRevenue });
      }

      // Top products logic
      const productSales = {};
      paidOrders.forEach((order) => {
        order.items.forEach((item) => {
          const name = item.namaProduk || item.nama || "Produk Tidak Diketahui";
          productSales[name] =
            (productSales[name] || 0) + item.kuantitas * item.hargaSnapshot;
        });
      });

      const topProducts = Object.entries(productSales)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([name, sales]) => ({ name, sales }));

      setDashboardData({
        totalRevenue,
        totalOrders,
        pendingOrders,
        completedOrders,
        monthlyRevenue: monthlyData,
        topProducts,
      });

      // Include payment methods when filtering for sales
      if (currentTab === "sales") {
        let filteredOrders = paidOrders;

        if (dateRange.startDate || dateRange.endDate) {
          const start = dateRange.startDate
            ? new Date(dateRange.startDate)
            : null;
          const end = dateRange.endDate ? new Date(dateRange.endDate) : null;
          if (end) end.setHours(23, 59, 59, 999);

          filteredOrders = paidOrders.filter((o) => {
            const orderDate = new Date(o.dibuatPada || o.createdAt);
            if (start && orderDate < start) return false;
            if (end && orderDate > end) return false;
            return true;
          });
        }

        const salesTotal = filteredOrders.reduce(
          (sum, o) => sum + Number(o.total || 0),
          0
        );
        const salesCount = filteredOrders.length;
        const averageOrderValue =
          salesCount > 0 ? Math.round(salesTotal / salesCount) : 0;

        const dailyMap = {};
        filteredOrders.forEach((o) => {
          const dateStr = new Date(
            o.dibuatPada || o.createdAt
          ).toLocaleDateString("id-ID");
          dailyMap[dateStr] = (dailyMap[dateStr] || 0) + Number(o.total || 0);
        });

        const salesByDate = Object.entries(dailyMap)
          .map(([date, sales]) => ({ date, sales }))
          .sort(
            (a, b) =>
              new Date(a.date.split("/").reverse().join("-")) -
              new Date(b.date.split("/").reverse().join("-"))
          );

        setSalesReport({
          totalSales: salesTotal,
          totalOrders: salesCount,
          averageOrderValue: averageOrderValue,
          salesByDate,
          topSellingProducts: topProducts,
          paymentMethods: [
            ...new Set(filteredOrders.map((o) => o.metodePembayaran)),
          ], // Extract unique payment methods
        });
      }
    } catch (err) {
      console.error("Gagal memuat data:", err);
      showNotification("error", "Gagal memuat data");
    } finally {
      setLoading(false);
    }
  };

  const loadReportData = async () => {
    try {
      setReportLoading(true);

      // SELALU kirim startDate dan endDate (wajib dari backend)
      const start = dateRange.startDate || defaultStartStr;
      const end = dateRange.endDate || defaultEndStr;

      const params = { startDate: start, endDate: end };

      switch (currentTab) {
        case "customers":
          const customersResponse = await api.get("/owner/reports/customers", {
            params,
          });
          const transformedCustomerData = {
            totalCustomers: customersResponse.data.summary?.totalCustomers || 0,
            newCustomers: customersResponse.data.summary?.newCustomers || 0,
            returningCustomers:
              customersResponse.data.summary?.repeatCustomers || 0,
            topCustomers:
              customersResponse.data.topCustomers
                ?.slice(0, 10)
                .map((customer) => ({
                  name:
                    customer.nama ||
                    customer.email ||
                    `User #${customer.userId}`,
                  totalOrders: customer.orderCount,
                  totalSpent: customer.totalSpent,
                })) || [],
            customersByCity:
              customersResponse.data.ordersByCity?.map((item) => ({
                city: item.city || "Unknown",
                count: item.count,
              })) || [],
          };
          setCustomersReport(transformedCustomerData);
          break;

        case "orders":
          const ordersResponse = await api.get("/owner/reports/orders", {
            params,
          });
          const totalOrdersReport =
            ordersResponse.data.summary?.totalOrders || 0;
          const transformedOrdersData = {
            totalOrders: totalOrdersReport,
            pendingOrders:
              ordersResponse.data.ordersByStatus?.find(
                (s) => s.status === "PENDING_PAYMENT"
              )?.count || 0,
            processingOrders:
              ordersResponse.data.ordersByStatus?.find(
                (s) => s.status === "PROCESSING"
              )?.count || 0,
            completedOrders:
              ordersResponse.data.ordersByStatus?.find(
                (s) => s.status === "COMPLETED"
              )?.count || 0,
            ordersByStatus:
              ordersResponse.data.ordersByStatus?.map((item) => ({
                status: item.status,
                count: item.count,
                percentage:
                  totalOrdersReport > 0
                    ? ((item.count / totalOrdersReport) * 100).toFixed(1)
                    : 0,
              })) || [],
            orderTrend:
              ordersResponse.data.dailySales?.map((item) => ({
                date: item.date,
                orders: item.count,
              })) || [],
          };
          setOrdersReport(transformedOrdersData);
          break;

        case "inventory":
          const inventoryResponse = await api.get("/owner/reports/inventory");
          const transformedInventoryData = {
            totalProducts: inventoryResponse.data.summary?.totalProducts || 0,
            lowStock: inventoryResponse.data.summary?.lowStockProducts || 0,
            outOfStock: inventoryResponse.data.summary?.outOfStockProducts || 0,
            products:
              inventoryResponse.data.products?.map((product) => ({
                name: product.name || "Produk Tidak Diketahui",
                stock: product.totalStock,
                status:
                  product.stockStatus === "OUT_OF_STOCK"
                    ? "out"
                    : product.stockStatus === "LOW_STOCK"
                    ? "low"
                    : "normal",
              })) || [],
          };
          setInventoryReport(transformedInventoryData);
          break;

        case "category":
          const categoryResponse = await api.get("/owner/reports/category", {
            params,
          });
          const totalCategoryRevenue =
            categoryResponse.data.categories?.reduce(
              (sum, cat) => sum + cat.revenue,
              0
            ) || 1;

          const transformedCategoryData = {
            categories:
              categoryResponse.data.categories?.map((cat) => ({
                name: cat.categoryName || "Tanpa Kategori",
                sales: cat.revenue,
                orders: cat.itemsSold,
                percentage: (
                  (cat.revenue / totalCategoryRevenue) *
                  100
                ).toFixed(1),
              })) || [],
            categoryTrend: [],
          };
          setCategoryReport(transformedCategoryData);
          break;
      }
    } catch (err) {
      console.error("❌ Gagal memuat laporan:", err);
      showNotification("error", "Gagal memuat laporan");
    } finally {
      setReportLoading(false);
    }
  };

  const handleExportReport = async () => {
    try {
      const start = dateRange.startDate || defaultStartStr;
      const end = dateRange.endDate || defaultEndStr;

      const response = await api.get("/owner/reports/sales/export", {
        params: { startDate: start, endDate: end },
        responseType: "blob",
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `laporan-sales-${Date.now()}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();

      showNotification("success", "Laporan sales berhasil diexport!");
    } catch (err) {
      console.error("Gagal export laporan:", err);
      showNotification("error", "Gagal export laporan");
    }
  };

  const applyDateRange = () => {
    if (currentTab === "overview" || currentTab === "sales") {
      loadDashboardData();
    } else {
      loadReportData();
    }
    showNotification("success", "Filter tanggal diterapkan");
  };

  const resetDateRange = () => {
    setDateRange({ startDate: "", endDate: "" });
    if (currentTab === "overview" || currentTab === "sales") {
      loadDashboardData();
    } else {
      loadReportData();
    }
  };

  // Loading state
  if (loading && (currentTab === "overview" || currentTab === "sales")) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-pink-200 border-t-[#cb5094] rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Memuat data...</p>
        </div>
      </div>
    );
  }

  if (reportLoading && !["overview", "sales"].includes(currentTab)) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-pink-200 border-t-[#cb5094] rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Memuat laporan...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-purple-50 pb-20 lg:pb-0">
      {notification && (
        <Notification
          key={notification.id}
          type={notification.type}
          message={notification.message}
          onClose={() => setNotification(null)}
        />
      )}

      <div className="max-w-7xl mx-auto p-4 md:p-6 lg:p-8 space-y-6">
        {/* Header */}
        <div className="bg-white rounded-3xl shadow-sm border border-pink-100 p-5 md:p-6">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 lg:w-14 lg:h-14 bg-gradient-to-br from-[#cb5094] to-[#e570b3] rounded-2xl flex items-center justify-center shadow-md">
                <BarChart2 className="w-6 h-6 lg:w-8 lg:h-8 text-white" />
              </div>
              <div>
                <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">
                  Dashboard Owner
                </h1>
                <p className="text-gray-500 text-sm lg:text-base">
                  Laporan keuangan & performa toko
                </p>
              </div>
            </div>
            <button
              onClick={
                currentTab === "overview" || currentTab === "sales"
                  ? loadDashboardData
                  : loadReportData
              }
              className="bg-[#cb5094] text-white px-6 py-3 rounded-xl font-semibold hover:bg-[#b34583] transition-all flex items-center gap-2 shadow-sm"
            >
              <RefreshCw className="w-5 h-5" />
              Refresh Data
            </button>
          </div>
        </div>

        {/* OVERVIEW */}
        {currentTab === "overview" && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white rounded-2xl p-5 shadow-md border-l-4 border-[#cb5094] hover:shadow-xl transition-shadow">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-500 text-sm font-medium">
                      Total Pendapatan
                    </p>
                    <p className="text-3xl lg:text-4xl font-bold text-gray-800 mt-2">
                      {formatPrice(dashboardData.totalRevenue)}
                    </p>
                  </div>
                  <div className="w-12 h-12 lg:w-14 lg:h-14 bg-pink-50 rounded-xl flex items-center justify-center">
                    <DollarSign className="w-6 h-6 lg:w-7 lg:h-7 text-[#cb5094]" />
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-2xl p-5 shadow-md border-l-4 border-green-500 hover:shadow-xl transition-shadow">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-500 text-sm font-medium">
                      Total Pesanan
                    </p>
                    <p className="text-3xl lg:text-4xl font-bold text-gray-800 mt-2">
                      {dashboardData.totalOrders}
                    </p>
                  </div>
                  <div className="w-12 h-12 lg:w-14 lg:h-14 bg-green-50 rounded-xl flex items-center justify-center">
                    <ShoppingCart className="w-6 h-6 lg:w-7 lg:h-7 text-green-500" />
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-2xl p-5 shadow-md border-l-4 border-yellow-500 hover:shadow-xl transition-shadow">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-500 text-sm font-medium">
                      Pesanan Pending
                    </p>
                    <p className="text-3xl lg:text-4xl font-bold text-gray-800 mt-2">
                      {dashboardData.pendingOrders}
                    </p>
                  </div>
                  <div className="w-12 h-12 lg:w-14 lg:h-14 bg-yellow-50 rounded-xl flex items-center justify-center">
                    <Clock className="w-6 h-6 lg:w-7 lg:h-7 text-yellow-500" />
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-2xl p-5 shadow-md border-l-4 border-green-500 hover:shadow-xl transition-shadow">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-500 text-sm font-medium">
                      Pesanan Selesai
                    </p>
                    <p className="text-3xl lg:text-4xl font-bold text-gray-800 mt-2">
                      {dashboardData.completedOrders}
                    </p>
                  </div>
                  <div className="w-12 h-12 lg:w-14 lg:h-14 bg-green-50 rounded-xl flex items-center justify-center">
                    <CheckCircle className="w-6 h-6 lg:w-7 lg:h-7 text-green-500" />
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-3xl shadow-sm border border-pink-100 p-5 md:p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-3">
                <TrendingUp className="w-6 h-6 text-[#cb5094]" />
                Pendapatan Bulanan
              </h2>
              <div style={{ width: "100%", minHeight: "400px" }}>
                <ResponsiveContainer width="100%" height={400}>
                  <LineChart data={dashboardData.monthlyRevenue}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="name" stroke="#666" />
                    <YAxis
                      stroke="#666"
                      tickFormatter={(value) => formatPrice(value, true)}
                    />
                    <Tooltip formatter={(value) => formatPrice(value)} />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="revenue"
                      name="Pendapatan"
                      stroke="#cb5094"
                      strokeWidth={3}
                      dot={{ r: 5 }}
                      activeDot={{ r: 8 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="bg-white rounded-3xl shadow-sm border border-pink-100 p-5 md:p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-3">
                <TrendingUp className="w-6 h-6 text-[#cb5094]" />
                Produk Terlaris
              </h2>
              {dashboardData.topProducts.length === 0 ? (
                <div className="text-center py-10">
                  <Sparkles className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600 font-medium">
                    Belum ada data penjualan produk
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {dashboardData.topProducts.map((product, idx) => (
                    <div
                      key={idx}
                      className="flex items-center gap-4 p-4 bg-gradient-to-br from-gray-50 to-pink-50/30 rounded-xl border border-[#cb5094]/10 hover:shadow-md transition-shadow"
                    >
                      <div className="w-10 h-10 bg-gradient-to-br from-[#cb5094] to-[#e570b3] rounded-full flex items-center justify-center text-white font-bold text-xl">
                        #{idx + 1}
                      </div>
                      <div className="flex-1">
                        <h3 className="font-bold text-gray-900">
                          {product.name}
                        </h3>
                      </div>
                      <div className="text-right">
                        <p className="font-bold bg-gradient-to-r from-[#cb5094] to-[#e570b3] bg-clip-text text-transparent">
                          {formatPrice(product.sales)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}

        {/* SALES REPORT */}
        {currentTab === "sales" && (
          <>
            <div className="bg-white rounded-3xl shadow-sm border border-pink-100 p-5 md:p-6">
              <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-6">
                <h2 className="text-xl font-bold text-gray-900 flex items-center gap-3">
                  <DollarSign className="w-6 h-6 text-[#cb5094]" />
                  Laporan Penjualan
                </h2>
                <button
                  onClick={() => handleExportReport("sales")}
                  className="bg-green-500 text-white px-6 py-3 rounded-xl font-semibold hover:bg-green-600 transition-all flex items-center gap-2 shadow-sm"
                >
                  <Download className="w-5 h-5" />
                  Export CSV
                </button>
              </div>

              <DateRangePicker
                startDate={dateRange.startDate}
                endDate={dateRange.endDate}
                onStartDateChange={(val) =>
                  setDateRange({ ...dateRange, startDate: val })
                }
                onEndDateChange={(val) =>
                  setDateRange({ ...dateRange, endDate: val })
                }
                onApply={applyDateRange}
                onReset={resetDateRange}
              />
            </div>

            {salesReport && (
              <>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-white rounded-2xl p-5 shadow-md">
                    <p className="text-gray-500 text-sm font-medium">
                      Total Penjualan
                    </p>
                    <p className="text-3xl font-bold text-[#cb5094] mt-2">
                      {formatPrice(salesReport.totalSales || 0)}
                    </p>
                  </div>
                  <div className="bg-white rounded-2xl p-5 shadow-md">
                    <p className="text-gray-500 text-sm font-medium">
                      Total Pesanan
                    </p>
                    <p className="text-3xl font-bold text-green-500 mt-2">
                      {salesReport.totalOrders || 0}
                    </p>
                  </div>
                  <div className="bg-white rounded-2xl p-5 shadow-md">
                    <p className="text-gray-500 text-sm font-medium">
                      Rata-rata Nilai Pesanan
                    </p>
                    <p className="text-3xl font-bold text-blue-500 mt-2">
                      {formatPrice(salesReport.averageOrderValue || 0)}
                    </p>
                  </div>
                </div>

                {salesReport.salesByDate &&
                  salesReport.salesByDate.length > 0 && (
                    <div className="bg-white rounded-3xl shadow-sm border border-pink-100 p-5 md:p-6">
                      <h3 className="text-lg font-bold text-gray-900 mb-4">
                        Trend Penjualan Harian
                      </h3>
                      <div style={{ width: "100%", minHeight: "400px" }}>
                        <ResponsiveContainer width="100%" height={400}>
                          <BarChart data={salesReport.salesByDate}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="date" />
                            <YAxis
                              tickFormatter={(val) => formatPrice(val, true)}
                            />
                            <Tooltip formatter={(val) => formatPrice(val)} />
                            <Legend />
                            <Bar
                              dataKey="sales"
                              name="Penjualan"
                              fill="#cb5094"
                            />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  )}

                {salesReport.topSellingProducts &&
                  salesReport.topSellingProducts.length > 0 && (
                    <div className="bg-white rounded-3xl shadow-sm border border-pink-100 p-5 md:p-6">
                      <h3 className="text-lg font-bold text-gray-900 mb-4">
                        Produk Terlaris
                      </h3>
                      <div className="space-y-3">
                        {salesReport.topSellingProducts.map((item, idx) => (
                          <div
                            key={idx}
                            className="flex items-center justify-between p-4 bg-gray-50 rounded-xl"
                          >
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 bg-[#cb5094] rounded-full flex items-center justify-center text-white font-bold">
                                {idx + 1}
                              </div>
                              <div>
                                <p className="font-semibold text-gray-800">
                                  {item.name}
                                </p>
                                <p className="text-sm text-gray-600">
                                  Terjual: {formatPrice(item.sales)}
                                </p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
              </>
            )}
          </>
        )}
      </div>
      {/* Popup Konfirmasi Logout */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Background Blur */}
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={cancelLogout}
          />

          {/* Popup Card */}
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

export default OwnerDashboard;
