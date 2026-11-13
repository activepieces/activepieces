import { createAction } from '@activepieces/pieces-framework';
import { gitlabAuth } from '../../auth';
import { gitlabRequest, projectPath } from '../../common/client';
import { gitlabProps, requirePositiveInt } from '../../common/props';
import { deletedNoteOutputSchema } from '../../output-schemas';

export const deleteIssueNoteAction = createAction({
  auth: gitlabAuth,
  name: 'delete_issue_note',
  displayName: 'Delete Issue Comment',
  description: 'Permanently deletes a comment from an issue.',
  audience: 'ai',
  classification: 'DESTRUCTIVE',
  aiMetadata: {
    description:
      'Permanently deletes one comment from a GitLab issue; it cannot be restored. A second call for the same note fails with not found.',
    idempotent: false,
  },
  props: {
    projectId: gitlabProps.projectId(),
    issueIid: gitlabProps.issueIid(),
    noteId: gitlabProps.noteId(),
  },
  outputSchema: deletedNoteOutputSchema,
  async run({ auth, propsValue }) {
    const iid = requirePositiveInt({
      value: propsValue.issueIid,
      label: 'Issue IID',
    });
    const noteId = requirePositiveInt({
      value: propsValue.noteId,
      label: 'Note ID',
    });
    await gitlabRequest({
      auth,
      method: 'DELETE',
      path: `${projectPath(
        propsValue.projectId
      )}/issues/${iid}/notes/${noteId}`,
    });
    return { deleted: true, noteId, issueIid: iid };
  },
});
