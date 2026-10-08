import { createAction } from '@activepieces/pieces-framework';

import { mauticAdjustContactPointsOutputSchema } from './output-schemas';
import { mauticAuth } from '../../../auth';
import { mauticAiProps } from '../../../common/ai-props';
import { mauticApi } from '../../../common/api';

export const mauticAddContactToStageAction = createAction({
	auth: mauticAuth,
	name: 'mautic_add_contact_to_stage',
	outputSchema: mauticAdjustContactPointsOutputSchema,
	displayName: 'Add Contact to Stage',
	description: 'Adds a contact to a Mautic stage.',
	audience: 'ai',
	classification: 'WRITE',
	aiMetadata: {
		description:
			'Moves a contact into a stage, replacing its current stage. Repeating it leaves the contact in the stage.',
		idempotent: true,
	},
	props: {
		id: mauticAiProps.recordId({
			displayName: 'Stage Id',
			description: 'Numeric stage id, from List Stages or Create Stage.',
		}),
		contactId: mauticAiProps.recordId({
			displayName: 'Contact Id',
			description: 'Numeric contact id, from List Contacts.',
		}),
	},
	async run(context) {
		return await mauticApi.changeMembership({
			auth: context.auth,
			resource: 'stages',
			id: context.propsValue.id,
			contactId: context.propsValue.contactId,
			change: 'add',
		});
	},
});
