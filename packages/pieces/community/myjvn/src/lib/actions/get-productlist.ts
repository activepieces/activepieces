import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { propsValidation } from '@activepieces/pieces-common';
import { z } from 'zod';

export const getProductList = createAction({
  name: 'get-productlist',
  displayName: 'Get Product List',
  description: 'fetch the list of Product names.',
  props: {
    startItem: Property.Number({
      displayName: 'startItem',
			description: 'Start entry index (1 or greater))',
      required: false,
      defaultValue: 1
    }),
    maxCountItem: Property.Number({
      displayName: 'maxCountItem',
			description: 'Number of Entries to Retrieve (1 to 10000)',
      required: false,
      defaultValue: 10000
    }),
    cpeName: Property.Array({
      displayName: 'cpeNames',
			description: 'CPE Product Name (Format: cpe:/{part}:{vendor}:{product})',
      required: false,
      defaultValue: [],
    }),
    vendorId: Property.Array({
      displayName: 'vendorIds',
			description: 'vendorId',
      required: false,
      defaultValue: [],
    }),
    productId: Property.Array({
      displayName: 'productIds',
			description: 'productId',
      required: false,
      defaultValue: [],
    }),
    keyword: Property.ShortText({
      displayName: 'keyword',
			description: 'Keyword for partial match search of vendor name',
      required: false,
    }),
    lang: Property.StaticDropdown({
      displayName: 'lang',
      description: 'language',
      required: true,
      options: {
        options: [
          {
            label: 'japanese',
            value: 'ja',
          },
          {
            label: 'english',
            value: 'en',
          },
        ],
      },
      defaultValue: 'ja'
    })
  },
  async run(context) {
    await propsValidation.validateZod(context.propsValue, {
      startItem: z.number().min(1,'startItem (1 or greater)').optional(),
      maxCountItem: z.number().min(1).max(10000,'maxCountItem (1 to 10000)').optional(),
    });

    const params: Record<string, unknown> = {};

    if (context.propsValue.startItem !== undefined) params['startItem'] = context.propsValue.startItem;
    if (context.propsValue.maxCountItem !== undefined) params['maxCountItem'] = context.propsValue.maxCountItem;
    if (context.propsValue.cpeName !== undefined && context.propsValue.cpeName.length > 0) params['cpeName'] = context.propsValue.cpeName.join('+');
    if (context.propsValue.vendorId !== undefined && context.propsValue.vendorId.length > 0) params['vendorId'] = context.propsValue.vendorId.join('+');
    if (context.propsValue.productId !== undefined && context.propsValue.productId.length > 0) params['productId'] = context.propsValue.productId.join('+');
    if (context.propsValue.keyword !== undefined) params['keyword'] = context.propsValue.keyword;

    const res = await httpClient.sendRequest<string[]>({
      method: HttpMethod.GET,
      url: 'https://jvndb.jvn.jp/myjvn',
      queryParams: {
        method: 'getProductList',
        feed: 'hnd',
        ...params,
        lang: context.propsValue.lang,
      },
    });
    return res.body;
  },
});
