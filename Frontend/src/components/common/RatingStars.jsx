import { Star } from 'lucide-react';

const RatingStars = ({ rating, maxStars = 5, size = 'sm', showValue = false, onChange = null }) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6',
  };

  return (
    <div className="flex items-center gap-1">
      {[...Array(maxStars)].map((_, index) => {
        const filled = index < Math.floor(rating);
        const partial = !filled && index < rating;

        return (
          <Star
            key={index}
            className={`${sizeClasses[size]} ${
              filled
                ? 'text-yellow-400 fill-yellow-400'
                : partial
                ? 'text-yellow-400 fill-yellow-400'
                : 'text-gray-300'
            } ${onChange ? 'cursor-pointer hover:scale-110 transition-transform' : ''}`}
            onClick={() => onChange?.(index + 1)}
          />
        );
      })}
      {showValue && (
        <span className="ml-1 text-sm font-medium text-gray-700">{rating.toFixed(1)}</span>
      )}
    </div>
  );
};

export default RatingStars;
