import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { propsValidation } from '@activepieces/pieces-common';
import { myjvnCommon } from '../common';
import { Parser } from 'xml2js';
import { z } from 'zod';

export const getVendorList = createAction({
  name: 'get-vendorlist',
  displayName: 'Get Vendor List',
  description: 'fetch the list of vendor names (product developers).',
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
    keyword: Property.ShortText({
      displayName: 'keyword',
			description: 'Keyword for partial match search of vendor name',
      required: false,
    }),
    lang: myjvnCommon.lang,
    ft: myjvnCommon.ft,
  },
  async run(context) {
    await propsValidation.validateZod(context.propsValue, {
      startItem: z.number().min(1,'startItem (1 or greater)').optional(),
      maxCountItem: z.number().min(1).max(10000,'maxCountItem (1 to 10000)').optional(),
    });

    const {startItem, maxCountItem, cpeName, keyword, lang, ft} = context.propsValue;

    const params: Record<string, unknown> = {};

    if (startItem) params['startItem'] = startItem;
    if (maxCountItem) params['maxCountItem'] = maxCountItem;
    if (cpeName && cpeName.length > 0) params['cpeName'] = cpeName.join('+');
    if (keyword) params['keyword'] = keyword;
    if (lang) params['lang'] = lang;

    const res = await httpClient.sendRequest<string[]>({
      method: HttpMethod.GET,
      url: myjvnCommon.baseUrl,
      queryParams: {
        method: 'getVendorList',
        feed: 'hnd',
        ...params,
      },
    });

    if (ft === 'json') {
      const parser = new Parser({explicitArray: false});
      const jsonData = await parser.parseStringPromise(res.body);
      return jsonData;
    } else {
      return res.body;
    }
  },
});
