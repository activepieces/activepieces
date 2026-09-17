import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { magicHourAuth } from '../auth';
import { magicHourApi } from '../common/client';

export const imageToVideoAction = createAction({
  auth: magicHourAuth,
  name: 'image_to_video',
  classification: 'WRITE',
  displayName: 'Create Video From Image',
  description: 'Start a video generation job from a still image.',
  audience: 'both',
  aiMetadata: {
    description:
      'Animate a direct image URL or Magic Hour file path into a credit-consuming video job. Use Get Project with type Video for completion and downloads. Each retry starts another generation.',
    idempotent: false,
  },
  props: {
    image_file_path: Property.ShortText({
      displayName: 'Source Image',
      description:
        'A direct image URL or file_path returned by Generate Asset Upload URLs.',
      required: true,
      placeholder: 'https://example.com/source.png',
    }),
    prompt: Property.LongText({
      displayName: 'Motion Prompt',
      description: 'Describe the desired movement, scene, and camera behavior.',
      required: false,
    }),
    end_seconds: Property.Number({
      displayName: 'Duration',
      description:
        'Video duration in seconds. Supported values depend on the model.',
      required: true,
      defaultValue: 5,
      min: 1,
    }),
    model: Property.StaticDropdown({
      displayName: 'Model',
      description:
        'Use Default unless the workflow requires a specific Magic Hour video model.',
      required: true,
      defaultValue: 'default',
      options: {
        options: [
          { label: 'Default', value: 'default' },
          { label: 'LTX 2', value: 'ltx-2' },
          { label: 'LTX 2.5', value: 'ltx-2.5' },
          { label: 'MiniMax H3', value: 'minimax-h3' },
          { label: 'WAN 2.2', value: 'wan-2.2' },
          { label: 'Seedance 1.5', value: 'seedance-1.5' },
          { label: 'Seedance 2.0', value: 'seedance-2.0' },
          { label: 'Seedance 2.0 Mini', value: 'seedance-2.0-mini' },
          { label: 'Seedance 2.5', value: 'seedance-2.5' },
          { label: 'Kling 2.5', value: 'kling-2.5' },
          { label: 'Kling 2.6', value: 'kling-2.6' },
          { label: 'Kling 3.0', value: 'kling-3.0' },
          { label: 'Gemini Omni 1.1', value: 'gemini-omni-1.1' },
          { label: 'Veo 3.1', value: 'veo3.1' },
          { label: 'Veo 3.1 Lite', value: 'veo3.1-lite' },
          { label: 'Sora 2', value: 'sora-2' },
        ],
      },
    }),
    resolution: Property.StaticDropdown({
      displayName: 'Resolution',
      description: 'Output resolution. Availability depends on the model.',
      required: false,
      options: {
        options: [
          { label: '360p', value: '360p' },
          { label: '480p', value: '480p' },
          { label: '720p', value: '720p' },
          { label: '1080p', value: '1080p' },
          { label: '4K', value: '4k' },
        ],
      },
    }),
    audio: Property.Checkbox({
      displayName: 'Generate Audio',
      description: 'Ask supported models to create synchronized audio.',
      required: false,
      defaultValue: false,
    }),
    end_image_file_path: Property.ShortText({
      displayName: 'Final Frame Image',
      description:
        'Optional direct image URL or Magic Hour file path for the final frame. Only some models support this.',
      required: false,
      advanced: true,
    }),
    name: Property.ShortText({
      displayName: 'Project Name',
      description: 'Optional name shown in the Magic Hour project list.',
      required: false,
      advanced: true,
    }),
  },
  async run(context) {
    return magicHourApi.call({
      apiKey: context.auth.secret_text,
      method: HttpMethod.POST,
      path: '/image-to-video',
      body: {
        end_seconds: context.propsValue.end_seconds,
        model: context.propsValue.model,
        audio: context.propsValue.audio,
        assets: {
          image_file_path: context.propsValue.image_file_path,
          ...(context.propsValue.end_image_file_path
            ? { end_image_file_path: context.propsValue.end_image_file_path }
            : {}),
        },
        ...(context.propsValue.prompt
          ? { style: { prompt: context.propsValue.prompt } }
          : {}),
        ...(context.propsValue.resolution
          ? { resolution: context.propsValue.resolution }
          : {}),
        ...(context.propsValue.name
          ? { name: context.propsValue.name }
          : {}),
      },
    });
  },
});
