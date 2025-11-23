import { useState, useEffect } from 'react';
import { CheckCircle, XCircle, AlertCircle, X } from 'lucide-react';

export function Notification({ type = 'success', message, onClose, duration = 3000 }) {
  const [isVisible, setIsVisible] = useState(true);
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(() => {
        handleClose();
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [duration]);

  const handleClose = () => {
    setIsExiting(true);
    setTimeout(() => {
      setIsVisible(false);
      if (onClose) onClose();
    }, 300);
  };

  if (!isVisible) return null;

  const configs = {
    success: {
      icon: CheckCircle,
      bgColor: 'bg-gradient-to-r from-green-400 to-emerald-500',
      iconColor: 'text-white',
      borderColor: 'border-green-500'
    },
    error: {
      icon: XCircle,
      bgColor: 'bg-gradient-to-r from-red-400 to-rose-500',
      iconColor: 'text-white',
      borderColor: 'border-red-500'
    },
    warning: {
      icon: AlertCircle,
      bgColor: 'bg-gradient-to-r from-yellow-400 to-orange-500',
      iconColor: 'text-white',
      borderColor: 'border-yellow-500'
    },
    info: {
      icon: AlertCircle,
      bgColor: 'bg-gradient-to-r from-blue-400 to-cyan-500',
      iconColor: 'text-white',
      borderColor: 'border-blue-500'
    }
  };

  const config = configs[type];
  const Icon = config.icon;

  return (
    <div 
      className={`fixed top-20 right-4 z-[100] transition-all duration-300 ${
        isExiting ? 'translate-x-[120%] opacity-0' : 'translate-x-0 opacity-100'
      }`}
    >
      <div className={`${config.bgColor} text-white rounded-2xl shadow-2xl p-4 min-w-[320px] max-w-md border-2 ${config.borderColor}`}>
        <div className="flex items-start space-x-3">
          <div className="flex-shrink-0">
            <Icon className={`w-6 h-6 ${config.iconColor}`} />
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium leading-relaxed">{message}</p>
          </div>
          <button
            onClick={handleClose}
            className="flex-shrink-0 hover:bg-white/20 rounded-full p-1 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        {/* Progress bar */}
        {duration > 0 && (
          <div className="mt-3 h-1 bg-white/30 rounded-full overflow-hidden">
            <div 
              className="h-full bg-white rounded-full animate-progress"
              style={{ animationDuration: `${duration}ms` }}
            ></div>
          </div>
        )}
      </div>
    </div>
  );
}

export function useNotification() {
  const [notifications, setNotifications] = useState([]);

  const showNotification = (type, message, duration = 3000) => {
    const id = Date.now();
    const newNotification = { id, type, message, duration };
    
    setNotifications(prev => [...prev, newNotification]);

    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== id));
    }, duration + 500);
  };

  const removeNotification = (id) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  return {
    notifications,
    success: (message, duration) => showNotification('success', message, duration),
    error: (message, duration) => showNotification('error', message, duration),
    warning: (message, duration) => showNotification('warning', message, duration),
    info: (message, duration) => showNotification('info', message, duration),
    removeNotification
  };
}

function NotificationDemo() {
  const notification = useNotification();

  return (
    <div className="min-h-screen bg-[#fffbf8] p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-serif text-[#cb5094] mb-8 text-center">Custom Notifications</h1>
        
        <div className="bg-white rounded-2xl shadow-lg p-8 space-y-4">
          <h2 className="text-2xl font-semibold text-gray-800 mb-6">Try Different Notifications:</h2>
          
          <button
            onClick={() => notification.success('Login berhasil! Selamat datang kembali', 4000)}
            className="w-full bg-green-500 hover:bg-green-600 text-white font-bold py-4 px-6 rounded-xl transition transform hover:scale-105 active:scale-95"
          >
            Show Success Notification
          </button>

          <button
            onClick={() => notification.error('Email atau password salah. Silakan coba lagi', 4000)}
            className="w-full bg-red-500 hover:bg-red-600 text-white font-bold py-4 px-6 rounded-xl transition transform hover:scale-105 active:scale-95"
          >
            Show Error Notification
          </button>

          <button
            onClick={() => notification.warning('Password minimal 8 karakter', 4000)}
            className="w-full bg-yellow-500 hover:bg-yellow-600 text-white font-bold py-4 px-6 rounded-xl transition transform hover:scale-105 active:scale-95"
          >
            Show Warning Notification
          </button>

          <button
            onClick={() => notification.info('Silakan cek email untuk verifikasi akun Anda', 4000)}
            className="w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-4 px-6 rounded-xl transition transform hover:scale-105 active:scale-95"
          >
            Show Info Notification
          </button>

          <div className="mt-8 p-6 bg-gray-50 rounded-xl">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Usage Example:</h3>
            <pre className="bg-gray-800 text-green-400 p-4 rounded-lg overflow-x-auto text-sm">
{`import { useNotification } from './Notification';

function MyComponent() {
  const notification = useNotification();

  const handleLogin = async () => {
    try {
      // ... login logic
      notification.success('Login berhasil!', 3000);
    } catch (error) {
      notification.error('Login gagal', 3000);
    }
  };

  return (
    <>
      {/* Your component */}
      
      {/* Render notifications */}
      {notification.notifications.map(notif => (
        <Notification
          key={notif.id}
          type={notif.type}
          message={notif.message}
          duration={notif.duration}
          onClose={() => notification.removeNotification(notif.id)}
        />
      ))}
    </>
  );
}`}
            </pre>
          </div>
        </div>
      </div>

      <div className="fixed top-0 right-0 z-[100] space-y-3 p-4">
        {notification.notifications.map((notif) => (
          <Notification
            key={notif.id}
            type={notif.type}
            message={notif.message}
            duration={notif.duration}
            onClose={() => notification.removeNotification(notif.id)}
          />
        ))}
      </div>

      <style>{`
        @keyframes progress {
          from {
            width: 100%;
          }
          to {
            width: 0%;
          }
        }
        
        .animate-progress {
          animation: progress linear forwards;
        }
      `}</style>
    </div>
  );
}

export default NotificationDemo;