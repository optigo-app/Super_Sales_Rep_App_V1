import React, { useEffect, useRef, useState } from "react";
// import BarcodeScannerComponent from 'react-qr-barcode-scanner';
import "./qrbarcodereader.css";
import { Scanner } from '@yudiel/react-qr-scanner';
import { useNavigate } from "react-router-dom";
const QRreader = ({setScanCompFlag}) => {
  const [data, setData] = React.useState("Not Found");
  const [scanShow, setScanShow] = useState(false);
  const [allData, setAllData] = useState([]);

  const scannerRef = useRef(null);

  const navigate = useNavigate();
  const handleScan = (result) => {
    let res = result?.toString();
    try {
      
      if (result) {
        setData(result);
        setAllData((prevData) => [result, ...prevData]);
        localStorage.setItem('jobno', JSON.stringify(result[0]?.['rawValue']));
        navigate("/job-list");
      }
    } 
    catch (error) {
      console.error(error);  
    }
  };

  const barcodeFormats = [ "aztec", "code_128", "code_39", "code_93", "codabar", "databar", "databar_expanded", "data_matrix", "dx_film_edge", "ean_13", "ean_8", "itf", "maxi_code", "micro_qr_code", "pdf417", "qr_code", "rm_qr_code", "upc_a", "upc_e", "linear_codes", "matrix_codes", "unknown" ];
  const handleError = (error) => {
    try {
        console.error("Camera error:", error);
    alert("Error accessing camera: " + error.message);    
    } catch (error) {
        console.error(error);
    }
    
  };

  // useEffect(() => {
  //   // Clean up the camera resources when the component is unmounted
  //   return () => {
  //     if (scanShow) {
  //       setScanShow(false);
  //     }
  //   };
  // }, [scanShow]);

  // const handleScanShow = () => {
  //   setScanShow((prevShow) => !prevShow);
  // };
  const handleStopScanning = () => {
    if (scannerRef.current) {
      scannerRef.current.stop(); // Stop the scanner if it has a stop method
    }
    if (scannerRef.current === null) {
      scannerRef.current.stop(); // Stop the scanner if it has a stop method
    }
    setScanCompFlag(false);
  };
  return(
    <>
    <div className=" container_barcode p-3">
      
        <div className="scanner-container">
        <Scanner 
          ref={scannerRef}
          width={200}
          height={200}
          // allowMultiple={true}
          constraints={{ video: { facingMode: "environment" } }}
          onScan={(result) => handleScan(result)}
          formats={barcodeFormats}
          onError={handleError}
          />
      </div> 
      
      <div className="mt-3">
        <h3>Scanned Results:</h3>
        <ul>
          {allData?.map((result, index) => (
            <li key={index}>{result[0]?.rawValue}</li>
          ))}
        </ul>
      </div>
      
      <button className="btn btn-dark" onClick={handleStopScanning}>Stop Scan</button>
      
      {/* <div className="mt-3 px-1"><button className="btn btn-primary" onClick={(e) => handleScanShow(e)}>Scan { scanShow ? 'On' : 'Off' }</button></div> */}
    </div>
    </>
  )
 
 
};

export default QRreader;