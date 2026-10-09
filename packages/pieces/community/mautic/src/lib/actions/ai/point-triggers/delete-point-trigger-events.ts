import { Property, createAction } from '@activepieces/pieces-framework';

import { mauticDeletePointTriggerEventsOutputSchema } from './output-schemas';
import { mauticAuth } from '../../../auth';
import { mauticAiProps } from '../../../common/ai-props';
import { mauticApi } from '../../../common/api';
import { mauticUtils } from '../../../common/utils';

export const mauticDeletePointTriggerEventsAction = createAction({
	auth: mauticAuth,
	name: 'mautic_delete_point_trigger_events',
	outputSchema: mauticDeletePointTriggerEventsOutputSchema,
	displayName: 'Delete Point Trigger Events',
	description: 'Removes events from a Mautic point trigger.',
	audience: 'ai',
	classification: 'DESTRUCTIVE',
	aiMetadata: {
		description:
			'Removes events from a point trigger by id. Repeating it with the same ids changes nothing. Returns the trigger.',
		idempotent: true,
	},
	props: {
		triggerId: mauticAiProps.recordId({
			displayName: 'Point Trigger Id',
			description: 'Numeric point trigger id, from List Point Triggers.',
		}),
		ids: Property.Array({
			displayName: 'Event Ids',
			description: 'Event ids to delete, from the events of Get Point Trigger.',
			required: true,
		}),
	},
	async run(context) {
		return await mauticApi.deletePointTriggerEvents({
			auth: context.auth,
			triggerId: context.propsValue.triggerId,
			eventIds: mauticUtils.toBatchIds({ ids: context.propsValue.ids }),
		});
	},
});
