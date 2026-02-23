import { createAction, Property, InputPropertyMap } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { makeRequest } from '../common';
import { valyuAuth } from '../../index';

export const extractContentAction = createAction({
  name: 'extract_content',
  displayName: 'Extract Content',
  description: 'Extract clean, structured content from web pages with optional AI-powered summarization.',
  auth: valyuAuth,
  props: {
    urls: Property.Array({
      displayName: 'URLs',
      description: 'URLs to extract content from (1-10 URLs per request).',
      required: true,
    }),
    response_length: Property.StaticDropdown({
      displayName: 'Response Length',
      description: 'Controls the length of content returned per result.',
      required: false,
      defaultValue: 'short',
      options: {
        options: [
          { label: 'Short (25k chars)', value: 'short' },
          { label: 'Medium (50k chars)', value: 'medium' },
          { label: 'Large (100k chars)', value: 'large' },
          { label: 'Max (no limit)', value: 'max' },
        ],
      },
    }),
    max_price_dollars: Property.Number({
      displayName: 'Max Price',
      description: 'Maximum cost limit in dollars for the entire request.',
      required: false,
    }),
    extract_effort: Property.StaticDropdown({
      displayName: 'Extract Effort',
      description: 'Processing effort level.',
      required: false,
      defaultValue: 'normal',
      options: {
        options: [
          { label: 'Normal (fastest)', value: 'normal' },
          { label: 'High (better quality)', value: 'high' },
          { label: 'Auto (chooses automatically)', value: 'auto' },
        ],
      },
    }),
    screenshot: Property.Checkbox({
      displayName: 'Screenshot',
      description: 'Capture page screenshots. Results will include a screenshot_url field.',
      required: false,
      defaultValue: false,
    }),
    enable_summary: Property.StaticDropdown({
      displayName: 'AI Processing',
      description: 'Enable AI-powered processing of the content.',
      required: false,
      defaultValue: 'none',
      options: {
        options: [
          { label: 'None', value: 'none' },
          { label: 'Default Summary', value: 'default' },
          { label: 'Custom Instructions', value: 'custom' },
          { label: 'Structured JSON', value: 'structured' },
        ],
      },
    }),
    summaryOptions: Property.DynamicProperties({
      displayName: 'Summary Options',
      required: false,
      refreshers: ['enable_summary'],
      auth: valyuAuth,
      props: async (propsValue): Promise<InputPropertyMap> => {
        const summaryMode = propsValue['enable_summary'] as unknown as string;
        if (summaryMode === 'custom') {
          return {
            custom_summary_instructions: Property.LongText({
              displayName: 'Summary Instructions',
              description: 'Custom instructions for AI summarization (up to 500 characters).',
              required: false,
            }),
          };
        }
        if (summaryMode === 'structured') {
          return {
            json_schema: Property.LongText({
              displayName: 'JSON Schema',
              description: 'JSON schema for structured data extraction (see json-schema.org).',
              required: false,
            }),
          };
        }
        return {};
      },
    }),
  },
  async run(context) {
    const apiKey = context.auth;

    const body: Record<string, unknown> = {
      urls: context.propsValue.urls,
    };

    const optionalProps = [
      'response_length',
      'max_price_dollars',
      'extract_effort',
      'screenshot',
    ];

    for (const prop of optionalProps) {
      const val = context.propsValue[prop as keyof typeof context.propsValue];
      if (val !== undefined && val !== null && val !== '') {
        body[prop] = val;
      }
    }

    const summaryMode = context.propsValue.enable_summary;
    const summaryOptions = context.propsValue.summaryOptions as Record<string, unknown> | undefined;
    if (summaryMode === 'default') {
      body['summary'] = true;
    } else if (summaryMode === 'custom' && summaryOptions?.['custom_summary_instructions']) {
      body['summary'] = summaryOptions['custom_summary_instructions'];
    } else if (summaryMode === 'structured' && summaryOptions?.['json_schema']) {
      try {
        body['summary'] = JSON.parse(summaryOptions['json_schema'] as string);
      } catch {
        throw new Error('Invalid JSON schema provided');
      }
    }

    const response = await makeRequest(apiKey as unknown as string, HttpMethod.POST, '/v1/contents', body);
    return response;
  },
});
