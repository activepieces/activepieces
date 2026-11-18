import { createAction } from '@activepieces/pieces-framework';
import { quickbooksAuth } from '../../../auth';
import { quickbooksAiProps } from '../../../common/ai-props';
import { quickbooksApi } from '../../../common/api';
import { quickbooksSandboxGetAttachableOutputSchema } from '../../../output-schemas';

export const getAttachableAction = createAction({
	auth: quickbooksAuth,
	name: 'quickbooks_sandbox_get_attachable',
	outputSchema: quickbooksSandboxGetAttachableOutputSchema,
	displayName: 'Get Attachable',
	description: 'Gets one attachment or note by id.',
	audience: 'ai',
	classification: 'READ',
	aiMetadata: {
		description:
			'Reads one attachable (file or note) with its file name, content type, size, note, linked records and SyncToken. For a link to the file itself, use Get Attachable Download URL. Get the id from List Attachables, Upload Attachable or Create Attachable Note.',
		idempotent: true,
	},
	props: {
		attachableId: quickbooksAiProps.id({
			required: true,
			displayName: 'Attachable ID',
			description: 'QuickBooks attachable id. Use List Attachables to find it.',
		}),
	},
	async run(context) {
		return await quickbooksApi.getEntity({
			auth: context.auth,
			entity: 'Attachable',
			id: context.propsValue.attachableId,
		});
	},
});
