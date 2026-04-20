import { useNavigate } from 'react-router-dom';

export default function HeroSection() {
  const navigate = useNavigate();
  return (
    <section
      id="home"
      className="relative min-h-screen flex items-center pt-16 overflow-hidden"
      style={{
        background: 'linear-gradient(135deg, #1E3A8A 0%, #2563EB 40%, #3B82F6 60%, #93C5FD 80%, #FFFFFF 100%)',
      }}
    >
      {/* Decorative Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-[500px] h-[500px] bg-accent/10 rounded-full blur-3xl" />
        <div className="absolute top-1/2 -left-32 w-[400px] h-[400px] bg-blue-400/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/3 w-[300px] h-[300px] bg-accent/5 rounded-full blur-3xl" />
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-20">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Text Content */}
          <div className="text-center lg:text-left animate-fade-in-up">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-white/15 backdrop-blur-sm rounded-full mb-6 border border-white/20">
              <span className="w-2 h-2 bg-accent rounded-full animate-pulse-soft" />
              <span className="text-sm font-medium text-white/90">
                Student Health &amp; Wellness Platform
              </span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-white leading-tight mb-6">
              All-in-One Student{' '}
              <span className="relative">
                <span className="text-accent-light">Health</span>
                <svg className="absolute -bottom-2 left-0 w-full" viewBox="0 0 200 8" fill="none">
                  <path d="M1 5.5Q50 1 100 5.5T199 5.5" stroke="#34D399" strokeWidth="3" strokeLinecap="round" />
                </svg>
              </span>{' '}
              &amp; Smart Delivery Platform
            </h1>

            <p className="text-lg sm:text-xl text-blue-100 leading-relaxed mb-8 max-w-xl mx-auto lg:mx-0">
              Book doctor appointments, upload prescriptions, order groceries,
              and get AI-powered career guidance – all in one place.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
              <a href="#services" className="btn-primary text-lg px-10 py-4">
                <span>Get Started</span>
                <svg className="w-5 h-5 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </a>
              <button
                id="hero-order-now-btn"
                onClick={() => navigate('/delivery/shops')}
                className="btn-outline text-lg px-10 py-4"
              >
                <span>Order Now</span>
                <svg className="w-5 h-5 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                </svg>
              </button>
            </div>

            {/* Stats */}
            <div className="mt-10 pb-16 relative z-10 flex flex-wrap gap-8 justify-center lg:justify-start">
              {[
                { value: '10K+', label: 'Students' },
                { value: '500+', label: 'Doctors' },
                { value: '24/7', label: 'Support' },
              ].map((stat) => (
                <div key={stat.label} className="text-center">
                  <p className="text-2xl font-bold text-white">{stat.value}</p>
                  <p className="text-sm text-white/80">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Hero Image */}
          <div className="hidden lg:flex justify-center animate-slide-in-right">
            <div className="relative">
              <div className="absolute inset-0 bg-accent/20 rounded-3xl blur-2xl scale-95" />
              <img
                src="/images/hero.png"
                alt="CareMate - Student Health Platform"
                className="relative w-full max-w-lg rounded-3xl shadow-2xl animate-bounce-gentle"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Wave */}
      <div className="absolute bottom-0 left-0 right-0">
        <svg viewBox="0 0 1440 120" fill="none" className="w-full">
          <path
            d="M0 60L60 52C120 44 240 28 360 28C480 28 600 44 720 52C840 60 960 60 1080 52C1200 44 1320 28 1380 20L1440 12V120H1380C1320 120 1200 120 1080 120C960 120 840 120 720 120C600 120 480 120 360 120C240 120 120 120 60 120H0V60Z"
            fill="white"
          />
        </svg>
      </div>
    </section>
  );
}
