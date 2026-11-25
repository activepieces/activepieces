import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { quickbooksAuth } from '../../../auth';
import { quickbooksClient } from '../../../common/client';
import type { QuickbooksFault } from '../../../common/types';
import { quickbooksSandboxRunBatchOutputSchema } from '../../../output-schemas';

export const runBatchAction = createAction({
	auth: quickbooksAuth,
	name: 'quickbooks_sandbox_run_batch',
	outputSchema: quickbooksSandboxRunBatchOutputSchema,
	displayName: 'Run Batch',
	description: 'Runs up to 30 create, update, delete or query operations in one call.',
	audience: 'ai',
	classification: 'DESTRUCTIVE',
	aiMetadata: {
		description:
			'Runs up to 30 operations (create, update, delete, void or query on any entity) in one call; each item needs a unique bId. Items run independently, so when some fail the others are still applied, and the error lists the failed bIds. Not idempotent: retrying re-runs the creates.',
		idempotent: false,
	},
	props: {
		batchItems: Property.Json({
			displayName: 'Batch Items',
			description:
				'JSON array of 1-30 BatchItemRequest objects, e.g. [{"bId": "1", "operation": "create", "Vendor": {"DisplayName": "Acme"}}, {"bId": "2", "operation": "delete", "Invoice": {"Id": "130", "SyncToken": "0"}}, {"bId": "3", "Query": "SELECT * FROM Customer MAXRESULTS 10"}]. Updates and deletes need the current SyncToken.',
			required: true,
		}),
	},
	async run(context) {
		const { batchItems } = context.propsValue;
		if (!Array.isArray(batchItems) || batchItems.length === 0 || batchItems.length > MAX_BATCH_ITEMS) {
			throw new Error(`Batch Items must be a JSON array of 1-${MAX_BATCH_ITEMS} BatchItemRequest objects.`);
		}
		const response = await quickbooksClient.request<QuickbooksBatchResponse>({
			auth: context.auth,
			method: HttpMethod.POST,
			path: '/batch',
			body: { BatchItemRequest: batchItems },
		});
		const failed = (response.BatchItemResponse ?? []).filter((item) => item.Fault !== undefined);
		if (failed.length > 0) {
			const details = failed
				.map((item) => `${item.bId}: ${(item.Fault?.Error ?? []).map((error) => error.Detail ?? error.Message).join('; ')}`)
				.join(' | ');
			throw new Error(
				`QuickBooks batch: ${failed.length} of ${batchItems.length} items failed (bIds ${failed.map((item) => item.bId).join(', ')}); the other items were applied. ${details}`,
			);
		}
		return response;
	},
});

const MAX_BATCH_ITEMS = 30;

type QuickbooksBatchResponse = {
	BatchItemResponse?: ({ bId?: string; Fault?: QuickbooksFault } & Record<string, unknown>)[];
	time?: string;
};
