import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Package,
  Truck,
  CheckCircle,
  Clock,
  MapPin,
  AlertCircle,
  RefreshCw,
  Phone,
  User,
  ThumbsUp,
  ExternalLink,
  Copy,
} from "lucide-react";
import api from "../utils/api";
import publicApi from "../utils/publicApi";
import { formatPrice } from "../utils/formatPrice";
import toast from "react-hot-toast";

function CustomerTracking() {
  const { orderId } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [orderData, setOrderData] = useState(null);
  const [shipmentData, setShipmentData] = useState(null);
  const [confirmingDelivery, setConfirmingDelivery] = useState(false);

  useEffect(() => {
    if (orderId) {
      loadTrackingData();
    }
  }, [orderId]);

  const loadTrackingData = async () => {
    try {
      setLoading(true);
      setError(null);

      console.log("🔍 Loading tracking for order:", orderId);

      // 1. Get order details
const orderRes = await api.get(`/orders/${orderId}`);
      const order = orderRes.data.order || orderRes.data;
      setOrderData(order);
      console.log("📦 Order data:", order);

      // 2. Get shipment info (resi) dari backend
      try {
        const trackingRes = await api.get(`/shipments/tracking/${orderId}`);



        if (trackingRes.data.hasShipment) {
          const tracking = trackingRes.data.tracking;

          setShipmentData({
            status: tracking.status,
            nomorResi: tracking.nomorResi,
            kurir: tracking.kurir,
            layanan: tracking.layanan,
            estimasiPengiriman: tracking.estimasiPengiriman,
            courierTrackingUrl: tracking.courierTrackingUrl,
            dikirimPada: tracking.dikirimPada,
            diterimaPada: tracking.diterimaPada,
          });

          console.log("📍 Shipment info:", tracking);
        } else {
          // Belum ada shipment
          setShipmentData({
            status: "PENDING",
            nomorResi: null,
            kurir: null,
          });
        }
      } catch (trackErr) {
        console.warn("⚠️ Shipment not available:", trackErr.message);
        setShipmentData({
          status: order.status,
          nomorResi: null,
          kurir: null,
        });
      }
    } catch (err) {
      console.error("❌ Error loading tracking:", err);
      setError(err.response?.data?.message || "Gagal memuat data pelacakan");
    } finally {
      setLoading(false);
    }
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

  const handleCopyResi = () => {
    if (shipmentData?.nomorResi) {
      navigator.clipboard.writeText(shipmentData.nomorResi);
      toast.success("Nomor resi berhasil disalin!", {
        duration: 2000,
        icon: "📋",
      });
    }
  };

  const handleConfirmDelivery = async () => {
    if (
      !window.confirm(
        "Apakah Anda sudah menerima pesanan ini?\n\n" +
          "Dengan mengkonfirmasi, Anda menyatakan bahwa:\n" +
          "• Pesanan sudah diterima dalam kondisi baik\n" +
          '• Status pesanan akan diubah menjadi "Selesai"\n\n' +
          "Proses ini tidak dapat dibatalkan."
      )
    ) {
      return;
    }

    setConfirmingDelivery(true);
    try {
      await api.put(`/orders/${orderId}/status`, {
        status: "COMPLETED",
      });

      toast.success("Terima kasih! Pesanan telah dikonfirmasi diterima.", {
        duration: 4000,
        icon: "✅",
      });

      await loadTrackingData();
    } catch (err) {
      console.error("❌ Error confirming delivery:", err);
      toast.error(
        err.response?.data?.message || "Gagal mengkonfirmasi penerimaan.",
        { duration: 5000, icon: "❌" }
      );
    } finally {
      setConfirmingDelivery(false);
    }
  };

  const getShipmentStatusConfig = (status) => {
    const configs = {
      PENDING: {
        label: "Menunggu Pengiriman",
        icon: Clock,
        color: "text-yellow-600",
        bg: "bg-yellow-50",
        border: "border-yellow-200",
      },
      READY_TO_SHIP: {
        label: "Siap Dikirim",
        icon: Package,
        color: "text-blue-600",
        bg: "bg-blue-50",
        border: "border-blue-200",
      },
      SHIPPED: {
        label: "Dalam Pengiriman",
        icon: Truck,
        color: "text-purple-600",
        bg: "bg-purple-50",
        border: "border-purple-200",
      },
      IN_TRANSIT: {
        label: "Dalam Perjalanan",
        icon: Truck,
        color: "text-purple-600",
        bg: "bg-purple-50",
        border: "border-purple-200",
      },
      DELIVERED: {
        label: "Terkirim",
        icon: CheckCircle,
        color: "text-green-600",
        bg: "bg-green-50",
        border: "border-green-200",
      },
    };
    return configs[status] || configs.PENDING;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-purple-50 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="relative w-16 h-16 mx-auto mb-4">
            <div className="absolute inset-0 border-4 border-gray-100 rounded-full"></div>
            <div className="absolute inset-0 border-4 border-transparent border-t-[#cb5094] rounded-full animate-spin"></div>
          </div>
          <p className="text-gray-600 font-medium">Memuat data pelacakan...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-purple-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl p-8 max-w-md w-full text-center shadow-lg">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-900 mb-2">
            Gagal Memuat Data
          </h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <div className="flex gap-3">
            <button
              onClick={() => navigate("/customer/orders")}
              className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition"
            >
              Kembali
            </button>
            <button
              onClick={loadTrackingData}
              className="flex-1 px-6 py-3 bg-[#cb5094] text-white rounded-xl font-semibold hover:bg-[#b54684] transition flex items-center justify-center gap-2"
            >
              <RefreshCw className="w-5 h-5" />
              Coba Lagi
            </button>
          </div>
        </div>
      </div>
    );
  }

  const statusConfig = shipmentData
    ? getShipmentStatusConfig(shipmentData.status)
    : null;
  const StatusIcon = statusConfig?.icon || Package;

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-purple-50 pb-20">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-white/80 backdrop-blur-md border-b border-pink-100 shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate("/customer/orders")}
              className="w-10 h-10 bg-white border-2 border-gray-200 rounded-xl flex items-center justify-center hover:border-[#cb5094] hover:text-[#cb5094] transition"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="flex-1">
              <h1 className="text-xl font-bold text-gray-900">Lacak Pesanan</h1>
              <p className="text-sm text-gray-500">{orderData?.nomorOrder}</p>
            </div>
            <button
              onClick={loadTrackingData}
              className="px-4 py-2 bg-[#cb5094] text-white rounded-xl font-semibold hover:bg-[#b54684] transition flex items-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              Refresh
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        {/* Status Card */}
        {shipmentData && (
          <div
            className={`bg-white rounded-2xl p-6 border-2 ${statusConfig.border} shadow-md`}
          >
            <div className="flex items-center gap-4 mb-4">
              <div
                className={`w-14 h-14 ${statusConfig.bg} rounded-2xl flex items-center justify-center`}
              >
                <StatusIcon className={`w-7 h-7 ${statusConfig.color}`} />
              </div>
              <div className="flex-1">
                <h2 className={`text-xl font-bold ${statusConfig.color}`}>
                  {statusConfig.label}
                </h2>
                {shipmentData.dikirimPada && (
                  <p className="text-sm text-gray-600 mt-1">
                    Dikirim pada: {formatDate(shipmentData.dikirimPada)}
                  </p>
                )}
              </div>
            </div>

            {/* Nomor Resi Section */}
            {shipmentData.nomorResi ? (
              <div className="mt-6 pt-4 border-t border-gray-200">
                <div className="bg-gradient-to-r from-pink-50 to-purple-50 rounded-xl p-5 border-2 border-pink-200">
                  <div className="flex items-start justify-between gap-4 mb-4">
                    <div className="flex-1">
                      <p className="text-xs text-gray-600 font-medium mb-2">
                        Nomor Resi Pengiriman
                      </p>
                      <p className="text-2xl font-bold text-gray-900 tracking-wide mb-1">
                        {shipmentData.nomorResi}
                      </p>
                      {shipmentData.kurir && (
                        <p className="text-sm text-gray-700">
                          Kurir:{" "}
                          <span className="font-semibold uppercase">
                            {shipmentData.kurir}
                          </span>
                          {shipmentData.layanan && ` - ${shipmentData.layanan}`}
                        </p>
                      )}
                    </div>
                    <button
                      onClick={handleCopyResi}
                      className="px-4 py-2 bg-white border-2 border-pink-300 text-pink-700 rounded-lg font-semibold hover:bg-pink-50 transition flex items-center gap-2 flex-shrink-0"
                    >
                      <Copy className="w-4 h-4" />
                      Salin
                    </button>
                  </div>

                  {/* Link ke Website Kurir */}
                  {shipmentData.courierTrackingUrl ? (
                    <a
                      href={shipmentData.courierTrackingUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full bg-gradient-to-r from-[#cb5094] to-[#e570b3] text-white py-3 rounded-lg font-bold hover:shadow-lg transition flex items-center justify-center gap-2"
                    >
                      <ExternalLink className="w-5 h-5" />
                      Lacak di Website{" "}
                      {shipmentData.kurir?.toUpperCase() || "Ekspedisi"}
                    </a>
                  ) : (
                    shipmentData.kurir && (
                      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-center">
                        <p className="text-sm text-yellow-800">
                          Cek tracking di website resmi{" "}
                          <span className="font-bold uppercase">
                            {shipmentData.kurir}
                          </span>{" "}
                          dengan nomor resi di atas
                        </p>
                      </div>
                    )
                  )}
                </div>
              </div>
            ) : (
              <div className="mt-6 pt-4 border-t border-gray-200">
                <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-5 text-center">
                  <Package className="w-12 h-12 text-blue-600 mx-auto mb-3" />
                  <h4 className="font-bold text-blue-900 text-lg mb-1">
                    Pesanan Sedang Diproses
                  </h4>
                  <p className="text-sm text-blue-700">
                    Nomor resi akan tersedia setelah pesanan dikirim oleh admin
                  </p>
                </div>
              </div>
            )}

            {/* Tombol Konfirmasi Penerimaan */}
            {(shipmentData.status === "SHIPPED" ||
              shipmentData.status === "IN_TRANSIT") && (
              <div className="mt-6 pt-4 border-t border-gray-200">
                <div className="bg-green-50 border-2 border-green-200 rounded-xl p-4 mb-3">
                  <div className="flex items-start gap-3">
                    <Package className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <h4 className="font-bold text-green-900 mb-1">
                        Pesanan Sudah Diterima?
                      </h4>
                      <p className="text-sm text-green-700">
                        Jika pesanan sudah sampai dan diterima dengan baik,
                        silakan konfirmasi penerimaan.
                      </p>
                    </div>
                  </div>
                </div>
                <button
                  onClick={handleConfirmDelivery}
                  disabled={confirmingDelivery}
                  className="w-full bg-gradient-to-r from-green-500 to-green-600 text-white py-3.5 rounded-xl font-bold text-base hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {confirmingDelivery ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Mengkonfirmasi...</span>
                    </>
                  ) : (
                    <>
                      <ThumbsUp className="w-5 h-5" />
                      <span>Konfirmasi Pesanan Diterima</span>
                    </>
                  )}
                </button>
              </div>
            )}

            {/* Status Selesai */}
            {shipmentData.status === "DELIVERED" && (
              <div className="mt-6 pt-4 border-t border-gray-200">
                <div className="bg-green-50 border-2 border-green-200 rounded-xl p-4 text-center">
                  <CheckCircle className="w-12 h-12 text-green-600 mx-auto mb-2" />
                  <h4 className="font-bold text-green-900 text-lg mb-1">
                    Pesanan Selesai
                  </h4>
                  <p className="text-sm text-green-700">
                    Terima kasih telah berbelanja! Pesanan telah diterima dengan
                    baik.
                  </p>
                  {shipmentData.diterimaPada && (
                    <p className="text-xs text-green-600 mt-2">
                      Diterima pada: {formatDate(shipmentData.diterimaPada)}
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Order Info */}
        {orderData && (
          <div className="bg-white rounded-2xl p-6 shadow-md">
            <h3 className="text-lg font-bold text-gray-900 mb-4">
              Informasi Pesanan
            </h3>

            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <User className="w-5 h-5 text-[#cb5094] mt-0.5" />
                <div className="flex-1">
                  <p className="text-xs text-gray-500 mb-1">Penerima</p>
                  <p className="font-semibold text-gray-900">
                    {orderData.namaPenerima}
                  </p>
                  <p className="text-sm text-gray-600 flex items-center gap-1 mt-1">
                    <Phone className="w-3.5 h-3.5" />
                    {orderData.teleponPenerima}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 pt-4 border-t border-gray-200">
                <MapPin className="w-5 h-5 text-[#cb5094] mt-0.5" />
                <div className="flex-1">
                  <p className="text-xs text-gray-500 mb-1">
                    Alamat Pengiriman
                  </p>
                  <p className="text-sm text-gray-700 leading-relaxed">
                    {orderData.alamatBaris1}
                    {orderData.alamatBaris2 && `, ${orderData.alamatBaris2}`}
                    <br />
                    {orderData.kota}, {orderData.provinsi} {orderData.kodePos}
                  </p>
                </div>
              </div>

              <div className="pt-4 border-t border-gray-200">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm text-gray-600">Total Pesanan</span>
                  <span className="text-xl font-bold text-[#cb5094]">
                    {formatPrice(orderData.total)}
                  </span>
                </div>
                <p className="text-xs text-gray-500">
                  {orderData.items?.length || 0} item • Ongkir:{" "}
                  {formatPrice(orderData.ongkosKirim)}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default CustomerTracking;
