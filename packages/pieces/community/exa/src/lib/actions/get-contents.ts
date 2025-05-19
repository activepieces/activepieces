import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { makeRequest } from '../common';
import { exaAuth } from '../../index';

export const getContentsAction = createAction({
  name: 'get_contents',
  displayName: 'Get Contents',
  description: 'Retrieve clean HTML content from specified URLs.',
  auth: exaAuth,
  props: {
    urls: Property.Array({
      displayName: 'URLs',
      required: true,
      description: 'Array of URLs to crawl',
    }),
    text: Property.Checkbox({
      displayName: 'Return Full Text',
      description: 'If true, returns full page text. If false, disables text return.',
      required: false,
      defaultValue: true,
    }),
    livecrawl: Property.StaticDropdown({
      displayName: 'Livecrawl Option',
      description: 'Options for livecrawling pages.',
      required: false,
      options: {
        options: [
          { label: 'Never', value: 'never' },
          { label: 'Fallback', value: 'fallback' },
          { label: 'Always', value: 'always' },
          { label: 'Auto', value: 'auto' },
        ],
      },
    }),
    livecrawlTimeout: Property.Number({
      displayName: 'Livecrawl Timeout (ms)',
      description: 'Timeout for livecrawling in milliseconds.',
      required: false,
    }),
    subpages: Property.Number({
      displayName: 'Number of Subpages',
      description: 'Number of subpages to crawl.',
      required: false,
    }),
    subpageTarget: Property.ShortText({
      displayName: 'Subpage Target',
      description: 'Keyword(s) to find specific subpages.',
      required: false,
    }),
  },
  async run(context) {
    const apiKey = context.auth as string;

    const body: Record<string, unknown> = {
      urls: context.propsValue.urls,
    };

    if (context.propsValue.text !== undefined) body['text'] = context.propsValue.text;
    if (context.propsValue.livecrawl) body['livecrawl'] = context.propsValue.livecrawl;
    if (context.propsValue.livecrawlTimeout !== undefined) body['livecrawlTimeout'] = context.propsValue.livecrawlTimeout;
    if (context.propsValue.subpages !== undefined) body['subpages'] = context.propsValue.subpages;
    if (context.propsValue.subpageTarget) body['subpageTarget'] = context.propsValue.subpageTarget;


    const response =  await makeRequest(apiKey, HttpMethod.POST, '/contents', body) as {results:Record<string,any>[]};
    return response.results;
  },
});
