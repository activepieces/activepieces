import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { huggingFaceAuth } from '../auth';
import { hfHub } from '../common/hub-client';
import { hfWrite } from '../common/hub-write';
import { hfProps } from '../common/props';
import { hfRepo } from '../common/repo';
import { hfUtils } from '../common/utils';
import { commitFilesOutputSchema } from '../output-schemas';

function normalizeRepoPath({ value, label }: { value: unknown; label: string }): string {
  if (typeof value !== 'string') {
    throw new Error(`${label} must be a text file path, for example 'README.md' or 'src/app.py'.`);
  }
  const path = value.trim().replace(/^\/+/, '');
  const segments = path.split('/');
  if (path.length === 0 || segments.some((segment) => segment.length === 0 || segment === '.' || segment === '..')) {
    throw new Error(
      `${label} '${value}' is not a valid repository path. Use a relative path like 'README.md' or 'data/train.csv', without '..' or empty segments.`
    );
  }
  if (path.length > MAX_PATH_LENGTH) {
    throw new Error(`${label} '${path.slice(0, 80)}...' is longer than ${MAX_PATH_LENGTH} characters.`);
  }
  return path;
}

function lfsRequiredError({ path, reason }: { path: string; reason: string }): Error {
  return new Error(
    `LFS_UPLOAD_REQUIRED: '${path}' ${reason}. Large or binary files need the Hub's LFS upload flow, which is not supported; Commit Files only accepts inline text files up to ${MAX_TOTAL_BYTES} bytes in total.`
  );
}

function isBinary(buffer: Buffer): boolean {
  if (buffer.subarray(0, 8000).includes(0)) {
    return true;
  }
  try {
    new TextDecoder('utf-8', { fatal: true }).decode(buffer);
    return false;
  } catch {
    return true;
  }
}

function decodeBase64({ path, content }: { path: string; content: string }): Buffer {
  const compact = content.replace(/\s+/g, '');
  if (compact.length % 4 !== 0 || !/^[A-Za-z0-9+/]*={0,2}$/.test(compact)) {
    throw new Error(`The content of '${path}' is not valid base64. Use encoding 'utf-8' for plain text.`);
  }
  return Buffer.from(compact, 'base64');
}

function parseFiles(value: unknown[] | undefined): PreparedFiles {
  const files: CommitFile[] = [];
  let totalBytes = 0;
  for (const [index, item] of (value ?? []).entries()) {
    if (!hfHub.isRecord(item)) {
      throw new Error(`File #${index + 1} must be an object with 'path', 'content' and optional 'encoding'.`);
    }
    const path = normalizeRepoPath({ value: item['path'], label: `File #${index + 1} path` });
    const content = item['content'];
    if (typeof content !== 'string') {
      throw new Error(`File '${path}' has no text content. Pass the file body as 'content'.`);
    }
    const rawEncoding = item['encoding'];
    const encoding = rawEncoding === undefined || rawEncoding === null || rawEncoding === '' ? 'utf-8' : rawEncoding;
    if (encoding !== 'utf-8' && encoding !== 'base64') {
      throw new Error(`File '${path}' has an unknown encoding '${String(rawEncoding)}'. Use 'utf-8' or 'base64'.`);
    }
    const bytes = encoding === 'base64' ? decodeBase64({ path, content }) : Buffer.from(content, 'utf-8');
    if (isBinary(bytes)) {
      throw lfsRequiredError({ path, reason: 'is a binary file' });
    }
    if (bytes.length > MAX_TOTAL_BYTES) {
      throw lfsRequiredError({ path, reason: `is ${bytes.length} bytes` });
    }
    totalBytes += bytes.length;
    files.push({ path, content, encoding });
  }
  if (totalBytes > MAX_TOTAL_BYTES) {
    throw lfsRequiredError({ path: files.map((file) => file.path).join("', '"), reason: `add up to ${totalBytes} bytes` });
  }
  return { files, totalBytes };
}

function assertUniquePaths({ filePaths, deletedPaths }: { filePaths: string[]; deletedPaths: string[] }): void {
  const seen = new Set<string>();
  for (const path of [...filePaths, ...deletedPaths]) {
    if (seen.has(path)) {
      throw new Error(`The path '${path}' appears more than once. Each path can be written or deleted only once per commit.`);
    }
    seen.add(path);
  }
}

function pullRequestNumber(url: string | null): number | null {
  const match = url?.match(/\/discussions\/(\d+)/);
  return match ? Number(match[1]) : null;
}

export const commitFiles = createAction({
  auth: huggingFaceAuth,
  name: 'commit_files',
  classification: 'WRITE',
  displayName: 'Commit Files',
  description: 'Create, update or delete text files in a Hub repository in a single commit, optionally as a pull request.',
  audience: 'ai',
  aiMetadata: {
    description:
      "Writes one commit to a branch of a model, dataset or Space repository: adds or overwrites small inline text files (utf-8 or base64 text, 1 MiB total) and can delete paths in the same commit, which is destructive for the deleted files. Binary or large files are refused (LFS uploads are not supported). Turn on Open as Pull Request to propose the change instead of writing to the branch (the safe mode on repositories the user does not own; returns pullRequestUrl); set Parent Commit to fail rather than overwrite a concurrent edit. Each call creates a new commit, so retries duplicate. Requires a write-role token.",
    idempotent: false,
  },
  outputSchema: commitFilesOutputSchema,
  props: {
    repo_type: hfProps.repoType(),
    repo_id: hfProps.repoId(),
    branch: Property.ShortText({
      displayName: 'Branch',
      description:
        "The branch to commit to, for example 'dev', or 'refs/pr/3' to add a commit to an open pull request. Leave empty to use the repository's default branch 'main'; if the repository has no 'main' branch the action fails with BRANCH_REQUIRED and lists the branches.",
      required: false,
    }),
    summary: Property.ShortText({
      displayName: 'Commit Title',
      description: "A one-line commit summary, for example 'Update README'. Also used as the pull request title.",
      required: true,
    }),
    commit_description: Property.LongText({
      displayName: 'Commit Description',
      description: 'Optional longer commit message. Also used as the pull request description.',
      required: false,
    }),
    files: Property.Array({
      displayName: 'Files to Write',
      description:
        'Text files to create or overwrite. Each needs a repository path and its content; binary files and anything over 1 MiB in total are refused.',
      required: false,
      properties: {
        path: Property.ShortText({
          displayName: 'Path',
          description: "Path inside the repository, for example 'README.md' or 'src/app.py'.",
          required: true,
        }),
        content: Property.LongText({
          displayName: 'Content',
          description: 'The full file content. It replaces the file if it exists.',
          required: true,
        }),
        encoding: Property.StaticDropdown({
          displayName: 'Encoding',
          description: "'utf-8' for plain text (default) or 'base64' when the content is base64-encoded text.",
          required: false,
          defaultValue: 'utf-8',
          options: {
            disabled: false,
            options: [
              { label: 'UTF-8 text', value: 'utf-8' },
              { label: 'Base64', value: 'base64' },
            ],
          },
        }),
      },
    }),
    deleted_paths: Property.Array({
      displayName: 'Paths to Delete',
      description: "Repository paths to delete in the same commit, for example 'old_notes.txt'. Deleted files are removed from the branch.",
      required: false,
    }),
    parent_commit: Property.ShortText({
      displayName: 'Parent Commit',
      description:
        'Optional 40-character commit SHA the branch must still point to. If someone committed since, the commit fails instead of overwriting their change. Get it from List Repo Commits.',
      required: false,
    }),
    create_pr: Property.Checkbox({
      displayName: 'Open as Pull Request',
      description: 'Open a pull request with this commit instead of writing directly to the branch.',
      required: false,
      defaultValue: false,
    }),
  },
  async run(context) {
    const { repo_type, repo_id, branch, summary, commit_description, files, deleted_paths, parent_commit, create_pr } =
      context.propsValue;
    const token = context.auth.secret_text;
    const title = hfWrite.requireText({ value: summary, name: 'Commit Title' });
    const prepared = parseFiles(files);
    const deletedPaths = hfUtils
      .toStringArray(deleted_paths)
      .map((value, index) => normalizeRepoPath({ value, label: `Path to delete #${index + 1}` }));
    if (prepared.files.length === 0 && deletedPaths.length === 0) {
      throw new Error('Provide at least one file to write or one path to delete.');
    }
    assertUniquePaths({ filePaths: prepared.files.map((file) => file.path), deletedPaths });
    const parentCommit = hfWrite.optionalText({ value: parent_commit, name: 'Parent Commit' });
    if (parentCommit !== undefined && !/^[0-9a-fA-F]{40}$/.test(parentCommit)) {
      throw new Error('Parent Commit must be a full 40-character commit SHA. Get it from List Repo Commits.');
    }
    const requestedBranch = hfWrite.optionalText({ value: branch, name: 'Branch' });
    const description = hfWrite.optionalText({ value: commit_description, name: 'Commit Description' });
    const repo = await hfWrite.resolveRepo({ token, repoType: repo_type, repoId: repo_id });
    const targetBranch = requestedBranch ?? (await hfWrite.resolveDefaultBranch({ token, repo }));
    const body: Record<string, unknown> = {
      summary: title,
      files: prepared.files,
      deletedEntries: deletedPaths.map((path) => ({ path })),
    };
    if (description !== undefined) {
      body['description'] = description;
    }
    if (parentCommit !== undefined) {
      body['parentCommit'] = parentCommit.toLowerCase();
    }
    const conflictError = (detail: string | null): Error =>
      new Error(
        parentCommit !== undefined
          ? `PARENT_COMMIT_MISMATCH: '${targetBranch}' no longer points to ${parentCommit}; someone committed since. Re-read the files, then retry with the new head commit.${detail ? ` Details: ${detail}` : ''}`
          : `COMMIT_CONFLICT: the Hub refused the commit to '${targetBranch}' because of a conflict.${detail ? ` Details: ${detail}` : ''}`
      );
    const response = await hfWrite.request({
      token,
      method: HttpMethod.POST,
      path: `${repo.apiPath}/commit/${hfRepo.encodeRevision(targetBranch)}`,
      query: [['create_pr', create_pr === true ? '1' : undefined]],
      body,
      statusErrors: {
        409: conflictError,
        412: conflictError,
        413: (detail) =>
          lfsRequiredError({
            path: prepared.files.map((file) => file.path).join("', '"),
            reason: `was refused as too large by the Hub${detail ? ` (${detail})` : ''}`,
          }),
      },
    });
    const pullRequestUrl = hfWrite.readString({ record: response, key: 'pullRequestUrl' });
    const prNumber = pullRequestNumber(pullRequestUrl);
    return {
      repo_id: repo.repoId,
      repo_type: repo.repoType,
      branch: targetBranch,
      commit_oid: hfWrite.readString({ record: response, key: 'commitOid' }),
      commit_url: hfWrite.readString({ record: response, key: 'commitUrl' }),
      pull_request_url: pullRequestUrl,
      pull_request_number: prNumber,
      pull_request_revision: prNumber === null ? null : `refs/pr/${prNumber}`,
      files_written: prepared.files.map((file) => file.path),
      paths_deleted: deletedPaths,
      total_bytes: prepared.totalBytes,
    };
  },
});

const MAX_TOTAL_BYTES = 1024 * 1024;
const MAX_PATH_LENGTH = 1000;

type CommitFile = {
  path: string;
  content: string;
  encoding: 'utf-8' | 'base64';
};

type PreparedFiles = {
  files: CommitFile[];
  totalBytes: number;
};
