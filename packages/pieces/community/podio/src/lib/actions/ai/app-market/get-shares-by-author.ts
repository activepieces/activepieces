import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { podioAuth } from '../../../auth';
import { podioAiProps } from '../../../common/ai-props';
import { podioClient } from '../../../common/client';
import { podioUtils } from '../../../common/utils';
import { podioGetOwnSharesOutputSchema } from '../../../output-schemas';

export const getSharesByAuthorAction = createAction({
  auth: podioAuth,
  name: 'podio_get_shares_by_author',
  outputSchema: podioGetOwnSharesOutputSchema,
  displayName: 'Get Shares By Author',
  description: 'Lists the app market shares created by a user.',
  audience: 'ai',
  classification: 'SEARCH',
  aiMetadata: {
    description:
      'Lists the Podio app market shares a user published, one page at a time with the total. The user id comes from the author of Get Share or from Get User.',
    idempotent: true,
  },
  props: {
    type: podioAiProps.choice({ required: true, displayName: 'Share Type', description: 'The kind of share: "app" or "pack".', values: ['app', 'pack'] }),
    userId: podioAiProps.id({ required: true, displayName: 'User ID', description: 'The id of the author, from Get Share or Get User.' }),
    limit: podioAiProps.limit({ required: false, description: 'Maximum number of shares to return. Defaults to 6.' }),
    offset: podioAiProps.offset({ required: false }),
    sort: podioAiProps.choice({
      required: false,
      displayName: 'Sort',
      description: 'How to sort the shares. Defaults to "install".',
      values: ['install', 'rating', 'popularity', 'recommended', 'shared_on', 'name'],
    }),
  },
  async run({ auth, propsValue }) {
    return await podioClient.request<unknown>({
      auth,
      method: HttpMethod.GET,
      path: `/app_store/${propsValue.type}/author/${propsValue.userId}/`,
      query: podioUtils.query({ values: { limit: propsValue.limit, offset: propsValue.offset, sort: propsValue.sort } }),
    });
  },
});
