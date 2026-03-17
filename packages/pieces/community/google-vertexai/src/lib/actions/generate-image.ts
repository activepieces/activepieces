import { createAction, Property } from '@activepieces/pieces-framework';
import { GoogleGenAI } from '@google/genai';
import { vertexAiAuth, GoogleVertexAIAuthValue } from '../auth';
import { getVertexAILocationOptions, getVertexAIImageModelOptions } from '../common';

export const generateImage = createAction({
  auth: vertexAiAuth,
  name: 'generate_image',
  displayName: 'Generate Image',
  description:
    'Generate an image from a text prompt using Google Imagen models on Vertex AI.',
  props: {
    location: Property.Dropdown({
      displayName: 'Location',
      description: 'Google Cloud region where your Vertex AI resources are hosted.',
      required: true,
      refreshers: [],
      defaultValue: 'us-central1',
      auth: vertexAiAuth,
      options: async ({ auth }) =>
        getVertexAILocationOptions(auth as GoogleVertexAIAuthValue | undefined),
    }),
    model: Property.Dropdown({
      displayName: 'Model',
      description: 'Imagen model to use for image generation.',
      required: true,
      refreshers: ['location'],
      defaultValue: 'imagen-4.0-generate-001',
      auth: vertexAiAuth,
      options: async ({ auth, location }) =>
        getVertexAIImageModelOptions(
          auth as GoogleVertexAIAuthValue | undefined,
          location as string | undefined
        ),
    }),
    prompt: Property.LongText({
      displayName: 'Prompt',
      description: 'A text description of the image you want to generate.',
      required: true,
    }),
    negativePrompt: Property.LongText({
      displayName: 'Negative Prompt',
      description: 'Describe what you do NOT want in the image.',
      required: false,
    }),
    numberOfImages: Property.Number({
      displayName: 'Number of Images',
      description: 'Number of images to generate (1–4).',
      required: false,
      defaultValue: 1,
    }),
    aspectRatio: Property.StaticDropdown({
      displayName: 'Aspect Ratio',
      description: 'Aspect ratio of the generated image.',
      required: false,
      defaultValue: '1:1',
      options: {
        options: [
          { label: 'Square (1:1)', value: '1:1' },
          { label: 'Portrait (3:4)', value: '3:4' },
          { label: 'Landscape (4:3)', value: '4:3' },
          { label: 'Portrait (9:16)', value: '9:16' },
          { label: 'Landscape (16:9)', value: '16:9' },
        ],
      },
    }),
    outputMimeType: Property.StaticDropdown({
      displayName: 'Output Format',
      description: 'Image format for the generated output.',
      required: false,
      defaultValue: 'image/png',
      options: {
        options: [
          { label: 'PNG', value: 'image/png' },
          { label: 'JPEG', value: 'image/jpeg' },
        ],
      },
    }),
    seed: Property.Number({
      displayName: 'Seed',
      description:
        'Random seed for reproducible results. Requires "Add Watermark" to be disabled.',
      required: false,
    }),
    enhancePrompt: Property.Checkbox({
      displayName: 'Enhance Prompt',
      description:
        'When enabled, the model rewrites your prompt to improve output quality.',
      required: false,
      defaultValue: false,
    }),
    addWatermark: Property.Checkbox({
      displayName: 'Add Watermark',
      description: 'When enabled, adds an invisible watermark to generated images.',
      required: false,
      defaultValue: false,
    }),
  },
  async run(context) {
    const {
      location,
      model,
      prompt,
      negativePrompt,
      numberOfImages,
      aspectRatio,
      outputMimeType,
      seed,
      enhancePrompt,
      addWatermark,
    } = context.propsValue;
    const auth = context.auth as GoogleVertexAIAuthValue;

    const rawCredentials = JSON.parse(auth.props.serviceAccountJson);
    const credentials = {
      ...rawCredentials,
      private_key: rawCredentials.private_key?.replace(/\\n/g, '\n'),
    };

    const ai = new GoogleGenAI({
      vertexai: true,
      project: credentials.project_id,
      location,
      googleAuthOptions: {
        credentials,
        scopes: ['https://www.googleapis.com/auth/cloud-platform'],
      },
    });

    const response = await ai.models.generateImages({
      model,
      prompt,
      config: {
        ...(negativePrompt ? { negativePrompt } : {}),
        numberOfImages: numberOfImages ?? 1,
        aspectRatio: aspectRatio ?? '1:1',
        outputMimeType: outputMimeType ?? 'image/png',
        ...(seed !== undefined && seed !== null ? { seed } : {}),
        enhancePrompt: enhancePrompt ?? false,
        addWatermark: addWatermark ?? false,
      },
    });

    const generated = response.generatedImages ?? [];

    if (generated.length === 0) {
      throw new Error(
        'No images were generated. The prompt may have been blocked by safety filters.'
      );
    }

    const ext = (outputMimeType ?? 'image/png') === 'image/jpeg' ? 'jpg' : 'png';

    const images = await Promise.all(
      generated.map(async (img, index) => {
        const imageBytes = img.image?.imageBytes;
        if (!imageBytes) {
          throw new Error(
            img.raiFilteredReason
              ? `Image ${index + 1} was filtered: ${img.raiFilteredReason}`
              : `Image ${index + 1} did not return any data.`
          );
        }

        const file = await context.files.write({
          fileName: `generated-image-${index + 1}.${ext}`,
          data: Buffer.from(imageBytes, 'base64'),
        });

        return {
          image: file,
          ...(img.enhancedPrompt ? { enhancedPrompt: img.enhancedPrompt } : {}),
        };
      })
    );

    return { images, model, prompt };
  },
});
