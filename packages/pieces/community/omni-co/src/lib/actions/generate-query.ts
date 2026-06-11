import { createAction, Property } from '@activepieces/pieces-framework';
import { omniAuth } from '../common/auth';
import { makeRequest } from '../common/client';
import { HttpMethod } from '@activepieces/pieces-common';
import { modelIdDropdown } from '../common/props';

export const generateQuery = createAction({
  auth: omniAuth,
  name: 'generateQuery',
  displayName: 'Generate query',
  description:
    'Transforms a natural language description into a structured Omni query',
  audience: 'both',
  aiMetadata: {
    description:
      'Generates a structured Omni query object from a natural-language prompt against a given model, optionally guided by a topic, model branch, or a context query, and can emit a more strictly structured format. Use to translate a plain-English analytics request into a runnable query (then pass the result to Run query). Not idempotent: AI generation may return different output across calls for the same prompt.',
    idempotent: false,
  },
  props: {
    modelId: modelIdDropdown,
    prompt: Property.LongText({
      displayName: 'Prompt',
      description:
        'The natural language description of the query you want to generate (e.g., "Show me all users who signed up in the last month")',
      required: true,
    }),
    currentTopicName: Property.ShortText({
      displayName: 'Current Topic Name',
      description:
        'The name of the topic to use as context for the query generation',
      required: false,
    }),
    branchId: Property.ShortText({
      displayName: 'Branch ID',
      description:
        'The ID of the model branch to use for query generation. If not provided, the main branch will be used',
      required: false,
    }),
    contextQuery: Property.Json({
      displayName: 'Context Query',
      description:
        'The query object to provide as context. This can be used to reference previous queries or provide additional context for the generation',
      required: false,
    }),
    structured: Property.Checkbox({
      displayName: 'Structured Output',
      description:
        'When enabled, the API will return a more strictly structured query format',
      required: false,
      defaultValue: false,
    }),
  },
  async run(context) {
    const {
      modelId,
      prompt,
      currentTopicName,
      branchId,
      contextQuery,
      structured,
    } = context.propsValue;

    const body: Record<string, unknown> = {
      modelId,
      prompt,
    };

    if (currentTopicName) {
      body['currentTopicName'] = currentTopicName;
    }

    if (branchId) {
      body['branchId'] = branchId;
    }

    if (contextQuery) {
      body['contextQuery'] = contextQuery;
    }

    if (structured) {
      body['structured'] = structured;
    }

    const response = await makeRequest(
      context.auth.secret_text,
      HttpMethod.POST,
      '/ai/generate-query',
      body
    );

    return response;
  },
});
