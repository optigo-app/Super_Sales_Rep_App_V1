import { masterApi } from './masterApi';

// Same endpoint as design collection — EventName "stockbook" returns stock data.
export const stockCollectionApi = async ({ signal } = {}) => {
    return masterApi('getdesigncollection', {
        p: JSON.stringify({ EventName: "stockbook" }),
        signal,
    });
};
