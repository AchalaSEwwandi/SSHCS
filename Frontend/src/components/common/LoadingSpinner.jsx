const LoadingSpinner = ({ size = 'md', className = '' }) => {
  const sizeClasses = {
    sm: 'w-4 h-4 border-2',
    md: 'w-8 h-8 border-3',
    lg: 'w-12 h-12 border-4',
  };

  return (
    <div className={`animate-spin rounded-full ${sizeClasses[size]} border-b-2 border-blue-600 ${className}`}></div>
  );
};

export default LoadingSpinner;
