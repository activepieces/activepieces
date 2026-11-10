import { createAction } from '@activepieces/pieces-framework';
import { gitlabAuth } from '../../auth';
import { gitlabRequest, projectPath } from '../../common/client';
import { gitlabProps, requirePositiveInt } from '../../common/props';
import { noteOutputSchema } from '../../output-schemas';

export const getIssueNoteAction = createAction({
  auth: gitlabAuth,
  name: 'get_issue_note',
  displayName: 'Get Issue Comment',
  description: 'Gets one comment (note) of an issue.',
  audience: 'ai',
  classification: 'READ',
  aiMetadata: {
    description:
      'Returns one comment on a GitLab issue by note ID, including author, body, timestamps and whether it is a system note. Use List Issue Comments to find the note ID.',
    idempotent: true,
  },
  props: {
    projectId: gitlabProps.projectId(),
    issueIid: gitlabProps.issueIid(),
    noteId: gitlabProps.noteId(),
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
      method: 'GET',
      path: `${projectPath(
        propsValue.projectId
      )}/issues/${iid}/notes/${noteId}`,
    });
  },
});
