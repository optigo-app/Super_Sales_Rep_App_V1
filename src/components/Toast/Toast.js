import { useEffect, useRef } from 'react';
import styles from './Toast.module.scss';

export default function Toast({ message, bgColor, fontColor, duration, onClose }) {
  const timerRef = useRef(null);

  useEffect(() => {
    if (!message) return;

    timerRef.current = setTimeout(() => {
      onClose && onClose();
    }, duration || 3000);

    return () => clearTimeout(timerRef.current);
  }, [message, duration, onClose]);

  if (!message) return null;

  return (
    <div
      className={styles.toast}
      style={{
        backgroundColor: bgColor || '#333',
        color: fontColor || '#fff',
      }}
      role="alert"
      aria-live="polite"
    >
      <span className={styles.toast__icon}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" />
          <path d="M12 8v4m0 4h.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
      </span>
      <span className={styles.toast__message}>{message}</span>
      <button
        className={styles.toast__close}
        onClick={onClose}
        aria-label="Close notification"
        style={{ color: fontColor || '#fff' }}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
          <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
      </button>
      <div
        className={styles.toast__progress}
        style={{
          animationDuration: `${duration || 3000}ms`,
          backgroundColor: fontColor ? `${fontColor}40` : 'rgba(255,255,255,0.25)',
        }}
      />
    </div>
  );
}