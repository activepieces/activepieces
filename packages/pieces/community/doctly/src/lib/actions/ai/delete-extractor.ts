import { createAction } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { doctlyAuth } from '../../auth';
import { doctlyClient } from '../../common/client';
import { doctlyAiProps } from '../../common/ai-props';
import { doctlyDeleteDocumentOutputSchema } from '../../output-schemas';

export const deleteExtractorAction = createAction({
	auth: doctlyAuth,
	name: 'doctly_delete_extractor',
	outputSchema: doctlyDeleteDocumentOutputSchema,
	displayName: 'Delete Extractor',
	description: 'Deletes an extractor from the account.',
	audience: 'ai',
	classification: 'DESTRUCTIVE',
	aiMetadata: {
		description: 'Removes an extractor from the account so it no longer appears or runs (Doctly deactivates it). Only extractors marked deletable by the user can be deleted. Get the id from List Extractors.',
		idempotent: false,
	},
	props: {
		extractorId: doctlyAiProps.extractorId({ required: true }),
	},
	async run(context) {
		return await doctlyClient.request({
			auth: context.auth,
			method: HttpMethod.DELETE,
			path: `/e/${encodeURIComponent(context.propsValue.extractorId)}`,
		});
	},
});
