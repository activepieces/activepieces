import { createAction, Property } from '@activepieces/pieces-framework';

import { confluenceAuth } from '../../auth';
import { confluenceApi } from '../../common/api';
import { confluenceAddLabelsOutputSchema } from '../../output-schemas';

export const addLabelsAction = createAction({
	auth: confluenceAuth,
	name: 'confluence_add_labels',
	outputSchema: confluenceAddLabelsOutputSchema,
	displayName: 'Add Labels',
	description: 'Adds labels to a page, blog post or attachment.',
	audience: 'ai',
	classification: 'WRITE',
	aiMetadata: {
		description:
			'Adds one or more labels, all with the same prefix, to a Confluence page, blog post or attachment. Idempotent: adding a label that is already there leaves the labels unchanged.',
		idempotent: true,
	},
	props: {
		contentId: Property.ShortText({
			displayName: 'Content ID',
			description:
				'ID of the page, blog post or attachment, from List Pages, List Blog Posts or List Page Attachments.',
			required: true,
		}),
		labels: Property.Array({
			displayName: 'Labels',
			description: 'Label names to add, lowercase without spaces, e.g. "release-notes".',
			required: true,
		}),
		prefix: Property.StaticDropdown({
			displayName: 'Prefix',
			description: 'Label prefix. Defaults to global.',
			required: false,
			options: {
				disabled: false,
				options: [
					{ label: 'Global', value: 'global' },
					{ label: 'My (personal)', value: 'my' },
					{ label: 'Team', value: 'team' },
				],
			},
		}),
	},
	async run(context) {
		const { contentId, labels, prefix } = context.propsValue;
		if (
			labels.length === 0 ||
			!labels.every((label): label is string => typeof label === 'string' && label !== '')
		) {
			throw new Error('Labels must be a non-empty list of label names.');
		}
		return await confluenceApi.addLabels({
			auth: context.auth,
			pageId: contentId,
			prefix: prefix ?? 'global',
			names: labels,
		});
	},
});
