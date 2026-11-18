import { createAction } from '@activepieces/pieces-framework';
import { quickbooksAuth } from '../../../auth';
import { quickbooksAiProps } from '../../../common/ai-props';
import { quickbooksApi } from '../../../common/api';
import { quickbooksSandboxCreateInventoryAdjustmentOutputSchema } from '../../../output-schemas';

export const getInventoryAdjustmentAction = createAction({
	auth: quickbooksAuth,
	name: 'quickbooks_sandbox_get_inventory_adjustment',
	outputSchema: quickbooksSandboxCreateInventoryAdjustmentOutputSchema,
	displayName: 'Get Inventory Adjustment',
	description: 'Gets one inventory adjustment by id.',
	audience: 'ai',
	classification: 'READ',
	aiMetadata: {
		description:
			'Reads one inventory adjustment with its account, item lines and SyncToken. Needs QuickBooks Plus or Advanced (US) with inventory tracking on. Get the id from Create Inventory Adjustment or Run Query ("SELECT * FROM InventoryAdjustment").',
		idempotent: true,
	},
	props: {
		inventoryAdjustmentId: quickbooksAiProps.id({
			required: true,
			displayName: 'Inventory Adjustment ID',
			description: 'QuickBooks inventory adjustment id, from Create Inventory Adjustment or Run Query.',
		}),
	},
	async run(context) {
		return await quickbooksApi.getEntity({
			auth: context.auth,
			entity: 'InventoryAdjustment',
			id: context.propsValue.inventoryAdjustmentId,
		});
	},
});
