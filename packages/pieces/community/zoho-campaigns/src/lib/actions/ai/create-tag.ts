import { createAction, Property } from '@activepieces/pieces-framework';

import { zohoCampaignsAuth } from '../../auth';
import { zohoCampaignsApi } from '../../common/api';
import { zohoCampaignsUtils } from '../../common/utils';
import { zohoCampaignsCreateTagOutputSchema } from '../../output-schemas';

export const createTagAction = createAction({
	auth: zohoCampaignsAuth,
	name: 'zoho_campaigns_create_tag',
	outputSchema: zohoCampaignsCreateTagOutputSchema,
	displayName: 'Create Tag',
	description: 'Creates a contact tag.',
	audience: 'ai',
	classification: 'WRITE',
	aiMetadata: {
		description:
			'Creates a contact tag. A tag name that already exists fails, so check List Tags first, or use Add Tag to Contact, which creates a missing tag itself. Not idempotent.',
		idempotent: false,
	},
	props: {
		tagName: Property.ShortText({
			displayName: 'Tag Name',
			description: 'Name of the tag, as shown by List Tags.',
			required: true,
		}),
		description: Property.ShortText({
			displayName: 'Description',
			description: 'Short description of the tag.',
			required: false,
		}),
		color: Property.ShortText({
			displayName: 'Color',
			description: 'Hex color of the tag, e.g. "#48b9d1". Defaults to #ec676c.',
			required: false,
		}),
	},
	async run({ auth, propsValue }) {
		const body = await zohoCampaignsApi.createTag({
			auth,
			tagName: propsValue.tagName,
			tagDesc: propsValue.description,
			color: propsValue.color,
		});
		return zohoCampaignsUtils.assertSuccess({ body });
	},
});
