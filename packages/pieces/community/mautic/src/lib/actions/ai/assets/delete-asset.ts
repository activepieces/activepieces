import { createAction } from '@activepieces/pieces-framework';

import { mauticDeleteAssetOutputSchema } from './output-schemas';
import { mauticAuth } from '../../../auth';
import { mauticAiProps } from '../../../common/ai-props';
import { mauticApi } from '../../../common/api';

export const mauticDeleteAssetAction = createAction({
	auth: mauticAuth,
	name: 'mautic_delete_asset',
	outputSchema: mauticDeleteAssetOutputSchema,
	displayName: 'Delete Asset',
	description: 'Permanently deletes a Mautic asset.',
	audience: 'ai',
	classification: 'DESTRUCTIVE',
	aiMetadata: {
		description: 'Permanently deletes an asset and its download stats. Cannot be undone.',
		idempotent: false,
	},
	props: {
		id: mauticAiProps.recordId({
			displayName: 'Asset Id',
			description: 'Numeric asset id, from List Assets or Create Asset.',
		}),
	},
	async run(context) {
		return await mauticApi.deleteRecord({
			auth: context.auth,
			resource: 'assets',
			id: context.propsValue.id,
		});
	},
});
