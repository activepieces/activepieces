import { createAction } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { antworkAuth } from '../auth';
import { antworkApiCall, antworkCommon } from '../common';

export const getPost = createAction({
  auth: antworkAuth,
  name: 'get_post',
  classification: 'READ',
  displayName: 'Get Post',
  description: 'Get an Antwork post by its ID, with its status and published URL.',
  audience: 'both',
  aiMetadata: {
    description:
      'Fetches one Antwork post by id: its text, account, platform, status (draft, scheduled, published, failed), scheduled and published times, published URL and any error. Use to check whether a scheduled or published post went out. Read-only and idempotent.',
    idempotent: true,
  },
  props: {
    postId: antworkCommon.post(),
  },
  async run(context) {
    const postId = context.propsValue.postId.trim();
    const response = await antworkApiCall<Record<string, unknown>>({
      apiKey: context.auth.secret_text,
      method: HttpMethod.GET,
      path: `/posts/${encodeURIComponent(postId)}`,
    });
    return response.body;
  },
});
