import { beforeEach, describe, expect, it, vi } from 'vitest';

const { runGraphBatchMock } = vi.hoisted(() => ({ runGraphBatchMock: vi.fn() }));

vi.mock('../common/graph-batch', async () => {
	const actual = await vi.importActual<typeof import('../common/graph-batch')>(
		'../common/graph-batch',
	);
	return { ...actual, runGraphBatch: runGraphBatchMock };
});

vi.mock('../common/client', () => ({
	outlookCommon: {
		createClient: () => ({}),
		mailboxPrefix: () => '/me',
	},
}));

import { outlookBatchMoveMessagesAction } from './outlook-batch-move-messages';
import { outlookBatchUpdateMessagesAction } from './outlook-batch-update-messages';

const auth = { access_token: 'token' } as never;

function run(action: { run: (context: never) => Promise<unknown> }, propsValue: unknown) {
	return action.run({ auth, propsValue } as never);
}

describe('outlook batch actions share one output contract', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it('batch_update_messages returns succeeded as objects carrying messageId', async () => {
		runGraphBatchMock.mockResolvedValueOnce([
			{ id: '1', status: 200, body: { id: 'm1' } },
			{ id: '2', status: 200, body: { id: 'm2' } },
		]);

		const result = (await run(outlookBatchUpdateMessagesAction, {
			messageIds: ['m1', 'm2'],
			isRead: 'true',
		})) as Record<string, unknown>;

		expect(result['succeeded']).toEqual([{ messageId: 'm1' }, { messageId: 'm2' }]);
		expect(result['success']).toBe(true);
		expect(result['requestedCount']).toBe(2);
		expect(result['succeededCount']).toBe(2);
		expect(result['failedCount']).toBe(0);
		expect(result['failed']).toEqual([]);
	});

	it('batch_move_messages returns succeeded as objects carrying messageId', async () => {
		runGraphBatchMock.mockResolvedValueOnce([
			{ id: '1', status: 201, body: { id: 'new-1' } },
		]);

		const result = (await run(outlookBatchMoveMessagesAction, {
			messageIds: ['m1'],
			destinationFolderId: 'archive',
		})) as Record<string, unknown>;

		expect(result['succeeded']).toEqual([{ messageId: 'm1', newMessageId: 'new-1' }]);
		expect(result['success']).toBe(true);
		expect(result['succeededCount']).toBe(1);
	});

	it('every succeeded entry of both actions is an object with a messageId', async () => {
		runGraphBatchMock.mockResolvedValueOnce([{ id: '1', status: 200, body: { id: 'm1' } }]);
		const updated = (await run(outlookBatchUpdateMessagesAction, {
			messageIds: ['m1'],
			isRead: 'true',
		})) as { succeeded: Array<Record<string, unknown>> };

		runGraphBatchMock.mockResolvedValueOnce([{ id: '1', status: 201, body: { id: 'new-1' } }]);
		const moved = (await run(outlookBatchMoveMessagesAction, {
			messageIds: ['m1'],
			destinationFolderId: 'archive',
		})) as { succeeded: Array<Record<string, unknown>> };

		for (const entry of [...updated.succeeded, ...moved.succeeded]) {
			expect(typeof entry).toBe('object');
			expect(typeof entry['messageId']).toBe('string');
		}
	});

	it('reports partial failure identically on both actions', async () => {
		const mixed = [
			{ id: '1', status: 200, body: { id: 'm1' } },
			{ id: '2', status: 404, body: { error: { code: 'ErrorItemNotFound', message: 'gone' } } },
		];

		runGraphBatchMock.mockResolvedValueOnce(mixed);
		const updated = (await run(outlookBatchUpdateMessagesAction, {
			messageIds: ['m1', 'm2'],
			isRead: 'true',
		})) as Record<string, unknown>;

		runGraphBatchMock.mockResolvedValueOnce(mixed);
		const moved = (await run(outlookBatchMoveMessagesAction, {
			messageIds: ['m1', 'm2'],
			destinationFolderId: 'archive',
		})) as Record<string, unknown>;

		for (const result of [updated, moved]) {
			expect(result['success']).toBe(false);
			expect(result['succeededCount']).toBe(1);
			expect(result['failedCount']).toBe(1);
			expect(result['failed']).toEqual([
				{ messageId: 'm2', status: 404, error: 'ErrorItemNotFound: gone' },
			]);
		}
	});

	it('merges categories per message before patching', async () => {
		runGraphBatchMock
			.mockResolvedValueOnce([
				{ id: '1', status: 200, body: { id: 'm1', categories: ['keep'] } },
			])
			.mockResolvedValueOnce([{ id: '1', status: 200, body: { id: 'm1' } }]);

		await run(outlookBatchUpdateMessagesAction, {
			messageIds: ['m1'],
			categoriesToAdd: ['added'],
		});

		const patchCall = runGraphBatchMock.mock.calls[1][0] as {
			requests: Array<{ body: { categories: string[] } }>;
		};
		expect(patchCall.requests[0].body.categories).toEqual(['keep', 'added']);
	});
});
