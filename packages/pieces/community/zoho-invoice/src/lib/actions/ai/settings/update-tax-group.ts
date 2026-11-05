import { createAction, Property } from '@activepieces/pieces-framework';

import { zohoInvoiceAuth } from '../../../auth';
import { zohoInvoiceAiProps } from '../../../common/ai-props';
import { zohoInvoiceApi } from '../../../common/api';
import { zohoInvoiceUtils } from '../../../common/utils';
import { zohoInvoiceTaxGroupOutputSchema } from '../../../output-schemas';

export const updateTaxGroupAction = createAction({
	auth: zohoInvoiceAuth,
	name: 'zoho_invoice_update_tax_group',
	outputSchema: zohoInvoiceTaxGroupOutputSchema,
	displayName: 'Update Tax Group',
	description: "Changes a tax group's name or member taxes.",
	audience: 'ai',
	classification: 'WRITE',
	aiMetadata: {
		description:
			"Changes a tax group's name or replaces its list of member taxes. Fields left empty keep their current value. Use List Taxes to find the tax group ID and tax IDs. Needs the Admin role.",
		idempotent: true,
	},
	props: {
		organizationId: zohoInvoiceAiProps.organizationId({ required: true }),
		taxGroupId: zohoInvoiceAiProps.idProp({
			required: true,
			displayName: 'Tax Group ID',
			description: 'Tax group ID. Use List Taxes to find it.',
		}),
		taxGroupName: Property.ShortText({
			displayName: 'Tax Group Name',
			description: 'New name. Empty = unchanged.',
			required: false,
		}),
		taxes: Property.ShortText({
			displayName: 'Tax IDs',
			description:
				'Comma-separated IDs of all taxes the group should contain; replaces the current list. Use List Taxes to find them. Empty = unchanged.',
			required: false,
		}),
	},
	async run({ auth, propsValue }) {
		return await zohoInvoiceApi.updateTaxGroup({
			auth,
			organizationId: propsValue.organizationId,
			taxGroupId: propsValue.taxGroupId,
			body: zohoInvoiceUtils.compact({
				tax_group_name: propsValue.taxGroupName,
				taxes: propsValue.taxes,
			}),
		});
	},
});
