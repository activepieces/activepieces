import { createAction } from '@activepieces/pieces-framework';

import { mauticBatchRescheduleContactCampaignEventsOutputSchema } from './output-schemas';
import { mauticAuth } from '../../../auth';
import { mauticAiProps } from '../../../common/ai-props';
import { mauticApi } from '../../../common/api';
import { mauticUtils } from '../../../common/utils';

export const mauticBatchRescheduleContactCampaignEventsAction = createAction({
	auth: mauticAuth,
	name: 'mautic_batch_reschedule_contact_campaign_events',
	outputSchema: mauticBatchRescheduleContactCampaignEventsOutputSchema,
	displayName: 'Batch Reschedule Contact Campaign Events',
	description: 'Changes when several Mautic campaign events run for contacts.',
	audience: 'ai',
	classification: 'WRITE',
	aiMetadata: {
		description:
			'Reschedules many contact campaign events in one request. Each record has "eventId", "contactId" and "triggerDate" (or "dateTriggered"). Per-record errors are in the response.',
		idempotent: true,
	},
	props: {
		records: mauticAiProps.records({
			description:
				'Each an object like {"eventId": 3, "contactId": 12, "triggerDate": "2026-05-01 09:00:00"}.',
		}),
	},
	async run(context) {
		return await mauticApi.batchRescheduleContactCampaignEvents({
			auth: context.auth,
			records: mauticUtils.toBatchRecords({ records: context.propsValue.records }),
		});
	},
});
