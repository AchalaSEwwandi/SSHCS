import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { shopService, orderService } from '../../services';
import { useAuth } from '../../context/AuthContext';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { Package, Search, ShoppingCart, ArrowLeft, X, Plus, Minus, CreditCard, Truck } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';

const checkoutSchema = z.object({
  deliveryAddress: z.string().min(5, 'Delivery address is required (min 5 chars)'),
  cardType: z.enum(['Visa', 'Mastercard', 'Amex']),
  nameOnCard: z.string().min(3, 'Name on card is required'),
  cardNumber: z.string().length(16, 'Card number must be exactly 16 digits').regex(/^\d+$/, 'Must contain only numbers'),
  expiryMonth: z.string().min(1, 'Month required'),
  expiryYear: z.string().min(1, 'Year required'),
  cvv: z.string().length(3, 'CVV must be 3 digits').regex(/^\d+$/, 'Numbers only')
}).superRefine((val, ctx) => {
  if (val.expiryMonth && val.expiryYear) {
    const month = parseInt(val.expiryMonth, 10);
    const year = parseInt(val.expiryYear, 10);
    const currYear = new Date().getFullYear() % 100;
    const currMonth = new Date().getMonth() + 1;
    
    if (year < currYear || (year === currYear && month < currMonth)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Must not be a past date',
        path: ['expiryMonth'],
      });
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Must not be a past date',
        path: ['expiryYear'],
      });
    }
  }
});

const ShopProducts = () => {
  const { shopId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [shop, setShop] = useState(null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  
  const [cart, setCart] = useState([]);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [isOrdering, setIsOrdering] = useState(false);

  const { register, handleSubmit, formState: { errors }, reset } = useForm({
    resolver: zodResolver(checkoutSchema),
    defaultValues: { cardType: 'Visa' }
  });

  useEffect(() => {
    const fetchShopAndProducts = async () => {
      try {
        const [shopRes, productsRes] = await Promise.all([
          shopService.getShopById(shopId),
          shopService.getProductsByShop(shopId)
        ]);
        setShop(shopRes.data);
        setProducts(productsRes.data || []);
      } catch (error) {
        console.error('Failed to fetch shop/products:', error);
      } finally {
        setLoading(false);
      }
    };
    if (shopId) fetchShopAndProducts();
  }, [shopId]);

  const addToCart = (product) => {
    setCart(prev => {
      const existing = prev.find(item => item._id === product._id);
      if (existing) {
        if (existing.quantity >= product.stock) {
          alert('Maximum stock reached for this item.');
          return prev;
        }
        return prev.map(item => item._id === product._id 
          ? { ...item, quantity: item.quantity + 1 } : item);
      }
      return [...prev, { ...product, quantity: 1, maxStock: product.stock }];
    });
  };

  const updateQuantity = (productId, delta) => {
    setCart(prev => prev.map(item => {
      if (item._id === productId) {
        const newQ = item.quantity + delta;
        if (newQ > 0 && newQ <= item.maxStock) {
          return { ...item, quantity: newQ };
        }
      }
      return item;
    }));
  };

  const removeFromCart = (productId) => {
    setCart(prev => prev.filter(item => item._id !== productId));
  };

  const cartTotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  const onCheckoutSubmit = async (data) => {
    if (cart.length === 0) return alert('Cart is empty!');
    try {
      setIsOrdering(true);
      const studentId = user?._id || user?.id;
      const orderData = {
        shopId,
        shopName: shop?.shopName || shop?.name || 'Campus Shop',
        studentId,
        items: cart.map(c => ({
          product: c._id,
          name: c.name,
          price: c.price,
          quantity: c.quantity
        })),
        deliveryAddress: data.deliveryAddress,
      };

      const orderRes = await orderService.createOrder(orderData);
      const newOrderId = orderRes.data?.orderId || orderRes.data?._id;

      await orderService.processPayment(newOrderId, {
        cardType: data.cardType,
        nameOnCard: data.nameOnCard,
        cardNumber: data.cardNumber,
        expiryDate: `${data.expiryMonth.padStart(2, '0')}/${data.expiryYear.padStart(2, '0')}`,
        cvv: data.cvv
      });

      alert('Payment successful & order placed!');
      setCart([]);
      setIsCheckoutOpen(false);
      reset();
      navigate('/orders/my');
      
    } catch (error) {
      console.error('Checkout error:', error);
      alert(error.response?.data?.message || 'Failed to complete checkout.');
    } finally {
      setIsOrdering(false);
    }
  };

  const filteredProducts = products.filter(product => 
    product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    product.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) return <div className="flex justify-center items-center h-64"><LoadingSpinner size="lg" /></div>;

  return (
    <div className="space-y-6 relative">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/shops')} className="btn-outline">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Shops
          </button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{shop?.shopName || shop?.name || 'Shop'} Products</h1>
            <p className="text-gray-600 mt-1">Browse, add to cart, and order securely</p>
          </div>
        </div>
        
        <button onClick={() => setIsCheckoutOpen(true)} className="btn-primary relative">
          <ShoppingCart className="w-5 h-5 mr-2" />
          View Cart (Rs. {cartTotal})
          {cart.length > 0 && (
            <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs w-6 h-6 flex items-center justify-center rounded-full font-bold shadow-sm">
              {cart.reduce((s, i) => s + i.quantity, 0)}
            </span>
          )}
        </button>
      </div>

      <div className="flex bg-white p-4 rounded-xl shadow-sm border border-gray-100 gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search products..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="input pl-10"
          />
        </div>
      </div>

      {filteredProducts.length === 0 ? (
        <div className="card card-body p-12 text-center">
          <Package className="w-16 h-16 mx-auto mb-4 text-gray-300" />
          <h3 className="text-lg font-semibold mb-2">No Products Found</h3>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {filteredProducts.map((product) => (
            <div key={product._id} className="card p-4 flex flex-col h-full">
              {product.image ? (
                <img src={`http://localhost:5000${product.image}`} alt={product.name} className="w-full h-48 object-cover rounded-md mb-4" />
              ) : (
                <div className="w-full h-48 bg-gray-100 rounded-md mb-4 flex items-center justify-center">
                  <Package className="w-12 h-12 text-gray-300" />
                </div>
              )}
              
              <div className="flex-1">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-semibold text-gray-900">{product.name}</h3>
                  <span className="font-bold text-blue-600">Rs. {product.price}</span>
                </div>
                <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                  {product.category}
                </span>
                <p className="text-sm text-gray-600 mt-2 line-clamp-2">{product.description}</p>
                <div className="text-sm mt-2">
                  Stock: <span className={product.stock > 0 ? "text-accent-dark" : "text-red-600"}>
                    {product.stock > 0 ? `${product.stock} ${product.unit || 'units'}` : 'Out of Stock'}
                  </span>
                </div>
              </div>
              
              <button 
                onClick={() => addToCart(product)}
                disabled={product.stock <= 0}
                className="btn-outline w-full mt-4 flex items-center justify-center gap-2 border-sky-600 text-blue-600 hover:bg-blue-50"
              >
                <Plus className="w-4 h-4" /> Add to Cart
              </button>
            </div>
          ))}
        </div>
      )}

      {isCheckoutOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col">
            <div className="flex justify-between items-center p-6 border-b border-gray-100">
              <h2 className="text-2xl font-bold flex items-center gap-2">
                <ShoppingCart className="w-6 h-6" /> Your Cart
              </h2>
              <button type="button" onClick={() => setIsCheckoutOpen(false)} className="text-gray-400">
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              {cart.length === 0 ? (
                <div className="text-center py-8 text-gray-500">Cart is empty.</div>
              ) : (
                <div className="space-y-6">
                  <div className="space-y-4 text-sm">
                    {cart.map(item => (
                      <div key={item._id} className="flex items-center justify-between border-b pb-2">
                        <div>
                          <p className="font-medium">{item.name}</p>
                          <p className="text-gray-500">Rs. {item.price} x {item.quantity}</p>
                        </div>
                        <div className="flex items-center gap-3">
                          <button onClick={() => updateQuantity(item._id, -1)} className="px-2 border bg-gray-50">-</button>
                          <span>{item.quantity}</span>
                          <button onClick={() => updateQuantity(item._id, 1)} className="px-2 border bg-gray-50">+</button>
                          <span className="font-bold w-16 text-right">Rs. {item.price * item.quantity}</span>
                          <button onClick={() => removeFromCart(item._id)} className="text-red-500 ml-2"><X className="w-4 h-4"/></button>
                        </div>
                      </div>
                    ))}
                  </div>

                  <form id="checkout-form" onSubmit={handleSubmit(onCheckoutSubmit)} className="space-y-4 pt-4">
                    <h3 className="font-semibold text-lg flex items-center gap-2">
                      <Truck className="w-5 h-5" /> Delivery & Payment
                    </h3>
                    
                    <div>
                      <label className="form-label text-sm font-semibold">Campus Delivery Address *</label>
                      <input 
                        {...register('deliveryAddress')} 
                        placeholder="e.g. Block C, Library 2nd Floor" 
                        className={`input ${errors.deliveryAddress ? 'border-red-500' : ''}`} 
                      />
                      {errors.deliveryAddress && <p className="text-red-500 text-xs mt-1">{errors.deliveryAddress.message}</p>}
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="col-span-2 mt-4 font-semibold flex items-center border-b pb-2">
                         <CreditCard className="w-5 h-5 mr-2"/> Mock Payment Details
                      </div>
                      
                      <div className="col-span-2">
                        <label className="text-xs font-semibold">Card Type *</label>
                        <select {...register('cardType')} className="select">
                          <option value="Visa">Visa</option>
                          <option value="Mastercard">Mastercard</option>
                          <option value="Amex">Amex</option>
                        </select>
                      </div>
                      <div className="col-span-2 sm:col-span-1">
                        <label className="text-xs font-semibold">Name on Card *</label>
                        <input {...register('nameOnCard')} placeholder="JOHN DOE" className={`input ${errors.nameOnCard ? 'border-red-500' : ''}`} />
                        {errors.nameOnCard && <p className="text-red-500 text-xs mt-1">{errors.nameOnCard.message}</p>}
                      </div>
                      <div className="col-span-2 sm:col-span-1">
                        <label className="text-xs font-semibold">Card Number (16 Digits) *</label>
                        <input {...register('cardNumber')} placeholder="1234123412341234" maxLength={16} className={`input ${errors.cardNumber ? 'border-red-500' : ''}`} />
                        {errors.cardNumber && <p className="text-red-500 text-xs mt-1">{errors.cardNumber.message}</p>}
                      </div>
                      <div className="col-span-2 sm:col-span-1">
                        <label className="text-xs font-semibold">Expiry Date *</label>
                        <div className="flex gap-2">
                          <div className="w-1/2">
                            <select {...register('expiryMonth')} className={`select w-full ${errors.expiryMonth ? 'border-red-500' : ''}`}>
                              <option value="">MM</option>
                              {Array.from({ length: 12 }, (_, i) => i + 1).map(m => (
                                <option key={m} value={m.toString().padStart(2, '0')}>
                                  {m.toString().padStart(2, '0')}
                                </option>
                              ))}
                            </select>
                          </div>
                          <div className="w-1/2">
                            <select {...register('expiryYear')} className={`select w-full ${errors.expiryYear ? 'border-red-500' : ''}`}>
                              <option value="">YY</option>
                              {Array.from({ length: 15 }, (_, i) => new Date().getFullYear() % 100 + i).map(y => (
                                <option key={y} value={y.toString().padStart(2, '0')}>
                                  {y.toString().padStart(2, '0')}
                                </option>
                              ))}
                            </select>
                          </div>
                        </div>
                        {(errors.expiryMonth || errors.expiryYear) && (
                          <p className="text-red-500 text-xs mt-1">
                            {errors.expiryMonth?.message || errors.expiryYear?.message}
                          </p>
                        )}
                      </div>
                      <div className="col-span-2 sm:col-span-1">
                        <label className="text-xs font-semibold">CVV *</label>
                        <input {...register('cvv')} placeholder="123" maxLength={3} type="password" className={`input ${errors.cvv ? 'border-red-500' : ''}`} />
                        {errors.cvv && <p className="text-red-500 text-xs mt-1">{errors.cvv.message}</p>}
                      </div>
                    </div>
                  </form>
                </div>
              )}
            </div>

            {cart.length > 0 && (
              <div className="p-6 border-t bg-gray-50 flex items-center justify-between rounded-b-xl">
                <div>
                  <p className="text-sm">Total: <span className="text-2xl font-bold text-sky-700">Rs. {cartTotal + 50}</span></p>
                </div>
                <div className="flex gap-3">
                  <button type="button" onClick={() => setIsCheckoutOpen(false)} className="btn-outline">Cancel</button>
                  <button type="submit" form="checkout-form" disabled={isOrdering} className="btn-primary flex items-center">
                    {isOrdering ? <LoadingSpinner size="sm" /> : 'Pay Now'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
export default ShopProducts;
