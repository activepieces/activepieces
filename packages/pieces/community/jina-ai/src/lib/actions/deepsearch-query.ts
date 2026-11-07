import { createAction, MarkdownVariant, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { JinaAICommon } from '../common';
import { jinaAiAuth } from '../auth';
import { deepsearchQueryOutputSchema } from '../output-schemas';

export const deepSearchQueryAction = createAction({
  auth:jinaAiAuth,
  name: 'deepsearch_query',
  outputSchema: deepsearchQueryOutputSchema,
  classification: 'READ',
  displayName: 'DeepSearch Query',
  description:
    'Answer complex questions through iterative search, reading, and reasoning with the DeepSearch API.',
  audience: 'both',
  aiMetadata: {
    description:
      'Answer a complex research question with Jina DeepSearch, which iteratively searches the web, reads pages, and reasons before responding; supports domain include/exclude lists, token budget, and an optional JSON schema for structured output. Pick this for multi-hop research questions rather than a plain keyword search (use Web Search Summarization for that); it is slower and more token-hungry than a single search. Read-only, so safe to retry, though answers may vary between runs.',
    idempotent: true,
  },
  props: {
    model: Property.StaticDropdown({
      displayName: 'Model',
      required: true,
      defaultValue: 'jina-deepsearch-v1',
      options: {
        options: [{ label: 'jina-deepsearch-v1', value: 'jina-deepsearch-v1' }],
      },
    }),
    prompt:Property.LongText({
      displayName:'Question',
      description: 'What you want DeepSearch to research and answer.',
      placeholder: 'Which EU countries changed their VAT rates this year?',
      required:true
    }),
    reasoning_effort: Property.StaticDropdown({
      displayName: 'Reasoning Effort',
      description: 'Lower is faster and uses fewer tokens.',
      required: false,
      defaultValue: 'medium',
      options: {
        options: [
          { label: 'Low', value: 'low' },
          { label: 'Medium', value: 'medium' },
          { label: 'High', value: 'high' },
        ],
      },
    }),
    domains_info: Property.MarkDown({
      value: 'Enter one domain per line. Leave all three empty to search the whole web.',
      variant: MarkdownVariant.INFO,
    }),
    boost_hostnames: Property.LongText({
      displayName: 'Preferred Domains',
      description: 'Ranked higher when picking sources.',
      placeholder: 'wikipedia.org',
      required: false,
    }),
    bad_hostnames: Property.LongText({
      displayName: 'Excluded Domains',
      description: 'Never used as sources.',
      placeholder: 'example-spam.com',
      required: false,
    }),
    only_hostnames: Property.LongText({
      displayName: 'Only These Domains',
      description: 'No other domains are used.',
      placeholder: 'nature.com',
      required: false,
    }),
    max_returned_urls: Property.Number({
      displayName: 'Max Returned URLs',
      description: 'Most source URLs to include in the answer.',
      required: false,
      defaultValue: 1,
    }),
    response_format: Property.Json({
      displayName: 'Structured Output',
      description:
        `A response_format object: {"type": "json_schema", "json_schema": {…}}. Empty: plain text.`,
      required: false,
      advanced: true,
    }),
    budget_tokens: Property.Number({
      displayName: 'Token Budget',
      description: "Most tokens DeepSearch may use. 0: Jina's default.",
      required: false,
      defaultValue: 0,
      advanced: true,
    }),
    max_attempts: Property.Number({
      displayName: 'Max Attempts',
      description: 'How many times DeepSearch may retry with a new approach.',
      required: false,
      defaultValue: 1,
      advanced: true,
    }),
    no_direct_answer: Property.Checkbox({
      displayName: 'Always Search First',
      description: 'Search and reason even when the question looks simple.',
      required: false,
      defaultValue: false,
      advanced: true,
    }),
  },
  propertyGroups: [
    {
      key: 'research',
      display: 'section',
      label: 'Research',
      icon: 'text',
      props: ['model', 'prompt', 'reasoning_effort'],
    },
    {
      key: 'sources',
      display: 'section',
      label: 'Sources',
      icon: 'filter',
      props: [
        'domains_info',
        'boost_hostnames',
        'bad_hostnames',
        'only_hostnames',
        'max_returned_urls',
      ],
    },
  ],
  async run(context) {
    const {
      model,
      reasoning_effort,
      budget_tokens,
      max_attempts,
      no_direct_answer,
      max_returned_urls,
      response_format,
      boost_hostnames,
      bad_hostnames,
      only_hostnames,
      prompt
    } = context.propsValue;
    const { auth: apiKey } = context;

    // Build request body with all available options
    const requestBody = {
      model: model || 'jina-deepsearch-v1',
    } as Record<string, unknown>;

    // Default message if none provided
    requestBody['messages'] = [
      {
          "role": "user",
          "content": "Hi!"
      },
      {
          "role": "assistant",
          "content": "Hi, how can I help you?"
      },
      {
          "role": "user",
          "content": prompt
      }
  ]
    if (reasoning_effort) {
      requestBody['reasoning_effort'] = reasoning_effort;
    }

    if (budget_tokens) {
      requestBody['budget_tokens'] = budget_tokens;
    }

    if (max_attempts) {
      requestBody['max_attempts'] = max_attempts;
    }

    if (no_direct_answer !== undefined) {
      requestBody['no_direct_answer'] = no_direct_answer;
    }

    if (max_returned_urls) {
      requestBody['max_returned_urls'] = max_returned_urls;
    }

    if (response_format) {
      try {
        const parsedFormat =
          typeof response_format === 'string'
            ? JSON.parse(response_format)
            : response_format;
        requestBody['response_format'] = parsedFormat;
      } catch (error) {
        // If parsing fails, ignore the response_format
      }
    }

    // Add domain control parameters if specified
    if (boost_hostnames) {
      requestBody['boost_hostnames'] = boost_hostnames
        .split('\n')
        .map((domain) => domain.trim())
        .filter((domain) => domain);
    }

    if (bad_hostnames) {
      requestBody['bad_hostnames'] = bad_hostnames
        .split('\n')
        .map((domain) => domain.trim())
        .filter((domain) => domain);
    }

    if (only_hostnames) {
      requestBody['only_hostnames'] = only_hostnames
        .split('\n')
        .map((domain) => domain.trim())
        .filter((domain) => domain);
    }

    const response = await JinaAICommon.makeRequest({
      url: JinaAICommon.deepsearchUrl,
      method: HttpMethod.POST,
      auth: apiKey.secret_text,
      body: requestBody,
    });

    const result = (response as DeepSearchResponse).choices[0].message.content;

    return result;
  },
});


type DeepSearchResponse = {
  id:number,
  choices:Array<{
    index:number,
    message:{
      role:string,
      content:string
    }
  }>
}