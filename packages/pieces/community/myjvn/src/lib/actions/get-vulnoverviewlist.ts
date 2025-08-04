import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { propsValidation } from '@activepieces/pieces-common';
import { z } from 'zod';

export const getVulnOverviewList = createAction({
  name: 'get-vulnoverviewlist',
  displayName: 'Get Vuln Overview List',
  description: 'fetch the overview list of vulnerability countermeasures.',
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
    severity: Property.StaticDropdown({
      displayName: 'severity',
      description: 'CVSS Severity ',
      required: false,
      options: {
        options: [
          { label: 'Critical', value: 'c'},
          { label: 'Important', value: 'h' },
          { label: 'Warning', value: 'm' },
          { label: 'Attention', value: 'l' },
          { label: 'None', value: 'n' },
        ],
      },
    }),
    vector: Property.ShortText({
      displayName: 'CVSS Base Metrics',
			description: 'CVSS Base Metrics',
      required: false,
    }),
    rangeDatePublic: Property.StaticDropdown({
      displayName: 'rangeDatePublic',
      description: 'Specify discovery date range',
      required: true,
      options: {
        options: [
          { label: 'No date range specified', value: 'n'},
          { label: 'Past week', value: 'w' },
          { label: 'Past month', value: 'm' },
        ],
      },
      defaultValue: 'w'
    }),
    rangeDatePublished: Property.StaticDropdown({
      displayName: 'rangeDatePublished',
      description: 'Specify update date range',
      required: true,
      options: {
        options: [
          { label: 'No date range specified', value: 'n'},
          { label: 'Past week', value: 'w' },
          { label: 'Past month', value: 'm' },
        ],
      },
      defaultValue: 'w'
    }),
    rangeDateFirstPublished: Property.StaticDropdown({
      displayName: 'rangeDateFirstPublished',
      description: 'Specify publication date range',
      required: true,
      options: {
        options: [
          { label: 'No date range specified', value: 'n'},
          { label: 'Past week', value: 'w' },
          { label: 'Past month', value: 'm' },
        ],
      },
      defaultValue: 'w'
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
      maxCountItem: z.number().min(1).max(50,'maxCountItem (1 to 50)').optional(),
    });

    const params: Record<string, unknown> = {};

    if (context.propsValue.startItem !== undefined) params['startItem'] = context.propsValue.startItem;
    if (context.propsValue.maxCountItem !== undefined) params['maxCountItem'] = context.propsValue.maxCountItem;
    if (context.propsValue.cpeName !== undefined && context.propsValue.cpeName.length > 0) params['cpeName'] = context.propsValue.cpeName.join('+');
    if (context.propsValue.vendorId !== undefined && context.propsValue.vendorId.length > 0) params['vendorId'] = context.propsValue.vendorId.join('+');
    if (context.propsValue.productId !== undefined && context.propsValue.productId.length > 0) params['productId'] = context.propsValue.productId.join('+');
    if (context.propsValue.keyword !== undefined) params['keyword'] = context.propsValue.keyword;
    if (context.propsValue.severity !== undefined) params['severity'] = context.propsValue.severity;
    if (context.propsValue.vector !== undefined) params['vector'] = context.propsValue.vector;
    if (context.propsValue.rangeDatePublic !== undefined) params['rangeDatePublic'] = context.propsValue.rangeDatePublic;
    if (context.propsValue.rangeDatePublished !== undefined) params['rangeDatePublished'] = context.propsValue.rangeDatePublished;
    if (context.propsValue.rangeDateFirstPublished !== undefined) params['rangeDateFirstPublished'] = context.propsValue.rangeDateFirstPublished;

    const res = await httpClient.sendRequest<string[]>({
      method: HttpMethod.GET,
      url: 'https://jvndb.jvn.jp/myjvn',
      queryParams: {
        method: 'getVulnOverviewList',
        feed: 'hnd',
        ...params,
        lang: context.propsValue.lang,
      },
    });
    return res.body;
  },
});
