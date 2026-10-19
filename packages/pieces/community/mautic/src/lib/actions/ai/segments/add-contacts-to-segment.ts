import { Property, createAction } from '@activepieces/pieces-framework';

import { mauticAddContactsToSegmentOutputSchema } from './output-schemas';
import { mauticAuth } from '../../../auth';
import { mauticAiProps } from '../../../common/ai-props';
import { mauticApi } from '../../../common/api';
import { mauticUtils } from '../../../common/utils';

export const mauticAddContactsToSegmentAction = createAction({
	auth: mauticAuth,
	name: 'mautic_add_contacts_to_segment',
	outputSchema: mauticAddContactsToSegmentOutputSchema,
	displayName: 'Add Contacts to Segment',
	description: 'Adds several contacts to a Mautic segment.',
	audience: 'ai',
	classification: 'WRITE',
	aiMetadata: {
		description:
			'Adds many contacts to a segment in one request. The response reports success per contact id. Repeating it leaves the contacts in the segment.',
		idempotent: true,
	},
	props: {
		id: mauticAiProps.recordId({
			displayName: 'Segment Id',
			description: 'Numeric segment id, from List Segments or Create Segment.',
		}),
		contactIds: Property.Array({
			displayName: 'Contact Ids',
			description: 'Numeric contact ids, from List Contacts.',
			required: true,
		}),
	},
	async run(context) {
		return await mauticApi.addContactsToSegment({
			auth: context.auth,
			id: context.propsValue.id,
			contactIds: mauticUtils.toBatchIds({ ids: context.propsValue.contactIds }),
		});
	},
});
