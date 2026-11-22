import { DynamicPropsValue, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { bokioAuth } from './auth';
import { bokioClient } from './client';

function unitTypeDropdown({ required }: { required: boolean }) {
  return Property.StaticDropdown({
    displayName: 'Unit Type',
    description: 'Unit type for the item',
    required,
    options: { options: UNIT_TYPE_OPTIONS },
  });
}

function productTypeDropdown({ required }: { required: boolean }) {
  return Property.StaticDropdown({
    displayName: 'Product Type',
    description: 'Goods or services',
    required,
    options: { options: PRODUCT_TYPE_OPTIONS },
  });
}

function itemTypeDropdown({ description }: { description: string }) {
  return Property.StaticDropdown({
    displayName: 'Item Type',
    description,
    required: true,
    options: { options: ITEM_TYPE_OPTIONS },
  });
}

function aiLineItemProps() {
  return {
    itemType: itemTypeDropdown({
      description:
        'salesItem = a priced line; descriptionOnlyItem = a text-only line (only description is used).',
    }),
    description: Property.ShortText({
      displayName: 'Description',
      description:
        'Line text. Required unless Item ID is set for a salesItem (then the item description is used).',
      required: false,
    }),
    itemId: Property.ShortText({
      displayName: 'Item ID',
      placeholder: 'e.g. 3fa85f64-5717-4562-b3fc-2c963f66afa6',
      description:
        'Optional saved item UUID from List Items. Its description, product type, unit type and tax rate are used.',
      required: false,
    }),
    productType: productTypeDropdown({ required: false }),
    unitType: unitTypeDropdown({ required: false }),
    quantity: Property.Number({
      displayName: 'Quantity',
      description: 'Required for a salesItem.',
      required: false,
    }),
    unitPrice: Property.Number({
      displayName: 'Unit Price',
      description: 'Price per unit excluding VAT. Required for a salesItem.',
      required: false,
    }),
    taxRate: Property.Number({
      displayName: 'Tax Rate',
      description: 'VAT percent, for example 25. Required for a salesItem without Item ID.',
      required: false,
    }),
  };
}

function pageProps() {
  return {
    page: Property.Number({
      displayName: 'Page',
      description: 'Page number, starting at 1. Defaults to 1.',
      required: false,
    }),
    pageSize: Property.Number({
      displayName: 'Page Size',
      description: 'Results per page, 1 to 100. Defaults to 25.',
      required: false,
    }),
  };
}

export const invoiceIdDropdown = Property.Dropdown({
  auth: bokioAuth,
  displayName: 'Invoice',
  description: 'Select a draft invoice',
  required: true,
  refreshers: [],
  options: async ({ auth }) => {
    if (!auth) {
      return {
        disabled: true,
        options: [],
        placeholder: 'Connect your Bokio account first',
      };
    }
    try {
      const options: { label: string; value: string }[] = [];
      let page = 1;
      let totalPages = 1;
      do {
        const body = await bokioClient.request<unknown>({
          auth: auth.props,
          method: HttpMethod.GET,
          path: '/invoices',
          operation: 'list invoices',
          queryParams: bokioClient.listParams({
            page,
            pageSize: 100,
            query: 'status==draft',
          }),
        });
        const result = bokioClient.normalizePage<unknown>(body);
        for (const invoice of result.items) {
          if (bokioClient.isRecord(invoice) && typeof invoice['id'] === 'string') {
            const customer = bokioClient.isRecord(invoice['customerRef'])
              ? invoice['customerRef']['name']
              : undefined;
            const number = invoice['invoiceNumber'] ?? 'draft';
            options.push({
              label: `#${String(number)}${
                typeof customer === 'string' ? ` - ${customer}` : ''
              } (${String(invoice['invoiceDate'] ?? '')})`,
              value: invoice['id'],
            });
          }
        }
        totalPages = result.totalPages;
        page += 1;
      } while (page <= totalPages && page <= MAX_DROPDOWN_PAGES);
      return { disabled: false, options };
    } catch (error) {
      return {
        disabled: true,
        options: [],
        placeholder: error instanceof Error ? error.message : 'Could not load invoices',
      };
    }
  },
});

export const lineItemsProps = Property.DynamicProperties({
  auth: bokioAuth,
  displayName: 'Item Details',
  description: 'Configure item details based on item type',
  required: false,
  refreshers: ['itemType'],
  props: async ({ itemType }) => {
    const properties: DynamicPropsValue = {
      description: Property.ShortText({
        displayName: 'Description',
        description: 'Description of the line item (optional for a sales item that uses an Item Reference ID)',
        required: false,
      }),
    };
    if (itemType === 'salesItem') {
      properties['itemRefId'] = Property.ShortText({
        displayName: 'Item Reference ID',
        placeholder: 'e.g. 3fa85f64-5717-4562-b3fc-2c963f66afa6',
        description: 'UUID of a saved item from List Items. Its description, product type, unit type and tax rate are used.',
        required: false,
      });
      properties['productType'] = productTypeDropdown({ required: false });
      properties['unitType'] = unitTypeDropdown({ required: false });
      properties['quantity'] = Property.Number({
        displayName: 'Quantity',
        description: 'Quantity of the item',
        required: true,
        defaultValue: 1,
      });
      properties['unitPrice'] = Property.Number({
        displayName: 'Unit Price',
        description: 'Price per unit excluding VAT',
        required: true,
      });
      properties['taxRate'] = Property.Number({
        displayName: 'Tax Rate',
        description: 'VAT percent (e.g. 25). Required unless an Item Reference ID is set.',
        required: false,
      });
    }
    return properties;
  },
});

export const itemDetailsProps = Property.DynamicProperties({
  auth: bokioAuth,
  displayName: 'Item Details',
  description: 'Configure item details based on item type',
  required: false,
  refreshers: ['itemType'],
  props: async ({ itemType }) => {
    const properties: DynamicPropsValue = {
      description: Property.ShortText({
        displayName: 'Description',
        description: 'Item name/description, 1 to 500 characters',
        required: true,
      }),
    };
    if (itemType === 'salesItem') {
      properties['productType'] = productTypeDropdown({ required: true });
      properties['unitType'] = unitTypeDropdown({ required: true });
      properties['unitPrice'] = Property.Number({
        displayName: 'Unit Price',
        description: 'Price per unit excluding VAT',
        required: true,
      });
      properties['taxRate'] = Property.Number({
        displayName: 'Tax Rate',
        description: 'VAT percent, for example 25',
        required: true,
      });
    }
    return properties;
  },
});

const MAX_DROPDOWN_PAGES = 20;

const PRODUCT_TYPE_OPTIONS = [
  { label: 'Goods', value: 'goods' },
  { label: 'Services', value: 'services' },
];

const ITEM_TYPE_OPTIONS = [
  { label: 'Sales Item', value: 'salesItem' },
  { label: 'Description Only Item', value: 'descriptionOnlyItem' },
];

const UNIT_TYPE_OPTIONS = [
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
];

export const bokioProps = {
  unitTypeDropdown,
  productTypeDropdown,
  itemTypeDropdown,
  aiLineItemProps,
  pageProps,
};
