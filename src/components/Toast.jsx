import { useEffect } from "react";

const Toast = ({ message, type = "success", onClose, duration = 4000 }) => {
  useEffect(() => {
    if (!message) return;
    const timer = setTimeout(() => {
      onClose();
    }, duration);

    return () => clearTimeout(timer);
  }, [message, duration, onClose]);

  if (!message) return null;

  const getIcon = () => {
    switch (type) {
      case "success": return "✅";
      case "error": return "❌";
      case "info": return "ℹ️";
      default: return "🔔";
    }
  };

  return (
    <div className={`toast-banner toast-${type}`} role="alert">
      <div className="toast-icon">{getIcon()}</div>
      <div className="toast-content">{message}</div>
      <button type="button" className="toast-close-btn" onClick={onClose} aria-label="Close message">
        ✕
      </button>
    </div>
  );
};

export default Toast;
