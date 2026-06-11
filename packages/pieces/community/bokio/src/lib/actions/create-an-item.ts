import { createAction, Property } from '@activepieces/pieces-framework';
import { bokioAuth } from '../common/auth';
import { makeRequest } from '../common/client';
import { HttpMethod } from '@activepieces/pieces-common';
import { lineItemsProps, unitTypeDropdown } from '../common/props';

export const createAnItem = createAction({
  auth: bokioAuth,
  name: 'createAnItem',
  displayName: 'Create an item',
  description: 'Creates a new item in Bokio',
  audience: 'both',
  aiMetadata: { description: 'Creates a new reusable item (a sales item with pricing, or a text item) in a Bokio company catalog. Use to define a product or service that can later be referenced on invoices; item type is required. Not idempotent — each call creates a separate item.', idempotent: false },
  props: {
    itemType: Property.StaticDropdown({
      displayName: 'Item Type',
      description: 'Type of the item',
      required: true,
      options: {
        options: [
          { label: 'Sales Item', value: 'salesItem' },
          { label: 'Text', value: 'text' },
        ],
      },
    }),
    dynamicProps: lineItemsProps,
  },
  async run(context) {
    const { itemType, dynamicProps } = context.propsValue;
    const { api_key, companyId } = context.auth.props;

    const body: any = {
      itemType,
      description: dynamicProps?.['description'],
    };

    if (dynamicProps?.['productType']) {
      body.productType = dynamicProps['productType'];
    }

    if (dynamicProps?.['unitType']) {
      body.unitType = dynamicProps['unitType'];
    }

    if (
      dynamicProps?.['unitPrice'] !== undefined &&
      dynamicProps?.['unitPrice'] !== null
    ) {
      body.unitPrice = dynamicProps['unitPrice'];
    }

    if (
      dynamicProps?.['taxRate'] !== undefined &&
      dynamicProps?.['taxRate'] !== null
    ) {
      body.taxRate = dynamicProps['taxRate'];
    }

    const response = await makeRequest(
      api_key,
      HttpMethod.POST,
      `/companies/${companyId}/items`,
      body
    );

    return response;
  },
});
