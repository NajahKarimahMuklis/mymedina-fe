import React, { useEffect, useMemo, useState } from "react";
import {
  Plus,
  Trash2,
  Edit3,
  Filter,
  Search,
  Tag,
  FolderTree,
  ToggleLeft,
  ToggleRight,
} from "lucide-react";
import AddCategory from "./AddCategory";

const Category = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);

  const [modalOpen, setModalOpen] = useState(false);
  const [editData, setEditData] = useState(null);

  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [filterOpen, setFilterOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  // parentFilter values:
  // - "all" => show all
  // - "no-parent" => show categories with parent === null
  // - "<parentId>" => show categories whose parent.id === parentId
  const [parentFilter, setParentFilter] = useState("all");

  // ============================
  // FETCH CATEGORIES
  // ============================
  const fetchCategories = async () => {
    try {
      setLoading(true);
      const res = await fetch("http://localhost:5000/api/categories");
      const data = await res.json();
      const result = Array.isArray(data) ? data : data.data ?? [];

      // Map backend fields (name, description, parent) -> UI fields (nama, deskripsi, parent.nama)
      const mapped = result.map((item) => ({
        id: item.id,
        nama: item.name,
        slug: item.slug,
        deskripsi: item.description || "",
        parent: item.parent
          ? { id: item.parent.id ?? item.parentId, nama: item.parent.name }
          : null,
        active: item.active ?? true,
      }));

      setCategories(mapped);
    } catch (err) {
      console.error("Fetch category failed:", err);
      setCategories([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  // ============================
  // derive parent categories list (unique)
  // ============================
  const parentCategories = useMemo(() => {
    // Parents are categories that have parent === null (i.e., root categories)
    // Use their id and nama for buttons
    const parents = categories.filter((c) => c.parent === null);
    // Remove duplicates by id just in case
    const unique = [];
    const seen = new Set();
    for (const p of parents) {
      if (!seen.has(p.id)) {
        seen.add(p.id);
        unique.push({ id: p.id, nama: p.nama });
      }
    }
    return unique;
  }, [categories]);

  // ============================
  // FILTER & SEARCH (parent-based)
  // ============================
  const filteredCategories = categories.filter((cat) => {
    const matchesSearch = cat.nama
      .toLowerCase()
      .includes(searchTerm.toLowerCase());

    const matchesParent =
      parentFilter === "all"
        ? true
        : parentFilter === "no-parent"
        ? cat.parent === null
        : // parentFilter holds parentId (as number or string). Compare loosely to allow number/string.
          String(cat.parent?.id) === String(parentFilter);

    return matchesSearch && matchesParent;
  });

  // ============================
  // MODAL HANDLERS
  // ============================
  const openAdd = () => {
    setEditData(null);
    setModalOpen(true);
  };

  const openEdit = (cat) => {
    setEditData(cat);
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditData(null);
  };

  const handleSuccess = () => {
    fetchCategories();
  };

  // ============================
  // DELETE
  // ============================
  const deleteCategory = async () => {
    try {
      const res = await fetch(
        `http://localhost:5000/api/categories/${deleteConfirm}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      if (res.ok) {
        setDeleteConfirm(null);
        fetchCategories();
      } else {
        let errText = "Gagal menghapus kategori.";
        try {
          const errJson = await res.json();
          if (errJson?.message) errText = errJson.message;
        } catch {}
        alert(errText);
      }
    } catch (error) {
      console.error("Delete error:", error);
      alert("Terjadi kesalahan saat menghapus kategori.");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-purple-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* HEADER */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2 flex items-center gap-2">
            <Tag className="text-[#cb5094]" size={32} />
            Manajemen Kategori
          </h1>
          <p className="text-gray-600">Kelola kategori produk untuk toko Anda</p>
        </div>

        {/* TOOLBAR */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            {/* SEARCH */}
            <div className="relative flex-1 w-full md:w-auto">
              <Search
                className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                size={20}
              />
              <input
                type="text"
                placeholder="Cari kategori..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#cb5094] focus:border-transparent"
              />
            </div>

            {/* ACTIONS */}
            <div className="flex gap-3">
              {/* FILTER BUTTON */}
              <button
                onClick={() => setFilterOpen(!filterOpen)}
                className={`flex items-center gap-2 px-4 py-3 rounded-xl font-medium transition-all ${
                  filterOpen
                    ? "bg-[#cb5094] text-white shadow-lg"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                <Filter size={20} />
                <span className="hidden sm:inline">Filter</span>
              </button>

              {/* ADD BUTTON */}
              <button
                onClick={openAdd}
                className="flex items-center gap-2 px-4 py-3 bg-gradient-to-r from-[#cb5094] to-[#d66ba8] text-white rounded-xl font-medium hover:shadow-lg transition-all"
              >
                <Plus size={20} />
                <span className="hidden sm:inline">Tambah</span>
              </button>
            </div>
          </div>

          {/* FILTER PANEL */}
          {filterOpen && (
            <div className="mt-4 pt-4 border-t border-gray-200">

          {/* Kalau belum ada kategori → JANGAN munculkan filter apa pun */}
          {categories.length === 0 ? (
            <p className="text-gray-500 italic">Belum ada kategori untuk difilter</p>
            ): (
            <div className="flex flex-wrap gap-2">

          {/* ALL */}
          <button
          onClick={() => setParentFilter("all")}
          className={`px-4 py-2 rounded-lg font-medium transition-all ${
            parentFilter === "all"
              ? "bg-[#cb5094] text-white"
              : "bg-gray-100 text-gray-700 hover:bg-gray-200"
          }`}
        >
          Semua
        </button>

        {/* NO PARENT */}
        <button
          onClick={() => setParentFilter("no-parent")}
          className={`px-4 py-2 rounded-lg font-medium transition-all ${
            parentFilter === "no-parent"
              ? "bg-[#cb5094] text-white"
              : "bg-gray-100 text-gray-700 hover:bg-gray-200"
          }`}
        >
          Tanpa Induk
        </button>

        {/* Parent categories */}
        {parentCategories.map((pc) => (
          <button
            key={pc.id}
            onClick={() => setParentFilter(pc.id)}
            className={`px-4 py-2 rounded-lg font-medium transition-all ${
              String(parentFilter) === String(pc.id)
                ? "bg-[#cb5094] text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            {pc.nama}
            </button>
            ))}
          </div>
        )}
        </div>
      )}

        </div>

        {/* TABLE */}
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gradient-to-r from-[#cb5094] to-[#d66ba8] text-white">
                <tr>
                  <th className="p-4 text-left font-semibold">Nama Kategori</th>
                  <th className="p-4 text-left font-semibold">URL Slug</th>
                  <th className="p-4 text-left font-semibold">Kategori Induk</th>
                  <th className="p-4 text-left font-semibold">Status</th>
                  <th className="p-4 text-center font-semibold">Aksi</th>
                </tr>
              </thead>

              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="5" className="p-8 text-center">
                      <div className="flex justify-center items-center gap-2">
                        <div className="w-6 h-6 border-4 border-[#cb5094] border-t-transparent rounded-full animate-spin"></div>
                        <span className="text-gray-600">Memuat data...</span>
                      </div>
                    </td>
                  </tr>
                ) : filteredCategories.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="p-8 text-center">
                      <div className="flex flex-col items-center gap-2 text-gray-500">
                        <Tag size={48} className="opacity-50" />
                        <p className="font-medium">Tidak ada kategori ditemukan</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredCategories.map((cat, index) => (
                    <tr
                      key={cat.id}
                      className={`border-t border-gray-100 hover:bg-pink-50 transition-colors ${
                        index % 2 === 0 ? "bg-white" : "bg-gray-50"
                      }`}
                    >
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <Tag className="text-[#cb5094]" size={18} />
                          <span className="font-medium text-gray-800">{cat.nama}</span>
                        </div>
                      </td>
                      <td className="p-4">
                        <code className="bg-gray-100 px-3 py-1 rounded-lg text-sm text-gray-700">
                          {cat.slug}
                        </code>
                      </td>
                      <td className="p-4">
                        {cat.parent?.nama ? (
                          <div className="flex items-center gap-2">
                            <FolderTree className="text-gray-500" size={16} />
                            <span className="text-gray-700">{cat.parent.nama}</span>
                          </div>
                        ) : (
                          <span className="text-gray-400 italic">Tidak ada</span>
                        )}
                      </td>
                      <td className="p-4">
                        {cat.active ? (
                          <div className="inline-flex items-center gap-2 px-3 py-1 bg-green-100 text-green-700 rounded-full font-medium">
                            <ToggleRight size={18} />
                            Aktif
                          </div>
                        ) : (
                          <div className="inline-flex items-center gap-2 px-3 py-1 bg-red-100 text-red-700 rounded-full font-medium">
                            <ToggleLeft size={18} />
                            Nonaktif
                          </div>
                        )}
                      </td>
                      <td className="p-4">
                        <div className="flex gap-2 justify-center">
                          <button
                            onClick={() => openEdit(cat)}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Edit kategori"
                          >
                            <Edit3 size={18} />
                          </button>
                          <button
                            onClick={() => setDeleteConfirm(cat.id)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Hapus kategori"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* ADD/EDIT MODAL - Now using separate component */}
        <AddCategory
          isOpen={modalOpen}
          onClose={closeModal}
          editData={editData}
          categories={categories}
          onSuccess={handleSuccess}
        />

        {/* DELETE CONFIRM */}
        {deleteConfirm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-3 bg-red-100 rounded-full">
                  <Trash2 className="text-red-600" size={24} />
                </div>
                <h3 className="text-xl font-bold text-gray-800">Hapus Kategori?</h3>
              </div>

              <p className="text-gray-600 mb-6">
                Apakah Anda yakin ingin menghapus kategori ini? Tindakan ini tidak dapat dibatalkan.
              </p>

              <div className="flex gap-3">
                <button
                  onClick={() => setDeleteConfirm(null)}
                  className="flex-1 px-4 py-3 border-2 border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition-colors"
                >
                  Batal
                </button>
                <button
                  onClick={deleteCategory}
                  className="flex-1 px-4 py-3 bg-red-600 text-white rounded-xl font-semibold hover:bg-red-700 transition-colors"
                >
                  Ya, Hapus
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Category;
