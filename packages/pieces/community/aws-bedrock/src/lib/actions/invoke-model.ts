import { createAction, Property } from '@activepieces/pieces-framework';
import { InvokeModelCommand } from '@aws-sdk/client-bedrock-runtime';
import { awsBedrockAuth } from '../../index';
import {
  createBedrockRuntimeClient,
  getBedrockModelOptions,
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
        return getBedrockModelOptions(auth.props);
      },
    }),
    body: Property.Json({
      displayName: 'Request Body',
      required: true,
      description:
        'The JSON request body to send to the model. Format varies by model — refer to the model documentation.',
      defaultValue: {},
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

    const response = await client.send(
      new InvokeModelCommand({
        modelId: model,
        body: Buffer.from(JSON.stringify(body)),
        contentType: contentType ?? 'application/json',
        accept: accept ?? 'application/json',
      })
    );

    const responseBody = JSON.parse(new TextDecoder().decode(response.body));

    return responseBody;
  },
});
