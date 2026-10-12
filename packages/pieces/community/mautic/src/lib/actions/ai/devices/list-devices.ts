import { createAction } from '@activepieces/pieces-framework';

import { mauticListDevicesOutputSchema } from './output-schemas';
import { mauticAuth } from '../../../auth';
import { mauticAiProps } from '../../../common/ai-props';
import { mauticApi } from '../../../common/api';

export const mauticListDevicesAction = createAction({
	auth: mauticAuth,
	name: 'mautic_list_devices',
	outputSchema: mauticListDevicesOutputSchema,
	displayName: 'List Devices',
	description: 'Lists Mautic devices.',
	audience: 'ai',
	classification: 'SEARCH',
	aiMetadata: {
		description:
			'Lists the devices tracked for contacts. Use List Contact Devices for one contact. Page with Start and Limit; the response has the total count.',
		idempotent: true,
	},
	props: {
		...mauticAiProps.filterOptions,
	},
	async run(context) {
		return await mauticApi.listRecords({
			auth: context.auth,
			resource: 'devices',
			key: 'devices',
			query: context.propsValue,
		});
	},
});
