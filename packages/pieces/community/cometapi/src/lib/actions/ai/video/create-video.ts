import { ApFile, createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { cometApiAuth } from '../../../auth';
import { cometApiAiProps } from '../../../common/ai-props';
import { cometApiClient } from '../../../common/client';
import { cometapiCreateVideoOutputSchema } from '../../../output-schemas';

export const createVideoAction = createAction({
  auth: cometApiAuth,
  name: 'cometapi_create_video',
  outputSchema: cometapiCreateVideoOutputSchema,
  displayName: 'Create Video',
  description:
    'Starts a video generation task with Sora 2, Veo, Seedance, Wan, Vidu, MiniMax H3, Flux 3, HappyHorse or Omni.',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description:
      'Starts an async video generation on the unified videos endpoint (Sora 2, Veo 3.1, Seedance, Wan, Vidu, MiniMax H3, Flux 3, HappyHorse, Omni) and returns the task id and status; poll it with Get Video, then save the MP4 with Download Video. Accepted durations, sizes and reference inputs depend on the model; use Create MiniMax Video for minimax-hailuo models and Generate Grok Video for Grok. Each call is a billed generation.',
    idempotent: false,
  },
  props: {
    model: cometApiAiProps.model({
      required: true,
      description:
        'Video model ID, e.g. "sora-2", "veo3.1-fast", "doubao-seedance-2-0", "wan3.0", "viduq3", "minimax-h3", "flux-3", "happyhorse-1.1" or "omni-fast". Use List Models with feature text-to-video or image-to-video.',
    }),
    prompt: Property.LongText({
      displayName: 'Prompt',
      description:
        'Describes the scene, motion and camera behavior of the video.',
      required: true,
    }),
    seconds: Property.Number({
      displayName: 'Seconds',
      description:
        'Clip duration in whole seconds. Allowed values depend on the model, e.g. 4, 8 or 12 for Sora 2 and 4, 6 or 8 for Veo.',
      required: false,
    }),
    size: Property.ShortText({
      displayName: 'Size',
      description:
        'Output size as WxH, e.g. "1280x720" or "720x1280". Allowed values depend on the model.',
      required: false,
    }),
    inputReference: Property.File({
      displayName: 'Reference Image File',
      description:
        'One reference image uploaded as a file (input_reference). Sora, Veo and Omni use it as the opening frame for image-to-video.',
      required: false,
    }),
    referenceImageUrls: Property.Array({
      displayName: 'Reference Image URLs',
      description:
        'Public HTTPS image URLs sent as repeated input_reference fields (Seedance, Wan, Vidu Q4, MiniMax H3, Flux 3, HappyHorse). Do not combine with Reference Image File.',
      required: false,
    }),
    referenceVideoUrls: Property.Array({
      displayName: 'Reference Video URLs',
      description:
        'Public HTTPS MP4 URLs sent as repeated reference_videos fields (Seedance 2.x, Wan, MiniMax H3).',
      required: false,
    }),
    referenceAudioUrls: Property.Array({
      displayName: 'Reference Audio URLs',
      description:
        'Public HTTPS MP3 URLs sent as repeated reference_audios fields (Seedance 2.x, Wan 3.0, Vidu Q4, MiniMax H3).',
      required: false,
    }),
    firstFrame: Property.File({
      displayName: 'First Frame',
      description:
        'Opening frame image (Wan 2.7+, MiniMax H3, Flux 3, HappyHorse). Do not combine with reference media.',
      required: false,
    }),
    lastFrame: Property.File({
      displayName: 'Last Frame',
      description:
        'Ending frame image, used with First Frame (Wan 2.7+, MiniMax H3, Flux 3).',
      required: false,
    }),
    additionalFields: cometApiAiProps.additionalFields({
      required: false,
      description:
        'Other form fields the model accepts, e.g. {"aspect_ratio": "16:9", "resolution": "720p"} for Omni. Arrays are sent as repeated fields. Dedicated inputs above take precedence over the same key here.',
    }),
  },
  async run({ auth, propsValue }) {
    const referenceImageUrls = (propsValue.referenceImageUrls ?? []).map(
      (value) => toText({ value })
    );
    if (propsValue.inputReference && referenceImageUrls.length > 0) {
      throw new Error(
        'Set either Reference Image File or Reference Image URLs, not both.'
      );
    }
    const dedicated: Record<string, FormValue[]> = {
      model: [propsValue.model],
      prompt: [propsValue.prompt],
      seconds:
        propsValue.seconds === undefined ? [] : [propsValue.seconds.toString()],
      size: propsValue.size ? [propsValue.size] : [],
      input_reference: propsValue.inputReference
        ? [propsValue.inputReference]
        : referenceImageUrls,
      reference_videos: (propsValue.referenceVideoUrls ?? []).map((value) =>
        toText({ value })
      ),
      reference_audios: (propsValue.referenceAudioUrls ?? []).map((value) =>
        toText({ value })
      ),
      first_frame: propsValue.firstFrame ? [propsValue.firstFrame] : [],
      last_frame: propsValue.lastFrame ? [propsValue.lastFrame] : [],
    };
    const fields: Record<string, FormValue[]> = {
      ...additionalFormFields({ fields: propsValue.additionalFields ?? {} }),
      ...Object.fromEntries(
        Object.entries(dedicated).filter(([, values]) => values.length > 0)
      ),
    };
    const form = new FormData();
    for (const [key, values] of Object.entries(fields)) {
      for (const value of values) {
        if (typeof value === 'string') {
          form.append(key, value);
        } else {
          form.append(
            key,
            new Blob([new Uint8Array(value.data)]),
            value.filename
          );
        }
      }
    }
    return await cometApiClient.request({
      auth,
      method: HttpMethod.POST,
      path: '/videos',
      body: form,
    });
  },
});

function additionalFormFields({
  fields,
}: {
  fields: Record<string, unknown>;
}): Record<string, FormValue[]> {
  return Object.fromEntries(
    Object.entries(fields)
      .filter(([, value]) => value !== undefined && value !== null)
      .map(([key, value]) => [
        key,
        Array.isArray(value)
          ? value.map((item) => toText({ value: item }))
          : [toText({ value })],
      ])
  );
}

function toText({ value }: { value: unknown }): string {
  if (typeof value === 'string') {
    return value;
  }
  return typeof value === 'object' ? JSON.stringify(value) : String(value);
}

type FormValue = string | ApFile;
