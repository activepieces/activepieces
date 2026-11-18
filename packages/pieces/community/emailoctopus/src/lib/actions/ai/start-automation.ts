import { createAction, Property } from '@activepieces/pieces-framework';

import { emailOctopusAuth } from '../../auth';
import { emailOctopusApi } from '../../common/api';
import { startAutomationOutputSchema } from '../../output-schemas';

export const startAutomationAction = createAction({
	auth: emailOctopusAuth,
	name: 'emailoctopus_start_automation',
	displayName: 'Start Automation',
	description: 'Starts an automation for a contact.',
	audience: 'ai',
	outputSchema: startAutomationOutputSchema,
	classification: 'WRITE',
	aiMetadata: {
		description:
			'Queues one contact into an EmailOctopus automation whose trigger is "started via API". The contact must already be in the automation\'s list. Fails with 409 if the contact already went through it, unless the automation allows repeats.',
		idempotent: false,
	},
	props: {
		automationId: Property.ShortText({
			displayName: 'Automation ID',
			description: "The automation ID (UUID), from the automation's page in EmailOctopus.",
			required: true,
		}),
		contactId: Property.ShortText({
			displayName: 'Contact ID',
			description:
				'The contact ID (UUID), from Get Contact or List Contacts. An email address does not work here.',
			required: true,
		}),
	},
	async run(context) {
		const { automationId, contactId } = context.propsValue;
		await emailOctopusApi.startAutomation({ auth: context.auth, automationId, contactId });
		return { queued: true, automation_id: automationId, contact_id: contactId };
	},
});
