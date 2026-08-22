import { HttpMethod } from '@activepieces/pieces-common';
import { ApFile, createAction, Property } from '@activepieces/pieces-framework';
import { magicHourAuth } from '../auth';
import { magicHourCommon, SubmitResponse } from '../common';

export const imageToVideoAction = createAction({
  auth: magicHourAuth,
  name: 'image_to_video',
  classification: 'WRITE',
  displayName: 'Image to Video',
  description: 'Animates an image into a video clip guided by a text prompt.',
  audience: 'both',
  aiMetadata: {
    description:
      'Animate a still image into a video with Magic Hour, using the image as the first frame. Provide exactly one of a public HTTPS image URL or an uploaded file. Use Text to Video when there is no starting image. Cost is credits/sec x duration; wan-2.2, ltx-2.3 and minimax-h3 are free-tier. Each call starts a new billable render, so retries create duplicate jobs.',
    idempotent: false,
  },
  props: {
    imageUrl: Property.ShortText({
      displayName: 'Image URL',
      description:
        'Public HTTPS URL of the starting image. Leave empty if you upload a file below.',
      required: false,
    }),
    imageFile: Property.File({
      displayName: 'Image File',
      description:
        'Starting image (PNG, JPG or WebP). Used when no Image URL is given.',
      required: false,
    }),
    prompt: Property.LongText({
      displayName: 'Prompt',
      description: 'Describe how the image should move or what should happen.',
      required: true,
    }),
    model: magicHourCommon.props.videoModel,
    duration: magicHourCommon.props.duration,
    resolution: magicHourCommon.props.resolution,
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
      imageUrl,
      imageFile,
      prompt,
      model,
      duration,
      resolution,
      name,
      waitForCompletion,
      maxWaitSeconds,
    } = context.propsValue;
    const apiKey = context.auth.secret_text;
    const imageFilePath = await resolveImage({ apiKey, imageUrl, imageFile });
    const submitted = await magicHourCommon.apiCall<SubmitResponse>({
      apiKey,
      method: HttpMethod.POST,
      path: '/image-to-video',
      body: {
        name: name ?? `Activepieces image-to-video (${model})`,
        model,
        end_seconds: duration,
        resolution,
        style: { prompt },
        assets: { image_file_path: imageFilePath },
      },
    });
    if (waitForCompletion === false) {
      return magicHourCommon.toVideoOutput({
        project: await magicHourCommon.getVideoProject({
          apiKey,
          projectId: submitted.id,
        }),
        model,
      });
    }
    const project = await magicHourCommon.waitForProject({
      apiKey,
      projectId: submitted.id,
      kind: 'video',
      maxWaitSeconds,
    });
    return magicHourCommon.toVideoOutput({ project, model });
  },
});

async function resolveImage({
  apiKey,
  imageUrl,
  imageFile,
}: ResolveImageParams): Promise<string> {
  const trimmedUrl = imageUrl?.trim();
  if (trimmedUrl) {
    return trimmedUrl;
  }
  if (imageFile) {
    return magicHourCommon.uploadFile({ apiKey, file: imageFile });
  }
  throw new Error('Provide either an Image URL or an Image File.');
}

type ResolveImageParams = {
  apiKey: string;
  imageUrl?: string;
  imageFile?: ApFile;
};
