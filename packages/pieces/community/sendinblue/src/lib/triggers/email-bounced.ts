import { brevoRegisterTrigger } from './register-webhook';
import { WEBHOOK_ID_NOTE, brevoSamples } from './samples';
import { emailBouncedTriggerOutputSchema } from '../output-schemas';

export const emailBounced = brevoRegisterTrigger({
	name: 'email_bounced',
	displayName: 'Transactional Email Bounced',
	description: 'Triggers when a transactional email hard or soft bounces.',
	aiDescription:
		`Fires when a transactional email sent from this Brevo account bounces. Covers both hard and soft bounces: read the event field to tell them apart, where hard_bounce means permanently undeliverable and soft_bounce a temporary failure, and read reason for the mail server explanation. ${WEBHOOK_ID_NOTE}`,
	type: 'transactional',
	events: ['hardBounce', 'softBounce'],
	sampleData: {
		...brevoSamples.transactionalEmail,
		email: 'invalid@example.invalid',
		event: 'soft_bounce',
		reason: 'Unable to find MX of domain example.invalid',
	},
	outputSchema: emailBouncedTriggerOutputSchema,
});
