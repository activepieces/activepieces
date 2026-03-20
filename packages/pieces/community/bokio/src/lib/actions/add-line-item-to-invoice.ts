import { createAction, Property } from '@activepieces/pieces-framework';
import { bokioAuth } from '../common/auth';
import { makeRequest } from '../common/client';
import { HttpMethod } from '@activepieces/pieces-common';
import { invoiceIdDropdown, lineItemsProps, unitTypeDropdown } from '../common/props';

export const addLineItemToInvoice = createAction({
  auth: bokioAuth,
  name: 'addLineItemToInvoice',
  displayName: 'Add line item to invoice',
  description: 'Adds a line item to an existing draft invoice',
  props: {
    invoiceId: invoiceIdDropdown,
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
    dynamicProps: lineItemsProps,
  },
  async run(context) {
    const { invoiceId, itemType, dynamicProps } = context.propsValue;
    const { api_key, companyId } = context.auth.props;

    const body: any = {
      itemType,
      description: dynamicProps?.['description'],
    };

    // Only add pricing fields for sales items
    if (itemType === 'salesItem' && dynamicProps) {
      body.quantity = dynamicProps['quantity'];
      body.unitPrice = dynamicProps['unitPrice'];

      if (dynamicProps['itemRefId']) {
        body.itemRef = {
          id: dynamicProps['itemRefId'],
        };
      }

      if (dynamicProps['productType']) {
        body.productType = dynamicProps['productType'];
      }

      if (dynamicProps['unitType']) {
        body.unitType = dynamicProps['unitType'];
      }

      if (
        dynamicProps['taxRate'] !== undefined &&
        dynamicProps['taxRate'] !== null
      ) {
        body.taxRate = dynamicProps['taxRate'];
      }
    }

    const response = await makeRequest(
      api_key,
      HttpMethod.POST,
      `/companies/${companyId}/invoices/${invoiceId}/line-items`,
      body
    );

    return response;
  },
});
