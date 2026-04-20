export default function ServiceCard({ icon, title, description, color }) {
  return (
    <div className="group relative bg-white rounded-2xl p-8 shadow-md shadow-gray-100 border border-gray-100 card-hover cursor-pointer">
      {/* Color accent top bar */}
      <div
        className="absolute top-0 left-8 right-8 h-1 rounded-b-full opacity-0 group-hover:opacity-100 transition-opacity duration-300"
        style={{ backgroundColor: color }}
      />

      {/* Icon */}
      <div
        className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl mb-6 group-hover:scale-110 transition-transform duration-300 shadow-lg"
        style={{ backgroundColor: `${color}15`, boxShadow: `0 8px 20px ${color}20` }}
      >
        {icon}
      </div>

      {/* Content */}
      <h3 className="text-xl font-bold text-primary-dark mb-3 group-hover:text-primary transition-colors duration-300">
        {title}
      </h3>
      <p className="text-gray-500 leading-relaxed mb-6">{description}</p>

      {/* Learn More */}
      <a
        href="#"
        className="inline-flex items-center gap-2 text-sm font-semibold transition-all duration-300 group-hover:gap-3"
        style={{ color }}
      >
        Learn More
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
        </svg>
      </a>
    </div>
  );
}
