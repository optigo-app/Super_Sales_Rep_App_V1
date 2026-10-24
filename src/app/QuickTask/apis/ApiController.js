class QuickTaskApi {
    static BASE_URL = 'http://nextjstest.web/api/report';

    static VERSION_NO = null;
    static SV = null;
    static SP = null;
    static APP_USER_ID = null;
    static YEAR_CODE = null;
    static isInitialized = false;

    static initialize() {
        const raw  = sessionStorage.getItem('dashboardData');
        const data = raw ? JSON.parse(raw) : null;

        QuickTaskApi.YEAR_CODE   = sessionStorage.getItem('yearCode');
        QuickTaskApi.SV          = sessionStorage.getItem('SV');
        QuickTaskApi.APP_USER_ID = data?.userData?.rd?.[0]?.UserID ?? null;
        QuickTaskApi.SP          = '13';
        QuickTaskApi.VERSION_NO  = 'v1';
        QuickTaskApi.isInitialized = true;

        console.log('QuickTaskApi initialized:', {
            yearCode:  QuickTaskApi.YEAR_CODE,
            sv:        QuickTaskApi.SV,
            sp:        QuickTaskApi.SP,
            appUserId: QuickTaskApi.APP_USER_ID,
            version:   QuickTaskApi.VERSION_NO,
        });

        return {
            yearCode:  QuickTaskApi.YEAR_CODE,
            sv:        QuickTaskApi.SV,
            sp:        QuickTaskApi.SP,
            appUserId: QuickTaskApi.APP_USER_ID,
            version:   QuickTaskApi.VERSION_NO,
        };
    }

    static getHeaders() {
        if (!QuickTaskApi.isInitialized) {
            throw new Error('QuickTaskApi not initialized. Call initialize() first.');
        }
        return {
            'Content-Type': 'application/json',
            YearCode: QuickTaskApi.YEAR_CODE,
            version:  QuickTaskApi.VERSION_NO,
            sv:       QuickTaskApi.SV,
            sp:       QuickTaskApi.SP,
        };
    }

    static async requestToApi({ mode, params, functionName }) {
        const body = {
            con: JSON.stringify({ id: '', mode, appuserid: QuickTaskApi.APP_USER_ID }),
            p:   JSON.stringify(params),
            f:   `Quicktask (${functionName})`,
        };

        const response = await fetch(QuickTaskApi.BASE_URL, {
            method:  'POST',
            headers: QuickTaskApi.getHeaders(),
            body:    JSON.stringify(body),
        });

        const data = await response.json();
        if (!response.ok) throw new Error(data.message || `Failed to ${functionName}`);
        return data;
    }

    static async getToken(userId) {
        return QuickTaskApi.requestToApi({
            mode: 'gettoken',
            params: { appuserid: userId },
            functionName: 'gettoken',
        });
    }

    static async createQuickTask({ title, userId }) {
        return QuickTaskApi.requestToApi({
            mode: 'add_task',
            params: { Title: title, UserId: userId },
            functionName: 'create',
        });
    }

    static async listQuickTask({ userId, sortField = 'EntryDate', sortType = 'DESC', searchTerm }) {
        return QuickTaskApi.requestToApi({
            mode: 'list_task',
            params: { UserId: userId, SortField: sortField, SortType: sortType, SearchTerm: searchTerm },
            functionName: 'list',
        });
    }

    static async updateQuickTask({ taskId, title, description, dueDate, status, priority, assignedTo, designationId }) {
        return QuickTaskApi.requestToApi({
            mode: 'update_task',
            params: { TaskId: taskId, Title: title, Description: description, DueDate: dueDate, Status: status, Priority: priority, AssignedTo: assignedTo, DesignationId: designationId },
            functionName: 'update',
        });
    }

    static async deleteQuickTask({ taskId }) {
        return QuickTaskApi.requestToApi({
            mode: 'delete_task',
            params: { TaskId: taskId },
            functionName: 'delete',
        });
    }

    static async getDesignationList() {
        return QuickTaskApi.requestToApi({
            mode: 'designation_list',
            params: {},
            functionName: 'designation list',
        });
    }

    static async getEmployeeList({ userId }) {
        return QuickTaskApi.requestToApi({
            mode: 'employee_list',
            params: { UserId: userId },
            functionName: 'employee list',
        });
    }
}

export default QuickTaskApi;