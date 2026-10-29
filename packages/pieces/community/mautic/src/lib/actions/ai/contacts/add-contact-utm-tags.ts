import { Property, createAction, spreadIfDefined } from '@activepieces/pieces-framework';

import { mauticAddContactUtmTagsOutputSchema } from './output-schemas';
import { mauticAuth } from '../../../auth';
import { mauticAiProps } from '../../../common/ai-props';
import { mauticApi } from '../../../common/api';

export const mauticAddContactUtmTagsAction = createAction({
	auth: mauticAuth,
	name: 'mautic_add_contact_utm_tags',
	outputSchema: mauticAddContactUtmTagsOutputSchema,
	displayName: 'Add Contact UTM Tags',
	description: 'Records a set of UTM tags on a Mautic contact.',
	audience: 'ai',
	classification: 'WRITE',
	aiMetadata: {
		description:
			'Records one UTM tag entry (campaign, source, medium, content, term, URL, referrer) on a contact. Each call adds a new entry. Returns the contact with its UTM tags; each entry id is what Remove Contact UTM Tags takes.',
		idempotent: false,
	},
	props: {
		id: mauticAiProps.recordId({
			displayName: 'Contact Id',
			description: 'Numeric contact id, from List Contacts or Create Contact.',
		}),
		utm_campaign: Property.ShortText({ displayName: 'UTM Campaign', required: false }),
		utm_source: Property.ShortText({ displayName: 'UTM Source', required: false }),
		utm_medium: Property.ShortText({ displayName: 'UTM Medium', required: false }),
		utm_content: Property.ShortText({ displayName: 'UTM Content', required: false }),
		utm_term: Property.ShortText({ displayName: 'UTM Term', required: false }),
		url: Property.ShortText({ displayName: 'Page URL', required: false }),
		referer: Property.ShortText({ displayName: 'Referrer URL', required: false }),
		query: Property.ShortText({
			displayName: 'Query',
			description: 'Extra query parameters as a query string, e.g. "cid=abc&cond=new".',
			required: false,
		}),
		userAgent: Property.ShortText({
			displayName: 'User Agent',
			description: 'Browser user agent; Mautic records a device for it.',
			required: false,
		}),
		remotehost: Property.ShortText({ displayName: 'Remote Host', required: false }),
		lastActive: Property.ShortText({
			displayName: 'Last Active',
			description:
				'When the visit happened, e.g. "2026-01-17T00:30:08+00:00". Also updates the contact\'s last active date.',
			required: false,
		}),
	},
	async run(context) {
		const { id, userAgent, ...utm } = context.propsValue;
		return await mauticApi.addContactUtmTags({
			auth: context.auth,
			id,
			body: { ...utm, ...spreadIfDefined('Useragent', userAgent) },
		});
	},
});
