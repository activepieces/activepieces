import { createAction, Property } from '@activepieces/pieces-framework';
import { salesforceAuth } from '../../..';
import { crmUtils } from '../../common/crm';
import { createSfLeadOutputSchema } from '../../output-schemas';

export const createSfLead = createAction({
	auth: salesforceAuth,
	name: 'create_sf_lead',
	classification: 'WRITE',
	displayName: 'Create Lead',
	description: 'Create a new lead.',
	audience: 'ai',
	aiMetadata: {
		description:
			'Creates a Salesforce Lead with a required Last Name and Company plus optional contact details, status, lead source, industry, website, location and owner; custom fields go in Additional Fields. Use Search Leads first to avoid duplicates, Update Lead to change one, and Apply Lead Assignment Rules to route it to an owner. Not idempotent: each call creates a new Lead.',
		idempotent: false,
	},
	outputSchema: createSfLeadOutputSchema,
	props: {
		LastName: Property.ShortText({ displayName: 'Last Name', required: true }),
		Company: Property.ShortText({ displayName: 'Company', required: true }),
		FirstName: Property.ShortText({ displayName: 'First Name', required: false }),
		Email: Property.ShortText({ displayName: 'Email', required: false }),
		Phone: Property.ShortText({ displayName: 'Phone', required: false }),
		Title: Property.ShortText({ displayName: 'Title', required: false }),
		Status: Property.ShortText({ displayName: 'Status', description: 'Lead status picklist value, e.g. Open - Not Contacted.', required: false }),
		LeadSource: Property.ShortText({ displayName: 'Lead Source', required: false }),
		Industry: Property.ShortText({ displayName: 'Industry', required: false }),
		Website: Property.ShortText({ displayName: 'Website', required: false }),
		City: Property.ShortText({ displayName: 'City', required: false }),
		Country: Property.ShortText({ displayName: 'Country', required: false }),
		Description: Property.LongText({ displayName: 'Description', required: false }),
		OwnerId: Property.ShortText({ displayName: 'Owner ID', description: 'User or queue id.', required: false }),
		additional_fields: crmUtils.additionalFieldsProp,
	},
	async run(context) {
		const { additional_fields, ...fields } = context.propsValue;
		const result = await crmUtils.createRecord({ auth: context.auth, object: 'Lead', fields, additionalFields: additional_fields });
		return { ...result, last_name: fields.LastName, company: fields.Company };
	},
});
