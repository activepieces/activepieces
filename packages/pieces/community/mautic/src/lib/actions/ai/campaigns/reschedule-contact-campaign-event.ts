import { Property, createAction, spreadIfDefined } from '@activepieces/pieces-framework';

import { mauticRescheduleContactCampaignEventOutputSchema } from './output-schemas';
import { mauticAuth } from '../../../auth';
import { mauticAiProps } from '../../../common/ai-props';
import { mauticApi } from '../../../common/api';

export const mauticRescheduleContactCampaignEventAction = createAction({
	auth: mauticAuth,
	name: 'mautic_reschedule_contact_campaign_event',
	outputSchema: mauticRescheduleContactCampaignEventOutputSchema,
	displayName: 'Reschedule Contact Campaign Event',
	description: 'Changes when a Mautic campaign event runs for a contact.',
	audience: 'ai',
	classification: 'WRITE',
	aiMetadata: {
		description:
			'Sets when a campaign action runs for a contact who is in the campaign, or marks it as already run with Date Triggered. Fails if the event already ran for the contact or is a decision. Setting the same date again changes nothing.',
		idempotent: true,
	},
	props: {
		eventId: mauticAiProps.recordId({
			displayName: 'Event Id',
			description: 'Numeric campaign event id, from List Campaign Events or Get Campaign.',
		}),
		contactId: mauticAiProps.recordId({
			displayName: 'Contact Id',
			description: 'Numeric contact id, from List Contacts.',
		}),
		triggerDate: Property.ShortText({
			displayName: 'Trigger Date',
			description: 'When the event should run, e.g. "2026-05-01 09:00:00".',
			required: false,
		}),
		dateTriggered: Property.ShortText({
			displayName: 'Date Triggered',
			description: 'Marks the event as run at this date/time instead of scheduling it.',
			required: false,
		}),
	},
	async run(context) {
		const { eventId, contactId, triggerDate, dateTriggered } = context.propsValue;
		return await mauticApi.rescheduleContactCampaignEvent({
			auth: context.auth,
			eventId,
			contactId,
			body: {
				...spreadIfDefined('triggerDate', triggerDate),
				...spreadIfDefined('dateTriggered', dateTriggered),
			},
		});
	},
});
