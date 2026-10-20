import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { discourseAuth } from '../../auth';
import { DiscourseApiError, discourseRequest } from '../../common/client';
import { discourseInput } from '../../common/input';
import { discourseMap } from '../../common/mappers';
import { discourseSchemas } from '../../common/schemas';

export const deletePostAction = createAction({
  auth: discourseAuth,
  name: 'delete_post',
  classification: 'DESTRUCTIVE',
  displayName: 'Delete Post',
  description: 'Deletes a Discourse post.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Delete one Discourse post by numeric post ID. Deleting the first post of a topic deletes the topic. Only call when the user clearly asked to delete. A post that was already soft-deleted is reported with already_deleted true, so retries are safe; an unknown ID fails with a not found error.',
    idempotent: true,
  },
  props: {
    post_id: Property.ShortText({ displayName: 'Post ID', description: 'Numeric post ID.', required: true }),
  },
  outputSchema: discourseSchemas.deleted,
  async run({ auth, propsValue }) {
    const id = discourseInput.id({ value: propsValue.post_id, label: 'Post ID' });
    try {
      const current = discourseMap.rec(
        await discourseRequest({ auth: auth.props, method: HttpMethod.GET, path: `/posts/${id}.json` }),
      );
      if (current['deleted_at'] !== null && current['deleted_at'] !== undefined) {
        return { id: Number(id), deleted: true, already_deleted: true };
      }
      await discourseRequest({ auth: auth.props, method: HttpMethod.DELETE, path: `/posts/${id}.json` });
      return { id: Number(id), deleted: true, already_deleted: false };
    } catch (error) {
      if (error instanceof DiscourseApiError && error.status === 404) {
        throw new DiscourseApiError({
          message: `Discourse post ${id} was not found. Check the Post ID; nothing was deleted.`,
          status: 404,
          responseBody: error.responseBody,
        });
      }
      throw error;
    }
  },
});
