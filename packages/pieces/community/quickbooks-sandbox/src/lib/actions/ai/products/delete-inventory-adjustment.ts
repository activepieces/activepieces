import { createAction } from '@activepieces/pieces-framework';
import { quickbooksAuth } from '../../../auth';
import { quickbooksAiProps } from '../../../common/ai-props';
import { quickbooksApi } from '../../../common/api';
import { quickbooksSandboxDeleteInventoryAdjustmentOutputSchema } from '../../../output-schemas';

export const deleteInventoryAdjustmentAction = createAction({
	auth: quickbooksAuth,
	name: 'quickbooks_sandbox_delete_inventory_adjustment',
	outputSchema: quickbooksSandboxDeleteInventoryAdjustmentOutputSchema,
	displayName: 'Delete Inventory Adjustment',
	description: 'Permanently deletes an inventory adjustment.',
	audience: 'ai',
	classification: 'DESTRUCTIVE',
	aiMetadata: {
		description:
			'Permanently deletes one inventory adjustment, reversing its quantity change; it cannot be restored. Reads the latest SyncToken first. Get the id from Create Inventory Adjustment or Run Query.',
		idempotent: false,
	},
	props: {
		inventoryAdjustmentId: quickbooksAiProps.id({
			required: true,
			displayName: 'Inventory Adjustment ID',
			description: 'QuickBooks inventory adjustment id, from Create Inventory Adjustment or Run Query.',
		}),
	},
	async run(context) {
		return await quickbooksApi.deleteEntity({
			auth: context.auth,
			entity: 'InventoryAdjustment',
			id: context.propsValue.inventoryAdjustmentId,
		});
	},
});
