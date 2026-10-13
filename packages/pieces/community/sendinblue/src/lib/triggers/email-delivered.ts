import { brevoRegisterTrigger } from './register-webhook';
import { WEBHOOK_ID_NOTE, brevoSamples } from './samples';
import { emailDeliveredTriggerOutputSchema } from '../output-schemas';

export const emailDelivered = brevoRegisterTrigger({
	name: 'email_delivered',
	displayName: 'Transactional Email Delivered',
	description: 'Triggers when a transactional email is delivered to the recipient.',
	aiDescription:
		`Fires when a transactional email sent from this Brevo account reaches the recipient mail server. The payload carries the recipient email, message-id, subject, sender_email and uuid. Fires for every transactional email on the account, so filter on tags or subject to narrow it. Note tags is an array while tag is that same array JSON encoded as a string. ${WEBHOOK_ID_NOTE}`,
	type: 'transactional',
	events: ['delivered'],
	sampleData: {
		...brevoSamples.transactionalEmail,
		event: 'delivered',
		reason: 'sent',
	},
	outputSchema: emailDeliveredTriggerOutputSchema,
});
