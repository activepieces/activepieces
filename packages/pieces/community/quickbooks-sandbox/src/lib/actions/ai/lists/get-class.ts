import { createAction } from '@activepieces/pieces-framework';
import { quickbooksAuth } from '../../../auth';
import { quickbooksAiProps } from '../../../common/ai-props';
import { quickbooksApi } from '../../../common/api';
import { quickbooksSandboxCreateClassOutputSchema } from '../../../output-schemas';

export const getClassAction = createAction({
	auth: quickbooksAuth,
	name: 'quickbooks_sandbox_get_class',
	outputSchema: quickbooksSandboxCreateClassOutputSchema,
	displayName: 'Get Class',
	description: 'Gets one class by id.',
	audience: 'ai',
	classification: 'READ',
	aiMetadata: {
		description:
			'Reads one class with its parent, full name and SyncToken. Needs QuickBooks Online Plus or Advanced with class tracking on. Get the id from List Classes or Create Class.',
		idempotent: true,
	},
	props: {
		classId: quickbooksAiProps.id({
			required: true,
			displayName: 'Class ID',
			description: 'QuickBooks class id. Use List Classes to find it.',
		}),
	},
	async run(context) {
		return await quickbooksApi.getEntity({
			auth: context.auth,
			entity: 'Class',
			id: context.propsValue.classId,
		});
	},
});
