/// <reference types="vitest/globals" />

import { AppConnectionType, createMockActionContext, InputPropertyMap } from '@activepieces/pieces-framework';
import '../src';
import { webflowFindCollectionItem } from '../src/lib/actions/find-collection-item';

const webflow = vi.hoisted(() => ({
	listCollectionItems: vi.fn(),
}));

vi.mock('../src/lib/common/client', () => {
	class FakeWebflowApiClient {
		listCollectionItems(collectionId: string, offset: number, limit: number) {
			return webflow.listCollectionItems(collectionId, offset, limit);
		}
	}
	return { WebflowApiClient: FakeWebflowApiClient };
});

describe('Find Collection Item by Field', () => {
	beforeEach(() => {
		webflow.listCollectionItems.mockReset();
	});

	test('finds a match after the first page', async () => {
		webflow.listCollectionItems
			.mockResolvedValueOnce({ items: fillerItems(100) })
			.mockResolvedValueOnce({ items: [{ _id: 'hit', slug: 'launch-post' }, ...fillerItems(3)] });

		await expect(runFind({ fieldName: 'slug', fieldValue: 'launch-post' })).resolves.toEqual({
			success: true,
			result: [{ _id: 'hit', slug: 'launch-post' }],
		});
		expect(webflow.listCollectionItems).toHaveBeenCalledTimes(2);
		expect(webflow.listCollectionItems).toHaveBeenNthCalledWith(1, 'collection-1', 0, 100);
		expect(webflow.listCollectionItems).toHaveBeenNthCalledWith(2, 'collection-1', 100, 100);
	});

	test('matches a flat number field by its text', async () => {
		webflow.listCollectionItems.mockResolvedValueOnce({
			items: [
				{ _id: 'five', price: 5 },
				{ _id: 'six', price: 6 },
			],
		});

		await expect(runFind({ fieldName: 'price', fieldValue: '5' })).resolves.toEqual({
			success: true,
			result: [{ _id: 'five', price: 5 }],
		});
	});

	test('still matches items that nest their values under fields', async () => {
		webflow.listCollectionItems.mockResolvedValueOnce({
			items: [{ _id: 'nested', fields: { color: 'red' } }],
		});

		await expect(runFind({ fieldName: 'color', fieldValue: 'red' })).resolves.toEqual({
			success: true,
			result: [{ _id: 'nested', fields: { color: 'red' } }],
		});
	});

	test('never matches an empty field against its text', async () => {
		webflow.listCollectionItems.mockResolvedValue({
			items: [{ _id: 'blank', summary: null }, { _id: 'missing' }],
		});

		await expect(runFind({ fieldName: 'summary', fieldValue: 'null' })).resolves.toEqual({
			success: true,
			result: [],
		});
		await expect(runFind({ fieldName: 'summary', fieldValue: 'undefined' })).resolves.toEqual({
			success: true,
			result: [],
		});
	});

	test('returns no matches for an empty collection after one request', async () => {
		webflow.listCollectionItems.mockResolvedValueOnce({ items: [] });

		await expect(runFind({ fieldName: 'slug', fieldValue: 'anything' })).resolves.toEqual({
			success: true,
			result: [],
		});
		expect(webflow.listCollectionItems).toHaveBeenCalledTimes(1);
	});

	test('stops reading pages once Max Results matches are found', async () => {
		webflow.listCollectionItems.mockResolvedValueOnce({ items: matchingItems(100) });

		const output = await runFind({ fieldName: 'category', fieldValue: 'news', maxResults: 2 });

		expect(output).toEqual({ success: true, result: matchingItems(2) });
		expect(webflow.listCollectionItems).toHaveBeenCalledTimes(1);
	});

	test('returns every match when Max Results is empty', async () => {
		webflow.listCollectionItems
			.mockResolvedValueOnce({ items: matchingItems(100) })
			.mockResolvedValueOnce({ items: matchingItems(1) });

		const output = await runFind({ fieldName: 'category', fieldValue: 'news' });

		expect(output).toEqual({ success: true, result: [...matchingItems(100), ...matchingItems(1)] });
		expect(webflow.listCollectionItems).toHaveBeenCalledTimes(2);
	});

	test('returns no matches without reading any page when Max Results is 0', async () => {
		webflow.listCollectionItems.mockResolvedValue({ items: matchingItems(100) });

		await expect(runFind({ fieldName: 'category', fieldValue: 'news', maxResults: 0 })).resolves.toEqual({
			success: true,
			result: [],
		});
		expect(webflow.listCollectionItems).not.toHaveBeenCalled();
	});

	test('reports a failed later page instead of throwing', async () => {
		const failure = new Error('Webflow returned 500');
		webflow.listCollectionItems.mockResolvedValueOnce({ items: fillerItems(100) }).mockRejectedValueOnce(failure);

		await expect(runFind({ fieldName: 'slug', fieldValue: 'launch-post' })).resolves.toEqual({
			success: false,
			message: failure,
		});
	});
});

function runFind({ fieldName, fieldValue, maxResults }: RunFindParams): Promise<unknown> {
	const propsValue = {
		site_id: 'site-1',
		collection_id: 'collection-1',
		field_name: fieldName,
		field_value: fieldValue,
		max_results: maxResults,
	};
	const base = createMockActionContext<InputPropertyMap>({ propsValue });
	return webflowFindCollectionItem.run({
		...base,
		auth: {
			type: AppConnectionType.OAUTH2,
			access_token: 'access-token',
			refresh_token: 'refresh-token',
			client_id: 'client-id',
			client_secret: 'client-secret',
			redirect_url: 'https://example.com/redirect',
			token_type: 'Bearer',
			token_url: 'https://api.webflow.com/oauth/access_token',
			scope: 'forms:read',
			claimed_at: 0,
			expires_in: 3600,
			data: {},
		},
		propsValue,
	});
}

function fillerItems(count: number): Record<string, unknown>[] {
	return Array.from({ length: count }, (_, index) => ({ _id: `filler-${index}`, slug: `post-${index}` }));
}

function matchingItems(count: number): Record<string, unknown>[] {
	return Array.from({ length: count }, (_, index) => ({ _id: `news-${index}`, category: 'news' }));
}

type RunFindParams = {
	fieldName: string;
	fieldValue: string;
	maxResults?: number;
};
