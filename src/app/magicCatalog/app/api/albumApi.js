import { masterApi } from './masterApi';
import { CommonAPI } from '@/Utils/API/CommonAPI/CommonAPI';
import { getAuthData, getClientIpAddress } from '@mc/utils/globalFunc';

export const getAlbumByIdApi = async (albumId, { signal } = {}) => {
    return masterApi('getAlbumById', {
        p: JSON.stringify({ AlbumId: albumId }),
        f: "Task Management (taskmaster)",
        signal,
    });
};

// ProAlbum_* modes go through the shared CommonAPI with the raw {con, p, f} body
export const callAlbumApi = async (mode, p = '{}', f = mode, formName) => {
    const auth = getAuthData();
    const ipAddress = await getClientIpAddress();
    const con = {
        id: "",
        mode,
        y: "",
        appuserid: auth?.uid || "",
        IPAddress: ipAddress,
        ...(formName ? { FormName: formName } : {}),
    };
    const res = await CommonAPI({ con: JSON.stringify(con), p, f });
    return res?.Data;
};

export const getProAlbumListApi = () =>
    callAlbumApi('ProAlbum_List', '{}', 'ProAlbum_List');

const PRO_ALBUM_FORM = 'Ajax_ProAlbumManagement_ViewAlbum.aspx (Salescrm)';

// ProAlbum_Action — soft delete (del), restore (reactive), hard delete
// (harddel) and rename/date (edit) all share one mode + body shape
export const proAlbumActionApi = (p) =>
    callAlbumApi('ProAlbum_Action', JSON.stringify(p), 'ProAlbum_Save', PRO_ALBUM_FORM);

// Permanent delete — after ProAlbum_Action harddel the album is also
// moved to the archive (note the ...Management... key, differs from Action)
export const proAlbumMoveToArchiveApi = (albumId) =>
    callAlbumApi(
        'ProAlbum_MoveToArchive',
        JSON.stringify({ Article_AlbumManagement_AlbumMasterid: String(albumId) }),
        'ProAlbum_Save',
        PRO_ALBUM_FORM
    );

// Enable / disable albums on web — accepts one or comma-joined ids
export const proAlbumSentOnApi = (ids, action) =>
    callAlbumApi(
        'ProAlbum_SentOnAPI',
        JSON.stringify({ Article_AlbumMasterids: Array.isArray(ids) ? ids.join(',') : String(ids), action }),
        'ProAlbum_Save',
        PRO_ALBUM_FORM
    );

// Album design view — designs saved inside an album
export const getAlbumDesignViewApi = (albumId) =>
    callAlbumApi(
        'ProAlbum_AlbumDesignView',
        JSON.stringify({ Article_AlbumMasterid: String(albumId), albumcode: "", CustId: "0", ForMode: "" }),
        'ProAlbum_CreateByAlbumid',
        PRO_ALBUM_FORM
    );

// ProAlbum_CustomerDetail_Save — shared mode for send sub-actions:
// SubMode "GetProCatDomain" → domain list; "" → the actual send; "MailFlag" → email flag
export const proAlbumCustomerDetailApi = (p) =>
    callAlbumApi('ProAlbum_CustomerDetail_Save', JSON.stringify(p), 'ProAlbum_Save', PRO_ALBUM_FORM);

export const getProCatDomainsApi = () =>
    proAlbumCustomerDetailApi({ SubMode: 'GetProCatDomain' });

// Sent-albums list — which customers each album was sent to
export const getProAlbumSentListApi = () =>
    callAlbumApi('ProAlbum_CustomerEmailBind_List', '{}', 'ProAlbum_Save', PRO_ALBUM_FORM);

// Send an album while creating a new customer
export const proAlbumSendNewCustomerApi = (albumId, customer) =>
    callAlbumApi(
        'ProAlbum_Send_NewCustomer',
        JSON.stringify({
            Article_AlbumMasterid: String(albumId),
            FName: customer.firstName ?? "",
            LName: customer.lastName ?? "",
            City: customer.city ?? "",
            Company: customer.companyName ?? "",
            Mobile: customer.mobile ?? "",
            Email: customer.email ?? "",
            CompanyTypeId: String(customer.companyTypeId ?? ""),
            CompanyTypeName: customer.companyTypeName ?? "",
            InHelloApp: String(customer.InHelloApp ?? 1),
        }),
        'ProAlbum_Save',
        PRO_ALBUM_FORM
    );
