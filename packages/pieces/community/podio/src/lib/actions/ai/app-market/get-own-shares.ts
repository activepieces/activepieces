import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { podioAuth } from '../../../auth';
import { podioAiProps } from '../../../common/ai-props';
import { podioClient } from '../../../common/client';
import { podioUtils } from '../../../common/utils';
import { podioGetOwnSharesOutputSchema } from '../../../output-schemas';

export const getOwnSharesAction = createAction({
  auth: podioAuth,
  name: 'podio_get_own_shares',
  outputSchema: podioGetOwnSharesOutputSchema,
  displayName: 'Get Own Shares',
  description: 'Lists the apps and packs the user has shared in the app market.',
  audience: 'ai',
  classification: 'SEARCH',
  aiMetadata: {
    description:
      'Lists the app market shares the user has published, one page at a time with the total, including their review status and the share ids Update Share and Unshare App take.',
    idempotent: true,
  },
  props: {
    type: podioAiProps.choice({ required: true, displayName: 'Share Type', description: 'The kind of share: "app" or "pack".', values: ['app', 'pack'] }),
    limit: podioAiProps.limit({ required: false, description: 'Maximum number of shares to return. Defaults to 6.' }),
    offset: podioAiProps.offset({ required: false }),
  },
  async run({ auth, propsValue }) {
    return await podioClient.request<unknown>({
      auth,
      method: HttpMethod.GET,
      path: `/app_store/${propsValue.type}/own/`,
      query: podioUtils.query({ values: { limit: propsValue.limit, offset: propsValue.offset } }),
    });
  },
});
