import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod, httpClient } from '@activepieces/pieces-common';
import { videogenAuth } from '../auth';

export const startStoryboard = createAction({
  auth: videogenAuth,
  name: 'start_storyboard_video',
  displayName: 'Start Storyboard Video',
  description: 'Generate a portrait video from scene prompts, with high quality and automatic MP4 export. Uses VideoGen credits.',
  audience: 'both',
  classification: 'WRITE',
  aiMetadata: {description: 'Starts a paid VideoGen storyboard workflow once. Requires explicit credit approval. Returns workflowRunId; use Get Video Status to retrieve downloadUrl when completed. Do not repeat creation to resume polling.', idempotent: false},
  props: {
    scenes: Property.Array({displayName: 'Scene Prompts', description: 'Add one description per scene, in playback order.', required: true}),
    approve: Property.Checkbox({displayName: 'Approve Credit Spending', description: 'Starting a video spends credits on the connected VideoGen account.', required: true, defaultValue: false}),
  },
  async run({auth, propsValue}) {
    if (!propsValue.approve) {
      throw {code: 'CREDIT_APPROVAL_REQUIRED', message: 'Approve credit spending to start a video.'};
    }
    const scenes = propsValue.scenes.map((prompt) => {
      if (typeof prompt !== 'string' || prompt.trim().length === 0) {
        throw {code: 'INVALID_SCENE', message: 'Each scene must be a non-empty description.'};
      }
      return {prompt};
    });
    if (scenes.length === 0) {
      throw {code: 'MISSING_SCENES', message: 'Add at least one scene.'};
    }
    const response = await httpClient.sendRequest({
      method: HttpMethod.POST,
      retries: 0,
      url: 'https://api.videogen.io/v1/workflows/storyboard-to-video',
      headers: {Authorization: `Bearer ${auth.secret_text}`},
      body: {scenes, aspectRatio: {width: 9, height: 16}, quality: 'HIGH', autoExport: true, remixActions: [{type: 'ENABLE_CAPTIONS'}, {type: 'CONVERT_IMAGES_TO_VIDEOS'}]},
    });
    return response.body;
  },
});
