import { createAction } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { doctlyAuth } from '../../auth';
import { doctlyClient } from '../../common/client';
import { doctlyAiProps } from '../../common/ai-props';
import { doctlyGetExtractorUpgradeInfoOutputSchema } from '../../output-schemas';

export const getExtractorUpgradeInfoAction = createAction({
	auth: doctlyAuth,
	name: 'doctly_get_extractor_upgrade_info',
	outputSchema: doctlyGetExtractorUpgradeInfoOutputSchema,
	displayName: 'Get Extractor Upgrade Info',
	description: 'Checks whether a newer version of an extractor is available.',
	audience: 'ai',
	classification: 'READ',
	aiMetadata: {
		description: 'Checks whether a newer catalog version of an extractor is available, and which version it is on now. Call before Upgrade Extractor. Get the id from List Extractors.',
		idempotent: true,
	},
	props: {
		extractorId: doctlyAiProps.extractorId({ required: true }),
	},
	async run(context) {
		return await doctlyClient.request({
			auth: context.auth,
			method: HttpMethod.GET,
			path: `/e/${encodeURIComponent(context.propsValue.extractorId)}/upgrade-info`,
		});
	},
});
