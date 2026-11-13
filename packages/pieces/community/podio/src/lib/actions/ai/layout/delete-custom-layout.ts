import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { podioAuth } from '../../../auth';
import { podioAiProps } from '../../../common/ai-props';
import { podioClient } from '../../../common/client';
import { podioDeleteCustomLayoutOutputSchema } from '../../../output-schemas';

export const deleteCustomLayoutAction = createAction({
  auth: podioAuth,
  name: 'podio_delete_custom_layout',
  outputSchema: podioDeleteCustomLayoutOutputSchema,
  displayName: 'Delete Custom Layout',
  description: 'Removes the custom badge or relationship layout of an app, restoring the default.',
  audience: 'ai',
  classification: 'DESTRUCTIVE',
  aiMetadata: {
    description:
      'Deletes the custom badge or relationship layout of a Podio app and returns the regenerated default layout; the custom one cannot be recovered. The app id comes from List Apps or Get App.',
    idempotent: false,
  },
  props: {
    appId: podioAiProps.id({ required: true, displayName: 'App ID', description: 'The id of the app.' }),
    layoutType: podioAiProps.choice({
      required: true,
      displayName: 'Layout Type',
      description: '"badge" for the item card layout, "relationship" for how items look when referenced from other apps.',
      values: ['badge', 'relationship'],
    }),
  },
  async run({ auth, propsValue }) {
    return await podioClient.request<unknown>({ auth, method: HttpMethod.DELETE, path: `/layout/${propsValue.appId}/${propsValue.layoutType}` });
  },
});
