import { brevoRegisterTrigger } from './register-webhook';
import { WEBHOOK_ID_NOTE, brevoSamples } from './samples';
import { emailClickedTriggerOutputSchema } from '../output-schemas';

export const emailClicked = brevoRegisterTrigger({
	name: 'email_clicked',
	displayName: 'Transactional Email Link Clicked',
	description: 'Triggers when a recipient clicks a link in a transactional email.',
	aiDescription:
		`Fires when a recipient clicks a link inside a transactional email sent from this Brevo account. The payload adds the clicked link URL to the usual message and device fields, so use it to score intent or route follow ups. ${WEBHOOK_ID_NOTE}`,
	type: 'transactional',
	events: ['click'],
	sampleData: {
		...brevoSamples.engagement,
		event: 'click',
		link: 'https://example.com/product',
	},
	outputSchema: emailClickedTriggerOutputSchema,
});
