import { createAction, Property } from '@activepieces/pieces-framework';
import { gitlabAuth } from '../../auth';
import { encodeSegment, gitlabRequest, projectPath } from '../../common/client';
import { GitlabFile } from '../../common/models';
import { gitlabProps, requireText } from '../../common/props';
import { fileOutputSchema } from '../../output-schemas';

export const MAX_FILE_TEXT_BYTES = 1_000_000;

export function decodeFileContent(file: GitlabFile): {
  content: string | null;
  isBinary: boolean;
  truncated: boolean;
} {
  const bytes =
    file.encoding === 'base64'
      ? Buffer.from(file.content ?? '', 'base64')
      : Buffer.from(file.content ?? '', 'utf8');
  const sample = bytes.subarray(0, 8000);
  if (sample.includes(0)) {
    return { content: null, isBinary: true, truncated: false };
  }
  const truncated = bytes.length > MAX_FILE_TEXT_BYTES;
  const slice = truncated ? bytes.subarray(0, MAX_FILE_TEXT_BYTES) : bytes;
  try {
    const content = new TextDecoder('utf-8', { fatal: !truncated }).decode(
      slice
    );
    return { content, isBinary: false, truncated };
  } catch {
    return { content: null, isBinary: true, truncated: false };
  }
}

export const getFileAction = createAction({
  auth: gitlabAuth,
  name: 'get_file',
  displayName: 'Get File',
  description: 'Gets a file from the repository with its decoded text content.',
  audience: 'ai',
  classification: 'READ',
  aiMetadata: {
    description:
      'Reads one file from a GitLab repository at a branch, tag or commit and returns its text content plus metadata (size, blob ID, last commit ID). Text over 1 MB is cut (truncated is true); binary files return isBinary true and no content. Pass last_commit_id to Update File to guard against concurrent edits.',
    idempotent: true,
  },
  props: {
    projectId: gitlabProps.projectId(),
    filePath: Property.ShortText({
      displayName: 'File Path',
      description: 'Path from the repository root, e.g. src/index.ts.',
      required: true,
    }),
    ref: Property.ShortText({
      displayName: 'Branch, Tag or Commit',
      required: true,
    }),
  },
  outputSchema: fileOutputSchema,
  async run({ auth, propsValue }) {
    const file = await gitlabRequest<GitlabFile>({
      auth,
      method: 'GET',
      path: `${projectPath(
        propsValue.projectId
      )}/repository/files/${encodeSegment({
        value: propsValue.filePath,
        label: 'File Path',
      })}`,
      query: {
        ref: requireText({
          value: propsValue.ref,
          label: 'Branch, Tag or Commit',
        }),
      },
    });
    const decoded = decodeFileContent(file);
    return {
      file_name: file.file_name,
      file_path: file.file_path,
      size: file.size,
      ref: file.ref,
      blob_id: file.blob_id,
      commit_id: file.commit_id,
      last_commit_id: file.last_commit_id,
      content_sha256: file.content_sha256,
      ...decoded,
    };
  },
});
