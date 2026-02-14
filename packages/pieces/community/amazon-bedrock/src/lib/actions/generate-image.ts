import { createAction, Property } from '@activepieces/pieces-framework';
import { InvokeModelCommand } from '@aws-sdk/client-bedrock-runtime';
import { ModelModality } from '@aws-sdk/client-bedrock';
import { awsBedrockAuth } from '../../index';
import {
  createBedrockRuntimeClient,
  getBedrockModelOptions,
  formatBedrockError,
} from '../common';

export const generateImage = createAction({
  auth: awsBedrockAuth,
  name: 'generate_image',
  displayName: 'Generate Image',
  description:
    'Generate an image from a text prompt using Amazon Titan Image Generator or Stability AI models.',
  props: {
    model: Property.Dropdown({
      displayName: 'Model',
      required: true,
      auth: awsBedrockAuth,
      description: 'The image generation model to use.',
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
          outputModality: ModelModality.IMAGE,
        });
      },
    }),
    prompt: Property.LongText({
      displayName: 'Prompt',
      required: true,
      description: 'A text description of the image you want to generate.',
    }),
    negativePrompt: Property.LongText({
      displayName: 'Negative Prompt',
      required: false,
      description:
        'Describe what you do NOT want in the image. Helps refine the output.',
    }),
    width: Property.Number({
      displayName: 'Width',
      required: false,
      description: 'Image width in pixels. Must be supported by the model.',
      defaultValue: 1024,
    }),
    height: Property.Number({
      displayName: 'Height',
      required: false,
      description: 'Image height in pixels. Must be supported by the model.',
      defaultValue: 1024,
    }),
    seed: Property.Number({
      displayName: 'Seed',
      required: false,
      description:
        'A seed for reproducible results. Use the same seed and prompt to get the same image.',
    }),
  },
  async run({ auth, propsValue, files }) {
    const client = createBedrockRuntimeClient(auth.props);
    const { model, prompt, negativePrompt, width, height, seed } = propsValue;

    const isTitan = model.startsWith('amazon.titan-image');
    const isStability = model.startsWith('stability.');
    const isNovaCanvas = model.startsWith('amazon.nova-canvas');

    let requestBody: Record<string, unknown>;

    if (isTitan) {
      requestBody = {
        taskType: 'TEXT_IMAGE',
        textToImageParams: {
          text: prompt,
          ...(negativePrompt ? { negativeText: negativePrompt } : {}),
        },
        imageGenerationConfig: {
          numberOfImages: 1,
          width: width ?? 1024,
          height: height ?? 1024,
          ...(seed != null ? { seed: seed } : {}),
        },
      };
    } else if (isNovaCanvas) {
      requestBody = {
        taskType: 'TEXT_IMAGE',
        textToImageParams: {
          text: prompt,
          ...(negativePrompt ? { negativeText: negativePrompt } : {}),
        },
        imageGenerationConfig: {
          numberOfImages: 1,
          width: width ?? 1024,
          height: height ?? 1024,
          ...(seed != null ? { seed: seed } : {}),
        },
      };
    } else if (isStability) {
      requestBody = {
        text_prompts: [
          { text: prompt, weight: 1 },
          ...(negativePrompt
            ? [{ text: negativePrompt, weight: -1 }]
            : []),
        ],
        cfg_scale: 7,
        steps: 30,
        width: width ?? 1024,
        height: height ?? 1024,
        ...(seed != null ? { seed: seed } : {}),
      };
    } else {
      requestBody = {
        text_prompts: [
          { text: prompt, weight: 1 },
          ...(negativePrompt
            ? [{ text: negativePrompt, weight: -1 }]
            : []),
        ],
        width: width ?? 1024,
        height: height ?? 1024,
        ...(seed != null ? { seed: seed } : {}),
      };
    }

    try {
      const response = await client.send(
        new InvokeModelCommand({
          modelId: model,
          body: Buffer.from(JSON.stringify(requestBody)),
          contentType: 'application/json',
          accept: 'application/json',
        })
      );

      const responseBody = JSON.parse(
        new TextDecoder().decode(response.body)
      );

      let base64Image: string | undefined;

      if (responseBody.images && responseBody.images.length > 0) {
        base64Image = responseBody.images[0];
      } else if (
        responseBody.artifacts &&
        responseBody.artifacts.length > 0
      ) {
        base64Image = responseBody.artifacts[0].base64;
      }

      if (!base64Image) {
        throw new Error(
          'No image was returned by the model. The response format may not be supported.'
        );
      }

      const imageBuffer = Buffer.from(base64Image, 'base64');

      const file = await files.write({
        fileName: 'generated-image.png',
        data: imageBuffer,
      });

      return {
        image: file,
        model: model,
      };
    } catch (error) {
      if (error instanceof Error && error.message.includes('No image')) {
        throw error;
      }
      throw new Error(formatBedrockError(error));
    }
  },
});
