import { afterEach, describe, expect, it, vi } from 'vitest';
import '../src';
import { shopifyAiBulkDeleteMetaobjects } from '../src/lib/actions/ai/bulk-delete-metaobjects';
import { shopifyAiDeleteMetafields } from '../src/lib/actions/ai/delete-metafields';
import { shopifyAiUpdateArticle } from '../src/lib/actions/ai/update-article';
import { shopifyAiUpdatePage } from '../src/lib/actions/ai/update-page';
import { mockShopify, runAction } from './helpers';

const BULK_DELETED = { data: { metaobjectBulkDelete: { job: { id: 'gid://shopify/Job/1', done: false }, userErrors: [] } } };

const PRODUCT = 'gid://shopify/Product/1';

afterEach(() => {
    vi.restoreAllMocks();
});

describe('bulk_delete_metaobjects guard', () => {
    it.each([
        { label: 'BY_IDS with a type', propsValue: { scope: 'BY_IDS', metaobject_ids: ['1'], type: 'designer' }, message: 'scope BY_IDS takes metaobject_ids only; remove type' },
        { label: 'BY_IDS without ids', propsValue: { scope: 'BY_IDS' }, message: 'scope BY_IDS needs at least one metaobject id' },
        { label: 'ALL_OF_TYPE with ids', propsValue: { scope: 'ALL_OF_TYPE', metaobject_ids: ['1'], type: 'designer' }, message: 'scope ALL_OF_TYPE takes a type only; remove metaobject_ids' },
        { label: 'ALL_OF_TYPE without a type', propsValue: { scope: 'ALL_OF_TYPE' }, message: 'scope ALL_OF_TYPE needs the metaobject type' },
        { label: 'an unknown scope', propsValue: { scope: 'EVERYTHING', type: 'designer' }, message: 'scope must be BY_IDS or ALL_OF_TYPE' },
        {
            label: 'more than 250 ids',
            propsValue: { scope: 'BY_IDS', metaobject_ids: Array.from({ length: 251 }, (_, index) => String(index + 1)) },
            message: 'At most 250 ids per call',
        },
    ])('refuses $label before calling Shopify', async ({ propsValue, message }) => {
        const sent = mockShopify({ replies: [] });

        await expect(runAction({ action: shopifyAiBulkDeleteMetaobjects, propsValue })).rejects.toThrow(message);
        expect(sent).toHaveLength(0);
    });

    it('sends exactly the given ids, deduplicated', async () => {
        const sent = mockShopify({ replies: [BULK_DELETED] });

        const result = await runAction({
            action: shopifyAiBulkDeleteMetaobjects,
            propsValue: { scope: 'BY_IDS', metaobject_ids: ['1', 'gid://shopify/Metaobject/2', '1'] },
        });

        expect(sent[0].variables).toEqual({ where: { ids: ['gid://shopify/Metaobject/1', 'gid://shopify/Metaobject/2'] } });
        expect(result).toEqual({ job_id: 'gid://shopify/Job/1', done: false, scope: 'BY_IDS', redacted_fields: [] });
    });

    it('accepts exactly 250 ids', async () => {
        const sent = mockShopify({ replies: [BULK_DELETED] });
        const ids = Array.from({ length: 250 }, (_, index) => String(index + 1));

        await runAction({ action: shopifyAiBulkDeleteMetaobjects, propsValue: { scope: 'BY_IDS', metaobject_ids: ids } });

        expect(sent[0].variables).toEqual({ where: { ids: ids.map((id) => `gid://shopify/Metaobject/${id}`) } });
    });

    it('sends only the type for ALL_OF_TYPE', async () => {
        const sent = mockShopify({ replies: [BULK_DELETED] });

        await runAction({ action: shopifyAiBulkDeleteMetaobjects, propsValue: { scope: 'ALL_OF_TYPE', type: 'designer' } });

        expect(sent[0].variables).toEqual({ where: { type: 'designer' } });
    });
});

describe('delete_metafields', () => {
    const METAFIELDS = [
        { owner_id: PRODUCT, namespace: 'custom', key: 'a' },
        { owner_id: PRODUCT, namespace: 'custom', key: 'b' },
        { owner_id: PRODUCT, namespace: 'custom', key: 'c' },
    ];

    it('sends the identifiers and matches results by identifier, not by position', async () => {
        const sent = mockShopify({
            replies: [
                {
                    data: {
                        metafieldsDelete: {
                            deletedMetafields: [
                                { ownerId: PRODUCT, namespace: 'custom', key: 'c' },
                                null,
                                { ownerId: PRODUCT, namespace: 'custom', key: 'a' },
                            ],
                            userErrors: [],
                        },
                    },
                },
            ],
        });

        const result = await runAction({ action: shopifyAiDeleteMetafields, propsValue: { metafields: METAFIELDS } });

        expect(sent[0].variables).toEqual({
            metafields: [
                { ownerId: PRODUCT, namespace: 'custom', key: 'a' },
                { ownerId: PRODUCT, namespace: 'custom', key: 'b' },
                { ownerId: PRODUCT, namespace: 'custom', key: 'c' },
            ],
        });
        expect(result).toEqual({
            deleted: [
                { owner_id: PRODUCT, namespace: 'custom', key: 'a' },
                { owner_id: PRODUCT, namespace: 'custom', key: 'c' },
            ],
            not_found: [{ owner_id: PRODUCT, namespace: 'custom', key: 'b' }],
            deleted_count: 2,
            redacted_fields: [],
        });
    });

    it('reports omitted identifiers as not found', async () => {
        mockShopify({
            replies: [{ data: { metafieldsDelete: { deletedMetafields: [{ ownerId: PRODUCT, namespace: 'custom', key: 'b' }], userErrors: [] } } }],
        });

        const result = await runAction({ action: shopifyAiDeleteMetafields, propsValue: { metafields: METAFIELDS } });

        expect(result).toMatchObject({
            deleted: [{ owner_id: PRODUCT, namespace: 'custom', key: 'b' }],
            not_found: [
                { owner_id: PRODUCT, namespace: 'custom', key: 'a' },
                { owner_id: PRODUCT, namespace: 'custom', key: 'c' },
            ],
            deleted_count: 1,
        });
    });
});

describe('content clear flags', () => {
    const ARTICLE_UPDATED = { data: { articleUpdate: { article: { id: 'gid://shopify/Article/4' }, userErrors: [] } } };

    it('update_article sends an empty body for clear_body', async () => {
        const sent = mockShopify({ replies: [ARTICLE_UPDATED] });

        await runAction({ action: shopifyAiUpdateArticle, propsValue: { article_id: '4', clear_body: true } });

        expect(sent[0].variables).toEqual({ id: 'gid://shopify/Article/4', article: { body: '' } });
    });

    it('update_article sends empty tags for clear_tags', async () => {
        const sent = mockShopify({ replies: [ARTICLE_UPDATED] });

        await runAction({ action: shopifyAiUpdateArticle, propsValue: { article_id: '4', clear_tags: true } });

        expect(sent[0].variables).toEqual({ id: 'gid://shopify/Article/4', article: { tags: [] } });
    });

    it('update_article refuses body_html together with clear_body before calling Shopify', async () => {
        const sent = mockShopify({ replies: [] });

        await expect(
            runAction({ action: shopifyAiUpdateArticle, propsValue: { article_id: '4', body_html: '<p>Hi</p>', clear_body: true } })
        ).rejects.toThrow('Give either body_html or clear_body, not both');
        expect(sent).toHaveLength(0);
    });

    it('update_page sends an empty body for clear_body', async () => {
        const sent = mockShopify({ replies: [{ data: { pageUpdate: { page: { id: 'gid://shopify/Page/6' }, userErrors: [] } } }] });

        await runAction({ action: shopifyAiUpdatePage, propsValue: { page_id: '6', clear_body: true } });

        expect(sent[0].variables).toEqual({ id: 'gid://shopify/Page/6', page: { body: '' } });
    });
});
