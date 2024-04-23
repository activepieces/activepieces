import { createAction, Property } from '@activepieces/pieces-framework';
import { linearAuth } from '../../..';
import { props } from '../../common/props';
import { makeClient } from '../../common/client';
import { LinearDocument } from '@linear/sdk';

export const linearCreateComment = createAction({
  auth: linearAuth,
  name: 'linear_create_comment',
  displayName: 'Create Comment',
  description: 'Create a new comment on an issue in Linear workspace',
  props: {
    team_id: props.team_id(),
    user_id: props.assignee_id(),
    issue_id: props.issue_id(),
    body: Property.LongText({
      displayName: 'Comment Body',
      description: 'The content of the comment',
      required: true,
    }),
  },
  async run({ auth, propsValue }) {
    const comment: LinearDocument.CommentCreateInput = {
      issueId: propsValue.issue_id!,
      body: propsValue.body,
    };

    const client = makeClient(auth as string);
    const result = await client.createComment(comment);
    if (result.success) {
      const createdComment = await result.comment;
      return {
        success: result.success,
        lastSyncId: result.lastSyncId,
        comment: createdComment,
      };
    } else {
      throw new Error(`Unexpected error: ${result}`)
    }
  },
});
