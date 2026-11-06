import { createAction } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { doctlyAuth } from '../../auth';
import { doctlyClient } from '../../common/client';
import { doctlyAiProps } from '../../common/ai-props';
import { doctlyUpgradeExtractorOutputSchema } from '../../output-schemas';

export const upgradeExtractorAction = createAction({
	auth: doctlyAuth,
	name: 'doctly_upgrade_extractor',
	outputSchema: doctlyUpgradeExtractorOutputSchema,
	displayName: 'Upgrade Extractor',
	description: 'Upgrades an extractor to its latest version.',
	audience: 'ai',
	classification: 'WRITE',
	aiMetadata: {
		description: 'Upgrades an extractor to the latest catalog version and returns the updated extractor; this changes how future runs extract data. Check Get Extractor Upgrade Info first. Get the id from List Extractors.',
		idempotent: false,
	},
	props: {
		extractorId: doctlyAiProps.extractorId({ required: true }),
	},
	async run(context) {
		return await doctlyClient.request({
			auth: context.auth,
			method: HttpMethod.POST,
			path: `/e/${encodeURIComponent(context.propsValue.extractorId)}/upgrade`,
		});
	},
});
