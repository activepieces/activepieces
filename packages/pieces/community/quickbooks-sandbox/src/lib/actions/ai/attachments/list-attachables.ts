import { createAction } from '@activepieces/pieces-framework';
import { quickbooksAuth } from '../../../auth';
import { quickbooksAiProps } from '../../../common/ai-props';
import { quickbooksApi } from '../../../common/api';
import { quickbooksSandboxListAttachablesOutputSchema } from '../../../output-schemas';

export const listAttachablesAction = createAction({
	auth: quickbooksAuth,
	name: 'quickbooks_sandbox_list_attachables',
	outputSchema: quickbooksSandboxListAttachablesOutputSchema,
	displayName: 'List Attachables',
	description: 'Lists attachments and notes, optionally filtered.',
	audience: 'ai',
	classification: 'SEARCH',
	aiMetadata: {
		description:
			'Lists attachables (uploaded files and notes) one page at a time, with an optional QuickBooks query filter and sort; filter by the linked record with e.g. "AttachableRef.EntityRef.Type = \'Invoice\' AND AttachableRef.EntityRef.value = \'130\'". Page with startPosition and the returned nextStartPosition (null on the last page).',
		idempotent: true,
	},
	props: {
		where: quickbooksAiProps.where({ required: false }),
		orderBy: quickbooksAiProps.orderBy({ required: false }),
		limit: quickbooksAiProps.limit({ required: false }),
		startPosition: quickbooksAiProps.startPosition({ required: false }),
	},
	async run(context) {
		const { where, orderBy, limit, startPosition } = context.propsValue;
		return await quickbooksApi.listEntities({
			auth: context.auth,
			entity: 'Attachable',
			where,
			orderBy,
			limit,
			startPosition,
		});
	},
});
