import { createAction } from '@activepieces/pieces-framework';

import { mauticListPointTriggerEventTypesOutputSchema } from './output-schemas';
import { mauticAuth } from '../../../auth';
import { mauticApi } from '../../../common/api';

export const mauticListPointTriggerEventTypesAction = createAction({
	auth: mauticAuth,
	name: 'mautic_list_point_trigger_event_types',
	outputSchema: mauticListPointTriggerEventTypesOutputSchema,
	displayName: 'List Point Trigger Event Types',
	description: 'Lists the Mautic point trigger event types.',
	audience: 'ai',
	classification: 'SEARCH',
	aiMetadata: {
		description: 'Lists the event type keys and labels that point trigger events take as "type".',
		idempotent: true,
	},
	props: {},
	async run(context) {
		return await mauticApi.listPointTypes({ auth: context.auth, kind: 'triggers/events' });
	},
});
