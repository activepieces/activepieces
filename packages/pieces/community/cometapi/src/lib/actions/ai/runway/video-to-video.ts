import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { cometApiAuth } from '../../../auth';
import { cometApiAiProps } from '../../../common/ai-props';
import { cometApiClient } from '../../../common/client';
import { cometApiUtils } from '../../../common/utils';
import { cometapiRunwayCharacterPerformanceOutputSchema } from '../../../output-schemas';

const TARGET_ASPECT_RATIOS = [
  '16:9',
  '4:3',
  '3:2',
  '1:1',
  '2:3',
  '3:4',
  '9:16',
  '21:9',
];

const OUTPUT_FORMATS = ['mp4', 'prores', 'png_sequence', 'sdr_rec709_10bit'];

export const runwayVideoToVideoAction = createAction({
  auth: cometApiAuth,
  name: 'cometapi_runway_video_to_video',
  outputSchema: cometapiRunwayCharacterPerformanceOutputSchema,
  displayName: 'Runway Video to Video',
  description: 'Starts a Runway Aleph 2 edit of a source video.',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description:
      'Starts an async Runway Aleph 2 (aleph2) edit of a source video up to 30 seconds, guided by a prompt and/or timed keyframe images, and returns the task id; poll it with Runway Get Task. Use Runway Upscale Video to only raise resolution. Each call is a billed generation.',
    idempotent: false,
  },
  props: {
    videoUri: Property.ShortText({
      displayName: 'Video URL',
      description:
        'The video to edit, up to 30 seconds: a public HTTPS URL or a Base64 video data URI up to 5 MB.',
      required: true,
    }),
    promptText: Property.LongText({
      displayName: 'Prompt',
      description:
        'The edit to make, 1 to 1,000 characters. May be omitted when Keyframes are given.',
      required: false,
    }),
    keyframes: Property.Json({
      displayName: 'Keyframes',
      description:
        'Up to five timed guidance images, as a JSON array. Each item has "uri" (HTTPS URL or image data URI) and exactly one of "seconds" (0-30) or "at" (0-1 fraction of the video), plus optional "range": {"start_seconds", "end_seconds"} set on every item or none.',
      required: false,
    }),
    targetAspectRatio: Property.StaticDropdown({
      displayName: 'Target Aspect Ratio',
      description:
        'Expand the video to this shape; the input is letterboxed before generation.',
      required: false,
      options: {
        options: cometApiUtils.toOptions({ values: TARGET_ASPECT_RATIOS }),
      },
    }),
    seed: cometApiAiProps.runwaySeed({ required: false }),
    outputFormat: Property.StaticDropdown({
      displayName: 'Output Format',
      description:
        'Output encoding. Leave empty for H.264 MP4. Set proresProfile through Additional Fields for prores.',
      required: false,
      options: {
        options: cometApiUtils.toOptions({ values: OUTPUT_FORMATS }),
      },
    }),
    publicFigureThreshold: cometApiAiProps.runwayPublicFigureThreshold({
      required: false,
    }),
    additionalFields: cometApiAiProps.additionalFields({ required: false }),
  },
  async run({ auth, propsValue }) {
    return await cometApiClient.request({
      auth,
      method: HttpMethod.POST,
      host: 'root',
      path: '/runwayml/v1/video_to_video',
      body: cometApiUtils.withAdditionalFields({
        additionalFields: propsValue.additionalFields,
        fields: {
          model: 'aleph2',
          videoUri: propsValue.videoUri,
          promptText: propsValue.promptText,
          keyframes: propsValue.keyframes,
          targetAspectRatio: propsValue.targetAspectRatio,
          seed: propsValue.seed,
          outputFormat: propsValue.outputFormat,
          contentModeration: propsValue.publicFigureThreshold
            ? { publicFigureThreshold: propsValue.publicFigureThreshold }
            : undefined,
        },
      }),
    });
  },
});
