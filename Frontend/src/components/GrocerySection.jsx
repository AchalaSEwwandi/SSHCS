import { useNavigate } from 'react-router-dom';
import ProductCard from './ProductCard';

const products = [
  {
    image: '/images/bananas.png',
    name: 'Fresh Bananas',
    price: 'Rs.49',
    badge: 'Fast Delivery',
  },
  {
    image: '/images/apples.png',
    name: 'Red Apples',
    price: 'Rs.89',
    badge: 'Fast Delivery',
  },
  {
    image: '/images/vegetables.png',
    name: 'Mixed Vegetables',
    price: 'Rs.120',
    badge: 'Fresh',
  },
  {
    image: '/images/chips.png',
    name: 'Snack Chips',
    price: 'Rs.35',
    badge: null,
  },
  {
    image: 'https://images.unsplash.com/photo-1563636619-e9143da7973b?w=400&h=400&fit=crop',
    name: 'Fresh Milk (1L)',
    price: 'Rs.65',
    badge: 'Daily Essential',
  },
  {
    image: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=400&h=400&fit=crop',
    name: 'Vitamin Supplements',
    price: 'Rs.199',
    badge: 'Health',
  },
];

export default function GrocerySection() {
  const navigate = useNavigate();
  return (
    <section id="grocery" className="section-padding bg-gray-50">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-accent/10 rounded-full mb-4">
            <span className="text-sm font-semibold text-accent">🛒 Grocery Store</span>
          </div>
          <h2 className="section-title">
            Order Groceries &amp; Essentials{' '}
            <span className="text-accent">Easily</span>
          </h2>
          <p className="section-subtitle">
            Fresh fruits, vegetables, snacks, and daily essentials — delivered fast right to your campus doorstep.
          </p>
        </div>

        {/* Products Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 lg:gap-6">
          {products.map((product) => (
            <ProductCard key={product.name} {...product} />
          ))}
        </div>

        {/* Bottom Banner */}
        <div className="mt-12 bg-gradient-to-r from-accent to-emerald-400 rounded-2xl p-8 md:p-10 flex flex-col md:flex-row items-center justify-between gap-6 shadow-xl shadow-accent/20">
          <div className="text-center md:text-left">
            <h3 className="text-2xl font-bold text-white mb-2">
              🚀 Free Delivery on First Order!
            </h3>
            <p className="text-emerald-100">
              Use code <span className="font-bold text-white">CAREMATE10</span> for 10% off
            </p>
          </div>
          <button
            id="grocery-order-btn"
            onClick={() => navigate('/delivery/shops')}
            className="px-8 py-3.5 bg-white text-accent font-bold rounded-full shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300"
          >
            Order Now →
          </button>
        </div>
      </div>
    </section>
  );
}
