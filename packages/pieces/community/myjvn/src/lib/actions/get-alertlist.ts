import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { propsValidation } from '@activepieces/pieces-common';
import { z } from 'zod';

export const getAlertList = createAction({
  name: 'get-alertlist',
  displayName: 'Get Alert List',
  description: 'fetch the list of security warnings and advisories.',
  props: {
    startItem: Property.Number({
      displayName: 'startItem',
			description: 'Start entry index (1 or greater))',
      required: false,
      defaultValue: 1
    }),
    maxCountItem: Property.Number({
      displayName: 'maxCountItem',
			description: 'Number of Entries to Retrieve (1 to 50)',
      required: false,
      defaultValue: 50
    }),
    datePublished: Property.ShortText({
      displayName: 'datePublished',
			description: 'Last Updated Year (YYYY)',
      required: false,
    }),
    dateFirstPublished: Property.ShortText({
      displayName: 'dateFirstPublished',
			description: 'First Published Year (YYYY)',
      required: false,
    }),
    cpeName: Property.Array({
      displayName: 'cpeNames',
			description: 'CPE Product Name (Format: cpe:/{part}:{vendor}:{product})',
      required: false,
      defaultValue: [],
    }),
    ft: Property.StaticDropdown({
      displayName: 'format',
      description: 'Response Format',
      required: true,
      options: {
        options: [
          {
            label: 'json',
            value: 'json',
          },
          {
            label: 'xml',
            value: 'xml',
          },
        ],
      },
      defaultValue: 'json'
    })
  },
  async run(context) {
    await propsValidation.validateZod(context.propsValue, {
      startItem: z.number().min(1,'startItem (1 or greater)').optional(),
      maxCountItem: z.number().min(1).max(50,'maxCountItem (1 to 50)').optional(),
      datePublished: z.string().regex(/^\d{4}$/, 'datePublished (YYYY)').optional(),
      dateFirstPublished: z.string().regex(/^\d{4}$/, 'dateFirstPublished (YYYY)').optional(),
    });

    const params: Record<string, unknown> = {};

    if (context.propsValue.startItem !== undefined) params['startItem'] = context.propsValue.startItem;
    if (context.propsValue.maxCountItem !== undefined) params['maxCountItem'] = context.propsValue.maxCountItem;
    if (context.propsValue.datePublished !== undefined) params['datePublished'] = context.propsValue.datePublished;
    if (context.propsValue.dateFirstPublished !== undefined) params['dateFirstPublished'] = context.propsValue.dateFirstPublished;
    if (context.propsValue.cpeName !== undefined && context.propsValue.cpeName.length > 0) params['cpeName'] = context.propsValue.cpeName.join('+');

    const res = await httpClient.sendRequest<string[]>({
      method: HttpMethod.GET,
      url: 'https://jvndb.jvn.jp/myjvn',
      queryParams: {
        method: 'getAlertList',
        feed: 'hnd',
        ...params,
        ft: context.propsValue.ft,
      },
    });
    return res.body;
  },
});
