import { createAction, Property } from '@activepieces/pieces-framework';
import { salesforceAuth } from '../../..';
import { crmUtils } from '../../common/crm';
import { createAccountOutputSchema } from '../../output-schemas';

export const createAccount = createAction({
	auth: salesforceAuth,
	name: 'create_account',
	classification: 'WRITE',
	displayName: 'Create Account',
	description: 'Create a new account.',
	audience: 'ai',
	aiMetadata: {
		description:
			'Creates a Salesforce Account (company) with a required Name and optional phone, website, industry, billing address, owner and parent account; put custom fields in Additional Fields. Use Search Accounts first to avoid duplicates, and Update Account to change an existing one. Not idempotent: each call creates a new Account.',
		idempotent: false,
	},
	outputSchema: createAccountOutputSchema,
	props: {
		Name: Property.ShortText({ displayName: 'Account Name', required: true }),
		Phone: Property.ShortText({ displayName: 'Phone', required: false }),
		Website: Property.ShortText({ displayName: 'Website', required: false }),
		Industry: Property.ShortText({ displayName: 'Industry', description: 'Industry picklist value, e.g. Technology.', required: false }),
		Type: Property.ShortText({ displayName: 'Type', description: 'Account type picklist value, e.g. Customer - Direct or Prospect.', required: false }),
		BillingStreet: Property.ShortText({ displayName: 'Billing Street', required: false }),
		BillingCity: Property.ShortText({ displayName: 'Billing City', required: false }),
		BillingState: Property.ShortText({ displayName: 'Billing State', required: false }),
		BillingPostalCode: Property.ShortText({ displayName: 'Billing Postal Code', required: false }),
		BillingCountry: Property.ShortText({ displayName: 'Billing Country', required: false }),
		Description: Property.LongText({ displayName: 'Description', required: false }),
		OwnerId: Property.ShortText({ displayName: 'Owner ID', description: 'User id of the account owner.', required: false }),
		ParentId: Property.ShortText({ displayName: 'Parent Account ID', required: false }),
		additional_fields: crmUtils.additionalFieldsProp,
	},
	async run(context) {
		const { additional_fields, ...fields } = context.propsValue;
		const result = await crmUtils.createRecord({ auth: context.auth, object: 'Account', fields, additionalFields: additional_fields });
		return { ...result, name: fields.Name };
	},
});
