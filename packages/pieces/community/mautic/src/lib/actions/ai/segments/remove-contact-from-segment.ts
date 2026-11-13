import { createAction } from '@activepieces/pieces-framework';

import { mauticAdjustContactPointsOutputSchema } from './output-schemas';
import { mauticAuth } from '../../../auth';
import { mauticAiProps } from '../../../common/ai-props';
import { mauticApi } from '../../../common/api';

export const mauticRemoveContactFromSegmentAction = createAction({
	auth: mauticAuth,
	name: 'mautic_remove_contact_from_segment',
	outputSchema: mauticAdjustContactPointsOutputSchema,
	displayName: 'Remove Contact from Segment',
	description: 'Removes a contact from a Mautic segment.',
	audience: 'ai',
	classification: 'WRITE',
	aiMetadata: {
		description:
			'Removes a contact from a segment manually; a filter-based segment will not add it back. Repeating it leaves the contact out.',
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
			change: 'remove',
		});
	},
});
