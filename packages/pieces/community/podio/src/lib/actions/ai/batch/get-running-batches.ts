import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { podioAuth } from '../../../auth';
import { podioAiProps } from '../../../common/ai-props';
import { podioClient } from '../../../common/client';
import { podioGetRunningBatchesOutputSchema } from '../../../output-schemas';

export const getRunningBatchesAction = createAction({
  auth: podioAuth,
  name: 'podio_get_running_batches',
  outputSchema: podioGetRunningBatchesOutputSchema,
  displayName: 'Get Running Batches',
  description: 'Lists the import or export batches still running on an app or workspace.',
  audience: 'ai',
  classification: 'SEARCH',
  aiMetadata: {
    description:
      'Lists the Podio batches of one kind still running on one app or workspace, for example an item import started by Import App Items. The app id comes from List Apps, the space id from List Org Spaces.',
    idempotent: true,
  },
  props: {
    refType: podioAiProps.choice({ required: true, displayName: 'Reference Type', description: '"app" or "space".', values: ['app', 'space'] }),
    refId: podioAiProps.id({ required: true, displayName: 'Reference ID', description: 'The id of the app or workspace, from List Apps or List Org Spaces.' }),
    plugin: podioAiProps.choice({
      required: true,
      displayName: 'Batch Kind',
      description: '"app_import", "app_export", "app_content" (on an app) or "space_contact_import" (on a workspace).',
      values: ['app_import', 'app_export', 'space_contact_import', 'app_content'],
    }),
  },
  async run({ auth, propsValue }) {
    const body = await podioClient.request<unknown[]>({
      auth,
      method: HttpMethod.GET,
      path: `/batch/${propsValue.refType}/${propsValue.refId}/${propsValue.plugin}/running/`,
    });
    return { batches: body, count: body.length };
  },
});
