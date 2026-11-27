import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { cometApiAuth } from '../../../auth';
import { cometApiAiProps } from '../../../common/ai-props';
import { cometApiClient } from '../../../common/client';
import { cometApiUtils } from '../../../common/utils';
import { cometapiGrokEditVideoOutputSchema } from '../../../output-schemas';

export const grokEditVideoAction = createAction({
  auth: cometApiAuth,
  name: 'cometapi_grok_edit_video',
  outputSchema: cometapiGrokEditVideoOutputSchema,
  displayName: 'Edit Grok Video',
  description:
    'Starts a Grok video edit of an existing MP4 from a text instruction.',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description:
      'Starts an async Grok edit of a short source MP4 (about 8.7 seconds max) from a text instruction, keeping its timing and composition, and returns the request_id; poll it with Get Grok Video. Use Generate Grok Video for a new clip. Each call is a billed generation.',
    idempotent: false,
  },
  props: {
    prompt: Property.LongText({
      displayName: 'Prompt',
      description: 'The edit instruction, e.g. "Add snow to the scene."',
      required: true,
    }),
    videoUrl: Property.ShortText({
      displayName: 'Video URL',
      description: 'Public URL of the source MP4.',
      required: true,
    }),
    model: cometApiAiProps.model({
      required: false,
      description: 'xAI video model ID. Defaults to "grok-imagine-video".',
    }),
    additionalFields: cometApiAiProps.additionalFields({
      required: false,
      description:
        'Other body fields, e.g. output or user, as a JSON object. Dedicated inputs above take precedence over the same key here.',
    }),
  },
  async run({ auth, propsValue }) {
    return await cometApiClient.request({
      auth,
      method: HttpMethod.POST,
      host: 'root',
      path: '/grok/v1/videos/edits',
      body: cometApiUtils.withAdditionalFields({
        additionalFields: propsValue.additionalFields,
        fields: {
          model: propsValue.model,
          prompt: propsValue.prompt,
          video: { url: propsValue.videoUrl },
        },
      }),
    });
  },
});
