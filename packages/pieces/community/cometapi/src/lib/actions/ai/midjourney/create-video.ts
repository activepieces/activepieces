import { createAction, Property } from '@activepieces/pieces-framework';
import { cometApiAuth } from '../../../auth';
import { cometApiAiProps } from '../../../common/ai-props';
import { cometApiApi } from '../../../common/api';
import { cometApiUtils } from '../../../common/utils';
import { cometapiMidjourneyCreateVideoOutputSchema } from '../../../output-schemas';

export const midjourneyCreateVideoAction = createAction({
  auth: cometApiAuth,
  name: 'cometapi_midjourney_create_video',
  outputSchema: cometapiMidjourneyCreateVideoOutputSchema,
  displayName: 'Midjourney Create Video',
  description: 'Animates a first-frame image into a Midjourney video.',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description:
      'Submits a Midjourney image-to-video task from a first-frame image (public URL or base64 data URI) and returns the task id in result; poll it with Midjourney Get Task for videoUrl. To act on an earlier video task set Action together with its Task ID (from Midjourney Get Task) and Index. Billed generation.',
    idempotent: false,
  },
  props: {
    image: Property.LongText({
      displayName: 'Image',
      description: 'First-frame image as a public URL or a base64 data URI.',
      required: true,
    }),
    motion: Property.StaticDropdown({
      displayName: 'Motion',
      description: 'Motion intensity.',
      required: true,
      defaultValue: 'low',
      options: {
        options: [
          { label: 'Low', value: 'low' },
          { label: 'High', value: 'high' },
        ],
      },
    }),
    prompt: Property.LongText({
      displayName: 'Prompt',
      description: 'Text guiding the video.',
      required: false,
    }),
    videoType: Property.ShortText({
      displayName: 'Video Type',
      description:
        'Video model variant, e.g. "vid_1.1_i2v_480" (480p) or "vid_1.1_i2v_720" (720p).',
      required: false,
    }),
    action: Property.ShortText({
      displayName: 'Action',
      description:
        'Action to perform on an existing video task. Requires Task ID and Index.',
      required: false,
    }),
    taskId: Property.ShortText({
      displayName: 'Task ID',
      description:
        'Parent video task ID from Midjourney Create Video. Required with Action.',
      required: false,
    }),
    index: Property.Number({
      displayName: 'Index',
      description:
        'Zero-based index of the video variant of the parent task. Required with Action.',
      required: false,
    }),
    noStorage: cometApiAiProps.booleanChoice({
      required: false,
      displayName: 'Provider URL',
      description:
        'Yes returns the original provider video URL instead of a CometAPI-proxied link.',
      trueLabel: 'Yes',
      falseLabel: 'No',
    }),
    additionalFields: cometApiAiProps.additionalFields({ required: false }),
  },
  async run({ auth, propsValue }) {
    const { action, taskId, index, noStorage } = propsValue;
    if (action && (!taskId || index === undefined || index === null)) {
      throw new Error('Action requires both Task ID and Index.');
    }
    return await cometApiApi.submitMidjourneyTask({
      auth,
      endpoint: 'video',
      body: cometApiUtils.withAdditionalFields({
        additionalFields: propsValue.additionalFields,
        fields: {
          image: propsValue.image,
          motion: propsValue.motion,
          prompt: propsValue.prompt,
          videoType: propsValue.videoType,
          action,
          taskId,
          index,
          noStorage: cometApiUtils.toBoolean({ value: noStorage }),
        },
      }),
    });
  },
});
