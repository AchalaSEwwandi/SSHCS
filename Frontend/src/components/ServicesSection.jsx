import ServiceCard from './ServiceCard';

const services = [
  {
    icon: '🩺',
    title: 'Doctor Appointment',
    description: 'Book and manage appointments easily with verified doctors. Get telehealth consultations from the comfort of your dorm.',
    color: '#3B82F6',
  },
  {
    icon: '💊',
    title: 'Prescription & Pharmacy',
    description: 'Upload prescriptions and connect with trusted pharmacies. Get medicines delivered right to your campus.',
    color: '#8B5CF6',
  },
  {
    icon: '🛒',
    title: 'Grocery & Essentials Delivery',
    description: 'Order daily grocery items, food, and essentials with a fast campus delivery system built for students.',
    color: '#10B981',
  },
  {
    icon: '🤖',
    title: 'AI Career Assistant',
    description: 'Get personalized career and academic guidance powered by AI. Resume review, interview prep, and more.',
    color: '#F59E0B',
  },
];

export default function ServicesSection() {
  return (
    <section id="services" className="section-padding bg-white">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-primary/5 rounded-full mb-4">
            <span className="text-sm font-semibold text-primary">Our Services</span>
          </div>
          <h2 className="section-title">
            Everything You Need,{' '}
            <span className="text-accent">One Platform</span>
          </h2>
          <p className="section-subtitle">
            From healthcare to groceries to career guidance — CareMate is your all-in-one companion for student life.
          </p>
        </div>

        {/* Cards Grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
          {services.map((service) => (
            <ServiceCard key={service.title} {...service} />
          ))}
        </div>
      </div>
    </section>
  );
}
