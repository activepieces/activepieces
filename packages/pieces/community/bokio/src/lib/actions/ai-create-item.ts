import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { bokioAuth } from '../common/auth';
import { bokioClient } from '../common/client';
import { bokioBuilders } from '../common/builders';
import { bokioSchemas } from '../common/schemas';
import { bokioProps } from '../common/props';

export const aiCreateItem = createAction({
  auth: bokioAuth,
  name: 'ai_create_item',
  classification: 'WRITE',
  displayName: 'Create Item',
  description: 'Creates a reusable item in Bokio.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Creates a reusable item in the Bokio item catalog and returns it with its id, which can be used as itemId on invoice lines. itemType salesItem needs description, productType (goods or services), unitType, unitPrice (excluding VAT) and taxRate (VAT percent). itemType descriptionOnlyItem needs only description. bookkeepingAccountNumber is an optional whole account number. Not idempotent: check List Items first to avoid duplicates.',
    idempotent: false,
  },
  outputSchema: bokioSchemas.item,
  props: {
    itemType: bokioProps.itemTypeDropdown({
      description: 'salesItem = priced item; descriptionOnlyItem = text-only item',
    }),
    description: Property.ShortText({
      displayName: 'Description',
      description: 'Item name/description, 1 to 500 characters',
      required: true,
    }),
    productType: bokioProps.productTypeDropdown({ required: false }),
    unitType: bokioProps.unitTypeDropdown({ required: false }),
    unitPrice: Property.Number({
      displayName: 'Unit Price',
      description: 'Price per unit excluding VAT. Required for a salesItem.',
      required: false,
    }),
    taxRate: Property.Number({
      displayName: 'Tax Rate',
      description: 'VAT percent, for example 25. Required for a salesItem.',
      required: false,
    }),
    bookkeepingAccountNumber: Property.ShortText({
      displayName: 'Bookkeeping Account Number',
      description: 'Optional whole account number, for example 3001',
      required: false,
    }),
  },
  async run(context) {
    const p = context.propsValue;
    const body = bokioBuilders.buildItemBody({
      itemType: p.itemType,
      description: p.description,
      productType: p.productType,
      unitType: p.unitType,
      unitPrice: p.unitPrice,
      taxRate: p.taxRate,
      bookkeepingAccountNumber: p.bookkeepingAccountNumber,
    });
    return bokioClient.request<unknown>({
      auth: context.auth.props,
      method: HttpMethod.POST,
      path: '/items',
      operation: 'create item',
      body,
    });
  },
});
