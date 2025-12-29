import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Plus,
  Edit2,
  Trash2,
  Search,
  PackageSearch,
  Eye,
  X,
  ChevronRight,
  Package,
  AlertCircle,
} from "lucide-react";
import { productAPI, categoryAPI, variantAPI } from "../utils/api";
import {
  formatPrice,
  getStatusLabel,
  getStatusColor,
  PRODUCT_STATUS,
} from "../utils/formatPrice";
import ImageUpload from "../components/ImageUpload";
import toast, { Toaster } from "react-hot-toast";

function ProductManagement() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterCategory, setFilterCategory] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const navigate = useNavigate();

  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalProducts, setTotalProducts] = useState(0);

  const [formData, setFormData] = useState({
    categoryId: "",
    nama: "",
    slug: "",
    deskripsi: "",
    hargaDasar: "",
    berat: "",
    panjang: "",
    lebar: "",
    tinggi: "",
    status: "READY",
    aktif: true,
    gambarUrls: [],
  });

  const [variantStep, setVariantStep] = useState("colors");
  const [colors, setColors] = useState([]);
  const [sizes, setSizes] = useState([]);
  const [variants, setVariants] = useState([]);
  const [newColor, setNewColor] = useState("");
  const [newSize, setNewSize] = useState("");

  // State untuk konfirmasi hapus produk
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
  const [productToDelete, setProductToDelete] = useState(null);

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
      };

      Object.keys(params).forEach((key) => {
        if (params[key] === undefined) delete params[key];
      });

      const response = await productAPI.getAll(params);

      const productsData = response.data?.data || response.data || [];
      setProducts(productsData);

      let total = 0;
      let pages = 1;

      if (response.data?.meta) {
        total =
          response.data.meta.total ??
          response.data.meta.count ??
          response.data.meta.totalItems ??
          productsData.length;
        pages = response.data.meta.totalPages ?? Math.ceil(total / 10);
      } else {
        total = productsData.length;
        pages = 1;
      }

      setTotalProducts(total);
      setTotalPages(pages);
    } catch (error) {
      console.error("Error fetching products:", error);
      toast.error("Gagal memuat produk", { position: "bottom-right" });
      setProducts([]);
      setTotalProducts(0);
      setTotalPages(1);
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await categoryAPI.getAll(false);
      setCategories(response.data || []);
    } catch (error) {
      console.error("Error fetching categories:", error);
      setCategories([]);
      toast.error("Gagal memuat kategori", { position: "bottom-right" });
    }
  };

  const handleNamaChange = (e) => {
    const nama = e.target.value;
    const slug = nama
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-");

    setFormData({ ...formData, nama, slug });
  };

  const handleAddColor = () => {
    if (newColor.trim() && !colors.includes(newColor.trim())) {
      setColors([...colors, newColor.trim()]);
      setNewColor("");
      toast.success(`Warna "${newColor.trim()}" ditambahkan`, {
        position: "bottom-right",
      });
    } else if (colors.includes(newColor.trim())) {
      toast.error("Warna sudah ada dalam daftar", { position: "bottom-right" });
    }
  };

  const handleRemoveColor = (color) => {
    setColors(colors.filter((c) => c !== color));
    setVariants(variants.filter((v) => v.warna !== color));
    toast.success(`Warna "${color}" dihapus`, { position: "bottom-right" });
  };

  const handleNextToSizes = () => {
    if (colors.length === 0) {
      toast.error("Tambahkan minimal 1 warna terlebih dahulu", {
        position: "bottom-right",
      });
      return;
    }
    setVariantStep("sizes");
  };

  const handleAddSize = () => {
    if (newSize.trim() && !sizes.includes(newSize.trim())) {
      setSizes([...sizes, newSize.trim()]);
      setNewSize("");
      toast.success(`Ukuran "${newSize.trim()}" ditambahkan`, {
        position: "bottom-right",
      });
    } else if (sizes.includes(newSize.trim())) {
      toast.error("Ukuran sudah ada dalam daftar", {
        position: "bottom-right",
      });
    }
  };

  const handleRemoveSize = (size) => {
    setSizes(sizes.filter((s) => s !== size));
    setVariants(variants.filter((v) => v.ukuran !== size));
    toast.success(`Ukuran "${size}" dihapus`, { position: "bottom-right" });
  };

  const handleNextToStocks = () => {
    if (sizes.length === 0) {
      toast.error("Tambahkan minimal 1 ukuran terlebih dahulu", {
        position: "bottom-right",
      });
      return;
    }

    const newVariants = [];
    colors.forEach((color) => {
      sizes.forEach((size) => {
        newVariants.push({
          id: `${color}-${size}`,
          warna: color,
          ukuran: size,
          stok: 10,
        });
      });
    });

    setVariants(newVariants);
    setVariantStep("stocks");
  };

  const handleStockChange = (id, stok) => {
    setVariants(
      variants.map((v) =>
        v.id === id ? { ...v, stok: parseInt(stok) || 0 } : v
      )
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (
      !formData.categoryId ||
      !formData.nama ||
      !formData.hargaDasar ||
      !formData.berat ||
      !formData.panjang ||
      !formData.lebar ||
      !formData.tinggi
    ) {
      toast.error(
        "Kategori, nama, harga, berat, panjang, lebar, dan tinggi wajib diisi",
        { position: "bottom-right" }
      );
      return;
    }

    const payload = {
      categoryId: formData.categoryId,
      nama: formData.nama,
      slug: formData.slug,
      deskripsi: formData.deskripsi,
      hargaDasar: parseInt(formData.hargaDasar),
      berat: parseInt(formData.berat),
      panjang: Number(formData.panjang),
      lebar: Number(formData.lebar),
      tinggi: Number(formData.tinggi),
      status: formData.status,
      aktif: formData.aktif,
      gambarUrl: formData.gambarUrls.join("|||"),
    };

    const toastId = toast.loading(
      editingProduct ? "Mengupdate produk..." : "Membuat produk...",
      { position: "bottom-right" }
    );

    try {
      let newProductId = editingProduct?.id;

      if (editingProduct) {
        await productAPI.update(editingProduct.id, payload);
      } else {
        const response = await productAPI.create(payload);
        newProductId = response.data?.data?.id || response.data?.id;

        if (!newProductId) throw new Error("Product ID tidak ditemukan");
      }

      let successCount = 0;
      if (!editingProduct && variants.length > 0 && newProductId) {
        for (const variant of variants) {
          try {
            const baseSlug = formData.slug.toUpperCase().replace(/-/g, "");
            const size = variant.ukuran.toUpperCase().replace(/\s+/g, "");
            const color = variant.warna.toUpperCase().replace(/\s+/g, "");
            const timestamp = Date.now().toString().slice(-6);
            const random = Math.random()
              .toString(36)
              .substring(2, 5)
              .toUpperCase();
            const sku = `${baseSlug}-${size}-${color}-${timestamp}-${random}`;

            const variantPayload = {
              sku,
              ukuran: variant.ukuran,
              warna: variant.warna,
              stok: variant.stok,
              hargaOverride: null,
              aktif: true,
            };

            await variantAPI.create(newProductId, variantPayload);
            successCount++;
          } catch (variantError) {
            console.error("Failed to create variant:", variantError);
          }
        }
      }

      toast.dismiss(toastId);

      if (editingProduct) {
        toast.success("Produk berhasil diupdate!", {
          position: "bottom-right",
          duration: 4000,
        });
      } else if (variants.length > 0) {
        toast.success(`Produk dan ${successCount} varian berhasil dibuat!`, {
          position: "bottom-right",
          duration: 4000,
        });
      } else {
        toast.success("Produk berhasil dibuat!", {
          position: "bottom-right",
          duration: 4000,
        });
      }

      handleCancelForm();
      fetchProducts();
    } catch (error) {
      console.error("Error saving product:", error);
      toast.dismiss(toastId);
      toast.error("Gagal menyimpan produk", { position: "bottom-right" });
    }
  };

  const handleEdit = (product) => {
    setEditingProduct(product);

    const gambarUrls = product.gambarUrl
      ? product.gambarUrl.split("|||").filter((url) => url)
      : [];

    setFormData({
      categoryId: product.categoryId,
      nama: product.nama,
      slug: product.slug,
      deskripsi: product.deskripsi || "",
      hargaDasar: product.hargaDasar.toString(),
      berat: product.berat?.toString() || "",
      panjang: product.panjang?.toString() || "",
      lebar: product.lebar?.toString() || "",
      tinggi: product.tinggi?.toString() || "",
      status: product.status,
      aktif: product.aktif,
      gambarUrls,
    });

    setColors([]);
    setSizes([]);
    setVariants([]);
    setVariantStep("colors");
    setShowForm(true);
  };

  const handleDelete = (id, nama) => {
    setProductToDelete({ id, nama });
    setShowDeleteConfirmation(true);
  };

  const confirmDelete = async () => {
    if (!productToDelete) return;

    const toastId = toast.loading("Menghapus produk...", {
      position: "bottom-right",
    });

    try {
      await productAPI.delete(productToDelete.id);
      toast.dismiss(toastId);
      toast.success(`Produk "${productToDelete.nama}" berhasil dihapus!`, {
        position: "bottom-right",
      });
      fetchProducts();
    } catch (error) {
      toast.dismiss(toastId);
      toast.error("Gagal menghapus produk", { position: "bottom-right" });
    } finally {
      setShowDeleteConfirmation(false);
      setProductToDelete(null);
    }
  };

  const cancelDelete = () => {
    setShowDeleteConfirmation(false);
    setProductToDelete(null);
  };

  const handleCancelForm = () => {
    setShowForm(false);
    setEditingProduct(null);
    setFormData({
      categoryId: "",
      nama: "",
      slug: "",
      deskripsi: "",
      hargaDasar: "",
      berat: "",
      panjang: "",
      lebar: "",
      tinggi: "",
      status: "READY",
      aktif: true,
      gambarUrls: [],
    });
    setColors([]);
    setSizes([]);
    setVariants([]);
    setVariantStep("colors");
  };

  const handleImageUploaded = (url) => {
    setFormData({
      ...formData,
      gambarUrls: [...formData.gambarUrls, url],
    });
    toast.success("Gambar berhasil diupload!", { position: "bottom-right" });
  };

  const handleRemoveImage = (urlToRemove) => {
    setFormData({
      ...formData,
      gambarUrls: formData.gambarUrls.filter((url) => url !== urlToRemove),
    });
    toast.success("Gambar berhasil dihapus!", { position: "bottom-right" });
  };

  const handleViewVariants = (productId) => {
    navigate(`/admin/products/${productId}/variants`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-pink-50 pb-20 lg:pb-0">
      <div className="max-w-7xl mx-auto p-4 md:p-6 lg:p-8 space-y-6">
        {/* Header */}
        <div className="bg-white rounded-3xl shadow-sm border border-pink-100 p-5 md:p-6">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 lg:w-14 lg:h-14 bg-gradient-to-br from-[#cb5094] to-[#e570b3] rounded-2xl flex items-center justify-center shadow-md flex-shrink-0">
                <Package className="w-6 h-6 lg:w-8 lg:h-8 text-white" />
              </div>
              <div>
                <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">
                  Kelola Produk
                </h1>
                <p className="text-gray-500 text-sm lg:text-base">
                  Atur produk di toko Anda
                </p>
              </div>
            </div>
            <button
              onClick={() => setShowForm(true)}
              className="bg-[#cb5094] text-white px-6 py-3 rounded-xl font-semibold hover:bg-[#b54684] transition-all flex items-center gap-2 shadow-sm w-full lg:w-auto justify-center"
            >
              <Plus className="w-5 h-5" />
              Tambah Produk
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-2xl shadow-sm border border-pink-100 p-4 md:p-5">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#cb5094]"
              />
            </div>
            <select
              value={filterCategory}
              onChange={(e) => {
                setFilterCategory(e.target.value);
                setCurrentPage(1);
              }}
              className="px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#cb5094]"
            >
              <option value="">Semua Kategori</option>
              {Array.isArray(categories) &&
                categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.nama}
                  </option>
                ))}
            </select>
            <select
              value={filterStatus}
              onChange={(e) => {
                setFilterStatus(e.target.value);
                setCurrentPage(1);
              }}
              className="px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#cb5094]"
            >
              <option value="">Semua Status</option>
              <option value="READY">Ready Stock</option>
              <option value="PO">Pre Order</option>
              <option value="DISCONTINUED">Discontinued</option>
            </select>
          </div>
        </div>

        {/* Product List */}
        <div className="space-y-4 lg:space-y-0">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="text-center">
                <div className="w-16 h-16 border-4 border-pink-200 border-t-[#cb5094] rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-gray-600 font-medium">Memuat produk...</p>
              </div>
            </div>
          ) : products.length === 0 ? (
            <div className="bg-white rounded-3xl shadow-sm border border-pink-100 p-8 text-center">
              <div className="w-20 h-20 bg-pink-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <PackageSearch className="w-10 h-10 text-[#cb5094]" />
              </div>
              <h3 className="text-xl font-bold text-gray-800 mb-2">
                Produk Tidak Ditemukan
              </h3>
              <p className="text-gray-600 text-sm">
                {searchQuery || filterCategory || filterStatus
                  ? "Coba ubah filter pencarian"
                  : "Mulai dengan menambahkan produk pertama"}
              </p>
            </div>
          ) : (
            <>
              {/* Mobile Card View */}
              <div className="lg:hidden space-y-4">
                {products.map((product) => {
                  const images =
                    product.gambarUrl?.split("|||").filter((url) => url) || [];
                  const mainImage =
                    images[0] ||
                    "https://via.placeholder.com/400?text=No+Image";

                  return (
                    <div
                      key={product.id}
                      className="bg-white rounded-2xl shadow-sm border border-pink-100 p-4"
                    >
                      <div className="flex gap-4">
                        <div className="w-24 h-24 rounded-xl overflow-hidden bg-gray-100 border border-gray-200 flex-shrink-0">
                          <img
                            src={mainImage}
                            alt={product.nama}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-bold text-gray-900 text-base truncate">
                            {product.nama}
                          </h3>
                          <p className="text-sm text-gray-500 mt-1">
                            {product.category?.nama || "-"}
                          </p>
                          <p className="font-bold text-[#cb5094] text-lg mt-2">
                            {formatPrice(product.hargaDasar)}
                          </p>
                          <div className="mt-2">
                            <span
                              className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(
                                product.status
                              )}`}
                            >
                              {getStatusLabel(product.status)}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-2 mt-4">
                        <button
                          onClick={() => handleViewVariants(product.id)}
                          className="flex-1 py-2 bg-pink-50 text-[#cb5094] rounded-xl font-medium flex items-center justify-center gap-2"
                        >
                          <Eye className="w-4 h-4" />
                          Varian
                        </button>
                        <button
                          onClick={() => handleEdit(product)}
                          className="flex-1 py-2 bg-blue-50 text-blue-600 rounded-xl font-medium flex items-center justify-center gap-2"
                        >
                          <Edit2 className="w-4 h-4" />
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(product.id, product.nama)}
                          className="flex-1 py-2 bg-red-50 text-red-600 rounded-xl font-medium flex items-center justify-center gap-2"
                        >
                          <Trash2 className="w-4 h-4" />
                          Hapus
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Desktop Table View */}
              <div className="hidden lg:block bg-white rounded-3xl shadow-sm border border-pink-100 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gradient-to-r from-pink-50 to-white border-b-2 border-pink-100">
                      <tr>
                        <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase">
                          Produk
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase">
                          Kategori
                        </th>
                        <th className="px-6 py-4 text-right text-xs font-bold text-gray-700 uppercase">
                          Harga
                        </th>
                        <th className="px-6 py-4 text-center text-xs font-bold text-gray-700 uppercase">
                          Status
                        </th>
                        <th className="px-6 py-4 text-center text-xs font-bold text-gray-700 uppercase">
                          Aksi
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {products.map((product) => {
                        const images =
                          product.gambarUrl
                            ?.split("|||")
                            .filter((url) => url) || [];
                        const mainImage =
                          images[0] ||
                          "https://via.placeholder.com/400?text=No+Image";

                        return (
                          <tr
                            key={product.id}
                            className="hover:bg-pink-50/50 transition-colors"
                          >
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-4">
                                <div className="w-16 h-16 rounded-xl overflow-hidden bg-gray-100 border border-gray-200">
                                  <img
                                    src={mainImage}
                                    alt={product.nama}
                                    className="w-full h-full object-cover"
                                  />
                                </div>
                                <div>
                                  <div className="font-semibold text-gray-900">
                                    {product.nama}
                                  </div>
                                  <code className="text-xs text-gray-500 bg-gray-50 px-2 py-1 rounded">
                                    {product.slug}
                                  </code>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 text-gray-600">
                              {product.category?.nama || "-"}
                            </td>
                            <td className="px-6 py-4 text-right font-bold text-[#cb5094]">
                              {formatPrice(product.hargaDasar)}
                            </td>
                            <td className="px-6 py-4 text-center">
                              <span
                                className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(
                                  product.status
                                )}`}
                              >
                                {getStatusLabel(product.status)}
                              </span>
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex items-center justify-center gap-3">
                                <button
                                  onClick={() => handleViewVariants(product.id)}
                                  className="p-2 text-[#cb5094] hover:bg-pink-50 rounded-lg transition-all"
                                >
                                  <Eye className="w-5 h-5" />
                                </button>
                                <button
                                  onClick={() => handleEdit(product)}
                                  className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                                >
                                  <Edit2 className="w-5 h-5" />
                                </button>
                                <button
                                  onClick={() =>
                                    handleDelete(product.id, product.nama)
                                  }
                                  className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-all"
                                >
                                  <Trash2 className="w-5 h-5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex flex-col sm:flex-row justify-center items-center gap-4 py-6">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="px-6 py-3 bg-white border border-gray-200 rounded-xl disabled:opacity-40 hover:bg-pink-50 hover:border-[#cb5094] font-medium"
              >
                ← Previous
              </button>
              <span className="text-gray-600 font-medium">
                Halaman {currentPage} dari {totalPages}
              </span>
              <button
                onClick={() =>
                  setCurrentPage((p) => Math.min(totalPages, p + 1))
                }
                disabled={currentPage === totalPages}
                className="px-6 py-3 bg-white border border-gray-200 rounded-xl disabled:opacity-40 hover:bg-pink-50 hover:border-[#cb5094] font-medium"
              >
                Next →
              </button>
            </div>
          )}
        </div>

        {/* Footer Info */}
        {!loading && (
          <div className="bg-white rounded-2xl p-5 text-center border border-pink-100 shadow-sm">
            <p className="text-gray-600">
              Menampilkan{" "}
              <span className="font-bold text-[#cb5094]">
                {products.length}
              </span>{" "}
              dari{" "}
              <span className="font-bold text-[#cb5094]">{totalProducts}</span>{" "}
              produk
            </p>
            {products.length === 0 && totalProducts > 0 && (
              <p className="text-sm text-gray-500 mt-2">
                Tidak ada produk di halaman ini
              </p>
            )}
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {showDeleteConfirmation && productToDelete && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-md z-[80] flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-6">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 bg-pink-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <AlertCircle className="w-6 h-6 text-[#cb5094]" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900">
                    Konfirmasi Hapus Produk
                  </h3>
                  <p className="text-sm text-gray-600 mt-1">
                    Tindakan ini tidak dapat dibatalkan
                  </p>
                </div>
              </div>
              <div className="bg-pink-50 rounded-xl p-4 mb-6 border border-pink-200">
                <p className="text-sm text-gray-700 leading-relaxed">
                  Apakah Anda yakin ingin menghapus produk{" "}
                  <strong className="text-[#cb5094]">
                    "{productToDelete.nama}"
                  </strong>
                  ?
                </p>
                <p className="text-xs text-gray-600 mt-2">
                  Semua data produk dan varian terkait akan dihapus secara
                  permanen
                </p>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={cancelDelete}
                  className="flex-1 bg-gray-100 text-gray-700 py-3 rounded-xl font-bold hover:bg-gray-200 transition-all"
                >
                  Batal
                </button>
                <button
                  onClick={confirmDelete}
                  className="flex-1 bg-[#cb5094] text-white py-3 rounded-xl font-bold hover:bg-[#b54684] transition-all"
                >
                  Ya, Hapus
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Form Modal - FULL LENGKAP */}
        {showForm && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl max-h-[95vh] overflow-y-auto flex flex-col">
              <div className="bg-gradient-to-r from-[#cb5094] to-[#e570b3] px-6 py-5 flex justify-between items-center rounded-t-3xl sticky top-0 z-10">
                <div>
                  <h2 className="text-xl font-bold text-white">
                    {editingProduct ? "Edit Produk" : "Tambah Produk Baru"}
                  </h2>
                  <p className="text-white/90 text-sm mt-1">
                    {editingProduct
                      ? "Perbarui informasi produk"
                      : "Buat produk baru dengan varian"}
                  </p>
                </div>
                <button
                  onClick={handleCancelForm}
                  className="text-white hover:bg-white/20 p-2 rounded-lg transition-all"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-6 space-y-8">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {/* Left Column */}
                  <div className="space-y-6">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Kategori <span className="text-red-500">*</span>
                      </label>
                      <select
                        value={formData.categoryId}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            categoryId: e.target.value,
                          })
                        }
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#cb5094]"
                        required
                      >
                        <option value="">Pilih Kategori</option>
                        {categories.map((cat) => (
                          <option key={cat.id} value={cat.id}>
                            {cat.nama}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Nama Produk <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={formData.nama}
                        onChange={handleNamaChange}
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#cb5094]"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Slug
                      </label>
                      <input
                        type="text"
                        value={formData.slug}
                        onChange={(e) =>
                          setFormData({ ...formData, slug: e.target.value })
                        }
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl font-mono text-sm bg-gray-50"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Harga Dasar <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="number"
                        value={formData.hargaDasar}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            hargaDasar: e.target.value,
                          })
                        }
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#cb5094]"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Berat (g) <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="number"
                        value={formData.berat}
                        onChange={(e) =>
                          setFormData({ ...formData, berat: e.target.value })
                        }
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl"
                        required
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          Panjang (cm) <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="number"
                          value={formData.panjang}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              panjang: e.target.value,
                            })
                          }
                          className="w-full px-4 py-3 border border-gray-200 rounded-xl"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          Lebar (cm) <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="number"
                          value={formData.lebar}
                          onChange={(e) =>
                            setFormData({ ...formData, lebar: e.target.value })
                          }
                          className="w-full px-4 py-3 border border-gray-200 rounded-xl"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          Tinggi (cm) <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="number"
                          value={formData.tinggi}
                          onChange={(e) =>
                            setFormData({ ...formData, tinggi: e.target.value })
                          }
                          className="w-full px-4 py-3 border border-gray-200 rounded-xl"
                          required
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Status
                      </label>
                      <select
                        value={formData.status}
                        onChange={(e) =>
                          setFormData({ ...formData, status: e.target.value })
                        }
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl"
                      >
                        {Object.keys(PRODUCT_STATUS).map((status) => (
                          <option key={status} value={status}>
                            {getStatusLabel(status)}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="flex items-center gap-3 p-4 bg-pink-50 rounded-xl border border-pink-100">
                      <input
                        type="checkbox"
                        id="aktif"
                        checked={formData.aktif}
                        onChange={(e) =>
                          setFormData({ ...formData, aktif: e.target.checked })
                        }
                        className="w-5 h-5 text-[#cb5094] rounded"
                      />
                      <label
                        htmlFor="aktif"
                        className="text-sm font-semibold text-gray-700"
                      >
                        Produk Aktif
                      </label>
                    </div>
                  </div>

                  {/* Right Column */}
                  <div className="space-y-6">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Gambar Produk{" "}
                        {formData.gambarUrls.length > 0 &&
                          `(${formData.gambarUrls.length})`}
                      </label>
                      {formData.gambarUrls.length > 0 && (
                        <div className="mb-4">
                          <div className="flex gap-4 overflow-x-auto pb-2">
                            {formData.gambarUrls.map((url, idx) => (
                              <div
                                key={idx}
                                className="relative group w-32 h-32 flex-shrink-0"
                              >
                                <img
                                  src={url}
                                  alt={`Gambar ${idx + 1}`}
                                  className="w-full h-full object-cover rounded-xl border-2 border-gray-200"
                                />
                                <button
                                  type="button"
                                  onClick={() => handleRemoveImage(url)}
                                  className="absolute top-2 right-2 bg-red-500 text-white p-1.5 rounded-full opacity-0 group-hover:opacity-100 transition"
                                >
                                  <X className="w-4 h-4" />
                                </button>
                                {idx === 0 && (
                                  <div className="absolute bottom-2 left-2 bg-[#cb5094] text-white px-2 py-1 rounded text-xs font-bold">
                                    Utama
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      <ImageUpload
                        onImageUploaded={handleImageUploaded}
                        currentImage=""
                      />
                      <p className="text-xs text-gray-500 mt-2">
                        Foto pertama akan jadi foto utama
                      </p>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Deskripsi
                      </label>
                      <textarea
                        value={formData.deskripsi}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            deskripsi: e.target.value,
                          })
                        }
                        rows="8"
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-[#cb5094]"
                      />
                    </div>
                  </div>
                </div>

                {/* Varian Section - hanya untuk tambah produk baru */}
                {!editingProduct && (
                  <div className="mt-8 pt-8 border-t border-gray-200">
                    <h3 className="text-xl font-bold text-gray-900 mb-6">
                      Varian Produk (Opsional)
                    </h3>

                    <div className="flex flex-col md:flex-row items-center justify-center gap-6 mb-8">
                      <div
                        className={`flex flex-col items-center ${
                          variantStep === "colors"
                            ? "text-[#cb5094]"
                            : "text-gray-400"
                        }`}
                      >
                        <div
                          className={`w-12 h-12 rounded-full flex items-center justify-center text-base font-bold mb-2 ${
                            variantStep === "colors"
                              ? "bg-[#cb5094] text-white"
                              : "bg-gray-200"
                          }`}
                        >
                          1
                        </div>
                        <span className="font-semibold text-sm">Warna</span>
                      </div>
                      <ChevronRight className="w-6 h-6 text-gray-400 rotate-90 md:rotate-0" />
                      <div
                        className={`flex flex-col items-center ${
                          variantStep === "sizes"
                            ? "text-[#cb5094]"
                            : "text-gray-400"
                        }`}
                      >
                        <div
                          className={`w-12 h-12 rounded-full flex items-center justify-center text-base font-bold mb-2 ${
                            variantStep === "sizes"
                              ? "bg-[#cb5094] text-white"
                              : "bg-gray-200"
                          }`}
                        >
                          2
                        </div>
                        <span className="font-semibold text-sm">Ukuran</span>
                      </div>
                      <ChevronRight className="w-6 h-6 text-gray-400 rotate-90 md:rotate-0" />
                      <div
                        className={`flex flex-col items-center ${
                          variantStep === "stocks"
                            ? "text-[#cb5094]"
                            : "text-gray-400"
                        }`}
                      >
                        <div
                          className={`w-12 h-12 rounded-full flex items-center justify-center text-base font-bold mb-2 ${
                            variantStep === "stocks"
                              ? "bg-[#cb5094] text-white"
                              : "bg-gray-200"
                          }`}
                        >
                          3
                        </div>
                        <span className="font-semibold text-sm">Stok</span>
                      </div>
                    </div>

                    {variantStep === "colors" && (
                      <div className="bg-pink-50 rounded-xl p-6 border border-pink-100">
                        <h4 className="font-bold text-gray-800 mb-4">
                          Langkah 1: Tambahkan Warna
                        </h4>
                        {colors.length > 0 && (
                          <div className="flex flex-wrap gap-3 mb-4">
                            {colors.map((color) => (
                              <span
                                key={color}
                                className="bg-white border border-[#cb5094] text-[#cb5094] px-4 py-2 rounded-full text-sm font-semibold flex items-center gap-2"
                              >
                                {color}
                                <button
                                  type="button"
                                  onClick={() => handleRemoveColor(color)}
                                  className="hover:bg-pink-100 rounded-full p-1"
                                >
                                  <X className="w-4 h-4" />
                                </button>
                              </span>
                            ))}
                          </div>
                        )}
                        <div className="flex flex-col sm:flex-row gap-3">
                          <input
                            type="text"
                            placeholder="Contoh: Hitam, Putih, Merah"
                            value={newColor}
                            onChange={(e) => setNewColor(e.target.value)}
                            onKeyPress={(e) =>
                              e.key === "Enter" &&
                              (e.preventDefault(), handleAddColor())
                            }
                            className="flex-1 px-4 py-3 border border-gray-200 rounded-xl text-sm"
                          />
                          <button
                            type="button"
                            onClick={handleAddColor}
                            className="bg-[#cb5094] text-white px-6 py-3 rounded-xl text-sm font-semibold hover:bg-[#b54684]"
                          >
                            Tambah
                          </button>
                        </div>
                        {colors.length > 0 && (
                          <button
                            type="button"
                            onClick={handleNextToSizes}
                            className="w-full mt-4 bg-[#cb5094] text-white py-3 rounded-xl font-semibold hover:bg-[#b54684] flex items-center justify-center gap-2"
                          >
                            Lanjut ke Ukuran{" "}
                            <ChevronRight className="w-5 h-5" />
                          </button>
                        )}
                      </div>
                    )}

                    {variantStep === "sizes" && (
                      <div className="bg-blue-50 rounded-xl p-6 border border-blue-100">
                        <div className="flex items-center justify-between mb-4">
                          <h4 className="font-bold text-gray-800">
                            Langkah 2: Tambahkan Ukuran
                          </h4>
                          <button
                            type="button"
                            onClick={() => setVariantStep("colors")}
                            className="text-sm text-gray-600 hover:text-gray-800"
                          >
                            ← Kembali
                          </button>
                        </div>
                        {sizes.length > 0 && (
                          <div className="flex flex-wrap gap-3 mb-4">
                            {sizes.map((size) => (
                              <span
                                key={size}
                                className="bg-white border border-blue-500 text-blue-600 px-4 py-2 rounded-full text-sm font-semibold flex items-center gap-2"
                              >
                                {size}
                                <button
                                  type="button"
                                  onClick={() => handleRemoveSize(size)}
                                  className="hover:bg-blue-100 rounded-full p-1"
                                >
                                  <X className="w-4 h-4" />
                                </button>
                              </span>
                            ))}
                          </div>
                        )}
                        <div className="flex flex-col sm:flex-row gap-3">
                          <input
                            type="text"
                            placeholder="Contoh: S, M, L, XL"
                            value={newSize}
                            onChange={(e) => setNewSize(e.target.value)}
                            onKeyPress={(e) =>
                              e.key === "Enter" &&
                              (e.preventDefault(), handleAddSize())
                            }
                            className="flex-1 px-4 py-3 border border-gray-200 rounded-xl text-sm"
                          />
                          <button
                            type="button"
                            onClick={handleAddSize}
                            className="bg-blue-500 text-white px-6 py-3 rounded-xl text-sm font-semibold hover:bg-blue-600"
                          >
                            Tambah
                          </button>
                        </div>
                        {sizes.length > 0 && (
                          <button
                            type="button"
                            onClick={handleNextToStocks}
                            className="w-full mt-4 bg-[#cb5094] text-white py-3 rounded-xl font-semibold hover:bg-[#b54684] flex items-center justify-center gap-2"
                          >
                            Lanjut ke Stok <ChevronRight className="w-5 h-5" />
                          </button>
                        )}
                      </div>
                    )}

                    {variantStep === "stocks" && (
                      <div className="bg-green-50 rounded-xl p-6 border border-green-100">
                        <div className="flex items-center justify-between mb-4">
                          <div>
                            <h4 className="font-bold text-gray-800">
                              Langkah 3: Atur Stok
                            </h4>
                            <p className="text-sm text-gray-600 mt-1">
                              Total:{" "}
                              <span className="font-bold text-[#cb5094]">
                                {variants.length}
                              </span>{" "}
                              varian
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() => setVariantStep("sizes")}
                            className="text-sm text-gray-600 hover:text-gray-800"
                          >
                            ← Kembali
                          </button>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-h-96 overflow-y-auto">
                          {variants.map((variant) => (
                            <div
                              key={variant.id}
                              className="bg-white rounded-xl p-4 border border-gray-200"
                            >
                              <div className="flex items-center gap-3 mb-3">
                                <span className="bg-pink-100 text-[#cb5094] px-3 py-1 rounded-full text-sm font-semibold">
                                  {variant.warna}
                                </span>
                                <span className="bg-blue-100 text-blue-600 px-3 py-1 rounded-full text-sm font-semibold">
                                  {variant.ukuran}
                                </span>
                              </div>
                              <label className="block text-sm font-semibold text-gray-700 mb-1">
                                Stok
                              </label>
                              <input
                                type="number"
                                value={variant.stok}
                                onChange={(e) =>
                                  handleStockChange(variant.id, e.target.value)
                                }
                                className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm"
                                min="0"
                              />
                            </div>
                          ))}
                        </div>
                        <div className="mt-4 bg-white rounded-xl p-4 border border-green-200">
                          <p className="text-sm text-gray-600">
                            Total stok:{" "}
                            <span className="font-bold text-green-600 text-lg">
                              {variants.reduce((sum, v) => sum + v.stok, 0)} pcs
                            </span>
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 px-6 py-5 rounded-b-3xl">
                  <div className="flex flex-col sm:flex-row gap-4">
                    <button
                      type="submit"
                      className="flex-1 bg-[#cb5094] text-white py-4 rounded-xl font-semibold hover:bg-[#b54684] transition-all"
                    >
                      {editingProduct ? "Update Produk" : "Simpan Produk"}
                    </button>
                    <button
                      type="button"
                      onClick={handleCancelForm}
                      className="flex-1 bg-white border border-gray-300 text-gray-700 py-4 rounded-xl font-semibold hover:bg-gray-50 transition-all"
                    >
                      Batal
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>

      {/* Toast Notification Container */}
      <Toaster
        position="bottom-right"
        reverseOrder={false}
        gutter={12}
        containerStyle={{
          bottom: 40,
          right: 20,
        }}
        toastOptions={{
          duration: 4000,
          style: {
            borderRadius: "12px",
            background: "rgba(255, 255, 255, 0.95)",
            backdropFilter: "blur(10px)",
            color: "#333",
            fontSize: "14px",
            padding: "16px 20px",
            boxShadow: "0 8px 32px rgba(0, 0, 0, 0.12)",
            border: "1px solid rgba(0, 0, 0, 0.08)",
          },
          success: {
            style: {
              borderLeft: "4px solid #10b981",
            },
          },
          error: {
            style: {
              borderLeft: "4px solid #ef4444",
            },
          },
          loading: {
            style: {
              borderLeft: "4px solid #f59e0b",
            },
          },
        }}
      />
    </div>
  );
}

export default ProductManagement;
