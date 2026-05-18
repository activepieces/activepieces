import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { barcodeLookupAuth } from '../common/auth';

export const searchByBarcode = createAction({
  auth: barcodeLookupAuth,
  name: 'searchByBarcode',
  displayName: 'Search By Barcode',
  description: 'Search for product information by barcode',
  props: {
    barcode: Property.ShortText({
      displayName: 'Barcode',
      description: 'The barcode/UPC/EAN number to search for',
      required: true,
    }),
    formatted: Property.Checkbox({
      displayName: 'Formatted Output',
      description: 'Return results in a clean, easy to read format',
      required: false,
      defaultValue: true,
    }),
  },
  async run(context) {
    const barcode = context.propsValue.barcode;
    const formatted = context.propsValue.formatted ? 'y' : 'n';

    const url = `https://api.barcodelookup.com/v3/products?barcode=${encodeURIComponent(
      barcode
    )}&formatted=${formatted}&key=${context.auth.secret_text}`;

    const response = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: url,
    });

    return response.body;
  },
});
