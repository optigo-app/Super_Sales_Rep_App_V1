"use client";
import React, { useEffect, useMemo, useState } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    IconButton,
    TextField,
    Typography,
    Box,
    Menu,
    MenuItem,
    CircularProgress,
    InputBase,
    Checkbox,
    FormControlLabel,
    Radio,
    RadioGroup,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import useMediaQuery from '@mui/material/useMediaQuery';
import {
    ArrowLeft, Building2, ChevronDown, Mail, MessageCircle,
    Search, Send, User, UserPlus, Users, X,
} from 'lucide-react';

import { CommonAPImain } from '@/Utils/API/CommonAPImain/CommonAPImain';
import { useToast } from '@mc/context/ToastContext';
import { getAuthData } from '@mc/utils/globalFunc';
import {
    getProCatDomainsApi,
    proAlbumCustomerDetailApi,
    proAlbumSendNewCustomerApi,
} from '@mc/app/api/albumApi';

const normalize = (val) =>
    (val || '').toString().toLowerCase().replace(/[^a-z0-9]/g, '');

const EMPTY_FORM = {
    firstName: '',
    lastName: '',
    city: '',
    companyName: '',
    mobile: '',
    email: '',
    companyTypeId: '',
    companyTypeName: '',
    InHelloApp: 1,
};

const optionCardSx = {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 1,
    py: 3,
    px: 1.5,
    borderRadius: 3,
    border: '1.5px solid rgba(115,103,240,0.2)',
    bgcolor: '#fff',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    '&:hover': { borderColor: 'primary.main', bgcolor: 'rgba(115,103,240,0.05)', transform: 'translateY(-2px)' },
    '&:active': { transform: 'scale(0.97)' },
};

const getDomainName = (row) =>
    row?.Domain || row?.DomainName || row?.ProCatDomain || row?.domainname ||
    Object.values(row || {}).find((v) => typeof v === 'string' && v.trim()) || '';

const getLoginId = () => {
    const auth = getAuthData() || {};
    return auth.LoginId || auth.loginuserid || auth.LoginUserId || auth.userid || '4';
};

// Catalog-share style flow: pick New / Existing customer → send options
// (domain + access window + email/whatsapp flags) → ProAlbum_CustomerDetail_Save
const SendAlbumDialog = ({ open, onClose, album }) => {
    const theme = useTheme();
    const fullScreen = useMediaQuery(theme.breakpoints.down('sm'));
    const { showSuccess, showError } = useToast();

    const [step, setStep] = useState('choose'); // choose | existing | new | options
    const [sending, setSending] = useState(false);

    // Existing customer
    const [customers, setCustomers] = useState([]);
    const [customersLoading, setCustomersLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCustomer, setSelectedCustomer] = useState(null);

    // New customer
    const [formData, setFormData] = useState(EMPTY_FORM);
    const [errors, setErrors] = useState({});
    const [companyTypes, setCompanyTypes] = useState([]);
    const [typeAnchor, setTypeAnchor] = useState(null);

    // Send options — domain + access window + channel flags
    const [domains, setDomains] = useState([]);
    const [domainsLoading, setDomainsLoading] = useState(false);
    const [domainAnchor, setDomainAnchor] = useState(null);
    const [domain, setDomain] = useState('');
    const [accessValue, setAccessValue] = useState('1');
    const [accessUnit, setAccessUnit] = useState('Days');
    const [sendEmail, setSendEmail] = useState(true);
    const [sendWhatsApp, setSendWhatsApp] = useState(true);

    // Whom the send applies to — filled by the previous step
    const [sendTarget, setSendTarget] = useState(null); // { userId, customerId, label }

    // Reset whenever the dialog opens for a new album
    useEffect(() => {
        if (open) {
            setStep('choose');
            setSearchTerm('');
            setSelectedCustomer(null);
            setFormData(EMPTY_FORM);
            setErrors({});
            setSendTarget(null);
            setDomain('');
            setAccessValue('1');
            setAccessUnit('Days');
            setSendEmail(true);
            setSendWhatsApp(true);
            setSending(false);
        }
    }, [open, album?.id]);

    const loadCustomers = () => {
        setCustomersLoading(true);
        CommonAPImain('GetCustomerList')
            .then((response) => {
                if (response?.Status === '200') setCustomers(response?.Data?.rd || []);
            })
            .catch(() => showError('Failed to load customers'))
            .finally(() => setCustomersLoading(false));
    };

    const loadCompanyTypes = () => {
        CommonAPImain('GetCompanyType')
            .then((response) => {
                if (response?.Data?.rd) setCompanyTypes(response.Data.rd);
            })
            .catch(() => {});
    };

    const loadDomains = () => {
        setDomainsLoading(true);
        getProCatDomainsApi()
            .then((data) => {
                const list = (data?.rd || []).map(getDomainName).filter(Boolean);
                setDomains(list);
                if (list.length) setDomain((prev) => prev || list[0]);
            })
            .catch((err) => {
                console.error('GetProCatDomain Error:', err);
                showError('Failed to load domains');
            })
            .finally(() => setDomainsLoading(false));
    };

    const goTo = (next) => {
        setStep(next);
        if (next === 'existing' && customers.length === 0) loadCustomers();
        if (next === 'new' && companyTypes.length === 0) loadCompanyTypes();
        if (next === 'options' && domains.length === 0) loadDomains();
    };

    const filteredCustomers = useMemo(() => {
        const q = normalize(searchTerm);
        if (!q) return customers;
        return customers.filter((c) =>
            ['UserId', 'CustomerCode', 'FLname', 'Firmname', 'Firstname', 'Lastname', 'mobileno', 'TypoLabel', 'email1', 'Email']
                .some((key) => normalize(c[key]).includes(q))
        );
    }, [customers, searchTerm]);

    // Existing customer picked → move to send options
    const handleExistingNext = () => {
        if (!selectedCustomer) return;
        const userId = selectedCustomer.UserId || selectedCustomer.email1 || selectedCustomer.Email || '';
        setSendTarget({
            userId,
            customerId: selectedCustomer.CustomerId,
            label: selectedCustomer.TypoLabel || selectedCustomer.Firmname ||
                `${selectedCustomer.Firstname ?? ''} ${selectedCustomer.Lastname ?? ''}`.trim() || userId,
        });
        goTo('options');
    };

    // New customer → create, then send options keyed by the email entered
    const handleSubmitNew = async () => {
        const errs = {
            firstName: formData.firstName ? '' : 'First Name is required',
            lastName: formData.lastName ? '' : 'Last Name is required',
            mobile: formData.mobile ? '' : 'Mobile Number is required',
            email: formData.email ? '' : 'Email Id is required',
        };
        setErrors(errs);
        if (Object.values(errs).some(Boolean) || sending) return;
        setSending(true);
        try {
            const res = await proAlbumSendNewCustomerApi(album.id, formData);
            const row = res?.rd?.[0] || {};
            const msg = row.Msg ?? row.MSG ?? row.message;
            if (msg === 'mobileexists') {
                showError('Mobile number already exists');
                return;
            }
            setSendTarget({
                userId: formData.email,
                customerId: row.CustomerId || row.customerid || row.id || '',
                label: `${formData.firstName} ${formData.lastName}`.trim() || formData.email,
            });
            goTo('options');
        } catch (err) {
            console.error('ProAlbum_Send_NewCustomer Error:', err);
            showError('Failed to add customer');
        } finally {
            setSending(false);
        }
    };

    // Final send → SubMode "" then SubMode "MailFlag" when email is checked
    const handleFinalSend = async () => {
        if (!sendTarget || sending) return;
        setSending(true);
        try {
            const res = await proAlbumCustomerDetailApi({
                SubMode: '',
                Article_AlbumMasterid: String(album.id),
                UserIdList: `,${sendTarget.userId}`,
                RandomNo: '0',
                ALBidList: '',
                LoginId: String(getLoginId()),
                ProAlbumDomain: domain,
                AccessValue: String(accessValue || '1'),
                AccessUnit: accessUnit,
            });
            const row = res?.rd?.[0] || {};
            const msg = row.MSG ?? row.Msg ?? row.message;
            if (msg && String(msg).toLowerCase() !== 'success') throw new Error(String(msg));
            const randomNo = row.RandomNo || row.randomno || row.Randomno || '0';

            if (sendEmail && sendTarget.customerId) {
                await proAlbumCustomerDetailApi({
                    SubMode: 'MailFlag',
                    Article_AlbumMasterid: String(album.id),
                    UserIdList: `,${sendTarget.customerId}`,
                    RandomNo: String(randomNo),
                    ALBidList: '',
                    LoginId: String(getLoginId()),
                });
            }
            showSuccess(`"${album.albumName}" sent successfully`);
            onClose();
        } catch (err) {
            console.error('ProAlbum_CustomerDetail_Save Error:', err);
            showError(err?.message || 'Failed to send album');
        } finally {
            setSending(false);
        }
    };

    const setField = (name) => (e) => {
        const value = e.target.value;
        setFormData((p) => ({ ...p, [name]: value }));
        if (value) setErrors((p) => ({ ...p, [name]: '' }));
    };

    const setMobile = (e) => {
        const digits = e.target.value.replace(/\D/g, '').slice(0, 10);
        const formatted = digits.replace(/(\d{3})(\d{3})(\d{0,4})/, (_, a, b, c) =>
            [a, b, c].filter(Boolean).join('-'));
        setFormData((p) => ({ ...p, mobile: formatted }));
        if (digits) setErrors((p) => ({ ...p, mobile: '' }));
    };

    const stepTitle =
        step === 'choose' ? 'Send to Customers'
            : step === 'existing' ? 'Existing Customer'
            : step === 'new' ? 'New Customer'
            : 'Send Options';

    return (
        <Dialog
            open={open}
            onClose={sending ? undefined : onClose}
            fullScreen={fullScreen}
            fullWidth
            maxWidth="sm"
            PaperProps={{ sx: { borderRadius: { xs: 0, sm: 3 } } }}
        >
            <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1, py: 1.5 }}>
                {step !== 'choose' ? (
                    <IconButton
                        size="small"
                        onClick={() => setStep(step === 'options' ? (sendTarget?.customerId ? 'existing' : 'new') : 'choose')}
                        disabled={sending}
                        sx={{ mr: -0.5 }}
                    >
                        <ArrowLeft size={18} />
                    </IconButton>
                ) : (
                    <Send size={18} color="#7367f0" />
                )}
                <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography fontWeight={700} fontSize="1rem">{stepTitle}</Typography>
                    <Typography
                        fontSize="0.7rem"
                        color="text.secondary"
                        sx={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                    >
                        {album?.albumName}
                    </Typography>
                </Box>
                <IconButton size="small" onClick={onClose} disabled={sending}>
                    <X size={18} />
                </IconButton>
            </DialogTitle>

            <DialogContent dividers sx={{ px: 2, py: 2 }}>
                {/* Step 1 — choose customer type */}
                {step === 'choose' && (
                    <Box sx={{ display: 'flex', gap: 1.5, py: 1 }}>
                        <Box onClick={() => goTo('existing')} sx={optionCardSx}>
                            <Box sx={{ width: 48, height: 48, borderRadius: '50%', bgcolor: 'rgba(115,103,240,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'primary.main' }}>
                                <Users size={22} />
                            </Box>
                            <Typography fontWeight={700} fontSize="0.85rem">Existing Customer</Typography>
                            <Typography fontSize="0.68rem" color="text.secondary" align="center">
                                Pick from your customer list
                            </Typography>
                        </Box>
                        <Box onClick={() => goTo('new')} sx={optionCardSx}>
                            <Box sx={{ width: 48, height: 48, borderRadius: '50%', bgcolor: 'rgba(15,157,119,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#0f9d77' }}>
                                <UserPlus size={22} />
                            </Box>
                            <Typography fontWeight={700} fontSize="0.85rem">New Customer</Typography>
                            <Typography fontSize="0.68rem" color="text.secondary" align="center">
                                Create and send in one step
                            </Typography>
                        </Box>
                    </Box>
                )}

                {/* Step 2a — search + pick an existing customer */}
                {step === 'existing' && (
                    <Box>
                        <Box sx={{
                            display: 'flex', alignItems: 'center', gap: 1,
                            border: '1.5px solid #E5E7EB', borderRadius: 3, px: 1.5, py: 0.5,
                            '&:focus-within': { borderColor: 'primary.main' },
                        }}>
                            <Search size={16} color="#9CA3AF" />
                            <InputBase
                                fullWidth
                                autoFocus
                                placeholder="Search customer..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                sx={{ fontSize: '0.85rem', py: 0.5 }}
                            />
                            {searchTerm && (
                                <IconButton size="small" onClick={() => setSearchTerm('')} sx={{ p: 0.25 }}>
                                    <X size={14} />
                                </IconButton>
                            )}
                        </Box>

                        {selectedCustomer && (
                            <Box sx={{
                                mt: 1.5, p: 1.25, borderRadius: 2,
                                bgcolor: 'rgba(115,103,240,0.07)', border: '1px solid rgba(115,103,240,0.3)',
                                display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1,
                            }}>
                                <Box sx={{ minWidth: 0 }}>
                                    <Typography fontSize="0.85rem" fontWeight={700}>
                                        {selectedCustomer.Firstname} {selectedCustomer.Lastname}
                                        {selectedCustomer.CustomerCode ? ` (${selectedCustomer.CustomerCode})` : ''}
                                    </Typography>
                                    <Typography fontSize="0.7rem" color="text.secondary">
                                        {[selectedCustomer.Firmname, selectedCustomer.mobileno].filter(Boolean).join(' · ')}
                                    </Typography>
                                </Box>
                                <IconButton size="small" onClick={() => setSelectedCustomer(null)}>
                                    <X size={15} />
                                </IconButton>
                            </Box>
                        )}

                        <Box sx={{ mt: 1.5, maxHeight: 320, overflow: 'auto', display: 'flex', flexDirection: 'column', gap: 0.75 }}>
                            {customersLoading ? (
                                <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                                    <CircularProgress size={26} />
                                </Box>
                            ) : filteredCustomers.length === 0 ? (
                                <Typography align="center" fontSize="0.8rem" color="text.secondary" sx={{ py: 4 }}>
                                    {customers.length === 0 ? 'No customers found' : `No matches for "${searchTerm}"`}
                                </Typography>
                            ) : (
                                filteredCustomers.map((customer) => {
                                    const isSelected = selectedCustomer?.CustomerId === customer.CustomerId;
                                    return (
                                        <Box
                                            key={customer.CustomerId}
                                            onClick={() => setSelectedCustomer(customer)}
                                            sx={{
                                                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                                p: 1.25, borderRadius: 1.5, cursor: 'pointer',
                                                border: isSelected ? '1.5px solid rgba(115,103,240,0.5)' : '1px solid #E5E7EB',
                                                bgcolor: isSelected ? 'rgba(115,103,240,0.06)' : '#fff',
                                                transition: 'all 0.15s',
                                                '&:hover': { bgcolor: '#F8F7FF' },
                                                '&:active': { transform: 'scale(0.98)' },
                                            }}
                                        >
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, minWidth: 0 }}>
                                                <Box sx={{ width: 30, height: 30, borderRadius: '50%', bgcolor: 'rgba(115,103,240,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'primary.main', flexShrink: 0 }}>
                                                    <User size={15} />
                                                </Box>
                                                <Box sx={{ minWidth: 0 }}>
                                                    <Typography fontSize="0.83rem" fontWeight={600} noWrap>
                                                        {customer.TypoLabel || customer.Firmname || `${customer.Firstname ?? ''} ${customer.Lastname ?? ''}`}
                                                    </Typography>
                                                    {customer.mobileno && (
                                                        <Typography fontSize="0.68rem" color="text.secondary">{customer.mobileno}</Typography>
                                                    )}
                                                </Box>
                                            </Box>
                                            <Typography fontSize="0.72rem" fontWeight={600} color={isSelected ? 'success.main' : 'primary.main'} sx={{ flexShrink: 0, ml: 1 }}>
                                                {isSelected ? 'Selected' : 'Select'}
                                            </Typography>
                                        </Box>
                                    );
                                })
                            )}
                        </Box>
                    </Box>
                )}

                {/* Step 2b — new customer form */}
                {step === 'new' && (
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                        <Box sx={{ display: 'flex', gap: 1.5 }}>
                            <TextField fullWidth size="small" label="First Name" required value={formData.firstName} onChange={setField('firstName')} error={Boolean(errors.firstName)} helperText={errors.firstName} />
                            <TextField fullWidth size="small" label="Last Name" required value={formData.lastName} onChange={setField('lastName')} error={Boolean(errors.lastName)} helperText={errors.lastName} />
                        </Box>
                        <TextField fullWidth size="small" label="Mobile" required value={formData.mobile} onChange={setMobile} error={Boolean(errors.mobile)} helperText={errors.mobile} inputProps={{ type: 'tel', maxLength: 12 }} />
                        <TextField fullWidth size="small" label="Email" required type="email" value={formData.email} onChange={setField('email')} error={Boolean(errors.email)} helperText={errors.email} />
                        <Box sx={{ display: 'flex', gap: 1.5 }}>
                            <TextField fullWidth size="small" label="City" value={formData.city} onChange={setField('city')} />
                            <TextField fullWidth size="small" label="Company Name" value={formData.companyName} onChange={setField('companyName')} />
                        </Box>
                        <TextField
                            fullWidth
                            size="small"
                            label="Company Type"
                            value={formData.companyTypeName || ''}
                            onClick={(e) => setTypeAnchor(e.currentTarget)}
                            InputProps={{
                                readOnly: true,
                                startAdornment: <Building2 size={15} color="#9CA3AF" style={{ marginRight: 8 }} />,
                            }}
                        />
                        <Menu
                            anchorEl={typeAnchor}
                            open={Boolean(typeAnchor)}
                            onClose={() => setTypeAnchor(null)}
                            PaperProps={{ style: { maxHeight: 280, minWidth: 220 } }}
                        >
                            {companyTypes.map((ct) => (
                                <MenuItem
                                    key={ct.CompanyTypeId}
                                    onClick={() => {
                                        setFormData((p) => ({ ...p, companyTypeId: ct.CompanyTypeId, companyTypeName: ct.CompanyTypeName }));
                                        setTypeAnchor(null);
                                    }}
                                >
                                    {ct.CompanyTypeName}
                                </MenuItem>
                            ))}
                        </Menu>
                    </Box>
                )}

                {/* Step 3 — send options: domain + access window + channels */}
                {step === 'options' && (
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                        {sendTarget?.label && (
                            <Box sx={{
                                p: 1.25, borderRadius: 2,
                                bgcolor: 'rgba(115,103,240,0.07)', border: '1px solid rgba(115,103,240,0.25)',
                            }}>
                                <Typography fontSize="0.68rem" color="text.secondary">Sending to</Typography>
                                <Typography fontSize="0.85rem" fontWeight={700}>{sendTarget.label}</Typography>
                            </Box>
                        )}

                        {/* Domain dropdown */}
                        <Box>
                            <Typography fontSize="0.72rem" fontWeight={600} color="text.secondary" sx={{ mb: 0.5 }}>
                                Domain *
                            </Typography>
                            <Box
                                onClick={(e) => !domainsLoading && setDomainAnchor(e.currentTarget)}
                                sx={{
                                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                    border: '1.5px solid #E5E7EB', borderRadius: 2, px: 1.5, py: 1.1,
                                    cursor: 'pointer', bgcolor: '#fff',
                                    '&:hover': { borderColor: 'primary.main' },
                                }}
                            >
                                {domainsLoading ? (
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                        <CircularProgress size={14} />
                                        <Typography fontSize="0.85rem" color="text.secondary">Loading domains...</Typography>
                                    </Box>
                                ) : (
                                    <Typography fontSize="0.85rem" fontWeight={600} color={domain ? 'text.primary' : 'text.secondary'}>
                                        {domain || 'Select domain'}
                                    </Typography>
                                )}
                                <ChevronDown size={16} color="#9CA3AF" />
                            </Box>
                            <Menu
                                anchorEl={domainAnchor}
                                open={Boolean(domainAnchor)}
                                onClose={() => setDomainAnchor(null)}
                                PaperProps={{ style: { maxHeight: 240, minWidth: 220 } }}
                            >
                                {domains.length === 0 ? (
                                    <MenuItem disabled>No domains</MenuItem>
                                ) : domains.map((d) => (
                                    <MenuItem key={d} onClick={() => { setDomain(d); setDomainAnchor(null); }}>
                                        {d}
                                    </MenuItem>
                                ))}
                            </Menu>
                        </Box>

                        {/* Access Upto */}
                        <Box>
                            <Typography fontSize="0.72rem" fontWeight={600} color="text.secondary" sx={{ mb: 0.5 }}>
                                Access Upto *
                            </Typography>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap' }}>
                                <TextField
                                    type="number"
                                    size="small"
                                    value={accessValue}
                                    onChange={(e) => setAccessValue(e.target.value.replace(/\D/g, '').slice(0, 3) || '0')}
                                    inputProps={{ min: 0, inputMode: 'numeric' }}
                                    sx={{ width: 90 }}
                                />
                                <RadioGroup
                                    row
                                    value={accessUnit}
                                    onChange={(e) => setAccessUnit(e.target.value)}
                                >
                                    {['Weeks', 'Days', 'Hours'].map((unit) => (
                                        <FormControlLabel
                                            key={unit}
                                            value={unit}
                                            control={<Radio size="small" />}
                                            label={<Typography fontSize="0.8rem">{unit}</Typography>}
                                            sx={{ mr: 0.5 }}
                                        />
                                    ))}
                                </RadioGroup>
                            </Box>
                        </Box>

                        {/* Channels */}
                        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                            <FormControlLabel
                                control={
                                    <Checkbox
                                        size="small"
                                        checked={sendEmail}
                                        onChange={(e) => setSendEmail(e.target.checked)}
                                    />
                                }
                                label={
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                        <Mail size={14} color="#7367f0" />
                                        <Typography fontSize="0.82rem" fontWeight={600}>Send Email</Typography>
                                    </Box>
                                }
                            />
                            <FormControlLabel
                                control={
                                    <Checkbox
                                        size="small"
                                        checked={sendWhatsApp}
                                        onChange={(e) => setSendWhatsApp(e.target.checked)}
                                    />
                                }
                                label={
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                        <MessageCircle size={14} color="#0f9d77" />
                                        <Typography fontSize="0.82rem" fontWeight={600}>Send WhatsApp</Typography>
                                    </Box>
                                }
                            />
                        </Box>
                    </Box>
                )}
            </DialogContent>

            {step !== 'choose' && (
                <DialogActions sx={{ px: 2, py: 1.5 }}>
                    <Button onClick={onClose} disabled={sending} sx={{ textTransform: 'none' }}>
                        Cancel
                    </Button>
                    <Button
                        variant="contained"
                        disabled={
                            sending ||
                            (step === 'existing' && !selectedCustomer) ||
                            (step === 'options' && !domain)
                        }
                        startIcon={sending ? <CircularProgress size={14} color="inherit" /> : <Send size={14} />}
                        onClick={
                            step === 'existing' ? handleExistingNext
                                : step === 'new' ? handleSubmitNew
                                : handleFinalSend
                        }
                        sx={{
                            textTransform: 'none', fontWeight: 600, borderRadius: 2,
                            background: 'linear-gradient(135deg, #7367f0 0%, #5f5bd6 100%)',
                        }}
                    >
                        {sending
                            ? (step === 'options' ? 'Sending...' : 'Saving...')
                            : (step === 'options' ? 'Send' : 'Next')}
                    </Button>
                </DialogActions>
            )}
        </Dialog>
    );
};

export default SendAlbumDialog;
