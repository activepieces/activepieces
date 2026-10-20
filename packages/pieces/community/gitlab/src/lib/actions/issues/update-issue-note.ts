import { createAction, Property } from '@activepieces/pieces-framework';
import { gitlabAuth } from '../../auth';
import { gitlabRequest, projectPath } from '../../common/client';
import {
  gitlabProps,
  requirePositiveInt,
  requireText,
} from '../../common/props';
import { noteOutputSchema } from '../../output-schemas';

export const updateIssueNoteAction = createAction({
  auth: gitlabAuth,
  name: 'update_issue_note',
  displayName: 'Update Issue Comment',
  description: 'Replaces the text of an issue comment.',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description:
      'Replaces the body of an existing comment on a GitLab issue. Only the author (or an admin) can edit a note. Re-sending the same text leaves the note unchanged.',
    idempotent: true,
  },
  props: {
    projectId: gitlabProps.projectId(),
    issueIid: gitlabProps.issueIid(),
    noteId: gitlabProps.noteId(),
    body: Property.LongText({ displayName: 'Comment', required: true }),
  },
  outputSchema: noteOutputSchema,
  async run({ auth, propsValue }) {
    const iid = requirePositiveInt({
      value: propsValue.issueIid,
      label: 'Issue IID',
    });
    const noteId = requirePositiveInt({
      value: propsValue.noteId,
      label: 'Note ID',
    });
    return gitlabRequest({
      auth,
      method: 'PUT',
      path: `${projectPath(
        propsValue.projectId
      )}/issues/${iid}/notes/${noteId}`,
      body: { body: requireText({ value: propsValue.body, label: 'Comment' }) },
    });
  },
});
