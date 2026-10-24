import { getAuthData } from '@mc/utils/globalFunc';
import { masterApi } from './masterApi';

/**
 * Fetches AI search token details (total and used) for the current user.
 *
 * @returns {Promise<{totalToken: number, tokenUsed: number} | null>}
 */
export const getTokenDetailsApi = async () => {
    try {
        const response = await masterApi('getTokenDetails', {
            p: '',
            f: 'airis (getTokenDetails)',
        });

        const rd = response?.rd;
        // rd missing/not an array → the call itself failed (worth retrying)
        if (!Array.isArray(rd)) return null;
        // Successful response with empty rd → user has no token plan;
        // that's a valid terminal state, not an error
        if (rd.length === 0) return { totalToken: 0, tokenUsed: 0 };
        return {
            totalToken: rd[0].TotalToken ?? 0,
            tokenUsed: rd[0].TokenUsed ?? 0,
        };
    } catch (error) {
        console.error('Error fetching token details:', error);
        return null;
    }
};
