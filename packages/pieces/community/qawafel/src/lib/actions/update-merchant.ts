import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { qawafelAuth } from '../common/auth';
import { qawafelApiCall } from '../common/client';
import { qawafelProps } from '../common/props';

export const updateMerchant = createAction({
  auth: qawafelAuth,
  name: 'update_merchant',
  displayName: 'Update Merchant',
  description:
    'Edit a merchant\'s trade name or active state. Only the fields you fill in are updated. (Legal name, CR, VAT and other identity fields cannot be changed via the API.)',
  props: {
    merchant_id: qawafelProps.merchantDropdown({
      displayName: 'Merchant to update',
      description:
        'Pick the merchant to update. Use "Create Merchant" first if they are not yet in Qawafel.',
      required: true,
    }),
    name_en: Property.ShortText({
      displayName: 'New Trade Name (English)',
      description: 'Optional. Leave blank to keep the current name.',
      required: false,
    }),
    name_ar: Property.ShortText({
      displayName: 'New Trade Name (Arabic)',
      description: 'Optional. Leave blank to keep the current name.',
      required: false,
    }),
    is_active: Property.Checkbox({
      displayName: 'Active',
      description:
        'Optional. Tick to keep the merchant active, untick to disable. Leave blank to keep the current value.',
      required: false,
    }),
    idempotency_key: qawafelProps.idempotencyKey,
  },
  async run({ auth, propsValue }) {
    const body: Record<string, unknown> = {};
    if (propsValue.name_en !== undefined) {
      body['name_en'] = propsValue.name_en;
    }
    if (propsValue.name_ar !== undefined) {
      body['name_ar'] = propsValue.name_ar;
    }
    if (propsValue.is_active !== undefined) {
      body['is_active'] = propsValue.is_active;
    }

    const response = await qawafelApiCall({
      auth,
      method: HttpMethod.PATCH,
      path: `/merchants/${propsValue.merchant_id}`,
      body,
      idempotencyKey: propsValue.idempotency_key,
    });
    return response.body;
  },
});
