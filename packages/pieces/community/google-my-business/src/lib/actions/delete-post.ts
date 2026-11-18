import { HttpMethod, httpClient, propsValidation } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import * as z from 'zod/mini';
import { googleAuth } from '../..';
import { localPostUtils } from '../common/local-post';

export const deletePost = createAction({
  name: 'delete-post',
  classification: 'WRITE',
  displayName: 'Delete Post',
  description: 'Delete a post from its location.',
  audience: 'both',
  aiMetadata: {
    description:
      'Permanently deletes one local post from a Google Business Profile location, identified by its full resource name. The post stops appearing on the listing and cannot be restored. Idempotent in effect: deleting an already deleted post leaves nothing further to remove, though Google answers with an error.',
    idempotent: true,
  },
  auth: googleAuth,
  props: {
    postName: Property.ShortText({
      displayName: 'Post ID',
      description: 'Paste the whole name field from Create Post or List Posts.',
      placeholder: 'accounts/123/locations/456/localPosts/789',
      required: true,
    }),
  },
  async run(ctx) {
    const { postName } = ctx.propsValue;

    await propsValidation.validateZod(ctx.propsValue, {
      postName: z.string().check(z.regex(localPostUtils.postNamePattern)),
    });

    await httpClient.sendRequest({
      url: `${localPostUtils.baseUrl}/${postName}`,
      method: HttpMethod.DELETE,
      headers: {
        Authorization: `Bearer ${ctx.auth.access_token}`,
      },
    });

    return { success: true };
  },
});
