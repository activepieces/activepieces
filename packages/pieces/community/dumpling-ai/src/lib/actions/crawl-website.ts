import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { dumplingAuth } from '../../index';
import { DUMPLING_API_URL } from '../common/constants';

export const crawlWebsite = createAction({
  name: 'crawl_website',
  auth: dumplingAuth,
  displayName: 'Crawl Website',
  description: 'Traverse a website to collect structured content across multiple linked pages',
  props: {
    url: Property.ShortText({
      displayName: 'Start URL',
      required: true,
      description: 'The starting URL for the crawler',
    }),
    limit: Property.Number({
      displayName: 'Page Limit',
      required: false,
      description: 'Maximum number of pages to crawl (1-50)',
      defaultValue: 10,
    }),
    depth: Property.Number({
      displayName: 'Crawl Depth',
      required: false,
      description: 'Maximum depth of links to follow from the start URL (1-5)',
      defaultValue: 2,
    }),
    stayWithinDomain: Property.Checkbox({
      displayName: 'Stay Within Domain',
      required: false,
      description: 'Only crawl pages from the same domain as the start URL',
      defaultValue: true,
    }),
    format: Property.StaticDropdown({
      displayName: 'Output Format',
      required: false,
      defaultValue: 'markdown',
      options: {
        options: [
          { label: 'Markdown', value: 'markdown' },
          { label: 'Text', value: 'text' },
          { label: 'Raw', value: 'raw' },
        ],
      },
      description: 'Format of the output content',
    }),
    extractionPrompt: Property.LongText({
      displayName: 'Extraction Prompt',
      required: false,
      description: 'Specific instructions about what data to extract from each page',
    }),
  },
  async run(context) {
    const { 
      url, 
      limit, 
      depth, 
      stayWithinDomain, 
      format,
      extractionPrompt 
    } = context.propsValue;

    const requestBody: Record<string, any> = {
      url
    };

    // Add optional parameters if provided
    if (limit) requestBody['limit'] = limit;
    if (depth) requestBody['depth'] = depth;
    if (stayWithinDomain !== undefined) requestBody['stayWithinDomain'] = stayWithinDomain;
    if (format) requestBody['format'] = format;
    if (extractionPrompt) requestBody['extractionPrompt'] = extractionPrompt;

    const response = await httpClient.sendRequest({
      method: HttpMethod.POST,
      url: `${DUMPLING_API_URL}/crawl`,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${context.auth}`,
      },
      body: requestBody,
    });

    return response.body;
  },
}); 