import { createAction, Property } from '@activepieces/pieces-framework';
import { confluenceAuth } from '../auth';
import { confluenceApi } from '../common/api';
import { confluenceProps } from '../common/props';
import { removeLabelOutputSchema } from '../output-schemas';

export const removeLabelAction = createAction({
	auth: confluenceAuth,
	name: 'remove-label',
	outputSchema: removeLabelOutputSchema,
	classification: 'WRITE',
	displayName: 'Remove Label from Page',
	description: 'Removes a label from a page.',
	audience: 'human',
	aiMetadata: { description: 'Removes a single label, by name, from a Confluence page. Use to untag a page. Requires the page ID and the label name. Effectively idempotent — re-running after the label is gone leaves the page\'s label set unchanged.', idempotent: true },
	props: {
		spaceId: confluenceProps.spaceId({ required: true }),
		pageId: confluenceProps.pageId({ required: true }),
		label: Property.ShortText({
			displayName: 'Label',
			description: 'Label name to remove.',
			required: true,
		}),
	},
	async run(context) {
		const { pageId, label } = context.propsValue;

		await confluenceApi.removeLabel({ auth: context.auth, pageId, label });

		return { success: true, pageId, label };
	},
});
