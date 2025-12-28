import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  ShoppingCart,
  MapPin,
  CheckCircle,
  ArrowLeft,
  ChevronDown,
  ChevronUp,
  Package,
  Truck,
  RefreshCw,
  X,
} from "lucide-react";
import api from "../utils/api";
import { formatPrice } from "../utils/formatPrice";
import toast from "react-hot-toast";

const STORE_POSTAL_CODE = "28124";

function CustomerCheckout() {
  const navigate = useNavigate();
  const [cart, setCart] = useState([]);
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(() => {
    const saved = localStorage.getItem("checkoutStep");
    return saved ? parseInt(saved, 10) : 1;
  });
  const [showItemDetails, setShowItemDetails] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  const [shippingForm, setShippingForm] = useState({
    namaPenerima: "",
    teleponPenerima: "",
    emailPenerima: "",
    alamatBaris1: "",
    alamatBaris2: "",
    kota: "",
    provinsi: "",
    kodePos: "",
    lokasiLengkap: "", // Untuk tampilan lengkap seperti di dropdown
  });

  const [tipe, setTipe] = useState("READY");
  const [catatan, setCatatan] = useState("");

  const [searchResults, setSearchResults] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchLoading, setSearchLoading] = useState(false);
  const [selectedArea, setSelectedArea] = useState(null);

  const [shippingRates, setShippingRates] = useState([]);
  const [selectedCourier, setSelectedCourier] = useState(null);
  const [loadingRates, setLoadingRates] = useState(false);

  const [showPostalDropdown, setShowPostalDropdown] = useState(false);

  useEffect(() => {
    loadCart();
    loadUserProfile();
  }, []);

  useEffect(() => {
    localStorage.setItem("checkoutStep", step.toString());
  }, [step]);

  useEffect(() => {
    if (searchQuery.length < 3) {
      setSearchResults([]);
      return;
    }

    if (selectedArea && searchQuery === selectedArea.cleanName) {
      setSearchResults([]);
      return;
    }

    const timer = setTimeout(() => {
      fetchAreas(searchQuery);
    }, 500);

    return () => clearTimeout(timer);
  }, [searchQuery, selectedArea]);

  useEffect(() => {
    if (step === 3 && selectedArea && cart.length > 0) {
      fetchShippingRates();
    }
  }, [step, selectedArea]);

  const loadUserProfile = () => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      const user = JSON.parse(storedUser);
      setShippingForm((prev) => ({
        ...prev,
        namaPenerima: user.nama || "",
        teleponPenerima: user.nomorTelepon || user.phone || "",
        emailPenerima: user.email || "",
        alamatBaris1: user.alamat || "",
      }));
    }
  };

  const fetchAreas = async (query) => {
    try {
      setSearchLoading(true);
      const response = await api.get("/shipment/areas", {
        params: { input: query },
      });

      if (response.data?.areas) {
        const areaMap = new Map();

        for (const area of response.data.areas) {
          const postalMatch = area.name.match(/\.\s*(\d{5})$/);
          const postalCode = postalMatch ? postalMatch[1] : null;

          if (!areaMap.has(area.id)) {
            const cleanName = area.name.replace(/\.\s*\d{5}$/g, "").trim();
            areaMap.set(area.id, {
              ...area,
              name: cleanName,
              cleanName,
              postal_codes: postalCode ? [postalCode] : [],
            });
          } else if (
            postalCode &&
            !areaMap.get(area.id).postal_codes.includes(postalCode)
          ) {
            areaMap.get(area.id).postal_codes.push(postalCode);
          }
        }

        setSearchResults(Array.from(areaMap.values()));
      }
    } catch (error) {
      console.error("Error fetching areas:", error);
      toast.error("Gagal memuat daftar lokasi");
    } finally {
      setSearchLoading(false);
    }
  };

  const handleAreaSelect = (area) => {
    const cleanName = area.name.replace(/\.\s*\d+$/g, "").trim();
    const updatedArea = { ...area, cleanName };

    setSelectedArea(updatedArea);

    setShippingForm((prev) => ({
      ...prev,
      provinsi: area.administrative_division_level_1_name || "",
      kota: area.administrative_division_level_2_name || area.name,
      lokasiLengkap: cleanName, // Simpan nama lengkap untuk tampilan
      kodePos: "",
    }));

    setSearchQuery(cleanName);
    setSearchResults([]);
  };

  // Perubahan utama: Handle Pemilihan Ekspedisi
  

  const fetchShippingRates = async () => {
    // Validasi minimal supaya request tidak ngaco
    if (!/^\d{5}$/.test(shippingForm.kodePos)) {
      toast.error("Kode pos harus 5 digit angka");
      return;
    }

    try {
      setLoadingRates(true);

      const items = cart.map((item) => {
        const length = Number(item.length || item.panjang || 40);
        const width = Number(item.width || item.lebar || 2);
        const height = Number(item.height || item.tinggi || 90);
        const weight = Number(item.weight || item.berat || 1000);

        return {
          name: String(item.nama || "Produk"),
          description: String(item.deskripsi || item.nama || "Produk"),
          value: Number(item.harga) || 10000,
          length,
          width,
          height,
          weight,
          quantity: Number(item.quantity) || 1,
        };
      });

      const payload = {
        origin_postal_code: Number(STORE_POSTAL_CODE), // 28124
        destination_postal_code: Number(shippingForm.kodePos), // contoh 50245
        couriers: "jne,jnt,sicepat,anteraja", // tambah "pos" kalau mau
        items,
      };

      const response = await fetch("http://localhost:5000/api/shipment/rates", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
        },
        body: JSON.stringify(payload),
      });

      const responseText = await response.text();
      let data;
      try {
        data = JSON.parse(responseText);
      } catch {
        console.error("❌ Invalid JSON response:", responseText);
        throw new Error("Invalid JSON response from server");
      }

      if (!response.ok) {
        throw new Error(
          data.message || data.error || "Gagal menghitung ongkir"
        );
      }

      let pricingData = [];
      if (data?.pricing) pricingData = data.pricing;
      else if (data?.data?.pricing) pricingData = data.data.pricing;
      else if (Array.isArray(data?.data)) pricingData = data.data;
      else if (Array.isArray(data)) pricingData = data;

  const validRates = pricingData
    .filter((rate) => Number(rate.price) > 0)
    .map((rate, index) => ({
      ...rate,
      uniqueId: `${rate.courier_company}-${rate.courier_code}-${rate.courier_service_code}-${index}`, // ✅ ID unik
    }));

      if (validRates.length > 0) {
        validRates.sort((a, b) => a.price - b.price);
        setShippingRates(validRates);
        setSelectedCourier(validRates[0]);
        toast.success(`Ditemukan ${validRates.length} opsi pengiriman`);
      } else {
        throw new Error("Tidak ada tarif valid");
      }
    } catch (error) {
      console.error("Error fetching rates:", error);
      toast.error(`Tidak dapat memuat ongkir: ${error.message}`);

      // fallback tetap boleh dipakai jika API gagal
      const totalBerat = cart.reduce((sum, item) => {
        const weight = Number(item.weight || item.berat || 500);
        const qty = Number(item.quantity || 1);
        return sum + weight * qty;
      }, 0);

      let price = 15000;
      let service = "Regular";
      let duration = "3-5 hari kerja";

      if (totalBerat > 3000) {
        price = 35000;
        service = "Cargo";
        duration = "5-7 hari kerja";
      } else if (totalBerat > 1000) {
        price = 25000;
        service = "Express";
        duration = "2-4 hari kerja";
      }

      const fallback = [
        {
          courier_name: "Pengiriman Standar",
          courier_service_name: service,
          courier_company: "standard",
          courier_service_code: "reg",
          courier_code: "standard",
          price,
          duration,
        },
      ];

      setShippingRates(fallback);
      setSelectedCourier(fallback[0]);
    } finally {
      setLoadingRates(false);
    }
  };

  const loadCart = () => {
    const checkoutItems = JSON.parse(
      localStorage.getItem("checkoutItems") || "[]"
    );
    if (checkoutItems.length === 0) {
      toast.error("Tidak ada item yang dipilih untuk checkout");
      navigate("/customer/cart");
      return;
    }
    setCart(checkoutItems);
  };

  const calculateSubtotal = () =>
    cart.reduce((sum, item) => sum + item.harga * item.quantity, 0);
  const calculateTotal = () =>
    calculateSubtotal() + (selectedCourier?.price || 0);

  const handleShippingSubmit = (e) => {
    e.preventDefault();
    if (
      !shippingForm.namaPenerima ||
      !shippingForm.teleponPenerima ||
      !shippingForm.alamatBaris1 ||
      !selectedArea ||
      !shippingForm.kodePos
    ) {
      toast.error("Mohon lengkapi semua field wajib (termasuk kode pos)");
      return;
    }
    if (!/^08\d{8,11}$/.test(shippingForm.teleponPenerima)) {
      toast.error("Nomor telepon tidak valid");
      return;
    }
    if (!/^\d{5}$/.test(shippingForm.kodePos)) {
      toast.error("Kode pos harus 5 digit angka");
      return;
    }

    setStep(3);
  };

  const handleCreateOrder = () => {
    if (!selectedCourier) {
      toast.error("Silakan pilih metode pengiriman");
      return;
    }
    setShowConfirmModal(true);
  };

  const handleConfirmAndCreateOrder = async () => {
    try {
      setLoading(true);
      setShowConfirmModal(false);

      const items = cart.map((item) => ({
        productVariantId: item.variantId || item.id,
        kuantitas: Number(item.quantity),
      }));

      const alamatPengiriman = {
        namaPenerima: shippingForm.namaPenerima,
        teleponPenerima: shippingForm.teleponPenerima,
        alamatBaris1: shippingForm.alamatBaris1,
        alamatBaris2: shippingForm.alamatBaris2 || "",
        kota: shippingForm.kota,
        provinsi: shippingForm.provinsi,
        kodePos: String(shippingForm.kodePos).padStart(5, "0"),
      };

      const orderData = {
        items,
        alamatPengiriman,
        tipe,
        ongkosKirim: Number(selectedCourier.price),
        catatan: catatan || "",
      };

      const response = await api.post("/orders", orderData);
      const order = response.data.order;

      toast.success("Pesanan berhasil dibuat!");

      const fullCart = JSON.parse(localStorage.getItem("cart") || "[]");
      const remainingCart = fullCart.filter(
        (cartItem) =>
          !cart.some(
            (checkoutItem) =>
              cartItem.id === checkoutItem.id &&
              (cartItem.variantId || cartItem.id) ===
                (checkoutItem.variantId || checkoutItem.id)
          )
      );
      localStorage.setItem("cart", JSON.stringify(remainingCart));
      localStorage.removeItem("checkoutItems");
      window.dispatchEvent(new Event("cartUpdated"));

      localStorage.removeItem("checkoutStep");

      navigate(`/customer/payment/${order.id}`);
    } catch (error) {
      console.error("Error creating order:", error);
      const msg = error.response?.data?.message || "Gagal membuat pesanan";
      toast.error(Array.isArray(msg) ? msg.join(", ") : msg);
    } finally {
      setLoading(false);
    }
  };

  const totalQuantity = cart.reduce((sum, item) => sum + item.quantity, 0);

  const handlePostalSelect = (code) => {
    const formattedCode = String(code).padStart(5, "0");
    setShippingForm((prev) => ({ ...prev, kodePos: formattedCode }));
    setShowPostalDropdown(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50/30 via-white to-pink-50/20 pb-24 lg:pb-8">
      {/* Modal Konfirmasi */}
      {showConfirmModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-gradient-to-r from-[#cb5094] to-[#e570b3] text-white p-6 rounded-t-2xl">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold flex items-center gap-2">
                  <CheckCircle className="w-6 h-6" />
                  Konfirmasi Pesanan Anda
                </h3>
                <button
                  onClick={() => setShowConfirmModal(false)}
                  className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-4">
              <p className="text-sm text-gray-600 mb-4">
                Pastikan semua informasi sudah benar sebelum membuat pesanan.
              </p>

              <div className="space-y-3">
                <div className="bg-gray-50 rounded-xl p-4 border-l-4 border-[#cb5094]">
                  <p className="text-xs font-bold text-gray-500 mb-2">
                    📦 INFORMASI PENERIMA
                  </p>
                  <div className="space-y-2">
                    <div>
                      <p className="text-xs text-gray-500">Nama</p>
                      <p className="font-bold text-gray-900">
                        {shippingForm.namaPenerima}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Telepon</p>
                      <p className="font-bold text-gray-900">
                        {shippingForm.teleponPenerima}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Email</p>
                      <p className="font-bold text-gray-900">
                        {shippingForm.emailPenerima || "-"}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 rounded-xl p-4 border-l-4 border-[#cb5094]">
                  <p className="text-xs font-bold text-gray-500 mb-2">
                    📍 ALAMAT PENGIRIMAN
                  </p>
                  <div className="space-y-2">
                    <div>
                      <p className="font-bold text-gray-900">
                        {shippingForm.alamatBaris1}
                      </p>
                      {shippingForm.alamatBaris2 && (
                        <p className="text-sm text-gray-600">
                          {shippingForm.alamatBaris2}
                        </p>
                      )}
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">
                        {shippingForm.lokasiLengkap ||
                          `${shippingForm.kota}, ${shippingForm.provinsi}`}
                      </p>
                      <p className="text-sm font-bold text-gray-900">
                        Kode Pos: {shippingForm.kodePos}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 rounded-xl p-4 border-l-4 border-[#cb5094]">
                  <p className="text-xs font-bold text-gray-500 mb-2">
                    🚚 PENGIRIMAN
                  </p>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-bold text-gray-900">
                        {selectedCourier?.courier_name} -{" "}
                        {selectedCourier?.courier_service_name}
                      </p>
                      <p className="text-xs text-gray-600">
                        {selectedCourier?.duration || "2-5 hari"}
                      </p>
                    </div>
                    <p className="text-lg font-bold text-[#cb5094]">
                      {formatPrice(selectedCourier?.price || 0)}
                    </p>
                  </div>
                </div>

                <div className="bg-gradient-to-br from-pink-50 to-purple-50 rounded-xl p-4 border-2 border-[#cb5094]">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-bold text-gray-700">
                      Total Item
                    </p>
                    <p className="text-sm text-gray-900">
                      {cart.length} item ({totalQuantity} pcs)
                    </p>
                  </div>
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-bold text-gray-700">Subtotal</p>
                    <p className="text-sm text-gray-900">
                      {formatPrice(calculateSubtotal())}
                    </p>
                  </div>
                  <div className="flex items-center justify-between mb-3 pb-3 border-b-2 border-gray-300">
                    <p className="text-sm font-bold text-gray-700">Ongkir</p>
                    <p className="text-sm text-gray-900">
                      {formatPrice(selectedCourier?.price || 0)}
                    </p>
                  </div>
                  <div className="flex items-center justify-between">
                    <p className="text-lg font-bold text-gray-900">
                      TOTAL BAYAR
                    </p>
                    <p className="text-2xl font-bold bg-gradient-to-r from-[#cb5094] to-[#e570b3] bg-clip-text text-transparent">
                      {formatPrice(calculateTotal())}
                    </p>
                  </div>
                </div>

                {catatan && (
                  <div className="bg-yellow-50 rounded-xl p-4 border border-yellow-200">
                    <p className="text-xs font-bold text-yellow-800 mb-1">
                      📝 Catatan
                    </p>
                    <p className="text-sm text-yellow-900">{catatan}</p>
                  </div>
                )}
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => setShowConfirmModal(false)}
                  className="flex-1 border-2 border-gray-300 text-gray-700 py-3 rounded-xl font-bold hover:bg-gray-50 transition-all"
                  disabled={loading}
                >
                  Kembali
                </button>
                <button
                  onClick={handleConfirmAndCreateOrder}
                  disabled={loading}
                  className="flex-1 bg-gradient-to-r from-[#cb5094] to-[#e570b3] text-white py-3 rounded-xl font-bold hover:shadow-2xl hover:shadow-[#cb5094]/40 transition-all duration-300 disabled:opacity-50"
                >
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <Package className="w-5 h-5 animate-spin" />
                      Memproses...
                    </span>
                  ) : (
                    "Buat Pesanan"
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-10">
          <button
            onClick={() => navigate("/customer/cart")}
            className="flex items-center gap-2 text-gray-600 hover:text-[#cb5094] mb-4 font-semibold transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            Kembali ke Keranjang
          </button>
          <h1 className="text-5xl font-bold text-gray-900 mb-3 tracking-tight">
            Checkout
          </h1>
          <div className="flex items-center gap-3">
            <div className="h-1 w-16 bg-gradient-to-r from-[#cb5094] to-[#e570b3] rounded-full"></div>
            <p className="text-gray-600 font-medium">
              {cart.length} item siap untuk checkout
            </p>
          </div>
        </div>

        <div className="mb-8">
          <div className="flex items-center justify-center">
            {[
              { num: 1, label: "Review Cart", icon: ShoppingCart },
              { num: 2, label: "Shipping Info", icon: MapPin },
              { num: 3, label: "Confirm Order", icon: CheckCircle },
            ].map((s, idx) => (
              <div key={s.num} className="flex items-center">
                <div
                  className={`flex items-center gap-2 px-4 py-2 rounded-full transition-all ${
                    step >= s.num
                      ? "bg-gradient-to-r from-[#cb5094] to-[#e570b3] text-white shadow-lg"
                      : "bg-white text-gray-400 border-2 border-gray-200"
                  }`}
                >
                  <s.icon className="w-4 h-4" />
                  <span className="hidden sm:inline text-sm font-bold">
                    {s.label}
                  </span>
                </div>
                {idx < 2 && (
                  <div
                    className={`w-12 sm:w-24 h-1 ${
                      step > s.num
                        ? "bg-gradient-to-r from-[#cb5094] to-[#e570b3]"
                        : "bg-gray-200"
                    }`}
                  ></div>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            {step === 1 && (
              <div className="bg-white rounded-2xl shadow-lg p-6 border border-[#cb5094]/10">
                <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                  <ShoppingCart className="w-6 h-6 text-[#cb5094]" />
                  Review Item Anda
                </h2>

                <div className="space-y-3">
                  {cart.map((item, idx) => {
                    const displayImage =
                      item.variantImageUrl ||
                      item.gambarUrl?.split("|||")[0] ||
                      "https://via.placeholder.com/100?text=No+Image";

                    return (
                      <div
                        key={idx}
                        className="flex gap-4 p-4 bg-gradient-to-br from-gray-50 to-pink-50/30 rounded-xl border border-[#cb5094]/10 hover:shadow-md transition-shadow"
                      >
                        <div className="relative">
                          <img
                            src={displayImage}
                            alt={item.nama}
                            className="w-20 h-20 object-cover rounded-lg"
                            onError={(e) =>
                              (e.target.src =
                                "https://via.placeholder.com/100?text=No+Image")
                            }
                          />
                          {item.quantity > 1 && (
                            <div className="absolute -top-2 -right-2 px-2 py-0.5 bg-gradient-to-br from-[#cb5094] to-[#e570b3] rounded-full shadow-md">
                              <span className="text-xs font-bold text-white">
                                ×{item.quantity}
                              </span>
                            </div>
                          )}
                        </div>
                        <div className="flex-1">
                          <h3 className="font-bold text-gray-900">
                            {item.nama}
                          </h3>
                          {(item.ukuran || item.warna) && (
                            <div className="flex items-center gap-1.5 mt-1">
                              {item.ukuran && (
                                <span className="px-2 py-0.5 text-xs font-bold text-[#cb5094] bg-[#cb5094]/10 rounded-full border border-[#cb5094]/30">
                                  {item.ukuran}
                                </span>
                              )}
                              {item.warna && (
                                <span className="px-2 py-0.5 text-xs font-bold text-[#cb5094] bg-[#cb5094]/10 rounded-full border border-[#cb5094]/30">
                                  {item.warna}
                                </span>
                              )}
                            </div>
                          )}
                          <p className="text-sm text-gray-500 mt-1">
                            Qty: {item.quantity}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold bg-gradient-to-r from-[#cb5094] to-[#e570b3] bg-clip-text text-transparent">
                            {formatPrice(item.harga * item.quantity)}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <button
                  onClick={() => setStep(2)}
                  className="w-full mt-6 bg-gradient-to-r from-[#cb5094] to-[#e570b3] text-white py-4 rounded-xl font-bold hover:shadow-2xl hover:shadow-[#cb5094]/40 transition-all duration-300 transform hover:scale-105"
                >
                  Lanjut ke Pengiriman
                </button>
              </div>
            )}

            {step === 2 && (
              <div className="bg-white rounded-2xl shadow-lg p-6 border border-[#cb5094]/10">
                <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                  <MapPin className="w-6 h-6 text-[#cb5094]" />
                  Informasi Pengiriman
                </h2>

                <div className="mb-6 p-4 bg-blue-50 border-2 border-blue-200 rounded-xl">
                  <p className="text-sm text-blue-800">
                    <span className="font-bold">💡 Info:</span> Data nama,
                    telepon, dan email sudah diisi otomatis dari profil Anda.
                    Anda bisa mengubahnya jika diperlukan.
                  </p>
                </div>

                <form onSubmit={handleShippingSubmit} className="space-y-4">
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-2">
                        Nama Penerima *
                      </label>
                      <input
                        type="text"
                        value={shippingForm.namaPenerima}
                        onChange={(e) =>
                          setShippingForm((prev) => ({
                            ...prev,
                            namaPenerima: e.target.value,
                          }))
                        }
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-[#cb5094] transition-colors"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-2">
                        Nomor Telepon *
                      </label>
                      <input
                        type="tel"
                        value={shippingForm.teleponPenerima}
                        onChange={(e) => {
                          const value = e.target.value.replace(/\D/g, "");
                          setShippingForm((prev) => ({
                            ...prev,
                            teleponPenerima: value,
                          }));
                        }}
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-[#cb5094] transition-colors"
                        placeholder="081234567890"
                        maxLength="13"
                        required
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Format: 08xxxxxxxxxx
                      </p>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">
                      Email *
                    </label>
                    <input
                      type="email"
                      value={shippingForm.emailPenerima}
                      onChange={(e) =>
                        setShippingForm((prev) => ({
                          ...prev,
                          emailPenerima: e.target.value,
                        }))
                      }
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-[#cb5094] transition-colors"
                      required
                    />
                  </div>

                  <div className="grid sm:grid-cols-3 gap-4">
                    <div className="sm:col-span-2 relative">
                      <label className="block text-sm font-bold text-gray-700 mb-2">
                        Kota/Kecamatan/Provinsi *
                      </label>
                      <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-[#cb5094] transition-colors"
                        placeholder="Ketik minimal 3 karakter..."
                        required
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Minimal 3 karakter untuk mencari
                      </p>

                      {searchLoading && (
                        <div className="absolute right-3 top-11 text-gray-400 animate-spin">
                          <Package className="w-5 h-5" />
                        </div>
                      )}

                      {searchResults.length > 0 && (
                        <div className="absolute z-10 w-full mt-2 bg-white border-2 border-gray-200 rounded-xl shadow-lg max-h-60 overflow-y-auto">
                          {searchResults.map((area, index) => {
                            const cleanName =
                              area.cleanName ||
                              area.name.replace(/\.\s*\d+$/g, "").trim();

                            return (
                              <button
                                key={`${area.id}-${index}`}
                                type="button"
                                onClick={() => handleAreaSelect(area)}
                                className="w-full text-left px-4 py-3 hover:bg-pink-50 transition-colors border-b border-gray-100 last:border-0"
                              >
                                <div className="font-semibold text-gray-900">
                                  {cleanName}
                                </div>
                                <div className="text-sm text-gray-600">
                                  {area.administrative_division_level_2_name &&
                                    `${area.administrative_division_level_2_name}, `}
                                  {area.administrative_division_level_1_name}
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>

                    <div className="relative">
                      <label className="block text-sm font-bold text-gray-700 mb-2">
                        Kode Pos *
                      </label>
                      {selectedArea ? (
                        selectedArea.postal_codes &&
                        selectedArea.postal_codes.length > 0 ? (
                          <div>
                            <div
                              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl bg-white cursor-pointer flex items-center justify-between hover:border-[#cb5094] transition-colors"
                              onClick={() =>
                                setShowPostalDropdown(!showPostalDropdown)
                              }
                            >
                              <span
                                className={
                                  shippingForm.kodePos
                                    ? "text-gray-900"
                                    : "text-gray-500"
                                }
                              >
                                {shippingForm.kodePos || "Pilih Kode Pos"}
                              </span>
                              <ChevronDown
                                className={`w-5 h-5 text-gray-500 transition-transform ${
                                  showPostalDropdown ? "rotate-180" : ""
                                }`}
                              />
                            </div>
                            {showPostalDropdown && (
                              <div className="absolute z-10 w-full mt-2 bg-white border-2 border-gray-200 rounded-xl shadow-lg max-h-60 overflow-y-auto">
                                {selectedArea.postal_codes.map(
                                  (postalCode, idx) => {
                                    const formattedCode = String(
                                      postalCode
                                    ).padStart(5, "0");
                                    return (
                                      <button
                                        key={idx}
                                        type="button"
                                        onClick={() =>
                                          handlePostalSelect(postalCode)
                                        }
                                        className="w-full text-left px-4 py-3 hover:bg-pink-50 transition-colors border-b border-gray-100 last:border-0 font-semibold text-gray-900"
                                      >
                                        {formattedCode}
                                      </button>
                                    );
                                  }
                                )}
                              </div>
                            )}
                          </div>
                        ) : (
                          <div>
                            <input
                              type="text"
                              value={shippingForm.kodePos}
                              onChange={(e) => {
                                const value = e.target.value.replace(/\D/g, "");
                                if (value.length <= 5) {
                                  setShippingForm((prev) => ({
                                    ...prev,
                                    kodePos: value,
                                  }));
                                }
                              }}
                              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-[#cb5094] transition-colors"
                              placeholder="Input manual"
                              maxLength="5"
                              required
                            />
                            <p className="text-xs text-orange-600 mt-1">
                              ⚠️ Kode pos tidak tersedia, input manual
                            </p>
                          </div>
                        )
                      ) : (
                        <input
                          type="text"
                          value=""
                          className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl bg-gray-100 text-gray-400"
                          placeholder="Pilih kota dulu"
                          disabled
                        />
                      )}
                      <p className="text-xs text-gray-500 mt-1">
                        {selectedArea
                          ? selectedArea.postal_codes?.length > 0
                            ? "Pilih dari daftar"
                            : "Input manual 5 digit"
                          : "Pilih kota terlebih dahulu"}
                      </p>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">
                      Alamat Lengkap *
                    </label>
                    <input
                      type="text"
                      value={shippingForm.alamatBaris1}
                      onChange={(e) =>
                        setShippingForm((prev) => ({
                          ...prev,
                          alamatBaris1: e.target.value,
                        }))
                      }
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-[#cb5094] transition-colors"
                      placeholder="Jl. Nama Jalan No. 123"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">
                      Detail Alamat (Opsional)
                    </label>
                    <input
                      type="text"
                      value={shippingForm.alamatBaris2}
                      onChange={(e) =>
                        setShippingForm((prev) => ({
                          ...prev,
                          alamatBaris2: e.target.value,
                        }))
                      }
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-[#cb5094] transition-colors"
                      placeholder="Patokan, RT/RW, dll"
                    />
                  </div>

                  <div className="flex gap-3 pt-4">
                    <button
                      type="button"
                      onClick={() => setStep(1)}
                      className="flex-1 border-2 border-gray-300 text-gray-700 py-3 rounded-xl font-bold hover:bg-gray-50 transition-all"
                    >
                      Kembali
                    </button>
                    <button
                      type="submit"
                      className="flex-1 bg-gradient-to-r from-[#cb5094] to-[#e570b3] text-white py-3 rounded-xl font-bold hover:shadow-2xl hover:shadow-[#cb5094]/40 transition-all duration-300 transform hover:scale-105"
                    >
                      Lanjutkan
                    </button>
                  </div>
                </form>
              </div>
            )}

            {step === 3 && (
              <div className="space-y-6">
                <div className="bg-white rounded-2xl shadow-lg p-6 border border-[#cb5094]/10">
                  <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2 text-lg">
                    <MapPin className="w-5 h-5 text-[#cb5094]" />
                    Alamat Pengiriman
                  </h3>
                  <div className="bg-gradient-to-br from-gray-50 to-pink-50/30 rounded-xl p-4 border border-[#cb5094]/10">
                    <p className="font-bold text-gray-900">
                      {shippingForm.namaPenerima}
                    </p>
                    <p className="text-sm text-gray-600">
                      {shippingForm.teleponPenerima}
                    </p>
                    <p className="text-sm text-gray-600 mt-2">
                      {shippingForm.alamatBaris1}
                      {shippingForm.alamatBaris2 &&
                        `, ${shippingForm.alamatBaris2}`}
                    </p>
                    <p className="text-sm text-gray-600 mt-1">
                      {shippingForm.lokasiLengkap ||
                        `${shippingForm.kota}, ${shippingForm.provinsi}`}
                    </p>
                    <p className="text-sm font-bold text-gray-900">
                      Kode Pos: {shippingForm.kodePos}
                    </p>
                  </div>
                  <button
                    onClick={() => setStep(2)}
                    className="mt-3 text-sm text-[#cb5094] font-bold hover:underline"
                  >
                    Edit Alamat
                  </button>
                </div>

                <div className="bg-white rounded-2xl shadow-lg p-6 border border-[#cb5094]/10">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="font-bold text-gray-900 text-lg flex items-center gap-2">
                      <Truck className="w-6 h-6 text-[#cb5094]" />
                      Pilih Metode Pengiriman
                    </h3>
                    <button
                      onClick={fetchShippingRates}
                      className="flex items-center gap-1 text-sm text-[#cb5094] hover:underline"
                    >
                      <RefreshCw className="w-4 h-4" />
                      Muat Ulang
                    </button>
                  </div>

                  {loadingRates ? (
                    <div className="text-center py-12">
                      <Package className="w-16 h-16 text-[#cb5094] mx-auto mb-4 animate-spin" />
                      <p className="text-gray-600 font-medium">
                        Sedang menghitung tarif pengiriman...
                      </p>
                    </div>
                  ) : shippingRates.length > 0 ? (
                    <div className="space-y-4">
                      {shippingRates.map((rate, idx) => {
                        const isSelected =
                          selectedCourier?.uniqueId === rate.uniqueId;
                        const isCheapest = idx === 0 && rate.price > 0;

                        return (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => setSelectedCourier(rate)} // ✅ Simple & works
                            className={`w-full p-5 rounded-2xl border-3 transition-all relative overflow-hidden text-left ${
                              isSelected
                                ? "border-[#cb5094] bg-gradient-to-br from-pink-50 to-[#cb5094]/5 shadow-lg"
                                : "border-gray-200 hover:border-[#cb5094]/50 hover:bg-gray-50"
                            }`}
                          >
                            {isCheapest && (
                              <div className="absolute top-2 right-2 bg-gradient-to-r from-green-500 to-emerald-600 text-white text-xs font-bold px-3 py-1 rounded-full shadow-md">
                                Termurah
                              </div>
                            )}
                            {rate.price === 0 && (
                              <div className="absolute top-2 right-2 bg-gradient-to-r from-amber-500 to-orange-600 text-white text-xs font-bold px-3 py-1 rounded-full shadow-md animate-pulse">
                                GRATIS ONGKIR
                              </div>
                            )}

                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-4">
                                <div className="w-16 h-16 bg-gray-100 rounded-xl flex items-center justify-center border border-gray-300">
                                  <span className="text-2xl font-bold text-[#cb5094]">
                                    {rate.courier_name
                                      ?.substring(0, 3)
                                      .toUpperCase()}
                                  </span>
                                </div>

                                <div>
                                  <p className="font-bold text-lg text-gray-900">
                                    {rate.courier_name}{" "}
                                    {rate.courier_service_name}
                                  </p>
                                  <p className="text-sm text-gray-600 mt-1">
                                    Estimasi tiba: {rate.duration || "2-5 hari"}
                                  </p>
                                  {rate.price === 0 ? (
                                    <p className="text-2xl font-bold text-green-600 mt-2">
                                      GRATIS
                                    </p>
                                  ) : (
                                    <p className="text-2xl font-bold bg-gradient-to-r from-[#cb5094] to-[#e570b3] bg-clip-text text-transparent mt-2">
                                      {formatPrice(rate.price)}
                                    </p>
                                  )}
                                </div>
                              </div>

                              <div
                                className={`w-7 h-7 rounded-full border-4 flex items-center justify-center transition-all ${
                                  isSelected
                                    ? "border-[#cb5094] bg-[#cb5094]"
                                    : "border-gray-300"
                                }`}
                              >
                                {isSelected && (
                                  <div className="w-3 h-3 bg-white rounded-full" />
                                )}
                              </div>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="text-center py-10">
                      <Truck className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-600 font-medium">
                        Tidak ada opsi pengiriman tersedia
                      </p>
                      <p className="text-sm text-gray-500 mt-2">
                        Coba ubah lokasi pengiriman
                      </p>
                    </div>
                  )}
                </div>

                <div className="bg-white rounded-2xl shadow-lg p-6 border border-[#cb5094]/10">
                  <h3 className="font-bold text-gray-900 mb-3 text-lg">
                    Catatan Pesanan (Opsional)
                  </h3>
                  <textarea
                    value={catatan}
                    onChange={(e) => setCatatan(e.target.value)}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-[#cb5094] transition-colors"
                    rows="3"
                    placeholder="Tambahkan catatan untuk pesanan..."
                  />
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => setStep(2)}
                    className="flex-1 border-2 border-gray-300 text-gray-700 py-4 rounded-xl font-bold hover:bg-gray-50 transition-all"
                    disabled={loading}
                  >
                    Kembali
                  </button>
                  <button
                    onClick={handleCreateOrder}
                    disabled={loading || !selectedCourier}
                    className="flex-1 bg-gradient-to-r from-[#cb5094] to-[#e570b3] text-white py-4 rounded-xl font-bold hover:shadow-2xl hover:shadow-[#cb5094]/40 transition-all duration-300 transform hover:scale-105 disabled:opacity-50"
                  >
                    Konfirmasi & Buat Pesanan
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="lg:col-span-1">
            <div className="sticky top-20">
              <div className="relative overflow-hidden rounded-2xl shadow-xl border border-white/20 bg-gradient-to-br from-white to-[#cb5094]/20 backdrop-blur-xl">
                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-[#cb5094]/10 to-[#e570b3]/10 rounded-full blur-3xl"></div>

                <div className="relative z-10 p-6 space-y-5">
                  <div className="pb-4 border-b border-gray-300">
                    <h3 className="text-xl font-bold text-gray-900 mb-1">
                      Ringkasan Pesanan
                    </h3>
                    <p className="text-xs font-semibold text-gray-600">
                      {cart.length} item · {totalQuantity} pcs
                    </p>
                  </div>

                  <div className="border-b border-gray-300 pb-4">
                    <button
                      onClick={() => setShowItemDetails(!showItemDetails)}
                      className="w-full flex items-center justify-between text-sm font-bold text-gray-900 hover:text-[#cb5094] transition-colors"
                    >
                      <span>Detail Barang ({cart.length})</span>
                      {showItemDetails ? (
                        <ChevronUp className="w-4 h-4" />
                      ) : (
                        <ChevronDown className="w-4 h-4" />
                      )}
                    </button>

                    {showItemDetails && (
                      <div className="mt-3 space-y-2 max-h-60 overflow-y-auto">
                        {cart.map((item, idx) => (
                          <div
                            key={idx}
                            className="flex items-start gap-2 p-2 bg-gray-50 rounded-lg"
                          >
                            <img
                              src={
                                item.variantImageUrl ||
                                item.gambarUrl?.split("|||")[0] ||
                                "https://via.placeholder.com/40"
                              }
                              alt={item.nama}
                              className="w-10 h-10 object-cover rounded"
                              onError={(e) =>
                                (e.target.src =
                                  "https://via.placeholder.com/40")
                              }
                            />
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-bold text-gray-900 truncate">
                                {item.nama}
                              </p>
                              {(item.ukuran || item.warna) && (
                                <p className="text-[10px] text-gray-600">
                                  {item.ukuran && `${item.ukuran}`}
                                  {item.ukuran && item.warna && " · "}
                                  {item.warna && `${item.warna}`}
                                </p>
                              )}
                              <p className="text-xs text-gray-600">
                                {item.quantity}× {formatPrice(item.harga)}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="text-xs font-bold text-gray-900">
                                {formatPrice(item.harga * item.quantity)}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="space-y-3">
                    <div className="flex justify-between items-center py-2">
                      <span className="text-xs uppercase tracking-wider font-bold text-gray-700">
                        Subtotal
                      </span>
                      <span className="text-base font-bold text-gray-900">
                        {formatPrice(calculateSubtotal())}
                      </span>
                    </div>

                    <div className="flex justify-between items-center py-2 border-b border-gray-300">
                      <span className="text-xs uppercase tracking-wider font-bold text-gray-700">
                        Ongkir
                      </span>
                      <div className="text-right">
                        {loadingRates ? (
                          <span className="text-sm text-gray-500 animate-pulse">
                            Menghitung...
                          </span>
                        ) : selectedCourier ? (
                          <div>
                            <span className="text-base font-bold text-gray-900">
                              {formatPrice(selectedCourier.price)}
                            </span>
                            {selectedCourier.courier_name && (
                              <p className="text-xs text-gray-600">
                                {selectedCourier.courier_name}
                              </p>
                            )}
                          </div>
                        ) : (
                          <span className="text-sm text-gray-500">
                            Belum dipilih
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="pt-3">
                      <div className="flex justify-between items-baseline mb-1">
                        <span className="text-sm font-bold uppercase tracking-wide text-gray-900">
                          Total Bayar
                        </span>
                        <div className="text-right">
                          <span className="text-2xl font-bold bg-gradient-to-r from-[#cb5094] to-[#e570b3] bg-clip-text text-transparent block">
                            {formatPrice(calculateTotal())}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {step === 3 && selectedCourier?.price === 0 && (
                    <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200 rounded-xl p-3 text-xs font-bold text-green-800">
                      <CheckCircle className="w-4 h-4 inline mr-2" />
                      Selamat! Anda mendapat gratis ongkir
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default CustomerCheckout;
