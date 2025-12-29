import { useState, useEffect } from "react";
import {
  Edit2,
  Save,
  X,
  User,
  Mail,
  Phone,
  MapPin,
  Check,
  Plus,
  Trash2,
  Star,
  Search,
  ChevronDown,
} from "lucide-react";
import api from "../utils/api";
import toast from "react-hot-toast";

function CustomerProfile() {
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [userData, setUserData] = useState({
    id: "",
    nama: "",
    email: "",
    nomorTelepon: "",
  });
  const [profileForm, setProfileForm] = useState({
    id: "",
    nama: "",
    email: "",
    nomorTelepon: "",
  });
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Addresses state
  const [addresses, setAddresses] = useState([]);
  const [isAddingAddress, setIsAddingAddress] = useState(false);
  const [editingAddressId, setEditingAddressId] = useState(null);

  // Address form
  const [addressForm, setAddressForm] = useState({
    label: "",
    namaPenerima: "",
    teleponPenerima: "",
    alamatBaris1: "",
    alamatBaris2: "",
    kota: "",
    provinsi: "",
    kodePos: "",
    isDefault: false,
    lokasiLengkap: "",
  });

  // Search location state
  const [searchResults, setSearchResults] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchLoading, setSearchLoading] = useState(false);
  const [selectedArea, setSelectedArea] = useState(null);
  const [showPostalDropdown, setShowPostalDropdown] = useState(false);

  useEffect(() => {
    loadUserData();
    loadAddresses();
  }, []);

  const loadUserData = () => {
    const storedUser = JSON.parse(localStorage.getItem("user") || "{}");
    if (storedUser.id) {
      const user = {
        id: storedUser.id,
        nama: storedUser.nama || storedUser.name || "User",
        email: storedUser.email || "",
        nomorTelepon:
          storedUser.nomorTelepon ||
          storedUser.phone ||
          storedUser.telepon ||
          "",
      };
      setUserData(user);
      setProfileForm(user);
    }
  };

  const loadAddresses = async () => {
    try {
      const response = await api.get("/auth/addresses");
      const addresses = response.data.data || [];
      setAddresses(addresses);
      sessionStorage.setItem("addresses", JSON.stringify(addresses));
    } catch (error) {
      console.error("Gagal memuat alamat dari server:", error);
      toast.error("Gagal memuat alamat tersimpan");

      // Fallback ke sessionStorage
      const stored = sessionStorage.getItem("addresses");
      if (stored) {
        const addresses = JSON.parse(stored);
        setAddresses(addresses);
      }
    }
  };

  const getInitials = (name) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  // === FITUR PENCARIAN LOKASI ===
  useEffect(() => {
    if (searchQuery.length < 3) {
      setSearchResults([]);
      return;
    }

    const timer = setTimeout(() => {
      fetchAreas(searchQuery);
    }, 500);

    return () => clearTimeout(timer);
  }, [searchQuery]);

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
    const cleanName =
      area.cleanName || area.name.replace(/\.\s*\d+$/g, "").trim();
    const updatedArea = { ...area, cleanName };

    setSelectedArea(updatedArea);

    setAddressForm((prev) => ({
      ...prev,
      provinsi: area.administrative_division_level_1_name || "",
      kota: area.administrative_division_level_2_name || area.name,
      lokasiLengkap: cleanName,
      kodePos: "",
    }));

    setSearchQuery(cleanName);
    setSearchResults([]);
  };

  const handlePostalSelect = (code) => {
    const formattedCode = String(code).padStart(5, "0");
    setAddressForm((prev) => ({ ...prev, kodePos: formattedCode }));
    setShowPostalDropdown(false);
  };

  // === ADDRESS CRUD ===
  const handleAddAddress = () => {
    setIsAddingAddress(true);
    setEditingAddressId(null);
    setSelectedArea(null);
    setSearchQuery("");
    setAddressForm({
      label: "",
      namaPenerima: userData.nama,
      teleponPenerima: userData.nomorTelepon,
      alamatBaris1: "",
      alamatBaris2: "",
      kota: "",
      provinsi: "",
      kodePos: "",
      isDefault: addresses.length === 0,
      lokasiLengkap: "",
    });
  };

  const handleEditAddress = (addr) => {
    setEditingAddressId(addr.id);
    setIsAddingAddress(true);
    setSelectedArea(null);
    setSearchQuery(`${addr.kota}, ${addr.provinsi}`);
    setAddressForm({
      label: addr.label || "",
      namaPenerima: addr.namaPenerima,
      teleponPenerima: addr.teleponPenerima,
      alamatBaris1: addr.alamatBaris1,
      alamatBaris2: addr.alamatBaris2 || "",
      kota: addr.kota,
      provinsi: addr.provinsi,
      kodePos: addr.kodePos,
      isDefault: addr.isDefault,
      lokasiLengkap: `${addr.kota}, ${addr.provinsi}`,
    });
  };

  const handleSaveAddress = async () => {
    if (
      !addressForm.namaPenerima ||
      !addressForm.teleponPenerima ||
      !addressForm.alamatBaris1 ||
      !addressForm.kota ||
      !addressForm.provinsi ||
      !addressForm.kodePos
    ) {
      toast.error("Mohon lengkapi semua field wajib");
      return;
    }

    if (!/^\d{5}$/.test(addressForm.kodePos)) {
      toast.error("Kode pos harus 5 digit angka");
      return;
    }

    try {
      const payload = {
        label: addressForm.label || null,
        namaPenerima: addressForm.namaPenerima, // ✅ camelCase
        teleponPenerima: addressForm.teleponPenerima, // ✅ camelCase
        alamatBaris1: addressForm.alamatBaris1, // ✅ camelCase
        alamatBaris2: addressForm.alamatBaris2 || null, // ✅ camelCase
        kota: addressForm.kota,
        provinsi: addressForm.provinsi,
        kodePos: addressForm.kodePos, // ✅ camelCase
        isDefault: addressForm.isDefault || false,
      };

      let response;
      if (editingAddressId) {
        response = await api.put(
          `/auth/addresses/${editingAddressId}`,
          payload
        );
        toast.success("Alamat berhasil diperbarui");
      } else {
        response = await api.post("/auth/addresses", payload);
        toast.success("Alamat berhasil ditambahkan");
      }

      await loadAddresses();
      setIsAddingAddress(false);
      setEditingAddressId(null);
    } catch (error) {
      console.error("Gagal menyimpan alamat:", error);
      toast.error("Gagal menyimpan alamat");
    }
  };

  const handleDeleteAddress = async (addressId) => {
    if (!window.confirm("Apakah Anda yakin ingin menghapus alamat ini?")) {
      return;
    }

    try {
      await api.delete(`/auth/addresses/${addressId}`);
      toast.success("Alamat berhasil dihapus");
      await loadAddresses();
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (error) {
      toast.error("Gagal menghapus alamat");
    }
  };

  const handleSetDefault = async (addressId) => {
    try {
      await api.put(`/auth/addresses/${addressId}/set-default`);
      toast.success("Alamat dijadikan default");
      await loadAddresses();
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (error) {
      toast.error("Gagal mengubah default");
    }
  };

  const handleCancelAddress = () => {
    setIsAddingAddress(false);
    setEditingAddressId(null);
    setSelectedArea(null);
    setSearchQuery("");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50 p-3 sm:p-6 lg:p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-4 sm:mb-6 animate-fadeIn">
          <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-[#cb5094] to-[#e570b3] bg-clip-text text-transparent mb-1">
            Profil Saya
          </h1>
          <p className="text-xs sm:text-sm text-gray-600">
            Kelola informasi akun dan data pribadi kamu
          </p>
        </div>

        {/* Success Alert */}
        {saveSuccess && (
          <div className="mb-4 bg-green-50 border-2 border-green-200 rounded-xl p-3 flex items-center gap-3 animate-slideDown">
            <div className="w-7 h-7 bg-green-500 rounded-full flex items-center justify-center">
              <Check className="w-4 h-4 text-white" />
            </div>
            <p className="text-green-800 font-semibold text-sm">
              Perubahan berhasil disimpan!
            </p>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
          {/* Profile Card */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
              <div className="relative bg-gradient-to-r from-[#cb5094] via-[#d55ca0] to-[#e570b3] p-5 sm:p-6">
                <div className="absolute top-0 right-0 w-48 h-48 bg-white/10 rounded-full -mr-24 -mt-24"></div>
                <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/10 rounded-full -ml-16 -mb-16"></div>

                <div className="relative flex flex-col sm:flex-row items-center gap-4">
                  <div className="relative">
                    <div className="w-20 h-20 sm:w-24 sm:h-24 bg-white rounded-full flex items-center justify-center text-[#cb5094] text-3xl sm:text-4xl font-bold shadow-xl ring-4 ring-white/30">
                      {getInitials(userData.nama)}
                    </div>
                    <div className="absolute -bottom-1 -right-1 w-7 h-7 bg-green-400 rounded-full border-3 border-white shadow-lg flex items-center justify-center">
                      <div className="w-2 h-2 bg-green-600 rounded-full animate-pulse"></div>
                    </div>
                  </div>

                  <div className="flex-1 text-center sm:text-left">
                    <h2 className="text-xl sm:text-2xl font-bold text-white mb-1 drop-shadow-lg">
                      {userData.nama}
                    </h2>
                    <p className="text-xs sm:text-sm text-white/90 mb-3 flex items-center justify-center sm:justify-start gap-2">
                      <Mail className="w-3 h-3" />
                      {userData.email}
                    </p>
                    <div className="flex items-center justify-center sm:justify-start gap-2">
                      <span className="px-2 py-1 bg-white/20 backdrop-blur-sm rounded-full text-xs text-white font-semibold">
                        Member Aktif
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={() => setIsEditingProfile(!isEditingProfile)}
                    className="bg-white text-[#cb5094] px-5 py-2 rounded-xl font-bold text-xs sm:text-sm flex items-center gap-2 shadow-lg hover:shadow-xl transition-all"
                  >
                    {isEditingProfile ? (
                      <>
                        <X className="w-4 h-4" />
                        Batal
                      </>
                    ) : (
                      <>
                        <Edit2 className="w-4 h-4" />
                        <span className="hidden sm:inline">Edit Profil</span>
                        <span className="sm:hidden">Edit</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              <div className="p-5 sm:p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="flex items-center gap-2 text-xs font-bold text-gray-700 mb-2">
                      <User className="w-4 h-4 text-[#cb5094]" />
                      Nama Lengkap
                    </label>
                    {isEditingProfile ? (
                      <input
                        type="text"
                        value={profileForm.nama}
                        onChange={(e) =>
                          setProfileForm({
                            ...profileForm,
                            nama: e.target.value,
                          })
                        }
                        className="w-full px-3 py-2 border-2 border-gray-300 rounded-xl focus:border-[#cb5094] focus:ring-4 focus:ring-[#cb5094]/10 focus:outline-none text-sm"
                      />
                    ) : (
                      <div className="px-3 py-2 bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl text-sm text-gray-800 font-medium">
                        {userData.nama}
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="flex items-center gap-2 text-xs font-bold text-gray-700 mb-2">
                      <Mail className="w-4 h-4 text-[#cb5094]" />
                      Email
                    </label>
                    {isEditingProfile ? (
                      <input
                        type="email"
                        value={profileForm.email}
                        onChange={(e) =>
                          setProfileForm({
                            ...profileForm,
                            email: e.target.value,
                          })
                        }
                        className="w-full px-3 py-2 border-2 border-gray-300 rounded-xl focus:border-[#cb5094] focus:ring-4 focus:ring-[#cb5094]/10 focus:outline-none text-sm"
                      />
                    ) : (
                      <div className="px-3 py-2 bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl text-sm text-gray-800 font-medium">
                        {userData.email}
                      </div>
                    )}
                  </div>

                  <div className="md:col-span-2">
                    <label className="flex items-center gap-2 text-xs font-bold text-gray-700 mb-2">
                      <Phone className="w-4 h-4 text-[#cb5094]" />
                      No. Telepon
                    </label>
                    {isEditingProfile ? (
                      <input
                        type="tel"
                        value={profileForm.nomorTelepon}
                        onChange={(e) =>
                          setProfileForm({
                            ...profileForm,
                            nomorTelepon: e.target.value,
                          })
                        }
                        className="w-full px-3 py-2 border-2 border-gray-300 rounded-xl focus:border-[#cb5094] focus:ring-4 focus:ring-[#cb5094]/10 focus:outline-none text-sm"
                      />
                    ) : (
                      <div className="px-3 py-2 bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl text-sm text-gray-800 font-medium">
                        {userData.nomorTelepon}
                      </div>
                    )}
                  </div>
                </div>

                {isEditingProfile && (
                  <div className="flex flex-col sm:flex-row gap-3 mt-6 pt-5 border-t">
                    <button
                      onClick={() => {
                        setUserData(profileForm);
                        localStorage.setItem(
                          "user",
                          JSON.stringify(profileForm)
                        );
                        setIsEditingProfile(false);
                        toast.success("Profil berhasil diperbarui");
                      }}
                      className="flex-1 bg-gradient-to-r from-[#cb5094] to-[#e570b3] text-white py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 hover:shadow-lg transition-all"
                    >
                      <Save className="w-4 h-4" />
                      Simpan Perubahan
                    </button>
                    <button
                      onClick={() => {
                        setProfileForm(userData);
                        setIsEditingProfile(false);
                      }}
                      className="flex-1 bg-gray-100 text-gray-700 py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 hover:bg-gray-200 transition-all"
                    >
                      <X className="w-4 h-4" />
                      Batal
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Address Management */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl shadow-xl p-5 sm:p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-[#cb5094]" />
                  Alamat Tersimpan
                </h3>
                {!isAddingAddress && (
                  <button
                    onClick={handleAddAddress}
                    className="text-[#cb5094] hover:text-[#e570b3] font-semibold text-sm flex items-center gap-1 transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                    Tambah
                  </button>
                )}
              </div>

              <div className="space-y-3 max-h-[500px] overflow-y-auto">
                {addresses.length === 0 && !isAddingAddress && (
                  <div className="text-center py-8">
                    <MapPin className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-sm text-gray-500">
                      Belum ada alamat tersimpan
                    </p>
                    <button
                      onClick={handleAddAddress}
                      className="mt-3 text-[#cb5094] font-semibold text-sm hover:underline"
                    >
                      Tambah Alamat Pertama
                    </button>
                  </div>
                )}

                {addresses.map((addr) => (
                  <div
                    key={addr.id}
                    className="border-2 border-gray-200 rounded-xl p-3 hover:border-[#cb5094] transition-all"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        {addr.label && (
                          <span className="px-2 py-1 bg-purple-100 text-purple-700 text-xs font-bold rounded-lg">
                            {addr.label}
                          </span>
                        )}
                        {addr.isDefault && (
                          <span className="flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 text-xs font-bold rounded-lg">
                            <Star className="w-3 h-3 fill-current" />
                            Default
                          </span>
                        )}
                      </div>
                      <div className="flex gap-1">
                        <button
                          onClick={() => handleEditAddress(addr)}
                          className="p-1 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                        >
                          <Edit2 className="w-3 h-3" />
                        </button>
                        <button
                          onClick={() => handleDeleteAddress(addr.id)}
                          className="p-1 text-red-600 hover:bg-red-50 rounded transition-colors"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                    <p className="text-sm font-bold text-gray-900 mb-1">
                      {addr.namaPenerima}
                    </p>
                    <p className="text-xs text-gray-600 mb-1">
                      {addr.teleponPenerima}
                    </p>
                    <p className="text-xs text-gray-700 leading-relaxed">
                      {addr.alamatBaris1}
                      {addr.alamatBaris2 && `, ${addr.alamatBaris2}`}
                      {`, ${addr.kota}, ${addr.provinsi} ${addr.kodePos}`}
                    </p>
                    {!addr.isDefault && (
                      <button
                        onClick={() => handleSetDefault(addr.id)}
                        className="mt-2 text-xs text-[#cb5094] font-semibold hover:underline"
                      >
                        Jadikan Default
                      </button>
                    )}
                  </div>
                ))}

                {/* Form Tambah/Edit Alamat */}
                {isAddingAddress && (
                  <div className="border-2 border-[#cb5094] rounded-xl p-4 bg-pink-50">
                    <h4 className="font-bold text-gray-900 mb-3 text-sm">
                      {editingAddressId ? "Edit Alamat" : "Tambah Alamat Baru"}
                    </h4>
                    <div className="space-y-3">
                      <div>
                        <label className="text-xs font-semibold text-gray-700 mb-1 block">
                          Label (Opsional)
                        </label>
                        <input
                          type="text"
                          value={addressForm.label}
                          onChange={(e) =>
                            setAddressForm({
                              ...addressForm,
                              label: e.target.value,
                            })
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:border-[#cb5094] focus:ring-2 focus:ring-[#cb5094]/20 focus:outline-none text-xs"
                          placeholder="Rumah, Kantor, dll"
                        />
                      </div>

                      <div>
                        <label className="text-xs font-semibold text-gray-700 mb-1 block">
                          Nama Penerima *
                        </label>
                        <input
                          type="text"
                          value={addressForm.namaPenerima}
                          onChange={(e) =>
                            setAddressForm({
                              ...addressForm,
                              namaPenerima: e.target.value,
                            })
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:border-[#cb5094] focus:ring-2 focus:ring-[#cb5094]/20 focus:outline-none text-xs"
                          required
                        />
                      </div>

                      <div>
                        <label className="text-xs font-semibold text-gray-700 mb-1 block">
                          No. Telepon *
                        </label>
                        <input
                          type="tel"
                          value={addressForm.teleponPenerima}
                          onChange={(e) =>
                            setAddressForm({
                              ...addressForm,
                              teleponPenerima: e.target.value,
                            })
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:border-[#cb5094] focus:ring-2 focus:ring-[#cb5094]/20 focus:outline-none text-xs"
                          required
                        />
                      </div>

                      <div>
                        <label className="text-xs font-semibold text-gray-700 mb-1 block">
                          Alamat Lengkap *
                        </label>
                        <textarea
                          value={addressForm.alamatBaris1}
                          onChange={(e) =>
                            setAddressForm({
                              ...addressForm,
                              alamatBaris1: e.target.value,
                            })
                          }
                          rows="2"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:border-[#cb5094] focus:ring-2 focus:ring-[#cb5094]/20 focus:outline-none text-xs resize-none"
                          required
                        />
                      </div>

                      <div>
                        <label className="text-xs font-semibold text-gray-700 mb-1 block">
                          Detail Tambahan (Opsional)
                        </label>
                        <input
                          type="text"
                          value={addressForm.alamatBaris2}
                          onChange={(e) =>
                            setAddressForm({
                              ...addressForm,
                              alamatBaris2: e.target.value,
                            })
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:border-[#cb5094] focus:ring-2 focus:ring-[#cb5094]/20 focus:outline-none text-xs"
                        />
                      </div>

                      <div className="relative">
                        <label className="text-xs font-semibold text-gray-700 mb-1 block">
                          Kecamatan / Kota / Provinsi *
                        </label>
                        <div className="relative">
                          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                          <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:border-[#cb5094] focus:ring-2 focus:ring-[#cb5094]/20 focus:outline-none text-xs"
                            placeholder="Ketik minimal 3 karakter..."
                            required
                          />
                          {searchLoading && (
                            <div className="absolute right-3 top-1/2 -translate-y-1/2">
                              <div className="w-4 h-4 border-2 border-[#cb5094] border-t-transparent rounded-full animate-spin"></div>
                            </div>
                          )}
                        </div>

                        {searchResults.length > 0 && (
                          <div className="absolute z-20 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                            {searchResults.map((area, index) => (
                              <button
                                key={`${area.id}-${index}`}
                                type="button"
                                onClick={() => handleAreaSelect(area)}
                                className="w-full text-left px-4 py-3 hover:bg-pink-50 transition-colors border-b border-gray-100 last:border-0"
                              >
                                <div className="font-semibold text-gray-900 text-sm">
                                  {area.cleanName}
                                </div>
                                <div className="text-xs text-gray-600">
                                  {area.administrative_division_level_2_name &&
                                    `${area.administrative_division_level_2_name}, `}
                                  {area.administrative_division_level_1_name}
                                </div>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>

                      <div className="relative">
                        <label className="text-xs font-semibold text-gray-700 mb-1 block">
                          Kode Pos *
                        </label>
                        {selectedArea ? (
                          selectedArea.postal_codes &&
                          selectedArea.postal_codes.length > 0 ? (
                            <div>
                              <div
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white cursor-pointer flex items-center justify-between hover:border-[#cb5094] transition-colors text-sm"
                                onClick={() =>
                                  setShowPostalDropdown(!showPostalDropdown)
                                }
                              >
                                <span
                                  className={
                                    addressForm.kodePos
                                      ? "text-gray-900"
                                      : "text-gray-500"
                                  }
                                >
                                  {addressForm.kodePos || "Pilih Kode Pos"}
                                </span>
                                <ChevronDown
                                  className={`w-4 h-4 text-gray-500 transition-transform ${
                                    showPostalDropdown ? "rotate-180" : ""
                                  }`}
                                />
                              </div>
                              {showPostalDropdown && (
                                <div className="absolute z-20 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                                  {selectedArea.postal_codes.map(
                                    (postalCode, idx) => {
                                      const formatted = String(
                                        postalCode
                                      ).padStart(5, "0");
                                      return (
                                        <button
                                          key={idx}
                                          type="button"
                                          onClick={() =>
                                            handlePostalSelect(postalCode)
                                          }
                                          className="w-full text-left px-4 py-3 hover:bg-pink-50 transition-colors border-b border-gray-100 last:border-0 font-medium text-gray-900"
                                        >
                                          {formatted}
                                        </button>
                                      );
                                    }
                                  )}
                                </div>
                              )}
                            </div>
                          ) : (
                            <input
                              type="text"
                              value={addressForm.kodePos}
                              onChange={(e) => {
                                const val = e.target.value
                                  .replace(/\D/g, "")
                                  .slice(0, 5);
                                setAddressForm({
                                  ...addressForm,
                                  kodePos: val,
                                });
                              }}
                              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:border-[#cb5094] focus:ring-2 focus:ring-[#cb5094]/20 focus:outline-none text-sm"
                              placeholder="Input manual 5 digit"
                              maxLength={5}
                              required
                            />
                          )
                        ) : (
                          <input
                            type="text"
                            value=""
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-400 text-sm"
                            placeholder="Pilih kota dulu"
                            disabled
                          />
                        )}
                      </div>

                      <div className="flex items-center gap-2 pt-2">
                        <input
                          type="checkbox"
                          id="isDefault"
                          checked={addressForm.isDefault}
                          onChange={(e) =>
                            setAddressForm({
                              ...addressForm,
                              isDefault: e.target.checked,
                            })
                          }
                          className="w-4 h-4 text-[#cb5094] border-gray-300 rounded focus:ring-[#cb5094]"
                        />
                        <label
                          htmlFor="isDefault"
                          className="text-xs text-gray-700 font-semibold"
                        >
                          Jadikan alamat default
                        </label>
                      </div>

                      <div className="flex gap-2 pt-2">
                        <button
                          onClick={handleSaveAddress}
                          className="flex-1 bg-gradient-to-r from-[#cb5094] to-[#e570b3] text-white py-2 rounded-lg font-bold text-xs flex items-center justify-center gap-2 hover:shadow-lg transition-all"
                        >
                          <Save className="w-3 h-3" />
                          Simpan
                        </button>
                        <button
                          onClick={handleCancelAddress}
                          className="flex-1 bg-gray-200 text-gray-700 py-2 rounded-lg font-bold text-xs flex items-center justify-center gap-2 hover:bg-gray-300 transition-all"
                        >
                          <X className="w-3 h-3" />
                          Batal
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="mt-4 bg-white/80 backdrop-blur-sm rounded-xl p-4 shadow-lg">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
              <svg
                className="w-4 h-4 text-blue-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-gray-900 mb-1 text-sm">
                Informasi Penting
              </h3>
              <p className="text-xs text-gray-600">
                Pastikan data profil dan alamat yang kamu masukkan akurat dan
                up-to-date. Data ini akan digunakan untuk keperluan pengiriman
                dan komunikasi.
              </p>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes slideDown {
          from { opacity: 0; transform: translateY(-20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeIn {
          animation: fadeIn 0.5s ease-out;
        }
        .animate-slideDown {
          animation: slideDown 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}

export default CustomerProfile;
