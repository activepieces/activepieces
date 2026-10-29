import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod, httpClient } from '@activepieces/pieces-common';
import { videogenAuth } from '../auth';

export const getStatus = createAction({
  auth: videogenAuth,
  name: 'get_video_status',
  displayName: 'Get Video Status',
  description: 'Get an existing video workflow status and its MP4 download URL when ready.',
  audience: 'both',
  classification: 'READ',
  aiMetadata: {description: 'Reads an existing VideoGen workflow run without creating or charging for a new generation. When succeeded, downloadUrl is the exported MP4. Can be repeated to poll progress.', idempotent: true},
  props: {
    workflowRunId: Property.ShortText({displayName: 'Video Workflow', description: 'Map workflowRunId from a previous Start Storyboard Video step. Reuse that value when polling.', required: true}),
  },
  async run({auth, propsValue}) {
    const response = await httpClient.sendRequest({method: HttpMethod.GET, url: `https://api.videogen.io/v1/workflows/runs/${encodeURIComponent(propsValue.workflowRunId)}`, headers: {Authorization: `Bearer ${auth.secret_text}`}});
    return response.body;
  },
});
