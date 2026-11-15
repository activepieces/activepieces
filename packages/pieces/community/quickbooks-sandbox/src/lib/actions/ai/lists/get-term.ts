import { createAction } from '@activepieces/pieces-framework';
import { quickbooksAuth } from '../../../auth';
import { quickbooksAiProps } from '../../../common/ai-props';
import { quickbooksApi } from '../../../common/api';
import { quickbooksSandboxCreateTermOutputSchema } from '../../../output-schemas';

export const getTermAction = createAction({
	auth: quickbooksAuth,
	name: 'quickbooks_sandbox_get_term',
	outputSchema: quickbooksSandboxCreateTermOutputSchema,
	displayName: 'Get Term',
	description: 'Gets one term by id.',
	audience: 'ai',
	classification: 'READ',
	aiMetadata: {
		description:
			'Reads one payment term with its due days, discount and SyncToken. Get the id from List Terms or Create Term.',
		idempotent: true,
	},
	props: {
		termId: quickbooksAiProps.id({
			required: true,
			displayName: 'Term ID',
			description: 'QuickBooks term id. Use List Terms to find it.',
		}),
	},
	async run(context) {
		return await quickbooksApi.getEntity({
			auth: context.auth,
			entity: 'Term',
			id: context.propsValue.termId,
		});
	},
});
