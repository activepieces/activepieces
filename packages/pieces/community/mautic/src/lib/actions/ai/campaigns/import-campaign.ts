import { createAction } from '@activepieces/pieces-framework';

import { mauticAuth } from '../../../auth';
import { mauticAiProps } from '../../../common/ai-props';
import { mauticApi } from '../../../common/api';
import { mauticUtils } from '../../../common/utils';

export const mauticImportCampaignAction = createAction({
	auth: mauticAuth,
	name: 'mautic_import_campaign',
	displayName: 'Import Campaign',
	description: 'Imports a Mautic campaign from an export.',
	audience: 'ai',
	classification: 'WRITE',
	aiMetadata: {
		description:
			'Imports a campaign from the "export" array returned by Export Campaign. Each call creates new records. Needs Mautic 7.',
		idempotent: false,
	},
	props: {
		data: mauticAiProps.records({ description: 'The "export" array from Export Campaign.' }),
	},
	async run(context) {
		return await mauticApi.importCampaign({
			auth: context.auth,
			data: mauticUtils.toBatchRecords({ records: context.propsValue.data }),
		});
	},
});
