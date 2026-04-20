import { AlertCircle, CheckCircle, XCircle, X } from 'lucide-react';
import { useState, useEffect } from 'react';

const Notification = ({ type = 'info', message, onClose, duration = 5000 }) => {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(() => {
        setIsVisible(false);
        onClose?.();
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [duration, onClose]);

  if (!isVisible) return null;

  const configs = {
    success: {
      icon: CheckCircle,
      bgClass: 'bg-green-50 border-accent/20',
      iconClass: 'text-accent',
      textClass: 'text-accent-dark',
    },
    error: {
      icon: XCircle,
      bgClass: 'bg-red-50 border-red-200',
      iconClass: 'text-red-500',
      textClass: 'text-red-800',
    },
    warning: {
      icon: AlertCircle,
      bgClass: 'bg-yellow-50 border-yellow-200',
      iconClass: 'text-yellow-500',
      textClass: 'text-yellow-800',
    },
    info: {
      icon: AlertCircle,
      bgClass: 'bg-blue-50 border-blue-200',
      iconClass: 'text-blue-500',
      textClass: 'text-blue-800',
    },
  };

  const config = configs[type];

  return (
    <div
      className={`flex items-start gap-3 p-4 rounded-lg border ${config.bgClass} relative`}
      role="alert"
    >
      <config.icon className={`w-5 h-5 flex-shrink-0 ${config.iconClass}`} />
      <p className={`text-sm flex-1 ${config.textClass}`}>{message}</p>
      <button
        onClick={() => {
          setIsVisible(false);
          onClose?.();
        }}
        className={`${config.textClass} hover:opacity-70 transition-opacity`}
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
};

export default Notification;
