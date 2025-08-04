import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { propsValidation } from '@activepieces/pieces-common';
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
      maxCountItem: z.number().min(1).max(10,'maxCountItem (1 to 10)').optional(),
    });

    const params: Record<string, unknown> = {};

    if (context.propsValue.startItem !== undefined) params['startItem'] = context.propsValue.startItem;
    if (context.propsValue.maxCountItem !== undefined) params['maxCountItem'] = context.propsValue.maxCountItem;

    const res = await httpClient.sendRequest<string[]>({
      method: HttpMethod.GET,
      url: 'https://jvndb.jvn.jp/myjvn',
      queryParams: {
        method: 'getVulnDetailInfo',
        feed: 'hnd',
        ...params,
        vulnId: context.propsValue.vulnId.join('+'),
        lang: context.propsValue.lang,
      },
    });
    return res.body;
  },
});
