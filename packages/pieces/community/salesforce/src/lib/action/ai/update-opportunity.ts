import { createAction, Property } from '@activepieces/pieces-framework';
import { salesforceAuth } from '../../..';
import { crmUtils } from '../../common/crm';
import { updateRecordOutputSchema } from '../../output-schemas';

export const updateOpportunity = createAction({
	auth: salesforceAuth,
	name: 'update_opportunity',
	classification: 'WRITE',
	displayName: 'Update Opportunity',
	description: 'Update fields on an existing opportunity.',
	audience: 'ai',
	aiMetadata: {
		description:
			'Updates an existing Salesforce Opportunity by id, e.g. to move its stage, change the amount or push the close date (YYYY-MM-DD); only the fields you supply change. Use Create Opportunity for new deals and Search Opportunities to find the id. At least one field is required; custom fields go in Additional Fields (null clears a value). Safe to retry with the same values.',
		idempotent: true,
	},
	outputSchema: updateRecordOutputSchema,
	props: {
		opportunity_id: Property.ShortText({ displayName: 'Opportunity ID', required: true }),
		Name: Property.ShortText({ displayName: 'Name', required: false }),
		StageName: Property.ShortText({ displayName: 'Stage', required: false }),
		CloseDate: Property.ShortText({ displayName: 'Close Date', description: 'YYYY-MM-DD.', required: false }),
		AccountId: Property.ShortText({ displayName: 'Account ID', required: false }),
		Amount: Property.Number({ displayName: 'Amount', required: false }),
		Probability: Property.Number({ displayName: 'Probability (%)', required: false }),
		Type: Property.ShortText({ displayName: 'Type', required: false }),
		LeadSource: Property.ShortText({ displayName: 'Lead Source', required: false }),
		NextStep: Property.ShortText({ displayName: 'Next Step', required: false }),
		Description: Property.LongText({ displayName: 'Description', required: false }),
		OwnerId: Property.ShortText({ displayName: 'Owner ID', required: false }),
		Pricebook2Id: Property.ShortText({ displayName: 'Price Book ID', required: false }),
		additional_fields: crmUtils.additionalFieldsProp,
	},
	async run(context) {
		const { opportunity_id, additional_fields, ...fields } = context.propsValue;
		return crmUtils.updateRecord({
			auth: context.auth,
			object: 'Opportunity',
			recordId: opportunity_id,
			fields: { ...fields, CloseDate: crmUtils.assertDate({ value: fields.CloseDate, fieldName: 'Close Date' }) },
			additionalFields: additional_fields,
		});
	},
});
