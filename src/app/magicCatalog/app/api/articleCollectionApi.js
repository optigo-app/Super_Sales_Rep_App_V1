import { masterApi } from './masterApi';

// Article catalog — same endpoint as design/stock, EventName "article"
// returns the article-level catalog rows.
export const articleCatalogApi = async ({ signal } = {}) => {
    return masterApi('getdesigncollection', {
        p: JSON.stringify({ EventName: "article" }),
        signal,
    });
};

// Article rows for a single design — used by the article drawer.
// Response shape: { rd: [{ autocode, DesignNo, ArticleNo, metaltypename,
// metalcolorname, diamondclarityname, diamondcolorname, csqualityname,
// cscolorname, _findingtypename }] }
export const getDesignArticlesApi = async (designNo, { signal } = {}) => {
    return masterApi('getarticle', {
        p: JSON.stringify({ DesignNo: designNo }),
        signal,
    });
};
