import { useState } from 'react';
import {
  ShoppingBag, Menu, X, User, Heart, Search, ShoppingCart, Package,
  LogOut, Bell, Settings, CreditCard, MapPin, Clock, Star,
  Plus, Minus, Trash2
} from 'lucide-react';
import { Link } from 'react-router-dom';

function CustomerDashboard() {
  const [activeTab, setActiveTab] = useState('products');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  const [cartItems, setCartItems] = useState([
    { id: 1, name: 'Elegant Silk Hijab', price: 125000, quantity: 2, image: '', size: 'M' },
    { id: 2, name: 'Modern Tunic Dress', price: 285000, quantity: 1, image: '', size: 'L' }
  ]);

  const [wishlist, setWishlist] = useState([1, 3, 5]); 

  const [products] = useState([
    { id: 1, name: '', price: 125000, image: '', category: 'Hijabs', rating: 4.8, stock: 15 },
    { id: 2, name: '', price: 285000, image: '', category: 'Dresses', rating: 4.9, stock: 8 },
    { id: 3, name: '', price: 95000, image: '', category: 'Hijabs', rating: 4.7, stock: 20 },
    { id: 4, name: '', price: 345000, image: '', category: 'Abayas', rating: 4.9, stock: 5 },
    { id: 5, name: '', price: 150000, image: '', category: 'Hijabs', rating: 4.6, stock: 12 },
    { id: 6, name: '', price: 195000, image: '', category: 'Tunics', rating: 4.8, stock: 18 }
  ]);

  const [orders] = useState([
    { id: 'ORD-001', date: '2024-11-15', status: 'Delivered', total: 535000, items: 3 },
    { id: 'ORD-002', date: '2024-11-10', status: 'Shipped', total: 285000, items: 1 },
    { id: 'ORD-003', date: '2024-11-05', status: 'Processing', total: 445000, items: 2 }
  ]);

  const addToCart = (product, selectedSize = 'M') => {
    setCartItems(prev => {
      const existing = prev.find(item => item.id === product.id && item.size === selectedSize);
      if (existing) {
        return prev.map(item =>
          item.id === product.id && item.size === selectedSize
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prev, { ...product, quantity: 1, size: selectedSize }];
    });
  };

  const updateCartQuantity = (id, size, change) => {
    setCartItems(prev => prev.map(item =>
      item.id === id && item.size === size
        ? { ...item, quantity: Math.max(1, item.quantity + change) }
        : item
    ));
  };

  const removeFromCart = (id, size) => {
    setCartItems(prev => prev.filter(item => !(item.id === id && item.size === size)));
  };

  const getTotalPrice = () => {
    return cartItems.reduce((total, item) => total + (item.price * item.quantity), 0);
  };

  const toggleWishlist = (productId) => {
    setWishlist(prev => 
      prev.includes(productId)
        ? prev.filter(id => id !== productId)
        : [...prev, productId]
    );
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(price);
  };

  const getStatusColor = (status) => {
    switch(status) {
      case 'Delivered': return 'bg-green-100 text-green-800';
      case 'Shipped': return 'bg-blue-100 text-blue-800';
      case 'Processing': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="min-h-screen bg-[#fffbf8]">
      <nav className="fixed top-0 w-full z-50 bg-white shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                className="lg:hidden p-2 hover:bg-gray-100 rounded-lg transition"
              >
                {isSidebarOpen ? <X className="w-6 h-6 text-[#cb5094]" /> : <Menu className="w-6 h-6 text-[#cb5094]" />}
              </button>

              <Link to="/" className="flex items-center space-x-3 group">
                <div className="relative w-12 h-12 bg-gradient-to-br from-[#cb5094] to-[#e570b3] rounded-full flex items-center justify-center shadow-lg group-hover:shadow-2xl transition-all duration-300 group-hover:scale-110 overflow-hidden">
                  <img
                    src="/logo.png"
                    alt="Medina Stuff Logo"
                    className="w-8 h-8 object-contain relative z-10"
                    onError={(e) => {
                      e.target.style.display = 'none';
                      e.target.nextElementSibling.style.display = 'block';
                    }}
                  />
                  <span className="absolute inset-0 flex items-center justify-center text-2xl font-serif text-white italic font-bold z-10 hidden">
                    MS
                  </span>
                  <div className="absolute inset-0 bg-gradient-to-br from-[#e570b3] to-[#cb5094] opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                </div>
                <span className="hidden sm:block text-base text-gray-600 font-medium italic tracking-wide">
                  Medina Stuff
                </span>
              </Link>
            </div>

            <div className="hidden md:flex flex-1 max-w-md mx-8">
              <div className="relative w-full">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search products..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-[#cb5094]"
                />
              </div>
            </div>

            <div className="flex items-center space-x-2 sm:space-x-4">
              <button className="relative p-2 hover:bg-gray-100 rounded-full transition">
                <Bell className="w-5 h-5 sm:w-6 sm:h-6 text-gray-700" />
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
              </button>

              <button
                onClick={() => {
                  setActiveTab('cart');
                  setIsSidebarOpen(false);
                }}
                className="relative p-2 hover:bg-gray-100 rounded-full transition"
              >
                <ShoppingCart className="w-5 h-5 sm:w-6 sm:h-6 text-gray-700" />
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-[#cb5094] text-white text-xs rounded-full flex items-center justify-center font-bold">
                  {cartItems.reduce((sum, item) => sum + item.quantity, 0)}
                </span>
              </button>

              <div className="hidden sm:flex items-center space-x-2 pl-2">
                <div className="w-8 h-8 bg-[#cb5094] rounded-full flex items-center justify-center">
                  <User className="w-5 h-5 text-white" />
                </div>
                <span className="text-sm font-medium text-gray-700">Cinta</span>
              </div>
            </div>
          </div>
        </div>
      </nav>

      <div className="flex pt-16">
        <aside className={`fixed lg:static inset-y-0 left-0 z-40 w-64 bg-white shadow-lg transform transition-transform duration-300 lg:translate-x-0 ${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } pt-16 lg:pt-0`}>
          <div className="h-full overflow-y-auto py-6">
            <nav className="space-y-2 px-4">
              {[
                { tab: 'products', icon: ShoppingBag, label: 'Products' },
                { tab: 'cart', icon: ShoppingCart, label: 'My Cart', badge: cartItems.reduce((s, i) => s + i.quantity, 0) },
                { tab: 'orders', icon: Package, label: 'My Orders' },
                { tab: 'wishlist', icon: Heart, label: 'Wishlist', badge: wishlist.length },
                { tab: 'profile', icon: User, label: 'Profile' },
                { tab: 'settings', icon: Settings, label: 'Settings' },
              ].map(item => (
                <button
                  key={item.tab}
                  onClick={() => {
                    setActiveTab(item.tab);
                    setIsSidebarOpen(false);
                  }}
                  className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition ${
                    activeTab === item.tab ? 'bg-[#cb5094] text-white' : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <item.icon className="w-5 h-5" />
                  <span className="font-medium">{item.label}</span>
                  {item.badge > 0 && (
                    <span className="ml-auto bg-white text-[#cb5094] text-xs px-2 py-1 rounded-full font-bold">
                      {item.badge}
                    </span>
                  )}
                </button>
              ))}
              <hr className="my-4" />
              <button
                onClick={() => window.location.href = '/login'}
                className="w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-red-600 hover:bg-red-50 transition"
              >
                <LogOut className="w-5 h-5" />
                <span className="font-medium">Logout</span>
              </button>
            </nav>
          </div>
        </aside>

        {isSidebarOpen && (
          <div className="fixed inset-0 bg-black/50 z-30 lg:hidden" onClick={() => setIsSidebarOpen(false)}></div>
        )}

        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
          {activeTab === 'products' && (
            <div>
              <div className="mb-6">
                <h1 className="text-3xl font-serif text-[#cb5094] mb-2">Our Products</h1>
                <p className="text-gray-600">Discover our latest collection</p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {products.map((product) => {
                  const isWishlisted = wishlist.includes(product.id);
                  return (
                    <div key={product.id} className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden group">
                      <div className="relative aspect-square overflow-hidden">
                        <img
                          src={product.image}
                          alt={product.name}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                        />
                        <button
                          onClick={() => toggleWishlist(product.id)}
                          className="absolute top-3 right-3 w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-lg hover:bg-[#cb5094] transition"
                        >
                          <Heart className={`w-5 h-5 ${isWishlisted ? 'fill-[#cb5094] text-[#cb5094]' : 'text-gray-600'}`} />
                        </button>
                        <span className="absolute top-3 left-3 bg-[#cb5094] text-white text-xs px-3 py-1 rounded-full font-bold">
                          {product.category}
                        </span>
                      </div>
                      <div className="p-4">
                        <h3 className="font-semibold text-gray-800 mb-2">{product.name}</h3>
                        <div className="flex items-center mb-2">
                          <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                          <span className="text-sm text-gray-600 ml-1">{product.rating}</span>
                          <span className="text-sm text-gray-400 ml-auto">Stock: {product.stock}</span>
                        </div>
                        <p className="text-xl font-bold text-[#cb5094] mb-3">{formatPrice(product.price)}</p>
                        <div className="flex gap-2 mb-3">
                          {['S', 'M', 'L', 'XL'].map(size => (
                            <button
                              key={size}
                              onClick={() => addToCart(product, size)}
                              className="flex-1 border border-gray-300 py-2 rounded-lg hover:border-[#cb5094] hover:bg-[#cb5094] hover:text-white transition text-sm font-medium"
                            >
                              {size}
                            </button>
                          ))}
                        </div>
                        <button
                          onClick={() => addToCart(product, 'M')}
                          className="w-full bg-[#cb5094] text-white py-2 rounded-full font-medium hover:bg-[#b04580] transition"
                        >
                          Add to Cart
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {activeTab === 'cart' && (
            <div>
              <div className="mb-6">
                <h1 className="text-3xl font-serif text-[#cb5094] mb-2">Shopping Cart</h1>
                <p className="text-gray-600">{cartItems.length} items in your cart</p>
              </div>
              {cartItems.length === 0 ? (
                <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
                  <ShoppingCart className="w-20 h-20 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-gray-800 mb-2">Your cart is empty</h3>
                  <button onClick={() => setActiveTab('products')} className="bg-[#cb5094] text-white px-8 py-3 rounded-full font-medium hover:bg-[#b04580] transition">
                    Browse Products
                  </button>
                </div>
              ) : (
                <div className="grid lg:grid-cols-3 gap-6">
                  <div className="lg:col-span-2 space-y-4">
                    {cartItems.map((item) => (
                      <div key={`${item.id}-${item.size}`} className="bg-white rounded-2xl shadow-lg p-6 flex flex-col sm:flex-row gap-4">
                        <img src={item.image} alt={item.name} className="w-full sm:w-24 h-24 object-cover rounded-xl" />
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-800 mb-1">{item.name}</h3>
                          <p className="text-sm text-gray-500 mb-2">Size: {item.size}</p>
                          <p className="text-lg font-bold text-[#cb5094]">{formatPrice(item.price)}</p>
                        </div>
                        <div className="flex sm:flex-col items-center justify-between sm:justify-center gap-4">
                          <div className="flex items-center border border-gray-300 rounded-full">
                            <button onClick={() => updateCartQuantity(item.id, item.size, -1)} className="p-2 hover:bg-gray-100 rounded-l-full"><Minus className="w-4 h-4" /></button>
                            <span className="px-4 font-semibold">{item.quantity}</span>
                            <button onClick={() => updateCartQuantity(item.id, item.size, 1)} className="p-2 hover:bg-gray-100 rounded-r-full"><Plus className="w-4 h-4" /></button>
                          </div>
                          <button onClick={() => removeFromCart(item.id, item.size)} className="p-2 text-red-500 hover:bg-red-50 rounded-full">
                            <Trash2 className="w-5 h-5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="lg:col-span-1">
                    <div className="bg-white rounded-2xl shadow-lg p-6 sticky top-24">
                      <h3 className="text-xl font-semibold text-gray-800 mb-4">Order Summary</h3>
                      <div className="space-y-3 mb-4">
                        <div className="flex justify-between text-gray-600">
                          <span>Subtotal</span>
                          <span>{formatPrice(getTotalPrice())}</span>
                        </div>
                        <div className="flex justify-between text-gray-600">
                          <span>Shipping</span>
                          <span>Free</span>
                        </div>
                        <hr />
                        <div className="flex justify-between text-lg font-bold text-gray-800">
                          <span>Total</span>
                          <span className="text-[#cb5094]">{formatPrice(getTotalPrice())}</span>
                        </div>
                      </div>
                      <button className="w-full bg-[#cb5094] text-white py-3 rounded-full font-bold hover:bg-[#b04580] transition shadow-lg hover:shadow-xl">
                        Proceed to Checkout
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

export default CustomerDashboard;