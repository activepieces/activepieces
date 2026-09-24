import { createAction, Property } from '@activepieces/pieces-framework';
import { salesforceAuth } from '../../..';
import { crmUtils } from '../../common/crm';
import { createSfOpportunityOutputSchema } from '../../output-schemas';

export const createSfOpportunity = createAction({
	auth: salesforceAuth,
	name: 'create_sf_opportunity',
	classification: 'WRITE',
	displayName: 'Create Opportunity',
	description: 'Create a new opportunity.',
	audience: 'ai',
	aiMetadata: {
		description:
			'Creates a Salesforce Opportunity with a required Name, Stage and Close Date (YYYY-MM-DD) plus optional account, amount, probability, type, source, next step, owner and price book; custom fields go in Additional Fields. Use Update Opportunity to change one and Add Opportunity Product to add line items (set Price Book ID here or it must be set before adding products). Not idempotent: each call creates a new Opportunity.',
		idempotent: false,
	},
	outputSchema: createSfOpportunityOutputSchema,
	props: {
		Name: Property.ShortText({ displayName: 'Name', required: true }),
		StageName: Property.ShortText({ displayName: 'Stage', description: 'Stage picklist value, e.g. Prospecting.', required: true }),
		CloseDate: Property.ShortText({ displayName: 'Close Date', description: 'YYYY-MM-DD.', required: true }),
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
		const { additional_fields, ...fields } = context.propsValue;
		const closeDate = crmUtils.assertDate({ value: fields.CloseDate, fieldName: 'Close Date' });
		const result = await crmUtils.createRecord({
			auth: context.auth,
			object: 'Opportunity',
			fields: { ...fields, CloseDate: closeDate },
			additionalFields: additional_fields,
		});
		return { ...result, name: fields.Name, stage: fields.StageName, close_date: closeDate };
	},
});
