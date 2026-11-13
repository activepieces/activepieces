import { createAction } from '@activepieces/pieces-framework';
import { quickbooksAuth } from '../../../auth';
import { quickbooksAiProps } from '../../../common/ai-props';
import { quickbooksApi } from '../../../common/api';
import { quickbooksSandboxDeleteAttachableOutputSchema } from '../../../output-schemas';

export const deleteAttachableAction = createAction({
	auth: quickbooksAuth,
	name: 'quickbooks_sandbox_delete_attachable',
	outputSchema: quickbooksSandboxDeleteAttachableOutputSchema,
	displayName: 'Delete Attachable',
	description: 'Permanently deletes an attachment or note.',
	audience: 'ai',
	classification: 'DESTRUCTIVE',
	aiMetadata: {
		description:
			'Permanently deletes one attachable (file or note) and removes it from every record it was linked to; it cannot be restored. To only unlink it from a record, use Update Attachable. Get the id from List Attachables.',
		idempotent: false,
	},
	props: {
		attachableId: quickbooksAiProps.id({
			required: true,
			displayName: 'Attachable ID',
			description: 'QuickBooks attachable id. Use List Attachables to find it.',
		}),
	},
	async run(context) {
		return await quickbooksApi.deleteEntity({
			auth: context.auth,
			entity: 'Attachable',
			id: context.propsValue.attachableId,
		});
	},
});
