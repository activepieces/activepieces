import { createAction } from '@activepieces/pieces-framework';

import { mauticAdjustContactPointsOutputSchema } from './output-schemas';
import { mauticAuth } from '../../../auth';
import { mauticAiProps } from '../../../common/ai-props';
import { mauticApi } from '../../../common/api';

export const mauticRemoveContactFromStageAction = createAction({
	auth: mauticAuth,
	name: 'mautic_remove_contact_from_stage',
	outputSchema: mauticAdjustContactPointsOutputSchema,
	displayName: 'Remove Contact from Stage',
	description: 'Removes a contact from a Mautic stage.',
	audience: 'ai',
	classification: 'WRITE',
	aiMetadata: {
		description:
			'Takes a contact out of a stage, leaving it without a stage. Repeating it changes nothing.',
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
			change: 'remove',
		});
	},
});
