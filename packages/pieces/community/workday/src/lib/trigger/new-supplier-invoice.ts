import { DedupeStrategy, Polling, pollingHelper } from '@activepieces/pieces-common';
import { AppConnectionValueForAuthProperty, TriggerStrategy, createTrigger } from '@activepieces/pieces-framework';
import { workdayAuth } from '../auth';
import { workdayWqlRequest } from '../common';

const polling: Polling<AppConnectionValueForAuthProperty<typeof workdayAuth>, Record<string, never>> = {
	strategy: DedupeStrategy.LAST_ITEM,
	items: async ({ auth }) => {
		const response = await workdayWqlRequest<{ total: number; data: Array<Record<string, unknown>> }>(
			auth,
			`SELECT supplier, supplierName FROM suppliers LIMIT 100`,
		);

		const items = response.body.data ?? [];
		return items.map((item) => ({
			id: JSON.stringify(item),
			data: item,
		}));
	},
};

export const newSupplierInvoice = createTrigger({
	auth: workdayAuth,
	name: 'new_supplier_invoice',
	displayName: 'New Supplier Invoice',
	description: 'Triggers when a new supplier invoice is created in Workday.',
	props: {},
	sampleData: { id: 'inv-001', descriptor: 'Invoice #12345 - Acme Corp', createdDate: '2026-04-01T12:00:00Z' },
	type: TriggerStrategy.POLLING,
	async test(ctx) { return await pollingHelper.test(polling, { auth: ctx.auth, store: ctx.store, propsValue: ctx.propsValue, files: ctx.files }); },
	async onEnable(ctx) { await pollingHelper.onEnable(polling, { auth: ctx.auth, store: ctx.store, propsValue: ctx.propsValue }); },
	async onDisable(ctx) { await pollingHelper.onDisable(polling, { auth: ctx.auth, store: ctx.store, propsValue: ctx.propsValue }); },
	async run(ctx) { return await pollingHelper.poll(polling, { auth: ctx.auth, store: ctx.store, propsValue: ctx.propsValue, files: ctx.files }); },
});
