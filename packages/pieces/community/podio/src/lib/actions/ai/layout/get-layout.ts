import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { podioAuth } from '../../../auth';
import { podioAiProps } from '../../../common/ai-props';
import { podioClient } from '../../../common/client';
import { podioGetLayoutOutputSchema } from '../../../output-schemas';

export const getLayoutAction = createAction({
  auth: podioAuth,
  name: 'podio_get_layout',
  outputSchema: podioGetLayoutOutputSchema,
  displayName: 'Get Layout',
  description: 'Gets the badge or relationship layout an app currently uses.',
  audience: 'ai',
  classification: 'READ',
  aiMetadata: {
    description:
      'Reads the badge or relationship layout a Podio app currently uses: which field, rating or virtual value fills the header, content, details and footer slots, and whether it is the default. Read it before Update Layout. The app id comes from List Apps or Get App.',
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
    return await podioClient.request<unknown>({ auth, method: HttpMethod.GET, path: `/layout/${propsValue.appId}/${propsValue.layoutType}` });
  },
});
