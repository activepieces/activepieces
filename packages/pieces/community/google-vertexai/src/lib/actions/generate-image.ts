import { createAction, Property, ApFile, DynamicPropsValue } from '@activepieces/pieces-framework';
import { GoogleGenAI, PersonGeneration } from '@google/genai';
import { vertexAiAuth, GoogleVertexAIAuthValue } from '../auth';
import { getVertexAILocationOptions, getVertexAIImageModelOptions } from '../common';
import mime from 'mime-types';

interface FileItem {
  image: ApFile;
}

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
      description: 'Model to use for image generation.',
      required: true,
      refreshers: ['location'],
      auth: vertexAiAuth,
      options: async ({ auth, location }) => {
        if (!location) {
          return {
            disabled: true,
            placeholder: 'Please select a location first',
            options: [],
          };
        }
        return getVertexAIImageModelOptions(
          auth as GoogleVertexAIAuthValue | undefined,
          location as string | undefined
        );
      },
    }),
    prompt: Property.LongText({
      displayName: 'Prompt',
      description: 'A text description of the image you want to generate.',
      required: true,
    }),
    modelOptions: Property.DynamicProperties({
      displayName: 'Model Configurations',
      required: true,
      refreshers: ['model'],
      auth: vertexAiAuth,
      props: async (propsValue) => {
        const fields: DynamicPropsValue = {};
        const selectedModel = String(propsValue['model'] || '');
        const isGeminiModel = selectedModel.includes('gemini-');

        // Common Field: Number of Images
        fields['numberOfImages'] = Property.Number({
          displayName: 'Number of Images',
          description: 'Number of images to generate (1–4).',
          required: false,
          defaultValue: 1,
        });

        if (isGeminiModel) {
          fields['inputImage'] = Property.Array({
            displayName: 'Input Image',
            description: 'Optional images for image-to-image editing.',
            required: false,
            properties: {
              image: Property.File({
                displayName: 'Image File',
                required: true,
              }),
            },
          });

          fields['aspectRatio'] = Property.StaticDropdown({
            displayName: 'Aspect Ratio',
            description: 'Aspect ratio of the generated image.',
            required: false,
            defaultValue: '1:1',
            options: {
              options: [
                { label: 'Square (1:1)', value: '1:1' },
                { label: 'Portrait (2:3)', value: '2:3' },
                { label: 'Landscape (3:2)', value: '3:2' },
                { label: 'Portrait (3:4)', value: '3:4' },
                { label: 'Landscape (4:3)', value: '4:3' },
                { label: 'Portrait (4:5)', value: '4:5' },
                { label: 'Landscape (5:4)', value: '5:4' },
                { label: 'Portrait (9:16)', value: '9:16' },
                { label: 'Landscape (16:9)', value: '16:9' },
                { label: 'Ultrawide (21:9)', value: '21:9' },
              ],
            },
          });
        } else {
          fields['negativePrompt'] = Property.LongText({
            displayName: 'Negative Prompt',
            description: 'Describe what you do NOT want in the image.',
            required: false,
          });

          fields['aspectRatio'] = Property.StaticDropdown({
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
          });

          fields['personGeneration'] = Property.StaticDropdown({
            displayName: 'Person Generation',
            description: 'Safety controls for generating images of people.',
            required: false,
            options: {
              options: [
                { label: 'Block generation of all people', value: 'DONT_ALLOW' },
                { label: 'Generate images of adults, but not children (Default)', value: 'ALLOW_ADULT' },
                { label: 'Generate images that include adults and children', value: 'ALLOW_ALL' },
              ],
            },
          });

          fields['outputMimeType'] = Property.StaticDropdown({
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
          });

          fields['seed'] = Property.Number({
            displayName: 'Seed',
            description: 'Random seed for reproducible results. Requires "Add Watermark" to be disabled.',
            required: false,
          });

          fields['enhancePrompt'] = Property.Checkbox({
            displayName: 'Enhance Prompt',
            description: 'When enabled, the model rewrites your prompt to improve output quality.',
            required: false,
            defaultValue: false,
          });

          fields['addWatermark'] = Property.Checkbox({
            displayName: 'Add Watermark',
            description: 'When enabled, adds an invisible watermark to generated images.',
            required: false,
            defaultValue: false,
          });
        }

        return fields;
      },
    }),
  },
  async run(context) {
    const { location, model, prompt, modelOptions } = context.propsValue;
    const auth = context.auth as GoogleVertexAIAuthValue;

    const rawCredentials = JSON.parse(auth.props.serviceAccountJson);
    const credentials = {
      ...rawCredentials,
      private_key: rawCredentials.private_key?.replace(/\\n/g, '\n'),
    };

    const inputImage = modelOptions?.['inputImage'] as ApFile | undefined;
    const numberOfImages = (modelOptions?.['numberOfImages'] as number) ?? 1; // Strictly defaults to 1
    const aspectRatio = modelOptions?.['aspectRatio'] as string | undefined;
    const negativePrompt = modelOptions?.['negativePrompt'] as string | undefined;
    const personGeneration = modelOptions?.['personGeneration'] as PersonGeneration | undefined;
    const outputMimeType = (modelOptions?.['outputMimeType'] as string) ?? 'image/png';
    const seed = modelOptions?.['seed'] as number | undefined;
    const enhancePrompt = modelOptions?.['enhancePrompt'] as boolean | undefined;
    const addWatermark = modelOptions?.['addWatermark'] as boolean | undefined;

    const isGeminiModel = model.includes('gemini-');

    const ai = new GoogleGenAI({
      vertexai: true,
      project: credentials.project_id,
      location: location,
      googleAuthOptions: {
        credentials,
        scopes: ['https://www.googleapis.com/auth/cloud-platform'],
      },
    });

    const ext = (outputMimeType ?? 'image/png') === 'image/jpeg' ? 'jpg' : 'png';

    if (isGeminiModel) {
      let promptContent;

      if (inputImage && inputImage.data) {
        const mimeType = mime.lookup(inputImage.extension || '') || 'image/png';

        const imagePart = {
          inlineData: {
            mimeType,
            data: Buffer.from(inputImage.data).toString('base64'),
          },
        };
        promptContent = [{ role: 'user', parts: [{ text: prompt }, imagePart] }];
      } else {
        // Fallback to text-only if no valid image was found
        promptContent = [{ role: 'user', parts: [{ text: prompt }] }];
      }

      const response = await ai.models.generateContent({
        model,
        contents: promptContent,
        config: {
          responseModalities: ['TEXT', 'IMAGE'],
          imageConfig: {
            ...(aspectRatio ? { aspectRatio: aspectRatio as string } : {}),
          },
        },
      });

      const parts = response.candidates?.[0]?.content?.parts || [];
      const generatedImagesBytes = parts
        .filter((part: any) => part.inlineData && part.inlineData.data)
        .map((part: any) => part.inlineData!.data as string);

      if (generatedImagesBytes.length === 0) {
        throw new Error('No images were generated by the Gemini model. Adjust your prompt.');
      }

      const images = await Promise.all(
        generatedImagesBytes.map(async (base64Data: string, index: number) => {
          const file = await context.files.write({
            fileName: `generated-image-${index + 1}.${ext}`,
            data: Buffer.from(base64Data, 'base64'),
          });
          return { image: file };
        })
      );

      return { images, model, prompt };
    }

    // Imagen models
    const response = await ai.models.generateImages({
      model,
      prompt,
      config: {
        ...(negativePrompt ? { negativePrompt } : {}),
        numberOfImages: numberOfImages,
        aspectRatio: aspectRatio ?? '1:1',
        outputMimeType: outputMimeType,
        ...(personGeneration ? { personGeneration: personGeneration as PersonGeneration } : {}),
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

    const images = await Promise.all(
      generated.map(async (img : any, index: number) => {
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