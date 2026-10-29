import { createAction } from '@activepieces/pieces-framework';

import { mauticAdjustContactPointsOutputSchema } from './output-schemas';
import { mauticAuth } from '../../../auth';
import { mauticAiProps } from '../../../common/ai-props';
import { mauticApi } from '../../../common/api';

export const mauticAddContactToSegmentAction = createAction({
	auth: mauticAuth,
	name: 'mautic_add_contact_to_segment',
	outputSchema: mauticAdjustContactPointsOutputSchema,
	displayName: 'Add Contact to Segment',
	description: 'Adds a contact to a Mautic segment.',
	audience: 'ai',
	classification: 'WRITE',
	aiMetadata: {
		description:
			'Adds one contact to a segment manually. Repeating it leaves the contact in the segment. Use Add Contacts to Segment for many.',
		idempotent: true,
	},
	props: {
		id: mauticAiProps.recordId({
			displayName: 'Segment Id',
			description: 'Numeric segment id, from List Segments or Create Segment.',
		}),
		contactId: mauticAiProps.recordId({
			displayName: 'Contact Id',
			description: 'Numeric contact id, from List Contacts.',
		}),
	},
	async run(context) {
		return await mauticApi.changeMembership({
			auth: context.auth,
			resource: 'segments',
			id: context.propsValue.id,
			contactId: context.propsValue.contactId,
			change: 'add',
		});
	},
});
