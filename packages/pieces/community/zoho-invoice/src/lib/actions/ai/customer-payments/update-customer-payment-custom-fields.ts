import { createAction, Property } from '@activepieces/pieces-framework';

import { zohoInvoiceAuth } from '../../../auth';
import { zohoInvoiceAiProps } from '../../../common/ai-props';
import { zohoInvoiceApi } from '../../../common/api';
import { zohoInvoiceUtils } from '../../../common/utils';
import { zohoInvoiceMessageOutputSchema } from '../../../output-schemas';

export const updateCustomerPaymentCustomFieldsAction = createAction({
	auth: zohoInvoiceAuth,
	name: 'zoho_invoice_update_customer_payment_custom_fields',
	outputSchema: zohoInvoiceMessageOutputSchema,
	displayName: 'Update Customer Payment Custom Fields',
	description: 'Changes custom field values on a customer payment.',
	audience: 'ai',
	classification: 'WRITE',
	aiMetadata: {
		description:
			"Sets custom field values on a customer payment without touching its amount or invoice allocation; prefer it over Update Customer Payment for custom fields. Use List Customer Payments to find the ID. Get Customer Payment lists a custom field's customfield_id only once that field has a value on the payment; otherwise ask the user for the ID.",
		idempotent: true,
	},
	props: {
		organizationId: zohoInvoiceAiProps.organizationId({ required: true }),
		paymentId: zohoInvoiceAiProps.paymentId({ required: true }),
		customFields: Property.Array({
			displayName: 'Custom Fields',
			description: 'Custom fields to set.',
			required: true,
			properties: {
				customfieldId: zohoInvoiceAiProps.idProp({
					required: true,
					displayName: 'Custom Field ID',
					description: 'Custom field ID. Use Get Customer Payment to find it.',
				}),
				value: Property.ShortText({
					displayName: 'Value',
					description: 'New value of the custom field.',
					required: true,
				}),
			},
		}),
	},
	async run({ auth, propsValue }) {
		return await zohoInvoiceApi.updateCustomerPaymentCustomFields({
			auth,
			organizationId: propsValue.organizationId,
			paymentId: propsValue.paymentId,
			customFields: zohoInvoiceUtils
				.toRecords({ rows: propsValue.customFields, propName: 'Custom Fields' })
				.map((field) =>
					zohoInvoiceUtils.compact({
						customfield_id: field['customfieldId'],
						value: field['value'],
					}),
				),
		});
	},
});
