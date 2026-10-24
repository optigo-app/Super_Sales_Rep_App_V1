'use client';

import { useState, useEffect, useCallback } from 'react';
import { Box, Typography, CircularProgress, Chip, IconButton } from '@mui/material';
import {
  TrendingUp,
  Package,
  CalendarClock,
  Receipt,
  ClipboardList,
  Wrench,
  FileStack,
  ChevronRight,
  ArrowLeft,
  Inbox,
} from 'lucide-react';
import { CRMCustomerLog } from '@/Utils/API/CRMCustomerLog/CRMCustomerLog';
import { Reports } from '@/Utils/API/Reports/Reports';

const ACCENT = '#7C3AED';
const ACCENT_SOFT = '#EDE9FE';
const GREEN = '#059669';
const GREEN_SOFT = 'rgba(16,185,129,0.1)';
const RED = '#DC2626';
const RED_SOFT = 'rgba(220,38,38,0.08)';

const REPORTS = [
  {
    key: 'CRM_Customer_DesignWiseSale',
    source: 'crm',
    label: 'Design Wise Sale',
    description: 'Designs purchased by this customer',
    icon: Package,
    view: 'cards',
  },
  {
    key: 'Report_DueDate',
    source: 'common',
    label: 'Due Date Report',
    description: 'Outstanding bills & due dates',
    icon: CalendarClock,
    view: 'table',
  },
  {
    key: 'Report_InvoiceWiseSale',
    source: 'common',
    label: 'Invoice Wise Sale',
    description: 'Sales broken down by invoice',
    icon: Receipt,
    view: 'table',
  },
  {
    key: 'Report_Order_new',
    source: 'common',
    label: 'Order Report',
    description: 'Job orders overview',
    icon: ClipboardList,
    view: 'table',
  },
  {
    key: 'Report_RepairingStock',
    source: 'common',
    label: 'Repairing Stock',
    description: 'Items currently under repair',
    icon: Wrench,
    view: 'table',
  },
  {
    key: 'Report_MemoData',
    source: 'common',
    label: 'Memo Data',
    description: 'Jewellery memo records',
    icon: FileStack,
    view: 'table',
  },
];

const IMAGE_KEYS = ['ImagePath', 'DefImage', 'DefaultImageName'];

const REPORT_FIELD_CONFIG = {
  Report_DueDate: {
    title: (row) => row.firmname || '—',
    subtitle: (row) => (row.CustomerCode ? `A/C: ${row.CustomerCode}` : ''),
    highlight: { label: 'Due Amount', key: 'DueAmount', type: 'money', negative: 'DueMetal' },
    badge: (row) =>
      Number(row.OverDueDays) > 0 ? `${row.OverDueDays}d overdue` : null,
    summary: [
      { label: 'Bills', key: 'icount' },
      { label: 'Total Due', key: 'TotalDueAmount', type: 'money' },
      { label: 'Due Metal', key: 'TotalDueMetal', type: 'number' },
    ],
    fields: [
      { label: 'Account', key: 'CustomerCode' },
      { label: 'Company Name', key: 'firmname' },
      { label: 'Event', key: 'EventName' },
      { label: 'Invoice Date', key: 'Invoicedate' },
      { label: 'Due Date', key: 'DueDate' },
      { label: 'Promise Date', key: 'Promisedate' },
      { label: 'Voucher#', key: 'VoucherNo' },
      { label: 'Due Days', key: 'DueDays', type: 'number' },
      { label: 'Over Due Days', key: 'OverDueDays', type: 'number' },
      { label: 'Bill Amount', key: 'BillAmount', type: 'money' },
      { label: 'Due Amount', key: 'DueAmount', type: 'money' },
      { label: 'Bill Metal', key: 'BillMetal', type: 'number' },
      { label: 'Due Metal', key: 'DueMetal', type: 'number' },
    ],
  },

  Report_InvoiceWiseSale: {
    title: (row) => row.StockDocumentNo || '—',
    subtitle: (row) => row.CustomerFullName || row.BillUser_Firmname || '',
    highlight: { label: 'Total Amount', key: 'TotalAmount', type: 'money' },
    badge: (row) => row.StockDocumentdate || null,
    summary: [
      { label: 'Invoices', key: 'icount' },
      { label: 'Total Sale', key: 'sumTotalAmount', type: 'money' },
      { label: 'Net Wt', key: 'sumNetWeight', type: 'number' },
      { label: 'Gross Wt', key: 'sumGrossWeight', type: 'number' },
    ],
    fields: [
      { label: 'Date', key: 'StockDocumentdate' },
      { label: 'Inv Number', key: 'StockDocumentNo' },
      { label: 'Customer Code', key: 'usermanagement_customercode' },
      { label: 'Customer Name', key: 'CustomerFullName' },
      { label: 'Net Wt', key: 'NetWeight', type: 'number' },
      { label: 'Net Wt in 24k', key: 'netwt24k', type: 'number' },
      { label: 'Gross Wt', key: 'GrossWeight', type: 'number' },
      { label: 'Total Amount', key: 'TotalAmount', type: 'money' },
    ],
  },

  Report_Order: {
    title: (row) => row.SKUNO || '—',
    subtitle: (row) => row.firmname || row.customercode || '',
    highlight: { label: 'Total Amt', key: '_FinalAmount', type: 'money' },
    badge: (row) => (row.po ? `PO: ${row.po}` : null),
    summary: [
      { label: 'Orders', key: 'icount' },
      { label: 'Gross Wt', key: 'T_Gwt', type: 'number' },
      { label: 'Net Wt', key: 'T_Nwt', type: 'number' },
      { label: 'Total Amt', key: 'T_Amt', type: 'money' },
    ],
    fields: [
      { label: 'Sr#', key: 'SrNo' },
      { label: 'Date', key: 'jobdate' },
      { label: 'SKU#', key: 'SKUNO' },
      { label: 'PO', key: 'po' },
      { label: 'Customer', key: 'customercode' },
      { label: 'Sales Rep', key: 'SalesrepCode' },
      { label: 'Company', key: 'firmname' },
      { label: 'Gross Wt', key: '_Gwt', type: 'number' },
      { label: 'Net Wt', key: '_Nwt', type: 'number' },
      { label: 'Total Amt', key: '_FinalAmount', type: 'money' },
    ],
  },

  Report_RepairingStock: {
    title: (row) => row.designno || '—',
    subtitle: (row) => row.Customer || row.usermanagement_code || '',
    highlight: null,
    badge: (row) => row.QuickRepaireStatus || null,
    summary: [
      { label: 'Items', key: 'cnt' },
      { label: 'Gross Wt', key: 'TotalGrossWt', type: 'number' },
      { label: 'Net Wt', key: 'TotalNetWt', type: 'number' },
    ],
    fields: [
      { label: 'Date', key: 'EntryDate' },
      { label: 'Job No', key: 'J_JobNo' },
      { label: 'Design No', key: 'designno' },
      { label: 'Customer', key: 'Customer' },
      { label: 'Inward No', key: 'InwardNo' },
      { label: 'Outward No', key: 'StockOutwardNo' },
      { label: 'Gross Wt', key: 'GrossWt', type: 'number' },
      { label: 'Net Wt', key: 'NetWt', type: 'number' },
      { label: 'Status', key: 'QuickRepaireStatus' },
      { label: 'Repairing Type', key: 'RepairingTypeName' },
    ],
  },

  Report_MemoData: {
    title: (row) => row.StockDocumentNo || '—',
    subtitle: (row) => row.CustomerFullName || row.CustomerName || '',
    highlight: { label: 'Amount', key: 'Amount', type: 'money' },
    badge: (row) => (row.designno ? `Design: ${row.designno}` : null),
    summary: [
      { label: 'Records', key: 'icount' },
    ],
    fields: [
      { label: 'Date', key: 'EntryDate' },
      { label: 'Memo No', key: 'StockDocumentNo' },
      { label: 'SKU No', key: 'SKUNO' },
      { label: 'Tag No', key: 'StockBarcode' },
      { label: 'Design No', key: 'designno' },
      { label: 'Article No', key: 'ArticleMasterCode' },
      { label: 'User Code', key: 'CustomerName' },
      { label: 'User Name', key: 'CustomerFullName' },
      { label: 'Gross Wt', key: 'grosswt', type: 'number' },
      { label: 'Net Wt', key: 'netwt', type: 'number' },
      { label: 'Amount', key: 'Amount', type: 'money' },
    ],
  },
};

export default function ReportsTab({ customerId, customerInfo }) {
  const [selectedReport, setSelectedReport] = useState(null);

  if (selectedReport) {
    return (
      <ReportDetailView
        report={selectedReport}
        customerId={customerId}
        onBack={() => setSelectedReport(null)}
        customerInfo={customerInfo}
      />
    );
  }

  return <ReportsListView onSelect={setSelectedReport} />;
}

function ReportsListView({ onSelect }) {
  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
        <Box
          sx={{
            width: 32,
            height: 32,
            borderRadius: 1.5,
            bgcolor: ACCENT_SOFT,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <TrendingUp size={16} color={ACCENT} />
        </Box>
        <Typography sx={{ fontSize: 15, fontWeight: 700, color: '#1F2937' }}>
          Reports
        </Typography>
        <Chip
          label={`${REPORTS.length}`}
          size="small"
          sx={{
            bgcolor: ACCENT_SOFT,
            color: ACCENT,
            fontWeight: 600,
            fontSize: 11,
            height: 22,
            '& .MuiChip-label': { px: 1 },
          }}
        />
      </Box>

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
        {REPORTS.map((report) => {
          const Icon = report.icon;
          return (
            <Box
              key={report.key}
              onClick={() => onSelect(report)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') onSelect(report);
              }}
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1.5,
                p: 1.5,
                borderRadius: 2.5,
                bgcolor: '#fff',
                boxShadow: '0 1px 6px rgba(124,58,237,0.08)',
                border: '1px solid rgba(124,58,237,0.08)',
                cursor: 'pointer',
                transition: 'all 0.15s',
                '&:active': { transform: 'scale(0.98)' },
                '&:hover': { borderColor: 'rgba(124,58,237,0.3)' },
              }}
            >
              <Box
                sx={{
                  width: 40,
                  height: 40,
                  flexShrink: 0,
                  borderRadius: 2,
                  bgcolor: ACCENT_SOFT,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Icon size={19} color={ACCENT} />
              </Box>

              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Typography sx={{ fontSize: 13.5, fontWeight: 700, color: '#1F2937' }}>
                  {report.label}
                </Typography>
                <Typography
                  sx={{
                    fontSize: 11.5,
                    color: '#9CA3AF',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                >
                  {report.description}
                </Typography>
              </Box>

              <ChevronRight size={18} color="#C4B5FD" />
            </Box>
          );
        })}
      </Box>
    </Box>
  );
}

function ReportDetailView({ report, customerId, customerInfo, onBack }) {
  const [isLoading, setIsLoading] = useState(true);
  const [data, setData] = useState([]);
  const [error, setError] = useState(null);
  const [imgErrors, setImgErrors] = useState({});

  const fetchReport = useCallback(() => {
    setIsLoading(true);
    setError(null);

    const customerCode = customerInfo?.CustomerCode || '';

    const request =
      report.source === 'crm'
        ? CRMCustomerLog(report.key, customerId)
        : Reports(report.key, customerCode);

    request
      .then((response) => {
        if (response?.Status === '200' && Array.isArray(response?.Data?.rd)) {
          setData(response.Data.rd);
        } else {
          setData([]);
        }
      })
      .catch((err) => {
        console.error('API Error:', err);
        setError('Something went wrong while loading this report.');
        setData([]);
      })
      .finally(() => setIsLoading(false));
  }, [report, customerId, customerInfo]);

  useEffect(() => {
    fetchReport();
  }, [fetchReport]);

  const isCardView = report.view === 'cards';
  const fieldConfig = REPORT_FIELD_CONFIG[report.key];

  return (
    <Box
      sx={{
        position: 'fixed',
        inset: 0,
        zIndex: 1300,
        bgcolor: '#FAFAFB',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Header */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 1,
          px: 1.5,
          py: 1.25,
          bgcolor: '#fff',
          borderBottom: '1px solid #F0F0F2',
          flexShrink: 0,
        }}
      >
        <IconButton onClick={onBack} size="small" sx={{ color: '#1F2937' }}>
          <ArrowLeft size={20} />
        </IconButton>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography sx={{ fontSize: 14.5, fontWeight: 700, color: '#1F2937' }}>
            {report.label}
          </Typography>
          <Typography sx={{ fontSize: 11, color: '#9CA3AF' }}>
            {report.description}
          </Typography>
        </Box>
        {!isLoading && !error && (
          <Chip
            label={`${data.length} record${data.length === 1 ? '' : 's'}`}
            size="small"
            sx={{
              bgcolor: ACCENT_SOFT,
              color: ACCENT,
              fontWeight: 600,
              fontSize: 11,
              height: 22,
              '& .MuiChip-label': { px: 1 },
            }}
          />
        )}
      </Box>

      {/* Body */}
      <Box sx={{ flex: 1, overflow: 'auto', p: 1.5 }}>
        {isLoading && (
          <Box sx={{ py: 8, display: 'flex', justifyContent: 'center' }}>
            <CircularProgress size={28} sx={{ color: ACCENT }} />
          </Box>
        )}

        {!isLoading && error && <EmptyState title="Couldn't load report" subtitle={error} />}

        {!isLoading && !error && data.length === 0 && (
          <EmptyState
            title="No Data Available"
            subtitle={`No records found for ${report.label.toLowerCase()}.`}
          />
        )}

        {!isLoading && !error && data.length > 0 && isCardView && (
          <CardGrid data={data} imgErrors={imgErrors} setImgErrors={setImgErrors} />
        )}

        {!isLoading && !error && data.length > 0 && !isCardView && fieldConfig && (
          <ReportSummaryCardList data={data} config={fieldConfig} />
        )}

        {!isLoading && !error && data.length > 0 && !isCardView && !fieldConfig && (
          <DataTable data={data} />
        )}
      </Box>
    </Box>
  );
}

// ---------------------------------------------------------------------------
// Empty / error state
// ---------------------------------------------------------------------------
function EmptyState({ title, subtitle }) {
  return (
    <Box
      sx={{
        py: 8,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 1.5,
      }}
    >
      <Box
        sx={{
          width: 56,
          height: 56,
          borderRadius: '50%',
          bgcolor: ACCENT_SOFT,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Inbox size={26} color={ACCENT} />
      </Box>
      <Typography sx={{ fontSize: 14, fontWeight: 600, color: '#6B7280' }}>{title}</Typography>
      {subtitle && (
        <Typography sx={{ fontSize: 12, color: '#9CA3AF', textAlign: 'center', px: 3 }}>
          {subtitle}
        </Typography>
      )}
    </Box>
  );
}

// ---------------------------------------------------------------------------
// Card grid — used for image-driven reports (e.g. Design Wise Sale)
// ---------------------------------------------------------------------------
function CardGrid({ data, imgErrors, setImgErrors }) {
  const handleImgError = (index, defImage) => {
    setImgErrors((prev) => ({ ...prev, [index]: defImage }));
  };

  return (
    <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1.5 }}>
      {data.map((design, index) => (
        <Box
          key={index}
          sx={{
            bgcolor: '#fff',
            borderRadius: 2.5,
            overflow: 'hidden',
            boxShadow: '0 1px 6px rgba(124,58,237,0.08)',
            border: '1px solid rgba(124,58,237,0.08)',
            transition: 'all 0.15s',
            '&:active': { transform: 'scale(0.97)' },
          }}
        >
          <Box sx={{ position: 'relative', width: '100%', paddingTop: '100%', bgcolor: 'white' }}>
            <Box
              component="img"
              src={imgErrors[index] || design.ImagePath}
              alt={`Design ${design.DesignNo}`}
              onError={() => handleImgError(index, design.DefImage)}
              sx={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                objectFit: 'cover',
              }}
            />
          </Box>

          <Box sx={{ p: 1.25 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 0.75 }}>
              <Typography sx={{ fontSize: 13, fontWeight: 700, color: '#1F2937' }}>
                {design.DesignNo || '—'}
              </Typography>
              <Chip
                label={`×${design.SalesCnt ?? 0}`}
                size="small"
                sx={{
                  bgcolor: GREEN_SOFT,
                  color: GREEN,
                  fontWeight: 700,
                  fontSize: 10,
                  height: 20,
                  '& .MuiChip-label': { px: 0.8 },
                }}
              />
            </Box>

            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.4 }}>
              <Box>
                <Typography sx={{ fontSize: 9, color: '#9CA3AF', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Net Wt
                </Typography>
                <Typography sx={{ fontSize: 12, fontWeight: 600, color: '#374151' }}>
                  {design.DesignNetWt ?? '—'}
                </Typography>
              </Box>
              <Box sx={{ textAlign: 'right' }}>
                <Typography sx={{ fontSize: 9, color: '#9CA3AF', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Dia Wt
                </Typography>
                <Typography sx={{ fontSize: 12, fontWeight: 600, color: '#374151' }}>
                  {design.DiamondWt ?? '—'}
                </Typography>
              </Box>
            </Box>

            <Box sx={{ pt: 0.5 }}>
              <Typography sx={{ fontSize: 9, color: '#9CA3AF', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                CS Wt
              </Typography>
              <Typography sx={{ fontSize: 12, fontWeight: 600, color: '#374151' }}>
                {design.ColorstoneWt ?? '—'}
              </Typography>
            </Box>
          </Box>
        </Box>
      ))}
    </Box>
  );
}

// ---------------------------------------------------------------------------
// Config-driven summary + card list — used for Report_DueDate,
// Report_InvoiceWiseSale (and any future report added to REPORT_FIELD_CONFIG)
// ---------------------------------------------------------------------------
function ReportSummaryCardList({ data, config }) {
  const first = data[0] || {};

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.25 }}>
      {config.summary && (
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: `repeat(${config.summary.length}, 1fr)`,
            gap: 1,
            bgcolor: ACCENT,
            borderRadius: 2.5,
            p: 1.25,
          }}
        >
          {config.summary.map((s) => (
            <Box key={s.key} sx={{ textAlign: 'center' }}>
              <Typography sx={{ fontSize: 9.5, color: 'rgba(255,255,255,0.75)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                {s.label}
              </Typography>
              <Typography sx={{ fontSize: 13.5, fontWeight: 800, color: '#fff', whiteSpace: 'nowrap' }}>
                {formatValue(first[s.key], s.type)}
              </Typography>
            </Box>
          ))}
        </Box>
      )}

      {data.map((row, idx) =>
        config.layout === 'row' ? (
          <ReportRowCard key={idx} row={row} config={config} />
        ) : (
          <ReportCard key={idx} row={row} config={config} />
        )
      )}
    </Box>
  );
}


// ---------------------------------------------------------------------------
// Compact row-style card — used for reports with `layout: 'row'`
// (Report_Order, Report_RepairingStock, Report_MemoData). Shows the header
// same as ReportCard, but fields render as a dense 2-column key:value list
// with smaller rows and a divider — closer to a table row than a profile card.
// ---------------------------------------------------------------------------
function ReportRowCard({ row, config }) {
  const highlight = config.highlight;
  const badgeText = config.badge ? config.badge(row) : null;
  const highlightVal = highlight ? Number(row[highlight.key]) || 0 : null;
  const isNegativeAmt = highlight && highlightVal < 0;

  return (
    <Box
      sx={{
        bgcolor: '#fff',
        borderRadius: 2,
        boxShadow: '0 1px 4px rgba(124,58,237,0.06)',
        border: '1px solid rgba(124,58,237,0.08)',
        overflow: 'hidden',
      }}
    >
      {/* Header row */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 1,
          px: 1.25,
          py: 0.9,
          borderBottom: '1px solid #F3F4F6',
        }}
      >
        <Box sx={{ minWidth: 0, flex: 1 }}>
          <Typography sx={{ fontSize: 12.5, fontWeight: 700, color: '#1F2937', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {config.title(row)}
          </Typography>
          {config.subtitle(row) && (
            <Typography sx={{ fontSize: 10.5, color: '#9CA3AF', fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {config.subtitle(row)}
            </Typography>
          )}
        </Box>

        {badgeText && (
          <Chip
            label={badgeText}
            size="small"
            sx={{
              bgcolor: ACCENT_SOFT,
              color: ACCENT,
              fontWeight: 700,
              fontSize: 9.5,
              height: 19,
              flexShrink: 0,
              '& .MuiChip-label': { px: 0.7 },
            }}
          />
        )}

        {highlight && (
          <Box sx={{ textAlign: 'right', flexShrink: 0 }}>
            <Typography
              sx={{
                fontSize: 12.5,
                fontWeight: 800,
                color: isNegativeAmt ? RED : GREEN,
                whiteSpace: 'nowrap',
              }}
            >
              {formatValue(highlightVal, 'money')}
            </Typography>
          </Box>
        )}
      </Box>

      {/* Dense field list — 2 per line, compact rows, no boxy padding */}
      <Box sx={{ px: 1.25, py: 0.6 }}>
        {chunkPairs(config.fields).map((pair, i) => (
          <Box
            key={i}
            sx={{
              display: 'flex',
              py: 0.45,
              borderBottom: i < chunkPairs(config.fields).length - 1 ? '1px dashed #F3F4F6' : 'none',
            }}
          >
            {pair.map((f) => (
              <Box key={f.key} sx={{ flex: 1, display: 'flex', justifyContent: 'space-between', pr: 1, minWidth: 0 }}>
                <Typography sx={{ fontSize: 10.5, color: '#9CA3AF', fontWeight: 500, flexShrink: 0, mr: 0.5 }}>
                  {f.label}
                </Typography>
                <Typography
                  sx={{
                    fontSize: 11.5,
                    fontWeight: 600,
                    color: '#374151',
                    textAlign: 'right',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                >
                  {formatValue(row[f.key], f.type)}
                </Typography>
              </Box>
            ))}
          </Box>
        ))}
      </Box>
    </Box>
  );
}

// Groups a flat fields array into pairs of 2 for the dense 2-per-row layout
function chunkPairs(arr) {
  const out = [];
  for (let i = 0; i < arr.length; i += 2) {
    out.push(arr.slice(i, i + 2));
  }
  return out;
}

function ReportCard({ row, config }) {
  const highlight = config.highlight;
  const badgeText = config.badge ? config.badge(row) : null;
  const highlightVal = highlight ? Number(row[highlight.key]) || 0 : null;
  const isNegativeAmt = highlight && highlightVal < 0;

  return (
    <Box
      sx={{
        bgcolor: '#fff',
        borderRadius: 2.5,
        boxShadow: '0 1px 6px rgba(124,58,237,0.08)',
        border: '1px solid rgba(124,58,237,0.08)',
        overflow: 'hidden',
      }}
    >
      {/* Card header */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          gap: 1,
          px: 1.5,
          py: 1.1,
          bgcolor: ACCENT_SOFT,
        }}
      >
        <Box sx={{ minWidth: 0 }}>
          <Typography sx={{ fontSize: 13.5, fontWeight: 700, color: '#1F2937', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {config.title(row)}
          </Typography>
          {config.subtitle(row) && (
            <Typography sx={{ fontSize: 11, color: '#7C3AED', fontWeight: 600 }}>
              {config.subtitle(row)}
            </Typography>
          )}
        </Box>

        {highlight && (
          <Box sx={{ textAlign: 'right', flexShrink: 0 }}>
            <Typography sx={{ fontSize: 9, color: '#9CA3AF', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              {highlight.label}
            </Typography>
            <Typography
              sx={{
                fontSize: 13.5,
                fontWeight: 800,
                color: isNegativeAmt ? RED : GREEN,
              }}
            >
              {formatValue(highlightVal, 'money')}
            </Typography>
          </Box>
        )}
      </Box>

      {badgeText && (
        <Box sx={{ px: 1.5, pt: 1 }}>
          <Chip
            label={badgeText}
            size="small"
            sx={{
              bgcolor: RED_SOFT,
              color: RED,
              fontWeight: 700,
              fontSize: 10,
              height: 20,
              '& .MuiChip-label': { px: 0.8 },
            }}
          />
        </Box>
      )}

      {/* Field grid */}
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '2px',
          p: 1.5,
        }}
      >
        {config.fields.map((f) => (
          <Box key={f.key} sx={{ mb: 0.6 }}>
            <Typography sx={{ fontSize: 9, color: '#9CA3AF', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.03em' }}>
              {f.label}
            </Typography>
            <Typography sx={{ fontSize: 12.5, fontWeight: 600, color: '#374151', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {formatValue(row[f.key], f.type)}
            </Typography>
          </Box>
        ))}
      </Box>
    </Box>
  );
}

function formatValue(value, type) {
  if (value === null || value === undefined || value === '') return '—';
  if (type === 'money') {
    const n = Number(value) || 0;
    return `Amt ${n.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }
  if (type === 'number') {
    const n = Number(value);
    if (Number.isNaN(n)) return String(value);
    return Number.isInteger(n) ? n : n.toFixed(3);
  }
  return String(value);
}

// ---------------------------------------------------------------------------
// Generic fallback table — used for reports without a REPORT_FIELD_CONFIG entry
// ---------------------------------------------------------------------------
const HIDDEN_KEY_PATTERN = /^(id|srno|icount|imgrandomno|autocode)$/i;

function DataTable({ data }) {
  const allKeys = Object.keys(data[0] || {});
  const columns = allKeys.filter(
    (key) => !HIDDEN_KEY_PATTERN.test(key) && !IMAGE_KEYS.includes(key)
  );

  return (
    <Box
      sx={{
        bgcolor: '#fff',
        borderRadius: 2.5,
        border: '1px solid rgba(124,58,237,0.08)',
        boxShadow: '0 1px 6px rgba(124,58,237,0.08)',
        overflow: 'auto',
      }}
    >
      <Box component="table" sx={{ borderCollapse: 'collapse', width: '100%', minWidth: 640 }}>
        <Box component="thead">
          <Box component="tr" sx={{ bgcolor: ACCENT_SOFT }}>
            {columns.map((col) => (
              <Box
                key={col}
                component="th"
                sx={{
                  textAlign: 'left',
                  fontSize: 10.5,
                  fontWeight: 700,
                  color: ACCENT,
                  textTransform: 'uppercase',
                  letterSpacing: '0.04em',
                  px: 1.25,
                  py: 1,
                  whiteSpace: 'nowrap',
                  position: 'sticky',
                  top: 0,
                  bgcolor: ACCENT_SOFT,
                }}
              >
                {formatHeader(col)}
              </Box>
            ))}
          </Box>
        </Box>
        <Box component="tbody">
          {data.map((row, rIdx) => (
            <Box
              component="tr"
              key={rIdx}
              sx={{
                borderTop: '1px solid #F3F4F6',
                '&:hover': { bgcolor: '#FAFAFB' },
              }}
            >
              {columns.map((col) => (
                <Box
                  component="td"
                  key={col}
                  sx={{
                    fontSize: 12,
                    color: '#374151',
                    px: 1.25,
                    py: 0.9,
                    whiteSpace: 'nowrap',
                  }}
                >
                  {formatCell(row[col])}
                </Box>
              ))}
            </Box>
          ))}
        </Box>
      </Box>
    </Box>
  );
}

function formatHeader(key) {
  return key
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/_/g, ' ')
    .trim();
}

function formatCell(value) {
  if (value === null || value === undefined || value === '') return '—';
  if (typeof value === 'number') {
    return Number.isInteger(value) ? value : value.toFixed(2);
  }
  return String(value);
}