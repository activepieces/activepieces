import { createAction, Property } from '@activepieces/pieces-framework';
import { InvokeModelCommand } from '@aws-sdk/client-bedrock-runtime';
import { awsBedrockAuth } from '../../index';
import {
  createBedrockRuntimeClient,
  getBedrockModelOptions,
  formatBedrockError,
} from '../common';

export const invokeModel = createAction({
  auth: awsBedrockAuth,
  name: 'invoke_model',
  displayName: 'Invoke Model (Custom)',
  description:
    'Send a raw JSON request body to any Bedrock model. Use this for advanced or model-specific parameters.',
  props: {
    model: Property.Dropdown({
      displayName: 'Model',
      required: true,
      auth: awsBedrockAuth,
      description: 'The foundation model to invoke.',
      refreshers: [],
      options: async ({ auth }) => {
        if (!auth) {
          return {
            disabled: true,
            placeholder: 'Connect your AWS account first',
            options: [],
          };
        }
        return getBedrockModelOptions(auth.props, { showAll: true });
      },
    }),
    body: Property.Json({
      displayName: 'Request Body',
      required: true,
      description:
        'The JSON request body to send to the model. Format varies by model — refer to the model documentation.',
      defaultValue: {
        anthropic_version: 'bedrock-2023-05-31',
        max_tokens: 1024,
        messages: [
          {
            role: 'user',
            content: 'Hello, how are you?',
          },
        ],
      },
    }),
    contentType: Property.ShortText({
      displayName: 'Content Type',
      required: false,
      description: 'MIME type of the request body.',
      defaultValue: 'application/json',
    }),
    accept: Property.ShortText({
      displayName: 'Accept',
      required: false,
      description: 'Desired MIME type of the response body.',
      defaultValue: 'application/json',
    }),
  },
  async run({ auth, propsValue }) {
    const client = createBedrockRuntimeClient(auth.props);
    const { model, body, contentType, accept } = propsValue;

    try {
      const response = await client.send(
        new InvokeModelCommand({
          modelId: model,
          body: Buffer.from(JSON.stringify(body)),
          contentType: contentType ?? 'application/json',
          accept: accept ?? 'application/json',
        })
      );

      const raw = new TextDecoder().decode(response.body);
      const acceptType = accept ?? 'application/json';

      if (acceptType.includes('json')) {
        return JSON.parse(raw);
      }

      return { body: raw, contentType: response.contentType };
    } catch (error) {
      throw new Error(formatBedrockError(error));
    }
  },
});
