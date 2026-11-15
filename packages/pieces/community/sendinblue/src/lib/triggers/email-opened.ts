import { brevoRegisterTrigger } from './register-webhook';
import { WEBHOOK_ID_NOTE, brevoSamples } from './samples';
import { emailOpenedTriggerOutputSchema } from '../output-schemas';

export const emailOpened = brevoRegisterTrigger({
	name: 'email_opened',
	displayName: 'Transactional Email Opened',
	description: 'Triggers when a recipient opens a transactional email.',
	aiDescription:
		`Fires when a recipient opens a transactional email sent from this Brevo account. Alongside the message-id and subject the payload carries user_agent and device_used, so use it to react to engagement. ${WEBHOOK_ID_NOTE}`,
	type: 'transactional',
	events: ['opened'],
	sampleData: { ...brevoSamples.engagement, event: 'opened' },
	outputSchema: emailOpenedTriggerOutputSchema,
});
