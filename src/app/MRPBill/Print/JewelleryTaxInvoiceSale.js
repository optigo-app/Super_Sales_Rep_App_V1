import React, { useEffect, useState, useRef, useCallback } from "react";
import {
  NumberWithCommas,
  apiCall,
  checkMsg,
  formatAmount,
  handleImageError,
  isObjectEmpty,
  taxGenrator,
} from "../../../../Utils/globalFunc";
import { cloneDeep } from "lodash";
import { OrganizeDataPrint } from "./OrganizeDataPrint";
import "./JewelleryInvoiceMobile.scss";
import { CircularProgress } from "@mui/material";
import sampleData from './sample.json'

const INVOICE_CSS = `
  #mob-invoice-pdf-content { background: #f5f3ef; padding: 8px; font-family: system-ui, -apple-system, Arial, sans-serif; box-sizing: border-box; }
  #mob-invoice-pdf-content * { box-sizing: border-box; }
  .mob-company { background: rgba(0,162,225,0.1); border-radius: 14px; padding: 14px; margin-bottom: 10px; display: flex; gap: 12px; align-items: flex-start; }
  .mob-company__logo { width: 50px; height: 50px; object-fit: contain; border-radius: 8px; flex-shrink: 0; }
  .mob-company__name { font-size: 14px; font-weight: 800; color: #1a1a2e; margin-bottom: 3px; line-height: 1.3; }
  .mob-company__line { font-size: 10.5px; color: #6b6560; line-height: 1.5; word-break: break-word; }
  .mob-company__badge { display: inline-block; background: #c9a84c; color: #1a1a2e; font-size: 9px; font-weight: 800; padding: 2px 8px; border-radius: 20px; margin-top: 6px; text-transform: uppercase; letter-spacing: 0.5px; }
  .mob-meta { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-bottom: 10px; }
  .mob-meta__cell { background: #fff; border-radius: 8px; padding: 10px 12px; border: 1px solid #e0d9cc; }
  .mob-meta__label { font-size: 9.5px; color: #6b6560; text-transform: uppercase; letter-spacing: 0.6px; margin-bottom: 3px; }
  .mob-meta__value { font-size: 13px; font-weight: 700; color: #1a1a1a; word-break: break-all; }
  .mob-customer { background: #fff; border-radius: 14px; padding: 13px 14px; margin-bottom: 10px; border: 1px solid #e0d9cc; }
  .mob-customer__to { font-size: 9.5px; color: #6b6560; text-transform: uppercase; letter-spacing: 0.6px; margin-bottom: 5px; }
  .mob-customer__name { font-size: 14px; font-weight: 800; color: #1a1a2e; margin-bottom: 4px; }
  .mob-customer__addr { font-size: 12px; color: #6b6560; line-height: 1.6; margin-bottom: 4px; }
  .mob-customer__row { font-size: 12px; color: #6b6560; line-height: 1.8; }
  .mob-customer__row strong { color: #1a1a1a; font-weight: 600; }
  .mob-customer__divider { height: 1px; background: #e0d9cc; margin: 8px 0; }
  .mob-customer__tags { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 6px; }
  .mob-customer__tag { font-size: 10.5px; background: #f5f3ef; border: 1px solid #e0d9cc; border-radius: 20px; padding: 2px 10px; color: #1a1a1a; }
  .mob-customer__tag strong { color: #1a1a2e; }
  .mob-section-label { font-size: 10px; font-weight: 700; color: #6b6560; text-transform: uppercase; letter-spacing: 0.8px; margin: 14px 0 7px; padding-left: 2px; }
  .mob-item { background: #fff; border-radius: 14px; border: 1px solid #e0d9cc; margin-bottom: 10px; overflow: hidden; }
  .mob-item__top { display: flex; gap: 12px; padding: 12px; }
  .mob-item__img { width: 76px; height: 76px; object-fit: cover; border-radius: 8px; border: 1px solid #e0d9cc; flex-shrink: 0; background: #f5f3ef; }
  .mob-item__img-placeholder { width: 76px; height: 76px; border-radius: 8px; background: #f5f3ef; border: 1px solid #e0d9cc; flex-shrink: 0; display: flex; align-items: center; justify-content: center; color: #6b6560; font-size: 22px; }
  .mob-item__info { flex: 1; min-width: 0; display: flex; flex-direction: column; }
  .mob-item__sr { font-size: 9.5px; color: #6b6560; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 2px; }
  .mob-item__codes { font-size: 13px; font-weight: 700; color: #1a1a2e; margin-bottom: 2px; }
  .mob-item__sub { font-size: 11.5px; color: #6b6560; line-height: 1.4; flex: 1; }
  .mob-item__amount { margin-top: 8px; font-size: 16px; font-weight: 800; color: #1a1a2e; }
  .mob-item__desc { border-top: 1px dashed #e0d9cc; padding: 10px 12px; }
  .mob-item__desc p { font-size: 11.5px; color: #6b6560; line-height: 1.6; margin-bottom: 3px; }
  .mob-item__material { font-size: 11.5px; color: #6b6560; padding: 2px 0; line-height: 1.5; }
  .mob-item__material strong { color: #1a1a1a; font-weight: 600; }
  .mob-summary { background: #fff; border-radius: 14px; border: 1px solid #e0d9cc; overflow: hidden; margin-bottom: 10px; }
  .mob-summary__row { display: flex; justify-content: space-between; align-items: center; padding: 10px 14px; border-bottom: 1px solid #e0d9cc; }
  .mob-summary__row:last-child { border-bottom: none; }
  .mob-summary__row--subtotal { background: #f5f3ef; }
  .mob-summary__row--subtotal .mob-summary__lbl { font-weight: 700; color: #1a1a1a; }
  .mob-summary__row--grand { background: #1a1a2e; padding: 13px 14px; }
  .mob-summary__row--grand .mob-summary__lbl { color: #fff; font-weight: 700; font-size: 14px; }
  .mob-summary__row--grand .mob-summary__val { color: #f0d98a; font-weight: 800; font-size: 16px; }
  .mob-summary__lbl { font-size: 13px; color: #6b6560; }
  .mob-summary__val { font-size: 13px; font-weight: 700; color: #1a1a1a; }
  .mob-weights { background: #fff; border-radius: 14px; border: 1px solid #e0d9cc; padding: 12px 14px; margin-bottom: 10px; display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
  .mob-weights__item { display: flex; flex-direction: column; gap: 2px; }
  .mob-weights__lbl { font-size: 9.5px; color: #6b6560; text-transform: uppercase; letter-spacing: 0.5px; }
  .mob-weights__val { font-size: 13px; font-weight: 700; color: #1a1a1a; }
  .mob-remark { background: #fff; border-radius: 14px; border: 1px solid #e0d9cc; padding: 13px 14px; margin-bottom: 10px; }
  .mob-remark__title { font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.6px; color: #6b6560; margin-bottom: 7px; }
  .mob-remark__content { font-size: 12px; color: #1a1a1a; line-height: 1.7; }
  .mob-bank { background: #fff; border-radius: 14px; border: 1px solid #e0d9cc; padding: 13px 14px; margin-bottom: 10px; }
  .mob-bank__title { font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.6px; color: #6b6560; margin-bottom: 8px; }
  .mob-bank__row { font-size: 12.5px; color: #1a1a1a; line-height: 1.8; }
  .mob-signatures { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 10px; }
  .mob-signatures__box { background: #fff; border: 1px solid #e0d9cc; border-radius: 14px; padding: 12px; min-height: 80px; display: flex; flex-direction: column; justify-content: space-between; }
  .mob-signatures__label { font-size: 11px; color: #6b6560; }
  .mob-signatures__name { font-size: 12px; font-weight: 700; color: #1a1a2e; margin-top: 8px; }
  .mob-notice { font-size: 10px; color: #6b6560; text-align: center; line-height: 1.6; padding: 8px 4px 16px; font-style: italic; }
  .old-price-wrap { text-decoration: line-through; -webkit-text-decoration: line-through; display: inline; }
  .old-price { text-decoration: line-through; -webkit-text-decoration: line-through; }
  .discount-label { color: #159015; font-size: 12px; font-weight: 700; }
`;

const downloadAsPDF = async (elementId, filename = "invoice.pdf") => {
  if (!window.html2pdf) {
    await new Promise((res, rej) => {
      const s = document.createElement("script");
      s.src = "https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js";
      s.onload = res;
      s.onerror = rej;
      document.head.appendChild(s);
    });
  }
  const el = document.getElementById(elementId);
  await window.html2pdf()
    .set({
      margin: [8, 6, 8, 6],
      filename,
      image: { type: "jpeg", quality: 0.96 },
      html2canvas: { scale: 2, useCORS: true, logging: false },
      jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
      pagebreak: { mode: ["avoid-all", "css"] },
    })
    .from(el)
    .save();
};

// ── Currency symbol helper ────────────────────────────────────────────────────
const CurrSym = ({ html }) => (
  <span dangerouslySetInnerHTML={{ __html: html }} />
);

// ══════════════════════════════════════════════════════════════════════════════
const JewelleryTaxInvoiceSale = ({ urls, token, invoiceNo, printName, evn = "sale", ApiVer, open, onClose, triggerAction, printDataAPI, onLoaderChange }) => {
  const [loader, setLoader] = useState(true);
  const [result, setResult] = useState();
  const [data, setData] = useState([]);
  const [originalData, setOriginalData] = useState([]);
  const [tax, settax] = useState([]);
  const [summary, setSummary] = useState([]);
  const [imgFlag, setImgFlag] = useState(false);
  const [showBoxNo, setShowBoxNo] = useState(false);
  const [isImageWorking, setIsImageWorking] = useState(true);
  const handleImageErrors = () => setIsImageWorking(false);

  const [totalAmount, settotalAmount] = useState({ before: 0, after: 0, grand: 0 });
  const [json0Data, setJson0Data] = useState({});
  const [customerDetail, setCustomerDetail] = useState({ pan: "", gst: "" });
  const [msg, setMsg] = useState("");
  const [addressVal, setAddressVal] = useState("");
  const [MobVal, setMobVal] = useState("");
  const [emailVal, setEmailVal] = useState("");

  const contentRef = useRef(null);
  const footerRef = useRef(null);
  const [spacerStyle, setSpacerStyle] = useState({ height: "0px", pageBreakBefore: "auto" });

  // ── New UI state ────────────────────────────────────────────────────────────
  const [modalOpen, setModalOpen] = useState(false);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [shareLoading, setShareLoading] = useState(false);
  const [pdfSilent, setPdfSilent] = useState(false);

  // ── All original data functions — untouched ────────────────────────────────
  const loadData = (data) => {
    let json0Datas = data.BillPrint_Json[0];
    let custDetail = { pan: "", gst: "" };
    if (data.BillPrint_Json[0]?.vat_cst_pan !== "") {
      let arr = data.BillPrint_Json[0]?.vat_cst_pan.split("|");
      let pans = arr[1] ? arr[1].split("-") : "";
      let gsts = arr[0] ? arr[0].split("-") : "";
      custDetail.pan = pans[1] ? pans[1] : "";
      custDetail.gst = gsts[1] ? gsts[1] : "";
      setCustomerDetail(custDetail);
    }
    setJson0Data(json0Datas);

    let resultArr = [], totalAmountBefore = 0, metalArr = [];
    let diamondWt = 0, labGrownWt = 0, colorStoneWt = 0, grossWt = 0;

    data?.BillPrint_Json1.forEach((e) => {
      let findRecord = metalArr.findIndex((elem) => elem?.label === e?.MetalTypePurity);
      if (findRecord === -1) metalArr.push({ label: e?.MetalTypePurity, value: e?.NetWt * e?.Quantity, gm: true });
      else metalArr[findRecord].value += e?.NetWt * e?.Quantity;

      grossWt += e?.grosswt * e?.Quantity;
      let diamondWts = 0, labGrownWts = 0, colorStoneWts = 0, miscWts = 0, miscWt = 0;
      let obj = { ...e };
      let materials = [];
      totalAmountBefore += e?.UnitCost
      let metalColorCode = "";

      data?.BillPrint_Json2.forEach((ele) => {
        if (obj?.SrJobno === ele?.StockBarcode) {
          if (ele?.IsCenterStone === 1) { materials.push(ele); return; }

          if ((ele?.MasterManagement_DiamondStoneTypeid === 1 || ele?.MasterManagement_DiamondStoneTypeid === 2) && ele?.IsHSCOE === 0 && ele?.IsCenterStone !== 1) {
            const getMaterialType = (val) => val === "LabGrown" ? "LabGrown" : "OTHER";
            let findRecord = materials.findIndex((elem) => {
              const isSameBasic =
                elem?.MasterManagement_DiamondStoneTypeid === ele?.MasterManagement_DiamondStoneTypeid &&
                elem?.ShapeName === ele?.ShapeName && elem?.Colorname === ele?.Colorname &&
                elem?.QualityName === ele?.QualityName && elem?.Rate === ele?.Rate && elem?.IsCenterStone !== 1;
              if (ele?.MasterManagement_DiamondStoneTypeid === 1) return isSameBasic && getMaterialType(elem?.MaterialTypeName) === getMaterialType(ele?.MaterialTypeName);
              return isSameBasic;
            });
            if (findRecord === -1) materials.push(ele);
            else { materials[findRecord].Pcs += ele?.Pcs; materials[findRecord].Wt += ele?.Wt; materials[findRecord].Amount += ele?.Amount; }

            if (ele?.MasterManagement_DiamondStoneTypeid === 1) {
              if (ele?.MaterialTypeName === "LabGrown") { labGrownWt += ele?.Wt * obj?.Quantity; labGrownWts += ele?.Wt; }
              else { diamondWt += ele?.Wt * obj?.Quantity; diamondWts += ele?.Wt; }
            }
            if (ele?.MasterManagement_DiamondStoneTypeid === 2) { colorStoneWt += ele?.Wt * obj?.Quantity; colorStoneWts += ele?.Wt; }
            if (ele?.MasterManagement_DiamondStoneTypeid === 3) { miscWt += ele?.Wt; miscWts += ele?.Wt; }
          } else if (ele?.MasterManagement_DiamondStoneTypeid === 4) {
            if (ele?.IsPrimaryMetal === 1) metalColorCode = ele?.MetalColorCode;
            else if (metalColorCode === "") metalColorCode = ele?.MetalColorCode;
          }
        }
      });

      obj.TotalAmount = obj.TotalAmount / data?.BillPrint_Json[0].CurrencyExchRate;
      obj.diamondWts = diamondWts; obj.labGrownWts = labGrownWts;
      obj.colorStoneWts = colorStoneWts; obj.miscWts = miscWts;
      obj.materials = materials; obj.metalColorCode = metalColorCode;
      obj.miscWt = miscWt * obj?.Quantity;
      resultArr.push(obj);
    });

    metalArr.push({ label: "Diamond Wt", value: diamondWt, gm: false });
    metalArr.push({ label: "Lab Grown Wt", value: labGrownWt, gm: false });
    metalArr.push({ label: "Stone Wt", value: colorStoneWt, gm: false });
    metalArr.push({ label: "Gross Wt", value: grossWt, gm: true });

    setSummary(metalArr);

    let taxValue = taxGenrator(json0Datas, totalAmountBefore);
    let afterTotal = taxValue.reduce((acc, cur) => acc + +cur.amount, 0) + totalAmountBefore;
    let grandTotal = afterTotal + json0Datas.AddLess;

    resultArr?.sort((a, b) => parseInt(a?.id?.toString()?.match(/\d+/)[0]) - parseInt(b?.id?.toString()?.match(/\d+/)[0]));
    settotalAmount({ before: totalAmountBefore, after: afterTotal, grand: grandTotal });
    settax(taxValue);
    setData(resultArr);
    setOriginalData(resultArr);
  };

  const loadData2 = (data) => {
    const copydata = cloneDeep(data);
    copydata.BillPrint_Json[0].address = copydata?.BillPrint_Json[0]?.Printlable?.split("\r\n");
    const datas = OrganizeDataPrint(copydata?.BillPrint_Json[0], copydata?.BillPrint_Json1, copydata?.BillPrint_Json2);
    setAddressVal(copydata?.BillPrint_Json[0]?.customerstate + " " + copydata?.BillPrint_Json[0]?.customercountry + " " + copydata?.BillPrint_Json[0]?.customerpincode);
    setMobVal(copydata?.BillPrint_Json[0]?.customermobileno);
    setEmailVal(copydata?.BillPrint_Json[0]?.customeremail1);
    setResult(datas);
  };

  useEffect(() => {
    const sendData = async () => {
      try {

        const data = await apiCall(printDataAPI?.tkn, printDataAPI?.invn, printDataAPI?.pnm, printDataAPI?.up, printDataAPI?.evn, printDataAPI?.ctv);
        // const data = sampleData;
        loadData(data?.Data); loadData2(data?.Data); setLoader(false);
      } catch (err) { console.error(err); }
    };
    sendData();
  }, []);

  const calculateSpacer = useCallback(() => {
    if (!contentRef.current || !footerRef.current || loader) return;
    setTimeout(() => {
      const cH = contentRef.current.scrollHeight;
      const fH = footerRef.current.scrollHeight;
      const pageH = 1120;
      let lastPage = cH % pageH || pageH;
      let spacer = pageH - lastPage - fH;
      if (spacer < 0) { setSpacerStyle({ height: `${pageH - fH - 20}px`, pageBreakBefore: "always" }); }
      else { setSpacerStyle({ height: `${Math.max(spacer, 0)}px`, pageBreakBefore: "auto" }); }
    }, 150);
  }, [loader]);

  useEffect(() => { if (!loader && data.length > 0) setTimeout(() => calculateSpacer(), 200); }, [data, totalAmount, json0Data, calculateSpacer]);
  useEffect(() => {
    if (showBoxNo) {
      const sorted = [...data].sort((a, b) => {
        const get = (t) => { const m = t.match(/BOX-(\d+)/); return m ? parseInt(m[1], 10) : Infinity; };
        return get(a.Counter_Tray) - get(b.Counter_Tray) || a.SrNo - b.SrNo;
      });
      setData(sorted);
    } else { setData(originalData); }
  }, [showBoxNo]);

  // ── Sync external open prop → modalOpen ────────────────────────────────────
  useEffect(() => {
    if (open !== undefined) setModalOpen(Boolean(open));
  }, [open]);

  // ── Notify parent when loader state changes ───────────────────────────────
  useEffect(() => { onLoaderChange?.(loader); }, [loader]);

  // ── Auto-trigger download or share when triggerAction is set ────────────────
  useEffect(() => {
    if (!triggerAction || loader || !data.length) return;
    setPdfSilent(true);
    setModalOpen(true);
    const t = setTimeout(async () => {
      if (triggerAction === "download") await handleDownloadPDF();
      if (triggerAction === "share") await handleSharePDF();
      setModalOpen(false);
      setPdfSilent(false);
      onClose?.();
    }, 400);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [triggerAction, loader]);

  const pdfOptions = {
    margin: [8, 6, 8, 6],
    image: { type: "jpeg", quality: 0.96 },
    html2canvas: {
      scale: 2,
      useCORS: true,
      allowTaint: true,
      logging: false,
      imageTimeout: 0,
      windowWidth: 748,
      onclone: (clonedDoc) => {
        const style = clonedDoc.createElement("style");
        style.textContent = INVOICE_CSS;
        clonedDoc.head.appendChild(style);
        const el = clonedDoc.getElementById("mob-invoice-pdf-content");
        if (el) {
          el.style.background = "#f5f3ef";
          el.style.padding = "8px";
          el.style.fontFamily = "system-ui, -apple-system, Arial, sans-serif";
          el.style.width = "748px";
          el.style.maxWidth = "748px";
          el.style.overflow = "hidden";
        }
      },
    },
    jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
    pagebreak: { mode: ["avoid-all", "css"] },
  };

  const ensureHtml2pdf = () => {
    if (window.html2pdf) return Promise.resolve();
    return new Promise((res, rej) => {
      const s = document.createElement("script");
      s.src = "https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js";
      s.onload = res; s.onerror = rej;
      document.head.appendChild(s);
    });
  };

  const handleDownloadPDF = async () => {
    setPdfLoading(true);
    try {
      await ensureHtml2pdf();
      const el = document.getElementById("mob-invoice-pdf-content");
      if (!el) return;
      const safeInvoiceNo = (json0Data?.InvoiceNo || "invoice").replace(/[/\\?%*:|"<>]/g, "-");
      const fileName = `Invoice # ${safeInvoiceNo}.pdf`;
      if (window.flutter_inappwebview) {
        const blob = await window.html2pdf().set({ ...pdfOptions, filename: fileName }).from(el).outputPdf("blob");
        const reader = new FileReader();
        reader.onloadend = () => window.flutter_inappwebview.callHandler("downloadPDF", reader.result.split(",")[1], fileName);
        reader.readAsDataURL(blob);
      } else {
        await window.html2pdf().set({ ...pdfOptions, filename: fileName }).from(el).save();
      }
    } catch (e) { console.error(e); }
    setPdfLoading(false);
  };

  const handleSharePDF = async () => {
    setShareLoading(true);
    try {
      await ensureHtml2pdf();
      const el = document.getElementById("mob-invoice-pdf-content");
      if (!el) return;
      const safeInvoiceNo = (json0Data?.InvoiceNo || "invoice").replace(/[/\\?%*:|"<>]/g, "-");
      const fileName = `Invoice # ${safeInvoiceNo}.pdf`;
      const blob = await window.html2pdf().set({ ...pdfOptions, filename: fileName }).from(el).outputPdf("blob");
      if (window.flutter_inappwebview) {
        const reader = new FileReader();
        reader.onloadend = () => window.flutter_inappwebview.callHandler("sharePDF", reader.result.split(",")[1], fileName);
        reader.readAsDataURL(blob);
      } else if (navigator.share) {
        await navigator.share({ files: [new File([blob], fileName, { type: "application/pdf" })], title: `Invoice # ${safeInvoiceNo}` });
      } else {
        const link = document.createElement("a");
        link.href = URL.createObjectURL(blob);
        link.download = fileName;
        document.body.appendChild(link); link.click(); link.remove();
      }
    } catch (e) { console.error(e); }
    setShareLoading(false);
  };

  const groupMaterials = (materials = []) => {
    const acc = {};
    materials.forEach((ele) => {
      if (ele?.IsCenterStone === 1) { acc[`cs-${ele?.StockBarcode}`] = { ...ele }; return; }
      const mt = ele?.MaterialTypeName === "LabGrown" ? "LabGrown" : "OTHER";
      const dia = ele?.MasterManagement_DiamondStoneTypeid === 1;
      const key = dia ? `${mt}-${ele?.Shape_Code}-${ele?.Color_Code}-${ele?.Quality_Code}` : `${ele?.Shape_Code}-${ele?.Color_Code}-${ele?.Quality_Code}`;
      if (acc[key]) { acc[key].Pcs += ele?.Pcs || 0; acc[key].Wt += ele?.Wt || 0; }
      else acc[key] = { ...ele, Pcs: ele?.Pcs || 0, Wt: ele?.Wt || 0 };
    });
    return Object.values(acc);
  };

  const evnDecoded = atob(evn);


  const getDiscountLabel = (e) => {
    if (!e?.Discount || e?.Discount === 0) return null;

    if (e?.isdiscountinamount === 1) {
      return `Amt ${NumberWithCommas(e?.DiscountAmt || 0, 2)} OFF`;
    } else {
      return `${e?.Discount || 0}% OFF`;
    }
  };

  const getFinalAmount = (e) => {
    let finalAmount = e?.UnitCost || 0;
    if (e?.Discount > 0) {
      if (e?.isdiscountinamount === 1) {
        finalAmount -= (e?.DiscountAmt || 0);
      } else {
        finalAmount -= (finalAmount * e?.Discount) / 100;
      }
    }

    return finalAmount;
  };

  // ── Render ──────────────────────────────────────────────────────────────────
  if (loader) return null;

  if (msg !== "") return <p className="mob-error">{msg}</p>;

  return (
    <>
      {/* ── Open Modal Button (only when not externally controlled) ── */}
      {!onClose && (
        <button className="mob-open-btn" onClick={() => setModalOpen(true)}>
          View Invoice
        </button>
      )}

      {/* ── Modal ── */}
      {modalOpen && (
        <div
          className={`mob-overlay${pdfSilent ? ' mob-overlay--silent' : ''}`}
          onClick={!pdfSilent ? () => { setModalOpen(false); onClose?.(); } : undefined}
        >
          <div className="mob-sheet" onClick={(e) => e.stopPropagation()}>

            {/* Handle */}
            <div className="mob-handle"><span /></div>

            {/* Header */}
            <div className="mob-header">
              <div>
                <div className="mob-header__title">Invoice #{json0Data?.InvoiceNo}</div>
                <div className="mob-header__sub">{json0Data?.EntryDate}</div>
              </div>
              <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                {/* <button className="btn-pdf" style={{ padding: '6px 12px', fontSize: 12, flex: 'none' }} onClick={handleDownloadPDF} disabled={pdfLoading}>
                  {pdfLoading ? "…" : "⬇ Download"}
                </button>
                <button className="btn-share" style={{ padding: '6px 12px', fontSize: 12, flex: 'none' }} onClick={handleSharePDF} disabled={shareLoading}>
                  {shareLoading ? "…" : "↗ Share"}
                </button> */}
                <button className="mob-header__close" onClick={() => { setModalOpen(false); onClose?.(); }}>×</button>
              </div>
            </div>

            {/* Scrollable body */}
            <div className="mob-body">

              {/* PDF-printable content wrapper */}
              <div id="mob-invoice-pdf-content">

                {/* ── Company Header ── */}
                <div className="mob-company">
                  {isImageWorking && json0Data?.PrintLogo && (
                    <img src={json0Data?.PrintLogo} alt="" className="mob-company__logo" onError={handleImageErrors} />
                  )}
                  <div>
                    {json0Data?.IsBranchWiseAddress === 1 ? (
                      <>
                        <div className="mob-company__name" dangerouslySetInnerHTML={{ __html: json0Data?.Branch_Address }} />
                      </>
                    ) : (
                      <>
                        <div className="mob-company__name">{json0Data?.CompanyFullName}</div>
                        <div className="mob-company__line">{json0Data?.CompanyAddress}</div>
                        {json0Data?.CompanyAddress2 && <div className="mob-company__line">{json0Data?.CompanyAddress2}</div>}
                        <div className="mob-company__line">{json0Data?.CompanyCity} - {json0Data?.CompanyPinCode}, {json0Data?.CompanyState} ({json0Data?.CompanyCountry})</div>
                        <div className="mob-company__line">T {json0Data?.CompanyTellNo}</div>
                        <div className="mob-company__line">{json0Data?.CompanyEmail} | {json0Data?.CompanyWebsite}</div>
                        <div className="mob-company__line">{json0Data?.Company_VAT_GST_No} | {json0Data?.Company_CST_STATE} - {json0Data?.Company_CST_STATE_No} | PAN - {json0Data?.Pannumber}</div>
                      </>
                    )}
                    <span className="mob-company__badge">{evnDecoded === "memo" ? "Memo Invoice" : "Tax Invoice"}</span>
                  </div>
                </div>

                {/* ── Invoice Meta ── */}
                <div className="mob-meta">
                  <div className="mob-meta__cell">
                    <div className="mob-meta__label">Invoice No</div>
                    <div className="mob-meta__value">{json0Data?.InvoiceNo}</div>
                  </div>
                  <div className="mob-meta__cell">
                    <div className="mob-meta__label">Date</div>
                    <div className="mob-meta__value">{json0Data?.EntryDate}</div>
                  </div>
                  {json0Data?.DueDays !== 0 && (
                    <div className="mob-meta__cell">
                      <div className="mob-meta__label">Terms</div>
                      <div className="mob-meta__value">{json0Data?.DueDays}</div>
                    </div>
                  )}
                  {evnDecoded !== "memo" && (
                    <div className="mob-meta__cell">
                      <div className="mob-meta__label">Due Date</div>
                      <div className="mob-meta__value">{json0Data?.DueDate}</div>
                    </div>
                  )}
                </div>

                {/* ── Customer ── */}
                <div className="mob-customer">
                  <div className="mob-customer__to">Bill To</div>
                  {json0Data?.customerfirmname && (
                    <div className="mob-customer__name">{json0Data?.customerfirmname}</div>
                  )}

                  {/* Address — editable when imgFlag is true (original logic kept) */}
                  {!imgFlag ? (
                    <>
                      {json0Data?.customerstreet && <div className="mob-customer__addr">{json0Data?.customerstreet}</div>}
                      {json0Data?.customerregion && <div className="mob-customer__addr">{json0Data?.customerregion}</div>}
                      {json0Data?.customercity && <div className="mob-customer__addr">{json0Data?.customercity}</div>}
                      <div className="mob-customer__addr">{json0Data?.customerstate}, {json0Data?.customercountry} {json0Data?.customerpincode}</div>
                      {json0Data?.customermobileno && (
                        <div className="mob-customer__row">Tel: {json0Data?.country_code && `+${json0Data?.country_code} `}{json0Data?.customermobileno}</div>
                      )}
                      <div className="mob-customer__row">{json0Data?.customeremail1}</div>
                    </>
                  ) : (
                    <>
                      <input type="text" value={addressVal} onChange={(e) => setAddressVal(e.target.value)} style={{ width: "100%", border: "1px solid #e0d9cc", borderRadius: "6px", padding: "4px 8px", fontSize: "12px", marginBottom: "4px" }} />
                      <input type="text" value={MobVal} onChange={(e) => setMobVal(e.target.value)} style={{ width: "100%", border: "1px solid #e0d9cc", borderRadius: "6px", padding: "4px 8px", fontSize: "12px", marginBottom: "4px" }} />
                      <input type="text" value={emailVal} onChange={(e) => setEmailVal(e.target.value)} style={{ width: "100%", border: "1px solid #e0d9cc", borderRadius: "6px", padding: "4px 8px", fontSize: "12px" }} />
                    </>
                  )}

                  <div className="mob-customer__divider" />
                  <div className="mob-customer__tags">
                    {customerDetail?.pan && <span className="mob-customer__tag">PAN: <strong>{customerDetail.pan}</strong></span>}
                    {result?.header?.Cust_VAT_GST_No && <span className="mob-customer__tag">GSTIN: <strong>{result?.header?.Cust_VAT_GST_No}</strong></span>}
                    {result?.header?.Cust_CST_STATE && <span className="mob-customer__tag">{result?.header?.Cust_CST_STATE} <strong>{result?.header?.Cust_CST_STATE_No}</strong></span>}
                  </div>
                </div>

                {/* ── Items ── */}
                <div className="mob-section-label">Items ({data?.length})</div>

                {data?.map((e, i) => {
                  const merged = groupMaterials(e?.materials);

                  const finalAmount = getFinalAmount(e);
                  const discountLabel = getDiscountLabel(e);
                  const hasDiscount = e?.Discount > 0;

                  return (
                    <div className="mob-item" key={i}>
                      <div className="mob-item__top">
                        {/* Image */}
                          <img src={e?.DesignImage} alt="" className="mob-item__img" onError={handleImageError} />

                        {/* Info */}
                        <div className="mob-item__info">
                          <div className="mob-item__sr">Item #{i + 1}</div>
                          <div className="mob-item__codes">
                            {evnDecoded?.trim()?.toLowerCase() !== "quote" && `Job: ${e?.SrJobno} · `}Design: {e?.designno}
                            {e?.Size && ` · ${e?.Size}`}
                            {e?.lineid && ` · ${e?.lineid}`}
                            {showBoxNo && ` · ${e?.Counter_Tray}`}
                          </div>
                          <div className="mob-item__sub">
                            {e?.MetalTypePurity} {e?.metalColorCode} | {NumberWithCommas(e?.grosswt, 3)} gms GW | {NumberWithCommas(e?.NetWt, 3)} gms NW
                            {e?.diamondWts !== 0 && <> | {evnDecoded === "memo" && "DIA: "}{NumberWithCommas(e?.diamondWts, 3)} Cts</>}
                            {e?.colorStoneWts !== 0 && <> | {evnDecoded === "memo" && "CS: "}{NumberWithCommas(e?.colorStoneWts, 3)} Cts</>}
                            {e?.miscWts !== 0 && <> | {evnDecoded === "memo" && "MISC: "}{NumberWithCommas(e?.miscWts, 3)} gms</>}
                          </div>


                          <div className="mob-item__amount">
                            {hasDiscount ? (
                              <div>
                                <div style={{ display: 'flex', gap: '10px' }}>
                                  <div>
                                    <CurrSym html={json0Data?.Currencysymbol} />
                                    <span className="new-price">
                                      {NumberWithCommas(e?.TotalAmount, 2)}
                                    </span>
                                  </div>

                                  <div style={{ fontSize: "13px", display: 'flex', alignItems: 'flex-end' }}>
                                    <span className="old-price-wrap" style={{ textDecoration: 'line-through', WebkitTextDecoration: 'line-through' }}>
                                      <CurrSym html={json0Data?.Currencysymbol} />
                                      <span className="old-price" style={{ textDecoration: 'line-through', WebkitTextDecoration: 'line-through' }}>{NumberWithCommas(e?.UnitCost, 2)}</span>
                                    </span>
                                  </div>
                                </div>

                                <div className="discount-label" style={{ color: '#159015', fontSize: '12px' }}>
                                  {discountLabel}
                                </div>
                              </div>
                            ) : (
                              <div>
                                <CurrSym html={json0Data?.Currencysymbol} />
                                {NumberWithCommas(finalAmount, 2)}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Materials & Remarks */}
                      {(merged?.length > 0 || e?.JobRemark) && (
                        <div className="mob-item__desc">
                          {merged?.map((ele, ind) => (
                            <div className="mob-item__material" key={ind}>
                              <strong>
                                {ele?.MasterManagement_DiamondStoneTypeid === 1 && (ele?.IsCenterStone === 1 ? "CenterStone" : ele?.MaterialTypeName === "LabGrown" ? "Lab Grown Diamond" : "Diamond")}
                                {ele?.MasterManagement_DiamondStoneTypeid === 2 && "Colorstone"}
                                {ele?.MasterManagement_DiamondStoneTypeid === 3 && "Misc"}
                              </strong>
                              {" "}: {NumberWithCommas(ele?.Pcs, 0)} Pcs | {NumberWithCommas(ele?.Wt, 3)}{ele?.MasterManagement_DiamondStoneTypeid === 3 ? " gms" : " Cts"} | {ele?.Shape_Code}
                              {ele?.MasterManagement_DiamondStoneTypeid !== 3 && <> {ele?.Color_Code} {ele?.Quality_Code}</>}
                            </div>
                          ))}

                          {e?.JobRemark && evnDecoded !== "memo" && (
                            <div className="mob-item__remark">
                              <div className="mob-item__remark-title">Remarks</div>
                              <p>{e?.JobRemark}</p>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}

                {/* ── Weights Summary ── */}
                {summary?.filter(s => s.value !== 0)?.length > 0 && (
                  <>
                    <div className="mob-section-label">Weight Summary</div>
                    <div className="mob-weights">
                      {summary?.map((s, i) => s.value !== 0 && (
                        <div className="mob-weights__item" key={i}>
                          <div className="mob-weights__lbl">{s.label}</div>
                          <div className="mob-weights__val">{NumberWithCommas(s.value, 3)} {s.gm ? "gm" : "cts"}</div>
                        </div>
                      ))}
                    </div>
                  </>
                )}

                {/* ── Totals ── */}
                {/* ── Totals ── */}
                <div className="mob-section-label">Amount</div>
                <div className="mob-summary">

                  {/* Subtotal (before discount) */}
                  <div className="mob-summary__row mob-summary__row--subtotal">
                    <span className="mob-summary__lbl">Subtotal</span>
                    <span className="mob-summary__val">
                      <CurrSym html={json0Data?.Currencysymbol} />
                      {NumberWithCommas(totalAmount.before, 2)}
                    </span>
                  </div>

                  {(() => {
                    const totalBeforeDiscount = data.reduce((acc, e) => acc + (e?.UnitCost || 0), 0);
                    const totalAfterDiscount = data.reduce((acc, e) => acc + getFinalAmount(e), 0);
                    const totalDiscountAmt = totalBeforeDiscount - totalAfterDiscount;
                    if (totalDiscountAmt <= 0) return null;
                    return (
                      <>
                        <div className="mob-summary__row" style={{ color: '#159015' }}>
                          <span className="mob-summary__lbl" style={{ color: '#159015' }}>Discount</span>
                          <span className="mob-summary__val" style={{ color: '#159015' }}>
                            − <CurrSym html={json0Data?.Currencysymbol} />
                            {NumberWithCommas(totalDiscountAmt, 2)}
                          </span>
                        </div>
                        <div className="mob-summary__row mob-summary__row--subtotal">
                          <span className="mob-summary__lbl">Amount (After Discount)</span>
                          <span className="mob-summary__val">
                            <CurrSym html={json0Data?.Currencysymbol} />
                            {NumberWithCommas(totalAfterDiscount, 2)}
                          </span>
                        </div>
                      </>
                    );
                  })()}

                  {/* Tax rows */}
                  {result?.allTaxes?.map((t, i) =>
                    t?.amountInNumber !== 0 && (
                      <div className="mob-summary__row" key={i}>
                        <span className="mob-summary__lbl">{t.name} @ ({t.per})</span>
                        <span className="mob-summary__val">
                          <CurrSym html={result?.header?.Currencysymbol} />
                          {t.amountInNumber?.toFixed(2)}
                        </span>
                      </div>
                    )
                  )}

                  {/* Total incl. tax */}
                  {result?.allTaxesTotal > 0 && (
                    <div className="mob-summary__row">
                      <span className="mob-summary__lbl">Total (incl. tax)</span>
                      <span className="mob-summary__val">
                        <CurrSym html={result?.header?.Currencysymbol} />
                        {NumberWithCommas(
                          data.reduce((acc, e) => acc + getFinalAmount(e), 0) + (result?.allTaxesTotal || 0),
                          2
                        )}
                      </span>
                    </div>
                  )}

                  {/* Add / Less */}
                  {result?.header?.AddLess !== 0 && (
                    <div className="mob-summary__row">
                      <span className="mob-summary__lbl">
                        {result?.header?.AddLess > 0 ? "Add" : "Less"}
                      </span>
                      <span className="mob-summary__val">
                        <CurrSym html={result?.header?.Currencysymbol} />
                        {formatAmount(result?.header?.AddLess / result?.header?.CurrencyExchRate)}
                      </span>
                    </div>
                  )}

                  {/* Freight */}
                  {result?.header?.FreightCharges !== 0 && (
                    <div className="mob-summary__row">
                      <span className="mob-summary__lbl">{result?.header?.ModeOfDel}</span>
                      <span className="mob-summary__val">
                        <CurrSym html={result?.header?.Currencysymbol} />
                        {formatAmount(result?.header?.FreightCharges / result?.header?.CurrencyExchRate)}
                      </span>
                    </div>
                  )}

                  {/* Grand Total */}
                  <div className="mob-summary__row mob-summary__row--grand">
                    <span className="mob-summary__lbl">Grand Total</span>
                    <span className="mob-summary__val">
                      <CurrSym html={json0Data?.Currencysymbol} />
                      {formatAmount(
                        data.reduce((acc, e) => acc + getFinalAmount(e), 0)
                        + (result?.allTaxesTotal || 0)
                        + (result?.header?.AddLess / result?.header?.CurrencyExchRate || 0)
                        + (result?.header?.FreightCharges / result?.header?.CurrencyExchRate || 0)
                      )}
                    </span>
                  </div>

                </div>

                {/* ── Print Remarks ── */}
                {json0Data?.PrintRemark && (
                  <>
                    <div className="mob-section-label">Remarks</div>
                    <div className="mob-remark">
                      <div className="mob-remark__content" dangerouslySetInnerHTML={{ __html: json0Data?.PrintRemark }} />
                    </div>
                  </>
                )}

                {/* ── Declaration ── */}
                {json0Data?.Declaration && (
                  <>
                    <div className="mob-section-label">Declaration</div>
                    <div className="mob-remark">
                      <div className="mob-remark__content" dangerouslySetInnerHTML={{ __html: json0Data?.Declaration }} />
                    </div>
                  </>
                )}

                {/* ── Bank Detail ── */}
                <div className="mob-section-label">Bank Detail</div>
                <div className="mob-bank">
                  <div className="mob-bank__row">Bank Name: {json0Data?.bankname}</div>
                  <div className="mob-bank__row">Branch: {json0Data?.bankaddress}</div>
                  <div className="mob-bank__row">Account Name: {json0Data?.accountname}</div>
                  <div className="mob-bank__row" dangerouslySetInnerHTML={{ __html: `Account No.: ${json0Data?.accountnumber?.replace("HKD A/C No :", "<br/>HKD A/C No:")}` }} />
                  <div className="mob-bank__row">RTGS/NEFT IFSC: {json0Data?.rtgs_neft_ifsc}</div>
                </div>

                {/* ── Signatures ── */}
                <div className="mob-signatures">
                  <div className="mob-signatures__box">
                    <div className="mob-signatures__label">Signature</div>
                    <div className="mob-signatures__name">{json0Data?.customerfirmname}</div>
                  </div>
                  <div className="mob-signatures__box">
                    <div className="mob-signatures__label">Authorised Signature</div>
                    <div className="mob-signatures__name">{json0Data?.Branch_Description}</div>
                  </div>
                </div>

                {/* ── Notice ── */}
                <div className="mob-notice">
                  ** This is a computer generated invoice. Kindly notify us immediately in case you find any discrepancy in the details of transactions.
                </div>

              </div>{/* /pdf content */}
            </div>{/* /mob-body */}

            {/* ── Footer: Download + Share ── */}
            <div className="mob-footer">
              <button className="btn-pdf" onClick={handleDownloadPDF} disabled={pdfLoading}>
                {pdfLoading ? "Generating…" : "⬇ Download PDF"}
              </button>
              <button className="btn-share" onClick={handleSharePDF} disabled={shareLoading}>
                {shareLoading ? "Sharing…" : "↗ Share PDF"}
              </button>
            </div>

          </div>
        </div>
      )}
    </>
  );
};

export default JewelleryTaxInvoiceSale;