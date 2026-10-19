import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { intercomAuth } from '../auth';
import { intercomRequest } from '../common';
import { requireText } from '../common/lookups';
import { companyOutputSchema } from '../output-schemas';

export const attachContactToCompanyAction = createAction({
	auth: intercomAuth,
	name: 'attach_contact_to_company',
	classification: 'WRITE',
	displayName: 'Attach Contact to Company',
	description: 'Links a contact to a company.',
	audience: 'ai',
	aiMetadata: {
		description:
			'Links a contact to a company, both by Intercom ID (use Get Company to turn your own Company ID into the Intercom ID). A contact can belong to several companies; attaching an existing link leaves the same state, so it is safe to retry.',
		idempotent: true,
	},
	props: {
		contactId: Property.ShortText({ displayName: 'Contact ID', required: true }),
		companyId: Property.ShortText({
			displayName: 'Intercom Company ID',
			description: 'The Intercom "id" of the company, not your own Company ID.',
			required: true,
		}),
	},
	outputSchema: companyOutputSchema,
	async run(context) {
		const contactId = requireText({ label: 'Contact ID', value: context.propsValue.contactId });
		const companyId = requireText({ label: 'Intercom Company ID', value: context.propsValue.companyId });
		return intercomRequest<Record<string, unknown>>({
			auth: context.auth,
			method: HttpMethod.POST,
			path: ['contacts', contactId, 'companies'],
			body: { id: companyId },
			operation: 'attach the contact to the company',
		});
	},
});
