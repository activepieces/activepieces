import { createAction, Property } from '@activepieces/pieces-framework';
import { gitlabAuth } from '../../auth';
import {
  filePathSegment,
  gitlabRequest,
  projectPath,
} from '../../common/client';
import { gitlabProps, optionalText, requireText } from '../../common/props';
import { fileCommitOutputSchema } from '../../output-schemas';

export const createFileAction = createAction({
  auth: gitlabAuth,
  name: 'create_file',
  displayName: 'Create File',
  description: 'Creates a new file in the repository with a commit.',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description:
      'Creates a new file on a branch of a GitLab repository as one commit. GitLab answers 400 if the file already exists, so a second call fails; use Update File to change it. Use Create Commit for several files at once.',
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
      method: 'POST',
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
        author_name: optionalText(propsValue.authorName),
        author_email: optionalText(propsValue.authorEmail),
      },
    });
  },
});
