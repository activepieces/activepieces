import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { cometApiAuth } from '../../../auth';
import { cometApiUtils } from '../../../common/utils';
import { cometApiClient } from '../../../common/client';
import { cometapiKlingGetTaskOutputSchema } from '../../../output-schemas';

const TASK_KINDS = [
  'videos/text2video',
  'videos/image2video',
  'videos/multi-image2video',
  'videos/motion-control',
  'videos/avatar/image2video',
  'videos/advanced-lip-sync',
  'videos/lip-sync',
  'videos/effects',
  'videos/video-extend',
  'videos/multi-elements',
  'audio/text-to-audio',
  'audio/tts',
  'audio/video-to-audio',
  'images/generations',
  'images/editing/expand',
  'images/multi-image2image',
  'images/kolors-virtual-try-on',
];

export const klingGetTaskAction = createAction({
  auth: cometApiAuth,
  name: 'cometapi_kling_get_task',
  outputSchema: cometapiKlingGetTaskOutputSchema,
  displayName: 'Kling Get Task',
  description: 'Reads the status and result of a legacy Kling task.',
  audience: 'ai',
  classification: 'READ',
  aiMetadata: {
    description:
      'Reads a legacy /kling/v1 task once and returns its task_status (submitted, processing, succeed, failed) and task_result; the kind must match the action that created the task: Kling Text to Video, Image to Video, Multi-Image to Video, Motion Control, Create Avatar Video, Create Lip Sync, Apply Video Effect, Extend Video, Create Multi-Element Video, Text to Audio, Text to Speech, Video to Audio, or the Kling image actions. Omni tasks use Kling Get Omni Video and model-route tasks use Kling Route Get Tasks.',
    idempotent: true,
  },
  props: {
    kind: Property.StaticDropdown({
      displayName: 'Task Kind',
      description:
        'The create endpoint the task came from, e.g. videos/text2video for Kling Text to Video, videos/avatar/image2video for Kling Create Avatar Video, images/editing/expand for a Kling image expansion.',
      required: true,
      options: {
        options: cometApiUtils.toOptions({ values: TASK_KINDS }),
      },
    }),
    taskId: Property.ShortText({
      displayName: 'Task ID',
      description: 'The task_id returned by the create action.',
      required: true,
    }),
  },
  async run({ auth, propsValue }) {
    const { kind, taskId } = propsValue;
    if (!TASK_KINDS.includes(kind)) {
      throw new Error(`Task Kind must be one of: ${TASK_KINDS.join(', ')}.`);
    }
    return await cometApiClient.request({
      auth,
      method: HttpMethod.GET,
      host: 'root',
      path: `/kling/v1/${kind}/${encodeURIComponent(taskId)}`,
    });
  },
});
