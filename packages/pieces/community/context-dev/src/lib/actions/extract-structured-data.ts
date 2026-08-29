import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';

import { contextDevAuth } from '../auth';
import { contextApiCall, flattenRecord } from '../common/client';

export const extractStructuredData = createAction({
  name: 'extract_structured_data',
  classification: 'READ',
  displayName: 'Extract Structured Data',
  description: 'Extract data from one or more web pages into a JSON schema.',
  audience: 'both',
  aiMetadata: {
    description:
      'Extract structured data from a website into a caller-provided JSON schema. Use this when the target URL and desired fields are known; use Search Web first when the task requires broader discovery.',
    idempotent: true,
  },
  auth: contextDevAuth,
  props: {
    url: Property.ShortText({
      displayName: 'URL',
      description: 'Full HTTP or HTTPS URL where extraction should begin.',
      required: true,
      placeholder: 'https://www.context.dev/pricing',
    }),
    schema: Property.Json({
      displayName: 'JSON Schema',
      description:
        'JSON Schema describing the data to return, such as an object with a plans array containing name and price fields.',
      required: true,
    }),
    instructions: Property.LongText({
      displayName: 'Instructions',
      description:
        'Optional extraction guidance in plain language, up to 2000 characters.',
      required: false,
    }),
    maxPages: Property.Number({
      displayName: 'Maximum Pages',
      description: 'Maximum number of pages to analyze, from 1 to 50.',
      required: false,
      defaultValue: 5,
      display: 'stepper',
      min: 1,
      max: 50,
      step: 1,
    }),
    maxDepth: Property.Number({
      displayName: 'Maximum Depth',
      description: 'Maximum number of link levels away from the start URL.',
      required: false,
      min: 0,
      advanced: true,
    }),
    followSubdomains: Property.Checkbox({
      displayName: 'Follow Subdomains',
      description:
        'Allow extraction to follow links to subdomains of the start domain.',
      required: false,
      defaultValue: false,
      advanced: true,
    }),
    factCheck: Property.Checkbox({
      displayName: 'Fact Check',
      description: 'Validate extracted values against the pages analyzed.',
      required: false,
      defaultValue: false,
      advanced: true,
    }),
    maxAgeMs: Property.Number({
      displayName: 'Cache Maximum Age',
      description:
        'Maximum cache age in milliseconds. Use 0 to force fresh page fetches.',
      required: false,
      defaultValue: 86400000,
      min: 0,
      max: 2592000000,
      advanced: true,
    }),
    waitForMs: Property.Number({
      displayName: 'Wait After Load',
      description:
        'Extra wait after each page loads, in milliseconds from 0 to 30000.',
      required: false,
      min: 0,
      max: 30000,
      advanced: true,
    }),
    timeoutMs: Property.Number({
      displayName: 'Timeout',
      description: 'Maximum request duration in milliseconds.',
      required: false,
      defaultValue: 120000,
      min: 1000,
      max: 180000,
      advanced: true,
    }),
    outputFormat: Property.StaticDropdown({
      displayName: 'Output Format',
      description:
        'Use flat fields for tables and mappings, or return the complete API response.',
      required: false,
      defaultValue: 'flat',
      advanced: true,
      options: {
        options: [
          { label: 'Flat Fields', value: 'flat' },
          { label: 'Raw API Response', value: 'raw' },
        ],
      },
    }),
  },
  async run(context) {
    const response = await contextApiCall<ExtractResponse>({
      apiKey: context.auth.secret_text,
      method: HttpMethod.POST,
      path: '/web/extract',
      body: buildExtractRequest({
        url: context.propsValue.url,
        schema: context.propsValue.schema,
        instructions: context.propsValue.instructions,
        maxPages: context.propsValue.maxPages,
        maxDepth: context.propsValue.maxDepth,
        followSubdomains: context.propsValue.followSubdomains,
        factCheck: context.propsValue.factCheck,
        maxAgeMs: context.propsValue.maxAgeMs,
        waitForMs: context.propsValue.waitForMs,
        timeoutMs: context.propsValue.timeoutMs,
      }),
    });

    if (context.propsValue.outputFormat === 'raw') {
      return response;
    }

    return {
      status: response.status,
      source_url: response.url,
      urls_analyzed: response.urls_analyzed.join(', '),
      ...flattenRecord(response.data, 'data'),
      ...flattenRecord(response.metadata, 'metadata'),
    };
  },
});

export function buildExtractRequest(
  params: ExtractRequestParams
): Record<string, unknown> {
  return {
    url: params.url,
    schema: params.schema,
    ...(params.instructions ? { instructions: params.instructions } : {}),
    maxPages: params.maxPages,
    ...(params.maxDepth !== undefined ? { maxDepth: params.maxDepth } : {}),
    followSubdomains: params.followSubdomains,
    factCheck: params.factCheck,
    maxAgeMs: params.maxAgeMs,
    waitForMs: params.waitForMs,
    timeoutMS: params.timeoutMs,
  };
}

type ExtractResponse = {
  status: string;
  url: string;
  urls_analyzed: string[];
  data: Record<string, unknown>;
  metadata: Record<string, unknown>;
};

type ExtractRequestParams = {
  url: string;
  schema: unknown;
  instructions?: string;
  maxPages?: number;
  maxDepth?: number;
  followSubdomains?: boolean;
  factCheck?: boolean;
  maxAgeMs?: number;
  waitForMs?: number;
  timeoutMs?: number;
};
