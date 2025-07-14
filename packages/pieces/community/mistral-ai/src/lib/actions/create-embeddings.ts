import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod, httpClient, AuthenticationType } from '@activepieces/pieces-common';
import { mistralAuth } from '../common/auth';
import { modelDropdown } from '../common/model-dropdown';

function parseMistralError(e: any): string {
  if (e.response?.data?.error) return e.response.data.error;
  if (e.response?.data?.message) return e.response.data.message;
  if (e.message) return e.message;
  return 'Unknown error';
}

export const createEmbeddings = createAction({
  auth: mistralAuth,
  name: 'create_embeddings',
  displayName: 'Create Embeddings',
  description: 'Create text embeddings for semantic search, similarity matching, etc.',
  props: {
    model: modelDropdown,
    input: Property.ShortText({
      displayName: 'Input',
      description: 'Text or array of texts (as JSON array) to embed.',
      required: true,
    }),
    timeout: Property.Number({ displayName: 'Timeout (ms)', required: false, defaultValue: 30000 }),
    retries: Property.Number({ displayName: 'Retries', required: false, defaultValue: 2 }),
    responseFormat: Property.StaticDropdown({
      displayName: 'Response Format',
      required: true,
      defaultValue: 'parsed',
      options: {
        options: [
          { label: 'Parsed (JSON)', value: 'parsed' },
          { label: 'Raw (text)', value: 'raw' },
        ],
      },
    }),
  },
  async run({ auth, propsValue }) {
    const { model, input, responseFormat, timeout, retries } = propsValue;
    let inputArr: string[] = [];
    try {
      if (input.trim().startsWith('[')) {
        inputArr = JSON.parse(input);
        if (!Array.isArray(inputArr) || inputArr.length === 0 || !inputArr.every((s) => typeof s === 'string')) {
          throw new Error();
        }
      } else {
        if (!input.trim()) throw new Error();
        inputArr = [input];
      }
    } catch {
      throw new Error('Input must be a non-empty string or a JSON array of non-empty strings');
    }
    const body = {
      model,
      input: inputArr,
    };
    let lastErr;
    for (let attempt = 0; attempt <= (retries ?? 2); ++attempt) {
      try {
        const response = await httpClient.sendRequest({
          method: HttpMethod.POST,
          url: 'https://api.mistral.ai/v1/embeddings',
          authentication: {
            type: AuthenticationType.BEARER_TOKEN,
            token: auth as string,
          },
          body,
          timeout: timeout ?? 30000,
        });
        if (responseFormat === 'raw') {
          return response.body;
        }
        try {
          return typeof response.body === 'string' ? JSON.parse(response.body) : response.body;
        } catch {
          return response.body;
        }
      } catch (e: any) {
        lastErr = e;
        const status = e.response?.status;
        if (status === 429 || (status && status >= 500 && status < 600)) {
          if (attempt < (retries ?? 2)) {
            await new Promise((r) => setTimeout(r, 1000 * (attempt + 1)));
            continue;
          }
        }
        throw new Error(parseMistralError(e));
      }
    }
    throw new Error(parseMistralError(lastErr));
  },
}); 