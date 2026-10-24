import { createAction, Property } from '@activepieces/pieces-framework';

import { zohoInvoiceAuth } from '../../../auth';
import { zohoInvoiceAiProps } from '../../../common/ai-props';
import { zohoInvoiceApi } from '../../../common/api';
import { zohoInvoiceUtils } from '../../../common/utils';
import { zohoInvoiceMessageOutputSchema } from '../../../output-schemas';

export const emailEstimateAction = createAction({
	auth: zohoInvoiceAuth,
	name: 'zoho_invoice_email_estimate',
	outputSchema: zohoInvoiceMessageOutputSchema,
	displayName: 'Email Estimate',
	description: 'Emails an estimate to the customer.',
	audience: 'ai',
	classification: 'WRITE',
	aiMetadata: {
		description:
			'Sends a real email with the estimate to the given recipients and marks it as sent. Use Get Estimate Email Content to preview the default subject and body, Mark Estimate as Sent to change the status without emailing, and Email Multiple Estimates for several at once. Not idempotent: each call sends another email.',
		idempotent: false,
	},
	props: {
		organizationId: zohoInvoiceAiProps.organizationId({ required: true }),
		estimateId: zohoInvoiceAiProps.estimateId({ required: true }),
		toMailIds: Property.Array({
			displayName: 'To',
			description: 'Recipient email addresses.',
			required: true,
		}),
		ccMailIds: Property.Array({
			displayName: 'CC',
			description: 'Email addresses to copy.',
			required: false,
		}),
		subject: Property.ShortText({
			displayName: 'Subject',
			description: 'Email subject. Empty = the default template subject.',
			required: false,
		}),
		body: Property.LongText({
			displayName: 'Body',
			description: 'Email body; HTML is allowed. Empty = the default template body.',
			required: false,
		}),
		sendFromOrgEmailId: zohoInvoiceAiProps.yesNo({
			required: false,
			displayName: 'Send From Organization Email',
			description:
				"Yes to send from the organization's email address instead of the user's. Empty = the vendor default.",
		}),
	},
	async run({ auth, propsValue }) {
		return await zohoInvoiceApi.emailEstimate({
			auth,
			organizationId: propsValue.organizationId,
			estimateId: propsValue.estimateId,
			body: zohoInvoiceUtils.compact({
				to_mail_ids: propsValue.toMailIds,
				cc_mail_ids: propsValue.ccMailIds,
				subject: propsValue.subject,
				body: propsValue.body,
				send_from_org_email_id: zohoInvoiceUtils.toOptionalBoolean({
					value: propsValue.sendFromOrgEmailId,
				}),
			}),
		});
	},
});
