import { createAction, ExecutionType, Property } from '@activepieces/pieces-framework';
import { hermosoAuth } from '../auth';
import { hermosoApi } from '../common/client';
import { hermosoProps } from '../common/props';
import { hermosoRender } from '../common/render';

export const generateImageAction = createAction({
  auth: hermosoAuth,
  name: 'generate_image',
  classification: 'WRITE',
  displayName: 'Generate Image',
  description: 'Generates a finished image ad from a prompt, using the product photos and logo saved on your brand.',
  audience: 'both',
  aiMetadata: {
    description:
      'Renders one image ad on the chosen Hermoso brand and returns its public file URL; the image is also saved to the brand Library. Use Generate Video for a video clip. Each run starts a new render; a retry of the same step in the same flow run returns the first render instead of starting another.',
    idempotent: false,
  },
  props: {
    brand: hermosoProps.brand,
    prompt: Property.LongText({
      displayName: 'Prompt',
      description: 'Describe the image: subject, composition, lighting, and any words that should appear on it.',
      required: true,
    }),
    aspect_ratio: Property.StaticDropdown({
      displayName: 'Shape',
      description: 'The shape of the finished image.',
      required: false,
      defaultValue: '1:1',
      options: {
        options: [
          { label: 'Square (1:1)', value: '1:1' },
          { label: 'Portrait (4:5)', value: '4:5' },
          { label: 'Vertical (9:16)', value: '9:16' },
          { label: 'Landscape (16:9)', value: '16:9' },
        ],
      },
    }),
    use_brand: Property.Checkbox({
      displayName: 'Use Saved Brand Assets',
      description:
        'On: Hermoso adds the product photos and logo saved on the brand so the image shows your real product. Off: the image is made from the prompt alone.',
      required: false,
      defaultValue: true,
    }),
    reference_images: Property.Array({
      displayName: 'Reference Images',
      description:
        'Optional. Up to 3 public links to product or logo photos to place in the image. When you add any, they are used instead of the saved brand assets.',
      required: false,
    }),
    model: hermosoProps.imageModel,
    wait_for_result: hermosoProps.waitForResult,
  },
  async run(context) {
    const apiKey = context.auth.secret_text;
    const brand = context.propsValue.brand ?? undefined;
    if (context.executionType === ExecutionType.RESUME) {
      return hermosoRender.resume({ apiKey, brand, payload: context.resumePayload.body });
    }
    const references = hermosoApi.textList(context.propsValue.reference_images);
    if (references.length > MAX_REFERENCE_IMAGES) {
      throw new Error(`Add at most ${MAX_REFERENCE_IMAGES} reference images.`);
    }
    const refImages = await Promise.all(references.map((url) => hermosoApi.hostedUrl({ apiKey, brand, url })));
    const body = hermosoApi.compact({
      type: 'image',
      prompt: context.propsValue.prompt.trim(),
      model: context.propsValue.model,
      aspect_ratio: context.propsValue.aspect_ratio,
      use_brand: context.propsValue.use_brand !== false,
      ref_images: refImages,
    });
    return hermosoRender.start({
      apiKey,
      brand,
      body,
      wait: context.propsValue.wait_for_result !== false,
      timeoutMs: IMAGE_POLL_TIMEOUT_MS,
      run: context.run,
      stepName: context.step.name,
    });
  },
});

const MAX_REFERENCE_IMAGES = 3;
const IMAGE_POLL_TIMEOUT_MS = 240000;
