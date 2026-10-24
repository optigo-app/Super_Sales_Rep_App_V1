import { masterApi } from './masterApi';

export const getAlbumByIdApi = async (albumId, { signal } = {}) => {
    return masterApi('getAlbumById', {
        p: JSON.stringify({ AlbumId: albumId }),
        f: "Task Management (taskmaster)",
        signal,
    });
};
