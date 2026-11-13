import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { quickbooksAuth } from '../../../auth';
import { quickbooksAiProps } from '../../../common/ai-props';
import { quickbooksApi } from '../../../common/api';
import { quickbooksClient } from '../../../common/client';
import type { QuickbooksRecurringEnvelope } from '../../../common/types';
import { quickbooksSandboxDeleteRecurringTransactionOutputSchema } from '../../../output-schemas';

export const deleteRecurringTransactionAction = createAction({
	auth: quickbooksAuth,
	name: 'quickbooks_sandbox_delete_recurring_transaction',
	outputSchema: quickbooksSandboxDeleteRecurringTransactionOutputSchema,
	displayName: 'Delete Recurring Transaction',
	description: 'Permanently deletes a recurring transaction template.',
	audience: 'ai',
	classification: 'DESTRUCTIVE',
	aiMetadata: {
		description:
			'Permanently deletes one recurring template so no further occurrences are created; transactions it already created stay. Reads the latest SyncToken first. Needs QuickBooks Online Essentials or higher. Get the id and its transaction type (the key wrapping it, e.g. Bill) from List Recurring Transactions.',
		idempotent: false,
	},
	props: {
		recurringTransactionId: quickbooksAiProps.id({
			required: true,
			displayName: 'Recurring Transaction ID',
			description: 'QuickBooks recurring transaction id. Use List Recurring Transactions to find it.',
		}),
		transactionType: quickbooksAiProps.recurringTransactionType({
			required: true,
			displayName: 'Transaction Type',
			description: 'Transaction type of the template, the key that wraps it in List Recurring Transactions, e.g. Bill.',
		}),
	},
	async run(context) {
		const { recurringTransactionId, transactionType } = context.propsValue;
		const response = await quickbooksClient.request<QuickbooksRecurringEnvelope>({
			auth: context.auth,
			method: HttpMethod.GET,
			path: `/recurringtransaction/${encodeURIComponent(recurringTransactionId)}`,
		});
		const template = response.RecurringTransaction?.[transactionType];
		if (!template) {
			throw new Error(`QuickBooks returned no ${transactionType} recurring transaction with id ${recurringTransactionId}.`);
		}
		return await quickbooksApi.createEntity({
			auth: context.auth,
			entity: 'RecurringTransaction',
			query: { operation: 'delete' },
			body: { [transactionType]: { Id: template.Id, SyncToken: template.SyncToken } },
		});
	},
});

