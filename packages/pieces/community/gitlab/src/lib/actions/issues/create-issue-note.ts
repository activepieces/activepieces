import { createAction, Property } from '@activepieces/pieces-framework';
import { gitlabAuth } from '../../auth';
import { gitlabRequest, projectPath } from '../../common/client';
import {
  gitlabProps,
  requirePositiveInt,
  requireText,
  triStateValue,
} from '../../common/props';
import { noteOutputSchema } from '../../output-schemas';

export const createIssueNoteAction = createAction({
  auth: gitlabAuth,
  name: 'create_issue_note',
  displayName: 'Add Issue Comment',
  description: 'Adds a comment (note) to an issue.',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description:
      'Posts a Markdown comment on a GitLab issue. Quick actions such as /label or /close in the body are executed by GitLab. Not idempotent: each call posts a new comment.',
    idempotent: false,
  },
  props: {
    projectId: gitlabProps.projectId(),
    issueIid: gitlabProps.issueIid(),
    body: Property.LongText({ displayName: 'Comment', required: true }),
    internal: gitlabProps.triState(
      'Internal',
      'Internal notes are visible only to project members with at least Reporter role.'
    ),
  },
  outputSchema: noteOutputSchema,
  async run({ auth, propsValue }) {
    const iid = requirePositiveInt({
      value: propsValue.issueIid,
      label: 'Issue IID',
    });
    return gitlabRequest({
      auth,
      method: 'POST',
      path: `${projectPath(propsValue.projectId)}/issues/${iid}/notes`,
      body: {
        body: requireText({ value: propsValue.body, label: 'Comment' }),
        internal: triStateValue(propsValue.internal),
      },
    });
  },
});
