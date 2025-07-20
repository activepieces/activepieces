import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { JinaAICommon } from '../common';
import { jinaAiAuth } from '../../index';

export const deepSearchQueryAction = createAction({
  auth:jinaAiAuth,
  name: 'deepsearch_query',
  displayName: 'DeepSearch Query',
  description:
    'Answer complex questions through iterative search, reading, and reasoning with the DeepSearch API.',
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
      displayName:'Prompt',
      required:true
    }),
    reasoning_effort: Property.StaticDropdown({
      displayName: 'Reasoning Effort',
      description:
        'Constrains effort on reasoning for reasoning models. Reducing reasoning effort can result in faster responses and fewer tokens used on reasoning in a response.',
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
    budget_tokens: Property.Number({
      displayName: 'Budget Tokens',
      description:
        'This determines the maximum number of tokens allowed for DeepSearch process. Larger budgets can improve response quality by enabling more exhaustive search for complex queries.',
      required: false,
      defaultValue: 0,
    }),
    max_attempts: Property.Number({
      displayName: 'Max Attempts',
      description:
        'The maximum number of retries for solving a problem in DeepSearch process. A larger value allows DeepSearch to retry solving the problem by using different reasoning approaches and strategies.',
      required: false,
      defaultValue: 1,
    }),
    no_direct_answer: Property.Checkbox({
      displayName: 'No Direct Answer',
      description:
        "Forces the model to take further thinking/search steps even when the query seems trivial. Useful if you're using DeepSearch in scenarios where you're certain the query always needs DeepSearch, rather than for trivial questions.",
      required: false,
      defaultValue: false,
    }),
    max_returned_urls: Property.Number({
      displayName: 'Max Returned URLs',
      description:
        'The maximum number of URLs to include in the final answer/chunk. URLs are sorted by relevance and other important factors.',
      required: false,
      defaultValue: 1,
    }),
    response_format: Property.Json({
      displayName: 'Structured Output',
      description:
        'JSON schema for structured output format. Example: { "type": "json_schema", "json_schema": { "type": "object", "properties": { "numerical_answer_only": { "type": "number" } } } }',
      required: false,
    }),
    boost_hostnames: Property.LongText({
      displayName: 'Good Domains',
      description:
        'A list of domains that are given a higher priority for content retrieval. Useful for domain-specific, high-quality sources that provide valuable content.',
      required: false,
    }),
    bad_hostnames: Property.LongText({
      displayName: 'Bad Domains',
      description:
        'A list of domains to be strictly excluded from content retrieval. Typically used to filter out known spam, low-quality, or irrelevant websites.',
      required: false,
    }),
    only_hostnames: Property.LongText({
      displayName: 'Only Domains',
      description:
        'A list of domains to be exclusively included in content retrieval. All other domains will be ignored. Useful for domain-specific searches.',
      required: false,
    }),
  },
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
      auth: apiKey as string,
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