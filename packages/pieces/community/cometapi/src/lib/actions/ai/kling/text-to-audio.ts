import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { cometApiAuth } from '../../../auth';
import { cometApiAiProps } from '../../../common/ai-props';
import { cometApiClient } from '../../../common/client';
import { cometApiUtils } from '../../../common/utils';
import { cometapiKlingCreateLipSyncOutputSchema } from '../../../output-schemas';

export const klingTextToAudioAction = createAction({
  auth: cometApiAuth,
  name: 'cometapi_kling_text_to_audio',
  outputSchema: cometapiKlingCreateLipSyncOutputSchema,
  displayName: 'Kling Text to Audio',
  description:
    'Starts a Kling sound-effect or audio clip generation from a text prompt.',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description:
      'Starts a billed Kling text-to-audio task for a 3-10 s sound clip described by a prompt and returns its task_id and status; poll it with Kling Get Task using kind audio/text-to-audio. Pick Kling Text to Speech for spoken words, or Kling Video to Audio to score an existing video.',
    idempotent: false,
  },
  props: {
    prompt: Property.LongText({
      displayName: 'Prompt',
      description: 'The audio to generate. Up to 200 characters.',
      required: true,
    }),
    duration: Property.Number({
      displayName: 'Duration (seconds)',
      description: 'From 3 to 10 seconds.',
      required: true,
    }),
    callbackUrl: cometApiAiProps.klingCallbackUrl({ required: false }),
    externalTaskId: cometApiAiProps.klingExternalTaskId({ required: false }),
    additionalFields: cometApiAiProps.additionalFields({ required: false }),
  },
  async run({ auth, propsValue }) {
    return await cometApiClient.request({
      auth,
      method: HttpMethod.POST,
      host: 'root',
      path: '/kling/v1/audio/text-to-audio',
      body: cometApiUtils.withAdditionalFields({
        additionalFields: propsValue.additionalFields,
        fields: {
          prompt: propsValue.prompt,
          duration: propsValue.duration,
          callback_url: propsValue.callbackUrl,
          external_task_id: propsValue.externalTaskId,
        },
      }),
    });
  },
});
