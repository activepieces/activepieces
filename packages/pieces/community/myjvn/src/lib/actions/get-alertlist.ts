import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { propsValidation } from '@activepieces/pieces-common';
import { myjvnCommon } from '../common';
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
    ft: myjvnCommon.ft,
  },
  async run(context) {
    await propsValidation.validateZod(context.propsValue, {
      startItem: z.number().min(1,'startItem (1 or greater)').optional(),
      maxCountItem: z.number().min(1).max(50,'maxCountItem (1 to 50)').optional(),
      datePublished: z.string().regex(/^\d{4}$/, 'datePublished (YYYY)').optional(),
      dateFirstPublished: z.string().regex(/^\d{4}$/, 'dateFirstPublished (YYYY)').optional(),
    });

    const {startItem, maxCountItem, datePublished, dateFirstPublished, cpeName, ft} = context.propsValue;

    const params: Record<string, unknown> = {};

    if (startItem) params['startItem'] = startItem;
    if (maxCountItem) params['maxCountItem'] = maxCountItem;
    if (datePublished) params['datePublished'] = datePublished;
    if (dateFirstPublished) params['dateFirstPublished'] = dateFirstPublished;
    if (cpeName && cpeName.length > 0) params['cpeName'] = cpeName.join('+');
    if (ft) params['ft'] = ft;

    const res = await httpClient.sendRequest<string[]>({
      method: HttpMethod.GET,
      url: myjvnCommon.baseUrl,
      queryParams: {
        method: 'getAlertList',
        feed: 'hnd',
        ...params,
      },
    });
    return res.body;
  },
});
