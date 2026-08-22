import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { magicHourAuth } from '../auth';
import { magicHourCommon, SubmitResponse } from '../common';

export const generateImageAction = createAction({
  auth: magicHourAuth,
  name: 'generate_image',
  classification: 'WRITE',
  displayName: 'Generate Image',
  description:
    'Generates one or more images from a text prompt using GPT Image, Nano Banana Pro, Seedream, Flux or Z-Image.',
  audience: 'both',
  aiMetadata: {
    description:
      'Generate images from a text prompt with Magic Hour. Use this for stills; use Text to Video for clips. Costs a small number of credits per image and works on the free tier. Each call starts a new billable generation, so retries create duplicate jobs.',
    idempotent: false,
  },
  props: {
    prompt: Property.LongText({
      displayName: 'Prompt',
      description: 'Describe the image you want.',
      required: true,
    }),
    model: magicHourCommon.props.imageModel,
    imageCount: Property.Number({
      displayName: 'Number of Images',
      description: 'How many images to generate (1-4).',
      required: false,
      defaultValue: 1,
    }),
    aspectRatio: magicHourCommon.props.aspectRatio,
    name: Property.ShortText({
      displayName: 'Project Name',
      description: 'Optional label shown in your Magic Hour dashboard.',
      required: false,
    }),
    waitForCompletion: magicHourCommon.props.waitForCompletion,
    maxWaitSeconds: magicHourCommon.props.maxWaitSeconds,
  },
  async run(context) {
    const {
      prompt,
      model,
      imageCount,
      aspectRatio,
      name,
      waitForCompletion,
      maxWaitSeconds,
    } = context.propsValue;
    const apiKey = context.auth.secret_text;
    const submitted = await magicHourCommon.apiCall<SubmitResponse>({
      apiKey,
      method: HttpMethod.POST,
      path: '/ai-image-generator',
      body: {
        name: name ?? `Activepieces image (${model})`,
        model,
        image_count: imageCount ?? 1,
        aspect_ratio: aspectRatio,
        style: { prompt },
      },
    });
    if (waitForCompletion === false) {
      return magicHourCommon.toImageOutput({
        project: await magicHourCommon.getImageProject({
          apiKey,
          projectId: submitted.id,
        }),
        model,
      });
    }
    const project = await magicHourCommon.waitForProject({
      apiKey,
      projectId: submitted.id,
      kind: 'image',
      maxWaitSeconds,
    });
    return magicHourCommon.toImageOutput({ project, model });
  },
});
