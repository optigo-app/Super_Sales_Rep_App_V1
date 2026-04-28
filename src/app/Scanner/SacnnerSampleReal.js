import React, { useCallback, useEffect, useRef, useState } from "react";
import { QrReader } from "react-qr-reader";
import "./Scanner.scss";
import { Box, Button, CircularProgress, Stack } from "@mui/material";
import {
  AlignJustify,
  CircleX,
  Keyboard,
  Printer,
  ScanLine,
  Share2,
  Tally3,
  Trash,
} from "lucide-react";
import PlaceHolderImg from "../../Assets/placeHolderImg.svg";
import {
  MdKeyboardDoubleArrowDown,
  MdKeyboardDoubleArrowUp,
} from "react-icons/md";
import productData from "./ProductData.json";
import { CommonAPImain } from "../../../Utils/API/CommonAPImain/CommonAPImain";
import { CommonAPImainScan } from "../../../Utils/API/CommonAPImain/CommonAPImainScan";
import PritnModel from "./PritnModel";
import html2pdf from "html2pdf.js";
import Webcam from "react-webcam";
import jsQR from "jsqr";
import { BsInfoCircleFill } from "react-icons/bs";
import ConfirmationDialog from "../../ConfirmationDialog/ConfirmationDialog";
import { showToast } from "@/components/Toast/ToastContainer";

const CANVAS_SIDE = 400; // side‑length we’ll decode at (≤ BOX_PX * devicePixelRatio)
const SCAN_INTERVAL = 200; // ms between decode attempts  (≈5 fps)
const hasBarcodeAPI = "BarcodeDetector" in window;

const Scanner = () => {
  const [scannedData, setScannedData] = useState([]);
  const [mode, setMode] = useState("qr");
  const [manualInput, setManualInput] = useState("");
  const [activeDetail, setActiveDetail] = useState(null);
  const [isExpanded, setIsExpanded] = useState(true);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [printInfo, setPrintInfo] = useState();
  const [priceBreackUpAllValues, setPriceBreackUpAllValues] = useState();
  const [expandedItems, setExpandedItems] = useState([]);
  const printRef = useRef(null);
  const webcamRef = useRef(null);
  const canvasRef = useRef(document.createElement("canvas"));
  const trackRef = useRef(null);
  const decodeTimerRef = useRef(null);
  const detectorRef = useRef(
    hasBarcodeAPI ? new window.BarcodeDetector({ formats: ["qr_code"] }) : null
  );
  const [permissionGranted, setPermissionGranted] = useState(null);
  const [zoomCap, setZoomCap] = useState(null);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [cameraKey, setCameraKey] = useState(Date.now());
  const [isOpen, setIsOpen] = useState(false);
  const [opencnfDialogOpen, setOpenCnfDialog] = useState(false);

  const [removeJobNo, setRemoveJobNo] = useState("");
  const handleCloseDialog = () => setOpenCnfDialog(false);
  const toggleDrawer = () => setIsOpen(!isOpen);

  useEffect(() => {
    navigator.mediaDevices
      .getUserMedia({ video: true })
      .then((stream) => {
        stream.getTracks().forEach((t) => t.stop());
        setPermissionGranted(true);
      })
      .catch(() => setPermissionGranted(false))
      .finally(() => console.log("finally..."));
  }, []);

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        retryPermission();
      }
    };
    const handleFocus = () => {
      retryPermission();
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("focus", handleFocus);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("focus", handleFocus);
    };
  }, []);

  useEffect(() => {
    const savedScans = sessionStorage.getItem("AllScanJobData");
    if (savedScans) {
      try {
        const parsed = JSON.parse(savedScans);
        if (Array.isArray(parsed)) {
          setScannedData(parsed);
          if (parsed.length > 0) {
            setActiveDetail(parsed[0]);
          }
        } else {
          console.error(
            "Invalid data found in sessionStorage for AllScanJobData:",
            parsed
          );
          setScannedData([]);
        }
      } catch (e) {
        console.error("Error parsing AllScanJobData from sessionStorage:", e);
        setScannedData([]);
      }
    }
  }, []);

  const handleUserMedia = (stream) => {
    const [track] = stream.getVideoTracks();
    trackRef.current = track;
    const caps = track.getCapabilities?.();
    if (caps?.zoom) {
      const { min, max, step = 0.1 } = caps.zoom;
      setZoomCap({ min, max, step });
      setZoomLevel(min ?? 1);
      track.applyConstraints({ advanced: [{ zoom: min }] }).catch(() => {});
    }
    canvasRef.current.width = CANVAS_SIDE;
    canvasRef.current.height = CANVAS_SIDE;
    decodeTimerRef.current = setInterval(decodeFrame, SCAN_INTERVAL);
  };

  const BOX = 220;
  const decodeFrame = useCallback(async () => {
    const video = webcamRef.current?.video;
    if (!video || video.readyState < 2) return;
    const { videoWidth: w, videoHeight: h } = video;
    const side = Math.min(w, h);
    const sx = (w - side) / 2;
    const sy = (h - side) / 2;
    const ctx = canvasRef.current.getContext("2d", {
      willReadFrequently: true,
    });
    ctx.drawImage(video, sx, sy, side, side, 0, 0, CANVAS_SIDE, CANVAS_SIDE);
    let result = null;
    if (hasBarcodeAPI) {
      const barcodes = await detectorRef.current.detect(canvasRef.current);
      if (barcodes.length) result = barcodes[0].rawValue;
    } else {
      const imgData = ctx.getImageData(0, 0, CANVAS_SIDE, CANVAS_SIDE);
      const code = jsQR(imgData.data, imgData.width, imgData.height);
      result = code?.data;
    }

    if (result) {
      const jobNo = result.trim();
      setIsLoading(true);
      addScan(jobNo);
    }
  }, []);

  const retryPermission = () => {
    setPermissionGranted(null);
    navigator.mediaDevices
      .getUserMedia({ video: true })
      .then((stream) => {
        stream.getTracks().forEach((t) => t.stop()); // stop test stream
        setPermissionGranted(true);
        setCameraKey(Date.now()); // trigger re-render of <Webcam />
      })
      .catch(() => {
        setPermissionGranted(false);
      });
  };

  const addScan = useCallback(async (jobNumber) => {
    const list = JSON.parse(sessionStorage.getItem("AllScanJobData") || "[]");

    const alreadyScanned = list?.some((item) => item?.JobNo === jobNumber);
    if (alreadyScanned) {
      showToast({
        message: "Job already scanned",
        bgColor: "#f1c40f",
        fontColor: "#000",
        duration: 4000,
      });
      setIsLoading(false);
      return;
    }

    setIsLoading(true);

    try {
      const response = await CommonAPImainScan("TagInfo", jobNumber);
      const jobData = response?.Data?.rd?.[0];

      if (!jobData) {
        setError("Invalid Job Number or No Data Found.");
        setTimeout(() => setError(""), 5000);
        setIsLoading(false);
        return;
      }

      const formatted = {
        JobNo: jobData.JobNo,
        designNo: jobData.DesignNo,
        price: jobData.Amount,
        AmountWithtax: jobData.AmountWithtax,
        taxAmount: jobData.TaxAmount,
        metal: jobData.metal,
        diamoond: jobData.diamoond,
        colorStone: jobData.colorStone,
        makingCharge: jobData.makingCharge,
        netWeight: jobData.NetWt?.toFixed(3),
        GrossWeight: jobData.GrossWt?.toFixed(3),
        CartListId: jobData.CartListId,
        TotalNetWtPrice: jobData?.TotalMakingCost || 0,
        TotalMetalCost: jobData?.TotalMetalCost || 0,
        TotalDiamondWtPrice: jobData?.TotalDiamondCost || 0,
        TotalColosrStoneWtPrice: jobData?.TotalColorstoneCost || 0,
        TotalMiscWtPrice: jobData?.TotalMiscCost || 0,
        TotalMakingWtPrice:
          (jobData?.TotalDiamondhandlingCost || 0) +
          (jobData?.TotalSettingCost || 0) +
          (jobData?.TotalOtherCost || 0) +
          (jobData?.TotalMakingCost || 0),
        WishListId: jobData.WishListId,
        Category: jobData.Category,
        DiamondWtP:
          jobData?.DiaWt || jobData?.DiaPcs
            ? `${jobData?.DiaWt ? jobData.DiaWt.toFixed(3) : ""}${
                jobData?.DiaWt && jobData?.DiaPcs ? " / " : ""
              }${jobData?.DiaPcs ? jobData.DiaPcs + " pc" : ""}`
            : null,
        colorStoneWtP:
          jobData?.CsWt || jobData?.CsPcs
            ? `${jobData?.CsWt ? jobData.CsWt.toFixed(3) : ""}${
                jobData?.CsWt && jobData?.CsPcs ? " / " : ""
              }${jobData?.CsPcs ? jobData.CsPcs + " pc" : ""}`
            : null,
        MiscWtP:
          jobData?.MiscWt || jobData?.MiscPcs
            ? `${jobData?.MiscWt ? jobData.MiscWt.toFixed(3) : ""}${
                jobData?.MiscWt && jobData?.MiscPcs ? " / " : ""
              }${jobData?.MiscPcs ? jobData.MiscPcs + " pc" : ""}`
            : null,
        MetalTypeTitle: `${
          jobData?.MetalPurity +
          " " +
          jobData?.MetalTypeName +
          " " +
          jobData?.MetalColorName
        }`,
        status: "Scanned",
        image: jobData?.CDNDesignImageFol + jobData?.ImageName || "",
        isInCartList: jobData?.isInCartList || 0,
        isInWishList: jobData?.isInWishList || 0,
      };

      setScannedData((prevScannedData) => {
        const currentScans = Array.isArray(prevScannedData)
          ? prevScannedData
          : [];
        const updatedData = [
          formatted,
          ...currentScans.filter((j) => j.JobNo !== formatted.JobNo),
        ];
        sessionStorage.setItem("AllScanJobData", JSON.stringify(updatedData));
        return updatedData;
      });
      setExpandedItems([0]);
      setActiveDetail(formatted);
      setIsExpanded(true);
      setError(null);
    } catch (err) {
      console.error("Error during scan", err);
      showToast({
        message: "Invalid Job",
        bgColor: "#f13f3f",
        fontColor: "#fff",
        duration: 5000,
      });
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleManualSave = () => {
    if (manualInput.trim()) {
      addScan(manualInput.trim());
      setManualInput("");
    }
  };

  const renderCollapsedTop = () =>
    activeDetail && (
      <div
        className="top-detail-card collapsed"
        onClick={() => setIsExpanded(true)}
      >
        <div className="left">
          <strong>{activeDetail.jobNumber}</strong>
          <p>₹{activeDetail.price}</p>
        </div>
        <div className="right">Tap to open</div>
      </div>
    );

  const handlePrint = (data, allData) => {
    const savedScans = JSON.parse(sessionStorage.getItem("AllScanJobData"));
    const matchedArray = savedScans.filter((item) => item.JobNo === data);
    if (allData) {
      setPrintInfo(savedScans);
    } else {
      setPrintInfo(matchedArray);
    }
    const element = document.getElementById("printSection");

    element.style.display = "block";
    const height = allData
      ? savedScans?.length > 2
        ? savedScans?.length > 3
          ? savedScans?.length * 50
          : savedScans?.length * 55
        : 130
      : 100;
    console.log("heightheight", height);

    const opt = {
      margin: [5, 5, 5, 5],
      filename: "estimate.pdf",
      image: { type: "jpeg", quality: 0.98 },
      html2canvas: { scale: 2 },
      jsPDF: { unit: "mm", format: [73, height], orientation: "portrait" },
    };

    html2pdf()
      .set(opt)
      .from(element)
      .outputPdf("blob")
      .then((blob) => {
        const fileName = "estimate.pdf";
        element.style.display = "none";
        if (window.flutter_inappwebview) {
          const reader = new FileReader();
          reader.onloadend = () => {
            const base64data = reader.result.split(",")[1];
            window.flutter_inappwebview.callHandler(
              "downloadPDF",
              base64data,
              fileName
            );
          };
          reader.readAsDataURL(blob);
        } else {
          // fallback download in browser
          const link = document.createElement("a");
          link.href = URL.createObjectURL(blob);
          link.download = fileName;
          document.body.appendChild(link);
          link.click();
          link.remove();
        }
      });
  };

  const handleShare = (data, allData) => {
    const savedScans = JSON.parse(sessionStorage.getItem("AllScanJobData"));
    const matchedArray = savedScans.filter((item) => item.JobNo === data);
    if (allData) {
      setPrintInfo(savedScans);
    } else {
      setPrintInfo(matchedArray);
    }
    const element = document.getElementById("printSection");
    element.style.display = "block";
    const opt = {
      margin: [5, 5, 5, 5],
      filename: "estimate.pdf",
      image: { type: "jpeg", quality: 0.98 },
      html2canvas: { scale: 2 },
      jsPDF: { unit: "mm", format: [73, 297], orientation: "portrait" },
    };

    html2pdf()
      .set(opt)
      .from(element)
      .outputPdf("blob")
      .then((blob) => {
        const fileName = "estimate.pdf";
        element.style.display = "none";
        if (window.flutter_inappwebview) {
          const reader = new FileReader();
          reader.onloadend = () => {
            const base64data = reader.result.split(",")[1];
            window.flutter_inappwebview.callHandler(
              "sharePDF",
              base64data,
              fileName
            );
          };
          reader.readAsDataURL(blob);
        } else {
          const link = document.createElement("a");
          link.href = URL.createObjectURL(blob);
          link.download = fileName;
          document.body.appendChild(link);
          link.click();
          link.remove();
        }
      });
  };

  const renderExpandedTop = () =>
    activeDetail && (
      <div className="SignleCard_Main">
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <span style={{ fontSize: "17px", fontWeight: 600 }}>
              {activeDetail.designNo} ({activeDetail?.JobNo})
            </span>
            <span style={{ fontSize: "15px" }}>{activeDetail.Category}</span>
          </div>
          <p className="singleCard_priceView">₹{activeDetail.AmountWithtax}</p>
        </div>
        <div style={{ display: "flex", padding: "5px 0px 0px 0px" }}>
          <div style={{ width: "35%" }}>
            <img
              src={activeDetail?.image}
              onError={(e) => (e.target.src = PlaceHolderImg)}
              style={{ width: "100%" }}
            />
          </div>
          <div style={{ width: "65%", padding: "0px 0px 0px 5px" }}>
            {activeDetail?.discountedPrice && (
              <div>
                <p
                  style={{
                    margin: "5px 0px",
                    color: "#988d8d",
                    fontSize: "15px",
                  }}
                >
                  Discounted Price
                </p>
                <p
                  style={{
                    margin: "5px 0px",
                    fontSize: "20px",
                    fontWeight: 600,
                  }}
                >
                  {" "}
                  ₹{activeDetail.discountedPrice}
                </p>
              </div>
            )}
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "8px",
              }}
            >
              <p
                className="desc_metal_line"
                style={{
                  fontWeight: 600,
                  margin: "0px",
                  fontSize: "13px",
                }}
              >
                Metal : {activeDetail?.MetalTypeTitle}
              </p>
              <div style={{ display: "flex" }}>
                <div style={{ width: "30%" }}>
                  <p className="info_main_section">
                    GWT<span style={{ fontSize: "10px" }}>(gm)</span>:{" "}
                  </p>
                  <span className="info_main_section_span">
                    {activeDetail.GrossWeight}{" "}
                  </span>
                </div>
                <div style={{ width: "33.33%" }}>
                  <p className="info_main_section">
                    NWT<span style={{ fontSize: "10px" }}>(gm)</span>:
                  </p>
                  <span className="info_main_section_span">
                    {activeDetail.netWeight}{" "}
                  </span>
                </div>
                <div style={{ width: "36.66%" }}>
                  <p className="info_main_section">
                    Dia.<span style={{ fontSize: "10px" }}>(Ct)</span>:
                  </p>
                  <span className="info_main_section_span">
                    {activeDetail.DiamondWtP}{" "}
                  </span>
                </div>
              </div>

              <div style={{ display: "flex" }}>
                <div style={{ width: "38%" }}>
                  <p className="info_main_section">
                    CS<span style={{ fontSize: "10px" }}>(Ct)</span>:{" "}
                  </p>
                  <span className="info_main_section_span">
                    {activeDetail.colorStoneWtP}
                  </span>
                </div>
                <div style={{ width: "38%" }}>
                  <p className="info_main_section">
                    Misc <span style={{ fontSize: "10px" }}>(gm)</span>:
                  </p>
                  <span className="info_main_section_span">
                    {activeDetail.MiscWtP}
                  </span>
                </div>
              </div>
              <div
                style={{
                  display: "flex",
                  justifyContent: "flex-end",
                  alignItems: "end",
                  margin: "10px",
                  gap: "10px",
                  zIndex: isOpen && "-1",
                }}
              >
                <Button
                  style={{
                    color: "#b8860b",
                    margin: "0px",
                    padding: "0px",
                    minWidth: "40px",
                  }}
                  onClick={() => handlePrint(activeDetail?.JobNo, false)}
                >
                  <Printer />
                </Button>

                <Button
                  style={{
                    color: "#b8860b",
                    padding: "0px",
                    margin: "0px",
                    minWidth: "40px",
                  }}
                  onClick={() => handleShare(activeDetail?.JobNo, false)}
                >
                  <Share2 />
                </Button>

                <Button
                  style={{
                    color: "#b8860b",
                    padding: "0px",
                    margin: "0px",
                    minWidth: "40px",
                  }}
                  onClick={() => {
                    toggleDrawer();
                    setPriceBreackUpAllValues(activeDetail);
                  }}
                >
                  <BsInfoCircleFill style={{ fontSize: "25px" }} />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );

  const handleConfirmRemoveAll = () => {
    const list = JSON.parse(sessionStorage.getItem("AllScanJobData") || "[]");
    const updatedList = list.filter((item) => item.JobNo !== removeJobNo);
    sessionStorage.setItem("AllScanJobData", JSON.stringify(updatedList));
    setScannedData(updatedList);
    setActiveDetail(null);
    setExpandedItems([]);
    setIsExpanded(false);
    setOpenCnfDialog(false);
    return updatedList;
  };

  return (
    <div>
      {isLoading && (
        <div className="loader-overlay">
          <CircularProgress className="loadingBarManage" />
        </div>
      )}

      <div className="mobile-drawer-container">
        <div
          className={`drawer-overlay ${isOpen ? "open" : ""}`}
          onClick={toggleDrawer}
        ></div>
        <div className={`drawer-from-bottom ${isOpen ? "open" : ""}`}>
          <div className="drawer-content">
            <h2 style={{ margin: "5px" }}>Price Breakup</h2>
            <div>
              <div className="price_breack_div">
                <p className="price_breack_div_titles">Metal (incl. finding)</p>
                <p className="price_breack_div_values">
                  ₹ {priceBreackUpAllValues?.TotalMetalCost}
                </p>
              </div>
              <div className="price_breack_div">
                <p className="price_breack_div_titles">Diamond</p>
                <p className="price_breack_div_values">
                  ₹ {priceBreackUpAllValues?.TotalDiamondWtPrice}
                </p>
              </div>
              <div className="price_breack_div">
                <p className="price_breack_div_titles">Color Stone</p>
                <p className="price_breack_div_values">
                  ₹ {priceBreackUpAllValues?.TotalColosrStoneWtPrice}
                </p>
              </div>
              <div className="price_breack_div">
                <p className="price_breack_div_titles">Misc</p>
                <p className="price_breack_div_values">
                  ₹ {priceBreackUpAllValues?.TotalMiscWtPrice}
                </p>
              </div>
              <div className="price_breack_div">
                <p className="price_breack_div_titles">Making Charges</p>
                <p className="price_breack_div_values">
                  ₹ {priceBreackUpAllValues?.TotalMakingWtPrice}
                </p>
              </div>
              <div className="price_breack_div">
                <p className="price_breack_div_titles">Tax Amount</p>
                <p className="price_breack_div_values">
                  ₹ {priceBreackUpAllValues?.taxAmount}
                </p>
              </div>

              <div
                className="price_breack_div"
                style={{ borderTop: "1px solid #686363" }}
              >
                <p className="price_breack_div_titles_total">Total</p>
                <p className="price_breack_div_values_total">
                  ₹{" "}
                  {priceBreackUpAllValues?.TotalMetalCost +
                    priceBreackUpAllValues?.TotalDiamondWtPrice +
                    priceBreackUpAllValues?.TotalColosrStoneWtPrice +
                    priceBreackUpAllValues?.TotalMiscWtPrice +
                    priceBreackUpAllValues?.TotalMakingWtPrice +
                    priceBreackUpAllValues?.taxAmount}
                </p>
              </div>
            </div>
            <button
              onClick={toggleDrawer}
              style={{
                border: "none",
                position: "absolute",
                top: "10px",
                right: "10px",
                background: "none",
              }}
            >
              <CircleX />
            </button>
          </div>
        </div>
      </div>

      <div className="scanner-container">
        {
          // !isLoading &&
          mode === "qr" ? (
            <div className="scanner-wrapper" style={{ "--box": `${BOX}px` }}>
              {permissionGranted === false && (
                <div
                  style={{
                    height: "250px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexDirection: "column",
                  }}
                >
                  <p className="status">❌ Camera permission denied.</p>
                  <Button
                    onClick={retryPermission}
                    style={{
                      height: "35px",
                      width: "100px",
                      backgroundColor: "#00a2e1",
                      color: "white",
                    }}
                  >
                    Retry
                  </Button>
                </div>
              )}

              {permissionGranted && (
                <>
                  <div
                    className="scanner-wrapper"
                    style={{
                      height: "300px",
                      width: "100%",
                      zIndex: -99999999999999999,
                    }}
                  >
                    <div
                      className={`camera-container ${
                        zoomCap ? "camera-hw-zoom" : "camera-css-zoom"
                      }`}
                    >
                      <Webcam
                        key={cameraKey}
                        ref={webcamRef}
                        mirrored={false}
                        audio={false}
                        playsInline
                        muted
                        className="camera-feed"
                        onUserMedia={handleUserMedia}
                        onUserMediaError={() => setPermissionGranted(false)}
                        videoConstraints={{
                          facingMode: { ideal: "environment" },
                          width: { ideal: 640 },
                          height: { ideal: 480 },
                          advanced: zoomCap ? [{ zoom: zoomLevel }] : undefined,
                        }}
                      />
                      <div className="scan-box" />
                    </div>
                  </div>
                </>
              )}
            </div>
          ) : mode == "AllScanItem" ? (
            <div></div>
          ) : (
            <div className="manual-input">
              <input
                type="text"
                value={manualInput}
                onChange={(e) => setManualInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    handleManualSave();
                  }
                }}
                placeholder="Enter job number"
              />
              <button onClick={handleManualSave}>Save</button>
            </div>
          )
        }

        {error && mode != "AllScanItem" && (
          <p
            className="error_message_scanner"
            style={{ color: "red", margin: "0px", fontSize: "12px" }}
          >
            {error}
          </p>
        )}

        {activeDetail && mode != "AllScanItem" && (
          <div
            style={{
              marginBottom: mode !== "qr" && "200px",
              marginTop: "20px",
            }}
          >
            {isExpanded ? renderExpandedTop() : renderCollapsedTop()}
          </div>
        )}

        {scannedData.length !== 0 && mode === "AllScanItem" ? (
          <div className="expand_container_All_job">
            {scannedData.map((data, idx) => {
              const isExpanded = expandedItems.includes(idx);
              return (
                <div key={idx} className="recent-item">
                  <div
                    className="top-detail-card_Big"
                    style={{
                      border: "1px solid #ccc",
                      marginBottom: "10px",
                      overflow: "hidden",
                      boxShadow:
                        "rgba(0, 0, 0, 0.01) 0px 0px 3px 0px, rgba(27, 31, 35, 0.1) 0px 0px 0px 1px !important",
                      backgroundColor: "white",
                    }}
                  >
                    <div
                      className="summary-row"
                      onClick={() => {
                        setExpandedItems((prev) =>
                          prev.includes(idx)
                            ? prev.filter((i) => i !== idx)
                            : [...prev, idx]
                        );
                      }}
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        padding: "5px",
                        cursor: "pointer",
                      }}
                    >
                      <div style={{ width: "100%" }}>
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                          }}
                        >
                          <span style={{ fontSize: "17px", fontWeight: 600 }}>
                            {data.designNo}({data?.JobNo})
                          </span>

                          <p className="singleCard_priceView">
                            ₹ {data.AmountWithtax}
                          </p>
                        </div>
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                          }}
                        >
                          <span style={{ fontSize: "15px" }}>
                            {data.Category}
                          </span>
                          <div style={{ fontSize: "1.5rem" }}>
                            {isExpanded ? (
                              <MdKeyboardDoubleArrowUp
                                style={{
                                  height: "20px",
                                  width: "20px",
                                  borderRadius: "50px",
                                  color: "#b3b2b2",
                                }}
                              />
                            ) : (
                              <MdKeyboardDoubleArrowDown
                                style={{
                                  height: "20px",
                                  width: "20px",
                                  borderRadius: "50px",
                                  color: "#b3b2b2",
                                }}
                              />
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div
                      className={`expand-wrapper ${
                        isExpanded ? "expanded" : ""
                      }`}
                    >
                      {isExpanded && (
                        <div
                          className={`expand-wrapper ${
                            isExpanded ? "expanded" : ""
                          }`}
                        >
                          <div
                            style={{
                              display: "flex",
                              padding: "5px 0px 0px 5px",
                              borderTop: "1px solid rgb(221 221 221 / 42%)",
                            }}
                          >
                            <div style={{ width: "35%" }}>
                              <img
                                src={data?.image}
                                onError={(e) => (e.target.src = PlaceHolderImg)}
                                style={{
                                  width: "100%",
                                }}
                              />
                            </div>

                            <div
                              style={{
                                width: "65%",
                                padding: "0px 0px 0px 5px",
                              }}
                            >
                              {data?.discountedPrice && (
                                <div>
                                  <p
                                    style={{
                                      margin: "5px 0px",
                                      color: "#988d8d",
                                      fontSize: "15px",
                                    }}
                                  >
                                    Discounted Price
                                  </p>
                                  <p
                                    style={{
                                      margin: "5px 0px",
                                      fontSize: "20px",
                                      fontWeight: 600,
                                    }}
                                  >
                                    {" "}
                                    ₹{data.discountedPrice}
                                  </p>
                                </div>
                              )}

                              <div
                                style={{
                                  display: "flex",
                                  flexDirection: "column",
                                  gap: "5px",
                                }}
                              >
                                <p
                                  className="desc_metal_line"
                                  style={{
                                    fontWeight: 600,
                                    margin: "0px",
                                  }}
                                >
                                  Metal : {data?.MetalTypeTitle}
                                </p>
                                <div
                                  style={{
                                    display: "flex",
                                    flexDirection: "column",
                                    gap: "10px",
                                  }}
                                >
                                  <div style={{ display: "flex" }}>
                                    <div style={{ width: "36.33%" }}>
                                      <p className="info_main_section">
                                        Dia. WT :{" "}
                                      </p>
                                      <span className="info_main_section_span">
                                        {data.DiamondWtP}
                                      </span>
                                    </div>
                                    <div style={{ width: "33.33%" }}>
                                      <p className="info_main_section">
                                        GWT :{" "}
                                      </p>
                                      <span className="info_main_section_span">
                                        {data.GrossWeight}{" "}
                                        <span style={{ fontSize: "12px" }}>
                                          gm
                                        </span>
                                      </span>
                                    </div>
                                    <div style={{ width: "33.33%" }}>
                                      <p className="info_main_section">NWT :</p>
                                      <span className="info_main_section_span">
                                        {data.netWeight}{" "}
                                        <span style={{ fontSize: "12px" }}>
                                          gm
                                        </span>
                                      </span>
                                    </div>
                                  </div>

                                  <div style={{ display: "flex" }}>
                                    <div style={{ width: "38%" }}>
                                      <p className="info_main_section">
                                        CS WT :{" "}
                                      </p>
                                      <span className="info_main_section_span">
                                        {data.colorStoneWtP}
                                      </span>
                                    </div>
                                    <div style={{ width: "38%" }}>
                                      <p className="info_main_section">
                                        Misc :{" "}
                                      </p>
                                      <span className="info_main_section_span">
                                        {data.MiscWtP}
                                      </span>
                                    </div>
                                  </div>
                                  <div
                                    style={{
                                      display: "flex",
                                      justifyContent: "flex-end",
                                      alignItems: "end",
                                      margin: "10px",
                                      gap: "10px",
                                      zIndex: isOpen && "-1",
                                    }}
                                  >
                                    <Button
                                      style={{
                                        color: "#b8860b",
                                        padding: "0px",
                                        minWidth: "40px",
                                        margin: "0px",
                                      }}
                                      onClick={() => {
                                        setOpenCnfDialog(true);
                                        setRemoveJobNo(data?.JobNo);
                                      }}
                                    >
                                      <Trash />
                                    </Button>
                                    <Button
                                      style={{
                                        color: "#b8860b",
                                        padding: "0px",
                                        minWidth: "40px",
                                        margin: "0px",
                                      }}
                                      onClick={() =>
                                        handlePrint(data?.JobNo, false)
                                      }
                                    >
                                      <Printer />
                                    </Button>
                                    <Button
                                      style={{
                                        color: "#b8860b",
                                        padding: "0px",
                                        margin: "0px",
                                        minWidth: "40px",
                                      }}
                                      onClick={() =>
                                        handleShare(data?.JobNo, false)
                                      }
                                    >
                                      <Share2 />
                                    </Button>

                                    <Button
                                      style={{
                                        color: "#b8860b",
                                        padding: "0px",
                                        margin: "0px",
                                        minWidth: "40px",
                                      }}
                                      onClick={() => {
                                        toggleDrawer();
                                        setPriceBreackUpAllValues(data);
                                      }}
                                    >
                                      <BsInfoCircleFill
                                        style={{ fontSize: "25px" }}
                                      />
                                    </Button>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  <Button
                    style={{
                      position: "fixed",
                      bottom: "80px",
                      right: "30px",
                      backgroundColor: "#2196f3",
                      color: "white",
                      padding: "10px",
                      borderRadius: "60px",
                      minWidth: "50px",
                    }}
                    onClick={() => handlePrint("", true)}
                  >
                    <Printer />
                  </Button>
                </div>
              );
            })}
          </div>
        ) : (
          mode === "AllScanItem" && (
            <div
              style={{
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                height: "70vh",
              }}
            >
              <p>No Product Scanned</p>
            </div>
          )
        )}

        <Box
          className="JobScannerPage"
          style={{
            zIndex: isLoading && "-11111",
          }}
        >
          <Stack
            direction="row"
            spacing={2}
            justifyContent="center"
            className="text-buttons"
          >
            <Button
              onClick={() => setMode("AllScanItem")}
              className={mode === "AllScanItem" ? "active" : ""}
              variant="text"
            >
              <AlignJustify />
            </Button>
            <Button
              onClick={() => {
                setMode("qr");
                setIsOpen(false);
              }}
              className={mode === "qr" ? "active" : ""}
              variant="text"
            >
              <ScanLine />
            </Button>
            <Button
              onClick={() => {
                setMode("manual");
                setIsOpen(false);
              }}
              className={mode === "manual" ? "active" : ""}
              variant="text"
            >
              <Keyboard />
            </Button>
          </Stack>
        </Box>
      </div>

      <div
        id="printSection"
        className="printDesign"
        ref={printRef}
        style={{ width: "100%" }}
      >
        <PritnModel activeDetail={printInfo} />
      </div>

      <ConfirmationDialog
        open={opencnfDialogOpen}
        onClose={handleCloseDialog}
        onConfirm={handleConfirmRemoveAll}
        title="Confirm"
        content="Are you sure you want to remove this item?"
      />
    </div>
  );
};

export default Scanner;
