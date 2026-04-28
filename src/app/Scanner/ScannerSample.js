import React, { useContext, useEffect, useRef, useState } from "react";
import jsQR from "jsqr";
import Webcam from "react-webcam";
import { CameraContext } from "../../../contexts/CameraContext";

const Scanner = () => {
  const { stream, permissionGranted } = useContext(CameraContext);
  const webcamRef = useRef(null);
  const canvasRef = useRef(document.createElement("canvas"));
  const [qrData, setQrData] = useState(null);
  const [isScanning, setIsScanning] = useState(true);
  const [cameraKey, setCameraKey] = useState(Date.now());

  const decodeQR = () => {
    const video = webcamRef.current?.video;
    if (!video || video.readyState !== 4 || !isScanning) return;

    const ctx = canvasRef.current.getContext("2d", {
      willReadFrequently: true,
    });
    canvasRef.current.width = video.videoWidth;
    canvasRef.current.height = video.videoHeight;
    ctx.drawImage(
      video,
      0,
      0,
      canvasRef.current.width,
      canvasRef.current.height
    );

    const imageData = ctx.getImageData(
      0,
      0,
      canvasRef.current.width,
      canvasRef.current.height
    );
    const code = jsQR(imageData.data, imageData.width, imageData.height);
    if (code?.data) {
      addScan(code.data);
      setIsScanning(false);
      setTimeout(() => {
        setQrData(null); // clear previous scan visually
        setIsScanning(true); // resume scanning
      }, 2000);
    }
  };

  useEffect(() => {
    if (!isScanning) return;
    const interval = setInterval(decodeQR, 500);
    return () => clearInterval(interval);
  }, [isScanning]);

  // Reset scan when tab returns
  useEffect(() => {
    const handleVisibility = () => {
      if (!document.hidden) {
        setCameraKey(Date.now()); // refresh Webcam
        setIsScanning(true);
      }
    };
    document.addEventListener("visibilitychange", handleVisibility);
    return () =>
      document.removeEventListener("visibilitychange", handleVisibility);
  }, []);

  return (
    <div style={{ padding: 20 }}>
      <h2>📷 QR Scanner</h2>

      {permissionGranted === null && <p>Requesting camera access...</p>}
      {permissionGranted === false && (
        <p>
          ❌ Camera permission denied. Please allow access in browser settings.
        </p>
      )}

      {permissionGranted && (
        <>
          <Webcam
            key={cameraKey}
            ref={webcamRef}
            audio={false}
            screenshotFormat="image/jpeg"
            mirrored={false}
            videoConstraints={{ facingMode: "environment" }}
            onUserMedia={() => console.log("📷 Camera stream ready")}
            style={{
              width: "100%",
              border: "2px solid #000",
              borderRadius: "8px",
            }}
          />

          <div style={{ marginTop: 20 }}>
            <strong>📦 QR Data:</strong>{" "}
            {qrData ? <span>{qrData}</span> : <i>Waiting for scan...</i>}
          </div>
        </>
      )}
    </div>
  );
};

export default Scanner;

// import React, { useContext, useEffect, useRef, useState } from "react";
// import jsQR from "jsqr";
// import { CameraContext } from "../../../contexts/CameraContext";

// const Scanner = () => {
//   const { stream, permissionGranted } = useContext(CameraContext);
//   const videoRef = useRef(null);
//   const canvasRef = useRef(null);
//   const [qrData, setQrData] = useState(null);

//   useEffect(() => {
//     if (stream && videoRef.current) {
//       videoRef.current.srcObject = stream;
//     }
//   }, [stream]);

//   useEffect(() => {
//     const interval = setInterval(() => {
//       if (!canvasRef.current || !videoRef.current) return;
//       const video = videoRef.current;

//       if (video.readyState === 4) {
//         const canvas = canvasRef.current;
//         const context = canvas.getContext("2d", {
//           willReadFrequently: true,
//         });

//         canvas.width = video.videoWidth;
//         canvas.height = video.videoHeight;

//         context.drawImage(video, 0, 0, canvas.width, canvas.height);
//         const imageData = context.getImageData(
//           0,
//           0,
//           canvas.width,
//           canvas.height
//         );

//         const code = jsQR(imageData.data, canvas.width, canvas.height);
//         if (code?.data) {
//           setQrData(code.data);
//         }
//       }
//     }, 300);

//     return () => clearInterval(interval);
//   }, []);

//   return (
//     <div style={{ padding: 20 }}>
//       <h2>📷 QR Scanner</h2>

//       {permissionGranted === null && <p>Requesting camera access...</p>}
//       {permissionGranted === false && (
//         <p>❌ Camera permission denied. Please enable it manually.</p>
//       )}

//       {permissionGranted && (
//         <>
//           <video
//             ref={videoRef}
//             autoPlay
//             playsInline
//             muted
//             style={{
//               width: "100%",
//               border: "2px solid black",
//               borderRadius: "8px",
//             }}
//           />

//           <canvas ref={canvasRef} style={{ display: "none" }} />

//           <div style={{ marginTop: 20 }}>
//             <strong>📦 QR Data:</strong>{" "}
//             {qrData ? <span>{qrData}</span> : <i>Waiting...</i>}
//           </div>
//         </>
//       )}
//     </div>
//   );
// };

// export default Scanner;
