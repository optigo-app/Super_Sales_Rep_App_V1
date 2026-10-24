'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Box, Typography, Button, CircularProgress, Dialog, DialogActions, DialogContent, Stack } from '@mui/material';
import { AlignJustify, ChevronDown, ChevronUp, CircleX, Info, Keyboard, Printer, ScanLine, Share2, Trash } from 'lucide-react';
import Header from '../../components/Header';
import BottomNav from '../../components/BottomNav';
import { CommonAPImainScan } from '@/Utils/API/CommonAPImain/CommonAPImainScan';
import LoadingBackdrop from '@/Utils/LoadingBackdrop';
import { showToast } from '@/components/Toast/ToastContainer';
import PritnModel from './PritnModel';
import dynamic from 'next/dynamic';

const Webcam = dynamic(() => import('react-webcam'), { ssr: false });

const CANVAS_SIDE = 400;
const SCAN_INTERVAL = 200;
const PlaceHolderImg = '/V1/default.jpg';
const hasBarcodeAPI = typeof window !== 'undefined' && 'BarcodeDetector' in window;

export default function CustomerPage() {
  const [scannedData, setScannedData] = useState([]);
  const [mode, setMode] = useState('qr');
  const [manualInput, setManualInput] = useState('');
  const [activeDetail, setActiveDetail] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [printInfo, setPrintInfo] = useState();
  const [priceBreackUpAllValues, setPriceBreackUpAllValues] = useState();
  const [expandedItems, setExpandedItems] = useState([]);
  const [zoomCap, setZoomCap] = useState(null);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [cameraKey, setCameraKey] = useState(Date.now());
  const [isOpen, setIsOpen] = useState(false);
  const [opencnfDialogOpen, setOpenCnfDialog] = useState(false);
  const [removeJobNo, setRemoveJobNo] = useState('');
  const [openPrintModel, setOpenPrintModel] = useState(false);
  const [printOption, setPrintOption] = useState(true);
  const [printAllData, setPrintAllData] = useState(false);
  const [zIndex, setZIndex] = useState('auto');

  const webcamRef = useRef(null);
  const canvasRef = useRef(typeof document !== 'undefined' ? document.createElement('canvas') : null);
  const trackRef = useRef(null);
  const decodeTimerRef = useRef(null);
  const detectorRef = useRef(hasBarcodeAPI ? new window.BarcodeDetector({ formats: ['qr_code'] }) : null);
  const scanningRef = useRef(false);
  const printRef = useRef(null);
  const cooldownTime = 2000;

  useEffect(() => {
    const saved = sessionStorage.getItem('AllScanJobData');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          setScannedData(parsed);
          if (parsed.length > 0) setActiveDetail(parsed[0]);
        }
      } catch (e) {
        setScannedData([]);
      }
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      setZIndex(-1);
    } else {
      const t = setTimeout(() => setZIndex('auto'), 2000);
      return () => clearTimeout(t);
    }
  }, [isOpen]);

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
    if (canvasRef.current) {
      canvasRef.current.width = CANVAS_SIDE;
      canvasRef.current.height = CANVAS_SIDE;
    }
    decodeTimerRef.current = setInterval(decodeFrame, SCAN_INTERVAL);
  };

  const addScan = useCallback(async (jobNumber) => {
    const list = JSON.parse(sessionStorage.getItem('AllScanJobData') || '[]');
    if (list?.some((item) => item?.JobNo === jobNumber)) {
      showToast({ message: `Job ${jobNumber} already scanned`, bgColor: '#f1c40f', fontColor: '#000', duration: 2500 });
      return false;
    }
    setIsLoading(true);
    try {
      const response = await CommonAPImainScan('TagInfo', jobNumber);
      const jobData = response?.Data?.rd?.[0];
      if (!jobData) {
        showToast({ message: `Invalid job number: ${jobNumber}`, bgColor: '#f13f3f', fontColor: '#fff', duration: 2500 });
        return false;
      }
      const formatted = {
        JobNo: jobData.JobNo,
        designNo: jobData.DesignNo,
        price: jobData.Amount,
        AmountWithtax: jobData.AmountWithtax,
        taxAmount:
          (jobData.TaxAmount || 0) +
          (jobData.SGSTAmount || 0) +
          (jobData.CGSTAmount || 0) +
          (jobData.IGSTAmount || 0),
        MetalTypeTitle: `${jobData?.MetalPurity} ${jobData?.MetalTypeName} ${jobData?.MetalColorName}`,
        netWeight: jobData.NetWt?.toFixed(3),
        GrossWeight: jobData.GrossWt?.toFixed(3),
        Category: jobData.Category,
        DiamondWtP:
          jobData?.DiaWt || jobData?.DiaPcs
            ? `${jobData?.DiaWt ? jobData.DiaWt.toFixed(3) : ''}${jobData?.DiaWt && jobData?.DiaPcs ? ' / ' : ''}${jobData?.DiaPcs ? jobData.DiaPcs + ' pcs' : ''}`
            : null,
        colorStoneWtP:
          jobData?.CsWt || jobData?.CsPcs
            ? `${jobData?.CsWt ? jobData.CsWt.toFixed(3) : ''}${jobData?.CsWt && jobData?.CsPcs ? ' / ' : ''}${jobData?.CsPcs ? jobData.CsPcs + ' pcs' : ''}`
            : null,
        MiscWtP:
          jobData?.MiscWt || jobData?.MiscPcs
            ? `${jobData?.MiscWt ? jobData.MiscWt.toFixed(3) : ''}${jobData?.MiscWt && jobData?.MiscPcs ? ' / ' : ''}${jobData?.MiscPcs ? jobData.MiscPcs + ' pcs' : ''}`
            : null,
        TotalMetalCost: jobData?.TotalMetalCost || 0,
        TotalDiamondWtPrice: jobData?.TotalDiamondCost || 0,
        TotalColosrStoneWtPrice: jobData?.TotalColorstoneCost || 0,
        TotalMiscWtPrice: jobData?.TotalMiscCost || 0,
        TotalMakingWtPrice:
          (jobData?.TotalDiamondhandlingCost || 0) +
          (jobData?.TotalSettingCost || 0) +
          (jobData?.TotalOtherCost || 0) +
          (jobData?.TotalMakingCost || 0),
        image: jobData?.CDNDesignImageFol + jobData?.ImageName || '',
        CartListId: jobData.CartListId,
        WishListId: jobData.WishListId,
        isInCartList: jobData?.isInCartList || 0,
        isInWishList: jobData?.isInWishList || 0,
        status: 'Scanned',
      };
      setScannedData((prev) => {
        const updated = [formatted, ...prev.filter((j) => j.JobNo !== formatted.JobNo)];
        sessionStorage.setItem('AllScanJobData', JSON.stringify(updated));
        return updated;
      });
      setExpandedItems([0]);
      setActiveDetail(formatted);
      showToast({ message: `Job ${jobNumber} scanned successfully`, bgColor: '#27ae60', fontColor: '#fff', duration: 2500 });
    } catch (err) {
      showToast({ message: 'Invalid Job', bgColor: '#f13f3f', fontColor: '#fff', duration: 5000 });
    } finally {
      setIsLoading(false);
    }
  }, []);

  const decodeFrame = useCallback(async () => {
    if (scanningRef.current || !canvasRef.current) return;
    const video = webcamRef.current?.video;
    const jsQR = (await import('jsqr')).default;
    if (!video || video.readyState < 2) return;
    const { videoWidth: w, videoHeight: h } = video;
    const side = Math.min(w, h);
    const ctx = canvasRef.current.getContext('2d', { willReadFrequently: true });
    ctx.drawImage(video, (w - side) / 2, (h - side) / 2, side, side, 0, 0, CANVAS_SIDE, CANVAS_SIDE);
    let result = null;
    if (hasBarcodeAPI) {
      const barcodes = await detectorRef.current.detect(canvasRef.current);
      if (barcodes.length) result = barcodes[0].rawValue;
    } else {
      const imgData = ctx.getImageData(0, 0, CANVAS_SIDE, CANVAS_SIDE);
      result = jsQR(imgData.data, imgData.width, imgData.height)?.data;
    }
    if (result) {
      scanningRef.current = true;
      await addScan(result.trim());
      setTimeout(() => { scanningRef.current = false; }, cooldownTime);
    }
  }, [addScan]);

  const handlePrintfind = (data, allData) => {
    const saved = JSON.parse(sessionStorage.getItem('AllScanJobData') || '[]');
    setPrintInfo(allData ? saved : saved.filter((item) => item.JobNo === data));
  };

  const handlePrint = async (data, allData) => {
    const html2pdf = (await import('html2pdf.js')).default;
    const saved = JSON.parse(sessionStorage.getItem('AllScanJobData') || '[]');
    const items = allData ? saved : saved.filter((item) => item.JobNo === data);
    setPrintInfo(items);
    const element = document.getElementById('printSection');
    const height = allData
      ? saved.length > 3 ? saved.length * 50 : saved.length > 2 ? saved.length * 55 : 130
      : 100;
    const opt = {
      margin: [5, 5, 5, 5],
      filename: 'estimate.pdf',
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2 },
      jsPDF: { unit: 'mm', format: [73, height], orientation: 'portrait' },
    };
    html2pdf().set(opt).from(element).outputPdf('blob').then((blob) => {
      const fileName = 'estimate.pdf';
      if (window.flutter_inappwebview) {
        const reader = new FileReader();
        reader.onloadend = () => {
          const base64data = reader.result.split(',')[1];
          window.flutter_inappwebview.callHandler('downloadPDF', base64data, fileName);
        };
        reader.readAsDataURL(blob);
      } else {
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        link.remove();
      }
    });
  };

  const handleShare = async (data, allData) => {
    const html2pdf = (await import('html2pdf.js')).default;
    const saved = JSON.parse(sessionStorage.getItem('AllScanJobData') || '[]');
    const items = allData ? saved : saved.filter((item) => item.JobNo === data);
    setPrintInfo(items);
    const element = document.getElementById('printSection');
    const opt = {
      margin: [5, 5, 5, 5],
      filename: 'estimate.pdf',
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2 },
      jsPDF: { unit: 'mm', format: [73, 297], orientation: 'portrait' },
    };
    html2pdf().set(opt).from(element).outputPdf('blob').then((blob) => {
      const fileName = 'estimate.pdf';
      if (window.flutter_inappwebview) {
        const reader = new FileReader();
        reader.onloadend = () => {
          const base64data = reader.result.split(',')[1];
          window.flutter_inappwebview.callHandler('sharePDF', base64data, fileName);
        };
        reader.readAsDataURL(blob);
      } else {
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        link.remove();
      }
    });
  };

  const handleConfirmRemoveAll = () => {
    const list = JSON.parse(sessionStorage.getItem('AllScanJobData') || '[]');
    const updated = list.filter((item) => item.JobNo !== removeJobNo);
    sessionStorage.setItem('AllScanJobData', JSON.stringify(updated));
    setScannedData(updated);
    if (removeJobNo === activeDetail?.JobNo) setActiveDetail(null);
    setOpenCnfDialog(false);
  };

  const renderExpandedTop = () =>
    activeDetail && (
      <Box sx={{ background: '#fff', borderRadius: 2, border: '0.5px solid #eee', p: 1.5, mb: 1.5 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
          <Box>
            <Typography sx={{ fontSize: 16, fontWeight: 600 }}>
              {activeDetail.designNo} ({activeDetail.JobNo})
            </Typography>
            <Typography sx={{ fontSize: 14, color: 'text.secondary' }}>{activeDetail.Category}</Typography>
          </Box>
          <Typography sx={{ fontSize: 15, fontWeight: 600, color: '#7C3AED' }}>
            Amt {activeDetail.AmountWithtax}
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Box sx={{ width: '35%' }}>
            <img
              src={activeDetail.image || PlaceHolderImg}
              onError={(e) => (e.target.src = PlaceHolderImg)}
              style={{ width: '100%', borderRadius: 8 }}
            />
          </Box>
          <Box sx={{ width: '65%', fontSize: 12, display: 'flex', flexDirection: 'column', minHeight: '120px' }}>
            <Typography sx={{ fontSize: 12, fontWeight: 600, mb: 0.5 }}>
              Metal: {activeDetail.MetalTypeTitle}
            </Typography>
            <Box sx={{ display: 'flex', gap: 1, mb: 0.5 }}>
              {activeDetail.GrossWeight && (
                <Box>
                  <Typography sx={{ fontSize: 11, color: 'text.secondary' }}>Gwt (gm)</Typography>
                  <Typography sx={{ fontSize: 12, fontWeight: 500 }}>{activeDetail.GrossWeight}</Typography>
                </Box>
              )}
              {activeDetail.netWeight && (
                <Box>
                  <Typography sx={{ fontSize: 11, color: 'text.secondary' }}>Net (gm)</Typography>
                  <Typography sx={{ fontSize: 12, fontWeight: 500 }}>{activeDetail.netWeight}</Typography>
                </Box>
              )}
              {activeDetail.DiamondWtP && (
                <Box>
                  <Typography sx={{ fontSize: 11, color: 'text.secondary' }}>Dia. (Ct)</Typography>
                  <Typography sx={{ fontSize: 12, fontWeight: 500 }}>{activeDetail.DiamondWtP}</Typography>
                </Box>
              )}
            </Box>
            <Box sx={{ display: 'flex', gap: 1, mb: 0.5 }}>
              {activeDetail.colorStoneWtP && (
                <Box>
                  <Typography sx={{ fontSize: 11, color: 'text.secondary' }}>CS (Ct)</Typography>
                  <Typography sx={{ fontSize: 12, fontWeight: 500 }}>{activeDetail.colorStoneWtP}</Typography>
                </Box>
              )}
              {activeDetail.MiscWtP && (
                <Box>
                  <Typography sx={{ fontSize: 11, color: 'text.secondary' }}>Misc (gm)</Typography>
                  <Typography sx={{ fontSize: 12, fontWeight: 500 }}>{activeDetail.MiscWtP}</Typography>
                </Box>
              )}
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1, mt: 'auto', pt: 1 }}>
              <Button
                sx={{
                  color: '#7C3AED',
                  bgcolor: '#EDE9FE',
                  minWidth: 36,
                  width: 36,
                  height: 36,
                  borderRadius: '50%',
                  p: 0,
                  '&:active': { bgcolor: '#DDD6FE', transform: 'scale(0.92)' },
                  transition: 'all 0.15s',
                }}
                onClick={() => {
                  setPrintOption(true);
                  setPrintAllData(false);
                  setOpenPrintModel(true);
                  handlePrintfind(activeDetail?.JobNo, false);
                }}
              >
                <Printer size={18} />
              </Button>
              <Button
                sx={{
                  color: '#7C3AED',
                  bgcolor: '#EDE9FE',
                  minWidth: 36,
                  width: 36,
                  height: 36,
                  borderRadius: '50%',
                  p: 0,
                  '&:active': { bgcolor: '#DDD6FE', transform: 'scale(0.92)' },
                  transition: 'all 0.15s',
                }}
                onClick={() => {
                  setPrintOption(false);
                  setOpenPrintModel(true);
                  handlePrintfind(activeDetail?.JobNo, false);
                }}
              >
                <Share2 size={18} />
              </Button>
              <Button
                sx={{
                  color: '#7C3AED',
                  bgcolor: '#EDE9FE',
                  minWidth: 36,
                  width: 36,
                  height: 36,
                  borderRadius: '50%',
                  p: 0,
                  '&:active': { bgcolor: '#DDD6FE', transform: 'scale(0.92)' },
                  transition: 'all 0.15s',
                }}
                onClick={() => {
                  setIsOpen(true);
                  setPriceBreackUpAllValues(activeDetail);
                }}
              >
                <Info size={20} />
              </Button>
            </Box>
          </Box>
        </Box>
      </Box>
    );

  return (
    <Box sx={{ bgcolor: 'white', minHeight: '100vh' }}>
      <LoadingBackdrop isLoading={isLoading} />
      {/* Price Breakup Drawer */}
      <Box
        sx={{
          position: 'fixed',
          inset: 0,
          zIndex: isOpen ? 20 : -1,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'flex-end',
        }}
      >
        <Box
          sx={{
            position: 'absolute',
            inset: 0,
            bgcolor: 'rgba(0,0,0,0.35)',
            opacity: isOpen ? 1 : 0,
            transition: 'opacity .3s',
          }}
          onClick={() => setIsOpen(false)}
        />
        <Box
          sx={{
            position: 'relative',
            bgcolor: '#fff',
            borderRadius: '16px 16px 0 0',
            p: "16px 16px 110px 16px",
            transform: isOpen ? 'translateY(0)' : 'translateY(100%)',
            transition: 'transform .3s',
          }}
        >
          <Typography sx={{ fontSize: 16, fontWeight: 500, mb: 1.5 }}>Price Breakup</Typography>
          <Typography sx={{ fontSize: 12, fontWeight: 500, display: 'flex', justifyContent: 'flex-end' }}>Amt</Typography>
          {[
            ['Metal (incl. finding)', priceBreackUpAllValues?.TotalMetalCost],
            ['Diamond', priceBreackUpAllValues?.TotalDiamondWtPrice],
            ['Color Stone', priceBreackUpAllValues?.TotalColosrStoneWtPrice],
            ['Misc', priceBreackUpAllValues?.TotalMiscWtPrice],
            ['Making Charges', priceBreackUpAllValues?.TotalMakingWtPrice],
            ['Tax Amount', Number(priceBreackUpAllValues?.taxAmount || 0).toFixed(2)],
          ].map(([label, val]) => (
            <Box
              key={label}
              sx={{ display: 'flex', justifyContent: 'space-between', py: 0.75, borderBottom: '0.5px solid #eee' }}
            >
              <Typography sx={{ fontSize: 13, color: 'text.secondary' }}>{label}</Typography>
              <Typography sx={{ fontSize: 13 }}>{val}</Typography>
            </Box>
          ))}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', pt: 1 }}>
            <Typography sx={{ fontWeight: 600 }}>Total</Typography>
            <Typography sx={{ fontWeight: 600, color: '#7C3AED' }}>
              Amt{' '}
              {Number(
                (priceBreackUpAllValues?.TotalMetalCost || 0) +
                (priceBreackUpAllValues?.TotalDiamondWtPrice || 0) +
                (priceBreackUpAllValues?.TotalColosrStoneWtPrice || 0) +
                (priceBreackUpAllValues?.TotalMiscWtPrice || 0) +
                (priceBreackUpAllValues?.TotalMakingWtPrice || 0) +
                (priceBreackUpAllValues?.taxAmount || 0)
              ).toFixed(2)}
            </Typography>
          </Box>
          <Button
            sx={{ position: 'absolute', top: 8, right: 8, minWidth: 36 }}
            onClick={() => setIsOpen(false)}
          >
            <CircleX size={20} />
          </Button>
        </Box>
      </Box>

      <Box sx={{ px: 2, pt: 2, pb: '80px' }}>
        <Typography sx={{ fontSize: 22, fontWeight: 800, color: '#1F2937', mb: 2 }}>Tag Info</Typography>

        {/* Mode selector */}
        <Stack direction="row" spacing={1} sx={{ mb: 2 }}>
          {[
            { key: 'qr', label: 'QR Scan', icon: <ScanLine size={16} /> },
            { key: 'manual', label: 'Manual', icon: <Keyboard size={16} /> },
            { key: 'AllScanItem', label: 'All Items', icon: <AlignJustify size={16} /> },
          ].map((m) => (
            <Button
              key={m.key}
              variant={mode === m.key ? 'contained' : 'outlined'}
              onClick={() => setMode(m.key)}
              startIcon={m.icon}
              sx={{
                flex: 1,
                fontSize: 12,
                p: 1,
                ...(mode === m.key
                  ? { bgcolor: '#7C3AED', '&:hover': { bgcolor: '#6D28D9' } }
                  : {}),
              }}
            >
              {m.label}
            </Button>
          ))}
        </Stack>

        {/* QR Camera */}
        {mode === 'qr' && (
          <Box
            sx={{
              position: 'relative',
              borderRadius: 2,
              overflow: 'hidden',
              height: 280,
              mb: 2,
              bgcolor: '#111',
            }}
          >
            <Webcam
              ref={webcamRef}
              key={cameraKey}
              mirrored={false}
              audio={false}
              playsInline
              muted
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              onUserMedia={handleUserMedia}
              videoConstraints={{
                facingMode: { ideal: 'environment' },
                width: { ideal: 640 },
                height: { ideal: 350 },
                advanced: zoomCap ? [{ zoom: zoomLevel }] : undefined,
              }}
            />
            <Box
              sx={{
                position: 'absolute',
                inset: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Box sx={{ width: 160, height: 160, position: 'relative' }}>
                {[
                  { top: 0, left: 0, borderTop: '3px solid #7C3AED', borderLeft: '3px solid #7C3AED' },
                  { top: 0, right: 0, borderTop: '3px solid #7C3AED', borderRight: '3px solid #7C3AED' },
                  { bottom: 0, left: 0, borderBottom: '3px solid #7C3AED', borderLeft: '3px solid #7C3AED' },
                  { bottom: 0, right: 0, borderBottom: '3px solid #7C3AED', borderRight: '3px solid #7C3AED' },
                ].map((s, i) => (
                  <Box key={i} sx={{ position: 'absolute', width: 28, height: 28, borderRadius: '4px', ...s }} />
                ))}
              </Box>
            </Box>
          </Box>
        )}

        {/* Manual input */}
        {mode === 'manual' && (
          <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
            <input
              value={manualInput}
              onChange={(e) => setManualInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && manualInput.trim()) {
                  addScan(manualInput.trim());
                  setManualInput('');
                }
              }}
              placeholder="Enter job number"
              style={{
                flex: 1,
                padding: '9px 12px',
                border: '0.5px solid #ddd',
                borderRadius: 8,
                fontSize: 14,
                outline: 'none',
              }}
            />
            <Button
              variant="contained"
              sx={{ bgcolor: '#7C3AED', '&:hover': { bgcolor: '#6D28D9' } }}
              onClick={() => {
                if (manualInput.trim()) {
                  addScan(manualInput.trim());
                  setManualInput('');
                }
              }}
            >
              Save
            </Button>
          </Box>
        )}

        {/* Active card for qr / manual modes */}
        {activeDetail && mode !== 'AllScanItem' && renderExpandedTop()}

        {/* All scanned items */}
        {mode === 'AllScanItem' && (
          scannedData.length === 0 ? (
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh' }}>
              <Typography color="text.secondary">No Product Scanned</Typography>
            </Box>
          ) : (
            <>
              {scannedData.map((data, idx) => (
                <Box
                  key={idx}
                  sx={{ background: '#fff', borderRadius: 2, border: '0.5px solid #eee', p: 1.5, mb: 1 }}
                >
                  <Box
                    sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}
                    onClick={() =>
                      setExpandedItems((prev) =>
                        prev.includes(idx) ? prev.filter((i) => i !== idx) : [...prev, idx]
                      )
                    }
                  >
                    <Box>
                      <Typography sx={{ fontSize: 15, fontWeight: 600 }}>
                        {data.designNo} ({data.JobNo})
                      </Typography>
                      <Typography sx={{ fontSize: 13, color: 'text.secondary' }}>{data.Category}</Typography>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Typography sx={{ fontSize: 14, fontWeight: 600, color: '#7C3AED' }}>
                        Amt {data.AmountWithtax}
                      </Typography>
                      {expandedItems.includes(idx) ? <ChevronUp size={18} color="#9CA3AF" /> : <ChevronDown size={18} color="#9CA3AF" />}
                    </Box>
                  </Box>

                  {expandedItems.includes(idx) && (
                    <Box sx={{ display: 'flex', gap: 1, mt: 1, pt: 1, borderTop: '0.5px solid #eee' }}>
                      <Box sx={{ width: '35%' }}>
                        <img
                          src={data.image || PlaceHolderImg}
                          onError={(e) => (e.target.src = PlaceHolderImg)}
                          style={{ width: '100%', borderRadius: 8 }}
                        />
                      </Box>
                      <Box sx={{ width: '65%', fontSize: 12, display: 'flex', flexDirection: 'column', minHeight: '120px' }}>
                        <Typography sx={{ fontSize: 12, fontWeight: 600, mb: 0.5 }}>
                          Metal: {data.MetalTypeTitle}
                        </Typography>
                        <Box sx={{ display: 'flex', gap: 1, mb: 0.5 }}>
                          {data.GrossWeight && (
                            <Box>
                              <Typography sx={{ fontSize: 11, color: 'text.secondary' }}>Gwt (gm)</Typography>
                              <Typography sx={{ fontSize: 12, fontWeight: 500 }}>{data.GrossWeight}</Typography>
                            </Box>
                          )}
                          {data.netWeight && (
                            <Box>
                              <Typography sx={{ fontSize: 11, color: 'text.secondary' }}>Net (gm)</Typography>
                              <Typography sx={{ fontSize: 12, fontWeight: 500 }}>{data.netWeight}</Typography>
                            </Box>
                          )}
                          {data.DiamondWtP && (
                            <Box>
                              <Typography sx={{ fontSize: 11, color: 'text.secondary' }}>Dia. (Ct)</Typography>
                              <Typography sx={{ fontSize: 12, fontWeight: 500 }}>{data.DiamondWtP}</Typography>
                            </Box>
                          )}
                        </Box>
                        <Box sx={{ display: 'flex', gap: 1, mb: 0.5 }}>
                          {data.colorStoneWtP && (
                            <Box>
                              <Typography sx={{ fontSize: 11, color: 'text.secondary' }}>CS (Ct)</Typography>
                              <Typography sx={{ fontSize: 12, fontWeight: 500 }}>{data.colorStoneWtP}</Typography>
                            </Box>
                          )}
                          {data.MiscWtP && (
                            <Box>
                              <Typography sx={{ fontSize: 11, color: 'text.secondary' }}>Misc (gm)</Typography>
                              <Typography sx={{ fontSize: 12, fontWeight: 500 }}>{data.MiscWtP}</Typography>
                            </Box>
                          )}
                        </Box>
                        <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1, mt: 'auto', pt: 1 }}>
                          <Button
                            sx={{
                  color: '#E24B4A',
                  bgcolor: '#FFF0F0',
                  minWidth: 36,
                  width: 36,
                  height: 36,
                  borderRadius: '50%',
                  p: 0,
                  '&:active': { bgcolor: '#FECACA', transform: 'scale(0.92)' },
                  transition: 'all 0.15s',
                }}
                            onClick={() => { setOpenCnfDialog(true); setRemoveJobNo(data.JobNo); }}
                          >
                            <Trash size={16} />
                          </Button>
                          <Button
                            sx={{
                  color: '#7C3AED',
                  bgcolor: '#EDE9FE',
                  minWidth: 36,
                  width: 36,
                  height: 36,
                  borderRadius: '50%',
                  p: 0,
                  '&:active': { bgcolor: '#DDD6FE', transform: 'scale(0.92)' },
                  transition: 'all 0.15s',
                }}
                            onClick={() => {
                              setPrintOption(true);
                              setPrintAllData(false);
                              setOpenPrintModel(true);
                              handlePrintfind(data.JobNo, false);
                            }}
                          >
                            <Printer size={16} />
                          </Button>
                          <Button
                            sx={{
                  color: '#7C3AED',
                  bgcolor: '#EDE9FE',
                  minWidth: 36,
                  width: 36,
                  height: 36,
                  borderRadius: '50%',
                  p: 0,
                  '&:active': { bgcolor: '#DDD6FE', transform: 'scale(0.92)' },
                  transition: 'all 0.15s',
                }}
                            onClick={() => {
                              setPrintOption(false);
                              setOpenPrintModel(true);
                              handlePrintfind(data.JobNo, false);
                            }}
                          >
                            <Share2 size={16} />
                          </Button>
                          <Button
                            sx={{
                  color: '#7C3AED',
                  bgcolor: '#EDE9FE',
                  minWidth: 36,
                  width: 36,
                  height: 36,
                  borderRadius: '50%',
                  p: 0,
                  '&:active': { bgcolor: '#DDD6FE', transform: 'scale(0.92)' },
                  transition: 'all 0.15s',
                }}
                            onClick={() => { setIsOpen(true); setPriceBreackUpAllValues(data); }}
                          >
                            <Info size={18} />
                          </Button>
                        </Box>
                      </Box>
                    </Box>
                  )}
                </Box>
              ))}

              {/* Print All FAB */}
              <Button
                sx={{
                  position: 'fixed',
                  bottom: 100,
                  right: 20,
                  bgcolor: '#2196f3',
                  color: '#fff',
                  borderRadius: 5,
                  px: 2,
                  py: 1.25,
                  '&:hover': { bgcolor: '#1976d2' },
                  zIndex: 9,
                }}
                onClick={() => { setPrintAllData(true); setOpenPrintModel(true); handlePrintfind('', true); }}
              >
                <Printer size={16} style={{ marginRight: 6 }} />
                Print All
              </Button>
            </>
          )
        )}
      </Box>

      {/* Print dialog */}
      <Dialog open={openPrintModel} onClose={() => setOpenPrintModel(false)} maxWidth="md" fullWidth>
        <DialogContent dividers>
          <div id="printSection" ref={printRef} style={{ width: '100%' }}>
            <PritnModel activeDetail={printInfo} />
          </div>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenPrintModel(false)} color="error">Cancel</Button>
          <Button
            onClick={() =>
              printOption
                ? handlePrint(activeDetail?.JobNo, printAllData)
                : handleShare(printInfo?.JobNo, false)
            }
            sx={{ bgcolor: '#00a2e1', color: '#fff' }}
          >
            {printOption ? 'Download' : 'Share'}
          </Button>
        </DialogActions>
      </Dialog>
      <Dialog open={opencnfDialogOpen} onClose={() => setOpenCnfDialog(false)} maxWidth="xs" fullWidth>
        <DialogContent>
          <Typography sx={{ fontSize: 15, color: '#1F2937' }}>
            Are you sure you want to remove this item?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenCnfDialog(false)} color="error">
            Cancel
          </Button>
          <Button
            onClick={handleConfirmRemoveAll}
            sx={{ bgcolor: '#7C3AED', color: '#fff', '&:hover': { bgcolor: '#6D28D9' } }}
          >
            Remove
          </Button>
        </DialogActions>
      </Dialog>

      <BottomNav />
    </Box>
  );
}