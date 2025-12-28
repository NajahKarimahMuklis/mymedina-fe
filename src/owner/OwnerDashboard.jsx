import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import {
  DollarSign,
  ShoppingCart,
  CreditCard,
  TrendingUp,
  Users,
  AlertCircle,
  BarChart2,
  Clock,
  CheckCircle,
  RefreshCw,
  Sparkles,
  Download,
  Filter,
  X,
  FileText,
  Package,
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
    totalTransactions: 0,
    pendingOrders: 0,
    completedOrders: 0,
    monthlyRevenue: [],
    recentTransactions: [],
    topProducts: [],
  });

  const [salesReport, setSalesReport] = useState(null);
  const [customersReport, setCustomersReport] = useState(null);
  const [ordersReport, setOrdersReport] = useState(null);
  const [inventoryReport, setInventoryReport] = useState(null);
  const [categoryReport, setCategoryReport] = useState(null);

  const [dateRange, setDateRange] = useState({
    startDate: new Date(new Date().setDate(new Date().getDate() - 30))
      .toISOString()
      .split("T")[0],
    endDate: new Date().toISOString().split("T")[0],
  });

  const [loading, setLoading] = useState(true);
  const [reportLoading, setReportLoading] = useState(false);
  const [notification, setNotification] = useState(null);

  const showNotification = (type, message) => {
    setNotification({ type, message, id: Date.now() });
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  useEffect(() => {
    if (currentTab !== "overview") {
      loadReportData();
    }
  }, [currentTab]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);

      const ordersResponse = await api.get("/orders/admin/all", {
        params: { page: 1, limit: 1000 }, // ✅ Tambahkan params seperti di AdminOrders
      });

      const orders = ordersResponse.data.orders || [];

      console.log("📦 ORDERS:", orders.length, orders); // ✅ CEK INI

      const transactionsPromises = orders.map(async (order) => {
        try {
          const paymentResponse = await api.get(`/payments/order/${order.id}`);
          const payments = paymentResponse.data.payments || [];
          const mainPayment = payments[0];

          if (mainPayment) {
            console.log("💳 PAYMENT:", mainPayment); // ✅ CEK INI
            return {
              ...mainPayment,
              order: {
                id: order.id,
                nomorOrder: order.nomorOrder,
                namaPenerima: order.namaPenerima,
                total: order.total,
                status: order.status,
                dibuatPada: order.dibuatPada,
              },
            };
          }
        } catch (err) {
          console.error("❌ Payment error:", err); // ✅ CEK INI
          return null;
        }
      });

      const transactions = (await Promise.all(transactionsPromises)).filter(
        Boolean
      );

      console.log("💰 TRANSACTIONS:", transactions.length, transactions); // ✅ CEK INI PENTING!

      // Cek field yang ada di transaction
      if (transactions.length > 0) {
        console.log(
          "📋 Sample transaction fields:",
          Object.keys(transactions[0])
        );
        console.log(
          "💵 Amount field:",
          transactions[0].jumlah || transactions[0].amount
        );
        console.log(
          "📅 Date field:",
          transactions[0].dibuatPada || transactions[0].createdAt
        );
        console.log("✅ Status:", transactions[0].status);
      }

      // Status sukses yang dianggap revenue
      const successfulStatuses = ["SETTLED", "CAPTURED", "SUCCESS", "PAID"];

      // Total Revenue dari transaksi sukses
      const totalRevenue = transactions
        .filter((t) => successfulStatuses.includes(t.status))
        .reduce((sum, t) => sum + Number(t.jumlah || t.amount || 0), 0);

      console.log("💵 TOTAL REVENUE:", totalRevenue); // ✅ CEK INI

      const totalOrders = orders.length;
      const pendingOrders = orders.filter(
        (o) =>
          o.status === "PENDING_PAYMENT" ||
          o.status === "PAID" ||
          o.status === "PROCESSING"
      ).length;
      const completedOrders = orders.filter(
        (o) => o.status === "COMPLETED"
      ).length;
      const totalTransactions = transactions.length;

      // Monthly Revenue - lebih fleksibel
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

        const revenue = transactions
          .filter((t) => {
            if (!successfulStatuses.includes(t.status)) return false;

            // ✅ FIX: Gunakan field yang benar dari backend
            const dateStr = t.dibuatPada || t.createdAt || t.updatedAt;
            if (!dateStr) return false;

            const transDate = new Date(dateStr);
            return (
              transDate.getMonth() === date.getMonth() &&
              transDate.getFullYear() === date.getFullYear()
            );
          })
          .reduce((sum, t) => sum + Number(t.jumlah || t.amount || 0), 0);

        monthlyData.push({ name: monthName, revenue });
      }

      const recentTransactions = transactions
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        .slice(0, 5);

      const productSales = {};
      orders.forEach((order) => {
        order.items.forEach((item) => {
          const key = item.namaProduk;
          productSales[key] =
            (productSales[key] || 0) + item.kuantitas * item.hargaSnapshot;
        });
      });

      const topProducts = Object.entries(productSales)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([name, sales]) => ({ name, sales }));

      setDashboardData({
        totalRevenue,
        totalOrders,
        totalTransactions,
        pendingOrders,
        completedOrders,
        monthlyRevenue: monthlyData,
        recentTransactions,
        topProducts,
      });
    } catch (err) {
      console.error("Gagal memuat data dashboard:", err);
      showNotification("error", "Gagal memuat data dashboard");
    } finally {
      setLoading(false);
    }
  };

  const loadReportData = async () => {
    try {
      setReportLoading(true);
      const { startDate, endDate } = dateRange;

      switch (currentTab) {
        case "sales":
          const salesResponse = await api.get(
            `/owner/reports/sales?startDate=${startDate}&endDate=${endDate}`
          );

          console.log("📊 Raw Sales Response:", salesResponse.data);

          const transformedSalesData = {
            totalSales: salesResponse.data.summary?.totalRevenue || 0,
            totalOrders: salesResponse.data.summary?.totalTransactions || 0,
            averageOrderValue: salesResponse.data.summary?.totalTransactions
              ? salesResponse.data.summary.totalRevenue /
                salesResponse.data.summary.totalTransactions
              : 0,
            salesByDate:
              salesResponse.data.dailySales?.map((item) => ({
                date: item.date,
                sales: item.total,
              })) || [],
            topSellingProducts:
              salesResponse.data.productSales?.slice(0, 5).map((item) => ({
                product: item.productName,
                quantity: item.quantitySold,
                revenue: item.totalRevenue,
              })) || [],
          };

          console.log("✅ Transformed Sales Data:", transformedSalesData);
          setSalesReport(transformedSalesData);
          break;

        case "customers":
          const customersResponse = await api.get(
            `/owner/reports/customers?startDate=${startDate}&endDate=${endDate}`
          );

          console.log("👥 Raw Customers Response:", customersResponse.data);

          const transformedCustomerData = {
            totalCustomers: customersResponse.data.summary?.totalCustomers || 0,
            newCustomers: customersResponse.data.summary?.newCustomers || 0,
            returningCustomers:
              customersResponse.data.summary?.repeatCustomers || 0,
            topCustomers:
              customersResponse.data.topCustomers
                ?.slice(0, 10)
                .map((customer) => ({
                  name: `User #${customer.userId}`,
                  totalOrders: customer.orderCount,
                  totalSpent: customer.totalSpent,
                })) || [],
            customersByCity:
              customersResponse.data.ordersByCity?.map((item) => ({
                city: item.city || "Unknown",
                count: item.count,
              })) || [],
          };

          console.log("✅ Transformed Customer Data:", transformedCustomerData);
          setCustomersReport(transformedCustomerData);
          break;

        case "orders":
          const ordersResponse = await api.get(
            `/owner/reports/orders?startDate=${startDate}&endDate=${endDate}`
          );

          console.log("📦 Raw Orders Response:", ordersResponse.data);

          const totalOrders = ordersResponse.data.summary?.totalOrders || 0;
          const transformedOrdersData = {
            totalOrders: totalOrders,
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
                  totalOrders > 0
                    ? ((item.count / totalOrders) * 100).toFixed(1)
                    : 0,
              })) || [],
            orderTrend:
              ordersResponse.data.dailySales?.map((item) => ({
                date: item.date,
                orders: item.count,
              })) || [],
          };

          console.log("✅ Transformed Orders Data:", transformedOrdersData);
          setOrdersReport(transformedOrdersData);
          break;

        case "inventory":
          const inventoryResponse = await api.get("/owner/reports/inventory");

          console.log("📦 Raw Inventory Response:", inventoryResponse.data);

          const transformedInventoryData = {
            totalProducts: inventoryResponse.data.summary?.totalProducts || 0,
            lowStock: inventoryResponse.data.summary?.lowStockProducts || 0,
            outOfStock: inventoryResponse.data.summary?.outOfStockProducts || 0,
            products:
              inventoryResponse.data.products?.map((product) => ({
                name: product.name,
                stock: product.totalStock,
                sold: 0,
                status:
                  product.stockStatus === "OUT_OF_STOCK"
                    ? "out"
                    : product.stockStatus === "LOW_STOCK"
                    ? "low"
                    : "normal",
              })) || [],
          };

          console.log(
            "✅ Transformed Inventory Data:",
            transformedInventoryData
          );
          setInventoryReport(transformedInventoryData);
          break;

        case "category":
          const categoryResponse = await api.get(
            `/owner/reports/category?startDate=${startDate}&endDate=${endDate}`
          );

          console.log("📊 Raw Category Response:", categoryResponse.data);

          const totalCategoryRevenue =
            categoryResponse.data.categories?.reduce(
              (sum, cat) => sum + cat.revenue,
              0
            ) || 1;

          const transformedCategoryData = {
            categories:
              categoryResponse.data.categories?.map((cat) => ({
                name: cat.categoryName,
                sales: cat.revenue,
                orders: cat.itemsSold,
                percentage: (
                  (cat.revenue / totalCategoryRevenue) *
                  100
                ).toFixed(1),
              })) || [],
            categoryTrend: [],
          };

          console.log("✅ Transformed Category Data:", transformedCategoryData);
          setCategoryReport(transformedCategoryData);
          break;
      }
    } catch (err) {
      console.error("❌ Gagal memuat laporan:", err);
      console.error("Error details:", err.response?.data);
      showNotification(
        "error",
        "Gagal memuat laporan: " + (err.response?.data?.message || err.message)
      );
    } finally {
      setReportLoading(false);
    }
  };

  const handleExportReport = async (reportType) => {
    try {
      const { startDate, endDate } = dateRange;
      let endpoint = "";

      switch (reportType) {
        case "sales":
          endpoint = `/owner/reports/sales/export?startDate=${startDate}&endDate=${endDate}`;
          break;
        case "customers":
          endpoint = `/owner/reports/customers/export?startDate=${startDate}&endDate=${endDate}`;
          break;
        case "orders":
          endpoint = `/owner/reports/orders/export?startDate=${startDate}&endDate=${endDate}`;
          break;
        case "inventory":
          endpoint = `/owner/reports/inventory/export`;
          break;
        case "category":
          endpoint = `/owner/reports/category/export?startDate=${startDate}&endDate=${endDate}`;
          break;
      }

      const response = await api.get(endpoint, { responseType: "blob" });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `laporan-${reportType}-${Date.now()}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();

      showNotification("success", `Laporan ${reportType} berhasil diexport!`);
    } catch (err) {
      console.error("Gagal export laporan:", err);
      showNotification("error", "Gagal export laporan");
    }
  };

  const applyDateRange = () => {
    loadReportData();
    showNotification("success", "Filter tanggal diterapkan");
  };

  const resetDateRange = () => {
    setDateRange({
      startDate: new Date(new Date().setDate(new Date().getDate() - 30))
        .toISOString()
        .split("T")[0],
      endDate: new Date().toISOString().split("T")[0],
    });
    setTimeout(() => loadReportData(), 100);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-pink-200 border-t-[#cb5094] rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Memuat data dashboard...</p>
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
              <div className="w-12 h-12 lg:w-14 lg:h-14 bg-[#cb5094] rounded-2xl flex items-center justify-center shadow-md flex-shrink-0">
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
              onClick={loadDashboardData}
              className="bg-[#cb5094] text-white px-6 py-3 rounded-xl font-semibold hover:bg-[#b34583] transition-all flex items-center gap-2 shadow-sm w-full lg:w-auto justify-center"
            >
              <RefreshCw className="w-5 h-5" />
              Refresh Data
            </button>
          </div>
        </div>

        {/* Overview Tab */}
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

              <div className="bg-white rounded-2xl p-5 shadow-md border-l-4 border-blue-500 hover:shadow-xl transition-shadow">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-500 text-sm font-medium">
                      Total Transaksi
                    </p>
                    <p className="text-3xl lg:text-4xl font-bold text-gray-800 mt-2">
                      {dashboardData.totalTransactions}
                    </p>
                  </div>
                  <div className="w-12 h-12 lg:w-14 lg:h-14 bg-blue-50 rounded-xl flex items-center justify-center">
                    <CreditCard className="w-6 h-6 lg:w-7 lg:h-7 text-blue-500" />
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
                      className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl border border-gray-100 hover:bg-gray-100 transition-all"
                    >
                      <div className="w-10 h-10 bg-[#cb5094] rounded-full flex items-center justify-center text-white font-bold text-xl">
                        #{idx + 1}
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold text-gray-800">
                          {product.name}
                        </p>
                        <p className="text-sm text-gray-600">
                          Penjualan: {formatPrice(product.sales)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}

        {/* Sales Report Tab */}
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

            {reportLoading ? (
              <div className="text-center py-10">
                <div className="w-12 h-12 border-4 border-pink-200 border-t-[#cb5094] rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-gray-600">Memuat laporan...</p>
              </div>
            ) : (
              salesReport && (
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
                                    {item.product}
                                  </p>
                                  <p className="text-sm text-gray-600">
                                    Terjual: {item.quantity} unit
                                  </p>
                                </div>
                              </div>
                              <p className="text-lg font-bold text-[#cb5094]">
                                {formatPrice(item.revenue)}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                </>
              )
            )}
          </>
        )}

        {/* Customers Report Tab */}
        {currentTab === "customers" && (
          <>
            <div className="bg-white rounded-3xl shadow-sm border border-pink-100 p-5 md:p-6">
              <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-6">
                <h2 className="text-xl font-bold text-gray-900 flex items-center gap-3">
                  <Users className="w-6 h-6 text-[#cb5094]" />
                  Laporan Pelanggan
                </h2>
                <button
                  onClick={() => handleExportReport("customers")}
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

            {reportLoading ? (
              <div className="text-center py-10">
                <div className="w-12 h-12 border-4 border-pink-200 border-t-[#cb5094] rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-gray-600">Memuat laporan...</p>
              </div>
            ) : (
              customersReport && (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-white rounded-2xl p-5 shadow-md">
                      <p className="text-gray-500 text-sm font-medium">
                        Total Pelanggan
                      </p>
                      <p className="text-3xl font-bold text-[#cb5094] mt-2">
                        {customersReport.totalCustomers || 0}
                      </p>
                    </div>
                    <div className="bg-white rounded-2xl p-5 shadow-md">
                      <p className="text-gray-500 text-sm font-medium">
                        Pelanggan Baru
                      </p>
                      <p className="text-3xl font-bold text-green-500 mt-2">
                        {customersReport.newCustomers || 0}
                      </p>
                    </div>
                    <div className="bg-white rounded-2xl p-5 shadow-md">
                      <p className="text-gray-500 text-sm font-medium">
                        Pelanggan Kembali
                      </p>
                      <p className="text-3xl font-bold text-blue-500 mt-2">
                        {customersReport.returningCustomers || 0}
                      </p>
                    </div>
                  </div>

                  {customersReport.topCustomers &&
                    customersReport.topCustomers.length > 0 && (
                      <div className="bg-white rounded-3xl shadow-sm border border-pink-100 p-5 md:p-6">
                        <h3 className="text-lg font-bold text-gray-900 mb-4">
                          Pelanggan Teratas
                        </h3>
                        <div className="space-y-3">
                          {customersReport.topCustomers.map((customer, idx) => (
                            <div
                              key={idx}
                              className="flex items-center justify-between p-4 bg-gray-50 rounded-xl"
                            >
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-gradient-to-br from-[#cb5094] to-[#e570b3] rounded-full flex items-center justify-center">
                                  <Users className="w-5 h-5 text-white" />
                                </div>
                                <div>
                                  <p className="font-semibold text-gray-800">
                                    {customer.name}
                                  </p>
                                  <p className="text-sm text-gray-600">
                                    {customer.totalOrders} pesanan
                                  </p>
                                </div>
                              </div>
                              <p className="text-lg font-bold text-[#cb5094]">
                                {formatPrice(customer.totalSpent)}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                  {customersReport.customersByCity &&
                    customersReport.customersByCity.length > 0 && (
                      <div className="bg-white rounded-3xl shadow-sm border border-pink-100 p-5 md:p-6">
                        <h3 className="text-lg font-bold text-gray-900 mb-4">
                          Sebaran Pelanggan per Kota
                        </h3>
                        <div style={{ width: "100%", minHeight: "400px" }}>
                          <ResponsiveContainer width="100%" height={400}>
                            <PieChart>
                              <Pie
                                data={customersReport.customersByCity}
                                dataKey="count"
                                nameKey="city"
                                cx="50%"
                                cy="50%"
                                outerRadius={100}
                                label
                              >
                                {customersReport.customersByCity.map(
                                  (entry, index) => (
                                    <Cell
                                      key={`cell-${index}`}
                                      fill={COLORS[index % COLORS.length]}
                                    />
                                  )
                                )}
                              </Pie>
                              <Tooltip />
                              <Legend />
                            </PieChart>
                          </ResponsiveContainer>
                        </div>
                      </div>
                    )}
                </>
              )
            )}
          </>
        )}

        {/* Orders Report Tab */}
        {currentTab === "orders" && (
          <>
            <div className="bg-white rounded-3xl shadow-sm border border-pink-100 p-5 md:p-6">
              <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-6">
                <h2 className="text-xl font-bold text-gray-900 flex items-center gap-3">
                  <ShoppingCart className="w-6 h-6 text-[#cb5094]" />
                  Laporan Pesanan
                </h2>
                <button
                  onClick={() => handleExportReport("orders")}
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

            {reportLoading ? (
              <div className="text-center py-10">
                <div className="w-12 h-12 border-4 border-pink-200 border-t-[#cb5094] rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-gray-600">Memuat laporan...</p>
              </div>
            ) : (
              ordersReport && (
                <>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-white rounded-2xl p-5 shadow-md">
                      <p className="text-gray-500 text-sm font-medium">
                        Total Pesanan
                      </p>
                      <p className="text-3xl font-bold text-[#cb5094] mt-2">
                        {ordersReport.totalOrders || 0}
                      </p>
                    </div>
                    <div className="bg-white rounded-2xl p-5 shadow-md">
                      <p className="text-gray-500 text-sm font-medium">
                        Pending
                      </p>
                      <p className="text-3xl font-bold text-yellow-500 mt-2">
                        {ordersReport.pendingOrders || 0}
                      </p>
                    </div>
                    <div className="bg-white rounded-2xl p-5 shadow-md">
                      <p className="text-gray-500 text-sm font-medium">
                        Diproses
                      </p>
                      <p className="text-3xl font-bold text-blue-500 mt-2">
                        {ordersReport.processingOrders || 0}
                      </p>
                    </div>
                    <div className="bg-white rounded-2xl p-5 shadow-md">
                      <p className="text-gray-500 text-sm font-medium">
                        Selesai
                      </p>
                      <p className="text-3xl font-bold text-green-500 mt-2">
                        {ordersReport.completedOrders || 0}
                      </p>
                    </div>
                  </div>

                  {ordersReport.ordersByStatus &&
                    ordersReport.ordersByStatus.length > 0 && (
                      <div className="bg-white rounded-3xl shadow-sm border border-pink-100 p-5 md:p-6">
                        <h3 className="text-lg font-bold text-gray-900 mb-4">
                          Distribusi Status Pesanan
                        </h3>
                        <div style={{ width: "100%", minHeight: "400px" }}>
                          <ResponsiveContainer width="100%" height={400}>
                            <PieChart>
                              <Pie
                                data={ordersReport.ordersByStatus}
                                dataKey="count"
                                nameKey="status"
                                cx="50%"
                                cy="50%"
                                outerRadius={100}
                                label={(entry) =>
                                  `${entry.status}: ${entry.percentage}%`
                                }
                              >
                                {ordersReport.ordersByStatus.map(
                                  (entry, index) => (
                                    <Cell
                                      key={`cell-${index}`}
                                      fill={COLORS[index % COLORS.length]}
                                    />
                                  )
                                )}
                              </Pie>
                              <Tooltip />
                              <Legend />
                            </PieChart>
                          </ResponsiveContainer>
                        </div>
                      </div>
                    )}

                  {ordersReport.orderTrend &&
                    ordersReport.orderTrend.length > 0 && (
                      <div className="bg-white rounded-3xl shadow-sm border border-pink-100 p-5 md:p-6">
                        <h3 className="text-lg font-bold text-gray-900 mb-4">
                          Trend Pesanan Harian
                        </h3>
                        <div style={{ width: "100%", minHeight: "400px" }}>
                          <ResponsiveContainer width="100%" height={400}>
                            <LineChart data={ordersReport.orderTrend}>
                              <CartesianGrid strokeDasharray="3 3" />
                              <XAxis dataKey="date" />
                              <YAxis />
                              <Tooltip />
                              <Legend />
                              <Line
                                type="monotone"
                                dataKey="orders"
                                name="Jumlah Pesanan"
                                stroke="#cb5094"
                                strokeWidth={2}
                              />
                            </LineChart>
                          </ResponsiveContainer>
                        </div>
                      </div>
                    )}
                </>
              )
            )}
          </>
        )}

        {/* Inventory Report Tab */}
        {currentTab === "inventory" && (
          <>
            <div className="bg-white rounded-3xl shadow-sm border border-pink-100 p-5 md:p-6">
              <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-6">
                <h2 className="text-xl font-bold text-gray-900 flex items-center gap-3">
                  <Package className="w-6 h-6 text-[#cb5094]" />
                  Laporan Inventori
                </h2>
                <button
                  onClick={() => handleExportReport("inventory")}
                  className="bg-green-500 text-white px-6 py-3 rounded-xl font-semibold hover:bg-green-600 transition-all flex items-center gap-2 shadow-sm"
                >
                  <Download className="w-5 h-5" />
                  Export CSV
                </button>
              </div>
            </div>

            {reportLoading ? (
              <div className="text-center py-10">
                <div className="w-12 h-12 border-4 border-pink-200 border-t-[#cb5094] rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-gray-600">Memuat laporan...</p>
              </div>
            ) : (
              inventoryReport && (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-white rounded-2xl p-5 shadow-md">
                      <p className="text-gray-500 text-sm font-medium">
                        Total Produk
                      </p>
                      <p className="text-3xl font-bold text-[#cb5094] mt-2">
                        {inventoryReport.totalProducts || 0}
                      </p>
                    </div>
                    <div className="bg-white rounded-2xl p-5 shadow-md">
                      <p className="text-gray-500 text-sm font-medium">
                        Stok Menipis
                      </p>
                      <p className="text-3xl font-bold text-yellow-500 mt-2">
                        {inventoryReport.lowStock || 0}
                      </p>
                    </div>
                    <div className="bg-white rounded-2xl p-5 shadow-md">
                      <p className="text-gray-500 text-sm font-medium">
                        Stok Habis
                      </p>
                      <p className="text-3xl font-bold text-red-500 mt-2">
                        {inventoryReport.outOfStock || 0}
                      </p>
                    </div>
                  </div>

                  {inventoryReport.products &&
                    inventoryReport.products.length > 0 && (
                      <div className="bg-white rounded-3xl shadow-sm border border-pink-100 p-5 md:p-6">
                        <h3 className="text-lg font-bold text-gray-900 mb-4">
                          Status Stok Produk
                        </h3>
                        <div className="overflow-x-auto">
                          <table className="w-full">
                            <thead>
                              <tr className="border-b-2 border-gray-200">
                                <th className="text-left py-3 px-4 font-semibold text-gray-700">
                                  Produk
                                </th>
                                <th className="text-center py-3 px-4 font-semibold text-gray-700">
                                  Stok
                                </th>
                                <th className="text-center py-3 px-4 font-semibold text-gray-700">
                                  Status
                                </th>
                              </tr>
                            </thead>
                            <tbody>
                              {inventoryReport.products.map((product, idx) => (
                                <tr
                                  key={idx}
                                  className="border-b border-gray-100 hover:bg-gray-50"
                                >
                                  <td className="py-3 px-4 font-medium text-gray-800">
                                    {product.name}
                                  </td>
                                  <td className="py-3 px-4 text-center">
                                    {product.stock}
                                  </td>
                                  <td className="py-3 px-4 text-center">
                                    <span
                                      className={`px-3 py-1 rounded-full text-xs font-semibold ${
                                        product.status === "out"
                                          ? "bg-red-100 text-red-600"
                                          : product.status === "low"
                                          ? "bg-yellow-100 text-yellow-600"
                                          : "bg-green-100 text-green-600"
                                      }`}
                                    >
                                      {product.status === "out"
                                        ? "Habis"
                                        : product.status === "low"
                                        ? "Menipis"
                                        : "Normal"}
                                    </span>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}
                </>
              )
            )}
          </>
        )}

        {/* Category Report Tab */}
        {currentTab === "category" && (
          <>
            <div className="bg-white rounded-3xl shadow-sm border border-pink-100 p-5 md:p-6">
              <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-6">
                <h2 className="text-xl font-bold text-gray-900 flex items-center gap-3">
                  <FileText className="w-6 h-6 text-[#cb5094]" />
                  Laporan Kategori
                </h2>
                <button
                  onClick={() => handleExportReport("category")}
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

            {reportLoading ? (
              <div className="text-center py-10">
                <div className="w-12 h-12 border-4 border-pink-200 border-t-[#cb5094] rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-gray-600">Memuat laporan...</p>
              </div>
            ) : (
              categoryReport && (
                <>
                  {categoryReport.categories &&
                    categoryReport.categories.length > 0 && (
                      <>
                        <div className="bg-white rounded-3xl shadow-sm border border-pink-100 p-5 md:p-6">
                          <h3 className="text-lg font-bold text-gray-900 mb-4">
                            Performa Kategori
                          </h3>
                          <div className="space-y-4">
                            {categoryReport.categories.map((cat, idx) => (
                              <div
                                key={idx}
                                className="p-4 bg-gray-50 rounded-xl"
                              >
                                <div className="flex items-center justify-between mb-2">
                                  <div className="flex items-center gap-3">
                                    <div
                                      className="w-4 h-4 rounded-full"
                                      style={{
                                        backgroundColor:
                                          COLORS[idx % COLORS.length],
                                      }}
                                    ></div>
                                    <span className="font-semibold text-gray-800">
                                      {cat.name}
                                    </span>
                                  </div>
                                  <span className="text-lg font-bold text-[#cb5094]">
                                    {formatPrice(cat.sales)}
                                  </span>
                                </div>
                                <div className="flex items-center justify-between text-sm text-gray-600">
                                  <span>{cat.orders} items terjual</span>
                                  <span>{cat.percentage}%</span>
                                </div>
                                <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
                                  <div
                                    className="bg-[#cb5094] h-2 rounded-full transition-all"
                                    style={{ width: `${cat.percentage}%` }}
                                  ></div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>

                        <div className="bg-white rounded-3xl shadow-sm border border-pink-100 p-5 md:p-6">
                          <h3 className="text-lg font-bold text-gray-900 mb-4">
                            Distribusi Penjualan per Kategori
                          </h3>
                          <div style={{ width: "100%", minHeight: "400px" }}>
                            <ResponsiveContainer width="100%" height={400}>
                              <PieChart>
                                <Pie
                                  data={categoryReport.categories}
                                  dataKey="sales"
                                  nameKey="name"
                                  cx="50%"
                                  cy="50%"
                                  outerRadius={100}
                                  label={(entry) =>
                                    `${entry.name}: ${entry.percentage}%`
                                  }
                                >
                                  {categoryReport.categories.map(
                                    (entry, index) => (
                                      <Cell
                                        key={`cell-${index}`}
                                        fill={COLORS[index % COLORS.length]}
                                      />
                                    )
                                  )}
                                </Pie>
                                <Tooltip
                                  formatter={(val) => formatPrice(val)}
                                />
                                <Legend />
                              </PieChart>
                            </ResponsiveContainer>
                          </div>
                        </div>
                      </>
                    )}
                </>
              )
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default OwnerDashboard;