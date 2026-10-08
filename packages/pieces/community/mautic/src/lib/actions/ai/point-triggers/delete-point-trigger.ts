import { createAction } from '@activepieces/pieces-framework';

import { mauticDeletePointTriggerOutputSchema } from './output-schemas';
import { mauticAuth } from '../../../auth';
import { mauticAiProps } from '../../../common/ai-props';
import { mauticApi } from '../../../common/api';

export const mauticDeletePointTriggerAction = createAction({
	auth: mauticAuth,
	name: 'mautic_delete_point_trigger',
	outputSchema: mauticDeletePointTriggerOutputSchema,
	displayName: 'Delete Point Trigger',
	description: 'Permanently deletes a Mautic point trigger.',
	audience: 'ai',
	classification: 'DESTRUCTIVE',
	aiMetadata: {
		description: 'Permanently deletes a point trigger and its events. Cannot be undone.',
		idempotent: false,
	},
	props: {
		id: mauticAiProps.recordId({
			displayName: 'Point Trigger Id',
			description: 'Numeric point trigger id, from List Point Triggers or Create Point Trigger.',
		}),
	},
	async run(context) {
		return await mauticApi.deleteRecord({
			auth: context.auth,
			resource: 'points/triggers',
			id: context.propsValue.id,
		});
	},
});
