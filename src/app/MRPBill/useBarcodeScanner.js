// useBarcodeScanner.js
import { useState, useEffect } from 'react';

const useBarcodeScanner = () => {
  const [scannedValues, setScannedValues] = useState([]);

  useEffect(() => {
    const handleScan = (event) => {
      if (event.key === 'Enter') {
        const value = event.target.value.trim();
        if (value) {
          setScannedValues((prev) => [...prev, value]);
          event.target.value = ''; // Clear input after scan
        }
      }
    };

    const inputElement = document?.getElementById('scanner-input');
    inputElement?.addEventListener('keydown', handleScan);

    return () => {
      inputElement?.removeEventListener('keydown', handleScan);
    };
  }, []);

  return scannedValues;
};

export default useBarcodeScanner;