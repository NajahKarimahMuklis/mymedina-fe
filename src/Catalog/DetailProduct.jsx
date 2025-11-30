import { useState } from 'react';
import { Heart, ShoppingCart, Package, Check, X } from 'lucide-react';

function DetailProduct({ product, onClose, onAddToCart, onBuyNow, isWishlisted, onToggleWishlist }) {
  const [selectedSize, setSelectedSize] = useState('M');
  const [selectedColor, setSelectedColor] = useState('Black');

  const formatPrice = (price) => {
    return new Intl.NumberFormat('id-ID', { 
      style: 'currency', 
      currency: 'IDR', 
      minimumFractionDigits: 0 
    }).format(price);
  };

  // Available colors for products
  const colors = [
    { name: 'Black', hex: '#000000' },
    { name: 'Navy', hex: '#1e3a8a' },
    { name: 'Maroon', hex: '#7f1d1d' },
    { name: 'Olive', hex: '#3f6212' },
    { name: 'Cream', hex: '#fef3c7' },
    { name: 'Gray', hex: '#6b7280' },
  ];

  const handleAddToCart = () => {
    if (onAddToCart) {
      onAddToCart(product, selectedSize, selectedColor);
    }
    alert(`${product.name} (Size: ${selectedSize}, Color: ${selectedColor}) added to cart!`);
  };

  const handleBuyNow = () => {
    if (onBuyNow) {
      onBuyNow(product, selectedSize, selectedColor);
    } else {
      alert(`Proceeding to checkout with ${product.name} (Size: ${selectedSize}, Color: ${selectedColor})`);
    }
  };

  if (!product) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
        {/* Modal Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between rounded-t-3xl z-10">
          <h2 className="text-2xl font-serif text-[#cb5094]">Product Details</h2>
          <button
            onClick={onClose}
            className="w-10 h-10 bg-gray-100 hover:bg-gray-200 rounded-full flex items-center justify-center transition"
          >
            <X className="w-6 h-6 text-gray-600" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-6">
          <div className="grid md:grid-cols-2 gap-8">
            {/* Product Image */}
            <div className="relative aspect-square rounded-2xl overflow-hidden bg-gray-100">
              <img
                src={product.image}
                alt={product.name}
                className="w-full h-full object-cover"
              />
              <button
                onClick={() => onToggleWishlist && onToggleWishlist(product.id)}
                className="absolute top-4 right-4 w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-lg hover:scale-110 transition"
              >
                <Heart
                  className={`w-6 h-6 ${
                    isWishlisted
                      ? 'fill-[#cb5094] text-[#cb5094]'
                      : 'text-gray-600'
                  }`}
                />
              </button>
              <span className="absolute top-4 left-4 bg-[#cb5094] text-white px-4 py-2 rounded-full font-bold shadow-lg">
                {product.category}
              </span>
              {product.stock < 10 && (
                <span className="absolute bottom-4 left-4 bg-red-500 text-white px-4 py-2 rounded-full font-bold shadow-lg">
                  Only {product.stock} left!
                </span>
              )}
            </div>

            {/* Product Details */}
            <div>
              <h3 className="text-3xl font-serif text-gray-800 mb-3">
                {product.name}
              </h3>
              
              <div className="flex items-center gap-4 mb-4">
                <span className="text-gray-600 flex items-center gap-2">
                  <Package className="w-5 h-5" />
                  {product.stock} items in stock
                </span>
              </div>

              <p className="text-4xl font-bold text-[#cb5094] mb-6">
                {formatPrice(product.price)}
              </p>

              <div className="bg-gray-50 rounded-2xl p-4 mb-6">
                <h4 className="font-semibold text-gray-800 mb-2">Description</h4>
                <p className="text-gray-600 leading-relaxed">
                  {product.description}
                </p>
              </div>

              {/* Color Selection - BULAT */}
              <div className="mb-6">
                <h4 className="font-semibold text-gray-800 mb-3">Select Color</h4>
                <div className="flex gap-3">
                  {colors.map(color => (
                    <button
                      key={color.name}
                      onClick={() => setSelectedColor(color.name)}
                      className={`relative w-10 h-10 rounded-full border-2 transition-all hover:scale-110 ${
                        selectedColor === color.name
                          ? 'border-[#cb5094] ring-2 ring-[#cb5094] ring-offset-2'
                          : 'border-gray-300'
                      }`}
                      style={{ backgroundColor: color.hex }}
                      title={color.name}
                    >
                      {selectedColor === color.name && (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <Check className="w-5 h-5 text-white drop-shadow-lg" strokeWidth={3} />
                        </div>
                      )}
                    </button>
                  ))}
                </div>
                <p className="text-sm text-gray-600 mt-2">Selected: <span className="font-semibold">{selectedColor}</span></p>
              </div>

              {/* Size Selection */}
              <div className="mb-6">
                <h4 className="font-semibold text-gray-800 mb-3">Select Size</h4>
                <div className="grid grid-cols-4 gap-3">
                  {['S', 'M', 'L', 'XL'].map(size => (
                    <button
                      key={size}
                      onClick={() => setSelectedSize(size)}
                      className={`border-2 py-3 rounded-xl transition font-semibold ${
                        selectedSize === size
                          ? 'border-[#cb5094] bg-[#cb5094] text-white'
                          : 'border-gray-300 hover:border-[#cb5094]'
                      }`}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-3">
                <button
                  onClick={handleAddToCart}
                  className="w-full bg-white border-2 border-[#cb5094] text-[#cb5094] py-4 rounded-2xl font-bold text-lg hover:bg-[#cb5094] hover:text-white transition shadow-lg hover:shadow-xl flex items-center justify-center gap-3"
                >
                  <ShoppingCart className="w-6 h-6" />
                  Add to Cart
                </button>

                <button
                  onClick={handleBuyNow}
                  className="w-full bg-[#cb5094] text-white py-4 rounded-2xl font-bold text-lg hover:bg-[#b04580] transition shadow-lg hover:shadow-xl flex items-center justify-center gap-3"
                >
                  <Package className="w-6 h-6" />
                  Buy Now
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default DetailProduct;