import { createAction } from '@activepieces/pieces-framework';

import { mauticGetDeviceOutputSchema } from './output-schemas';
import { mauticAuth } from '../../../auth';
import { mauticAiProps } from '../../../common/ai-props';
import { mauticApi } from '../../../common/api';

export const mauticGetDeviceAction = createAction({
	auth: mauticAuth,
	name: 'mautic_get_device',
	outputSchema: mauticGetDeviceOutputSchema,
	displayName: 'Get Device',
	description: 'Gets one Mautic device by id.',
	audience: 'ai',
	classification: 'READ',
	aiMetadata: {
		description: 'Gets a single device by its numeric id, with its contact.',
		idempotent: true,
	},
	props: {
		id: mauticAiProps.recordId({
			displayName: 'Device Id',
			description: 'Numeric device id, from List Devices or Create Device.',
		}),
	},
	async run(context) {
		return await mauticApi.getRecord({
			auth: context.auth,
			resource: 'devices',
			id: context.propsValue.id,
		});
	},
});
