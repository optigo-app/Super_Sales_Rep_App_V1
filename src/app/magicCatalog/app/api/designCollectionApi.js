import { masterApi } from './masterApi';

export const designCollectionApi = async ({ signal } = {}) => {
    return masterApi('getdesigncollection', { signal });
};