import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { podioAuth } from '../../../auth';
import { podioAiProps } from '../../../common/ai-props';
import { podioClient } from '../../../common/client';
import { podioDeleteCustomLayoutOutputSchema } from '../../../output-schemas';

export const getDefaultLayoutAction = createAction({
  auth: podioAuth,
  name: 'podio_get_default_layout',
  outputSchema: podioDeleteCustomLayoutOutputSchema,
  displayName: 'Get Default Layout',
  description: 'Gets the default badge or relationship layout Podio generates for an app.',
  audience: 'ai',
  classification: 'READ',
  aiMetadata: {
    description:
      'Reads the default badge or relationship layout Podio generates for an app, ignoring any customization; Get Layout returns the layout in use. The app id comes from List Apps or Get App.',
    idempotent: true,
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
    return await podioClient.request<unknown>({ auth, method: HttpMethod.GET, path: `/layout/${propsValue.appId}/${propsValue.layoutType}/default` });
  },
});
