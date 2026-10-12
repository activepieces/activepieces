import { HttpRequest, HttpResponse, httpClient } from '@activepieces/pieces-common';
import {
	AppConnectionType,
	AppConnectionValueForAuthProperty,
	PropertyContext,
} from '@activepieces/pieces-framework';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { hubspotAuth } from '../src/lib/auth';
import { blogUrlDropdown } from '../src/lib/common/props';

const PAGE_SIZE = 100;

const CUSTOM_AUTH: AppConnectionValueForAuthProperty<typeof hubspotAuth> = {
	type: AppConnectionType.CUSTOM_AUTH,
	props: { access_token: 'test-token' },
};

const PROPERTY_CONTEXT: PropertyContext = {
	server: { apiUrl: 'http://localhost/api/', publicUrl: 'http://localhost/', token: 'test-token' },
	project: { id: 'test-project', externalId: async () => undefined },
	flows: {
		list: async () => ({ data: [], next: null, previous: null }),
		current: { id: 'test-flow', version: { id: 'test-flow-version' } },
	},
	connections: { get: async () => null },
};

describe('blogUrlDropdown', () => {
	afterEach(() => {
		vi.restoreAllMocks();
	});

	it('requests every page until the total is reached', async () => {
		const requestedOffsets = serveBlogs({ total: 150, available: 150 });

		const state = await blogUrlDropdown.options({ auth: CUSTOM_AUTH }, PROPERTY_CONTEXT);

		expect(requestedOffsets).toEqual(['0', '100']);
		expect(state.options).toHaveLength(150);
		expect(state.options[149]).toEqual({ label: 'https://blog.example.com/149', value: '149' });
	});

	it('stops when a page comes back empty even if the total says more', async () => {
		const requestedOffsets = serveBlogs({ total: 300, available: 100 });

		const state = await blogUrlDropdown.options({ auth: CUSTOM_AUTH }, PROPERTY_CONTEXT);

		expect(requestedOffsets).toEqual(['0', '100']);
		expect(state.options).toHaveLength(100);
	});
});

function serveBlogs({ total, available }: { total: number; available: number }): string[] {
	const requestedOffsets: string[] = [];
	vi.spyOn(httpClient, 'sendRequest').mockImplementation(
		async (request: HttpRequest): Promise<HttpResponse> => {
			const offset = Number(request.queryParams?.['offset'] ?? '0');
			requestedOffsets.push(String(offset));
			const count = Math.max(0, Math.min(PAGE_SIZE, available - offset));
			return {
				status: 200,
				headers: {},
				body: { objects: buildBlogs({ start: offset, count }), offset, total, limit: PAGE_SIZE },
			};
		},
	);
	return requestedOffsets;
}

function buildBlogs({ start, count }: { start: number; count: number }) {
	return Array.from({ length: count }, (_, index) => ({
		absolute_url: `https://blog.example.com/${start + index}`,
		id: start + index,
	}));
}
