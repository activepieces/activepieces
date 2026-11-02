import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { asanaAuth } from '../../auth';
import { asanaClient, asanaUtils } from '../../common/client';
import { asanaDeleteCommentOutputSchema } from '../../output-schemas';

export const asanaDeleteCommentAction = createAction({
  auth: asanaAuth,
  name: 'delete_comment',
  classification: 'DESTRUCTIVE',
  displayName: 'Delete Comment',
  description: 'Delete a comment from an Asana task.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Permanently deletes a comment story. Asana only lets users delete stories they created. Irreversible; repeating the call on the same comment fails.',
    idempotent: false,
  },
  outputSchema: asanaDeleteCommentOutputSchema,
  props: {
    story: Property.ShortText({
      displayName: 'Comment (Story) GID',
      description: 'Gid of the comment story. Obtain it from List Task Stories or Add Task Comment.',
      required: true,
    }),
  },
  async run(context) {
    const story = context.propsValue.story.trim();
    await asanaClient.asanaEmpty({
      auth: context.auth,
      method: HttpMethod.DELETE,
      path: `/stories/${asanaUtils.pathSegment(story)}`,
      operation: 'Delete Comment',
    });
    return { success: true, story_gid: story };
  },
});
