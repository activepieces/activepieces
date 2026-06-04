import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { qawafelAuth } from '../common/auth';
import { qawafelApiCall } from '../common/client';
import { qawafelProps } from '../common/props';

export const createProduct = createAction({
  auth: qawafelAuth,
  name: 'create_product',
  displayName: 'Create Product',
  description:
    'Add a new product to your Qawafel catalog. The workhorse for catalog sync from your ERP or storefront into Qawafel.',
  props: {
    type: Property.StaticDropdown<'sale' | 'purchase'>({
      displayName: 'Product Type',
      description:
        'Pick **Sale** if this is a product you sell. Pick **Purchase** if it is a product you buy from a supplier (you must also pick the supplier below).',
      required: true,
      defaultValue: 'sale',
      options: {
        disabled: false,
        options: [
          { label: 'Sale (something you sell)', value: 'sale' },
          {
            label: 'Purchase (something you buy from a supplier)',
            value: 'purchase',
          },
        ],
      },
    }),
    sku: Property.ShortText({
      displayName: 'SKU',
      description:
        'Stock Keeping Unit — your unique product code. Must be unique within your Qawafel tenant.',
      required: true,
    }),
    name_en: Property.ShortText({
      displayName: 'Name (English)',
      description: 'Product name in English. Shown on invoices and quotations.',
      required: true,
    }),
    name_ar: Property.ShortText({
      displayName: 'Name (Arabic)',
      description:
        'Product name in Arabic. Required by Qawafel for ZATCA-compliant invoices.',
      required: true,
    }),
    unit_price: Property.ShortText({
      displayName: 'Unit Price (SAR)',
      description:
        'Default price per unit in Saudi Riyals as a decimal string with two places, e.g. `99.00` or `1234.56`.',
      required: true,
    }),
    supplier_id: qawafelProps.merchantDropdown({
      displayName: 'Supplier',
      description:
        'Required when **Product Type** is `Purchase`. Pick the supplier merchant this product is bought from. Leave blank for `Sale` products.',
      required: false,
      type: 'supplier',
    }),
    is_taxable: Property.Checkbox({
      displayName: 'VAT Applies',
      description:
        'Tick this if 15% VAT applies to this product. Untick for VAT-exempt items.',
      required: false,
      defaultValue: true,
    }),
    description_en: Property.LongText({
      displayName: 'Description (English)',
      description: 'Optional. Longer description shown on documents.',
      required: false,
    }),
    description_ar: Property.LongText({
      displayName: 'Description (Arabic)',
      description: 'Optional. Longer description in Arabic.',
      required: false,
    }),
    barcode: Property.ShortText({
      displayName: 'Barcode',
      description: 'Optional. UPC, EAN or GTIN barcode.',
      required: false,
    }),

    is_active: Property.Checkbox({
      displayName: 'Active',
      description:
        'Active products show up in lookups and can be sold. Untick to soft-disable.',
      required: false,
      defaultValue: true,
    }),
    external_ref: qawafelProps.externalRef('Your Reference ID'),
    idempotency_key: qawafelProps.idempotencyKey,
  },
  async run({ auth, propsValue }) {
    if (propsValue.type === 'purchase' && !propsValue.supplier_id) {
      throw new Error('Supplier is required when Product Type is Purchase');
    }

    const body: Record<string, unknown> = {
      type: propsValue.type,
      sku: propsValue.sku,
      name_en: propsValue.name_en,
      name_ar: propsValue.name_ar,
      unit_price: propsValue.unit_price,
    };

    if (propsValue.supplier_id && propsValue.type === 'purchase') {
      body['supplier_id'] = propsValue.supplier_id;
    }

    if (propsValue.is_taxable === false) {
      body['is_taxable'] = false;
    }

    if (propsValue.description_en) {
      body['description_en'] = propsValue.description_en;
    }
    if (propsValue.description_ar) {
      body['description_ar'] = propsValue.description_ar;
    }
    if (propsValue.barcode) {
      body['barcode'] = propsValue.barcode;
    }
    if (propsValue.is_active === false) {
      body['is_active'] = false;
    }
    const response = await qawafelApiCall({
      auth,
      method: HttpMethod.POST,
      path: '/products',
      body,
      idempotencyKey: propsValue.idempotency_key,
    });
    return response.body;
  },
});
