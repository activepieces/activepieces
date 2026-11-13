import { createAction } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { doctlyAuth } from '../../auth';
import { doctlyClient } from '../../common/client';
import { doctlyAiProps } from '../../common/ai-props';
import { doctlyGetExtractorOutputSchema } from '../../output-schemas';

export const getExtractorAction = createAction({
	auth: doctlyAuth,
	name: 'doctly_get_extractor',
	outputSchema: doctlyGetExtractorOutputSchema,
	displayName: 'Get Extractor',
	description: 'Gets an extractor by id.',
	audience: 'ai',
	classification: 'READ',
	aiMetadata: {
		description: 'Reads one extractor by id: its name, slug, cost and whether it can be edited, remixed or deleted. Get the id from List Extractors.',
		idempotent: true,
	},
	props: {
		extractorId: doctlyAiProps.extractorId({ required: true }),
	},
	async run(context) {
		return await doctlyClient.request({
			auth: context.auth,
			method: HttpMethod.GET,
			path: `/e/${encodeURIComponent(context.propsValue.extractorId)}`,
		});
	},
});
