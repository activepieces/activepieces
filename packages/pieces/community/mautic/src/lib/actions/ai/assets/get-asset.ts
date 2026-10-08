import { createAction } from '@activepieces/pieces-framework';

import { mauticGetAssetOutputSchema } from './output-schemas';
import { mauticAuth } from '../../../auth';
import { mauticAiProps } from '../../../common/ai-props';
import { mauticApi } from '../../../common/api';

export const mauticGetAssetAction = createAction({
	auth: mauticAuth,
	name: 'mautic_get_asset',
	outputSchema: mauticGetAssetOutputSchema,
	displayName: 'Get Asset',
	description: 'Gets one Mautic asset by id.',
	audience: 'ai',
	classification: 'READ',
	aiMetadata: {
		description: 'Gets a single asset by its numeric id, with its download URL.',
		idempotent: true,
	},
	props: {
		id: mauticAiProps.recordId({
			displayName: 'Asset Id',
			description: 'Numeric asset id, from List Assets or Create Asset.',
		}),
	},
	async run(context) {
		return await mauticApi.getRecord({
			auth: context.auth,
			resource: 'assets',
			id: context.propsValue.id,
		});
	},
});
