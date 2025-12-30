import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Clock,
  CheckCircle,
  XCircle,
  Truck,
  ShoppingBag,
  AlertCircle,
  CreditCard,
  Package,
  User,
  Phone,
  MapPin,
  Trash2,
} from "lucide-react";
import api from "../components/utils/api";
import { formatPrice } from "../components/utils/formatPrice";
import toast from "react-hot-toast";

function CustomerOrders() {
  const [orders, setOrders] = useState([]);
  const [filterStatus, setFilterStatus] = useState("all");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  // Placeholder SVG untuk no image
  const placeholderImage =
    "data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%2280%22 height=%2280%22 viewBox=%220 0 80 80%22%3E%3Crect width=%2280%22 height=%2280%22 fill=%22%23f3f4f6%22/%3E%3Ctext x=%2250%25%22 y=%2250%25%22 dominant-baseline=%22middle%22 text-anchor=%22middle%22 font-family=%22Arial, sans-serif%22 font-size=%2210%22 fill=%22%23d1d5db%22%3ENo Image%3C/text%3E%3C/svg%3E";

  useEffect(() => {
    loadOrders();

    const handleOrdersUpdate = () => {
      loadOrders();
    };

    window.addEventListener("ordersUpdated", handleOrdersUpdate);

    return () => {
      window.removeEventListener("ordersUpdated", handleOrdersUpdate);
    };
  }, []);

  const loadOrders = async () => {
    try {
      setIsLoading(true);
      setError(null);

      console.log("🔄 Fetching orders from /orders...");
      const response = await api.get("/orders");
      console.log("📦 Raw API Response:", response.data);

      const ordersData = response.data.orders || [];
      console.log("📋 Orders Data:", ordersData);
      console.log("📊 Total orders received:", ordersData.length);

      const transformedOrders = ordersData.map((order, orderIdx) => {
        console.log(`\n🔍 Processing Order #${orderIdx + 1}:`, {
          id: order.id,
          nomorOrder: order.nomorOrder,
          rawStatus: order.status,
          statusType: typeof order.status,
        });

        const orderItems = Array.isArray(order.items) ? order.items : [];

        const items = orderItems.map((item, idx) => {
          // Nama produk
          let nama = "Produk Tidak Diketahui";
          if (item.namaProduk) nama = item.namaProduk;
          else if (item.namaProduct) nama = item.namaProduct;
          else if (item.product?.nama) nama = item.product.nama;
          else if (item.variant?.nama) nama = item.variant.nama;
          else if (item.nama) nama = item.nama;

          // Gambar produk
          let imageUrl = placeholderImage;
          if (
            item.gambarVariant &&
            typeof item.gambarVariant === "string" &&
            item.gambarVariant.trim()
          ) {
            imageUrl = item.gambarVariant.trim();
          } else if (
            item.gambarUrl &&
            typeof item.gambarUrl === "string" &&
            item.gambarUrl.trim()
          ) {
            const urls = item.gambarUrl.split("|||").filter(Boolean);
            if (urls.length > 0) imageUrl = urls[0].trim();
          } else if (
            item.variant?.gambar &&
            typeof item.variant.gambar === "string" &&
            item.variant.gambar.trim()
          ) {
            imageUrl = item.variant.gambar.trim();
          } else if (
            item.product?.gambarUtama &&
            typeof item.product.gambarUtama === "string" &&
            item.product.gambarUtama.trim()
          ) {
            imageUrl = item.product.gambarUtama.trim();
          } else if (
            item.product?.gambarUrl &&
            typeof item.product.gambarUrl === "string" &&
            item.product.gambarUrl.trim()
          ) {
            const urls = item.product.gambarUrl.split("|||").filter(Boolean);
            if (urls.length > 0) imageUrl = urls[0].trim();
          }

          // Harga - coba berbagai kemungkinan field
          let harga = 0;
          if (item.hargaSatuan) harga = parseFloat(item.hargaSatuan);
          else if (item.hargaSnapshot) harga = parseFloat(item.hargaSnapshot);
          else if (item.harga) harga = parseFloat(item.harga);
          else if (item.price) harga = parseFloat(item.price);

          // Quantity
          const quantity = item.kuantitas || item.quantity || 1;

          // Subtotal - kalau ada ambil langsung, kalau tidak hitung dari harga x quantity
          let subtotal = 0;
          if (item.subtotal) subtotal = parseFloat(item.subtotal);
          else subtotal = harga * quantity;

          console.log(`📦 Item #${idx + 1} mapping:`, {
            nama,
            harga,
            quantity,
            subtotal,
            rawItem: item,
          });

          return {
            id: item.id || `item-${idx}`,
            nama: nama,
            ukuran: item.ukuranVariant || item.ukuran || "-",
            warna: item.warnaVariant || item.warna || "-",
            quantity: quantity,
            harga: harga,
            subtotal: subtotal,
            gambarUrl: imageUrl,
          };
        });

        const alamatBaris2 = order.alamatBaris2
          ? `, ${order.alamatBaris2}`
          : "";
        const alamat = `${order.alamatBaris1 || ""}${alamatBaris2}, ${
          order.kota || ""
        }, ${order.provinsi || ""} ${order.kodePos || ""}`;
        const alamatClean =
          alamat.replace(/^,\s*|\s*,\s*$/g, "").trim() ||
          "Alamat tidak tersedia";

        const frontendStatus = mapBackendStatusToFrontend(order.status);

        console.log(`✅ Order ${order.nomorOrder} mapped:`, {
          backendStatus: order.status,
          frontendStatus: frontendStatus,
          itemsCount: items.length,
        });

        return {
          id: order.nomorOrder || "Unknown",
          orderId: order.id,
          tanggal: order.dibuatPada,
          status: frontendStatus,
          backendStatus: order.status,
          total: parseFloat(order.total) || 0,
          subtotal: parseFloat(order.subtotal) || 0,
          ongkosKirim: parseFloat(order.ongkosKirim) || 0,
          namaPenerima: order.namaPenerima || "-",
          teleponPenerima: order.teleponPenerima || "-",
          alamat: alamatClean,
          items,
        };
      });

      console.log("\n📦 Final transformed orders:", transformedOrders);
      console.log("📊 Status distribution:", {
        pending: transformedOrders.filter((o) => o.status === "pending").length,
        confirmed: transformedOrders.filter((o) => o.status === "confirmed")
          .length,
        shipping: transformedOrders.filter((o) => o.status === "shipping")
          .length,
        delivered: transformedOrders.filter((o) => o.status === "delivered")
          .length,
        cancelled: transformedOrders.filter((o) => o.status === "cancelled")
          .length,
      });

      setOrders(transformedOrders);
    } catch (err) {
      console.error("❌ Fetch orders error:", err);
      console.error("Error details:", {
        message: err.message,
        response: err.response?.data,
        status: err.response?.status,
      });
      setError(
        err.response?.data?.message ||
          "Gagal memuat pesanan. Silakan coba lagi."
      );
    } finally {
      setIsLoading(false);
    }
  };

  const mapBackendStatusToFrontend = (backendStatus) => {
    if (!backendStatus) {
      console.warn("⚠️ No status provided, defaulting to pending");
      return "pending";
    }

    // Normalisasi ke uppercase untuk konsistensi
    const normalizedStatus = String(backendStatus).toUpperCase().trim();

    const statusMap = {
      PENDING_PAYMENT: "pending",
      PENDING: "pending",
      PAID: "confirmed",
      PROCESSING: "confirmed",
      SHIPPED: "shipping",
      COMPLETED: "delivered",
      DELIVERED: "delivered",
      CANCELLED: "cancelled",
      CANCELED: "cancelled",
    };

    const mappedStatus = statusMap[normalizedStatus] || "pending";

    console.log("🔄 Status mapping:", {
      original: backendStatus,
      normalized: normalizedStatus,
      mapped: mappedStatus,
      availableKeys: Object.keys(statusMap),
    });

    return mappedStatus;
  };

  const formatDate = (dateString) => {
    if (!dateString) return "-";
    return new Intl.DateTimeFormat("id-ID", {
      day: "numeric",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(dateString));
  };

  const getStatusConfig = (status) => {
    const configs = {
      pending: {
        label: "Menunggu Pembayaran",
        icon: Clock,
        color: "#fbbf24",
        bg: "rgba(251, 191, 36, 0.08)",
      },
      confirmed: {
        label: "Diproses",
        icon: Package,
        color: "#cb5094",
        bg: "rgba(203, 80, 148, 0.08)",
      },
      shipping: {
        label: "Dikirim",
        icon: Truck,
        color: "#8b5cf6",
        bg: "rgba(139, 92, 246, 0.08)",
      },
      delivered: {
        label: "Selesai",
        icon: CheckCircle,
        color: "#10b981",
        bg: "rgba(16, 185, 129, 0.08)",
      },
      cancelled: {
        label: "Dibatalkan",
        icon: XCircle,
        color: "#6b7280",
        bg: "rgba(107, 114, 128, 0.08)",
      },
    };
    return configs[status] || configs.pending;
  };

  const handlePayment = (order) => {
    if (order?.orderId) {
      navigate(`/customer/payment/${order.orderId}`);
    }
  };

  const handleTrackOrder = (order) => {
    if (order?.orderId) {
      navigate(`/customer/orders/${order.orderId}/tracking`);
    }
  };

  const handleDeleteOrder = async (order) => {
    // Validasi: hanya bisa batalkan jika status PENDING_PAYMENT
    if (order.backendStatus !== "PENDING_PAYMENT") {
      toast.error("Hanya pesanan yang belum dibayar yang bisa dibatalkan!", {
        duration: 4000,
        icon: "⚠️",
      });
      return;
    }

    if (
      !window.confirm(
        `Apakah Anda yakin ingin membatalkan pesanan ${order.id}?\n\nPesanan yang dibatalkan akan mengubah status menjadi "Dibatalkan" dan stok produk akan dikembalikan.`
      )
    ) {
      return;
    }

    try {
      const deleteToast = toast.loading("Membatalkan pesanan...");

      await api.delete(`/orders/${order.orderId}`);

      toast.dismiss(deleteToast);
      toast.success(`Pesanan ${order.id} berhasil dibatalkan!`, {
        duration: 4000,
        icon: "✅",
      });

      loadOrders();
    } catch (err) {
      console.error("Cancel order error:", err);
      const errorMsg =
        err.response?.data?.message ||
        err.message ||
        "Gagal membatalkan pesanan. Coba lagi.";
      toast.error(errorMsg, {
        duration: 5000,
        icon: "❌",
      });
    }
  };

  const filteredOrders =
    filterStatus === "all"
      ? orders
      : orders.filter((o) => o.status === filterStatus);

  console.log("🔍 Current filter:", filterStatus);
  console.log("📋 Filtered orders count:", filteredOrders.length);

  const filterOptions = [
    { value: "all", label: "Semua" },
    { value: "pending", label: "Bayar" },
    { value: "confirmed", label: "Diproses" },
    { value: "shipping", label: "Dikirim" },
    { value: "delivered", label: "Selesai" },
    { value: "cancelled", label: "Batal" },
  ];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20 px-1 min-h-screen bg-gradient-to-br from-pink-50 via-white to-purple-50">
        <div className="text-center">
          <div className="relative w-12 h-12 mx-auto mb-4">
            <div className="absolute inset-0 border-2 border-gray-100 rounded-full"></div>
            <div className="absolute inset-0 border-2 border-transparent border-t-[#cb5094] rounded-full animate-spin"></div>
          </div>
          <p className="text-sm text-gray-500">Memuat pesanan...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center py-20 px-1 min-h-screen bg-gradient-to-br from-pink-50 via-white to-purple-50">
        <div className="bg-white rounded-lg p-6 text-center max-w-sm w-full">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-3" />
          <p className="text-sm text-gray-700 mb-4">{error}</p>
          <button
            onClick={loadOrders}
            className="bg-[#cb5094] text-white py-2.5 px-6 rounded-lg text-sm font-medium hover:bg-[#b54684] transition-colors"
          >
            Coba Lagi
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-purple-50">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-gradient-to-br from-pink-50 via-white to-purple-50 border-b border-pink-100/50">
        <div className="px-3 md:px-6 pt-3 pb-2">
          <div className="flex items-center gap-3 mb-3">
            <ShoppingBag className="w-6 h-6 text-[#cb5094]" />
            <div className="flex-1">
              <h1 className="text-xl font-bold text-gray-900">Pesanan Saya</h1>
              <p className="text-xs text-gray-500 mt-0.5">
                {orders.length} total pesanan
              </p>
            </div>
          </div>

          <div className="flex gap-1 overflow-x-auto pb-1 scrollbar-hide flex-wrap">
            {filterOptions.map((f) => {
              const count =
                f.value === "all"
                  ? orders.length
                  : orders.filter((o) => o.status === f.value).length;
              const active = filterStatus === f.value;
              return (
                <button
                  key={f.value}
                  onClick={() => {
                    console.log("🔄 Changing filter to:", f.value);
                    setFilterStatus(f.value);
                  }}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
                    active
                      ? "bg-[#cb5094] text-white shadow-md shadow-pink-200/50"
                      : "bg-white text-gray-600 hover:bg-gray-50 border border-gray-200"
                  }`}
                >
                  {f.label}
                  <span
                    className={`ml-1.5 px-1.5 py-0.5 rounded-full text-xs ${
                      active ? "bg-white/20" : "bg-gray-100"
                    }`}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div className="px-3 md:px-6 pb-20">
        {filteredOrders.length === 0 ? (
          <div className="text-center py-16">
            <Package className="w-16 h-16 text-gray-200 mx-auto mb-3" />
            <p className="text-sm text-gray-500 mb-1">
              {filterStatus === "all"
                ? "Belum ada pesanan"
                : `Tidak ada pesanan dengan status "${
                    filterOptions.find((f) => f.value === filterStatus)?.label
                  }"`}
            </p>
            <p className="text-xs text-gray-400 mb-4">
              Total pesanan: {orders.length}
            </p>
            <button
              onClick={() => navigate("/customer/products")}
              className="bg-[#cb5094] text-white px-6 py-2.5 rounded-lg text-sm font-medium hover:bg-[#b54684] transition-colors"
            >
              Mulai Belanja
            </button>
          </div>
        ) : (
          <div className="space-y-3 mt-3">
            {filteredOrders.map((order) => {
              const cfg = getStatusConfig(order.status);
              const Icon = cfg.icon;

              return (
                <div
                  key={order.id}
                  className="bg-white border border-gray-100 rounded-xl overflow-hidden shadow-sm"
                >
                  {/* MOBILE LAYOUT */}
                  <div className="md:hidden">
                    {/* Header */}
                    <div className="px-3 py-3 border-b border-gray-100">
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <p className="font-bold text-sm text-gray-900">
                            {order.id}
                          </p>
                          <p className="text-xs text-gray-500 mt-0.5">
                            {formatDate(order.tanggal)}
                          </p>
                        </div>
                        <div
                          className="w-8 h-8 rounded-full flex items-center justify-center"
                          style={{
                            backgroundColor: cfg.bg,
                            color: cfg.color,
                          }}
                        >
                          <Icon className="w-4 h-4" />
                        </div>
                      </div>

                      {/* Info Pengguna */}
                      <div className="flex items-start gap-2 mb-2">
                        <User className="w-4 h-4 text-[#cb5094] mt-0.5 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-gray-900">
                            {order.namaPenerima}
                          </p>
                          <p className="text-xs text-gray-600">
                            {order.teleponPenerima}
                          </p>
                        </div>
                      </div>

                      {/* Info Alamat */}
                      <div className="flex items-start gap-2">
                        <MapPin className="w-4 h-4 text-[#cb5094] mt-0.5 flex-shrink-0" />
                        <p className="text-xs text-gray-600 leading-relaxed flex-1">
                          {order.alamat}
                        </p>
                      </div>
                    </div>

                    {/* Items */}
                    <div className="px-3 py-3">
                      {order.items.map((item, idx) => (
                        <div
                          key={item.id}
                          className={`flex gap-3 ${
                            idx > 0 ? "mt-3 pt-3 border-t border-gray-100" : ""
                          }`}
                        >
                          <div className="w-16 h-16 rounded-lg overflow-hidden bg-gray-50 flex-shrink-0 border border-gray-100">
                            <img
                              src={item.gambarUrl}
                              alt={item.nama}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                e.target.src = placeholderImage;
                              }}
                            />
                          </div>

                          <div className="flex-1 min-w-0">
                            <h4 className="font-semibold text-sm text-gray-900 mb-1">
                              {item.nama}
                            </h4>
                            <div className="flex items-center justify-between">
                              <div>
                                {(item.ukuran !== "-" ||
                                  item.warna !== "-") && (
                                  <p className="text-xs text-gray-500">
                                    {item.ukuran !== "-" && item.warna !== "-"
                                      ? `${item.ukuran} • ${item.warna}`
                                      : item.ukuran !== "-"
                                      ? item.ukuran
                                      : item.warna}
                                  </p>
                                )}
                                <p className="text-xs text-gray-500 mt-0.5">
                                  {formatPrice(item.harga)} × {item.quantity}
                                </p>
                              </div>
                              <span className="font-bold text-sm text-gray-900">
                                {formatPrice(item.subtotal)}
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Footer Mobile */}
                    <div className="px-3 py-3 bg-gray-50 border-t border-gray-100">
                      <div className="space-y-1.5 mb-3">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-gray-600">Subtotal Produk</span>
                          <span className="font-medium text-gray-900">
                            {formatPrice(order.subtotal)}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-gray-600">Ongkos Kirim</span>
                          <span className="font-medium text-gray-900">
                            {formatPrice(order.ongkosKirim)}
                          </span>
                        </div>
                        <div className="pt-1.5 border-t border-gray-200 flex items-center justify-between">
                          <span className="text-sm font-semibold text-gray-700">
                            Total Pembayaran
                          </span>
                          <span className="text-lg font-bold text-[#cb5094]">
                            {formatPrice(order.total)}
                          </span>
                        </div>
                      </div>

                      <div className="flex flex-col gap-2">
                        {order.status === "pending" && (
                          <>
                            <button
                              onClick={() => handlePayment(order)}
                              className="w-full bg-[#cb5094] text-white py-2.5 rounded-lg text-sm font-semibold hover:bg-[#b54684] transition-colors flex items-center justify-center gap-2"
                            >
                              <CreditCard className="w-4 h-4" />
                              Bayar Sekarang
                            </button>
                            <button
                              onClick={() => handleDeleteOrder(order)}
                              className="w-full bg-red-500 text-white py-2.5 rounded-lg text-sm font-semibold hover:bg-red-600 transition-colors flex items-center justify-center gap-2"
                            >
                              <Trash2 className="w-4 h-4" />
                              Batalkan Pesanan
                            </button>
                          </>
                        )}
                        {order.status === "shipping" && (
                          <button
                            onClick={() => handleTrackOrder(order)}
                            className="w-full border-2 border-[#cb5094] text-[#cb5094] py-2.5 rounded-lg text-sm font-semibold hover:bg-[#cb5094] hover:text-white transition-colors flex items-center justify-center gap-2"
                          >
                            <Truck className="w-4 h-4" />
                            Lacak Pesanan
                          </button>
                        )}
                        {order.status === "confirmed" && (
                          <div className="w-full text-center py-2 text-sm text-gray-500 font-medium">
                            Pesanan sedang dikemas
                          </div>
                        )}
                        {order.status === "delivered" && (
                          <div className="w-full text-center py-2 text-sm text-green-600 font-semibold">
                            ✓ Pesanan Selesai
                          </div>
                        )}
                        {order.status === "cancelled" && (
                          <div className="w-full text-center py-2 text-sm text-gray-400 font-medium">
                            Pesanan Dibatalkan
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* DESKTOP LAYOUT */}
                  <div className="hidden md:block">
                    <div className="px-4 py-3 border-b border-gray-100">
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <p className="font-bold text-sm text-gray-900">
                            {order.id}
                          </p>
                          <p className="text-xs text-gray-500 mt-0.5">
                            {formatDate(order.tanggal)}
                          </p>
                        </div>
                        <div
                          className="px-3 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1.5"
                          style={{
                            backgroundColor: cfg.bg,
                            color: cfg.color,
                          }}
                        >
                          <Icon className="w-3.5 h-3.5" />
                          <span>{cfg.label}</span>
                        </div>
                      </div>

                      <div className="flex items-start gap-2 mb-2">
                        <User className="w-4 h-4 text-[#cb5094] mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="text-sm font-semibold text-gray-900">
                            {order.namaPenerima}
                          </p>
                          <p className="text-xs text-gray-600">
                            {order.teleponPenerima}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-start gap-2">
                        <MapPin className="w-4 h-4 text-[#cb5094] mt-0.5 flex-shrink-0" />
                        <p className="text-xs text-gray-600 leading-relaxed">
                          {order.alamat}
                        </p>
                      </div>
                    </div>

                    {order.items.map((item, idx) => (
                      <div
                        key={item.id}
                        className={`px-4 py-3 flex items-center gap-4 ${
                          idx > 0 ? "border-t border-gray-100" : ""
                        }`}
                      >
                        <div className="w-20 h-20 rounded-lg overflow-hidden bg-gray-50 flex-shrink-0 border border-gray-100">
                          <img
                            src={item.gambarUrl}
                            alt={item.nama}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              e.target.src = placeholderImage;
                            }}
                          />
                        </div>

                        <div className="flex-1">
                          <h4 className="font-semibold text-sm text-gray-900">
                            {item.nama}
                          </h4>
                          {(item.ukuran !== "-" || item.warna !== "-") && (
                            <p className="text-xs text-gray-500 mt-1">
                              {item.ukuran !== "-" && item.warna !== "-"
                                ? `${item.ukuran} • ${item.warna}`
                                : item.ukuran !== "-"
                                ? item.ukuran
                                : item.warna}
                            </p>
                          )}
                        </div>

                        <div className="text-right">
                          <p className="text-sm font-medium text-gray-900">
                            {formatPrice(item.harga)}
                          </p>
                          <p className="text-xs text-gray-500 mt-0.5">
                            × {item.quantity}
                          </p>
                        </div>

                        <div className="text-right min-w-[120px]">
                          <p className="text-sm font-bold text-gray-900">
                            {formatPrice(item.subtotal)}
                          </p>
                        </div>
                      </div>
                    ))}

                    {/* Footer Desktop */}
                    <div className="px-4 py-3 bg-gray-50 border-t border-gray-100">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-6">
                          <span className="text-xs text-gray-600">
                            Total Barang:{" "}
                            {order.items.reduce(
                              (sum, item) => sum + item.quantity,
                              0
                            )}
                          </span>
                        </div>

                        <div className="flex flex-col items-end gap-1">
                          <div className="flex items-center gap-4 text-xs text-gray-600">
                            <span>Subtotal:</span>
                            <span className="font-medium">
                              {formatPrice(order.subtotal)}
                            </span>
                          </div>
                          <div className="flex items-center gap-4 text-xs text-gray-600">
                            <span>Ongkir:</span>
                            <span className="font-medium">
                              {formatPrice(order.ongkosKirim)}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 pt-1 border-t border-gray-200">
                            <span className="text-sm font-semibold text-gray-700">
                              Total:
                            </span>
                            <span className="text-xl font-bold text-[#cb5094]">
                              {formatPrice(order.total)}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center justify-end gap-3">
                        {order.status === "pending" && (
                          <>
                            <button
                              onClick={() => handlePayment(order)}
                              className="bg-[#cb5094] text-white py-2 px-6 rounded-lg text-sm font-semibold hover:bg-[#b54684] transition-colors flex items-center gap-2"
                            >
                              <CreditCard className="w-4 h-4" />
                              Bayar Sekarang
                            </button>
                            <button
                              onClick={() => handleDeleteOrder(order)}
                              className="border-2 border-red-500 text-red-500 py-2 px-6 rounded-lg text-sm font-semibold hover:bg-red-500 hover:text-white transition-colors flex items-center gap-2"
                            >
                              <Trash2 className="w-4 h-4" />
                              Batalkan
                            </button>
                          </>
                        )}
                        {order.status === "shipping" && (
                          <button
                            onClick={() => handleTrackOrder(order)}
                            className="border-2 border-[#cb5094] text-[#cb5094] py-2 px-6 rounded-lg text-sm font-semibold hover:bg-[#cb5094] hover:text-white transition-colors flex items-center gap-2"
                          >
                            <Truck className="w-4 h-4" />
                            Lacak Pesanan
                          </button>
                        )}
                        {order.status === "confirmed" && (
                          <div className="text-center py-2 px-6 text-sm text-gray-500 font-medium">
                            Pesanan sedang dikemas
                          </div>
                        )}
                        {order.status === "delivered" && (
                          <div className="text-center py-2 px-6 text-sm text-green-600 font-semibold">
                            ✓ Pesanan Selesai
                          </div>
                        )}
                        {order.status === "cancelled" && (
                          <div className="text-center py-2 px-6 text-sm text-gray-400 font-medium">
                            Pesanan Dibatalkan
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export default CustomerOrders;
