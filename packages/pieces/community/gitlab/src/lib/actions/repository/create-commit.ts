import { createAction, Property } from '@activepieces/pieces-framework';
import { gitlabAuth } from '../../auth';
import { gitlabRequest, projectPath } from '../../common/client';
import { isRecord } from '../../common/secret-request';
import { gitlabProps, optionalText, requireText } from '../../common/props';
import { commitOutputSchema } from '../../output-schemas';

const COMMIT_ACTIONS = ['create', 'delete', 'move', 'update', 'chmod'];
const MAX_COMMIT_ACTIONS = 100;

export function parseCommitActions(value: unknown): Record<string, unknown>[] {
  let raw = value;
  if (typeof raw === 'string') {
    try {
      raw = JSON.parse(raw);
    } catch {
      throw new Error('File Actions must be a JSON array.');
    }
  }
  if (!Array.isArray(raw) || raw.length === 0) {
    throw new Error('File Actions must be a non-empty JSON array.');
  }
  if (raw.length > MAX_COMMIT_ACTIONS) {
    throw new Error(
      `File Actions can hold at most ${MAX_COMMIT_ACTIONS} entries.`
    );
  }
  return raw.map((entry, index) => {
    if (!isRecord(entry)) {
      throw new Error(`File Actions entry ${index + 1} must be an object.`);
    }
    const item = entry;
    const action = item['action'];
    if (typeof action !== 'string' || !COMMIT_ACTIONS.includes(action)) {
      throw new Error(
        `File Actions entry ${
          index + 1
        }: action must be one of ${COMMIT_ACTIONS.join(', ')}.`
      );
    }
    if (
      typeof item['file_path'] !== 'string' ||
      item['file_path'].trim() === ''
    ) {
      throw new Error(
        `File Actions entry ${index + 1}: file_path is required.`
      );
    }
    if (
      action === 'move' &&
      (typeof item['previous_path'] !== 'string' ||
        item['previous_path'].trim() === '')
    ) {
      throw new Error(
        `File Actions entry ${index + 1}: previous_path is required for move.`
      );
    }
    if (
      (action === 'create' || action === 'update') &&
      typeof item['content'] !== 'string'
    ) {
      throw new Error(
        `File Actions entry ${index + 1}: content is required for ${action}.`
      );
    }
    if (
      item['encoding'] !== undefined &&
      item['encoding'] !== 'text' &&
      item['encoding'] !== 'base64'
    ) {
      throw new Error(
        `File Actions entry ${index + 1}: encoding must be text or base64.`
      );
    }
    return item;
  });
}

export const createCommitAction = createAction({
  auth: gitlabAuth,
  name: 'create_commit',
  displayName: 'Create Commit',
  description:
    'Creates a commit that adds, changes, moves or deletes several files at once.',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description:
      'Creates one GitLab commit on a branch that applies several file operations together (create, update, delete, move, chmod). Set Start Branch to create the branch from another one in the same call. Not idempotent: a second call makes another commit or fails because files already exist. For a single file, Create File or Update File is simpler.',
    idempotent: false,
  },
  props: {
    projectId: gitlabProps.projectId(),
    branch: gitlabProps.branch(
      'Branch',
      'Branch to commit to. It must exist unless Start Branch is set.'
    ),
    commitMessage: Property.LongText({
      displayName: 'Commit Message',
      required: true,
    }),
    actions: Property.Json({
      displayName: 'File Actions',
      description:
        'JSON array, e.g. [{"action":"create","file_path":"docs/a.md","content":"Hello"},{"action":"delete","file_path":"old.txt"}]. Each entry: action (create, update, delete, move, chmod), file_path, and as needed content, previous_path, encoding (text or base64), execute_filemode, last_commit_id.',
      required: true,
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
  outputSchema: commitOutputSchema,
  async run({ auth, propsValue }) {
    return gitlabRequest({
      auth,
      method: 'POST',
      path: `${projectPath(propsValue.projectId)}/repository/commits`,
      body: {
        branch: requireText({ value: propsValue.branch, label: 'Branch' }),
        commit_message: requireText({
          value: propsValue.commitMessage,
          label: 'Commit Message',
        }),
        actions: parseCommitActions(propsValue.actions),
        start_branch: optionalText(propsValue.startBranch),
        author_name: optionalText(propsValue.authorName),
        author_email: optionalText(propsValue.authorEmail),
      },
    });
  },
});
