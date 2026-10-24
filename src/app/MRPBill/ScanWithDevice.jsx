import React from 'react'
import { useState } from 'react';
import { useEffect } from 'react';
import { useSetRecoilState } from 'recoil';
import { scannedValue } from '../../recoil/atom';
import { QrReader } from 'react-qr-reader';
import { useRef } from 'react';

const ScanWithDevice = () => {
    const [scannedValues, setScannedValues] = useState([]);
    const setScanValue = useSetRecoilState(scannedValue);
    // const scanRef = useRef(null);
    useEffect(() => {
        const handleScan = (event) => {
          // Capture scanned data from keyboard events
          if (event.key === 'Enter') {
            // Process scanned value here
            const value = event.target.value.trim();
            if (value) {
              setScanValue(value);
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
      return (
        <div>
        <img 
          src="path-to-your-image.jpg" 
          alt="Scan" 
          onClick={() => document.getElementById('scanner-input').focus()} 
          style={{ cursor: 'pointer' }}
        />
        <input 
          id="scanner-input"
          style={{ position: 'absolute', left: '-9999px' }} 
          autoFocus 
        />
      </div>
      );
}

export default ScanWithDevice