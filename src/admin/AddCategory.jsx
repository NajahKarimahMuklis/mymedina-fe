import React, { useState, useEffect } from "react";
import { X } from "lucide-react";

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

  // Populate form when editing
  useEffect(() => {
    if (editData) {
      setFormData({
        nama: editData.nama || "",
        slug: editData.slug || "",
        deskripsi: editData.deskripsi || "",
        parentId: editData.parent?.id || "",
        active: editData.active ?? true,
      });
    } else {
      // Reset form when adding new
      setFormData({
        nama: "",
        slug: "",
        deskripsi: "",
        parentId: "",
        active: true,
      });
    }
    setShowAdvanced(false);
  }, [editData, isOpen]);

  // Auto generate slug
  const generateSlug = (name) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");
  };

  // Handle input changes
  const handleInput = (e) => {
    const { name, value, type, checked } = e.target;
    const val = type === "checkbox" ? checked : value;

    setFormData((prev) => ({
      ...prev,
      [name]: val,
    }));

    // Auto-generate slug only when creating (not editing)
    if (name === "nama" && !isEditMode) {
      setFormData((prev) => ({
        ...prev,
        slug: generateSlug(value),
      }));
    }
  };

  // Submit category
  const handleSubmit = async () => {
    // Validation
    if (!formData.nama.trim()) {
      alert("Nama kategori wajib diisi!");
      return;
    }
    if (!formData.slug.trim()) {
      alert("URL Slug wajib diisi!");
      return;
    }

    try {
      setIsSubmitting(true);
      const method = isEditMode ? "PUT" : "POST";
      const url = isEditMode
        ? `http://localhost:5000/api/categories/${editData.id}`
        : "http://localhost:5000/api/categories";

      const payload = {
        name: formData.nama.trim(),
        slug: formData.slug.trim(),
        description: formData.deskripsi.trim(),
        parentId: formData.parentId || null,
        active: formData.active,
      };

      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        onSuccess(); // Callback to refresh parent data
        onClose(); // Close modal
      } else {
        let errText = "Gagal menyimpan kategori.";
        try {
          const errJson = await res.json();
          if (errJson?.message) errText = errJson.message;
        } catch {}
        alert(errText);
      }
    } catch (error) {
      console.error("Error saving category:", error);
      alert("Terjadi kesalahan saat menyimpan kategori.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* MODAL HEADER */}
        <div className="sticky top-0 bg-gradient-to-r from-[#cb5094] to-[#d66ba8] text-white p-6 rounded-t-2xl">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold">
              {isEditMode ? "Edit Kategori" : "Tambah Kategori Baru"}
            </h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/20 rounded-lg transition-colors"
              disabled={isSubmitting}
            >
              <X size={24} />
            </button>
          </div>
        </div>

        {/* MODAL BODY */}
        <div className="p-6 space-y-5">
          {/* Nama Kategori */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Nama Kategori <span className="text-red-500">*</span>
            </label>
            <input
              name="nama"
              value={formData.nama}
              onChange={handleInput}
              placeholder="Contoh: Pakaian Muslim"
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#cb5094] focus:border-transparent"
              disabled={isSubmitting}
            />
          </div>

          {/* Toggle for advanced (slug) */}
          <div>
            <button
              type="button"
              onClick={() => setShowAdvanced((s) => !s)}
              className="text-sm text-blue-600 underline hover:text-blue-800"
              disabled={isSubmitting}
            >
              {showAdvanced ? "Sembunyikan Pengaturan Lanjut" : "Pengaturan Lanjut"}
            </button>
          </div>

          {/* URL Slug (hidden until toggle) */}
          {showAdvanced && (
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                URL Slug <span className="text-red-500">*</span>
              </label>
              <input
                name="slug"
                value={formData.slug}
                onChange={handleInput}
                placeholder="pakaian-muslim"
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#cb5094] focus:border-transparent font-mono text-sm"
                disabled={isEditMode || isSubmitting}
              />
              <p className="text-xs text-gray-500 mt-1">
                URL ramah SEO (otomatis diisi dari nama).{" "}
                {isEditMode ? "Slug dikunci saat edit untuk mencegah perubahan URL." : ""}
              </p>
            </div>
          )}

          {/* Deskripsi */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Deskripsi Kategori
            </label>
            <textarea
              name="deskripsi"
              value={formData.deskripsi}
              onChange={handleInput}
              placeholder="Jelaskan kategori ini..."
              rows={3}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#cb5094] focus:border-transparent resize-none"
              disabled={isSubmitting}
            />
          </div>

          {/* Kategori Induk */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Kategori Induk (Opsional)
            </label>
            <select
              name="parentId"
              value={formData.parentId}
              onChange={handleInput}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#cb5094] focus:border-transparent"
              disabled={isSubmitting}
            >
              <option value="">Tidak ada (Kategori Utama)</option>
              {categories
                .filter((c) => c.id !== editData?.id)
                .map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nama}
                  </option>
                ))}
            </select>
            <p className="text-xs text-gray-500 mt-1">
              Pilih kategori induk jika ini sub-kategori
            </p>
          </div>

          {/* Status Aktif */}
          <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl">
            <input
              type="checkbox"
              name="active"
              checked={formData.active}
              onChange={handleInput}
              className="w-5 h-5 text-[#cb5094] rounded focus:ring-[#cb5094]"
              disabled={isSubmitting}
            />
            <label className="text-sm font-medium text-gray-700">
              Kategori Aktif (Tampilkan di toko)
            </label>
          </div>

          {/* SUBMIT BUTTON */}
          <button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="w-full py-4 bg-gradient-to-r from-[#cb5094] to-[#d66ba8] text-white rounded-xl font-semibold hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting
              ? "Menyimpan..."
              : isEditMode
              ? "Perbarui Kategori"
              : "Simpan Kategori"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AddCategory;