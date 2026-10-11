import { createAction, Property } from '@activepieces/pieces-framework';
import { gitlabAuth } from '../../auth';
import { filePathSegment, gitlabToken, projectPath } from '../../common/client';
import {
  readGitlabRawPrefix,
  sendGitlabRequest,
} from '../../common/secret-request';
import { gitlabProps, requireText } from '../../common/props';
import { fileOutputSchema } from '../../output-schemas';

export const MAX_FILE_TEXT_BYTES = 1_000_000;

const UTF8_MAX_CHAR_BYTES = 4;

export function decodeFilePrefix({
  bytes,
  complete,
}: {
  bytes: Buffer;
  complete: boolean;
}): {
  content: string | null;
  isBinary: boolean;
  truncated: boolean;
} {
  if (bytes.subarray(0, 8000).includes(0)) {
    return { content: null, isBinary: true, truncated: false };
  }
  const truncated = !complete || bytes.length > MAX_FILE_TEXT_BYTES;
  let cut = Math.min(bytes.length, MAX_FILE_TEXT_BYTES);
  if (truncated) {
    const floor = Math.max(0, cut - (UTF8_MAX_CHAR_BYTES - 1));
    while (cut > floor && (bytes[cut] & 0xc0) === 0x80) {
      cut--;
    }
  }
  try {
    const content = new TextDecoder('utf-8', { fatal: true }).decode(
      bytes.subarray(0, cut)
    );
    return { content, isBinary: false, truncated };
  } catch {
    return { content: null, isBinary: true, truncated: false };
  }
}

function headerText(headers: Headers, name: string): string | null {
  return headers.get(`x-gitlab-${name}`);
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
    const filePath = `${projectPath(
      propsValue.projectId
    )}/repository/files/${filePathSegment(propsValue.filePath)}`;
    const query = {
      ref: requireText({
        value: propsValue.ref,
        label: 'Branch, Tag or Commit',
      }),
    };
    const token = gitlabToken(auth);
    const meta = await sendGitlabRequest<undefined>({
      token,
      method: 'HEAD',
      path: filePath,
      query,
    });
    const raw = await readGitlabRawPrefix({
      request: { token, method: 'GET', path: `${filePath}/raw`, query },
      maxBytes: MAX_FILE_TEXT_BYTES + UTF8_MAX_CHAR_BYTES,
    });
    const headers = meta.headers;
    const sizeHeader = headerText(headers, 'size');
    const size = sizeHeader === null ? NaN : Number(sizeHeader);
    return {
      file_name: headerText(headers, 'file-name'),
      file_path: headerText(headers, 'file-path'),
      size: Number.isFinite(size) ? size : raw.bytes.length,
      ref: headerText(headers, 'ref'),
      blob_id: headerText(headers, 'blob-id'),
      commit_id: headerText(headers, 'commit-id'),
      last_commit_id: headerText(headers, 'last-commit-id'),
      content_sha256: headerText(headers, 'content-sha256'),
      ...decodeFilePrefix(raw),
    };
  },
});
