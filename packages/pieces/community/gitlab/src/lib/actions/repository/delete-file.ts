import { createAction, Property } from '@activepieces/pieces-framework';
import { gitlabAuth } from '../../auth';
import {
  filePathSegment,
  gitlabRequest,
  projectPath,
} from '../../common/client';
import { gitlabProps, optionalText, requireText } from '../../common/props';
import { deletedFileOutputSchema } from '../../output-schemas';

export const deleteFileAction = createAction({
  auth: gitlabAuth,
  name: 'delete_file',
  displayName: 'Delete File',
  description: 'Deletes a file from a branch with a commit.',
  audience: 'ai',
  classification: 'DESTRUCTIVE',
  aiMetadata: {
    description:
      'Deletes one file from a branch of a GitLab repository as a new commit. The file stays in history but is gone from the branch. A second call fails because the file no longer exists.',
    idempotent: false,
  },
  props: {
    projectId: gitlabProps.projectId(),
    filePath: Property.ShortText({ displayName: 'File Path', required: true }),
    branch: gitlabProps.branch(),
    commitMessage: Property.ShortText({
      displayName: 'Commit Message',
      required: true,
    }),
    lastCommitId: Property.ShortText({
      displayName: 'Last Commit ID',
      description:
        'last_commit_id from Get File. The delete fails if the file changed since.',
      required: false,
    }),
  },
  outputSchema: deletedFileOutputSchema,
  async run({ auth, propsValue }) {
    const filePath = propsValue.filePath;
    const branch = requireText({ value: propsValue.branch, label: 'Branch' });
    await gitlabRequest({
      auth,
      method: 'DELETE',
      path: `${projectPath(
        propsValue.projectId
      )}/repository/files/${filePathSegment(filePath)}`,
      body: {
        branch,
        commit_message: requireText({
          value: propsValue.commitMessage,
          label: 'Commit Message',
        }),
        last_commit_id: optionalText(propsValue.lastCommitId),
      },
    });
    return { deleted: true, file_path: filePath, branch };
  },
});
