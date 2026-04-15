import { DynamicPropsValue, createAction, Property } from '@activepieces/pieces-framework';
import {
  ConverseCommand,
  ConversationRole,
} from '@aws-sdk/client-bedrock-runtime';
import { ModelModality } from '@aws-sdk/client-bedrock';
import { awsBedrockAuth } from '../auth';
import {
  buildFileContentBlock,
  buildS3ContentBlock,
  createBedrockRuntimeClient,
  getBedrockModelOptions,
  formatBedrockError,
  extractConverseTextResponse,
} from '../common';

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
    source: Property.StaticDropdown({
      displayName: 'Image Source',
      description: 'Choose how to provide the image — upload directly or reference one already in S3.',
      required: true,
      defaultValue: 'file',
      options: {
        options: [
          { label: 'Upload an image', value: 'file' },
          { label: 'From S3 bucket', value: 's3' },
        ],
      },
    }),
    image: Property.DynamicProperties({
      auth: awsBedrockAuth,
      displayName: 'Image',
      required: true,
      refreshers: ['source'],
      props: async ({ source }): Promise<DynamicPropsValue> => {
        if (source === 's3') {
          return {
            s3Bucket: Property.ShortText({
              displayName: 'S3 Bucket',
              description: 'The name of your S3 bucket containing the image.',
              required: true,
            }),
            s3Key: Property.ShortText({
              displayName: 'S3 File Path',
              description: 'The path to the image in your S3 bucket (e.g. "images/photo.png"). Supported: png, jpg, gif, webp.',
              required: true,
            }),
          };
        }
        return {
          file: Property.File({
            displayName: 'Image File',
            description: 'The image to analyze. Supported formats: PNG, JPEG, GIF, WebP.',
            required: true,
          }),
        };
      },
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
    const { model, source, image, prompt, systemPrompt, temperature, maxTokens } = propsValue;

    const imageBlock =
      source === 's3'
        ? buildS3ContentBlock(image['s3Bucket'] as string, image['s3Key'] as string)
        : buildFileContentBlock(image['file']);

    try {
      const response = await client.send(
        new ConverseCommand({
          modelId: model,
          messages: [
            {
              role: ConversationRole.USER,
              content: [imageBlock, { text: prompt }],
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
