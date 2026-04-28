"use client";

import { useState, useCallback, useEffect, useRef } from 'react';
import Toast from './Toast';
import styles from './ToastContainer.module.scss';
let toastEmitter = null;

export function showToast({ message, bgColor, fontColor, duration }) {
  if (toastEmitter) {
    toastEmitter({ message, bgColor, fontColor, duration });
  }
}

export default function ToastContainer() {
  const [toasts, setToasts] = useState([]);
  const counterRef = useRef(0);

  const addToast = useCallback((options) => {
    const id = ++counterRef.current;
    setToasts((prev) => {
      // Max 3 toasts at once on mobile
      const updated = prev.length >= 3 ? prev.slice(1) : prev;
      return [...updated, { id, ...options }];
    });
  }, []);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  useEffect(() => {
    toastEmitter = addToast;
    return () => {
      toastEmitter = null;
    };
  }, [addToast]);

  return (
    <div className={styles.container} aria-label="Notifications">
      {toasts.map((toast) => (
        <Toast
          key={toast.id}
          message={toast.message}
          bgColor={toast.bgColor}
          fontColor={toast.fontColor}
          duration={toast.duration}
          onClose={() => removeToast(toast.id)}
        />
      ))}
    </div>
  );
}