import { createAction, isNil, Property } from '@activepieces/pieces-framework';
import { salesforceAuth } from '../../..';
import { crmUtils } from '../../common/crm';
import { addOpportunityProductOutputSchema } from '../../output-schemas';

export const addOpportunityProduct = createAction({
	auth: salesforceAuth,
	name: 'add_opportunity_product',
	classification: 'WRITE',
	displayName: 'Add Opportunity Product',
	description: 'Add a product line item to an opportunity.',
	audience: 'ai',
	aiMetadata: {
		description:
			"Adds a product line item (OpportunityLineItem) to an Opportunity from a price book entry, with a quantity and exactly one of unit price or total price. Get the entry id from List Price Books with entries included; the entry must belong to the opportunity's price book (set it with Update Opportunity first if empty). Not idempotent: each call adds another line.",
		idempotent: false,
	},
	outputSchema: addOpportunityProductOutputSchema,
	props: {
		opportunity_id: Property.ShortText({ displayName: 'Opportunity ID', required: true }),
		pricebook_entry_id: Property.ShortText({ displayName: 'Price Book Entry ID', required: true }),
		quantity: Property.Number({ displayName: 'Quantity', required: true }),
		unit_price: Property.Number({ displayName: 'Unit Price', description: 'Sales price per unit. Do not combine with Total Price.', required: false }),
		total_price: Property.Number({ displayName: 'Total Price', description: 'Quantity times price. Do not combine with Unit Price.', required: false }),
		description: Property.LongText({ displayName: 'Line Description', required: false }),
	},
	async run(context) {
		const { opportunity_id, pricebook_entry_id, quantity, unit_price, total_price, description } = context.propsValue;
		if (isNil(unit_price) === isNil(total_price)) {
			throw new Error('Provide exactly one of Unit Price or Total Price.');
		}
		const result = await crmUtils.createRecord({
			auth: context.auth,
			object: 'OpportunityLineItem',
			fields: {
				OpportunityId: opportunity_id,
				PricebookEntryId: pricebook_entry_id,
				Quantity: quantity,
				UnitPrice: unit_price,
				TotalPrice: total_price,
				Description: description,
			},
			additionalFields: undefined,
		});
		return { ...result, opportunity_id, pricebook_entry_id, quantity };
	},
});
