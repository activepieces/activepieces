import { createAction, ExecutionType, Property } from '@activepieces/pieces-framework';
import { hermosoAuth } from '../auth';
import { hermosoApi } from '../common/client';
import { hermosoProps } from '../common/props';
import { hermosoRender } from '../common/render';

export const generateVideoAction = createAction({
  auth: hermosoAuth,
  name: 'generate_video',
  classification: 'WRITE',
  displayName: 'Generate Video',
  description: 'Generates a video from a prompt and returns the finished video. A video takes one to three minutes.',
  audience: 'both',
  aiMetadata: {
    description:
      'Renders one video clip on the chosen Hermoso brand and returns its public mp4 URL; the video is also saved to the brand Library. With Wait for the Result off it returns the queued job, which Get Render Job collects later. Each run starts a new render; a retry of the same step in the same flow run returns the first render instead of starting another.',
    idempotent: false,
  },
  props: {
    brand: hermosoProps.brand,
    prompt: Property.LongText({
      displayName: 'Prompt',
      description: 'Describe the video shot by shot: who or what is on screen, the action, the setting and the mood.',
      required: true,
    }),
    aspect_ratio: Property.StaticDropdown({
      displayName: 'Shape',
      description: 'The shape of the finished video.',
      required: false,
      defaultValue: '9:16',
      options: {
        options: [
          { label: 'Vertical (9:16)', value: '9:16' },
          { label: 'Square (1:1)', value: '1:1' },
          { label: 'Landscape (16:9)', value: '16:9' },
        ],
      },
    }),
    duration_seconds: Property.Number({
      displayName: 'Length in Seconds',
      description: 'Leave empty for the default length. Each model renders its own set of lengths.',
      required: false,
    }),
    first_frame_image: Property.ShortText({
      displayName: 'First Frame Image',
      description: 'Optional. A public link to an image the video should open on, such as a product photo.',
      required: false,
    }),
    model: hermosoProps.videoModel,
    wait_for_result: hermosoProps.waitForResult,
  },
  async run(context) {
    const apiKey = context.auth.secret_text;
    const brand = context.propsValue.brand ?? undefined;
    if (context.executionType === ExecutionType.RESUME) {
      return hermosoRender.resume({ apiKey, brand, payload: context.resumePayload.body });
    }
    const firstFrame = (context.propsValue.first_frame_image ?? '').trim();
    const duration = context.propsValue.duration_seconds;
    const body = hermosoApi.compact({
      type: 'video',
      prompt: context.propsValue.prompt.trim(),
      model: context.propsValue.model,
      aspect_ratio: context.propsValue.aspect_ratio,
      duration_seconds: typeof duration === 'number' && Number.isFinite(duration) ? Math.round(duration) : undefined,
      ref_image: firstFrame ? await hermosoApi.hostedUrl({ apiKey, brand, url: firstFrame }) : undefined,
    });
    return hermosoRender.start({
      apiKey,
      brand,
      body,
      wait: context.propsValue.wait_for_result !== false,
      timeoutMs: VIDEO_POLL_TIMEOUT_MS,
      run: context.run,
      stepName: context.step.name,
    });
  },
});

const VIDEO_POLL_TIMEOUT_MS = 480000;
