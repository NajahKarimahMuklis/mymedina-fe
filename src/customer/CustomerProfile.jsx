import { useState, useEffect } from 'react';
import { Edit2, Save, X, User, Mail, Phone, MapPin, Check, Plus, Trash2, Star } from 'lucide-react';

function CustomerProfile() {
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [userData, setUserData] = useState({
    id: '',
    nama: '',
    email: '',
    nomorTelepon: ''
  });
  const [profileForm, setProfileForm] = useState({
    id: '',
    nama: '',
    email: '',
    nomorTelepon: ''
  });
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Address management state
  const [addresses, setAddresses] = useState([]);
  const [isAddingAddress, setIsAddingAddress] = useState(false);
  const [editingAddressId, setEditingAddressId] = useState(null);
  const [addressForm, setAddressForm] = useState({
    label: '',
    namaPenerima: '',
    teleponPenerima: '',
    emailPenerima: '',
    alamatBaris1: '',
    alamatBaris2: '',
    kota: '',
    provinsi: '',
    kodePos: '',
    isDefault: false
  });

  // Load user data from memory
  useEffect(() => {
    // Coba load dari sessionStorage dulu
    let storedUser = JSON.parse(sessionStorage.getItem('user') || '{}');
    
    // Jika tidak ada, coba dari localStorage (untuk backward compatibility)
    if (!storedUser.id) {
      storedUser = JSON.parse(localStorage.getItem('user') || '{}');
    }
    
    if (storedUser.id) {
      const updatedUser = {
        id: storedUser.id || '',
        nama: storedUser.nama || storedUser.name || 'User',
        email: storedUser.email || 'user@example.com',
        nomorTelepon: storedUser.nomorTelepon || storedUser.phone || storedUser.telepon || '08123456789'
      };
      setUserData(updatedUser);
      setProfileForm(updatedUser);
      
      // Simpan ke sessionStorage untuk konsistensi
      sessionStorage.setItem('user', JSON.stringify(updatedUser));
    } else {
      // Set default values jika tidak ada data
      const defaultUser = {
        id: 'demo-user-' + Date.now(),
        nama: 'User Demo',
        email: 'demo@example.com',
        nomorTelepon: '08123456789'
      };
      setUserData(defaultUser);
      setProfileForm(defaultUser);
      sessionStorage.setItem('user', JSON.stringify(defaultUser));
    }
    
    loadAddresses();
  }, []);

  // Load addresses from memory
  const loadAddresses = () => {
    // Coba dari sessionStorage dulu
    let storedAddresses = JSON.parse(sessionStorage.getItem('addresses') || '[]');
    
    // Jika kosong, coba dari localStorage
    if (storedAddresses.length === 0) {
      storedAddresses = JSON.parse(localStorage.getItem('addresses') || '[]');
      if (storedAddresses.length > 0) {
        // Migrate ke sessionStorage
        sessionStorage.setItem('addresses', JSON.stringify(storedAddresses));
      }
    }
    
    setAddresses(storedAddresses);
  };

  // Save addresses to memory
  const saveAddresses = (newAddresses) => {
    sessionStorage.setItem('addresses', JSON.stringify(newAddresses));
    setAddresses(newAddresses);
  };

  const handleSaveProfile = () => {
    setUserData(profileForm);
    
    // Simpan ke sessionStorage
    sessionStorage.setItem('user', JSON.stringify(profileForm));
    
    // Simpan juga ke localStorage untuk backward compatibility
    const stored = JSON.parse(localStorage.getItem('user') || '{}');
    const updated = { ...stored, ...profileForm };
    localStorage.setItem('user', JSON.stringify(updated));
    
    setIsEditingProfile(false);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  const handleCancelEdit = () => {
    setIsEditingProfile(false);
    setProfileForm(userData);
  };

  const getInitials = (name) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  // Address handlers
  const handleAddAddress = () => {
    setIsAddingAddress(true);
    setEditingAddressId(null);
    setAddressForm({
      label: '',
      namaPenerima: userData.nama,
      teleponPenerima: userData.nomorTelepon,
      emailPenerima: userData.email,
      alamatBaris1: '',
      alamatBaris2: '',
      kota: '',
      provinsi: '',
      kodePos: '',
      isDefault: addresses.length === 0
    });
  };

  const handleEditAddress = (address) => {
    setEditingAddressId(address.id);
    setIsAddingAddress(true);
    setAddressForm(address);
  };

  const handleSaveAddress = () => {
    if (!addressForm.namaPenerima || !addressForm.teleponPenerima || !addressForm.alamatBaris1 || 
        !addressForm.kota || !addressForm.provinsi || !addressForm.kodePos) {
      alert('Mohon lengkapi semua field yang wajib diisi');
      return;
    }

    let newAddresses = [...addresses];

    if (editingAddressId) {
      // Update existing address
      newAddresses = newAddresses.map(addr => 
        addr.id === editingAddressId ? { ...addressForm, id: editingAddressId, diupdatePada: new Date().toISOString() } : addr
      );
    } else {
      // Add new address
      const newAddress = {
        ...addressForm,
        id: Date.now().toString(),
        aktif: true,
        dibuatPada: new Date().toISOString(),
        diupdatePada: new Date().toISOString()
      };
      newAddresses.push(newAddress);
    }

    // If setting as default, unset other defaults
    if (addressForm.isDefault) {
      newAddresses = newAddresses.map(addr => ({
        ...addr,
        isDefault: addr.id === (editingAddressId || newAddresses[newAddresses.length - 1].id)
      }));
    }

    saveAddresses(newAddresses);
    setIsAddingAddress(false);
    setEditingAddressId(null);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  const handleDeleteAddress = (addressId) => {
    if (confirm('Apakah Anda yakin ingin menghapus alamat ini?')) {
      const newAddresses = addresses.filter(addr => addr.id !== addressId);
      
      // If deleted address was default and there are other addresses, set first one as default
      const deletedAddr = addresses.find(addr => addr.id === addressId);
      if (deletedAddr?.isDefault && newAddresses.length > 0) {
        newAddresses[0].isDefault = true;
      }
      
      saveAddresses(newAddresses);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    }
  };

  const handleSetDefault = (addressId) => {
    const newAddresses = addresses.map(addr => ({
      ...addr,
      isDefault: addr.id === addressId
    }));
    saveAddresses(newAddresses);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  const handleCancelAddress = () => {
    setIsAddingAddress(false);
    setEditingAddressId(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50 p-3 sm:p-6 lg:p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-4 sm:mb-6 animate-fadeIn">
          <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-[#cb5094] to-[#e570b3] bg-clip-text text-transparent mb-1">
            Profil Saya
          </h1>
          <p className="text-xs sm:text-sm text-gray-600">Kelola informasi akun dan data pribadi kamu</p>
        </div>

        {/* Success Alert */}
        {saveSuccess && (
          <div className="mb-4 bg-green-50 border-2 border-green-200 rounded-xl p-3 flex items-center gap-3 animate-slideDown">
            <div className="w-7 h-7 bg-green-500 rounded-full flex items-center justify-center">
              <Check className="w-4 h-4 text-white" />
            </div>
            <p className="text-green-800 font-semibold text-sm">Perubahan berhasil disimpan!</p>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
          {/* Profile Card */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
              {/* Header Section with Gradient */}
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
                    onClick={() => isEditingProfile ? handleSaveProfile() : setIsEditingProfile(true)}
                    className="bg-white text-[#cb5094] px-5 py-2 rounded-xl font-bold text-xs sm:text-sm flex items-center gap-2 shadow-lg hover:shadow-xl transition-all"
                  >
                    {isEditingProfile ? (
                      <>
                        <Save className="w-4 h-4" />
                        <span className="hidden sm:inline">Simpan Profil</span>
                        <span className="sm:hidden">Simpan</span>
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

              {/* Form Section */}
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
                        onChange={(e) => setProfileForm({ ...profileForm, nama: e.target.value })}
                        className="w-full px-3 py-2 border-2 border-gray-300 rounded-xl focus:border-[#cb5094] focus:ring-4 focus:ring-[#cb5094]/10 focus:outline-none text-sm"
                        placeholder="Masukkan nama lengkap"
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
                        onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
                        className="w-full px-3 py-2 border-2 border-gray-300 rounded-xl focus:border-[#cb5094] focus:ring-4 focus:ring-[#cb5094]/10 focus:outline-none text-sm"
                        placeholder="email@example.com"
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
                        onChange={(e) => setProfileForm({ ...profileForm, nomorTelepon: e.target.value })}
                        className="w-full px-3 py-2 border-2 border-gray-300 rounded-xl focus:border-[#cb5094] focus:ring-4 focus:ring-[#cb5094]/10 focus:outline-none text-sm"
                        placeholder="08123456789"
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
                      onClick={handleSaveProfile}
                      className="flex-1 bg-gradient-to-r from-[#cb5094] to-[#e570b3] text-white py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 hover:shadow-lg transition-all"
                    >
                      <Save className="w-4 h-4" />
                      Simpan Perubahan
                    </button>
                    <button
                      onClick={handleCancelEdit}
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
                {addresses.map((addr) => (
                  <div key={addr.id} className="border-2 border-gray-200 rounded-xl p-3 hover:border-[#cb5094] transition-all">
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
                    <p className="text-sm font-bold text-gray-900 mb-1">{addr.namaPenerima}</p>
                    <p className="text-xs text-gray-600 mb-1">{addr.teleponPenerima}</p>
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

                {addresses.length === 0 && !isAddingAddress && (
                  <div className="text-center py-8">
                    <MapPin className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-sm text-gray-500">Belum ada alamat tersimpan</p>
                    <button
                      onClick={handleAddAddress}
                      className="mt-3 text-[#cb5094] font-semibold text-sm hover:underline"
                    >
                      Tambah Alamat Pertama
                    </button>
                  </div>
                )}

                {/* Add/Edit Address Form */}
                {isAddingAddress && (
                  <div className="border-2 border-[#cb5094] rounded-xl p-4 bg-pink-50">
                    <h4 className="font-bold text-gray-900 mb-3 text-sm">
                      {editingAddressId ? 'Edit Alamat' : 'Tambah Alamat Baru'}
                    </h4>
                    <div className="space-y-3">
                      <div>
                        <label className="text-xs font-semibold text-gray-700 mb-1 block">
                          Label (Opsional)
                        </label>
                        <input
                          type="text"
                          value={addressForm.label}
                          onChange={(e) => setAddressForm({ ...addressForm, label: e.target.value })}
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
                          onChange={(e) => setAddressForm({ ...addressForm, namaPenerima: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:border-[#cb5094] focus:ring-2 focus:ring-[#cb5094]/20 focus:outline-none text-xs"
                          placeholder="Nama lengkap"
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
                          onChange={(e) => setAddressForm({ ...addressForm, teleponPenerima: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:border-[#cb5094] focus:ring-2 focus:ring-[#cb5094]/20 focus:outline-none text-xs"
                          placeholder="08123456789"
                          required
                        />
                      </div>

                      <div>
                        <label className="text-xs font-semibold text-gray-700 mb-1 block">
                          Email (Opsional)
                        </label>
                        <input
                          type="email"
                          value={addressForm.emailPenerima}
                          onChange={(e) => setAddressForm({ ...addressForm, emailPenerima: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:border-[#cb5094] focus:ring-2 focus:ring-[#cb5094]/20 focus:outline-none text-xs"
                          placeholder="email@example.com"
                        />
                      </div>

                      <div>
                        <label className="text-xs font-semibold text-gray-700 mb-1 block">
                          Alamat Lengkap *
                        </label>
                        <textarea
                          value={addressForm.alamatBaris1}
                          onChange={(e) => setAddressForm({ ...addressForm, alamatBaris1: e.target.value })}
                          rows="2"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:border-[#cb5094] focus:ring-2 focus:ring-[#cb5094]/20 focus:outline-none text-xs resize-none"
                          placeholder="Jl. Contoh No. 123, RT/RW"
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
                          onChange={(e) => setAddressForm({ ...addressForm, alamatBaris2: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:border-[#cb5094] focus:ring-2 focus:ring-[#cb5094]/20 focus:outline-none text-xs"
                          placeholder="Blok, Unit, Patokan"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="text-xs font-semibold text-gray-700 mb-1 block">
                            Kota *
                          </label>
                          <input
                            type="text"
                            value={addressForm.kota}
                            onChange={(e) => setAddressForm({ ...addressForm, kota: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:border-[#cb5094] focus:ring-2 focus:ring-[#cb5094]/20 focus:outline-none text-xs"
                            placeholder="Kota"
                            required
                          />
                        </div>
                        <div>
                          <label className="text-xs font-semibold text-gray-700 mb-1 block">
                            Kode Pos *
                          </label>
                          <input
                            type="text"
                            value={addressForm.kodePos}
                            onChange={(e) => setAddressForm({ ...addressForm, kodePos: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:border-[#cb5094] focus:ring-2 focus:ring-[#cb5094]/20 focus:outline-none text-xs"
                            placeholder="12345"
                            required
                          />
                        </div>
                      </div>

                      <div>
                        <label className="text-xs font-semibold text-gray-700 mb-1 block">
                          Provinsi *
                        </label>
                        <input
                          type="text"
                          value={addressForm.provinsi}
                          onChange={(e) => setAddressForm({ ...addressForm, provinsi: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:border-[#cb5094] focus:ring-2 focus:ring-[#cb5094]/20 focus:outline-none text-xs"
                          placeholder="Provinsi"
                          required
                        />
                      </div>

                      <div className="flex items-center gap-2 pt-2">
                        <input
                          type="checkbox"
                          id="isDefault"
                          checked={addressForm.isDefault}
                          onChange={(e) => setAddressForm({ ...addressForm, isDefault: e.target.checked })}
                          className="w-4 h-4 text-[#cb5094] border-gray-300 rounded focus:ring-[#cb5094]"
                        />
                        <label htmlFor="isDefault" className="text-xs text-gray-700 font-semibold">
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

        {/* Info Card */}
        <div className="mt-4 bg-white/80 backdrop-blur-sm rounded-xl p-4 shadow-lg">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
              <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-gray-900 mb-1 text-sm">Informasi Penting</h3>
              <p className="text-xs text-gray-600">
                Pastikan data profil dan alamat yang kamu masukkan akurat dan up-to-date. Data ini akan digunakan untuk keperluan pengiriman dan komunikasi.
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