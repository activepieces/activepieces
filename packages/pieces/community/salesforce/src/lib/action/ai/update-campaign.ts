import { createAction, Property } from '@activepieces/pieces-framework';
import { salesforceAuth } from '../../..';
import { crmUtils } from '../../common/crm';
import { updateRecordOutputSchema } from '../../output-schemas';

export const updateCampaign = createAction({
	auth: salesforceAuth,
	name: 'update_campaign',
	classification: 'WRITE',
	displayName: 'Update Campaign',
	description: 'Update fields on an existing campaign.',
	audience: 'ai',
	aiMetadata: {
		description:
			'Updates an existing Salesforce Campaign by id, e.g. its status, dates (YYYY-MM-DD), active flag or budget; only the fields you supply change. Use Create Campaign for new campaigns. At least one field is required; custom fields go in Additional Fields (null clears a value). Safe to retry with the same values.',
		idempotent: true,
	},
	outputSchema: updateRecordOutputSchema,
	props: {
		campaign_id: Property.ShortText({ displayName: 'Campaign ID', required: true }),
		Name: Property.ShortText({ displayName: 'Name', required: false }),
		Type: Property.ShortText({ displayName: 'Type', required: false }),
		Status: Property.ShortText({ displayName: 'Status', required: false }),
		StartDate: Property.ShortText({ displayName: 'Start Date', description: 'YYYY-MM-DD.', required: false }),
		EndDate: Property.ShortText({ displayName: 'End Date', description: 'YYYY-MM-DD.', required: false }),
		IsActive: crmUtils.booleanFilterProp({ displayName: 'Active', description: 'Leave empty to keep the current value.' }),
		BudgetedCost: Property.Number({ displayName: 'Budgeted Cost', required: false }),
		ExpectedRevenue: Property.Number({ displayName: 'Expected Revenue', required: false }),
		Description: Property.LongText({ displayName: 'Description', required: false }),
		ParentId: Property.ShortText({ displayName: 'Parent Campaign ID', required: false }),
		additional_fields: crmUtils.additionalFieldsProp,
	},
	async run(context) {
		const { campaign_id, additional_fields, ...fields } = context.propsValue;
		return crmUtils.updateRecord({
			auth: context.auth,
			object: 'Campaign',
			recordId: campaign_id,
			fields: {
				...fields,
				StartDate: crmUtils.assertDate({ value: fields.StartDate, fieldName: 'Start Date' }),
				EndDate: crmUtils.assertDate({ value: fields.EndDate, fieldName: 'End Date' }),
			},
			additionalFields: additional_fields,
		});
	},
});
