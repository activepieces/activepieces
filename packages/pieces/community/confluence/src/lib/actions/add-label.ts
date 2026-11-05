import { createAction, Property } from '@activepieces/pieces-framework';
import { confluenceAuth } from '../auth';
import { confluenceApi } from '../common/api';
import { confluenceProps } from '../common/props';
import { confluenceAddLabelsOutputSchema } from '../output-schemas';

export const addLabelAction = createAction({
	auth: confluenceAuth,
	name: 'add-label',
	outputSchema: confluenceAddLabelsOutputSchema,
	classification: 'WRITE',
	displayName: 'Add Label to Page',
	description: 'Adds one or more labels to a page.',
	audience: 'human',
	aiMetadata: { description: 'Adds one or more labels to a Confluence page, with a selectable prefix (global, personal/my, or team) applied to all labels in the call. Use to tag or categorize a page. Requires the page ID and at least one label name. Effectively idempotent — re-adding an existing label leaves the page\'s label set unchanged.', idempotent: true },
	props: {
		spaceId: confluenceProps.spaceId({ required: true }),
		pageId: confluenceProps.pageId({ required: true }),
		labels: Property.Array({
			displayName: 'Labels',
			description: 'Label names to add (one per row).',
			required: true,
		}),
		prefix: Property.StaticDropdown({
			displayName: 'Prefix',
			required: true,
			defaultValue: 'global',
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
		const { pageId, labels, prefix } = context.propsValue;

		return await confluenceApi.addLabels({
			auth: context.auth,
			pageId,
			prefix,
			names: labels,
		});
	},
});
