import { Property, createAction } from '@activepieces/pieces-framework';
import { activeCampaignAuth } from '../../auth';
import { makeClient } from '../../common';
import { aiInput, aiOutput } from '../../common/ai-props';
import { createTagOutputSchema } from '../../common/output-schemas';
import { acData } from '../../common/types';

export const createTagAction = createAction({
	auth: activeCampaignAuth,
	name: 'activecampaign_create_tag',
	classification: 'WRITE',
	displayName: 'Create Tag',
	description: 'Creates a contact tag, or returns the existing tag with the same name.',
	audience: 'ai',
	aiMetadata: {
		description:
			'Creates a contact tag and returns its ID. When a tag with this name already exists, ActiveCampaign returns that tag unchanged (its description is not updated) instead of creating a second one, so it is safe to repeat.',
		idempotent: true,
	},
	outputSchema: createTagOutputSchema,
	props: {
		name: Property.ShortText({ displayName: 'Name', required: true }),
		description: Property.LongText({ displayName: 'Description', required: false }),
	},
	async run({ auth, propsValue }) {
		const tag = {
			tag: aiInput.requireText({ value: propsValue.name, label: 'Name' }),
			tagType: 'contact',
			description: aiInput.optionalText(propsValue.description),
		};
		const response = await makeClient(auth.props).request({ method: 'POST', path: '/tags', body: { tag } });
		return aiOutput.idText({ record: acData.recordAt({ value: response.body, key: 'tag' }), keys: ['id', 'tag', 'tagType', 'description', 'cdate'] });
	},
});
