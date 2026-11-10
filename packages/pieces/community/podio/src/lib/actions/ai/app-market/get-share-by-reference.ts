import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { podioAuth } from '../../../auth';
import { podioAiProps } from '../../../common/ai-props';
import { podioClient } from '../../../common/client';
import { podioGetShareByReferenceOutputSchema } from '../../../output-schemas';

export const getShareByReferenceAction = createAction({
  auth: podioAuth,
  name: 'podio_get_share_by_reference',
  outputSchema: podioGetShareByReferenceOutputSchema,
  displayName: 'Get Share By Reference',
  description: 'Lists the app market shares of an app or space.',
  audience: 'ai',
  classification: 'SEARCH',
  aiMetadata: {
    description:
      'Lists the Podio app market shares made from one app or space, the user\'s own first, then newest first. The app id comes from List Apps, the space id from Get Space.',
    idempotent: true,
  },
  props: {
    refType: podioAiProps.choice({ required: true, displayName: 'Reference Type', description: 'What was shared: "app" or "space".', values: ['app', 'space'] }),
    refId: podioAiProps.id({ required: true, displayName: 'Reference ID', description: 'The id of the app or space, from List Apps or Get Space.' }),
  },
  async run({ auth, propsValue }) {
    const body = await podioClient.request<unknown[]>({ auth, method: HttpMethod.GET, path: `/app_store/${propsValue.refType}/${propsValue.refId}/` });
    return { shares: body, count: body.length };
  },
});
