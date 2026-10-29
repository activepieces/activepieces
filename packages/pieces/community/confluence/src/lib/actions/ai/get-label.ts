import { createAction, Property } from '@activepieces/pieces-framework';

import { confluenceAuth } from '../../auth';
import { confluenceApi } from '../../common/api';
import { confluenceGetLabelOutputSchema } from '../../output-schemas';

export const getLabelAction = createAction({
	auth: confluenceAuth,
	name: 'confluence_get_label',
	outputSchema: confluenceGetLabelOutputSchema,
	displayName: 'Get Label',
	description: 'Looks up a label by name, with the content that uses it.',
	audience: 'ai',
	classification: 'SEARCH',
	aiMetadata: {
		description:
			'Looks up a Confluence label by name and returns its ID plus a page of the content carrying it. Use the label ID with List Pages for Label or List Blog Posts for Label.',
		idempotent: true,
	},
	props: {
		name: Property.ShortText({
			displayName: 'Name',
			description: 'Label name, e.g. "release-notes".',
			required: true,
		}),
		type: Property.StaticDropdown({
			displayName: 'Content Type',
			description: 'Only return content of this type.',
			required: false,
			options: {
				disabled: false,
				options: [
					{ label: 'Page', value: 'page' },
					{ label: 'Blog post', value: 'blogpost' },
					{ label: 'Attachment', value: 'attachment' },
					{ label: 'Page template', value: 'page_template' },
				],
			},
		}),
		start: Property.Number({
			displayName: 'Start',
			description: 'Offset into the associated content. Defaults to 0.',
			required: false,
		}),
		limit: Property.Number({
			displayName: 'Limit',
			description: 'Maximum associated content items to return (1-200). Defaults to 25.',
			required: false,
		}),
	},
	async run(context) {
		const { name, type, start, limit } = context.propsValue;
		return await confluenceApi.getLabel({
			auth: context.auth,
			name,
			type,
			start,
			limit: limit ?? 25,
		});
	},
});
