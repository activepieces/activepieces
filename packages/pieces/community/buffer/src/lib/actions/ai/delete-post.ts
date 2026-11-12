import { createAction, Property } from '@activepieces/pieces-framework';
import { bufferAuth } from '../../common/auth';
import { bufferClient } from '../../common/client';
import { bufferAiProps } from '../../common/ai-props';
import { bufferQueries } from '../../common/queries';
import { deletePostOutputSchema } from '../../common/output-schemas';

export const deletePost = createAction({
  auth: bufferAuth,
  name: 'delete_post',
  classification: 'DESTRUCTIVE',
  displayName: 'Delete a Post',
  description: 'Delete a Buffer post for good.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Deletes one Buffer post for good (Post ID from List Posts); it cannot be undone. Check first that the post\'s allowedActions includes deletePost. A second call for the same ID fails with Document not found.',
    idempotent: false,
  },
  props: {
    postId: Property.ShortText({
      displayName: 'Post ID',
      description: 'The post to delete, from List Posts.',
      required: true,
    }),
  },
  outputSchema: deletePostOutputSchema,
  async run(context) {
    const id = bufferAiProps.requiredId({ value: context.propsValue.postId, label: 'Post ID' });
    const data = await bufferClient.graphql<{ deletePost: { __typename?: string; id?: string; message?: string } }>({
      accessToken: context.auth.secret_text,
      query: bufferQueries.DELETE_POST,
      variables: { id },
      operation: `delete post ${id}`,
    });
    const result = data.deletePost;
    if (result.id === undefined) {
      throw new Error(`Buffer did not delete post ${id} (${result.__typename ?? 'unknown result'}): ${result.message ?? 'no reason given'}`);
    }
    return { id: result.id, deleted: true };
  },
});
