import { createAction, Property } from '@activepieces/pieces-framework';

import { zohoInvoiceAuth } from '../../../auth';
import { zohoInvoiceAiProps } from '../../../common/ai-props';
import { zohoInvoiceApi } from '../../../common/api';
import { zohoInvoiceMessageOutputSchema } from '../../../output-schemas';

export const enableContactPortalAccessAction = createAction({
	auth: zohoInvoiceAuth,
	name: 'zoho_invoice_enable_contact_portal_access',
	outputSchema: zohoInvoiceMessageOutputSchema,
	displayName: 'Enable Contact Portal Access',
	description: 'Gives contact persons access to the client portal.',
	audience: 'ai',
	classification: 'WRITE',
	aiMetadata: {
		description:
			'Enables client portal access for the given contact persons of a contact and sends each of them a real portal invitation email. Use List Contacts for the contact ID and List Contact Persons for the person IDs; each person needs an email address.',
		idempotent: true,
	},
	props: {
		organizationId: zohoInvoiceAiProps.organizationId({ required: true }),
		contactId: zohoInvoiceAiProps.contactId({ required: true }),
		contactPersonIds: Property.Array({
			displayName: 'Contact Person IDs',
			description: 'IDs of the contact persons to invite. Use List Contact Persons to find them.',
			required: true,
		}),
	},
	async run({ auth, propsValue }) {
		const { contactPersonIds } = propsValue;
		if (
			contactPersonIds.length === 0 ||
			!contactPersonIds.every((id): id is string => typeof id === 'string' && id !== '')
		) {
			throw new Error('Contact Person IDs must be a non-empty list of contact person IDs.');
		}
		return await zohoInvoiceApi.enableContactPortalAccess({
			auth,
			organizationId: propsValue.organizationId,
			contactId: propsValue.contactId,
			contactPersonIds,
		});
	},
});
