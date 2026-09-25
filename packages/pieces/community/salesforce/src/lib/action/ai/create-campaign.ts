import { createAction, Property } from '@activepieces/pieces-framework';
import { salesforceAuth } from '../../..';
import { crmUtils } from '../../common/crm';
import { createCampaignOutputSchema } from '../../output-schemas';

export const createCampaign = createAction({
	auth: salesforceAuth,
	name: 'create_campaign',
	classification: 'WRITE',
	displayName: 'Create Campaign',
	description: 'Create a new marketing campaign.',
	audience: 'ai',
	aiMetadata: {
		description:
			'Creates a Salesforce Campaign with a required Name and optional type, status, start/end dates (YYYY-MM-DD), active flag, budget, expected revenue and parent campaign; custom fields go in Additional Fields. Use Update Campaign to change one, and Add Lead to Campaign / Add Contact to Campaign to enroll members. The user needs the Marketing User permission. Not idempotent: each call creates a new Campaign.',
		idempotent: false,
	},
	outputSchema: createCampaignOutputSchema,
	props: {
		Name: Property.ShortText({ displayName: 'Name', required: true }),
		Type: Property.ShortText({ displayName: 'Type', description: 'Campaign type picklist value, e.g. Webinar or Email.', required: false }),
		Status: Property.ShortText({ displayName: 'Status', description: 'Campaign status picklist value, e.g. Planned.', required: false }),
		StartDate: Property.ShortText({ displayName: 'Start Date', description: 'YYYY-MM-DD.', required: false }),
		EndDate: Property.ShortText({ displayName: 'End Date', description: 'YYYY-MM-DD.', required: false }),
		IsActive: Property.Checkbox({ displayName: 'Active', required: false }),
		BudgetedCost: Property.Number({ displayName: 'Budgeted Cost', required: false }),
		ExpectedRevenue: Property.Number({ displayName: 'Expected Revenue', required: false }),
		Description: Property.LongText({ displayName: 'Description', required: false }),
		ParentId: Property.ShortText({ displayName: 'Parent Campaign ID', required: false }),
		additional_fields: crmUtils.additionalFieldsProp,
	},
	async run(context) {
		const { additional_fields, ...fields } = context.propsValue;
		const result = await crmUtils.createRecord({
			auth: context.auth,
			object: 'Campaign',
			fields: {
				...fields,
				StartDate: crmUtils.assertDate({ value: fields.StartDate, fieldName: 'Start Date' }),
				EndDate: crmUtils.assertDate({ value: fields.EndDate, fieldName: 'End Date' }),
			},
			additionalFields: additional_fields,
		});
		return { ...result, name: fields.Name };
	},
});
