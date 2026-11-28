import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { cometApiAuth } from '../../../auth';
import { cometApiAiProps } from '../../../common/ai-props';
import { cometApiClient } from '../../../common/client';
import { cometApiUtils } from '../../../common/utils';
import { cometapiKlingCreateLipSyncOutputSchema } from '../../../output-schemas';

export const klingCreateLipSyncAction = createAction({
  auth: cometApiAuth,
  name: 'cometapi_kling_create_lip_sync',
  outputSchema: cometapiKlingCreateLipSyncOutputSchema,
  displayName: 'Kling Create Lip Sync',
  description:
    'Starts a Kling advanced lip-sync task that maps audio onto faces found in a video.',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description:
      'Starts a billed Kling advanced lip-sync task and returns its task_id and status; poll it with Kling Get Task using kind videos/advanced-lip-sync. Requires the session_id and face_id values from Kling Identify Faces on the same account; each face takes an audio_id from a prior Kling audio task or a hosted sound_file, and the clipped segment must be at least 2000 ms.',
    idempotent: false,
  },
  props: {
    sessionId: cometApiAiProps.klingSessionId({
      required: true,
      description: 'The session_id returned by Kling Identify Faces.',
    }),
    faces: Property.Array({
      displayName: 'Faces',
      description: 'One entry per face to lip-sync. Times are in milliseconds.',
      required: true,
      properties: {
        face_id: Property.ShortText({
          displayName: 'Face ID',
          description: 'A face_id from Kling Identify Faces.',
          required: true,
        }),
        audio_id: Property.ShortText({
          displayName: 'Audio ID',
          description:
            'Audio ID from a prior Kling audio task. Use this or Sound File.',
          required: false,
        }),
        sound_file: Property.ShortText({
          displayName: 'Sound File',
          description: 'Public audio URL. Use this or Audio ID.',
          required: false,
        }),
        sound_start_time: Property.ShortText({
          displayName: 'Sound Start (ms)',
          required: false,
        }),
        sound_end_time: Property.ShortText({
          displayName: 'Sound End (ms)',
          description: 'The clip from start to end must be at least 2000 ms.',
          required: false,
        }),
        sound_insert_time: Property.ShortText({
          displayName: 'Insert At (ms)',
          description: 'Where the audio starts in the video.',
          required: false,
        }),
        sound_volume: Property.Number({
          displayName: 'Sound Volume',
          required: false,
        }),
        original_sound_volume: Property.Number({
          displayName: 'Original Sound Volume',
          required: false,
        }),
      },
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
      path: '/kling/v1/videos/advanced-lip-sync',
      body: cometApiUtils.withAdditionalFields({
        additionalFields: propsValue.additionalFields,
        fields: {
          session_id: propsValue.sessionId,
          face_choose: propsValue.faces,
          callback_url: propsValue.callbackUrl,
          external_task_id: propsValue.externalTaskId,
        },
      }),
    });
  },
});
