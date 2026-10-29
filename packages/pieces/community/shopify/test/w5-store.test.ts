import { afterEach, describe, expect, it, vi } from 'vitest';
import '../src';
import { shopifyAiCreateAnalyticsAnnotation } from '../src/lib/actions/ai/create-analytics-annotation';
import { shopifyAiCreateAnalyticsTarget } from '../src/lib/actions/ai/create-analytics-target';
import { GraphqlBody, mockShopify, runAction } from './helpers';

const TARGET_PROPS = {
    name: 'Q4 sales',
    metric: 'total_sales',
    start_date: '2026-10-01',
    end_date: '2026-12-31',
    expected_value: 50000,
};

const TARGET = {
    id: 'gid://shopify/AnalyticsTarget/9',
    name: 'Q4 sales',
    metric: 'total_sales',
    startDate: '2026-10-01',
    endDate: '2026-12-31',
    expectedValue: '50000',
    filters: null,
};

const TAKEN = { field: ['input'], message: 'A target with these attributes already exists', code: 'TAKEN' };

const LOOKUP_QUERY = 'metric:total_sales start_date:2026-10-01 end_date:2026-12-31';

afterEach(() => {
    vi.restoreAllMocks();
});

describe('create_analytics_target', () => {
    it('sends the exact target input', async () => {
        const sent = mockShopify({ replies: [{ data: { analyticsTargetCreate: { analyticsTarget: TARGET, userErrors: [] } } }] });

        const result = await runAction({ action: shopifyAiCreateAnalyticsTarget, propsValue: TARGET_PROPS });

        expect(sent[0].variables).toEqual({
            input: { name: 'Q4 sales', metric: 'total_sales', startDate: '2026-10-01', endDate: '2026-12-31', expectedValue: '50000' },
        });
        expect(result).toMatchObject({ id: TARGET.id, already_existed: false });
    });

    it('reports already_existed when Shopify returns TAKEN together with the target', async () => {
        const sent = mockShopify({ replies: [{ data: { analyticsTargetCreate: { analyticsTarget: TARGET, userErrors: [TAKEN] } } }] });

        const result = await runAction({ action: shopifyAiCreateAnalyticsTarget, propsValue: TARGET_PROPS });

        expect(sent).toHaveLength(1);
        expect(result).toMatchObject({ id: TARGET.id, already_existed: true });
    });

    it('pages through many lookup pages until it finds the existing target', async () => {
        const other = { ...TARGET, id: 'gid://shopify/AnalyticsTarget/1', filters: 'sales_channel=online' };
        const lookupPages: GraphqlBody[] = Array.from({ length: 12 }, (_, index) => ({
            data: {
                analyticsTargets: {
                    nodes: index === 11 ? [other, TARGET] : [other],
                    pageInfo: { hasNextPage: index < 11, endCursor: `cursor-${index + 1}` },
                },
            },
        }));
        const sent = mockShopify({
            replies: [{ data: { analyticsTargetCreate: { analyticsTarget: null, userErrors: [TAKEN] } } }, ...lookupPages],
        });

        const result = await runAction({ action: shopifyAiCreateAnalyticsTarget, propsValue: TARGET_PROPS });

        expect(sent).toHaveLength(13);
        expect(sent[1].variables).toEqual({ first: 50, query: LOOKUP_QUERY });
        expect(sent[12].variables).toEqual({ first: 50, after: 'cursor-11', query: LOOKUP_QUERY });
        expect(result).toMatchObject({ id: TARGET.id, already_existed: true });
    });

    it('stops looking up when the cursor stops advancing', async () => {
        const stuckPage: GraphqlBody = {
            data: { analyticsTargets: { nodes: [], pageInfo: { hasNextPage: true, endCursor: 'cursor-1' } } },
        };
        const sent = mockShopify({
            replies: [{ data: { analyticsTargetCreate: { analyticsTarget: null, userErrors: [TAKEN] } } }, stuckPage, stuckPage, stuckPage],
        });

        await expect(runAction({ action: shopifyAiCreateAnalyticsTarget, propsValue: TARGET_PROPS })).rejects.toThrow(
            'No target with this metric, dates and filters was found'
        );
        expect(sent).toHaveLength(3);
        expect(sent[2].variables).toEqual({ first: 50, after: 'cursor-1', query: LOOKUP_QUERY });
    });
});

describe('create_analytics_annotation', () => {
    it('refuses an impossible started_at date before calling Shopify', async () => {
        const sent = mockShopify({ replies: [] });

        await expect(
            runAction({
                action: shopifyAiCreateAnalyticsAnnotation,
                propsValue: { type: 'campaign', title: 'Launch', started_at: '2026-02-31T00:00:00Z' },
            })
        ).rejects.toThrow('started_at "2026-02-31T00:00:00Z" is not an ISO 8601 date-time');
        expect(sent).toHaveLength(0);
    });

    it('sends the exact annotation input', async () => {
        const sent = mockShopify({
            replies: [{ data: { analyticsAnnotationCreate: { analyticsAnnotation: { id: 'gid://shopify/AnalyticsAnnotation/3' }, userErrors: [] } } }],
        });

        await runAction({
            action: shopifyAiCreateAnalyticsAnnotation,
            propsValue: { type: 'campaign', title: 'Launch', started_at: '2026-11-28T00:00:00Z' },
        });

        expect(sent[0].variables).toEqual({ input: { type: 'campaign', title: 'Launch', startedAt: '2026-11-28T00:00:00Z' } });
    });
});
