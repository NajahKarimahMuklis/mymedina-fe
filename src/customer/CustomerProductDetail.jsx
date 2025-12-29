import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  X,
  ShoppingCart,
  ChevronLeft,
  ChevronRight,
  Clock,
  CheckCircle,
  Check,
  Zap,
} from "lucide-react";
import { variantAPI } from "../utils/api";
import { formatPrice } from "../utils/formatPrice";
import toast from "react-hot-toast"; 

function CustomerProductDetail({ product, onClose, setCartCount }) {
  const navigate = useNavigate();

  const [variants, setVariants] = useState([]);
  const [selectedVariant, setSelectedVariant] = useState(null);
  const [selectedSize, setSelectedSize] = useState(null);
  const [selectedColor, setSelectedColor] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [colorImages, setColorImages] = useState({});

  useEffect(() => {
    if (product) {
      fetchVariants();
      setQuantity(1);
      setCurrentImageIndex(0);
      setSelectedSize(null);
      setSelectedColor(null);
      setSelectedVariant(null);
    }
  }, [product]);

  const fetchVariants = async () => {
    try {
      const variantsResponse = await variantAPI.getByProductId(
        product.id,
        false
      );
      const variantsData =
        variantsResponse.data?.data || variantsResponse.data || [];
      const activeVariants = variantsData.filter((v) => v.aktif && v.stok > 0);

      setVariants(activeVariants);

      const colorImagesMap = {};
      activeVariants.forEach((v) => {
        if (v.gambar && !colorImagesMap[v.warna]) {
          colorImagesMap[v.warna] = v.gambar;
        }
      });
      setColorImages(colorImagesMap);
    } catch (err) {
      console.error("Error fetching variants:", err);
      setVariants([]);
      setColorImages({});
    }
  };

  const handleSizeSelect = (size) => {
    setSelectedSize(size);
    if (selectedColor) {
      const variant = variants.find(
        (v) => v.ukuran === size && v.warna === selectedColor
      );
      setSelectedVariant(variant || null);
    }
  };

  const handleColorSelect = (color) => {
    setSelectedColor(color);

    if (selectedSize) {
      const variant = variants.find(
        (v) => v.ukuran === selectedSize && v.warna === color
      );
      setSelectedVariant(variant || null);
    }

    const colorImageUrl = colorImages[color];
    if (colorImageUrl) {
      const productImages = getSortedProductImages(product);
      const imageIndex = productImages.findIndex((img) => {
        const imgTrimmed = img.trim();
        const colorImgTrimmed = colorImageUrl.trim();
        return (
          imgTrimmed === colorImgTrimmed ||
          imgTrimmed.includes(colorImgTrimmed) ||
          colorImgTrimmed.includes(imgTrimmed)
        );
      });

      if (imageIndex !== -1) {
        setCurrentImageIndex(imageIndex);
      }
    }
  };

  const getSortedProductImages = (product) => {
    const allImages =
      product.gambarUrl?.split("|||").filter((url) => url) || [];

    if (Object.keys(colorImages).length === 0) {
      return allImages;
    }

    const sortedImages = [];
    const usedImages = new Set();

    const uniqueColors = [...new Set(variants.map((v) => v.warna))];
    uniqueColors.forEach((color) => {
      const imageUrl = colorImages[color];
      if (imageUrl) {
        const imgIndex = allImages.findIndex((img) => {
          const imgTrimmed = img.trim();
          const colorImgTrimmed = imageUrl.trim();
          return (
            imgTrimmed === colorImgTrimmed ||
            imgTrimmed.includes(colorImgTrimmed) ||
            colorImgTrimmed.includes(imgTrimmed)
          );
        });

        if (imgIndex !== -1 && !usedImages.has(allImages[imgIndex])) {
          sortedImages.push(allImages[imgIndex]);
          usedImages.add(allImages[imgIndex]);
        }
      }
    });

    allImages.forEach((img) => {
      if (!usedImages.has(img)) {
        sortedImages.push(img);
      }
    });

    return sortedImages.length > 0 ? sortedImages : allImages;
  };

  const getUniqueValues = (key) => {
    return [...new Set(variants.filter((v) => v.aktif).map((v) => v[key]))];
  };

  const addToCart = (goToCheckout = false) => {
    if (!product.aktif) {
      toast.error("Produk tidak tersedia");
      return;
    }

    if (variants.length > 0 && !selectedVariant) {
      toast.error("Silakan pilih ukuran dan warna terlebih dahulu");
      return;
    }

    const maxStock = selectedVariant
      ? selectedVariant.stok
      : product.stok || 999;

    // Dimensi & berat dari product utama
    const productWeight = product.berat || 500;
    const productLength = product.panjang || 20;
    const productWidth = product.lebar || 15;
    const productHeight = product.tinggi || 10;

    // === KHUSUS BELI SEKARANG ===
    if (goToCheckout) {
      onClose();

      const checkoutItem = {
        id: product.id,
        nama: product.nama,
        gambarUrl: product.gambarUrl,
        category: product.category,
        quantity: quantity,
        harga:
          selectedVariant?.hargaOverride !== null &&
          selectedVariant?.hargaOverride !== undefined
            ? selectedVariant.hargaOverride
            : product.hargaDasar,
        berat: productWeight,
        panjang: productLength,
        lebar: productWidth,
        tinggi: productHeight,
      };

      if (selectedVariant) {
        const variantImageUrl = colorImages[selectedVariant.warna] || null;
        Object.assign(checkoutItem, {
          variantId: selectedVariant.id,
          variantName: `${selectedVariant.ukuran} - ${selectedVariant.warna}`,
          size: selectedVariant.ukuran,
          color: selectedVariant.warna,
          stok: selectedVariant.stok,
          variantImageUrl: variantImageUrl,
        });
      }

      localStorage.setItem("checkoutItems", JSON.stringify([checkoutItem]));
      localStorage.setItem("checkoutFrom", "product-detail");

      toast.success(`${product.nama} siap untuk checkout!`, { duration: 2000 });

      setTimeout(() => {
        navigate("/customer/checkout");
      }, 300);

      return;
    }

    // === TAMBAH KE KERANJANG ===
    const cart = JSON.parse(localStorage.getItem("cart") || "[]");
    let isUpdatingQuantity = false;

    if (selectedVariant) {
      const existingIndex = cart.findIndex(
        (item) =>
          item.id === product.id && item.variantId === selectedVariant.id
      );

      if (existingIndex >= 0) {
        const currentQty = cart[existingIndex].quantity;
        const newQty = currentQty + quantity;

        if (newQty > maxStock) {
          toast.error(`Stok hanya ${maxStock} pcs`);
          return;
        }

        cart[existingIndex].quantity = newQty;
        isUpdatingQuantity = true;

        toast.success(`Jumlah diperbarui! Total: ${newQty} item`);
      } else {
        if (quantity > maxStock) {
          toast.error(`Stok hanya ${maxStock} pcs`);
          return;
        }

        const variantImageUrl = colorImages[selectedVariant.warna] || null;
        const finalPrice =
          selectedVariant.hargaOverride !== null &&
          selectedVariant.hargaOverride !== undefined
            ? selectedVariant.hargaOverride
            : product.hargaDasar;

        const newItem = {
          id: product.id,
          nama: product.nama,
          gambarUrl: product.gambarUrl,
          category: product.category,
          variantId: selectedVariant.id,
          variantName: `${selectedVariant.ukuran} - ${selectedVariant.warna}`,
          size: selectedVariant.ukuran,
          color: selectedVariant.warna,
          quantity,
          harga: finalPrice,
          aktif: product.aktif,
          stok: selectedVariant.stok,
          variantImageUrl: variantImageUrl,
          berat: productWeight,
          panjang: productLength,
          lebar: productWidth,
          tinggi: productHeight,
        };
        cart.push(newItem);
      }
    } else {
      const existingIndex = cart.findIndex(
        (item) => item.id === product.id && !item.variantId
      );

      if (existingIndex >= 0) {
        const currentQty = cart[existingIndex].quantity;
        const newQty = currentQty + quantity;

        if (newQty > maxStock) {
          toast.error(`Stok hanya ${maxStock} pcs`);
          return;
        }

        cart[existingIndex].quantity = newQty;
        isUpdatingQuantity = true;

        toast.success(`Jumlah diperbarui! Total: ${newQty} item`);
      } else {
        if (quantity > maxStock) {
          toast.error(`Stok hanya ${maxStock} pcs`);
          return;
        }
        const newItem = {
          id: product.id,
          nama: product.nama,
          gambarUrl: product.gambarUrl,
          category: product.category,
          quantity,
          harga: product.hargaDasar,
          aktif: product.aktif,
          stok: product.stok || 999,
          berat: productWeight,
          panjang: productLength,
          lebar: productWidth,
          tinggi: productHeight,
        };
        cart.push(newItem);
      }
    }

    localStorage.setItem("cart", JSON.stringify(cart));
    setCartCount(cart.length);

    if (!isUpdatingQuantity) {
      toast.success(`${product.nama} ditambahkan ke keranjang!`, {
        duration: 2000,
      });
    }
  };

  const isPreOrder = (product) => {
    return product.status === "PO";
  };

  const isReadyStock = (product) => {
    return product.status === "READY" && product.aktif === true;
  };

  const canAddToCart = () => {
    if (!product.aktif) return false;
    return true;
  };

  if (!product) return null;

  const images = getSortedProductImages(product);
  const currentImage =
    images[currentImageIndex] ||
    "https://via.placeholder.com/600?text=No+Image";

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
        <div className="sticky top-0 bg-gradient-to-r from-[#fef5fb] to-[#fff8f0] backdrop-blur-md px-6 py-5 flex justify-between items-center z-10 border-b-2 border-[#cb5094]/10">
          <h2 className="text-xl font-bold bg-gradient-to-r from-[#cb5094] to-[#d85fa8] bg-clip-text text-transparent">
            Detail Produk
          </h2>
          <button
            onClick={onClose}
            className="w-10 h-10 bg-white hover:bg-gray-50 rounded-full flex items-center justify-center transition-all shadow-md border-2 border-[#cb5094]/20"
          >
            <X className="w-5 h-5 text-gray-700" />
          </button>
        </div>

        <div className="grid md:grid-cols-2 gap-8 p-8">
          <div className="space-y-4">
            <div className="relative overflow-hidden rounded-2xl bg-gray-50 aspect-square border-2 border-[#cb5094]/10">
              <img
                src={currentImage}
                alt={product.nama}
                className="w-full h-full object-cover"
                onError={(e) =>
                  (e.target.src =
                    "https://via.placeholder.com/600?text=No+Image")
                }
              />

              {images.length > 1 && (
                <>
                  <button
                    onClick={() =>
                      setCurrentImageIndex(
                        (currentImageIndex - 1 + images.length) % images.length
                      )
                    }
                    className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/95 backdrop-blur-sm rounded-full flex items-center justify-center shadow-xl hover:bg-white transition-all"
                  >
                    <ChevronLeft className="w-5 h-5 text-gray-800" />
                  </button>
                  <button
                    onClick={() =>
                      setCurrentImageIndex(
                        (currentImageIndex + 1) % images.length
                      )
                    }
                    className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/95 backdrop-blur-sm rounded-full flex items-center justify-center shadow-xl hover:bg-white transition-all"
                  >
                    <ChevronRight className="w-5 h-5 text-gray-800" />
                  </button>

                  <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                    {images.map((_, idx) => (
                      <button
                        key={idx}
                        onClick={() => setCurrentImageIndex(idx)}
                        className={`h-2 rounded-full transition-all ${
                          idx === currentImageIndex
                            ? "bg-[#cb5094] w-8"
                            : "bg-white/70 w-2"
                        }`}
                      />
                    ))}
                  </div>
                </>
              )}

              <div className="absolute top-4 left-4">
                {isPreOrder(product) ? (
                  <div className="bg-gradient-to-r from-[#d4b896] to-[#e5c9a6] text-white px-4 py-2 rounded-xl text-sm font-bold shadow-xl flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    Pre Order
                  </div>
                ) : isReadyStock(product) ? (
                  <div className="bg-gradient-to-r from-green-500 to-green-600 text-white px-4 py-2 rounded-xl text-sm font-bold shadow-xl flex items-center gap-2">
                    <CheckCircle className="w-4 h-4" />
                    Ready Stock
                  </div>
                ) : null}
              </div>
            </div>

            {images.length > 1 && (
              <div className="grid grid-cols-4 gap-3">
                {images.slice(0, 4).map((img, idx) => {
                  let colorLabel = "";
                  for (const [color, imageUrl] of Object.entries(colorImages)) {
                    const imgTrimmed = img.trim();
                    const colorImgTrimmed = imageUrl.trim();
                    if (
                      imgTrimmed === colorImgTrimmed ||
                      imgTrimmed.includes(colorImgTrimmed) ||
                      colorImgTrimmed.includes(imgTrimmed)
                    ) {
                      colorLabel = color;
                      break;
                    }
                  }

                  return (
                    <button
                      key={idx}
                      onClick={() => setCurrentImageIndex(idx)}
                      className={`relative overflow-hidden rounded-xl aspect-square border-2 transition-all group ${
                        idx === currentImageIndex
                          ? "border-[#cb5094] shadow-lg scale-105"
                          : "border-[#cb5094]/20 hover:border-[#cb5094]/40"
                      }`}
                    >
                      <img
                        src={img}
                        alt=""
                        className="w-full h-full object-cover"
                      />
                      {colorLabel && (
                        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent py-1 px-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <p className="text-white text-[9px] font-bold text-center truncate">
                            {colorLabel}
                          </p>
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            )}

            {product.deskripsi && (
              <div className="bg-white rounded-2xl p-5 border-2 border-gray-100 shadow-sm">
                <h3 className="font-bold text-gray-900 text-sm mb-3 flex items-center gap-2">
                  <div className="w-1 h-4 bg-gradient-to-b from-[#cb5094] to-[#d85fa8] rounded-full"></div>
                  Deskripsi
                </h3>
                <p className="text-gray-600 text-sm leading-relaxed whitespace-pre-wrap">
                  {product.deskripsi}
                </p>
              </div>
            )}
          </div>

          <div className="space-y-5">
            <div>
              {product.category && (
                <span className="inline-block bg-gradient-to-r from-[#cb5094]/10 to-[#d4b896]/10 text-[#cb5094] px-4 py-1.5 rounded-xl text-xs font-bold mb-3 border-2 border-[#cb5094]/20">
                  {product.category.nama}
                </span>
              )}
              <h1 className="text-3xl font-bold text-gray-900 mb-2 leading-tight">
                {product.nama}
              </h1>
            </div>

            <div className="bg-gradient-to-br from-[#fef5fb] to-white rounded-2xl p-5 border-2 border-[#cb5094]/20 shadow-md">
              <div className="text-xs text-gray-600 mb-1 font-semibold">
                Harga
              </div>
              <div className="text-2xl font-bold bg-gradient-to-r from-[#cb5094] to-[#d85fa8] bg-clip-text text-transparent">
                {formatPrice(
                  selectedVariant?.hargaOverride !== null &&
                    selectedVariant?.hargaOverride !== undefined
                    ? selectedVariant.hargaOverride
                    : product.hargaDasar
                )}
              </div>
            </div>

            {variants.length > 0 && (
              <div className="space-y-4">
                {getUniqueValues("ukuran").length > 0 && (
                  <div>
                    <div className="font-bold text-gray-800 text-sm mb-3">
                      Ukuran{" "}
                      {selectedSize && (
                        <span className="text-[#cb5094] ml-1">
                          • {selectedSize}
                        </span>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {getUniqueValues("ukuran").map((size) => {
                        const hasStock = variants.some(
                          (v) => v.ukuran === size && v.aktif && v.stok > 0
                        );
                        return (
                          <button
                            key={size}
                            onClick={() => handleSizeSelect(size)}
                            disabled={!hasStock}
                            className={`min-w-[70px] px-4 py-2.5 rounded-xl text-sm font-bold transition-all ${
                              selectedSize === size
                                ? "bg-gradient-to-r from-[#cb5094] to-[#d85fa8] text-white shadow-lg"
                                : hasStock
                                ? "bg-white text-gray-700 hover:bg-gradient-to-r hover:from-[#fef5fb] hover:to-white border-2 border-[#cb5094]/20 hover:border-[#cb5094]/40"
                                : "bg-gray-50 text-gray-300 cursor-not-allowed border-2 border-gray-100"
                            }`}
                          >
                            {size}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {getUniqueValues("warna").length > 0 && (
                  <div>
                    <div className="font-bold text-gray-800 text-sm mb-3">
                      Warna{" "}
                      {selectedColor && (
                        <span className="text-[#cb5094] ml-1">
                          • {selectedColor}
                        </span>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {getUniqueValues("warna").map((color) => {
                        const hasStock = variants.some(
                          (v) => v.warna === color && v.aktif && v.stok > 0
                        );
                        return (
                          <button
                            key={color}
                            onClick={() => handleColorSelect(color)}
                            disabled={!hasStock}
                            className={`min-w-[80px] px-4 py-2.5 rounded-xl text-sm font-bold transition-all ${
                              selectedColor === color
                                ? "bg-gradient-to-r from-[#cb5094] to-[#d85fa8] text-white shadow-lg"
                                : hasStock
                                ? "bg-white text-gray-700 hover:bg-gradient-to-r hover:from-[#fef5fb] hover:to-white border-2 border-[#cb5094]/20 hover:border-[#cb5094]/40"
                                : "bg-gray-50 text-gray-300 cursor-not-allowed border-2 border-gray-100"
                            }`}
                          >
                            {color}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {selectedVariant && (
                  <div className="bg-gradient-to-br from-green-50 to-white border-2 border-green-300 rounded-xl p-4 shadow-sm">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-xs text-gray-600 mb-1 font-semibold">
                          Stok Tersedia
                        </div>
                        <div className="text-xl font-bold text-green-600">
                          {selectedVariant.stok} pcs
                        </div>
                      </div>
                      <Check className="w-6 h-6 text-green-500" />
                    </div>
                  </div>
                )}

                {selectedSize && selectedColor && !selectedVariant && (
                  <div className="bg-gradient-to-br from-red-50 to-white border-2 border-red-300 rounded-xl p-4 text-center shadow-sm">
                    <div className="text-sm font-bold text-red-600">
                      Kombinasi ini tidak tersedia
                    </div>
                  </div>
                )}
              </div>
            )}

            <div className="space-y-3">
              <div className="font-bold text-gray-800 text-sm">Jumlah</div>
              <div className="flex items-center gap-4">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="w-10 h-10 border-2 border-[#cb5094]/30 rounded-xl font-bold hover:bg-gradient-to-r hover:from-[#cb5094] hover:to-[#d85fa8] hover:text-white hover:border-transparent transition-all"
                >
                  -
                </button>
                <input
                  type="number"
                  value={quantity}
                  onChange={(e) => {
                    const maxStock = selectedVariant?.stok || 999;
                    setQuantity(
                      Math.max(
                        1,
                        Math.min(maxStock, parseInt(e.target.value) || 1)
                      )
                    );
                  }}
                  className="w-20 text-center border-2 border-[#cb5094]/30 rounded-xl px-3 py-2.5 text-sm font-bold focus:outline-none focus:border-[#cb5094]"
                />
                <button
                  onClick={() => {
                    const maxStock = selectedVariant?.stok || 999;
                    setQuantity(Math.min(maxStock, quantity + 1));
                  }}
                  className="w-10 h-10 border-2 border-[#cb5094]/30 rounded-xl font-bold hover:bg-gradient-to-r hover:from-[#cb5094] hover:to-[#d85fa8] hover:text-white hover:border-transparent transition-all"
                >
                  +
                </button>
                <div className="text-xs text-gray-500 font-semibold">
                  Maks: {selectedVariant?.stok || 999}
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-gray-50 to-white rounded-xl p-5 border-2 border-gray-200 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs text-gray-600 mb-1 font-semibold">
                    Subtotal
                  </div>
                  <div className="text-4xl font-bold text-gray-900">
                    {formatPrice(
                      (selectedVariant?.hargaOverride !== null &&
                      selectedVariant?.hargaOverride !== undefined
                        ? selectedVariant.hargaOverride
                        : product.hargaDasar) * quantity
                    )}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm text-gray-500 font-semibold">
                    {quantity} item
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <button
                onClick={() => addToCart(true)}
                disabled={!canAddToCart()}
                className="w-full bg-gradient-to-r from-[#cb5094] to-[#d85fa8] hover:from-[#b44682] hover:to-[#c54e96] text-white py-4 rounded-xl font-bold hover:shadow-2xl hover:scale-[1.02] transition-all flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 shadow-xl shadow-[#cb5094]/40"
              >
                <Zap className="w-6 h-6" />
                <span className="text-lg">Beli Sekarang</span>
              </button>

              <button
                onClick={() => addToCart(false)}
                disabled={!canAddToCart()}
                className="w-full border-2 border-[#cb5094] text-[#cb5094] py-4 rounded-xl font-bold hover:bg-gradient-to-r hover:from-[#fef5fb] hover:to-white transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ShoppingCart className="w-5 h-5" />
                Tambah ke Keranjang
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default CustomerProductDetail;
