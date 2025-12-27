import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Plus, 
  Edit2, 
  Trash2, 
  ArrowLeft, 
  Package, 
  X, 
  Check, 
  ChevronRight, 
  AlertCircle 
} from 'lucide-react';
import { productAPI, variantAPI } from '../utils/api';
import { formatPrice } from '../utils/formatPrice';

function ProductVariantManagement() {
  // ===================================================================
  // STATE UTAMA
  // ===================================================================
  const { productId } = useParams();
  const navigate = useNavigate();

  const [product, setProduct] = useState(null);
  const [variants, setVariants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingVariant, setEditingVariant] = useState(null);

  // Bulk create step
  const [variantStep, setVariantStep] = useState('colors');
  const [colors, setColors] = useState([]);
  const [sizes, setSizes] = useState([]);
  const [variantsToCreate, setVariantsToCreate] = useState([]);
  const [newColor, setNewColor] = useState('');
  const [newSize, setNewSize] = useState('');

  // Image picker untuk single & bulk
  const [selectedGambar, setSelectedGambar] = useState('');
  const [showImagePicker, setShowImagePicker] = useState(false);
  const [currentColorForPicker, setCurrentColorForPicker] = useState('');

  // NEW: State untuk konfirmasi sync foto
  const [showSyncConfirmation, setShowSyncConfirmation] = useState(false);
  const [pendingImageUpdate, setPendingImageUpdate] = useState(null);

  // Form data untuk single edit
  const [formData, setFormData] = useState({
    sku: '',
    ukuran: '',
    warna: '',
    stok: '',
    hargaOverride: '',
    aktif: true,
    gambar: ''
  });

  // ===================================================================
  // FETCH DATA
  // ===================================================================
  const fetchProduct = async () => {
    try {
      const response = await productAPI.getById(productId);
      const productData = response.data?.data || response.data || response;

      if (productData && productData.slug) {
        setProduct(productData);
      } else {
        alert('Data produk tidak lengkap');
        navigate('/admin/products');
      }
    } catch (error) {
      console.error('Error fetching product:', error);
      alert('Gagal memuat produk');
      navigate('/admin/products');
    }
  };

  const fetchVariants = async () => {
    try {
      setLoading(true);
      const response = await variantAPI.getByProductId(productId, true);

      let variantsData = [];
      if (Array.isArray(response.data)) {
        variantsData = response.data;
      } else if (response.data && Array.isArray(response.data.data)) {
        variantsData = response.data.data;
      } else if (Array.isArray(response)) {
        variantsData = response;
      }

      setVariants(variantsData);
    } catch (error) {
      console.error('Error fetching variants:', error);
      setVariants([]);
      if (error.response?.status !== 404) {
        alert('Gagal memuat varian');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (productId) {
      fetchProduct();
      fetchVariants();
    }
  }, [productId]);

  // ===================================================================
  // SKU GENERATOR
  // ===================================================================
  const generateSKU = (size, color) => {
    if (!product || !product.slug || !size || !color) return '';

    const baseSlug = product.slug.toUpperCase().replace(/-/g, '');
    const sizeCode = size.toUpperCase().replace(/\s+/g, '');
    const colorCode = color.toUpperCase().replace(/\s+/g, '');
    const timestamp = Date.now().toString().slice(-6);
    const random = Math.random().toString(36).substring(2, 5).toUpperCase();

    return `${baseSlug}-${sizeCode}-${colorCode}-${timestamp}-${random}`;
  };

  // ===================================================================
  // BULK CREATE - WARNA
  // ===================================================================
  const handleAddColor = () => {
    if (newColor.trim() && !colors.includes(newColor.trim())) {
      setColors(prev => [...prev, newColor.trim()]);
      setNewColor('');
    }
  };

  const handleRemoveColor = (colorToRemove) => {
    setColors(prev => prev.filter(c => c !== colorToRemove));
    setVariantsToCreate(prev => prev.filter(v => v.warna !== colorToRemove));
  };

  const handleNextToSizes = () => {
    if (colors.length === 0) {
      alert('Tambahkan minimal 1 warna terlebih dahulu');
      return;
    }
    setVariantStep('sizes');
  };

  // ===================================================================
  // BULK CREATE - UKURAN
  // ===================================================================
  const handleAddSize = () => {
    if (newSize.trim() && !sizes.includes(newSize.trim())) {
      setSizes(prev => [...prev, newSize.trim()]);
      setNewSize('');
    }
  };

  const handleRemoveSize = (sizeToRemove) => {
    setSizes(prev => prev.filter(s => s !== sizeToRemove));
    setVariantsToCreate(prev => prev.filter(v => v.ukuran !== sizeToRemove));
  };

  const handleNextToStocks = () => {
    if (sizes.length === 0) {
      alert('Tambahkan minimal 1 ukuran terlebih dahulu');
      return;
    }

    const existingColorImages = {};
    variantsToCreate.forEach(v => {
      if (v.gambar && !existingColorImages[v.warna]) {
        existingColorImages[v.warna] = v.gambar;
      }
    });

    const newVariants = [];
    for (const color of colors) {
      const colorImage = existingColorImages[color] || null;
      for (const size of sizes) {
        newVariants.push({
          id: `${color}-${size}`,
          warna: color,
          ukuran: size,
          stok: 10,
          gambar: colorImage
        });
      }
    }

    setVariantsToCreate(newVariants);
    setVariantStep('stocks');
  };

  // ===================================================================
  // BULK CREATE - STOK & GAMBAR
  // ===================================================================
  const handleStockChange = (id, newStock) => {
    setVariantsToCreate(prev => prev.map(v =>
      v.id === id ? { ...v, stok: parseInt(newStock) || 0 } : v
    ));
  };

  const handleCreateMultipleVariants = async () => {
    if (variantsToCreate.length === 0) {
      alert('Tidak ada varian untuk dibuat');
      return;
    }

    if (!confirm(`Yakin ingin membuat ${variantsToCreate.length} varian?`)) {
      return;
    }

    try {
      let successCount = 0;
      let failCount = 0;

      for (const variant of variantsToCreate) {
        try {
          const sku = generateSKU(variant.ukuran, variant.warna);
          const payload = {
            sku,
            ukuran: variant.ukuran,
            warna: variant.warna,
            stok: variant.stok,
            hargaOverride: null,
            aktif: true,
            gambar: variant.gambar || null
          };

          await variantAPI.create(productId, payload);
          successCount++;
        } catch (error) {
          console.error(`Gagal buat varian ${variant.ukuran}-${variant.warna}:`, error);
          failCount++;
        }
      }

      alert(`Berhasil: ${successCount} varian${failCount > 0 ? `\nGagal: ${failCount}` : ''}`);
      handleCancelForm();
      fetchVariants();
    } catch (error) {
      alert('Terjadi kesalahan saat membuat varian');
    }
  };

  // ===================================================================
  // SYNC FOTO BY COLOR
  // ===================================================================
  const handleSyncPhotoByColor = async (colorToSync, newImage) => {
    try {
      const variantsWithSameColor = variants.filter(
        v => v.warna.toLowerCase() === colorToSync.toLowerCase() && v.id !== editingVariant?.id
      );

      if (variantsWithSameColor.length === 0) {
        return;
      }

      let successCount = 0;
      let failCount = 0;

      for (const variant of variantsWithSameColor) {
        try {
          const payload = {
            sku: variant.sku,
            ukuran: variant.ukuran,
            warna: variant.warna,
            stok: variant.stok,
            hargaOverride: variant.hargaOverride,
            aktif: variant.aktif,
            gambar: newImage
          };

          await variantAPI.update(variant.id, payload);
          successCount++;
        } catch (error) {
          console.error(`Gagal sync foto untuk varian ${variant.sku}:`, error);
          failCount++;
        }
      }

      if (successCount > 0) {
        alert(`✅ Foto berhasil disinkronkan ke ${successCount} varian lain dengan warna "${colorToSync}"${failCount > 0 ? `\n⚠️ ${failCount} varian gagal` : ''}`);
        fetchVariants();
      }
    } catch (error) {
      console.error('Error syncing photos:', error);
      alert('Terjadi kesalahan saat sinkronisasi foto');
    }
  };

  // ===================================================================
  // SINGLE CREATE / EDIT
  // ===================================================================
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.sku || !formData.ukuran || !formData.warna || !formData.stok) {
      alert('SKU, ukuran, warna, dan stok harus diisi');
      return;
    }

    const newImage = selectedGambar || formData.gambar || null;
    const isImageChanged = editingVariant && editingVariant.gambar !== newImage;

    if (editingVariant && isImageChanged) {
      const variantsWithSameColor = variants.filter(
        v => v.warna.toLowerCase() === formData.warna.toLowerCase() && v.id !== editingVariant.id
      );

      if (variantsWithSameColor.length > 0) {
        setPendingImageUpdate({
          formData,
          newImage,
          colorToSync: formData.warna,
          affectedCount: variantsWithSameColor.length
        });
        setShowSyncConfirmation(true);
        return;
      }
    }

    await saveVariant(newImage, false);
  };

  const saveVariant = async (newImage, shouldSync) => {
    // PERBAIKAN HARGA OVERRIDE: Hanya kirim kalau ada nilai valid
    let hargaOverrideValue = null;
    if (formData.hargaOverride && formData.hargaOverride.trim() !== '') {
      const parsed = parseFloat(formData.hargaOverride);
      if (isNaN(parsed) || parsed < 0) {
        alert('Harga override harus angka positif');
        return;
      }
      hargaOverrideValue = parsed;
    }

    const payload = {
      sku: formData.sku,
      ukuran: formData.ukuran,
      warna: formData.warna,
      stok: parseInt(formData.stok),
      aktif: formData.aktif,
      gambar: newImage
    };

    if (hargaOverrideValue !== null) {
      payload.hargaOverride = hargaOverrideValue;
    }

    try {
      if (editingVariant) {
        await variantAPI.update(editingVariant.id, payload);
        alert('Varian berhasil diupdate!');

        if (shouldSync) {
          await handleSyncPhotoByColor(formData.warna, newImage);
        }
      } else {
        await variantAPI.create(productId, payload);
        alert('Varian berhasil dibuat!');
      }

      handleCancelForm();
      fetchVariants();
    } catch (error) {
      console.error('Error saving variant:', error);
      alert('Gagal menyimpan varian');
    }
  };

  const handleConfirmSync = async (shouldSync) => {
    setShowSyncConfirmation(false);
    
    if (pendingImageUpdate) {
      await saveVariant(pendingImageUpdate.newImage, shouldSync);
      setPendingImageUpdate(null);
    }
  };

  const handleEdit = (variant) => {
    setEditingVariant(variant);
    setFormData({
      sku: variant.sku,
      ukuran: variant.ukuran,
      warna: variant.warna,
      stok: variant.stok.toString(),
      hargaOverride: variant.hargaOverride !== null ? variant.hargaOverride.toString() : '',
      aktif: variant.aktif,
      gambar: variant.gambar || ''
    });
    setSelectedGambar(variant.gambar || '');
    setShowForm(true);
  };

  const handleDelete = async (id, sku) => {
    if (!confirm(`Yakin ingin menghapus varian "${sku}"?`)) return;

    try {
      await variantAPI.delete(id);
      alert('Varian berhasil dihapus!');
      fetchVariants();
    } catch (error) {
      alert('Gagal menghapus varian');
    }
  };

  const handleCancelForm = () => {
    setShowForm(false);
    setEditingVariant(null);
    setFormData({
      sku: '',
      ukuran: '',
      warna: '',
      stok: '',
      hargaOverride: '',
      aktif: true,
      gambar: ''
    });
    setSelectedGambar('');
    setColors([]);
    setSizes([]);
    setVariantsToCreate([]);
    setVariantStep('colors');
    setCurrentColorForPicker('');
    setPendingImageUpdate(null);
  };

  // ===================================================================
  // UTILS
  // ===================================================================
  const safeVariants = Array.isArray(variants) ? variants : [];
  const uniqueSizes = [...new Set(safeVariants.map(v => v.ukuran))];
  const uniqueColors = [...new Set(safeVariants.map(v => v.warna))];
  const totalStock = safeVariants.reduce((sum, v) => sum + (v.aktif ? v.stok : 0), 0);

  if (!product) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-pink-50 to-white">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-pink-200 border-t-[#cb5094] rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Memuat produk...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-pink-50 pb-20 lg:pb-0">
      <div className="max-w-7xl mx-auto p-4 md:p-6 lg:p-8 space-y-6">
        {/* Header */}
        <div className="bg-white rounded-3xl shadow-sm border border-pink-100 p-5">
          <div className="flex flex-col md:flex-row items-start md:items-center gap-4">
            <button
              onClick={() => navigate('/admin/products')}
              className="p-3 hover:bg-pink-50 rounded-xl text-gray-600 hover:text-[#cb5094] transition-all"
            >
              <ArrowLeft className="w-6 h-6" />
            </button>
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-gray-900">Kelola Varian Produk</h1>
              <p className="text-gray-500 text-sm mt-1">{product.nama}</p>
            </div>
            <button
              onClick={() => setShowForm(true)}
              className="bg-[#cb5094] text-white px-6 py-3 rounded-xl font-semibold hover:bg-[#b54684] transition-all flex items-center gap-2 shadow-sm w-full md:w-auto justify-center"
            >
              <Plus className="w-5 h-5" />
              Tambah Varian
            </button>
          </div>
        </div>

        {/* Info Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-pink-50 rounded-xl p-4 text-center">
            <p className="text-xs text-gray-600 mb-1">Kategori</p>
            <p className="font-semibold text-gray-800">{product.category?.nama || '-'}</p>
          </div>
          <div className="bg-pink-50 rounded-xl p-4 text-center">
            <p className="text-xs text-gray-600 mb-1">Harga Dasar</p>
            <p className="font-semibold text-[#cb5094]">{formatPrice(product.hargaDasar)}</p>
          </div>
          <div className="bg-pink-50 rounded-xl p-4 text-center">
            <p className="text-xs text-gray-600 mb-1">Total Varian</p>
            <p className="font-semibold text-gray-800">{safeVariants.length}</p>
          </div>
          <div className="bg-pink-50 rounded-xl p-4 text-center">
            <p className="text-xs text-gray-600 mb-1">Total Stok</p>
            <p className="font-semibold text-gray-800">{totalStock} pcs</p>
          </div>
        </div>

        {/* Size & Color Count */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white rounded-2xl shadow-sm border border-pink-100 p-5 text-center">
            <div className="text-3xl font-bold text-[#cb5094] mb-1">{uniqueSizes.length}</div>
            <div className="text-sm text-gray-600">Ukuran</div>
          </div>
          <div className="bg-white rounded-2xl shadow-sm border border-pink-100 p-5 text-center">
            <div className="text-3xl font-bold text-[#cb5094] mb-1">{uniqueColors.length}</div>
            <div className="text-sm text-gray-600">Warna</div>
          </div>
        </div>

        {/* Variant List */}
        <div className="space-y-4 lg:space-y-0">
          {loading ? (
            <div className="text-center py-20">
              <div className="w-16 h-16 border-4 border-pink-200 border-t-[#cb5094] rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-gray-600">Memuat varian...</p>
            </div>
          ) : safeVariants.length === 0 ? (
            <div className="bg-white rounded-3xl p-8 text-center border border-pink-100">
              <div className="w-20 h-20 bg-pink-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <Package className="w-10 h-10 text-[#cb5094]" />
              </div>
              <h3 className="text-xl font-bold text-gray-800 mb-2">Belum Ada Varian</h3>
              <p className="text-gray-600 mb-4">Tambahkan varian untuk produk ini</p>
              <button
                onClick={() => setShowForm(true)}
                className="bg-[#cb5094] text-white px-6 py-3 rounded-xl font-semibold hover:bg-[#b54684]"
              >
                Tambah Varian
              </button>
            </div>
          ) : (
            <>
              {/* Mobile Card View */}
              <div className="lg:hidden space-y-4">
                {safeVariants.map((variant) => (
                  <div key={variant.id} className="bg-white rounded-2xl shadow-sm border border-pink-100 p-4">
                    <div className="flex gap-4">
                      <div className="w-20 h-20 rounded-xl overflow-hidden bg-gray-100 border border-gray-200 flex-shrink-0">
                        {variant.gambar ? (
                          <img src={variant.gambar} alt={variant.warna} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Package className="w-8 h-8 text-gray-400" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <code className="text-xs font-mono bg-gray-50 px-2 py-1 rounded block mb-2 truncate">{variant.sku}</code>
                        <div className="flex flex-wrap gap-2 mb-2">
                          <span className="bg-purple-100 text-purple-700 px-3 py-1 rounded-full text-xs font-semibold">{variant.warna}</span>
                          <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-xs font-semibold">{variant.ukuran}</span>
                        </div>
                        <p className="font-bold text-[#cb5094] text-lg">{formatPrice(variant.hargaOverride || product.hargaDasar)}</p>
                        <p className="text-sm text-gray-600 mt-1">Stok: <span className="font-bold">{variant.stok} pcs</span></p>
                        {variant.aktif ? (
                          <span className="inline-flex items-center gap-1 bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-semibold mt-2">
                            <Check className="w-3 h-3" /> Aktif
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 bg-gray-100 text-gray-600 px-3 py-1 rounded-full text-xs font-semibold mt-2">
                            <X className="w-3 h-3" /> Nonaktif
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2 mt-4">
                      <button
                        onClick={() => handleEdit(variant)}
                        className="flex-1 py-2.5 bg-blue-50 text-blue-600 rounded-xl font-medium flex items-center justify-center gap-2"
                      >
                        <Edit2 className="w-4 h-4" /> Edit
                      </button>
                      <button
                        onClick={() => handleDelete(variant.id, variant.sku)}
                        className="flex-1 py-2.5 bg-red-50 text-red-600 rounded-xl font-medium flex items-center justify-center gap-2"
                      >
                        <Trash2 className="w-4 h-4" /> Hapus
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Desktop Table View */}
              <div className="hidden lg:block bg-white rounded-3xl shadow-sm border border-pink-100 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[900px]">
                    <thead className="bg-gradient-to-r from-pink-50 to-white border-b-2 border-pink-100">
                      <tr>
                        <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase">Gambar</th>
                        <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase">SKU</th>
                        <th className="px-6 py-4 text-center text-xs font-bold text-gray-700 uppercase">Ukuran</th>
                        <th className="px-6 py-4 text-center text-xs font-bold text-gray-700 uppercase">Warna</th>
                        <th className="px-6 py-4 text-right text-xs font-bold text-gray-700 uppercase">Harga</th>
                        <th className="px-6 py-4 text-center text-xs font-bold text-gray-700 uppercase">Stok</th>
                        <th className="px-6 py-4 text-center text-xs font-bold text-gray-700 uppercase">Status</th>
                        <th className="px-6 py-4 text-center text-xs font-bold text-gray-700 uppercase">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {safeVariants.map((variant) => (
                        <tr key={variant.id} className="hover:bg-pink-50/50 transition-colors">
                          <td className="px-6 py-4">
                            {variant.gambar ? (
                              <img
                                src={variant.gambar}
                                alt={variant.warna}
                                className="w-14 h-14 object-cover rounded-lg border-2 border-gray-200 hover:border-[#cb5094] transition-all"
                              />
                            ) : (
                              <div className="w-14 h-14 bg-gray-100 rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center">
                                <Package className="w-5 h-5 text-gray-400" />
                              </div>
                            )}
                          </td>
                          <td className="px-6 py-4">
                            <code className="text-xs font-mono bg-gray-50 px-2 py-1 rounded">
                              {variant.sku}
                            </code>
                          </td>
                          <td className="px-6 py-4 text-center">
                            <span className="inline-block bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-xs font-semibold">
                              {variant.ukuran}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-center">
                            <span className="inline-block bg-purple-100 text-purple-700 px-3 py-1 rounded-full text-xs font-semibold">
                              {variant.warna}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <div className="font-bold text-[#cb5094] text-sm">
                              {formatPrice(variant.hargaOverride || product.hargaDasar)}
                            </div>
                            {variant.hargaOverride && (
                              <div className="text-xs text-gray-500 line-through">
                                {formatPrice(product.hargaDasar)}
                              </div>
                            )}
                          </td>
                          <td className="px-6 py-4 text-center font-semibold">
                            {variant.stok} pcs
                          </td>
                          <td className="px-6 py-4 text-center">
                            {variant.aktif ? (
                              <span className="inline-flex items-center gap-1 bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-semibold">
                                <Check className="w-3 h-3" /> Aktif
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 bg-gray-100 text-gray-600 px-3 py-1 rounded-full text-xs font-semibold">
                                <X className="w-3 h-3" /> Nonaktif
                              </span>
                            )}
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center justify-center gap-3">
                              <button onClick={() => handleEdit(variant)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg">
                                <Edit2 className="w-5 h-5" />
                              </button>
                              <button onClick={() => handleDelete(variant.id, variant.sku)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg">
                                <Trash2 className="w-5 h-5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Sync Confirmation Modal */}
        {showSyncConfirmation && pendingImageUpdate && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-md z-[80] flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-6">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <AlertCircle className="w-6 h-6 text-amber-600" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900">Sinkronkan Foto?</h3>
                  <p className="text-sm text-gray-600 mt-1">
                    Ditemukan {pendingImageUpdate.affectedCount} varian lain dengan warna "{pendingImageUpdate.colorToSync}"
                  </p>
                </div>
              </div>

              <div className="bg-blue-50 rounded-xl p-4 mb-6">
                <p className="text-sm text-gray-700 leading-relaxed">
                  Apakah Anda ingin <strong className="text-[#cb5094]">otomatis mengupdate foto</strong> untuk semua varian dengan warna <strong>"{pendingImageUpdate.colorToSync}"</strong>?
                </p>
                <p className="text-xs text-gray-600 mt-2">
                  ✨ Ini akan membuat semua varian dengan warna yang sama menggunakan foto yang baru
                </p>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => handleConfirmSync(true)}
                  className="flex-1 bg-[#cb5094] text-white py-3 rounded-xl font-bold hover:bg-[#b54684] transition-all"
                >
                  Ya, Sinkronkan
                </button>
                <button
                  onClick={() => handleConfirmSync(false)}
                  className="flex-1 bg-gray-100 text-gray-700 py-3 rounded-xl font-bold hover:bg-gray-200 transition-all"
                >
                  Tidak
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Image Picker Modal */}
        {showImagePicker && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-md z-[70] flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl shadow-2xl max-w-3xl w-full max-h-[85vh] overflow-y-auto p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-gray-900">
                  Pilih Gambar Varian {currentColorForPicker && ` untuk ${currentColorForPicker}`}
                </h3>
                <button
                  onClick={() => {
                    setShowImagePicker(false);
                    setCurrentColorForPicker('');
                  }}
                  className="p-2 hover:bg-gray-100 rounded-full transition-all"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {(product.gambarUrl?.split('|||').filter(Boolean) || []).map((url, i) => {
                  const currentSelectedImage = currentColorForPicker
                    ? variantsToCreate.find(v => v.warna === currentColorForPicker)?.gambar || null
                    : selectedGambar;

                  const isSelected = currentSelectedImage === url;

                  return (
                    <button
                      key={i}
                      type="button"
                      onClick={() => {
                        if (currentColorForPicker) {
                          setVariantsToCreate(prev =>
                            prev.map(v =>
                              v.warna === currentColorForPicker ? { ...v, gambar: url } : v
                            )
                          );
                          setSelectedGambar('');
                          setCurrentColorForPicker('');
                          setShowImagePicker(false);
                        } else {
                          setSelectedGambar(url);
                          setShowImagePicker(false);
                        }
                      }}
                      className={`relative rounded-xl overflow-hidden border-4 transition-all hover:scale-105 ${
                        isSelected ? 'border-[#cb5094] ring-4 ring-[#cb5094]/50' : 'border-gray-300'
                      }`}
                    >
                      <img src={url} alt={`Foto ${i + 1}`} className="w-full h-48 object-cover" />
                      {isSelected && (
                        <div className="absolute inset-x-0 bottom-0 bg-[#cb5094] text-white text-center py-2 font-bold text-sm">
                          ✓ Dipilih
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>

              {(product.gambarUrl?.split('|||').filter(Boolean) || []).length === 0 && (
                <div className="text-center py-12 text-gray-500">
                  <Package className="w-16 h-16 mx-auto mb-4 opacity-50" />
                  <p className="font-medium">Belum ada foto produk</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Form Modal */}
        {showForm && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-3xl max-h-[95vh] overflow-y-auto flex flex-col">
              {/* Header */}
              <div className="bg-gradient-to-r from-[#cb5094] to-[#e570b3] px-5 py-4 flex justify-between items-center rounded-t-3xl sticky top-0 z-10">
                <h2 className="text-lg font-bold text-white">
                  {editingVariant ? 'Edit Varian' : 'Tambah Varian'}
                </h2>
                <button onClick={handleCancelForm} className="text-white hover:bg-white/20 p-2 rounded-lg">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Content */}
              <div className="flex-1 overflow-y-auto p-5">
                {editingVariant ? (
                  <form onSubmit={handleSubmit}>
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="space-y-3">
                        <div>
                          <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                            Ukuran <span className="text-[#cb5094]">*</span>
                          </label>
                          <input
                            type="text"
                            value={formData.ukuran}
                            onChange={(e) => setFormData({ ...formData, ukuran: e.target.value })}
                            className="w-full px-3 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-[#cb5094]"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                            Warna <span className="text-[#cb5094]">*</span>
                          </label>
                          <input
                            type="text"
                            value={formData.warna}
                            onChange={(e) => setFormData({ ...formData, warna: e.target.value })}
                            className="w-full px-3 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-[#cb5094]"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                            Gambar Varian (Opsional)
                          </label>
                          <div className="flex items-center gap-2">
                            {selectedGambar || formData.gambar ? (
                              <img
                                src={selectedGambar || formData.gambar}
                                alt="Preview"
                                className="w-16 h-16 object-cover rounded-lg border-2 border-[#cb5094]"
                              />
                            ) : (
                              <div className="w-16 h-16 bg-gray-100 rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center">
                                <Package className="w-6 h-6 text-gray-400" />
                              </div>
                            )}
                            <button
                              type="button"
                              onClick={() => setShowImagePicker(true)}
                              className="px-4 py-2 bg-blue-500 text-white rounded-lg text-sm font-semibold hover:bg-blue-600"
                            >
                              {selectedGambar || formData.gambar ? 'Ganti Foto' : 'Pilih Foto'}
                            </button>
                          </div>
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                            SKU <span className="text-[#cb5094]">*</span>
                          </label>
                          <div className="flex gap-2">
                            <input
                              type="text"
                              value={formData.sku}
                              onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                              className="flex-1 px-3 py-2 text-xs border rounded-lg font-mono"
                              required
                            />
                            <button
                              type="button"
                              onClick={() => {
                                const sku = generateSKU(formData.ukuran, formData.warna);
                                if (sku) setFormData({ ...formData, sku });
                              }}
                              className="px-4 py-2 bg-pink-50 text-[#cb5094] rounded-lg font-semibold"
                            >
                              Auto
                            </button>
                          </div>
                        </div>
                      </div>
                      <div className="space-y-3">
                        <div>
                          <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                            Stok <span className="text-[#cb5094]">*</span>
                          </label>
                          <input
                            type="number"
                            value={formData.stok}
                            onChange={(e) => setFormData({ ...formData, stok: e.target.value })}
                            min="0"
                            className="w-full px-3 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-[#cb5094]"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                            Harga Khusus (Opsional)
                          </label>
                          <input
                            type="number"
                            value={formData.hargaOverride}
                            onChange={(e) => setFormData({ ...formData, hargaOverride: e.target.value })}
                            min="0"
                            step="1000"
                            placeholder={`Default: ${formatPrice(product.hargaDasar)}`}
                            className="w-full px-3 py-2 text-sm border rounded-lg"
                          />
                        </div>
                        <div className="flex items-center gap-2 p-2.5 bg-pink-50 rounded-lg">
                          <input
                            type="checkbox"
                            id="aktif-variant"
                            checked={formData.aktif}
                            onChange={(e) => setFormData({ ...formData, aktif: e.target.checked })}
                            className="w-4 h-4"
                          />
                          <label htmlFor="aktif-variant" className="text-xs font-semibold">
                            Varian Aktif
                          </label>
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2 mt-5">
                      <button
                        type="submit"
                        className="flex-1 bg-[#cb5094] text-white py-2.5 rounded-xl font-semibold hover:bg-[#b54684]"
                      >
                        Update
                      </button>
                      <button
                        type="button"
                        onClick={handleCancelForm}
                        className="flex-1 bg-white border text-gray-700 py-2.5 rounded-xl font-semibold hover:bg-gray-50"
                      >
                        Batal
                      </button>
                    </div>
                  </form>
                ) : (
                  <div>
                    <div className="flex items-center justify-center gap-4 mb-6">
                      <div className={`flex items-center gap-2 ${variantStep === 'colors' ? 'text-[#cb5094]' : 'text-gray-500'}`}>
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${variantStep === 'colors' ? 'bg-[#cb5094] text-white' : 'bg-gray-200'}`}>
                          1
                        </div>
                        <span>Warna</span>
                      </div>
                      <ChevronRight className="w-5 h-5 text-gray-400" />
                      <div className={`flex items-center gap-2 ${variantStep === 'sizes' ? 'text-[#cb5094]' : 'text-gray-500'}`}>
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${variantStep === 'sizes' ? 'bg-[#cb5094] text-white' : 'bg-gray-200'}`}>
                          2
                        </div>
                        <span>Ukuran</span>
                      </div>
                      <ChevronRight className="w-5 h-5 text-gray-400" />
                      <div className={`flex items-center gap-2 ${variantStep === 'stocks' ? 'text-[#cb5094]' : 'text-gray-500'}`}>
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${variantStep === 'stocks' ? 'bg-[#cb5094] text-white' : 'bg-gray-200'}`}>
                          3
                        </div>
                        <span>Stok & Gambar</span>
                      </div>
                    </div>

                    {variantStep === 'colors' && (
                      <div className="space-y-4">
                        <div className="bg-pink-50 rounded-xl p-4 border border-pink-200">
                          <h4 className="font-bold mb-3">Tambahkan Warna</h4>
                          {colors.length > 0 && (
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-4">
                              {colors.map(color => (
                                <div key={color} className="bg-white rounded-lg p-3 border flex items-center justify-between">
                                  <span className="font-medium">{color}</span>
                                  <button
                                    type="button"
                                    onClick={() => handleRemoveColor(color)}
                                    className="text-red-600 hover:bg-red-50 rounded p-1"
                                  >
                                    <X className="w-4 h-4" />
                                  </button>
                                </div>
                              ))}
                            </div>
                          )}
                          <div className="flex gap-2">
                            <input
                              type="text"
                              placeholder="Misal: Abu-abu, Hitam"
                              value={newColor}
                              onChange={e => setNewColor(e.target.value)}
                              onKeyPress={e => e.key === 'Enter' && (e.preventDefault(), handleAddColor())}
                              className="flex-1 px-4 py-2 border rounded-lg"
                            />
                            <button
                              type="button"
                              onClick={handleAddColor}
                              className="bg-[#cb5094] text-white px-6 py-2 rounded-lg font-medium"
                            >
                              Tambah
                            </button>
                          </div>
                        </div>
                        {colors.length > 0 && (
                          <button
                            onClick={handleNextToSizes}
                            className="w-full bg-[#cb5094] text-white py-3 rounded-xl font-bold"
                          >
                            Lanjut ke Ukuran →
                          </button>
                        )}
                      </div>
                    )}

                    {variantStep === 'sizes' && (
                      <div className="space-y-4">
                        <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
                          <div className="flex justify-between mb-3">
                            <h4 className="font-bold">Tambahkan Ukuran</h4>
                            <button onClick={() => setVariantStep('colors')} className="text-sm text-gray-600">
                              ← Kembali
                            </button>
                          </div>
                          {sizes.length > 0 && (
                            <div className="flex flex-wrap gap-2 mb-4">
                              {sizes.map(size => (
                                <span key={size} className="bg-white border border-blue-500 text-blue-700 px-4 py-2 rounded-full font-medium flex items-center gap-2">
                                  {size}
                                  <button onClick={() => handleRemoveSize(size)} className="hover:bg-blue-100 rounded-full p-1">
                                    <X className="w-4 h-4" />
                                  </button>
                                </span>
                              ))}
                            </div>
                          )}
                          <div className="flex gap-2">
                            <input
                              type="text"
                              placeholder="Misal: S, M, L, XL"
                              value={newSize}
                              onChange={e => setNewSize(e.target.value)}
                              onKeyPress={e => e.key === 'Enter' && (e.preventDefault(), handleAddSize())}
                              className="flex-1 px-4 py-2 border rounded-lg"
                            />
                            <button
                              type="button"
                              onClick={handleAddSize}
                              className="bg-blue-500 text-white px-6 py-2 rounded-lg font-medium"
                            >
                              Tambah
                            </button>
                          </div>
                        </div>
                        {sizes.length > 0 && (
                          <button
                            onClick={handleNextToStocks}
                            className="w-full bg-[#cb5094] text-white py-3 rounded-xl font-bold"
                          >
                            Lanjut ke Stok & Gambar →
                          </button>
                        )}
                      </div>
                    )}

                    {variantStep === 'stocks' && (
                      <div className="space-y-6">
                        <div className="bg-green-50 rounded-xl p-6 border border-green-200">
                          <div className="flex justify-between items-center mb-6">
                            <div>
                              <h4 className="text-xl font-bold text-gray-800">Atur Gambar per Warna</h4>
                              <p className="text-sm text-gray-600 mt-1">
                                Pilih sekali per warna → otomatis berlaku untuk semua ukuran
                              </p>
                            </div>
                            <button
                              onClick={() => setVariantStep('sizes')}
                              className="text-sm text-gray-600 hover:text-gray-800"
                            >
                              ← Kembali
                            </button>
                          </div>

                          {/* Pilih gambar per warna */}
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                            {colors.map(color => {
                              const currentImage = variantsToCreate.find(v => v.warna === color)?.gambar || null;

                              return (
                                <div key={color} className="bg-white rounded-2xl p-5 border-2 border-gray-200 shadow-sm text-center">
                                  <h5 className="font-bold text-lg text-[#cb5094] mb-4">{color}</h5>
                                  {currentImage ? (
                                    <img
                                      src={currentImage}
                                      alt={color}
                                      className="w-40 h-40 object-cover rounded-xl border-4 border-[#cb5094] mx-auto mb-4 shadow-md"
                                    />
                                  ) : (
                                    <div className="w-40 h-40 bg-gray-100 rounded-xl border-4 border-dashed border-gray-400 mx-auto mb-4 flex items-center justify-center">
                                      <Package className="w-16 h-16 text-gray-400" />
                                    </div>
                                  )}
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setCurrentColorForPicker(color);
                                      setShowImagePicker(true);
                                    }}
                                    className="w-full py-3 bg-[#cb5094] text-white rounded-xl font-bold hover:bg-[#b54684] transition-all shadow-md"
                                  >
                                    {currentImage ? 'Ganti Foto' : 'Pilih Foto'}
                                  </button>
                                </div>
                              );
                            })}
                          </div>

                          {/* Atur stok per varian */}
                          <div>
                            <h4 className="text-xl font-bold text-gray-800 mb-4">Atur Stok per Varian</h4>
                            <div className="max-h-80 overflow-y-auto space-y-3">
                              {variantsToCreate.map(v => (
                                <div key={v.id} className="bg-white rounded-lg p-4 border flex items-center justify-between shadow-sm">
                                  <div className="flex items-center gap-6">
                                    <div className="text-center">
                                      <span className="bg-purple-100 text-purple-700 px-4 py-2 rounded-full font-bold">{v.warna}</span>
                                    </div>
                                    <div className="text-center">
                                      <span className="bg-blue-100 text-blue-700 px-4 py-2 rounded-full font-bold">{v.ukuran}</span>
                                    </div>
                                    {v.gambar ? (
                                      <img src={v.gambar} alt={v.warna} className="w-16 h-16 object-cover rounded-lg border" />
                                    ) : (
                                      <div className="w-16 h-16 bg-gray-200 rounded-lg flex items-center justify-center text-xs text-gray-500">
                                        No Img
                                      </div>
                                    )}
                                  </div>
                                  <div className="flex items-center gap-4">
                                    <label className="font-medium">Stok:</label>
                                    <input
                                      type="number"
                                      value={v.stok}
                                      onChange={e => handleStockChange(v.id, e.target.value)}
                                      className="w-24 px-3 py-2 border rounded-lg text-center font-medium"
                                      min="0"
                                    />
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>

                        <button
                          onClick={handleCreateMultipleVariants}
                          className="w-full bg-gradient-to-r from-[#cb5094] to-[#e570b3] text-white py-5 rounded-xl font-bold text-xl hover:shadow-xl transition-all"
                        >
                          Buat {variantsToCreate.length} Varian
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default ProductVariantManagement;