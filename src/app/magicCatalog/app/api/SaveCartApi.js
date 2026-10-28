import { masterApi } from './masterApi';
import { getDesignArticlesApi } from './articleCollectionApi';

// "All articles" direct-adds carry no picks — fetch every articlemastercode
// via getarticle so the save payload sends real codes like explicit picks
export const resolveArticleSelections = async (items) => {
    const needsFetch = (item) =>
        item.source === 'article' && item.allArticlesSelected && !(item.selectedArticles?.length);
    if (!items.some(needsFetch)) return items;

    const cache = new Map();
    const fetchArticles = (designno) => {
        if (!cache.has(designno)) {
            cache.set(
                designno,
                getDesignArticlesApi(designno).then((res) => res?.rd || []).catch(() => [])
            );
        }
        return cache.get(designno);
    };

    return Promise.all(
        items.map(async (item) => {
            if (!needsFetch(item)) return item;
            const rows = await fetchArticles(item.designno);
            const selectedArticles = rows.map((row, i) => ({
                id: `art:${row.autocode ?? item.designno}:${row.ArticleNo ?? i}`,
                articleno: row.ArticleNo,
                articlemastercode: row.ArticleMasterCode ?? row.articlemastercode ?? row.ArticleNo,
            }));
            return selectedArticles.length
                ? { ...item, selectedArticles, allArticlesSelected: false }
                : item;
        })
    );
};

export const SaveCartApi = async (cartItems) => {
    try {
        // QueryStringdesignid — designno for design, StockBarcode for stock,
        // ArticleMasterCode (one entry per picked article) for article items
        const productId = cartItems
            ?.map(item => {
                const src = item.source || 'design';
                if (src === 'stock') {
                    return item.StockBarcode || item.rawId || item.designno || '';
                }
                if (src === 'article' && item.selectedArticles?.length) {
                    return item.selectedArticles
                        .map(a => (a?.articlemastercode || a?.articleno || ''))
                        .filter(Boolean)
                        .join(',');
                }
                return item.designno || item.rawId || '';
            })
            .filter(Boolean)
            .join(',') || '';

        // Per-item detail rows — stockbarcode for stock, articlemastercode
        // (comma-joined picks) for article — same flat-field shape
        const jsonData = cartItems?.map(item => {
            const src = item.source || 'design';
            if (src === 'stock') {
                return {
                    stockbarcode: item.StockBarcode || item.rawId || '',
                    designno: item.designno || '',
                    source: src,
                };
            }
            if (src === 'article') {
                const articlemastercode = item.selectedArticles?.length
                    ? item.selectedArticles
                        .map(a => (a?.articlemastercode ?? a?.articleno ?? a))
                        .filter(Boolean)
                        .join(',')
                    : '';
                return {
                    ...(articlemastercode
                        ? { articlemastercode }
                        : item.allArticlesSelected ? { allarticles: 1 } : {}),
                    designno: item.designno || '',
                    source: src,
                };
            }
            return {
                designno: item.designno || '',
                source: src,
            };
        }) || [];

        const pValue = JSON.stringify({
            QueryStringdesignid: productId ?? '',
            JsonData: jsonData,
        });

        const options = {
            p: pValue,
            f: "Task Management (taskmaster)",
        };

        const result = await masterApi('SaveQueryStringdesignid', options);

        if (result.success) {
            return {
                success: true,
                message: "Items added to design collection successfully",
                data: result.data
            };
        }
        throw new Error("An unexpected error occurred.");

    } catch (error) {
        console.error('SaveCartApi Error:', error);
        throw error;
    }
};