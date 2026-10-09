import { createAction, Property } from '@activepieces/pieces-framework';
import { linearAuth } from '../../..';
import { props } from '../../common/props';
import { makeClient } from '../../common/client';
import { LinearDocument } from '@linear/sdk';
import { commentMutationOutputSchema } from '../../output-schemas';

export const linearCreateComment = createAction({
  auth: linearAuth,
  name: 'linear_create_comment',
  classification: 'WRITE',
  displayName: 'Create Comment',
  description: 'Post a comment on an issue.',
  audience: 'human',
  aiMetadata: {
    description: 'Posts a new comment on a Linear issue identified by its issue ID. Use to add a note, reply, or status update to an existing issue. Requires the issue ID and comment body; not idempotent, each call appends a new comment.',
    idempotent: false,
  },
  props: {
    team_id: props.team_id(true, "The issue's team, used to list its issues."),
    user_id: {
      ...props.assignee_id(),
      description: "Not used. Comments are always posted as the API key's owner.",
      advanced: true,
    },
    issue_id: props.issue_id(),
    body: Property.LongText({
      displayName: 'Comment',
      description: 'Markdown is supported.',
      required: true,
    }),
  },
  outputSchema: commentMutationOutputSchema,
  async run({ auth, propsValue }) {
    const comment: LinearDocument.CommentCreateInput = {
      issueId: propsValue.issue_id!,
      body: propsValue.body,
    };

    const client = makeClient(auth);
    const result = await client.createComment(comment);
    if (result.success) {
      const createdComment = await result.comment;
      return {
        success: result.success,
        lastSyncId: result.lastSyncId,
        comment: createdComment,
      };
    } else {
      throw new Error('Linear did not create the comment.')
    }
  },
});
