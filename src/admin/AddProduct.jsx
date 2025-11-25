import React, { useState, useEffect } from 'react';
import { Upload, X, Plus, Trash2, Save } from 'lucide-react';

const AddProduct = ({ productId = null, onClose, onSuccess }) => {
  const isEdit = !!productId;
  
  const [formData, setFormData] = useState({
    nama: '',
    slug: '',
    deskripsi: '',
    hargaDasar: '',
    berat: '',
    kategoriId: '',
    status: 'READY',
    active: true,
    imageUrl: ''
  });

  const [variants, setVariants] = useState([
    { sku: '', ukuran: '', warna: '', stok: 0, hargaOverride: '' }
  ]);

  const [categories, setCategories] = useState([]);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState('');
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    fetchCategories();
    if (isEdit) {
      fetchProductDetails();
    }
  }, [productId]);

  const fetchCategories = async () => {
    try {
      const response = await fetch("http://localhost:5000/api/categories");
      const data = await response.json();
  
      if (Array.isArray(data)) {
        setCategories(data);
      } else if (Array.isArray(data.data)) {
        setCategories(data.data);
      } else if (Array.isArray(data.categories)) {
        setCategories(data.categories);
      } else {
        setCategories([]);
      }
    } catch (error) {
      console.error("Error fetching categories:", error);
      setCategories([]);
    }
  };  

  const fetchProductDetails = async () => {
    try {
      const response = await fetch(`http://localhost:5000/api/products/${productId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        const product = await response.json();
        setFormData({
          nama: product.nama,
          slug: product.slug,
          deskripsi: product.deskripsi,
          hargaDasar: product.hargaDasar,
          berat: product.berat,
          kategoriId: product.kategori.id,
          status: product.status,
          active: product.active,
          imageUrl: product.imageUrl || ''
        });
        setImagePreview(product.imageUrl || '');
        
        if (product.variants && product.variants.length > 0) {
          setVariants(product.variants.map(v => ({
            sku: v.sku,
            ukuran: v.ukuran,
            warna: v.warna,
            stok: v.stok,
            hargaOverride: v.hargaOverride || ''
          })));
        }
      }
    } catch (error) {
      console.error('Error fetching product:', error);
    }
  };

  const generateSlug = (name) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));

    if (name === 'nama' && !isEdit) {
      setFormData(prev => ({
        ...prev,
        slug: generateSlug(value)
      }));
    }

    setErrors(prev => ({ ...prev, [name]: '' }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        setErrors(prev => ({ ...prev, image: 'File harus berupa gambar' }));
        return;
      }

      if (file.size > 5 * 1024 * 1024) {
        setErrors(prev => ({ ...prev, image: 'Ukuran file maksimal 5MB' }));
        return;
      }

      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
      setErrors(prev => ({ ...prev, image: '' }));
    }
  };

  const uploadImage = async () => {
    if (!imageFile) return formData.imageUrl;

    try {
      setUploading(true);
      const formDataUpload = new FormData();
      formDataUpload.append('file', imageFile);

      const response = await fetch('http://localhost:5000/api/upload/image', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: formDataUpload
      });

      if (response.ok) {
        const data = await response.json();
        return data.imageUrl;
      }
      throw new Error('Upload gagal');
    } catch (error) {
      console.error('Error uploading image:', error);
      setErrors(prev => ({ ...prev, image: 'Gagal upload gambar' }));
      return formData.imageUrl;
    } finally {
      setUploading(false);
    }
  };

  const handleVariantChange = (index, field, value) => {
    const newVariants = [...variants];
    newVariants[index][field] = value;

    if (field === 'ukuran' || field === 'warna') {
      const variant = newVariants[index];
      if (variant.ukuran && variant.warna) {
        const baseSku = formData.slug.toUpperCase();
        const sizePart = variant.ukuran.toUpperCase().replace(/\s/g, '');
        const colorPart = variant.warna.toUpperCase().replace(/\s/g, '');
        newVariants[index].sku = `${baseSku}-${sizePart}-${colorPart}`;
      }
    }

    setVariants(newVariants);
  };

  const addVariant = () => {
    setVariants([...variants, { sku: '', ukuran: '', warna: '', stok: 0, hargaOverride: '' }]);
  };

  const removeVariant = (index) => {
    if (variants.length > 1) {
      setVariants(variants.filter((_, i) => i !== index));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.nama.trim()) newErrors.nama = 'Nama produk wajib diisi';
    if (!formData.slug.trim()) newErrors.slug = 'Slug wajib diisi';
    if (!formData.deskripsi.trim()) newErrors.deskripsi = 'Deskripsi wajib diisi';
    if (!formData.hargaDasar || formData.hargaDasar <= 0) newErrors.hargaDasar = 'Harga harus lebih dari 0';
    if (!formData.berat || formData.berat <= 0) newErrors.berat = 'Berat harus lebih dari 0';
    if (!formData.kategoriId) newErrors.kategoriId = 'Kategori wajib dipilih';

    variants.forEach((variant, index) => {
      if (!variant.ukuran.trim()) newErrors[`variant_${index}_ukuran`] = 'Ukuran wajib diisi';
      if (!variant.warna.trim()) newErrors[`variant_${index}_warna`] = 'Warna wajib diisi';
      if (variant.stok < 0) newErrors[`variant_${index}_stok`] = 'Stok tidak boleh negatif';
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      let imageUrl = formData.imageUrl;
      if (imageFile) {
        imageUrl = await uploadImage();
      }

      const productData = {
        nama: formData.nama,
        slug: formData.slug,
        deskripsi: formData.deskripsi,
        hargaDasar: parseFloat(formData.hargaDasar),
        berat: parseInt(formData.berat),
        kategoriId: formData.kategoriId,
        status: formData.status,
        active: formData.active,
        imageUrl: imageUrl
      };

      const productResponse = await fetch(
        isEdit ? `http://localhost:5000/api/products/${productId}` : 'http://localhost:5000/api/products',
        {
          method: isEdit ? 'PUT' : 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
          body: JSON.stringify(productData)
        }
      );

      if (!productResponse.ok) {
        throw new Error('Gagal menyimpan produk');
      }

      const savedProduct = await productResponse.json();

      if (!isEdit) {
        for (const variant of variants) {
          const variantData = {
            sku: variant.sku,
            ukuran: variant.ukuran,
            warna: variant.warna,
            stok: parseInt(variant.stok),
            ...(variant.hargaOverride && { hargaOverride: parseFloat(variant.hargaOverride) }),
            active: true
          };

          await fetch(`http://localhost:5000/api/products/${savedProduct.id}/variants`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify(variantData)
          });
        }
      }

      if (onSuccess) onSuccess();
      if (onClose) onClose();

    } catch (error) {
      console.error('Error saving product:', error);
      setErrors(prev => ({ ...prev, submit: 'Gagal menyimpan produk. Silakan coba lagi.' }));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-[#cb5094]">
          {isEdit ? 'Edit Produk' : 'Tambah Produk Baru'}
        </h2>
        {onClose && (
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X className="w-6 h-6" />
          </button>
        )}
      </div>

      <div className="space-y-6">
        {/* Image Upload */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Gambar Produk
          </label>
          <div className="flex items-start gap-4">
            <div className="relative">
              {imagePreview ? (
                <div className="relative">
                  <img
                    src={imagePreview}
                    alt="Preview"
                    className="w-32 h-32 object-cover rounded-lg border-2 border-gray-300"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setImagePreview('');
                      setImageFile(null);
                      setFormData(prev => ({ ...prev, imageUrl: '' }));
                    }}
                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <label className="flex flex-col items-center justify-center w-32 h-32 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-[#cb5094] transition-colors">
                  <Upload className="w-8 h-8 text-gray-400 mb-2" />
                  <span className="text-xs text-gray-500">Upload</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="hidden"
                  />
                </label>
              )}
            </div>
            <div className="text-sm text-gray-500">
              <p>Format: JPG, PNG, WebP</p>
              <p>Ukuran maksimal: 5MB</p>
              <p>Rekomendasi: 1000x1000 px</p>
            </div>
          </div>
          {errors.image && <p className="text-red-500 text-sm mt-1">{errors.image}</p>}
        </div>

        {/* Basic Info */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nama Produk <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="nama"
              value={formData.nama}
              onChange={handleInputChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#cb5094] focus:border-transparent"
              placeholder="Contoh: Hijab Premium Silk"
            />
            {errors.nama && <p className="text-red-500 text-sm mt-1">{errors.nama}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Slug <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="slug"
              value={formData.slug}
              onChange={handleInputChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#cb5094] focus:border-transparent"
              placeholder="hijab-premium-silk"
            />
            {errors.slug && <p className="text-red-500 text-sm mt-1">{errors.slug}</p>}
          </div>
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Deskripsi <span className="text-red-500">*</span>
          </label>
          <textarea
            name="deskripsi"
            value={formData.deskripsi}
            onChange={handleInputChange}
            rows={4}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#cb5094] focus:border-transparent"
            placeholder="Deskripsikan produk Anda..."
          />
          {errors.deskripsi && <p className="text-red-500 text-sm mt-1">{errors.deskripsi}</p>}
        </div>

        {/* Price and Weight */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Harga Dasar (Rp) <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              name="hargaDasar"
              value={formData.hargaDasar}
              onChange={handleInputChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#cb5094] focus:border-transparent"
              placeholder="125000"
            />
            {errors.hargaDasar && <p className="text-red-500 text-sm mt-1">{errors.hargaDasar}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Berat (gram) <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              name="berat"
              value={formData.berat}
              onChange={handleInputChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#cb5094] focus:border-transparent"
              placeholder="500"
            />
            {errors.berat && <p className="text-red-500 text-sm mt-1">{errors.berat}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Kategori <span className="text-red-500">*</span>
            </label>
            <select
              name="kategoriId"
              value={formData.kategoriId}
              onChange={handleInputChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#cb5094] focus:border-transparent"
            >
              <option value="">Pilih Kategori</option>
              {categories.map(cat => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>
            {errors.kategoriId && <p className="text-red-500 text-sm mt-1">{errors.kategoriId}</p>}
          </div>
        </div>

        {/* Status and Active */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Status Produk
            </label>
            <select
              name="status"
              value={formData.status}
              onChange={handleInputChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#cb5094] focus:border-transparent"
            >
              <option value="READY">Ready Stock</option>
              <option value="PO">Pre-Order</option>
              <option value="DISCONTINUED">Discontinued</option>
            </select>
          </div>

          <div className="flex items-center pt-8">
            <input
              type="checkbox"
              name="active"
              checked={formData.active}
              onChange={handleInputChange}
              className="w-4 h-4 text-[#cb5094] border-gray-300 rounded focus:ring-[#cb5094]"
            />
            <label className="ml-2 text-sm font-medium text-gray-700">
              Aktif (Tampilkan di katalog)
            </label>
          </div>
        </div>

        {/* Variants */}
        {!isEdit && (
          <div className="border-t pt-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Varian Produk</h3>
              <button
                type="button"
                onClick={addVariant}
                className="flex items-center gap-2 px-4 py-2 bg-[#cb5094] text-white rounded-lg hover:bg-[#cb5094] transition-colors"
              >
                <Plus className="w-4 h-4" />
                Tambah Varian
              </button>
            </div>

            <div className="space-y-4">
              {variants.map((variant, index) => (
                <div key={index} className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <div className="flex items-start justify-between mb-3">
                    <span className="text-sm font-medium text-gray-700">Varian {index + 1}</span>
                    {variants.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeVariant(index)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3">
                    <div>
                      <input
                        type="text"
                        placeholder="Ukuran (M, L, XL)"
                        value={variant.ukuran}
                        onChange={(e) => handleVariantChange(index, 'ukuran', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#cb5094] focus:border-transparent"
                      />
                      {errors[`variant_${index}_ukuran`] && (
                        <p className="text-red-500 text-xs mt-1">{errors[`variant_${index}_ukuran`]}</p>
                      )}
                    </div>

                    <div>
                      <input
                        type="text"
                        placeholder="Warna"
                        value={variant.warna}
                        onChange={(e) => handleVariantChange(index, 'warna', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#cb5094] focus:border-transparent"
                      />
                      {errors[`variant_${index}_warna`] && (
                        <p className="text-red-500 text-xs mt-1">{errors[`variant_${index}_warna`]}</p>
                      )}
                    </div>

                    <div>
                      <input
                        type="text"
                        placeholder="SKU (auto)"
                        value={variant.sku}
                        onChange={(e) => handleVariantChange(index, 'sku', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100"
                        readOnly
                      />
                    </div>

                    <div>
                      <input
                        type="number"
                        placeholder="Stok"
                        value={variant.stok}
                        onChange={(e) => handleVariantChange(index, 'stok', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#cb5094] focus:border-transparent"
                      />
                      {errors[`variant_${index}_stok`] && (
                        <p className="text-red-500 text-xs mt-1">{errors[`variant_${index}_stok`]}</p>
                      )}
                    </div>

                    <div>
                      <input
                        type="number"
                        placeholder="Harga Override"
                        value={variant.hargaOverride}
                        onChange={(e) => handleVariantChange(index, 'hargaOverride', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#cb5094] focus:border-transparent"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Error Message */}
        {errors.submit && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-600 text-sm">{errors.submit}</p>
          </div>
        )}

        {/* Submit Buttons */}
        <div className="flex items-center justify-end gap-3 pt-6 border-t">
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Batal
            </button>
          )}
          <button
            type="button"
            onClick={handleSubmit}
            disabled={loading || uploading}
            className="flex items-center gap-2 px-6 py-2 bg-[#cb5094] text-white rounded-lg hover:bg-[#cb5094] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading || uploading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                {uploading ? 'Uploading...' : 'Menyimpan...'}
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                {isEdit ? 'Update Produk' : 'Simpan Produk'}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AddProduct;