import { Property } from '@activepieces/pieces-framework';
import { makeRequest } from './client';
import { bokioAuth } from './auth';
import { HttpMethod } from '@activepieces/pieces-common';

export const invoiceIdDropdown = Property.Dropdown({
  auth: bokioAuth,
  displayName: 'Invoice',
  description: 'Select the invoice',
  required: true,
  refreshers: [],
  options: async ({ auth }) => {
    if (!auth) {
      return {
        disabled: true,
        options: [],
      };
    }
    try {
      const response = await makeRequest(
        auth.props.api_key,
        HttpMethod.GET,
        `/companies/${auth.props.companyId}/invoices?limit=100`
      );

      const options = response.items.map((invoice: any) => ({
        label: `#${invoice.invoiceNumber} - ${invoice.customerRef.customerName}`,
        value: invoice.id,
      }));

      return {
        disabled: false,
        options,
      };
    } catch (error) {
      return {
        disabled: true,
        options: [],
      };
    }
  },
});

export const unitTypeDropdown = Property.StaticDropdown({
  displayName: 'Unit Type',
  description: 'Unit type for the item',
  required: false,
  options: {
    options: [
      { label: 'Unspecified', value: 'unspecified' },
      { label: 'Piece', value: 'piece' },
      { label: 'Hour', value: 'hour' },
      { label: 'Day', value: 'day' },
      { label: 'Month', value: 'month' },
      { label: 'Kilogram', value: 'kilogram' },
      { label: 'Gram', value: 'gram' },
      { label: 'Liter', value: 'liter' },
      { label: 'Meter', value: 'meter' },
      { label: 'Centimeter', value: 'centimeter' },
      { label: 'Millimeter', value: 'millimeter' },
      { label: 'Meter Squared', value: 'meterSquared' },
      { label: 'Meter Cubic', value: 'meterCubic' },
      { label: 'Mile', value: 'mile' },
      { label: 'Kilometer', value: 'kilometer' },
      { label: 'Gigabyte', value: 'gigabyte' },
      { label: 'Hectar', value: 'hectar' },
      { label: 'Words', value: 'words' },
      { label: 'Year', value: 'year' },
      { label: 'Week', value: 'week' },
      { label: 'Minute', value: 'minute' },
      { label: 'Megabyte', value: 'megabyte' },
      { label: 'Ton', value: 'ton' },
    ],
  },
});

export const lineItemsProps = Property.DynamicProperties({
  auth: bokioAuth,
  displayName: 'Item Details',
  description: 'Configure item details based on item type',
  required: false,
  refreshers: ['itemType'],
  props: async ({ itemType }) => {
    const properties: Record<string, any> = {
      description: Property.ShortText({
        displayName: 'Description',
        description: 'Description of the line item',
        required: true,
      }),
    };

    // Only show pricing fields for sales items
    if (itemType === 'salesItem') {
      properties['itemRefId'] = Property.ShortText({
        displayName: 'Item Reference ID',
        description: 'UUID of the item reference',
        required: false,
      });

      properties['productType'] = Property.StaticDropdown({
        displayName: 'Product Type',
        description: 'Type of product',
        required: true,
        options: {
          options: [
            { label: 'Goods', value: 'goods' },
            { label: 'Service', value: 'service' },
          ],
        },
      });

      properties['unitType'] = unitTypeDropdown;

      properties['quantity'] = Property.Number({
        displayName: 'Quantity',
        description: 'Quantity of the item',
        required: true,
        defaultValue: 1,
      });

      properties['unitPrice'] = Property.Number({
        displayName: 'Unit Price',
        description: 'Price per unit',
        required: true,
      });

      properties['taxRate'] = Property.Number({
        displayName: 'Tax Rate',
        description: 'Tax rate in percentage (e.g., 25 for 25%)',
        required: false,
      });
    }

    return properties;
  },
});
