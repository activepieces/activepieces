import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { sendinblueAuth } from '../auth';
import { brevoCommon } from '../common';
import { createCompanyActionOutputSchema } from '../output-schemas';

export const createCompany = createAction({
	auth: sendinblueAuth,
	name: 'create_company',
	outputSchema: createCompanyActionOutputSchema,
	classification: 'WRITE',
	displayName: 'Create Company',
	description: 'Create a new company record in Brevo CRM.',
	audience: 'ai',
	aiMetadata: {
		description:
			'Creates a new Brevo CRM company with a name and optional custom attributes, and can link it to existing contacts and deals in the same call. Each call creates a new company record, so retries duplicate it — look it up first with List Companies if you are unsure whether it already exists.',
		idempotent: false,
	},
	props: {
		name: Property.ShortText({
			displayName: 'Name',
			description: 'Name of the company.',
			required: true,
		}),
		attributes: Property.Object({
			displayName: 'Attributes',
			description:
				"Custom company attributes such as domain, industry, phone_number, address, city, country. Attribute keys depend on your Brevo account's CRM configuration.",
			required: false,
		}),
		country_code: Property.Number({
			displayName: 'Phone Country Code',
			description:
				'Country code for any phone number in attributes, e.g. 1 for USA, 44 for UK. Only needed when a phone attribute is set.',
			required: false,
		}),
		linked_contacts_ids: Property.Array({
			displayName: 'Linked Contact IDs',
			description: 'Existing Brevo contact IDs to link to this company.',
			required: false,
		}),
		linked_deals_ids: Property.Array({
			displayName: 'Linked Deal IDs',
			description: 'Existing Brevo deal IDs to link to this company.',
			required: false,
		}),
	},
	async run(context) {
		const { name, attributes, country_code, linked_contacts_ids, linked_deals_ids } =
			context.propsValue;

		const linkedContactsIds = (linked_contacts_ids ?? [])
			.map((contactId) => Number(contactId))
			.filter((contactId) => Number.isFinite(contactId));

		const linkedDealsIds = (Array.isArray(linked_deals_ids) ? linked_deals_ids : [])
			.map((dealId) => String(dealId).trim())
			.filter((dealId) => dealId.length > 0);

		const body = {
			name,
			attributes: brevoCommon.isEmptyObject(attributes) ? undefined : attributes,
			countryCode: country_code,
			linkedContactsIds: linkedContactsIds.length > 0 ? linkedContactsIds : undefined,
			linkedDealsIds: linkedDealsIds.length > 0 ? linkedDealsIds : undefined,
		};

		return await brevoCommon.apiCall({
			apiKey: context.auth.secret_text,
			method: HttpMethod.POST,
			resourceUri: '/companies',
			body,
		});
	},
});
