import { Property, createAction, spreadIfDefined } from '@activepieces/pieces-framework';

import { mauticSendEmailToContactOutputSchema } from './output-schemas';
import { mauticAuth } from '../../../auth';
import { mauticAiProps } from '../../../common/ai-props';
import { mauticApi } from '../../../common/api';

export const mauticSendEmailToContactAction = createAction({
	auth: mauticAuth,
	name: 'mautic_send_email_to_contact',
	outputSchema: mauticSendEmailToContactOutputSchema,
	displayName: 'Send Email to Contact',
	description: 'Sends a Mautic email to one contact.',
	audience: 'ai',
	classification: 'WRITE',
	aiMetadata: {
		description:
			'Sends a template email to one contact right away. Each call sends again. Tokens replace {token} placeholders in the content for this send only.',
		idempotent: false,
	},
	props: {
		id: mauticAiProps.recordId({
			displayName: 'Email Id',
			description: 'Numeric email id, from List Emails or Create Email.',
		}),
		contactId: mauticAiProps.recordId({
			displayName: 'Contact Id',
			description: 'Numeric contact id, from List Contacts.',
		}),
		tokens: Property.Json({
			displayName: 'Tokens',
			description: 'Values for placeholders in the email, e.g. {"{order_id}": "1042"}.',
			required: false,
		}),
		assetAttachments: Property.Array({
			displayName: 'Asset Ids',
			description: 'Asset ids to attach, from List Assets.',
			required: false,
		}),
	},
	async run(context) {
		const { id, contactId, tokens, assetAttachments } = context.propsValue;
		return await mauticApi.sendEmailToContact({
			auth: context.auth,
			id,
			contactId,
			body: {
				...spreadIfDefined('tokens', tokens),
				...spreadIfDefined('assetAttachments', assetAttachments),
			},
		});
	},
});
