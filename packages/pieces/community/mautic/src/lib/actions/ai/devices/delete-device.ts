import { createAction } from '@activepieces/pieces-framework';

import { mauticDeleteDeviceOutputSchema } from './output-schemas';
import { mauticAuth } from '../../../auth';
import { mauticAiProps } from '../../../common/ai-props';
import { mauticApi } from '../../../common/api';

export const mauticDeleteDeviceAction = createAction({
	auth: mauticAuth,
	name: 'mautic_delete_device',
	outputSchema: mauticDeleteDeviceOutputSchema,
	displayName: 'Delete Device',
	description: 'Permanently deletes a Mautic device.',
	audience: 'ai',
	classification: 'DESTRUCTIVE',
	aiMetadata: {
		description: 'Permanently deletes a device record. Cannot be undone.',
		idempotent: false,
	},
	props: {
		id: mauticAiProps.recordId({
			displayName: 'Device Id',
			description: 'Numeric device id, from List Devices or Create Device.',
		}),
	},
	async run(context) {
		return await mauticApi.deleteRecord({
			auth: context.auth,
			resource: 'devices',
			id: context.propsValue.id,
		});
	},
});
