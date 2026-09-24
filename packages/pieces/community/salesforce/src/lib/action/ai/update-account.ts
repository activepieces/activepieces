import { createAction, Property } from '@activepieces/pieces-framework';
import { salesforceAuth } from '../../..';
import { crmUtils } from '../../common/crm';
import { updateRecordOutputSchema } from '../../output-schemas';

export const updateAccount = createAction({
	auth: salesforceAuth,
	name: 'update_account',
	classification: 'WRITE',
	displayName: 'Update Account',
	description: 'Update fields on an existing account.',
	audience: 'ai',
	aiMetadata: {
		description:
			'Updates an existing Salesforce Account by id; only the fields you supply are changed, everything else is left as is. Use Create Account for new accounts and Search Accounts to find the id. At least one field is required; custom fields go in Additional Fields (set a value to null there to clear it). Safe to retry with the same values.',
		idempotent: true,
	},
	outputSchema: updateRecordOutputSchema,
	props: {
		account_id: Property.ShortText({ displayName: 'Account ID', required: true }),
		Name: Property.ShortText({ displayName: 'Account Name', required: false }),
		Phone: Property.ShortText({ displayName: 'Phone', required: false }),
		Website: Property.ShortText({ displayName: 'Website', required: false }),
		Industry: Property.ShortText({ displayName: 'Industry', required: false }),
		Type: Property.ShortText({ displayName: 'Type', required: false }),
		BillingStreet: Property.ShortText({ displayName: 'Billing Street', required: false }),
		BillingCity: Property.ShortText({ displayName: 'Billing City', required: false }),
		BillingState: Property.ShortText({ displayName: 'Billing State', required: false }),
		BillingPostalCode: Property.ShortText({ displayName: 'Billing Postal Code', required: false }),
		BillingCountry: Property.ShortText({ displayName: 'Billing Country', required: false }),
		Description: Property.LongText({ displayName: 'Description', required: false }),
		OwnerId: Property.ShortText({ displayName: 'Owner ID', required: false }),
		ParentId: Property.ShortText({ displayName: 'Parent Account ID', required: false }),
		additional_fields: crmUtils.additionalFieldsProp,
	},
	async run(context) {
		const { account_id, additional_fields, ...fields } = context.propsValue;
		return crmUtils.updateRecord({ auth: context.auth, object: 'Account', recordId: account_id, fields, additionalFields: additional_fields });
	},
});
