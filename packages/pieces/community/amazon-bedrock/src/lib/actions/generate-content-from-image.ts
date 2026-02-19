import { createAction, Property } from '@activepieces/pieces-framework';
import {
  ConverseCommand,
  ConversationRole,
  ImageFormat,
} from '@aws-sdk/client-bedrock-runtime';
import { ModelModality } from '@aws-sdk/client-bedrock';
import { awsBedrockAuth } from '../../index';
import {
  createBedrockRuntimeClient,
  getBedrockModelOptions,
  formatBedrockError,
  extractConverseTextResponse,
} from '../common';

const EXTENSION_TO_FORMAT: Record<string, ImageFormat> = {
  png: ImageFormat.PNG,
  jpg: ImageFormat.JPEG,
  jpeg: ImageFormat.JPEG,
  gif: ImageFormat.GIF,
  webp: ImageFormat.WEBP,
};

export const generateContentFromImage = createAction({
  auth: awsBedrockAuth,
  name: 'generate_content_from_image',
  displayName: 'Generate Content from Image',
  description: 'Ask a Bedrock model a question about an image.',
  props: {
    model: Property.Dropdown({
      displayName: 'Model',
      required: true,
      auth: awsBedrockAuth,
      description: 'The foundation model to use. Must support image input.',
      refreshers: [],
      options: async ({ auth }) => {
        if (!auth) {
          return {
            disabled: true,
            placeholder: 'Connect your AWS account first',
            options: [],
          };
        }
        return getBedrockModelOptions(auth.props, {
          useInferenceProfiles: true,
          inputModality: ModelModality.IMAGE,
        });
      },
    }),
    image: Property.File({
      displayName: 'Image',
      required: true,
      description: 'The image to analyze (PNG, JPEG, GIF, or WebP).',
    }),
    prompt: Property.LongText({
      displayName: 'Prompt',
      required: true,
      description: 'What do you want the model to tell you about the image?',
    }),
    systemPrompt: Property.LongText({
      displayName: 'System Prompt',
      required: false,
      description: 'Instructions that guide the model behavior.',
    }),
    temperature: Property.Number({
      displayName: 'Temperature',
      required: false,
      description:
        'Controls randomness. Lower values produce more deterministic output.',
      defaultValue: 0.7,
    }),
    maxTokens: Property.Number({
      displayName: 'Maximum Tokens',
      required: false,
      description: 'The maximum number of tokens to generate.',
      defaultValue: 2048,
    }),
  },
  async run({ auth, propsValue }) {
    const client = createBedrockRuntimeClient(auth.props);
    const { model, image, prompt, systemPrompt, temperature, maxTokens } =
      propsValue;

    const ext = (image.extension ?? 'png').toLowerCase();
    const format = EXTENSION_TO_FORMAT[ext];
    if (!format) {
      throw new Error(
        `Unsupported image format "${ext}". Supported: png, jpeg, gif, webp.`
      );
    }

    const imageBytes = Buffer.from(image.base64, 'base64');

    try {
      const response = await client.send(
        new ConverseCommand({
          modelId: model,
          messages: [
            {
              role: ConversationRole.USER,
              content: [
                {
                  image: {
                    format,
                    source: { bytes: imageBytes },
                  },
                },
                { text: prompt },
              ],
            },
          ],
          ...(systemPrompt ? { system: [{ text: systemPrompt }] } : {}),
          inferenceConfig: {
            temperature: temperature ?? undefined,
            maxTokens: maxTokens ?? undefined,
          },
        })
      );

      return extractConverseTextResponse(response);
    } catch (error) {
      throw new Error(formatBedrockError(error));
    }
  },
});
