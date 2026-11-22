import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { bokioAuth } from '../common/auth';
import { bokioClient } from '../common/client';
import { bokioBuilders } from '../common/builders';
import { bokioSchemas } from '../common/schemas';
import { itemDetailsProps } from '../common/props';

export const createAnItem = createAction({
  auth: bokioAuth,
  name: 'createAnItem',
  classification: 'WRITE',
  displayName: 'Create an item',
  description: 'Creates a new item in Bokio',
  audience: 'human',
  aiMetadata: {
    description:
      'Creates a reusable item (sales item or description-only item) in a Bokio company. Not idempotent: each call creates another item.',
    idempotent: false,
  },
  outputSchema: bokioSchemas.item,
  props: {
    itemType: Property.StaticDropdown({
      displayName: 'Item Type',
      description: 'Type of the item',
      required: true,
      options: {
        options: [
          { label: 'Sales Item', value: 'salesItem' },
          { label: 'Description Only Item', value: 'descriptionOnlyItem' },
        ],
      },
    }),
    dynamicProps: itemDetailsProps,
  },
  async run(context) {
    const { itemType, dynamicProps } = context.propsValue;
    const details = dynamicProps ?? {};
    const body = bokioBuilders.buildItemBody({
      itemType,
      description: details['description'],
      productType: details['productType'],
      unitType: details['unitType'],
      unitPrice: details['unitPrice'],
      taxRate: details['taxRate'],
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
