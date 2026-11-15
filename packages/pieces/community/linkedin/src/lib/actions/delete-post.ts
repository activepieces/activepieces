import { Property, createAction } from '@activepieces/pieces-framework';
import {
  AuthenticationType,
  HttpMethod,
  httpClient,
} from '@activepieces/pieces-common';
import {
  buildLinkedinError,
  encodeUrn,
  getLinkedinErrorStatus,
  linkedinCommon,
} from '../common';
import { linkedinAuth } from '../..';
import { deletePostActionOutputSchema } from '../output-schemas';

export const deletePost = createAction({
  auth: linkedinAuth,
  name: 'delete_post',
  classification: 'DESTRUCTIVE',
  displayName: 'Delete Post',
  description: 'Permanently delete a LinkedIn post by its URN',
  audience: 'ai',
  aiMetadata: {
    description:
      'Permanently deletes a LinkedIn post, together with its comments, reactions and statistics. This cannot be undone and the post cannot be recovered, so confirm the URN is the intended post before calling; to fix wording instead, use Update Post Commentary. Safe to retry: deleting an already deleted post reports success without changing anything.',
    idempotent: true,
  },
  props: {
    post_urn: Property.ShortText({
      displayName: 'Post URN',
      description:
        'URN of the post to delete, for example urn:li:share:7212345678901234567.',
      required: true,
    }),
  },
  outputSchema: deletePostActionOutputSchema,

  run: async (context) => {
    const postUrn = context.propsValue.post_urn;
    try {
      await httpClient.sendRequest({
        method: HttpMethod.DELETE,
        url: `${linkedinCommon.baseUrl}/rest/posts/${encodeUrn(postUrn)}`,
        authentication: {
          type: AuthenticationType.BEARER_TOKEN,
          token: context.auth.access_token,
        },
        headers: {
          ...linkedinCommon.linkedinHeaders,
          'X-RestLi-Method': 'DELETE',
        },
      });

      return {
        deleted: true,
        post_urn: postUrn,
        already_deleted: false,
      };
    } catch (error) {
      if (getLinkedinErrorStatus(error) === 404) {
        return {
          deleted: true,
          post_urn: postUrn,
          already_deleted: true,
        };
      }
      throw buildLinkedinError({ error, resource: `the post ${postUrn}` });
    }
  },
});
