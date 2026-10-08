import { createAction } from '@activepieces/pieces-framework';

import { mauticAuth } from '../../../auth';
import { mauticAiProps } from '../../../common/ai-props';
import { mauticApi } from '../../../common/api';

export const mauticSendSmsToContactAction = createAction({
	auth: mauticAuth,
	name: 'mautic_send_sms_to_contact',
	displayName: 'Send Text Message to Contact',
	description: 'Sends a Mautic text message to one contact.',
	audience: 'ai',
	classification: 'WRITE',
	aiMetadata: {
		description:
			"Sends a text message to one contact's mobile number right away. Each call sends again. Needs an SMS transport configured in Mautic.",
		idempotent: false,
	},
	props: {
		id: mauticAiProps.recordId({
			displayName: 'Text Message Id',
			description: 'Numeric text message id, from List Text Messages or Create Text Message.',
		}),
		contactId: mauticAiProps.recordId({
			displayName: 'Contact Id',
			description: 'Numeric contact id, from List Contacts.',
		}),
	},
	async run(context) {
		return await mauticApi.sendSmsToContact({
			auth: context.auth,
			id: context.propsValue.id,
			contactId: context.propsValue.contactId,
		});
	},
});
