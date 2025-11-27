import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { linkupAuth } from '../common/auth';
import { linkupApiCall } from '../common/client';

export const search = createAction({
  auth: linkupAuth,
  name: 'search',
  displayName: 'Search the Web',
  description: 'Search the web for relevant content based on a natural language query. Perfect for grounding LLM responses with factual data.',
  props: {
    q: Property.ShortText({
      displayName: 'Query',
      description: 'The natural language question or query to search for',
      required: true,
    }),
    depth: Property.StaticDropdown({
      displayName: 'Search Depth',
      description: 'Standard returns results faster; deep takes longer but yields more comprehensive results',
      required: true,
      defaultValue: 'standard',
      options: {
        options: [
          { label: 'Standard', value: 'standard' },
          { label: 'Deep', value: 'deep' },
        ],
      },
    }),
    outputType: Property.StaticDropdown({
      displayName: 'Output Type',
      description: 'Format of the response. Use structured for custom JSON format.',
      required: true,
      defaultValue: 'searchResults',
      options: {
        options: [
          { label: 'Search Results', value: 'searchResults' },
          { label: 'Sourced Answer', value: 'sourcedAnswer' },
          { label: 'Structured', value: 'structured' },
        ],
      },
    }),
    structuredOutputSchema: Property.LongText({
      displayName: 'Structured Output Schema',
      description: 'JSON schema (as a string) for the desired response format. Required only when Output Type is "structured".',
      required: false,
    }),
    includeSources: Property.Checkbox({
      displayName: 'Include Sources',
      description: 'Include sources in the response. Only relevant when Output Type is "structured".',
      required: false,
      defaultValue: false,
    }),
    includeImages: Property.Checkbox({
      displayName: 'Include Images',
      description: 'Include images in search results',
      required: false,
      defaultValue: false,
    }),
    fromDate: Property.ShortText({
      displayName: 'From Date',
      description: 'Start date for search results in ISO 8601 format (YYYY-MM-DD), e.g., 2025-01-01',
      required: false,
    }),
    toDate: Property.ShortText({
      displayName: 'To Date',
      description: 'End date for search results in ISO 8601 format (YYYY-MM-DD), e.g., 2025-01-01',
      required: false,
    }),
    includeDomains: Property.Array({
      displayName: 'Include Domains',
      description: 'Domains to search within (up to 100 domains). Leave empty to search all domains.',
      required: false,
    }),
    excludeDomains: Property.Array({
      displayName: 'Exclude Domains',
      description: 'Domains to exclude from search results',
      required: false,
    }),
    includeInlineCitations: Property.Checkbox({
      displayName: 'Include Inline Citations',
      description: 'Include inline citations in the answer. Only relevant when Output Type is "sourcedAnswer".',
      required: false,
      defaultValue: false,
    }),
    maxResults: Property.Number({
      displayName: 'Max Results',
      description: 'Maximum number of results to return',
      required: false,
    }),
  },
  async run(context) {
    const {
      q,
      depth,
      outputType,
      structuredOutputSchema,
      includeSources,
      includeImages,
      fromDate,
      toDate,
      includeDomains,
      excludeDomains,
      includeInlineCitations,
      maxResults,
    } = context.propsValue;

    if (outputType === 'structured' && !structuredOutputSchema) {
      throw new Error('Structured Output Schema is required when Output Type is "structured"');
    }

    const body: Record<string, any> = {
      q,
      depth,
      outputType,
    };

    if (outputType === 'structured' && structuredOutputSchema) {
      body['structuredOutputSchema'] = structuredOutputSchema;
    }

    if (outputType === 'structured' && includeSources !== undefined) {
      body['includeSources'] = includeSources;
    }

    if (outputType === 'sourcedAnswer' && includeInlineCitations !== undefined) {
      body['includeInlineCitations'] = includeInlineCitations;
    }

    if (includeImages !== undefined) {
      body['includeImages'] = includeImages;
    }

    if (fromDate) {
      body['fromDate'] = fromDate;
    }

    if (toDate) {
      body['toDate'] = toDate;
    }

    if (includeDomains && includeDomains.length > 0) {
      body['includeDomains'] = includeDomains;
    }

    if (excludeDomains && excludeDomains.length > 0) {
      body['excludeDomains'] = excludeDomains;
    }

    if (maxResults !== undefined && maxResults !== null) {
      body['maxResults'] = maxResults;
    }

    return await linkupApiCall({
      method: HttpMethod.POST,
      path: '/v1/search',
      body,
      auth: context.auth,
    });
  },
});

