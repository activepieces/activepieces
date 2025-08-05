import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { propsValidation } from '@activepieces/pieces-common';
import { myjvnCommon } from '../common';
import { Parser } from 'xml2js';
import { z } from 'zod';

export const getVulnDetailInfo = createAction({
  name: 'get-vulnDetailInfo',
  displayName: 'Get Vuln Detail Info',
  description: 'fetch detailed vulnerability information.',
  props: {
    startItem: Property.Number({
      displayName: 'startItem',
			description: 'Start entry index (1 or greater))',
      required: false,
      defaultValue: 1
    }),
    maxCountItem: Property.Number({
      displayName: 'maxCountItem',
			description: 'Number of Entries to Retrieve (1 to 10)',
      required: false,
      defaultValue: 1
    }),
    vulnId: Property.Array({
      displayName: 'vulnId',
			description: 'Vulnerability ID (JVNDB-YYYY-XXXXXX)',
      required: true,
      defaultValue: [],
    }),
    lang: myjvnCommon.lang,
    ft: myjvnCommon.ft,
  },
  async run(context) {
    await propsValidation.validateZod(context.propsValue, {
      startItem: z.number().min(1,'startItem (1 or greater)').optional(),
      maxCountItem: z.number().min(1).max(10,'maxCountItem (1 to 10)').optional(),
    });

    const {startItem, maxCountItem, vulnId, lang, ft} = context.propsValue;

    const params: Record<string, unknown> = {};

    if (startItem) params['startItem'] = startItem;
    if (maxCountItem) params['maxCountItem'] = maxCountItem;
    if (vulnId && vulnId.length > 0) params['vulnId'] = vulnId.join('+');
    if (lang) params['lang'] = lang;

    const res = await httpClient.sendRequest<string[]>({
      method: HttpMethod.GET,
      url: myjvnCommon.baseUrl,
      queryParams: {
        method: 'getVulnDetailInfo',
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
