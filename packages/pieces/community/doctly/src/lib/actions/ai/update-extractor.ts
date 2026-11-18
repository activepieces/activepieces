import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { doctlyAuth } from '../../auth';
import { doctlyClient } from '../../common/client';
import { doctlyAiProps } from '../../common/ai-props';
import { doctlyGetExtractorOutputSchema } from '../../output-schemas';

export const updateExtractorAction = createAction({
	auth: doctlyAuth,
	name: 'doctly_update_extractor',
	outputSchema: doctlyGetExtractorOutputSchema,
	displayName: 'Update Extractor',
	description: 'Updates an extractor\'s name, slug or description.',
	audience: 'ai',
	classification: 'WRITE',
	aiMetadata: {
		description:
			'Changes an extractor\'s name, slug or description; fields left out stay as they are. Changing the slug changes what Run Extractor takes. Get the id from List Extractors.',
		idempotent: true,
	},
	props: {
		extractorId: doctlyAiProps.extractorId({ required: true }),
		name: Property.ShortText({ displayName: 'Name', description: 'New name, up to 255 characters.', required: false }),
		slug: Property.ShortText({ displayName: 'Slug', description: 'New slug, 3 to 100 characters, e.g. "invoice-parser".', required: false }),
		description: Property.LongText({ displayName: 'Description', description: 'New description, up to 1000 characters.', required: false }),
	},
	async run(context) {
		const { extractorId, name, slug, description } = context.propsValue;
		if (name === undefined && slug === undefined && description === undefined) {
			throw new Error('Set at least one of name, slug or description.');
		}
		return await doctlyClient.request({
			auth: context.auth,
			method: HttpMethod.PUT,
			path: `/e/${encodeURIComponent(extractorId)}`,
			body: {
				...(name !== undefined ? { name } : {}),
				...(slug !== undefined ? { slug } : {}),
				...(description !== undefined ? { description } : {}),
			},
		});
	},
});
