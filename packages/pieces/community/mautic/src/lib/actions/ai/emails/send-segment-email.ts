import { Property, createAction, spreadIfDefined } from '@activepieces/pieces-framework';

import { mauticSendSegmentEmailOutputSchema } from './output-schemas';
import { mauticAuth } from '../../../auth';
import { mauticAiProps } from '../../../common/ai-props';
import { mauticApi } from '../../../common/api';

export const mauticSendSegmentEmailAction = createAction({
	auth: mauticAuth,
	name: 'mautic_send_segment_email',
	outputSchema: mauticSendSegmentEmailOutputSchema,
	displayName: 'Send Segment Email',
	description: 'Sends a Mautic segment email to its segments.',
	audience: 'ai',
	classification: 'WRITE',
	aiMetadata: {
		description:
			'Sends a segment email (email type "list") to the contacts of its segments, or only to the given segment ids. Contacts already sent this email are skipped, but contacts added since the last send receive it, so a repeat can send more. Returns the sent count and failed recipients.',
		idempotent: false,
	},
	props: {
		id: mauticAiProps.recordId({
			displayName: 'Email Id',
			description: 'Numeric email id, from List Emails or Create Email.',
		}),
		lists: Property.Array({
			displayName: 'Segment Ids',
			description:
				"Send only to these segment ids, from List Segments. Leave empty for all of the email's segments.",
			required: false,
		}),
		limit: Property.Number({
			displayName: 'Limit',
			description: 'Maximum number of contacts to send to in this call.',
			required: false,
		}),
	},
	async run(context) {
		const { id, lists, limit } = context.propsValue;
		return await mauticApi.sendSegmentEmail({
			auth: context.auth,
			id,
			body: {
				...spreadIfDefined('lists', lists),
				...spreadIfDefined('limit', limit),
			},
		});
	},
});
