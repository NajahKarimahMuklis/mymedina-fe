import React, { useState, useEffect } from "react";
import { X, Link2, FileText, FolderTree, CheckCircle2, ChevronRight } from "lucide-react";

const AddCategory = ({ isOpen, onClose, editData, categories, onSuccess }) => {
  const [formData, setFormData] = useState({
    nama: "",
    slug: "",
    deskripsi: "",
    parentId: "",
    active: true,
  });
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isEditMode = !!editData;

  useEffect(() => {
    if (editData) {
      setFormData({
        nama: editData.nama || "",
        slug: editData.slug || "",
        deskripsi: editData.deskripsi || "",
        parentId: editData.parent?.id || "",
        active: editData.active ?? true,
      });
      setShowAdvanced(true); // biar langsung keliatan pas edit
    } else {
      setFormData({ nama: "", slug: "", deskripsi: "", parentId: "", active: true });
      setShowAdvanced(false);
    }
  }, [editData, isOpen]);

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

    if (name === "nama" && !isEditMode && !formData.slug) {
      setFormData((prev) => ({ ...prev, slug: generateSlug(value) }));
    }
  };

  const handleSubmit = async () => {
    if (!formData.nama.trim()) return alert("Nama kategori wajib diisi!");
    if (!formData.slug.trim()) return alert("Slug wajib diisi!");

    try {
      setIsSubmitting(true);

      const token = localStorage.getItem("accessToken") || localStorage.getItem("token");
      if (!token) {
        alert("Sesi habis! Login ulang yuk");
        window.location.href = "/login";
        return;
      }

      const method = isEditMode ? "PUT" : "POST";
      const url = isEditMode
        ? `http://localhost:5000/api/categories/${editData.id}`
        : "http://localhost:5000/api/categories";

      const payload = {
        nama: formData.nama.trim(),
        slug: formData.slug.trim(),
        description: formData.deskripsi.trim() || null,
        parentId: formData.parentId || null,
        active: formData.active,
      };

      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        onSuccess();
        onClose();
      } else {
        const err = await res.json().catch(() => ({}));
        alert(err.message || "Gagal menyimpan kategori.");
      }
    } catch (error) {
      alert("Jaringan error. Coba lagi ya.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  // Filter parent categories (hanya yang bukan dirinya sendiri & bukan anaknya)
  const availableParents = categories.filter(
    (cat) => cat.id !== editData?.id && cat.parent?.id !== editData?.id
  );

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex justify-center items-center z-50 p-4">
      <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
        {/* HEADER */}
        <div className="bg-gradient-to-br from-[#cb5094] to-[#e570b3] text-white px-8 py-6">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-white/20 rounded-2xl backdrop-blur-sm">
                <FolderTree size={28} strokeWidth={2.5} />
              </div>
              <div>
                <h2 className="text-2xl font-bold">{isEditMode ? "Edit Category" : "Add New Category"}</h2>
                <p className="text-white/80 text-sm mt-1">
                  {isEditMode ? "Update category details" : "Create a new product category"}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/20 rounded-xl transition-all"
              disabled={isSubmitting}
            >
              <X size={26} />
            </button>
          </div>
        </div>

        {/* BODY */}
        <div className="p-8 space-y-7 overflow-y-auto max-h-[calc(90vh-140px)]">
          {/* Nama Kategori */}
          <div>
            <label className="flex items-center gap-2 text-sm font-bold text-gray-800 mb-3">
              <div className="w-2 h-6 bg-gradient-to-b from-[#cb5094] to-[#e570b3] rounded-full"></div>
              Category Name <span className="text-red-500">*</span>
            </label>
            <input
              name="nama"
              value={formData.nama}
              onChange={handleInput}
              placeholder="Contoh: Jilbab Premium"
              className="w-full px-6 py-4 border-2 border-gray-200 rounded-2xl focus:outline-none focus:border-[#cb5094] focus:ring-4 focus:ring-pink-100 transition-all text-base font-medium"
              disabled={isSubmitting}
            />
          </div>

          {/* Advanced Settings Toggle — SEKARANG PAKE PANAH ASLI! */}
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

          {/* Advanced Fields */}
          {showAdvanced && (
            <div className="space-y-6 pt-4 border-t border-gray-100 animate-in fade-in slide-in-from-top-4 duration-300">
              {/* Parent Category */}
              <div>
                <label className="flex items-center gap-2 text-sm font-bold text-gray-800 mb-3">
                  <FolderTree size={18} className="text-[#cb5094]" />
                  Parent Category
                </label>
                <select
                  name="parentId"
                  value={formData.parentId}
                  onChange={handleInput}
                  className="w-full px-6 py-4 border-2 border-gray-200 rounded-2xl focus:outline-none focus:border-[#cb5094] focus:ring-4 focus:ring-pink-100 transition-all text-base"
                  disabled={isSubmitting}
                >
                  <option value="">None (Root Category)</option>
                  {availableParents.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.nama}
                    </option>
                  ))}
                </select>
              </div>

              {/* Slug */}
              <div>
                <label className="flex items-center gap-2 text-sm font-bold text-gray-800 mb-3">
                  <Link2 size={18} className="text-[#cb5094]" />
                  URL Slug <span className="text-red-500">*</span>
                </label>
                <input
                  name="slug"
                  value={formData.slug}
                  onChange={handleInput}
                  placeholder="jilbab-premium"
                  className="w-full px-6 py-4 border-2 border-gray-200 rounded-2xl font-mono text-sm bg-gray-50 focus:outline-none focus:border-[#cb5094] focus:ring-4 focus:ring-pink-100 transition-all"
                  disabled={isEditMode || isSubmitting}
                />
                <p className="text-xs text-gray-500 mt-2 flex items-center gap-1">
                  <CheckCircle2 size={14} /> Auto-generated • SEO friendly
                </p>
              </div>
            </div>
          )}

          {/* Deskripsi */}
          <div>
            <label className="flex items-center gap-2 text-sm font-bold text-gray-800 mb-3">
              <FileText size={18} className="text-[#cb5094]" />
              Description <span className="text-gray-400">(optional)</span>
            </label>
            <textarea
              name="deskripsi"
              value={formData.deskripsi}
              onChange={handleInput}
              placeholder="Jelaskan kategori ini agar customer lebih paham..."
              rows={4}
              className="w-full px-6 py-4 border-2 border-gray-200 rounded-2xl focus:outline-none focus:border-[#cb5094] focus:ring-4 focus:ring-pink-100 transition-all resize-none font-medium"
              disabled={isSubmitting}
            />
          </div>

          {/* Status Aktif */}
          <div className="bg-gradient-to-br from-pink-50 to-purple-50 rounded-3xl p-6 border-2 border-pink-100">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-4">
                <div className={`p-3 rounded-2xl ${formData.active ? 'bg-green-500 shadow-lg shadow-green-200' : 'bg-gray-300'}`}>
                  <CheckCircle2 size={28} className="text-white" />
                </div>
                <div>
                  <div className="font-bold text-gray-800">Category Status</div>
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
                  disabled={isSubmitting}
                />
                <div className="w-16 h-8 bg-gray-300 rounded-full peer peer-focus:ring-4 peer-focus:ring-pink-200 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-1 after:left-1 after:bg-white after:rounded-full after:h-7 after:w-7 after:transition-all peer-checked:bg-gradient-to-r peer-checked:from-[#cb5094] peer-checked:to-[#e570b3]"></div>
              </label>
            </div>
          </div>

          {/* Buttons */}
          <div className="flex gap-4 pt-6">
            <button
              onClick={onClose}
              className="flex-1 py-4 border-2 border-gray-300 text-gray-700 rounded-2xl font-bold hover:bg-gray-50 transition-all"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="flex-1 py-4 bg-gradient-to-r from-[#cb5094] to-[#e570b3] text-white rounded-2xl font-bold hover:shadow-2xl hover:shadow-pink-400/50 transition-all disabled:opacity-60 flex items-center justify-center gap-3"
            >
              {isSubmitting ? (
                <>
                  <div className="w-5 h-5 border-3 border-white border-t-transparent rounded-full animate-spin"></div>
                  Menyimpan...
                </>
              ) : (
                <>
                  <CheckCircle2 size={22} />
                  {isEditMode ? "Update Category" : "Create Category"}
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddCategory;