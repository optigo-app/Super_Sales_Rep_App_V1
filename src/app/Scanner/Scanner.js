import React, { useCallback, useEffect, useRef, useState } from "react";
import { QrReader } from "react-qr-reader";
import "./Scanner.scss";
import {
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  Stack,
} from "@mui/material";
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
import { showToast } from "../../Vuexy/Tostify/ToastManager";
import productData from "./ProductData.json";
import { CommonAPImain } from "../../../Utils/API/CommonAPImain/CommonAPImain";
import { CommonAPImainScan } from "../../../Utils/API/CommonAPImain/CommonAPImainScan";
import PritnModel from "./PritnModel";
import html2pdf from "html2pdf.js";
import Webcam from "react-webcam";
import jsQR from "jsqr";
import { BsInfoCircleFill } from "react-icons/bs";
import ConfirmationDialog from "../../ConfirmationDialog/ConfirmationDialog";

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
  const scanningRef = useRef(false);
  const cooldownTime = 2000;
  const [removeJobNo, setRemoveJobNo] = useState("");
  const handleCloseDialog = () => setOpenCnfDialog(false);
  const toggleDrawer = () => setIsOpen(!isOpen);
  const [openPrintModel, setOpenPrintModel] = useState(false);
  const [printOption, setPrintOption] = useState(true);
  const [printAllData, setPrintAllData] = useState(false);

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
      track.applyConstraints({ advanced: [{ zoom: min }] }).catch(() => { });
    }
    canvasRef.current.width = CANVAS_SIDE;
    canvasRef.current.height = CANVAS_SIDE;
    decodeTimerRef.current = setInterval(decodeFrame, SCAN_INTERVAL);
  };

  const BOX = 220;

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
    if (list?.some((item) => item?.JobNo === jobNumber)) {
      showToast({
        message: `Job ${jobNumber} already scanned`,
        bgColor: "#f1c40f",
        fontColor: "#000",
        duration: 2500,
      });
      return false;
    }
    setIsLoading(true);
    try {
      const response = await CommonAPImainScan("TagInfo", jobNumber);
      const jobData = response?.Data?.rd?.[0];

      if (!jobData) {
        showToast({
          message: `Invalid job number: ${jobNumber}`,
          bgColor: "#f13f3f",
          fontColor: "#fff",
          duration: 2500,
        });
        setIsLoading(false);
        return false;
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
            ? `${jobData?.DiaWt ? jobData.DiaWt.toFixed(3) : ""}${jobData?.DiaWt && jobData?.DiaPcs ? " / " : ""
            }${jobData?.DiaPcs ? jobData.DiaPcs + " pcs" : ""}`
            : null,
        colorStoneWtP:
          jobData?.CsWt || jobData?.CsPcs
            ? `${jobData?.CsWt ? jobData.CsWt.toFixed(3) : ""}${jobData?.CsWt && jobData?.CsPcs ? " / " : ""
            }${jobData?.CsPcs ? jobData.CsPcs + " pcs" : ""}`
            : null,
        MiscWtP:
          jobData?.MiscWt || jobData?.MiscPcs
            ? `${jobData?.MiscWt ? jobData.MiscWt.toFixed(3) : ""}${jobData?.MiscWt && jobData?.MiscPcs ? " / " : ""
            }${jobData?.MiscPcs ? jobData.MiscPcs + " pcs" : ""}`
            : null,
        MetalTypeTitle: `${jobData?.MetalPurity +
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
      showToast({
        message: `Job ${jobNumber} scanned successfully`,
        bgColor: "#27ae60",
        fontColor: "#fff",
        duration: 2500,
      });
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

  const decodeFrame = useCallback(async () => {
    if (scanningRef.current) return;

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
      scanningRef.current = true;
      setIsLoading(true);
      const jobNo = result.trim();
      const isValid = await addScan(jobNo);
      setTimeout(() => {
        scanningRef.current = false;
      }, cooldownTime);
      setIsLoading(false);
    }
  }, [addScan]);

  const handleManualSave = () => {
    if (manualInput.trim()) {
      addScan(manualInput.trim());
      setManualInput("");
    }
  };

  const handlePrintfind = (data, allData) => {
    const savedScans = JSON.parse(sessionStorage.getItem("AllScanJobData"));
    const matchedArray = savedScans?.filter((item) => item.JobNo === data);
    if (allData) {
      setPrintInfo(savedScans);
    } else {
      setPrintInfo(matchedArray);
    }
  };

  const handlePrint = (data, allData) => {
    const savedScans = JSON.parse(sessionStorage.getItem("AllScanJobData"));
    const matchedArray = savedScans.filter((item) => item.JobNo === data);
    if (allData) {
      setPrintInfo(savedScans);
    } else {
      setPrintInfo(matchedArray);
    }
    const element = document.getElementById("printSection");
    const height = allData
      ? savedScans?.length > 2
        ? savedScans?.length > 3
          ? savedScans?.length * 50
          : savedScans?.length * 55
        : 130
      : 100;
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
                {activeDetail?.GrossWeight !== null && (
                  <div style={{ width: "32%" }}>
                    <p className="info_main_section">
                      Gwt<span style={{ fontSize: "10px" }}>(gm)</span>:{" "}
                    </p>
                    <span className="info_main_section_span">
                      {activeDetail.GrossWeight}{" "}
                    </span>
                  </div>
                )}
                {activeDetail?.netWeight !== null && (
                  <div style={{ width: "30%" }}>
                    <p className="info_main_section">
                      Net<span style={{ fontSize: "10px" }}>(gm)</span>:
                    </p>
                    <span className="info_main_section_span">
                      {activeDetail.netWeight}{" "}
                    </span>
                  </div>
                )}
                {activeDetail?.DiamondWtP !== null && (
                  <div style={{ width: "38%" }}>
                    <p className="info_main_section">
                      Dia.<span style={{ fontSize: "10px" }}>(Ct)</span>:
                    </p>
                    <span className="info_main_section_span">
                      {activeDetail.DiamondWtP}{" "}
                    </span>
                  </div>
                )}
              </div>

              <div style={{ display: "flex", minHeight: "30px" }}>
                {activeDetail?.colorStoneWtP !== null && (
                  <div style={{ width: "32%" }}>
                    <p className="info_main_section">
                      CS<span style={{ fontSize: "10px" }}>(Ct)</span>:{" "}
                    </p>
                    <span className="info_main_section_span">
                      {activeDetail.colorStoneWtP}
                    </span>
                  </div>
                )}
                {activeDetail?.MiscWtP !== null && (
                  <div style={{ width: "38%" }}>
                    <p className="info_main_section">
                      Misc<span style={{ fontSize: "10px" }}>(gm)</span>:
                    </p>
                    <span className="info_main_section_span">
                      {activeDetail.MiscWtP}
                    </span>
                  </div>
                )}
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
                  onClick={() => {
                    setPrintOption(true);
                    setPrintAllData(false);
                    setOpenPrintModel(true);
                    handlePrintfind(activeDetail?.JobNo, false);
                  }}
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
                  onClick={() => {
                    setPrintOption(false);
                    setOpenPrintModel(true);
                    handlePrintfind(activeDetail?.JobNo, false);
                  }}
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
    if (removeJobNo === activeDetail?.JobNo) {
      setActiveDetail(null);
    }
    setOpenCnfDialog(false);
    return updatedList;
  };

  const [zIndex, setZIndex] = useState(-1);
  useEffect(() => {
    if (isOpen) {
      setZIndex(-1);
    } else {
      const timer = setTimeout(() => {
        setZIndex("auto");
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

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
        // onClick={toggleDrawer}
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

      <div
        style={{
          display: mode === "qr" ? "block" : "none",
          height: "320px",
          width: "100%",
        }}
      >
        <div
          className={`camera-container ${zoomCap ? "camera-hw-zoom" : "camera-css-zoom"
            }`}
          style={{
            zIndex: zIndex,
          }}
        >
          <Webcam
            ref={webcamRef}
            mirrored={false}
            audio={false}
            playsInline
            muted
            className="camera-feed"
            onUserMedia={handleUserMedia}
            videoConstraints={{
              facingMode: { ideal: "environment" },
              width: { ideal: 640 },
              height: { ideal: 350 },
              advanced: zoomCap ? [{ zoom: zoomLevel }] : undefined,
            }}
          />
          <div className="scan-box" />
        </div>
      </div>

      <div style={{ display: mode === "manual" ? "block" : "none" }}>
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
      </div>

      {activeDetail && mode != "AllScanItem" && renderExpandedTop()}

      <div style={{ display: mode === "AllScanItem" ? "block" : "none" }}>
        {scannedData.length !== 0 ? (
          <div className="expand_container_All_job">
            {scannedData.map((data, idx) => {
              const isExpanded = expandedItems.includes(idx);
              return (
                <div key={idx} className="recent-item">
                  <div className="expand_container_All_job_sub">
                    <div
                      className="summary-row"
                      onClick={() => {
                        setExpandedItems((prev) =>
                          prev.includes(idx)
                            ? prev.filter((i) => i !== idx)
                            : [...prev, idx]
                        );
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
                      className={`expand-wrapper ${isExpanded ? "expanded" : ""
                        }`}
                    >
                      {isExpanded && (
                        <div
                          className={`expand-wrapper ${isExpanded ? "expanded" : ""
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
                                    {data?.GrossWeight !== null && (
                                      <div style={{ width: "32%" }}>
                                        <p className="info_main_section">
                                          Gwt
                                          <span style={{ fontSize: "10px" }}>
                                            (gm)
                                          </span>
                                          :{" "}
                                        </p>
                                        <span className="info_main_section_span">
                                          {data.GrossWeight}{" "}
                                        </span>
                                      </div>
                                    )}
                                    {data?.netWeight !== null && (
                                      <div style={{ width: "30%" }}>
                                        <p className="info_main_section">
                                          Net
                                          <span style={{ fontSize: "10px" }}>
                                            (gm)
                                          </span>
                                          :
                                        </p>
                                        <span className="info_main_section_span">
                                          {data.netWeight}{" "}
                                        </span>
                                      </div>
                                    )}
                                    {data?.DiamondWtP !== null && (
                                      <div style={{ width: "38%" }}>
                                        <p className="info_main_section">
                                          Dia.
                                          <span style={{ fontSize: "10px" }}>
                                            (Ct)
                                          </span>
                                          :
                                        </p>
                                        <span className="info_main_section_span">
                                          {data.DiamondWtP}
                                        </span>
                                      </div>
                                    )}
                                  </div>

                                  <div
                                    style={{
                                      display: "flex",
                                      minHeight: "30px",
                                    }}
                                  >
                                    {data?.colorStoneWtP !== null && (
                                      <div style={{ width: "32%" }}>
                                        <p className="info_main_section">
                                          CS
                                          <span style={{ fontSize: "10px" }}>
                                            (Ct)
                                          </span>
                                          :{" "}
                                        </p>
                                        <span className="info_main_section_span">
                                          {data.colorStoneWtP}
                                        </span>
                                      </div>
                                    )}
                                    {data?.MiscWtP !== null && (
                                      <div style={{ width: "38%" }}>
                                        <p className="info_main_section">
                                          Misc
                                          <span style={{ fontSize: "10px" }}>
                                            (gm)
                                          </span>
                                          :
                                        </p>
                                        <span className="info_main_section_span">
                                          {data.MiscWtP}
                                        </span>
                                      </div>
                                    )}
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
                                      onClick={() => {
                                        setPrintOption(true);
                                        setPrintAllData(false);
                                        setOpenPrintModel(true);
                                        handlePrintfind(data?.JobNo, false);
                                      }}
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
                                      onClick={() => {
                                        setPrintOption(false);
                                        setOpenPrintModel(true);
                                        handlePrintfind(data?.JobNo, false);
                                      }}
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
                    onClick={() => {
                      setPrintAllData(true);
                      setOpenPrintModel(true);
                      handlePrintfind("", true);
                    }}
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
      </div>

      <Box
        className="JobScannerPage"
        sx={{
          zIndex:
            (isLoading && "-11111!important") || (isOpen && "-11111!important"),
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
            disabled={isOpen && true}
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
            disabled={isOpen && true}
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
            disabled={isOpen && true}
          >
            <Keyboard />
          </Button>
        </Stack>
      </Box>

      {/* <div
        id="printSection"
        className="printDesign"
        ref={printRef}
        style={{ width: "100%" }}
      >
        <PritnModel activeDetail={printInfo} />
      </div> */}

      <Dialog
        open={openPrintModel}
        onClick={() => setOpenPrintModel(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogContent dividers>
          <div
            id="printSection"
            className="printDesign"
            ref={printRef}
            style={{ width: "100%" }}
          >
            <PritnModel activeDetail={printInfo} />
          </div>
        </DialogContent>

        <DialogActions>
          <Button onClick={() => setOpenPrintModel(false)} color="error">
            Cancel
          </Button>
          <Button
            onClick={() => {
              printOption
                ? handlePrint(activeDetail?.JobNo, printAllData)
                : handleShare(printInfo?.JobNo, false);
            }}
            style={{ backgroundColor: "#00a2e1", color: "white" }}
          >
            {printOption ? "Download" : "Share"}
          </Button>
        </DialogActions>
      </Dialog>

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
