import { createAction, Property } from '@activepieces/pieces-framework';

import { confluenceAuth } from '../../auth';
import { confluenceAiProps } from '../../common/ai-props';
import { confluenceApi } from '../../common/api';
import { confluenceAddSpaceLabelsOutputSchema } from '../../output-schemas';

export const addSpaceLabelsAction = createAction({
	auth: confluenceAuth,
	name: 'confluence_add_space_labels',
	outputSchema: confluenceAddSpaceLabelsOutputSchema,
	displayName: 'Add Space Labels',
	description: 'Adds labels to a space.',
	audience: 'ai',
	classification: 'WRITE',
	aiMetadata: {
		description:
			'Adds one or more labels (space categories), all with the same prefix, to a Confluence space identified by its key. Idempotent: adding a label that is already there leaves the labels unchanged.',
		idempotent: true,
	},
	props: {
		spaceKey: confluenceAiProps.spaceKey({ required: true }),
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
		const { spaceKey, labels, prefix } = context.propsValue;
		if (
			labels.length === 0 ||
			!labels.every((label): label is string => typeof label === 'string' && label !== '')
		) {
			throw new Error('Labels must be a non-empty list of label names.');
		}
		return await confluenceApi.addSpaceLabels({
			auth: context.auth,
			spaceKey,
			prefix: prefix ?? 'global',
			names: labels,
		});
	},
});
