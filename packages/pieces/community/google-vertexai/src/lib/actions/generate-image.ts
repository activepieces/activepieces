import { createAction, Property, DynamicPropsValue, MarkdownVariant } from '@activepieces/pieces-framework';
import { GoogleGenAI, PersonGeneration, Part, GeneratedImage } from '@google/genai';
import { vertexAiAuth, GoogleVertexAIAuthValue } from '../auth';
import { getVertexAILocationOptions, getVertexAIImageModelOptions } from '../common';
import mime from 'mime-types';

function readInputImages(value: unknown): InputImage[] {
  if (!Array.isArray(value)) {
    return [];
  }
  return value.flatMap((item: unknown): InputImage[] => {
    if (typeof item !== 'object' || item === null || !('image' in item)) {
      return [];
    }
    const image = item.image;
    if (typeof image !== 'object' || image === null || !('data' in image) || !Buffer.isBuffer(image.data)) {
      return [];
    }
    const extension = 'extension' in image && typeof image.extension === 'string' ? image.extension : undefined;
    return [{ data: image.data, extension }];
  });
}

export const generateImage = createAction({
  auth: vertexAiAuth,
  name: 'generate_image',
  classification: 'READ',
  displayName: 'Generate Image',
  description:
    'Generate or edit images with Imagen or Gemini models on Vertex AI.',
  audience: 'both',
  aiMetadata: {
    description:
      'Generates one or more images from a text prompt on Google Vertex AI, returning them as files. The selected model determines the path: Gemini image models support image-to-image editing from a supplied input image and a configurable aspect ratio, while Imagen models support a negative prompt, person-generation safety controls, output format, seed, and prompt enhancement. Use to create or edit images from a description. Requires a Vertex AI service-account credential and a region/model selection. Not idempotent — each call produces fresh, varying output.',
    idempotent: false,
  },
  propertyGroups: [
    { key: 'image', display: 'section', label: 'Image', icon: 'text', props: ['prompt', 'location', 'model'] },
    { key: 'output', display: 'section', label: 'Output', icon: 'sliders', props: ['modelOptionsInfo', 'modelOptions'] },
  ],
  props: {
    location: Property.Dropdown({
      displayName: 'Location',
      description: 'Google Cloud region that runs the model.',
      required: true,
      refreshers: [],
      defaultValue: 'us-central1',
      auth: vertexAiAuth,
      options: async ({ auth }) =>
        getVertexAILocationOptions(auth as GoogleVertexAIAuthValue | undefined),
    }),
    model: Property.Dropdown({
      displayName: 'Model',
      description: 'Imagen or Gemini image model that creates the picture.',
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
      description: 'Describe the image you want to generate.',
      placeholder: 'A watercolor fox reading a book under a tree',
      required: true,
    }),
    modelOptionsInfo: Property.MarkDown({
      value: 'These options change with the model: Gemini models can edit your images, Imagen models have more output settings.',
      variant: MarkdownVariant.INFO,
    }),
    modelOptions: Property.DynamicProperties({
      displayName: 'Image Options',
      required: true,
      refreshers: ['model'],
      auth: vertexAiAuth,
      props: async (propsValue) => {
        const fields: DynamicPropsValue = {};
        const selectedModel = String(propsValue['model'] || '');
        const isGeminiModel = selectedModel.includes('gemini-');

        if (isGeminiModel) {
          fields['inputImage'] = Property.Array({
            displayName: 'Images to Edit',
            description: 'Optional images Gemini edits or uses as a reference.',
            required: false,
            properties: {
              image: Property.File({
                displayName: 'Image',
                required: true,
              }),
            },
          });

          fields['aspectRatio'] = Property.StaticDropdown({
            displayName: 'Aspect Ratio',
            description: 'Shape of the generated image.',
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
          fields['numberOfImages'] = Property.Number({
            displayName: 'Number of Images',
            description: 'How many images to create, 1 to 4.',
            required: false,
            defaultValue: 1,
            display: 'stepper',
            min: 1,
            max: 4,
            step: 1,
          });

          fields['negativePrompt'] = Property.LongText({
            displayName: 'Negative Prompt',
            description: 'What to leave out of the image.',
            required: false,
          });

          fields['aspectRatio'] = Property.StaticDropdown({
            displayName: 'Aspect Ratio',
            description: 'Shape of the generated image.',
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
            displayName: 'People in Image',
            description: 'Whether people can appear in the image.',
            required: false,
            options: {
              options: [
                { label: 'No people', value: 'DONT_ALLOW' },
                { label: 'Adults only (default)', value: 'ALLOW_ADULT' },
                { label: 'Adults and children', value: 'ALLOW_ALL' },
              ],
            },
          });

          fields['outputMimeType'] = Property.StaticDropdown({
            displayName: 'Output Format',
            description: 'File type of the generated image.',
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
            description: 'Same seed and prompt give the same image. Needs Add Watermark off.',
            required: false,
          });

          fields['enhancePrompt'] = Property.Checkbox({
            displayName: 'Enhance Prompt',
            description: 'Let the model rewrite your prompt for better results.',
            required: false,
            defaultValue: false,
          });

          fields['addWatermark'] = Property.Checkbox({
            displayName: 'Add Watermark',
            description: 'Adds an invisible watermark to the images.',
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

    const inputImages = readInputImages(modelOptions?.['inputImage']);
    const numberOfImagesValue = modelOptions?.['numberOfImages'];
    const numberOfImages = typeof numberOfImagesValue === 'number' ? numberOfImagesValue : 1;
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

    const ext = outputMimeType === 'image/jpeg' ? 'jpg' : 'png';

    if (isGeminiModel) {
      const imageParts: Part[] = inputImages
        .map((file) => ({
          inlineData: {
            mimeType: mime.lookup(file.extension || '') || 'image/png',
            data: Buffer.from(file.data).toString('base64'),
          },
        }));
      const promptContent = [{ role: 'user', parts: [{ text: prompt }, ...imageParts] }];

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

      const parts: Part[] = response.candidates?.[0]?.content?.parts || [];
      const generatedParts = parts.filter(
        (part: Part) => part.inlineData?.data && part.thought !== true
      );

      if (generatedParts.length === 0) {
        throw new Error('No images were generated by the Gemini model. Adjust your prompt.');
      }

      const images = await Promise.all(
        generatedParts.map(async (part: Part, index: number) => {
          const partExt = mime.extension(part.inlineData?.mimeType || '') || 'png';
          const file = await context.files.write({
            fileName: `generated-image-${index + 1}.${partExt}`,
            data: Buffer.from(part.inlineData?.data ?? '', 'base64'),
          });
          return { image: file };
        })
      );

      return { images, model, prompt };
    }

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
      generated.map(async (img: GeneratedImage, index: number) => {
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

type InputImage = { data: Buffer; extension?: string };
