import React, { useState, useEffect } from "react";
import {
  X,
  Upload,
  Plus,
  Trash2,
  CheckCircle2,
  Link2,
  FileText,
  AlertCircle,
  PackageSearch,
  ChevronRight,
  Palette,
} from "lucide-react";

const AddProduct = ({ productId = null, onClose, onSuccess }) => {
  const isEdit = !!productId;

  const [formData, setFormData] = useState({
    nama: "",
    slug: "",
    deskripsi: "",
    hargaDasar: "",
    kategoriId: "",
    status: "READY",
    active: true,
  });

  const [colors, setColors] = useState(["#cb5094"]);
  const [images, setImages] = useState([]);
  const [variants, setVariants] = useState([
    { sku: "", ukuran: "", warna: "", stok: 0, hargaOverride: "" },
  ]);

  const [categories, setCategories] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [showAdvanced, setShowAdvanced] = useState(false);

  useEffect(() => {
    fetchCategories();
    if (isEdit) fetchProductDetails();
  }, [productId]);

  const fetchCategories = async () => {
    try {
      const res = await fetch("http://localhost:5000/api/categories");
      const data = await res.json();
      setCategories(Array.isArray(data) ? data : data.data || []);
    } catch (err) {
      setCategories([]);
    }
  };

  const fetchProductDetails = async () => {
    try {
      const res = await fetch(`http://localhost:5000/api/products/${productId}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      if (res.ok) {
        const p = await res.json();
        setFormData({
          nama: p.nama || "",
          slug: p.slug || "",
          deskripsi: p.deskripsi || "",
          hargaDasar: p.hargaDasar || "",
          kategoriId: p.kategori?.id || "",
          status: p.status || "READY",
          active: p.active ?? true,
        });
        
        if (p.colors && p.colors.length) {
          setColors(p.colors);
        } else if (p.warnaUtama) {
          setColors([p.warnaUtama]);
        }
        
        if (p.images && p.images.length) {
          setImages(p.images.map(url => ({ file: null, preview: url, url })));
        } else if (p.imageUrl) {
          setImages([{ file: null, preview: p.imageUrl, url: p.imageUrl }]);
        }
        
        if (p.variants?.length) {
          setVariants(
            p.variants.map((v) => ({
              sku: v.sku || "",
              ukuran: v.ukuran || "",
              warna: v.warna || "",
              stok: v.stok || 0,
              hargaOverride: v.hargaOverride || "",
            }))
          );
        }
        setShowAdvanced(true);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const generateSlug = (name) =>
    name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "")
      .replace(/-+/g, "-");

  const handleInput = (e) => {
    const { name, value, type, checked } = e.target;
    const val = type === "checkbox" ? checked : value;

    setFormData((prev) => ({ ...prev, [name]: val }));
    if (name === "nama" && !isEdit) {
      setFormData((prev) => ({ ...prev, slug: generateSlug(value) }));
    }
    setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const addColor = () => {
    setColors([...colors, "#cb5094"]);
  };

  const removeColor = (index) => {
    if (colors.length > 1) {
      setColors(colors.filter((_, i) => i !== index));
    }
  };

  const updateColor = (index, value) => {
    const newColors = [...colors];
    newColors[index] = value;
    setColors(newColors);
  };

  const handleImagesChange = (e) => {
    const files = Array.from(e.target.files);
    
    files.forEach(file => {
      if (!file.type.startsWith("image/")) {
        setErrors((prev) => ({ ...prev, image: "Harus berupa gambar" }));
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        setErrors((prev) => ({ ...prev, image: "Ukuran maksimal 5MB per gambar" }));
        return;
      }

      const preview = URL.createObjectURL(file);
      setImages(prev => [...prev, { file, preview, url: null }]);
    });
    
    setErrors((prev) => ({ ...prev, image: "" }));
  };

  const removeImage = (index) => {
    setImages(images.filter((_, i) => i !== index));
  };

  const uploadAllImages = async () => {
    const uploadedUrls = [];
    
    for (const img of images) {
      if (img.url) {
        uploadedUrls.push(img.url);
      } else if (img.file) {
        const fd = new FormData();
        fd.append("file", img.file);
        
        try {
          const res = await fetch("http://localhost:5000/api/upload/image", {
            method: "POST",
            headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
            body: fd,
          });
          if (res.ok) {
            const data = await res.json();
            uploadedUrls.push(data.imageUrl);
          }
        } catch (err) {
          console.error("Upload failed:", err);
        }
      }
    }
    
    return uploadedUrls;
  };

  const handleVariantChange = (idx, field, value) => {
    const newVariants = [...variants];
    newVariants[idx][field] = value;

    if (field === "ukuran" || field === "warna") {
      const v = newVariants[idx];
      if (v.ukuran && v.warna) {
        const base = formData.slug.toUpperCase();
        const size = v.ukuran.toUpperCase().replace(/\s/g, "");
        const color = v.warna.toUpperCase().replace(/\s/g, "");
        newVariants[idx].sku = `${base}-${size}-${color}`;
      }
    }
    setVariants(newVariants);
  };

  const addVariant = () =>
    setVariants([...variants, { sku: "", ukuran: "", warna: "", stok: 0, hargaOverride: "" }]);
  const removeVariant = (i) => variants.length > 1 && setVariants(variants.filter((_, idx) => idx !== i));

  const validate = () => {
    const err = {};
    if (!formData.nama.trim()) err.nama = "Nama produk wajib diisi";
    if (!formData.slug.trim()) err.slug = "Slug wajib diisi";
    if (!formData.deskripsi.trim()) err.deskripsi = "Deskripsi wajib diisi";
    if (!formData.hargaDasar || formData.hargaDasar <= 0) err.hargaDasar = "Harga harus > 0";
    if (!formData.kategoriId) err.kategoriId = "Pilih kategori";
    if (images.length === 0) err.image = "Minimal 1 gambar produk";

    variants.forEach((v, i) => {
      if (!v.ukuran.trim()) err[`v_${i}_ukuran`] = "Ukuran wajib";
      if (!v.warna.trim()) err[`v_${i}_warna`] = "Warna wajib";
      if (v.stok < 0) err[`v_${i}_stok`] = "Stok tidak boleh negatif";
    });

    setErrors(err);
    return Object.keys(err).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;

    setLoading(true);
    setUploading(true);
    
    try {
      const imageUrls = await uploadAllImages();

      const payload = {
        ...formData,
        hargaDasar: parseFloat(formData.hargaDasar),
        imageUrl: imageUrls[0] || "",
        images: imageUrls,
        colors: colors,
        warnaUtama: colors[0],
      };

      const method = isEdit ? "PUT" : "POST";
      const url = isEdit
        ? `http://localhost:5000/api/products/${productId}`
        : "http://localhost:5000/api/products";

      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error("Gagal menyimpan produk");

      const saved = await res.json();

      if (!isEdit) {
        for (const v of variants) {
          const variantPayload = {
            sku: v.sku,
            ukuran: v.ukuran,
            warna: v.warna,
            stok: parseInt(v.stok),
            ...(v.hargaOverride && { hargaOverride: parseFloat(v.hargaOverride) }),
            active: true,
          };
          await fetch(`http://localhost:5000/api/products/${saved.id}/variants`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
            body: JSON.stringify(variantPayload),
          });
        }
      }

      onSuccess?.();
      onClose?.();
    } catch (err) {
      setErrors((prev) => ({ ...prev, submit: "Gagal menyimpan produk" }));
    } finally {
      setLoading(false);
      setUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex justify-center items-center z-50 p-4">
      <div className="bg-white rounded-3xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        <div className="bg-gradient-to-br from-[#cb5094] to-[#e570b3] text-white px-8 py-6">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-white/20 rounded-2xl backdrop-blur-sm">
                <PackageSearch size={28} strokeWidth={2.5} />
              </div>
              <div>
                <h2 className="text-2xl font-bold">{isEdit ? "Edit Product" : "Add New Product"}</h2>
                <p className="text-white/80 text-sm mt-1">
                  {isEdit ? "Update product details" : "Create a new product"}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/20 rounded-xl transition-all"
              disabled={loading || uploading}
            >
              <X size={26} />
            </button>
          </div>
        </div>

        <div className="p-8 space-y-7 overflow-y-auto max-h-[calc(90vh-140px)]">
          
          {/* MULTI IMAGE UPLOAD */}
          <div>
            <label className="flex items-center gap-2 text-sm font-bold text-gray-800 mb-3">
              <div className="w-2 h-6 bg-gradient-to-b from-[#cb5094] to-[#e570b3] rounded-full"></div>
              Product Images <span className="text-red-500">*</span>
            </label>
            
            <div className="grid grid-cols-4 gap-4">
              {images.map((img, index) => (
                <div key={index} className="relative group">
                  <img 
                    src={img.preview} 
                    alt={`Product ${index + 1}`} 
                    className="w-full h-32 object-cover rounded-2xl shadow-lg"
                  />
                  <button
                    type="button"
                    onClick={() => removeImage(index)}
                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1.5 hover:bg-red-600 shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X size={14} />
                  </button>
                  {index === 0 && (
                    <div className="absolute bottom-2 left-2 bg-[#cb5094] text-white text-xs px-2 py-1 rounded-lg font-bold">
                      Main
                    </div>
                  )}
                </div>
              ))}
              
              <label className="flex flex-col items-center justify-center h-32 border-2 border-dashed border-gray-300 rounded-2xl cursor-pointer hover:border-[#cb5094] transition-all bg-gray-50 group">
                <Upload className="w-8 h-8 text-[#cb5094] mb-1 group-hover:scale-110 transition-transform" />
                <span className="text-xs font-bold text-[#cb5094]">Add Image</span>
                <input 
                  type="file" 
                  accept="image/*" 
                  multiple
                  onChange={handleImagesChange} 
                  className="hidden" 
                />
              </label>
            </div>
            
            {errors.image && (
              <p className="text-red-600 font-medium text-sm mt-2 flex items-center gap-1">
                <AlertCircle size={16} /> {errors.image}
              </p>
            )}
            <p className="text-xs text-gray-500 mt-2">
              Format: JPG, PNG, WebP • Max: 5MB per gambar • Gambar pertama = gambar utama
            </p>
          </div>

          {/* PRODUCT NAME */}
          <div>
            <label className="flex items-center gap-2 text-sm font-bold text-gray-800 mb-3">
              <div className="w-2 h-6 bg-gradient-to-b from-[#cb5094] to-[#e570b3] rounded-full"></div>
              Product Name <span className="text-red-500">*</span>
            </label>
            <input
              name="nama"
              value={formData.nama}
              onChange={handleInput}
              placeholder="Contoh: Jilbab Premium Silk"
              className="w-full px-6 py-4 border-2 border-gray-200 rounded-2xl focus:outline-none focus:border-[#cb5094] focus:ring-4 focus:ring-pink-100 transition-all text-base font-medium"
              disabled={loading || uploading}
            />
          </div>

          {/* MULTI COLOR PICKER - BULAT BENER! */}
          <div>
            <label className="flex items-center gap-2 text-sm font-bold text-gray-800 mb-3">
              <Palette size={18} className="text-[#cb5094]" />
              Product Colors <span className="text-red-500">*</span>
            </label>
            
            <div className="bg-gradient-to-br from-pink-50 to-purple-50 rounded-2xl p-6 border-2 border-pink-100">
              <div className="flex flex-wrap items-start gap-6 mb-2">
                {colors.map((color, index) => (
                  <div key={index} className="relative flex flex-col items-center gap-2">
                    <div className="relative group">
                      <label 
                        className="block w-20 h-20 rounded-full cursor-pointer border-4 border-white shadow-xl hover:scale-110 transition-transform overflow-hidden"
                        style={{ backgroundColor: color }}
                      >
                        <input
                          type="color"
                          value={color}
                          onChange={(e) => updateColor(index, e.target.value)}
                          className="opacity-0 w-full h-full cursor-pointer"
                        />
                      </label>
                      {colors.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeColor(index)}
                          className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1.5 hover:bg-red-600 shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X size={14} />
                        </button>
                      )}
                    </div>
                    {index === 0 && (
                      <span className="bg-[#cb5094] text-white text-xs px-3 py-1 rounded-full font-bold">
                        Main
                      </span>
                    )}
                  </div>
                ))}
                
                {/* ADD COLOR BUTTON */}
                <button
                  type="button"
                  onClick={addColor}
                  className="w-20 h-20 rounded-full border-3 border-dashed border-gray-400 flex items-center justify-center hover:border-[#cb5094] hover:bg-white transition-all group shadow-lg"
                >
                  <Plus className="text-[#cb5094] group-hover:scale-125 transition-transform" size={28} />
                </button>
              </div>
              <p className="text-xs text-gray-600 mt-4">
                ✨ Klik lingkaran warna untuk mengubah • Warna pertama = warna utama produk
              </p>
            </div>
          </div>

          {/* ADVANCED SETTINGS TOGGLE */}
          <button
            type="button"
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="flex items-center gap-3 text-[#cb5094] font-bold hover:text-[#e570b3] transition-all group"
          >
            <ChevronRight
              size={22}
              className={`transition-transform duration-300 group-hover:translate-x-1 ${showAdvanced ? "rotate-90" : ""}`}
            />
            <span>{showAdvanced ? "Hide" : "Show"} Advanced Settings</span>
          </button>

          {showAdvanced && (
            <div className="space-y-6 pt-4 border-t border-gray-100">
              <div>
                <label className="flex items-center gap-2 text-sm font-bold text-gray-800 mb-3">
                  <Link2 size={18} className="text-[#cb5094]" />
                  URL Slug <span className="text-red-500">*</span>
                </label>
                <input
                  name="slug"
                  value={formData.slug}
                  onChange={handleInput}
                  placeholder="jilbab-premium-silk"
                  className="w-full px-6 py-4 border-2 border-gray-200 rounded-2xl font-mono text-sm bg-gray-50 focus:outline-none focus:border-[#cb5094] focus:ring-4 focus:ring-pink-100 transition-all"
                  disabled={isEdit || loading || uploading}
                />
                <p className="text-xs text-gray-500 mt-2">Auto-generated • SEO friendly</p>
              </div>
            </div>
          )}

          {/* DESCRIPTION */}
          <div>
            <label className="flex items-center gap-2 text-sm font-bold text-gray-800 mb-3">
              <FileText size={18} className="text-[#cb5094]" />
              Description <span className="text-red-500">*</span>
            </label>
            <textarea
              name="deskripsi"
              value={formData.deskripsi}
              onChange={handleInput}
              rows={5}
              placeholder="Jelaskan produk ini dengan detail..."
              className="w-full px-6 py-4 border-2 border-gray-200 rounded-2xl focus:outline-none focus:border-[#cb5094] focus:ring-4 focus:ring-pink-100 transition-all resize-none font-medium"
              disabled={loading || uploading}
            />
          </div>

          {/* PRICING & CATEGORY */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-bold text-gray-800 mb-3">Base Price (Rp) <span className="text-red-500">*</span></label>
              <input
                type="number"
                name="hargaDasar"
                value={formData.hargaDasar}
                onChange={handleInput}
                placeholder="125000"
                className="w-full px-6 py-4 border-2 border-gray-200 rounded-2xl focus:outline-none focus:border-[#cb5094] focus:ring-4 focus:ring-pink-100 transition-all"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-800 mb-3">Category <span className="text-red-500">*</span></label>
              <select
                name="kategoriId"
                value={formData.kategoriId}
                onChange={handleInput}
                className="w-full px-6 py-4 border-2 border-gray-200 rounded-2xl focus:outline-none focus:border-[#cb5094] focus:ring-4 focus:ring-pink-100 transition-all cursor-pointer text-base"
              >
                <option value="">Pilih Kategori</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>{c.nama || c.name}</option>
                ))}
              </select>
            </div>
          </div>

          {/* ACTIVE STATUS */}
          <div className="bg-gradient-to-br from-pink-50 to-purple-50 rounded-3xl p-6 border-2 border-pink-100">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-4">
                <div className={`p-3 rounded-2xl ${formData.active ? 'bg-green-500 shadow-lg shadow-green-200' : 'bg-gray-300'}`}>
                  <CheckCircle2 size={28} className="text-white" />
                </div>
                <div>
                  <div className="font-bold text-gray-800">Product Status</div>
                  <div className="text-sm text-gray-600">
                    {formData.active ? "Active • Tampil di toko" : "Inactive • Disembunyikan"}
                  </div>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  name="active"
                  checked={formData.active}
                  onChange={handleInput}
                  className="sr-only peer"
                  disabled={loading || uploading}
                />
                <div className="w-16 h-8 bg-gray-300 rounded-full peer peer-focus:ring-4 peer-focus:ring-pink-200 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-1 after:left-1 after:bg-white after:rounded-full after:h-7 after:w-7 after:transition-all peer-checked:bg-gradient-to-r peer-checked:from-[#cb5094] peer-checked:to-[#e570b3]"></div>
              </label>
            </div>
          </div>

          {/* VARIANTS */}
          {!isEdit && (
            <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-3xl p-6 border-2 border-purple-100">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-gray-800">Product Variants</h3>
                <button
                  type="button"
                  onClick={addVariant}
                  className="flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-[#cb5094] to-[#e570b3] text-white rounded-2xl font-bold hover:shadow-xl transition-all"
                >
                  <Plus size={20} /> Tambah Variant
                </button>
              </div>

              <div className="space-y-5">
                {variants.map((v, i) => (
                  <div key={i} className="bg-white rounded-2xl p-6 border-2 border-gray-200 shadow-sm">
                    <div className="flex justify-between items-center mb-4">
                      <span className="text-sm font-bold bg-purple-100 text-purple-800 px-4 py-2 rounded-full">Variant {i + 1}</span>
                      {variants.length > 1 && (
                        <button type="button" onClick={() => removeVariant(i)} className="p-2 text-red-600 hover:bg-red-50 rounded-xl transition-all">
                          <Trash2 size={20} />
                        </button>
                      )}
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                      <input placeholder="Ukuran" value={v.ukuran} onChange={(e) => handleVariantChange(i, "ukuran", e.target.value)} className="px-5 py-4 border-2 border-gray-200 rounded-xl focus:border-[#cb5094] transition-all" />
                      <input placeholder="Warna" value={v.warna} onChange={(e) => handleVariantChange(i, "warna", e.target.value)} className="px-5 py-4 border-2 border-gray-200 rounded-xl focus:border-[#cb5094] transition-all" />
                      <input placeholder="SKU (auto)" value={v.sku} readOnly className="px-5 py-4 border-2 border-gray-200 rounded-xl bg-gray-50 text-gray-500 font-mono text-sm" />
                      <input type="number" placeholder="Stok" value={v.stok} onChange={(e) => handleVariantChange(i, "stok", e.target.value)} className="px-5 py-4 border-2 border-gray-200 rounded-xl focus:border-[#cb5094] transition-all" />
                      <input type="number" placeholder="Harga Khusus" value={v.hargaOverride} onChange={(e) => handleVariantChange(i, "hargaOverride", e.target.value)} className="px-5 py-4 border-2 border-gray-200 rounded-xl focus:border-[#cb5094] transition-all" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {errors.submit && (
            <div className="flex items-center gap-3 p-5 bg-red-50 border-2 border-red-200 rounded-2xl">
              <AlertCircle className="text-red-600" size={22} />
              <p className="text-red-600 font-bold">{errors.submit}</p>
            </div>
          )}

          {/* ACTION BUTTONS */}
          <div className="flex gap-4 pt-6">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-4 border-2 border-gray-300 text-gray-700 rounded-2xl font-bold hover:bg-gray-50 transition-all"
              disabled={loading || uploading}
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={loading || uploading}
              className="flex-1 py-4 bg-gradient-to-r from-[#cb5094] to-[#e570b3] text-white rounded-2xl font-bold hover:shadow-2xl hover:shadow-pink-400/50 transition-all disabled:opacity-60 flex items-center justify-center gap-3"
            >
              {loading || uploading ? (
                <>
                  <div className="w-5 h-5 border-3 border-white border-t-transparent rounded-full animate-spin"></div>
                  Menyimpan...
                </>
              ) : (
                <>
                  <CheckCircle2 size={22} />
                  {isEdit ? "Update Product" : "Create Product"}
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddProduct;