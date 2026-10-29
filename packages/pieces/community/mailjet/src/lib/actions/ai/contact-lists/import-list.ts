import { createAction, Property } from '@activepieces/pieces-framework';

import { mailjetAuth } from '../../../auth';
import { mailjetAiProps } from '../../../common/ai-props';
import { mailjetApi } from '../../../common/api';
import { mailjetJobOutputSchema } from '../../../output-schemas';

export const mailjetImportListAction = createAction({
	auth: mailjetAuth,
	name: 'mailjet_import_list',
	outputSchema: mailjetJobOutputSchema,
	displayName: 'Import Contact List',
	description: 'Starts a job that copies the contacts of one list into another.',
	audience: 'ai',
	classification: 'WRITE',
	aiMetadata: {
		description:
			'Starts an asynchronous job that applies an action to every contact of a source list in the destination list (e.g. addnoforce to copy them). Returns a JobID; read it with Get Import Contact List Job.',
		idempotent: false,
	},
	props: {
		listId: mailjetAiProps.id({
			displayName: 'Destination List ID',
			description: 'Numeric ID of the list that receives the contacts, from List Contact Lists.',
		}),
		sourceListId: Property.Number({
			displayName: 'Source List ID',
			description: 'Numeric ID of the list the contacts come from.',
			required: true,
		}),
		action: mailjetAiProps.listAction({
			description: 'What to do in the destination list with each contact of the source list.',
		}),
	},
	async run(context) {
		const p = context.propsValue;
		return await mailjetApi.post({
			auth: context.auth,
			path: `/v3/REST/contactslist/${encodeURIComponent(p.listId)}/importlist`,
			body: { ListID: p.sourceListId, Action: p.action },
		});
	},
});
