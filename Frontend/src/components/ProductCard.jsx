export default function ProductCard({ image, name, price, badge }) {
  return (
    <div className="group bg-white rounded-2xl shadow-md shadow-gray-100 border border-gray-100 overflow-hidden card-hover min-w-[220px]">
      {/* Image Container */}
      <div className="relative h-48 bg-gray-50 overflow-hidden">
        <img
          src={image}
          alt={name}
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
        />
        {badge && (
          <span className="absolute top-3 left-3 px-3 py-1 bg-accent text-white text-xs font-bold rounded-full shadow-md shadow-accent/30 flex items-center gap-1">
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            {badge}
          </span>
        )}
      </div>

      {/* Info */}
      <div className="p-5">
        <h4 className="text-base font-semibold text-primary-dark mb-1 truncate">{name}</h4>
        <p className="text-lg font-bold text-accent mb-4">{price}</p>
        <button className="w-full py-2.5 bg-accent/10 text-accent font-semibold rounded-xl hover:bg-accent hover:text-white transition-all duration-300 flex items-center justify-center gap-2 group/btn">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 100 4 2 2 0 000-4z" />
          </svg>
          Add to Cart
        </button>
      </div>
    </div>
  );
}
