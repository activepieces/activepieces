import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { magicHourAuth } from '../auth';
import { magicHourCommon, SubmitResponse } from '../common';

export const textToVideoAction = createAction({
  auth: magicHourAuth,
  name: 'text_to_video',
  classification: 'WRITE',
  displayName: 'Text to Video',
  description:
    'Generates a video clip from a text prompt using Sora 2, Veo 3.1, Kling 3.0, Seedance, MiniMax, WAN 2.2 or LTX 2.3.',
  audience: 'both',
  aiMetadata: {
    description:
      'Generate a short video from a text prompt with Magic Hour. Use Image to Video instead when you have a starting frame. Cost is credits/sec x duration; wan-2.2, ltx-2.3 and minimax-h3 are free-tier (24 credits/sec), kling-3.0 is 48, veo3.1 is 96, sora-2 is 120. Each call starts a new billable render, so retries create duplicate jobs.',
    idempotent: false,
  },
  props: {
    prompt: Property.LongText({
      displayName: 'Prompt',
      description:
        'Describe the scene, motion, camera work and style you want.',
      required: true,
    }),
    model: magicHourCommon.props.videoModel,
    duration: magicHourCommon.props.duration,
    resolution: magicHourCommon.props.resolution,
    aspectRatio: magicHourCommon.props.aspectRatio,
    audio: Property.Checkbox({
      displayName: 'Generate Audio',
      description:
        'Ask the model to generate a soundtrack. Only some models (e.g. Veo 3.1, Sora 2) support audio.',
      required: false,
      defaultValue: false,
    }),
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
      duration,
      resolution,
      aspectRatio,
      audio,
      name,
      waitForCompletion,
      maxWaitSeconds,
    } = context.propsValue;
    const apiKey = context.auth.secret_text;
    const submitted = await magicHourCommon.apiCall<SubmitResponse>({
      apiKey,
      method: HttpMethod.POST,
      path: '/text-to-video',
      body: {
        name: name ?? `Activepieces text-to-video (${model})`,
        model,
        end_seconds: duration,
        resolution,
        aspect_ratio: aspectRatio,
        audio: audio ?? false,
        style: { prompt },
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
