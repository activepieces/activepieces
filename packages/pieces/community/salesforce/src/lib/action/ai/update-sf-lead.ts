import { createAction, Property } from '@activepieces/pieces-framework';
import { salesforceAuth } from '../../..';
import { crmUtils } from '../../common/crm';
import { updateRecordOutputSchema } from '../../output-schemas';

export const updateSfLead = createAction({
	auth: salesforceAuth,
	name: 'update_sf_lead',
	classification: 'WRITE',
	displayName: 'Update Lead',
	description: 'Update fields on an existing lead.',
	audience: 'ai',
	aiMetadata: {
		description:
			'Updates an existing Salesforce Lead by id; only the fields you supply change, the rest stay as they are. It does not convert the lead. Use Create Lead for new leads and Search Leads to find the id. At least one field is required; custom fields go in Additional Fields (null clears a value). Safe to retry with the same values.',
		idempotent: true,
	},
	outputSchema: updateRecordOutputSchema,
	props: {
		lead_id: Property.ShortText({ displayName: 'Lead ID', required: true }),
		LastName: Property.ShortText({ displayName: 'Last Name', required: false }),
		Company: Property.ShortText({ displayName: 'Company', required: false }),
		FirstName: Property.ShortText({ displayName: 'First Name', required: false }),
		Email: Property.ShortText({ displayName: 'Email', required: false }),
		Phone: Property.ShortText({ displayName: 'Phone', required: false }),
		Title: Property.ShortText({ displayName: 'Title', required: false }),
		Status: Property.ShortText({ displayName: 'Status', required: false }),
		LeadSource: Property.ShortText({ displayName: 'Lead Source', required: false }),
		Industry: Property.ShortText({ displayName: 'Industry', required: false }),
		Website: Property.ShortText({ displayName: 'Website', required: false }),
		City: Property.ShortText({ displayName: 'City', required: false }),
		Country: Property.ShortText({ displayName: 'Country', required: false }),
		Description: Property.LongText({ displayName: 'Description', required: false }),
		OwnerId: Property.ShortText({ displayName: 'Owner ID', required: false }),
		additional_fields: crmUtils.additionalFieldsProp,
	},
	async run(context) {
		const { lead_id, additional_fields, ...fields } = context.propsValue;
		return crmUtils.updateRecord({ auth: context.auth, object: 'Lead', recordId: lead_id, fields, additionalFields: additional_fields });
	},
});
