import { createAction, Property } from '@activepieces/pieces-framework';

import { confluenceAuth } from '../../auth';
import { confluenceAiProps } from '../../common/ai-props';
import { confluenceApi } from '../../common/api';
import { confluenceRemoveSpaceLabelOutputSchema } from '../../output-schemas';

export const removeSpaceLabelAction = createAction({
	auth: confluenceAuth,
	name: 'confluence_remove_space_label',
	outputSchema: confluenceRemoveSpaceLabelOutputSchema,
	displayName: 'Remove Space Label',
	description: 'Removes a label from a space.',
	audience: 'ai',
	classification: 'WRITE',
	aiMetadata: {
		description:
			'Removes one label by name from a Confluence space identified by its key. Fails if the label is not on the space.',
		idempotent: false,
	},
	props: {
		spaceKey: confluenceAiProps.spaceKey({ required: true }),
		label: Property.ShortText({
			displayName: 'Label',
			description: 'Name of the label to remove.',
			required: true,
		}),
		prefix: Property.StaticDropdown({
			displayName: 'Prefix',
			description: 'Prefix of the label to remove.',
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
		const { spaceKey, label, prefix } = context.propsValue;
		await confluenceApi.removeSpaceLabel({ auth: context.auth, spaceKey, name: label, prefix });
		return { removed: true, spaceKey, label };
	},
});
