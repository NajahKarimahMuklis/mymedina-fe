import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Plus, Edit2, Trash2, Search, PackageSearch, Eye, X, ChevronRight, Package
} from 'lucide-react';
import { productAPI, categoryAPI, variantAPI } from '../utils/api';
import { formatPrice, getStatusLabel, getStatusColor, PRODUCT_STATUS } from '../utils/formatPrice';
import ImageUpload from '../components/ImageUpload';
import { Notification, useNotification } from '../pages/Notifications';

function ProductManagement() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const navigate = useNavigate();
  
  const notification = useNotification();
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalProducts, setTotalProducts] = useState(0);

  const [formData, setFormData] = useState({
    categoryId: '',
    nama: '',
    slug: '',
    deskripsi: '',
    hargaDasar: '',
    berat: '',
    status: 'READY',
    aktif: true,
    gambarUrls: []  // ✅ Array of strings
  });

  const [variantStep, setVariantStep] = useState('colors');
  const [colors, setColors] = useState([]);
  const [sizes, setSizes] = useState([]);
  const [variants, setVariants] = useState([]);
  const [newColor, setNewColor] = useState('');
  const [newSize, setNewSize] = useState('');

  useEffect(() => {
    fetchProducts();
  }, [currentPage, filterCategory, filterStatus, searchQuery]);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const params = {
        page: currentPage,
        limit: 10,
        search: searchQuery || undefined,
        categoryId: filterCategory || undefined,
        status: filterStatus || undefined,
        active: undefined
      };
      const response = await productAPI.getAll(params);
      setProducts(response.data.data || []);
      setTotalPages(response.data.meta?.totalPages || 1);
      setTotalProducts(response.data.meta?.total || 0);
    } catch (error) {
      console.error('Error fetching products:', error);
      notification.error('Gagal memuat produk: ' + (error.message || 'Unknown error'));
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await categoryAPI.getAll(false);
      setCategories(response.data || []);
    } catch (error) {
      console.error('Error fetching categories:', error);
      setCategories([]);
    }
  };

  const handleNamaChange = (e) => {
    const nama = e.target.value;
    const slug = nama
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-');
    
    setFormData({ ...formData, nama, slug });
  };

  const handleAddColor = () => {
    if (newColor.trim() && !colors.includes(newColor.trim())) {
      setColors([...colors, newColor.trim()]);
      setNewColor('');
    }
  };

  const handleRemoveColor = (color) => {
    setColors(colors.filter(c => c !== color));
    setVariants(variants.filter(v => v.warna !== color));
  };

  const handleNextToSizes = () => {
    if (colors.length === 0) {
      notification.warning('Tambahkan minimal 1 warna');
      return;
    }
    setVariantStep('sizes');
  };

  const handleAddSize = () => {
    if (newSize.trim() && !sizes.includes(newSize.trim())) {
      setSizes([...sizes, newSize.trim()]);
      setNewSize('');
    }
  };

  const handleRemoveSize = (size) => {
    setSizes(sizes.filter(s => s !== size));
    setVariants(variants.filter(v => v.ukuran !== size));
  };

  const handleNextToStocks = () => {
    if (sizes.length === 0) {
      notification.warning('Tambahkan minimal 1 ukuran');
      return;
    }
    
    const newVariants = [];
    colors.forEach(color => {
      sizes.forEach(size => {
        newVariants.push({
          id: `${color}-${size}`,
          warna: color,
          ukuran: size,
          stok: 10
        });
      });
    });
    
    setVariants(newVariants);
    setVariantStep('stocks');
  };

  const handleStockChange = (id, stok) => {
    setVariants(variants.map(v =>
      v.id === id ? { ...v, stok: parseInt(stok) || 0 } : v
    ));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.categoryId || !formData.nama || !formData.hargaDasar) {
      notification.warning('Kategori, nama, dan harga wajib diisi');
      return;
    }
  
    // ✅ SOLUSI: Gabungkan array jadi string dengan separator |||
    const payload = {
      categoryId: formData.categoryId,
      nama: formData.nama,
      slug: formData.slug,
      deskripsi: formData.deskripsi,
      hargaDasar: parseInt(formData.hargaDasar),
      berat: parseInt(formData.berat) || 0,
      status: formData.status,
      aktif: formData.aktif,
      gambarUrl: formData.gambarUrls.join('|||') // ✅ Gabungkan semua URL dengan separator
      // ❌ HAPUS gambarUrls: formData.gambarUrls
    };
  
    try {
      if (editingProduct) {
        await productAPI.update(editingProduct.id, payload);
        notification.success('✅ Produk berhasil diupdate!');
      } else {
        const response = await productAPI.create(payload);
        const newProductId = response.data?.data?.id;
        
        if (!newProductId) {
          throw new Error('Product ID tidak ditemukan di response');
        }
        
        if (variants.length > 0) {
          let successCount = 0;
          
          for (const variant of variants) {
            try {
              const baseSlug = formData.slug.toUpperCase().replace(/-/g, '');
              const size = variant.ukuran.toUpperCase().replace(/\s+/g, '');
              const color = variant.warna.toUpperCase().replace(/\s+/g, '');
              const timestamp = Date.now().toString().slice(-6);
              const random = Math.random().toString(36).substring(2, 5).toUpperCase();
              const sku = `${baseSlug}-${size}-${color}-${timestamp}-${random}`;
  
              const variantPayload = {
                sku,
                ukuran: variant.ukuran,
                warna: variant.warna,
                stok: variant.stok,
                hargaOverride: null,
                aktif: true
              };
              
              await variantAPI.create(newProductId, variantPayload);
              successCount++;
            } catch (variantError) {
              console.error('Failed to create variant:', variantError);
            }
          }
          
          notification.success(`🎉 Produk dan ${successCount} varian berhasil dibuat!`);
        } else {
          notification.success('✅ Produk berhasil dibuat!');
        }
      }
      
      handleCancelForm();
      fetchProducts();
      
    } catch (error) {
      console.error('Error saving product:', error);
      notification.error('❌ Gagal menyimpan produk: ' + (error.message || 'Unknown error'));
    }
  };

  // ✅ POIN 5: handleEdit support load multiple images
  const handleEdit = (product) => {
    setEditingProduct(product);
    
    // ✅ Split gambarUrl jadi array
    const gambarUrls = product.gambarUrl 
      ? product.gambarUrl.split('|||').filter(url => url) 
      : [];
    
    setFormData({
      categoryId: product.categoryId,
      nama: product.nama,
      slug: product.slug,
      deskripsi: product.deskripsi || '',
      hargaDasar: product.hargaDasar.toString(),
      berat: product.berat?.toString() || '0',
      status: product.status,
      aktif: product.aktif,
      gambarUrls: gambarUrls // ✅ Array dari hasil split
    });
    
    setColors([]);
    setSizes([]);
    setVariants([]);
    setVariantStep('colors');
    setShowForm(true);
  };

  const handleDelete = async (id, nama) => {
    if (!confirm(`Yakin ingin menghapus produk "${nama}"?`)) return;

    try {
      await productAPI.delete(id);
      notification.success(`🗑️ Produk "${nama}" berhasil dihapus!`);
      fetchProducts();
    } catch (error) {
      console.error('Error deleting product:', error);
      notification.error('❌ Gagal menghapus produk: ' + (error.message || 'Unknown error'));
    }
  };

  // ✅ POIN 6: handleCancelForm reset ke gambarUrls: []
  const handleCancelForm = () => {
    setShowForm(false);
    setEditingProduct(null);
    setFormData({
      categoryId: '',
      nama: '',
      slug: '',
      deskripsi: '',
      hargaDasar: '',
      berat: '',
      status: 'READY',
      aktif: true,
      gambarUrls: [] // Reset ke array kosong
    });
    setColors([]);
    setSizes([]);
    setVariants([]);
    setVariantStep('colors');
  };

  const handleImageUploaded = (url) => {
    setFormData({ 
      ...formData, 
      gambarUrls: [...formData.gambarUrls, url] 
    });
    notification.success('📷 Gambar berhasil diupload!');
  };

  const handleRemoveImage = (urlToRemove) => {
    setFormData({
      ...formData,
      gambarUrls: formData.gambarUrls.filter(url => url !== urlToRemove)
    });
    notification.success('🗑️ Gambar berhasil dihapus!');
  };

  const handleViewVariants = (productId) => {
    navigate(`/admin/products/${productId}/variants`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-pink-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="fixed top-0 right-0 z-[100] space-y-3 p-4">
          {notification.notifications.map((notif) => (
            <Notification
              key={notif.id}
              type={notif.type}
              message={notif.message}
            />
          ))}
        </div>

        {/* Header */}
        <div className="bg-white rounded-3xl shadow-sm border border-pink-100 p-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-gradient-to-br from-[#cb5094] to-[#e570b3] rounded-2xl flex items-center justify-center shadow-md">
                <Package className="w-7 h-7 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Kelola Produk</h1>
                <p className="text-gray-500 text-sm mt-1">Atur produk di toko Anda</p>
              </div>
            </div>
            <button
              onClick={() => setShowForm(true)}
              className="bg-[#cb5094] text-white px-5 py-2.5 rounded-xl font-semibold hover:bg-[#b54684] transition-all flex items-center gap-2 shadow-sm"
            >
              <Plus className="w-5 h-5" />
              Tambah Produk
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-2xl shadow-sm border border-pink-100 p-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Cari produk..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#cb5094] focus:border-transparent"
              />
            </div>
            <select
              value={filterCategory}
              onChange={(e) => {
                setFilterCategory(e.target.value);
                setCurrentPage(1);
              }}
              className="px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#cb5094] focus:border-transparent"
            >
              <option value="">Semua Kategori</option>
              {Array.isArray(categories) && categories.map(cat => (
                <option key={cat.id} value={cat.id}>{cat.nama}</option>
              ))}
            </select>
            <select
              value={filterStatus}
              onChange={(e) => {
                setFilterStatus(e.target.value);
                setCurrentPage(1);
              }}
              className="px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#cb5094] focus:border-transparent"
            >
              <option value="">Semua Status</option>
              <option value="READY">Ready Stock</option>
              <option value="PO">Pre Order</option>
              <option value="DISCONTINUED">Discontinued</option>
            </select>
          </div>
        </div>

        {/* Form Modal */}
        {showForm && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
            <div className="bg-white rounded-3xl shadow-2xl max-w-4xl w-full my-8 max-h-[90vh] flex flex-col">
              {/* Header */}
              <div className="bg-gradient-to-r from-[#cb5094] to-[#e570b3] px-5 py-4 flex justify-between items-center rounded-t-3xl flex-shrink-0">
                <div>
                  <h2 className="text-lg font-bold text-white">
                    {editingProduct ? 'Edit Produk' : 'Tambah Produk Baru'}
                  </h2>
                  <p className="text-white/90 text-xs mt-0.5">
                    {editingProduct ? 'Perbarui informasi produk' : 'Buat produk baru dengan varian'}
                  </p>
                </div>
                <button onClick={handleCancelForm} className="text-white hover:bg-white/20 p-2 rounded-lg transition-all">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Form Content */}
              <div className="p-5 overflow-y-auto flex-1">
                <div className="grid md:grid-cols-2 gap-4">
                  {/* Left Column */}
                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                        Kategori <span className="text-[#cb5094]">*</span>
                      </label>
                      <select
                        value={formData.categoryId}
                        onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                        className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#cb5094] focus:border-transparent"
                        required
                      >
                        <option value="">Pilih Kategori</option>
                        {Array.isArray(categories) && categories.map(cat => (
                          <option key={cat.id} value={cat.id}>{cat.nama}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                        Nama Produk <span className="text-[#cb5094]">*</span>
                      </label>
                      <input
                        type="text"
                        value={formData.nama}
                        onChange={handleNamaChange}
                        placeholder="Gamis Syari Premium"
                        className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#cb5094] focus:border-transparent"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1.5">Slug</label>
                      <input
                        type="text"
                        value={formData.slug}
                        onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                        className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg font-mono focus:outline-none focus:ring-2 focus:ring-[#cb5094] focus:border-transparent bg-gray-50"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                        Harga Dasar <span className="text-[#cb5094]">*</span>
                      </label>
                      <input
                        type="number"
                        value={formData.hargaDasar}
                        onChange={(e) => setFormData({ ...formData, hargaDasar: e.target.value })}
                        placeholder="350000"
                        className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#cb5094] focus:border-transparent"
                        required
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1.5">Berat (g)</label>
                        <input
                          type="number"
                          value={formData.berat}
                          onChange={(e) => setFormData({ ...formData, berat: e.target.value })}
                          placeholder="500"
                          className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#cb5094] focus:border-transparent"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1.5">Status</label>
                        <select
                          value={formData.status}
                          onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                          className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#cb5094] focus:border-transparent"
                        >
                          {Object.keys(PRODUCT_STATUS).map(status => (
                            <option key={status} value={status}>{getStatusLabel(status)}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 p-2.5 bg-pink-50 rounded-lg border border-pink-100">
                      <input
                        type="checkbox"
                        id="aktif-product"
                        checked={formData.aktif}
                        onChange={(e) => setFormData({ ...formData, aktif: e.target.checked })}
                        className="w-4 h-4 text-[#cb5094] rounded border-gray-300 focus:ring-[#cb5094]"
                      />
                      <label htmlFor="aktif-product" className="text-xs font-semibold text-gray-700">
                        Produk Aktif
                      </label>
                    </div>
                  </div>

                  {/* ✅ POIN 3: Right Column - Multi-Image Gallery */}
                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                        Gambar Produk {formData.gambarUrls.length > 0 && 
                          <span className="text-[#cb5094]">({formData.gambarUrls.length} foto)</span>
                        }
                      </label>
                      
                      {/* Image Gallery */}
                      {formData.gambarUrls.length > 0 && (
                        <div className="grid grid-cols-3 gap-2 mb-2">
                          {formData.gambarUrls.map((url, idx) => (
                            <div key={idx} className="relative group">
                              <img 
                                src={url} 
                                alt={`Product ${idx + 1}`}
                                className="w-full h-20 object-cover rounded-lg border-2 border-gray-200"
                              />
                              <button
                                type="button"
                                onClick={() => handleRemoveImage(url)}
                                className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                              >
                                <X className="w-3 h-3" />
                              </button>
                              {idx === 0 && (
                                <div className="absolute bottom-1 left-1 bg-[#cb5094] text-white px-2 py-0.5 rounded text-xs font-semibold">
                                  Utama
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                      
                      {/* Upload Button */}
                      <ImageUpload
                        onImageUploaded={handleImageUploaded}
                        currentImage="" // Kosongkan agar bisa upload terus
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        💡 Foto pertama akan menjadi foto utama produk
                      </p>
                    </div>
                    
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1.5">Deskripsi</label>
                      <textarea
                        value={formData.deskripsi}
                        onChange={(e) => setFormData({ ...formData, deskripsi: e.target.value })}
                        placeholder="Deskripsi produk..."
                        rows="4"
                        className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#cb5094] focus:border-transparent resize-none"
                      />
                    </div>
                  </div>
                </div>

                {/* Variant Flow - TETAP SAMA */}
                {!editingProduct && (
                  <div className="mt-4 border-t border-gray-200 pt-4">
                    <h3 className="text-sm font-bold text-gray-900 mb-3">Varian Produk (Opsional)</h3>
                    
                    {/* Progress Steps */}
                    <div className="flex items-center justify-center gap-2 mb-4">
                      <div className={`flex items-center gap-1.5 ${variantStep === 'colors' ? 'text-[#cb5094]' : 'text-gray-400'}`}>
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${variantStep === 'colors' ? 'bg-[#cb5094] text-white' : 'bg-gray-200'}`}>1</div>
                        <span className="font-semibold text-xs">Warna</span>
                      </div>
                      <ChevronRight className="w-4 h-4 text-gray-400" />
                      <div className={`flex items-center gap-1.5 ${variantStep === 'sizes' ? 'text-[#cb5094]' : 'text-gray-400'}`}>
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${variantStep === 'sizes' ? 'bg-[#cb5094] text-white' : 'bg-gray-200'}`}>2</div>
                        <span className="font-semibold text-xs">Ukuran</span>
                      </div>
                      <ChevronRight className="w-4 h-4 text-gray-400" />
                      <div className={`flex items-center gap-1.5 ${variantStep === 'stocks' ? 'text-[#cb5094]' : 'text-gray-400'}`}>
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${variantStep === 'stocks' ? 'bg-[#cb5094] text-white' : 'bg-gray-200'}`}>3</div>
                        <span className="font-semibold text-xs">Stok</span>
                      </div>
                    </div>

                    {/* STEP 1: Colors */}
                    {variantStep === 'colors' && (
                      <div className="bg-pink-50 rounded-xl p-4 border border-pink-100">
                        <h4 className="font-bold text-gray-800 mb-2 text-xs">Langkah 1: Tambahkan Warna</h4>
                        
                        {colors.length > 0 && (
                          <div className="flex flex-wrap gap-1.5 mb-2">
                            {colors.map(color => (
                              <span key={color} className="bg-white border border-[#cb5094] text-[#cb5094] px-2.5 py-1 rounded-full text-xs font-semibold flex items-center gap-1.5">
                                {color}
                                <button
                                  type="button"
                                  onClick={() => handleRemoveColor(color)}
                                  className="hover:bg-pink-100 rounded-full p-0.5"
                                >
                                  <X className="w-3 h-3" />
                                </button>
                              </span>
                            ))}
                          </div>
                        )}
                        
                        <div className="flex gap-2">
                          <input
                            type="text"
                            placeholder="Contoh: Hitam, Putih"
                            value={newColor}
                            onChange={(e) => setNewColor(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddColor())}
                            className="flex-1 px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#cb5094] focus:border-transparent"
                          />
                          <button
                            type="button"
                            onClick={handleAddColor}
                            className="bg-[#cb5094] text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-[#b54684]"
                          >
                            Tambah
                          </button>
                        </div>

                        {colors.length > 0 && (
                          <button
                            type="button"
                            onClick={handleNextToSizes}
                            className="w-full mt-2 bg-[#cb5094] text-white py-2 rounded-lg text-sm font-semibold hover:bg-[#b54684] flex items-center justify-center gap-1.5"
                          >
                            Lanjut <ChevronRight className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    )}

                    {/* STEP 2: Sizes */}
                    {variantStep === 'sizes' && (
                      <div className="bg-blue-50 rounded-xl p-4 border border-blue-100">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-bold text-gray-800 text-xs">Langkah 2: Tambahkan Ukuran</h4>
                          <button
                            type="button"
                            onClick={() => setVariantStep('colors')}
                            className="text-xs text-gray-600 hover:text-gray-800 font-medium"
                          >
                            ← Kembali
                          </button>
                        </div>
                        
                        {sizes.length > 0 && (
                          <div className="flex flex-wrap gap-1.5 mb-2">
                            {sizes.map(size => (
                              <span key={size} className="bg-white border border-blue-500 text-blue-600 px-2.5 py-1 rounded-full text-xs font-semibold flex items-center gap-1.5">
                                {size}
                                <button
                                  type="button"
                                  onClick={() => handleRemoveSize(size)}
                                  className="hover:bg-blue-100 rounded-full p-0.5"
                                >
                                  <X className="w-3 h-3" />
                                </button>
                              </span>
                            ))}
                          </div>
                        )}
                        
                        <div className="flex gap-2">
                          <input
                            type="text"
                            placeholder="Contoh: S, M, L"
                            value={newSize}
                            onChange={(e) => setNewSize(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddSize())}
                            className="flex-1 px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                          <button
                            type="button"
                            onClick={handleAddSize}
                            className="bg-blue-500 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-blue-600"
                          >
                            Tambah
                          </button>
                        </div>

                        {sizes.length > 0 && (
                          <button
                            type="button"
                            onClick={handleNextToStocks}
                            className="w-full mt-2 bg-[#cb5094] text-white py-2 rounded-lg text-sm font-semibold hover:bg-[#b54684] flex items-center justify-center gap-1.5"
                          >
                            Lanjut <ChevronRight className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    )}

                    {/* STEP 3: Stocks */}
                    {variantStep === 'stocks' && (
                      <div className="bg-green-50 rounded-xl p-4 border border-green-100">
                        <div className="flex items-center justify-between mb-2">
                          <div>
                            <h4 className="font-bold text-gray-800 text-xs">Langkah 3: Atur Stok</h4>
                            <p className="text-xs text-gray-600 mt-0.5">
                              Total: <span className="font-bold text-[#cb5094]">{variants.length}</span> varian
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() => setVariantStep('sizes')}
                            className="text-xs text-gray-600 hover:text-gray-800 font-medium"
                          >
                            ← Kembali
                          </button>
                        </div>

                        <div className="space-y-2 max-h-48 overflow-y-auto">
                          {variants.map(variant => (
                            <div key={variant.id} className="bg-white rounded-lg p-2.5 border border-gray-200 flex items-center justify-between">
                              <div className="flex items-center gap-1.5">
                                <span className="bg-pink-100 text-[#cb5094] px-2 py-0.5 rounded-full text-xs font-semibold">
                                  {variant.warna}
                                </span>
                                <span className="bg-blue-100 text-blue-600 px-2 py-0.5 rounded-full text-xs font-semibold">
                                  {variant.ukuran}
                                </span>
                              </div>
                              <div className="flex items-center gap-1.5">
                                <label className="text-xs font-semibold text-gray-700">Stok:</label>
                                <input
                                  type="number"
                                  value={variant.stok}
                                  onChange={(e) => handleStockChange(variant.id, e.target.value)}
                                  className="w-16 px-2 py-1 border border-gray-200 rounded text-xs focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                                  min="0"
                                />
                              </div>
                            </div>
                          ))}
                        </div>

                        <div className="mt-2 bg-white rounded-lg p-2.5 border border-green-200">
                          <p className="text-xs text-gray-600">
                            ✅ Total stok: <span className="font-bold text-green-600">{variants.reduce((sum, v) => sum + v.stok, 0)} pcs</span>
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Form Actions */}
              <div className="bg-gray-50 border-t border-gray-200 px-5 py-3 rounded-b-3xl flex-shrink-0">
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={handleSubmit}
                    disabled={!editingProduct && variantStep !== 'stocks' && (colors.length > 0 || sizes.length > 0)}
                    className="flex-1 bg-[#cb5094] text-white py-2.5 rounded-xl text-sm font-semibold hover:bg-[#b54684] transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {editingProduct ? '💾 Update' : 'Simpan'}
                  </button>
                  <button
                    type="button"
                    onClick={handleCancelForm}
                    className="flex-1 bg-white border border-gray-200 text-gray-700 py-2.5 rounded-xl text-sm font-semibold hover:bg-gray-50 transition-all"
                  >
                    Batal
                  </button>
                </div>
                {!editingProduct && variantStep !== 'stocks' && (colors.length > 0 || sizes.length > 0) && (
                  <p className="text-xs text-amber-600 text-center mt-2">
                    ⚠️ Selesaikan pengaturan varian atau hapus semua warna/ukuran
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Products Table - TETAP SAMA */}
        <div className="bg-white rounded-3xl shadow-sm border border-pink-100 overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="text-center">
                <div className="w-16 h-16 border-4 border-pink-200 border-t-[#cb5094] rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-gray-600 font-medium">Memuat produk...</p>
              </div>
            </div>
          ) : products.length === 0 ? (
            <div className="text-center py-20 px-4">
              <div className="w-20 h-20 bg-pink-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <PackageSearch className="w-10 h-10 text-[#cb5094]" />
              </div>
              <h3 className="text-xl font-bold text-gray-800 mb-2">Produk Tidak Ditemukan</h3>
              <p className="text-gray-600 text-sm">
                {searchQuery || filterCategory || filterStatus 
                  ? 'Coba ubah filter pencarian'
                  : 'Mulai dengan menambahkan produk pertama'}
              </p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gradient-to-r from-pink-50 to-white border-b-2 border-pink-100">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Produk</th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Kategori</th>
                      <th className="px-6 py-4 text-right text-xs font-bold text-gray-700 uppercase tracking-wider">Harga</th>
                      <th className="px-6 py-4 text-center text-xs font-bold text-gray-700 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-4 text-center text-xs font-bold text-gray-700 uppercase tracking-wider">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {products.map((product) => (
                      <tr key={product.id} className="hover:bg-pink-50/50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            {/* Multi-Image Preview */}
                            <div className="flex gap-0.5 w-14 h-14 flex-shrink-0">
                              {(() => {
                                const images = product.gambarUrl?.split('|||').filter(url => url) || [];
                                
                                // Kalau cuma 1 gambar
                                if (images.length === 1) {
                                  return (
                                    <div className="w-full h-full rounded-xl overflow-hidden bg-gray-100 border border-gray-200">
                                      <img src={images[0]} alt={product.nama} className="w-full h-full object-cover" />
                                    </div>
                                  );
                                }
                                
                                // Kalau 2 gambar
                                if (images.length === 2) {
                                  return (
                                    <>
                                      <div className="w-1/2 h-full rounded-l-xl overflow-hidden bg-gray-100 border border-gray-200">
                                        <img src={images[0]} alt="" className="w-full h-full object-cover" />
                                      </div>
                                      <div className="w-1/2 h-full rounded-r-xl overflow-hidden bg-gray-100 border border-gray-200">
                                        <img src={images[1]} alt="" className="w-full h-full object-cover" />
                                      </div>
                                    </>
                                  );
                                }
                                
                                // Kalau 3+ gambar (grid 2x2 style)
                                if (images.length >= 3) {
                                  return (
                                    <div className="w-full h-full grid grid-cols-2 gap-0.5 rounded-xl overflow-hidden">
                                      <div className="bg-gray-100 border border-gray-200">
                                        <img src={images[0]} alt="" className="w-full h-full object-cover" />
                                      </div>
                                      <div className="bg-gray-100 border border-gray-200">
                                        <img src={images[1]} alt="" className="w-full h-full object-cover" />
                                      </div>
                                      <div className="col-span-2 bg-gray-100 border border-gray-200 relative">
                                        <img src={images[2]} alt="" className="w-full h-full object-cover" />
                                        {images.length > 3 && (
                                          <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                                            <span className="text-white text-xs font-bold">+{images.length - 3}</span>
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  );
                                }
                                
                                // Fallback kalau ga ada gambar
                                return (
                                  <div className="w-full h-full rounded-xl bg-gray-100 border border-gray-200 flex items-center justify-center">
                                    <Package className="w-6 h-6 text-gray-400" />
                                  </div>
                                );
                              })()}
                            </div>
                            
                            <div>
                              <div className="font-semibold text-gray-900 text-sm">{product.nama}</div>
                              <code className="text-xs text-gray-500 bg-gray-50 px-2 py-0.5 rounded">{product.slug}</code>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-sm text-gray-600 font-medium">
                            {product.category?.nama || '-'}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <span className="font-bold text-[#cb5094] text-sm">
                            {formatPrice(product.hargaDasar)}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(product.status)}`}>
                            {getStatusLabel(product.status)}
                          </span>
                          {!product.aktif && (
                            <div className="mt-1 text-xs text-gray-500 font-medium">Nonaktif</div>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center justify-center gap-2">
                            <button
                              onClick={() => handleViewVariants(product.id)}
                              className="p-2 text-[#cb5094] hover:bg-pink-50 rounded-lg transition-all"
                              title="Lihat Varian"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleEdit(product)}
                              className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                              title="Edit"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDelete(product.id, product.nama)}
                              className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-all"
                              title="Hapus"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {totalPages > 1 && (
                <div className="flex justify-center items-center gap-3 p-5 border-t border-pink-100 bg-gradient-to-r from-white to-pink-50">
                  <button
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="px-4 py-2 bg-white border border-gray-200 rounded-lg disabled:opacity-40 disabled:cursor-not-allowed hover:bg-pink-50 hover:border-[#cb5094] transition-all font-semibold text-sm"
                  >
                    ← Previous
                  </button>
                  <span className="text-sm text-gray-600 font-semibold px-3">
                    {currentPage} / {totalPages}
                  </span>
                  <button
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="px-4 py-2 bg-white border border-gray-200 rounded-lg disabled:opacity-40 disabled:cursor-not-allowed hover:bg-pink-50 hover:border-[#cb5094] transition-all font-semibold text-sm"
                  >
                    Next →
                  </button>
                </div>
              )}
            </>
          )}
        </div>

        {!loading && products.length > 0 && (
          <div className="bg-white rounded-2xl p-4 text-center border border-pink-100 shadow-sm">
            <p className="text-gray-600 text-sm">
              Menampilkan <span className="font-bold text-[#cb5094]">{products.length}</span> dari{' '}
              <span className="font-bold text-[#cb5094]">{totalProducts}</span> produk
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default ProductManagement;