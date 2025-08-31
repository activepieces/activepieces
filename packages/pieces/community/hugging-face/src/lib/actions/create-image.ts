import { createAction, Property } from '@activepieces/pieces-framework';
import { InferenceClient } from '@huggingface/inference';
import type { TextToImageInput } from '@huggingface/tasks';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { huggingFaceAuth } from '../../index';

export const createImage = createAction({
  name: 'create_image',
  auth: huggingFaceAuth,
  displayName: 'Create Image',
  description:
    'Generate stunning images from text prompts using state-of-the-art diffusion models - perfect for marketing, product design, and creative content',
  props: {
    useCase: Property.StaticDropdown({
      displayName: 'Use Case',
      description: 'What type of image generation do you need?',
      required: true,
      options: {
        disabled: false,
        options: [
          {
            label: 'Fast Generation (Quick Prototypes)',
            value: 'speed',
          },
          {
            label: 'High Quality (Marketing & Print)',
            value: 'quality',
          },
          {
            label: 'Business Content (Products & Brands)',
            value: 'business',
          },
          {
            label: 'Search All Models',
            value: 'search',
          },
        ],
      },
      defaultValue: 'quality',
    }),
    model: Property.Dropdown({
      displayName: 'Image Generation Model',
      description: 'Select the best model for your use case',
      required: true,
      refreshers: ['useCase'],
      options: async ({ useCase }) => {
        const getModelsByUseCase = (type: string) => {
          switch (type) {
            case 'speed':
              return [
                {
                  label: 'FLUX.1 Schnell (⚡ Ultra Fast - 1-4 steps)',
                  value: 'black-forest-labs/FLUX.1-schnell',
                  description: '634K downloads | Best for rapid prototyping',
                },
                {
                  label: 'SD Turbo (⚡ Real-time - 1 step)',
                  value: 'stabilityai/sd-turbo',
                  description: '1.2M downloads | Fastest generation',
                },
                {
                  label: 'SDXL Turbo (⚡ Fast - 1-4 steps)',
                  value: 'stabilityai/sdxl-turbo',
                  description: '223K downloads | Fast with good quality',
                },
              ];
            case 'quality':
              return [
                {
                  label: 'FLUX.1 Dev (Premium Quality)',
                  value: 'black-forest-labs/FLUX.1-dev',
                  description: '1.4M downloads | State-of-the-art results',
                },
                {
                  label: 'Stable Diffusion XL (🎯 Reliable Quality)',
                  value: 'stabilityai/stable-diffusion-xl-base-1.0',
                  description: '2.2M downloads | Industry standard',
                },
                {
                  label: 'SD 3 Medium (🔬 Advanced Features)',
                  value: 'stabilityai/stable-diffusion-3-medium',
                  description: '13K downloads | Latest technology',
                },
              ];
            case 'business':
              return [
                {
                  label: 'Stable Diffusion XL (💼 Professional)',
                  value: 'stabilityai/stable-diffusion-xl-base-1.0',
                  description: '2.2M downloads | Business-ready quality',
                },
                {
                  label: 'DreamShaper v7 (🎨 Versatile Style)',
                  value: 'Lykon/dreamshaper-7',
                  description: '833K downloads | Great for varied content',
                },
                {
                  label: 'OpenJourney (🌟 Midjourney Style)',
                  value: 'prompthero/openjourney',
                  description: '8K downloads | Artistic business content',
                },
              ];
            default:
              return [];
          }
        };

        if (useCase === 'search') {
          try {
            const response = await httpClient.sendRequest({
              method: HttpMethod.GET,
              url: 'https://huggingface.co/api/models?pipeline_tag=text-to-image&sort=downloads&limit=50',
            });

            const models = response.body as Array<{
              id: string;
              downloads: number;
              likes: number;
            }>;

            return {
              disabled: false,
              placeholder: 'Select from 50+ popular models...',
              options: models
                .filter((model) => model.downloads > 50000)
                .slice(0, 20)
                .map((model) => ({
                  label: `${model.id} (${(model.downloads / 1000).toFixed(
                    0
                  )}K downloads)`,
                  value: model.id,
                })),
            };
          } catch (error) {
            return {
              disabled: false,
              options: getModelsByUseCase('quality'),
            };
          }
        }

        return {
          disabled: false,
          options: getModelsByUseCase(useCase as string),
        };
      },
    }),
    prompt: Property.LongText({
      displayName: 'Text Prompt',
      description:
        'Describe the image you want to generate. Be specific about style, colors, composition, and details.',
      required: true,
      defaultValue: '',
    }),
    aspectRatio: Property.StaticDropdown({
      displayName: 'Aspect Ratio',
      description: 'Choose the dimensions for your image',
      required: false,
      options: {
        disabled: false,
        options: [
          { label: '📱 Portrait (512×768) - Social Media', value: 'portrait' },
          { label: '🖥️ Landscape (768×512) - Banners', value: 'landscape' },
          { label: '⬜ Square (512×512) - Profile Pictures', value: 'square' },
          { label: '📺 Wide (1024×576) - Headers', value: 'wide' },
          { label: '⚙️ Custom Dimensions', value: 'custom' },
        ],
      },
      defaultValue: 'square',
    }),
    customWidth: Property.Number({
      displayName: 'Custom Width',
      description: 'Width in pixels (64-1024)',
      required: false,
    }),
    customHeight: Property.Number({
      displayName: 'Custom Height',
      description: 'Height in pixels (64-1024)',
      required: false,
    }),
    negativePrompt: Property.LongText({
      displayName: 'Negative Prompt',
      description:
        "Describe what you DON'T want in the image (blur, low quality, distorted, etc.)",
      required: false,
    }),
    qualitySettings: Property.StaticDropdown({
      displayName: 'Quality vs Speed',
      description: 'Balance between image quality and generation time',
      required: false,
      options: {
        disabled: false,
        options: [
          { label: '⚡ Fast (10-20 steps)', value: 'fast' },
          { label: '⚖️ Balanced (20-30 steps)', value: 'balanced' },
          { label: '🎯 High Quality (30-50 steps)', value: 'quality' },
          { label: '🏆 Maximum Quality (50+ steps)', value: 'maximum' },
          { label: '⚙️ Custom Steps', value: 'custom' },
        ],
      },
      defaultValue: 'balanced',
    }),
    customSteps: Property.Number({
      displayName: 'Custom Inference Steps',
      description: 'Number of denoising steps (1-100)',
      required: false,
    }),
    guidanceScale: Property.Number({
      displayName: 'Guidance Scale',
      description:
        'How closely to follow the prompt (1-20). Higher values = more prompt adherence but may reduce creativity.',
      required: false,
      defaultValue: 7.5,
    }),
    seed: Property.Number({
      displayName: 'Seed (Optional)',
      description:
        'Set a seed for reproducible results. Leave empty for random generation.',
      required: false,
    }),
    scheduler: Property.StaticDropdown({
      displayName: 'Scheduler',
      description: 'Advanced: Choose the noise scheduler algorithm',
      required: false,
      options: {
        disabled: false,
        options: [
          { label: 'DPM++ 2M Karras (Recommended)', value: 'DPM++2MKarras' },
          { label: 'Euler A (Fast)', value: 'EulerA' },
          { label: 'DDIM (Stable)', value: 'DDIM' },
          { label: 'LMS (Classic)', value: 'LMS' },
        ],
      },
    }),
  },
  async run(context) {
    const {
      useCase,
      model,
      prompt,
      aspectRatio,
      customWidth,
      customHeight,
      negativePrompt,
      qualitySettings,
      customSteps,
      guidanceScale,
      seed,
      scheduler,
    } = context.propsValue;

    if (!prompt?.trim()) {
      throw new Error('Please provide a text prompt for image generation');
    }

    let width: number, height: number;
    switch (aspectRatio) {
      case 'portrait':
        width = 512;
        height = 768;
        break;
      case 'landscape':
        width = 768;
        height = 512;
        break;
      case 'square':
        width = 512;
        height = 512;
        break;
      case 'wide':
        width = 1024;
        height = 576;
        break;
      case 'custom':
        width = customWidth || 512;
        height = customHeight || 512;
        break;
      default:
        width = 512;
        height = 512;
    }

    let numInferenceSteps: number;
    switch (qualitySettings) {
      case 'fast':
        numInferenceSteps = 15;
        break;
      case 'balanced':
        numInferenceSteps = 25;
        break;
      case 'quality':
        numInferenceSteps = 40;
        break;
      case 'maximum':
        numInferenceSteps = 60;
        break;
      case 'custom':
        numInferenceSteps = customSteps || 25;
        break;
      default:
        numInferenceSteps = 25;
    }

    const hf = new InferenceClient(context.auth as string);

    // Build parameters object
    const parameters: Record<string, unknown> = {
      guidance_scale: guidanceScale || 7.5,
      num_inference_steps: numInferenceSteps,
      width: width,
      height: height,
    };

    if (negativePrompt?.trim()) {
      parameters['negative_prompt'] = negativePrompt.trim();
    }

    if (seed !== undefined && seed !== null) {
      parameters['seed'] = Math.floor(seed);
    }

    if (scheduler) {
      parameters['scheduler'] = scheduler;
    }

    const args: TextToImageInput = {
      model: model,
      inputs: prompt.trim(),
      parameters: parameters,
    };

    const startTime = Date.now();

    try {
      const imageBlob = await hf.textToImage(args, {
        retry_on_error: true,
      });

      if (!(imageBlob instanceof Blob)) {
        throw new Error('Expected Blob response from text-to-image API');
      }

      const imageBuffer = Buffer.from(await imageBlob.arrayBuffer());
      const base64Image = imageBuffer.toString('base64');

      const generationTime = (Date.now() - startTime) / 1000;
      const imageSizeKB = Math.round(imageBuffer.length / 1024);

      return {
        image: base64Image,
        imageData: {
          format: 'PNG',
          width: width,
          height: height,
          sizeKB: imageSizeKB,
          base64: `data:image/png;base64,${base64Image}`,
        },
        generation: {
          prompt: prompt.trim(),
          negativePrompt: negativePrompt?.trim() || '',
          model: model,
          useCase: useCase,
        },
        parameters: {
          width: width,
          height: height,
          aspectRatio: aspectRatio,
          guidanceScale: guidanceScale || 7.5,
          inferenceSteps: numInferenceSteps,
          scheduler: scheduler || 'auto',
          seed: seed || 'random',
        },
        metrics: {
          generationTimeSeconds: generationTime,
          imageSizeKB: imageSizeKB,
          resolution: `${width}×${height}`,
          qualitySetting: qualitySettings || 'balanced',
          estimatedCost: calculateEstimatedCost(
            model,
            width,
            height,
            numInferenceSteps
          ),
        },
        businessInsights: {
          useCase: getUseCaseDescription(useCase as string),
          qualityTips: getQualityTips(
            prompt,
            negativePrompt,
            numInferenceSteps
          ),
          nextSteps: getNextSteps(useCase as string, imageSizeKB),
        },
        rawResult: {
          blob: imageBlob,
          generationTime: generationTime,
        },
      };
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      throw new Error(`Image generation failed: ${errorMessage}`);
    }
  },
});

function getUseCaseDescription(useCase: string): string {
  const descriptions = {
    speed: 'Optimized for rapid prototyping and quick content creation',
    quality:
      'High-resolution generation perfect for marketing and professional use',
    business:
      'Business-focused models ideal for product imagery and brand content',
    search: 'Custom model selection for specialized requirements',
  };

  return (
    descriptions[useCase as keyof typeof descriptions] ||
    'AI-powered image generation'
  );
}

function getQualityTips(
  prompt: string,
  negativePrompt: string | undefined,
  steps: number
): string[] {
  const tips: string[] = [];

  if (prompt.length < 20) {
    tips.push(
      '💡 Add more descriptive details to your prompt for better results'
    );
  }

  if (!negativePrompt) {
    tips.push(
      '🚫 Consider adding negative prompts to avoid unwanted elements (blur, low quality, etc.)'
    );
  }

  if (steps < 20) {
    tips.push(
      '⚡ Using fast generation - increase steps for higher quality if needed'
    );
  }

  if (steps > 50) {
    tips.push(
      '⏱️ High step count may take longer - consider balanced setting for faster results'
    );
  }

  if (
    !prompt.toLowerCase().includes('high quality') &&
    !prompt.toLowerCase().includes('detailed')
  ) {
    tips.push(
      '🎯 Add quality keywords like "high resolution", "detailed", or "professional" to your prompt'
    );
  }

  if (tips.length === 0) {
    tips.push('✅ Good generation parameters - expect quality results');
  }

  return tips;
}


function getNextSteps(useCase: string, imageSizeKB: number): string[] {
  const steps: string[] = [];

  if (useCase === 'business') {
    steps.push('🎨 Try variations with different styles or angles');
    steps.push(
      '📐 Consider generating multiple aspect ratios for different platforms'
    );
  }

  if (useCase === 'speed') {
    steps.push('🔄 Generate variations quickly with different seeds');
    steps.push(
      '⬆️ Upscale to higher quality when you find the perfect concept'
    );
  }

  if (imageSizeKB > 1000) {
    steps.push('📉 Consider optimizing image size for web use');
  }

  steps.push('💾 Save successful prompts for consistent brand imagery');
  steps.push('🔄 Use the same seed to create variations of this concept');

  return steps;
}

function calculateEstimatedCost(
  model: string,
  width: number,
  height: number,
  steps: number
): string {
  const basePixelCost = 0.000001;
  const stepMultiplier = steps / 25;
  const modelMultiplier = model.includes('FLUX.1-dev')
    ? 2.5
    : model.includes('stable-diffusion-3')
    ? 2.0
    : model.includes('turbo')
    ? 0.5
    : 1.0;

  const pixels = width * height;
  const estimatedCost =
    pixels * basePixelCost * stepMultiplier * modelMultiplier;

  if (estimatedCost < 0.001) {
    return '< $0.001';
  }

  return `~$${estimatedCost.toFixed(4)}`;
}
