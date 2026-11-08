import { createAction } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { doctlyAuth } from '../../auth';
import { doctlyClient } from '../../common/client';
import { doctlyAiProps } from '../../common/ai-props';
import { doctlyGetExtractorOutputSchema } from '../../output-schemas';

export const remixExtractorAction = createAction({
	auth: doctlyAuth,
	name: 'doctly_remix_extractor',
	outputSchema: doctlyGetExtractorOutputSchema,
	displayName: 'Remix Extractor',
	description: 'Creates an editable copy of an extractor.',
	audience: 'ai',
	classification: 'WRITE',
	aiMetadata: {
		description: 'Creates a new, editable copy of an extractor in the account and returns it. Fails when the extractor\'s edit policy is NO_EDIT. Get the id from List Extractors; each call creates another copy.',
		idempotent: false,
	},
	props: {
		extractorId: doctlyAiProps.extractorId({ required: true }),
	},
	async run(context) {
		return await doctlyClient.request({
			auth: context.auth,
			method: HttpMethod.POST,
			path: `/e/${encodeURIComponent(context.propsValue.extractorId)}/remix`,
		});
	},
});
