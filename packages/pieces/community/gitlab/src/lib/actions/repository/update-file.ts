import { createAction, Property } from '@activepieces/pieces-framework';
import { gitlabAuth } from '../../auth';
import {
  filePathSegment,
  gitlabRequest,
  projectPath,
} from '../../common/client';
import { gitlabProps, optionalText, requireText } from '../../common/props';
import { fileCommitOutputSchema } from '../../output-schemas';

export const updateFileAction = createAction({
  auth: gitlabAuth,
  name: 'update_file',
  displayName: 'Update File',
  description: 'Replaces the content of an existing file with a commit.',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description:
      "Replaces the whole content of an existing file on a branch of a GitLab repository as one commit. Pass Last Commit ID (from Get File) to fail instead of overwriting someone else's newer change. Not idempotent: each call makes a new commit.",
    idempotent: false,
  },
  props: {
    projectId: gitlabProps.projectId(),
    filePath: Property.ShortText({
      displayName: 'File Path',
      description: 'Path from the repository root, e.g. docs/readme.md.',
      required: true,
    }),
    branch: gitlabProps.branch(
      'Branch',
      'Branch to commit to. It must exist unless Start Branch is set.'
    ),
    content: Property.LongText({ displayName: 'Content', required: true }),
    commitMessage: Property.ShortText({
      displayName: 'Commit Message',
      required: true,
    }),
    encoding: Property.StaticDropdown({
      displayName: 'Content Encoding',
      required: false,
      defaultValue: 'text',
      options: {
        options: [
          { label: 'Text', value: 'text' },
          { label: 'Base64', value: 'base64' },
        ],
      },
    }),
    startBranch: Property.ShortText({
      displayName: 'Start Branch',
      description: 'Create Branch from this branch first.',
      required: false,
    }),
    lastCommitId: Property.ShortText({
      displayName: 'Last Commit ID',
      description:
        'last_commit_id from Get File. The update fails if the file changed since.',
      required: false,
    }),
    authorName: Property.ShortText({
      displayName: 'Author Name',
      required: false,
    }),
    authorEmail: Property.ShortText({
      displayName: 'Author Email',
      required: false,
    }),
  },
  outputSchema: fileCommitOutputSchema,
  async run({ auth, propsValue }) {
    if (typeof propsValue.content !== 'string') {
      throw new Error('Content is required.');
    }
    return gitlabRequest({
      auth,
      method: 'PUT',
      path: `${projectPath(
        propsValue.projectId
      )}/repository/files/${filePathSegment(propsValue.filePath)}`,
      body: {
        branch: requireText({ value: propsValue.branch, label: 'Branch' }),
        content: propsValue.content,
        commit_message: requireText({
          value: propsValue.commitMessage,
          label: 'Commit Message',
        }),
        encoding: propsValue.encoding ?? 'text',
        start_branch: optionalText(propsValue.startBranch),
        last_commit_id: optionalText(propsValue.lastCommitId),
        author_name: optionalText(propsValue.authorName),
        author_email: optionalText(propsValue.authorEmail),
      },
    });
  },
});
