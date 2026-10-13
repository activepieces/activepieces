import { afterEach, describe, expect, it, vi } from 'vitest';
import { gitlab } from '../src';
import { createIssueAction } from '../src/lib/actions/create-issue-action';
import { createProjectIssueAction } from '../src/lib/actions/issues/create-project-issue';
import { getIssueAction } from '../src/lib/actions/issues/get-issue';
import { listIssuesAction } from '../src/lib/actions/issues/list-issues';
import { updateIssueAction } from '../src/lib/actions/issues/update-issue';
import { moveIssueAction } from '../src/lib/actions/issues/move-issue';
import { createIssueNoteAction } from '../src/lib/actions/issues/create-issue-note';
import { getIssueNoteAction } from '../src/lib/actions/issues/get-issue-note';
import { listIssueNotesAction } from '../src/lib/actions/issues/list-issue-notes';
import { updateIssueNoteAction } from '../src/lib/actions/issues/update-issue-note';
import { deleteIssueNoteAction } from '../src/lib/actions/issues/delete-issue-note';
import { addIssueSpentTimeAction } from '../src/lib/actions/issues/add-issue-spent-time';
import { resetIssueSpentTimeAction } from '../src/lib/actions/issues/reset-issue-spent-time';
import { getIssueTimeStatsAction } from '../src/lib/actions/issues/get-issue-time-stats';
import { setIssueTimeEstimateAction } from '../src/lib/actions/issues/set-issue-time-estimate';
import { resetIssueTimeEstimateAction } from '../src/lib/actions/issues/reset-issue-time-estimate';
import { createMergeRequestAction } from '../src/lib/actions/merge-requests/create-merge-request';
import { getMergeRequestAction } from '../src/lib/actions/merge-requests/get-merge-request';
import { listMergeRequestsAction } from '../src/lib/actions/merge-requests/list-merge-requests';
import { updateMergeRequestAction } from '../src/lib/actions/merge-requests/update-merge-request';
import { mergeMergeRequestAction } from '../src/lib/actions/merge-requests/merge-merge-request';
import { deleteMergeRequestAction } from '../src/lib/actions/merge-requests/delete-merge-request';
import { approveMergeRequestAction } from '../src/lib/actions/merge-requests/approve-merge-request';
import { unapproveMergeRequestAction } from '../src/lib/actions/merge-requests/unapprove-merge-request';
import { getMergeRequestApprovalsAction } from '../src/lib/actions/merge-requests/get-merge-request-approvals';
import { listMergeRequestNotesAction } from '../src/lib/actions/merge-requests/list-merge-request-notes';
import { createMergeRequestDraftNoteAction } from '../src/lib/actions/merge-requests/create-merge-request-draft-note';
import { listMergeRequestDiscussionsAction } from '../src/lib/actions/merge-requests/list-merge-request-discussions';
import {
  listMergeRequestDiffsAction,
  MAX_DIFF_CHARS,
} from '../src/lib/actions/merge-requests/list-merge-request-diffs';
import { listMergeRequestDiffVersionsAction } from '../src/lib/actions/merge-requests/list-merge-request-diff-versions';
import { listMergeRequestCommitsAction } from '../src/lib/actions/merge-requests/list-merge-request-commits';
import { createCommitAction } from '../src/lib/actions/repository/create-commit';
import { getCommitAction } from '../src/lib/actions/repository/get-commit';
import { listCommitsAction } from '../src/lib/actions/repository/list-commits';
import { getCommitRefsAction } from '../src/lib/actions/repository/get-commit-refs';
import { getCommitSequenceAction } from '../src/lib/actions/repository/get-commit-sequence';
import { createCommitCommentAction } from '../src/lib/actions/repository/create-commit-comment';
import { listCommitCommentsAction } from '../src/lib/actions/repository/list-commit-comments';
import {
  getFileAction,
  MAX_FILE_TEXT_BYTES,
  decodeFilePrefix,
} from '../src/lib/actions/repository/get-file';
import { createFileAction } from '../src/lib/actions/repository/create-file';
import { updateFileAction } from '../src/lib/actions/repository/update-file';
import { deleteFileAction } from '../src/lib/actions/repository/delete-file';
import { listRepositoryTreeAction } from '../src/lib/actions/repository/list-repository-tree';
import { createBranchAction } from '../src/lib/actions/repository/create-branch';
import { getBranchAction } from '../src/lib/actions/repository/get-branch';
import { listBranchesAction } from '../src/lib/actions/repository/list-branches';
import { deleteBranchAction } from '../src/lib/actions/repository/delete-branch';
import { protectBranchAction } from '../src/lib/actions/repository/protect-branch';
import { unprotectBranchAction } from '../src/lib/actions/repository/unprotect-branch';
import { listTagsAction } from '../src/lib/actions/repository/list-tags';
import { getCurrentUserAction } from '../src/lib/actions/users/get-current-user';
import { getUserAction } from '../src/lib/actions/users/get-user';
import { listUsersAction } from '../src/lib/actions/users/list-users';
import { getUserStatusAction } from '../src/lib/actions/users/get-user-status';
import { setUserStatusAction } from '../src/lib/actions/users/set-user-status';

import { wave2Cases } from './wave2-cases';
import { FAKE_DISPATCHER, rawPath, runAction, stubGitlab } from './helpers';
import { gitlabTransport } from '../src/lib/common/secret-request';

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

const P = { projectId: 'grp/proj' };
const PP = '/projects/grp%2Fproj';

type Case = {
  name: string;
  action: Parameters<typeof runAction>[0];
  props: Record<string, unknown>;
  method: string;
  path: string;
  query?: Record<string, unknown>;
  body?: Record<string, unknown>;
  reply?: unknown;
  result?: unknown;
};

const cases: Case[] = [
  {
    name: 'create_issue (human)',
    action: createIssueAction,
    props: { projectId: 12, title: 'Bug', description: 'Body' },
    method: 'POST',
    path: '/projects/12/issues',
    body: { title: 'Bug', description: 'Body' },
  },
  {
    name: 'create_project_issue',
    action: createProjectIssueAction,
    props: {
      ...P,
      title: 'T',
      description: 'D',
      labels: ['a', 'b'],
      assigneeIds: ['3'],
      milestoneId: 4,
      dueDate: '2026-10-20',
      confidential: 'true',
    },
    method: 'POST',
    path: `${PP}/issues`,
    body: {
      title: 'T',
      description: 'D',
      labels: 'a,b',
      assignee_ids: [3],
      milestone_id: 4,
      due_date: '2026-10-20',
      confidential: true,
    },
  },
  {
    name: 'get_issue',
    action: getIssueAction,
    props: { ...P, issueIid: 7 },
    method: 'GET',
    path: `${PP}/issues/7`,
  },
  {
    name: 'list_issues',
    action: listIssuesAction,
    props: {
      ...P,
      state: 'opened',
      search: 'crash',
      labels: ['bug'],
      assigneeId: 2,
      authorId: 3,
      milestone: 'v1',
      updatedAfter: '2026-10-01',
      orderBy: 'updated_at',
      sort: 'asc',
      page: 2,
      perPage: 50,
    },
    method: 'GET',
    path: `${PP}/issues`,
    query: {
      state: 'opened',
      search: 'crash',
      labels: 'bug',
      assignee_id: '2',
      author_id: '3',
      milestone: 'v1',
      updated_after: '2026-10-01',
      order_by: 'updated_at',
      sort: 'asc',
      page: '2',
      per_page: '50',
    },
  },
  {
    name: 'update_issue',
    action: updateIssueAction,
    props: {
      ...P,
      issueIid: 7,
      title: 'New',
      stateEvent: 'close',
      addLabels: ['x'],
      confidential: 'false',
    },
    method: 'PUT',
    path: `${PP}/issues/7`,
    body: {
      title: 'New',
      state_event: 'close',
      add_labels: 'x',
      confidential: false,
    },
  },
  {
    name: 'move_issue',
    action: moveIssueAction,
    props: { ...P, issueIid: 7, toProjectId: 99 },
    method: 'POST',
    path: `${PP}/issues/7/move`,
    body: { to_project_id: 99 },
  },
  {
    name: 'create_issue_note',
    action: createIssueNoteAction,
    props: { ...P, issueIid: 7, body: 'Hi' },
    method: 'POST',
    path: `${PP}/issues/7/notes`,
    body: { body: 'Hi' },
  },
  {
    name: 'get_issue_note',
    action: getIssueNoteAction,
    props: { ...P, issueIid: 7, noteId: 5 },
    method: 'GET',
    path: `${PP}/issues/7/notes/5`,
  },
  {
    name: 'list_issue_notes',
    action: listIssueNotesAction,
    props: { ...P, issueIid: 7, orderBy: 'created_at', sort: 'asc' },
    method: 'GET',
    path: `${PP}/issues/7/notes`,
    query: { order_by: 'created_at', sort: 'asc', page: '1', per_page: '20' },
  },
  {
    name: 'update_issue_note',
    action: updateIssueNoteAction,
    props: { ...P, issueIid: 7, noteId: 5, body: 'Edit' },
    method: 'PUT',
    path: `${PP}/issues/7/notes/5`,
    body: { body: 'Edit' },
  },
  {
    name: 'delete_issue_note',
    action: deleteIssueNoteAction,
    props: { ...P, issueIid: 7, noteId: 5 },
    method: 'DELETE',
    path: `${PP}/issues/7/notes/5`,
    reply: null,
    result: { deleted: true, noteId: 5, issueIid: 7 },
  },
  {
    name: 'add_issue_spent_time',
    action: addIssueSpentTimeAction,
    props: { ...P, issueIid: 7, duration: '1h 30m', summary: 'review' },
    method: 'POST',
    path: `${PP}/issues/7/add_spent_time`,
    body: { duration: '1h30m', summary: 'review' },
  },
  {
    name: 'reset_issue_spent_time',
    action: resetIssueSpentTimeAction,
    props: { ...P, issueIid: 7 },
    method: 'POST',
    path: `${PP}/issues/7/reset_spent_time`,
  },
  {
    name: 'get_issue_time_stats',
    action: getIssueTimeStatsAction,
    props: { ...P, issueIid: 7 },
    method: 'GET',
    path: `${PP}/issues/7/time_stats`,
  },
  {
    name: 'set_issue_time_estimate',
    action: setIssueTimeEstimateAction,
    props: { ...P, issueIid: 7, duration: '3h' },
    method: 'POST',
    path: `${PP}/issues/7/time_estimate`,
    body: { duration: '3h' },
  },
  {
    name: 'reset_issue_time_estimate',
    action: resetIssueTimeEstimateAction,
    props: { ...P, issueIid: 7 },
    method: 'POST',
    path: `${PP}/issues/7/reset_time_estimate`,
  },
  {
    name: 'create_merge_request',
    action: createMergeRequestAction,
    props: {
      ...P,
      sourceBranch: 'feat/x',
      targetBranch: 'main',
      title: 'Feat',
      reviewerIds: [8],
      squash: 'true',
    },
    method: 'POST',
    path: `${PP}/merge_requests`,
    body: {
      source_branch: 'feat/x',
      target_branch: 'main',
      title: 'Feat',
      reviewer_ids: [8],
      squash: true,
    },
  },
  {
    name: 'get_merge_request',
    action: getMergeRequestAction,
    props: { ...P, mergeRequestIid: 3 },
    method: 'GET',
    path: `${PP}/merge_requests/3`,
  },
  {
    name: 'list_merge_requests (project)',
    action: listMergeRequestsAction,
    props: { ...P, state: 'opened', targetBranch: 'main' },
    method: 'GET',
    path: `${PP}/merge_requests`,
    query: {
      state: 'opened',
      target_branch: 'main',
      page: '1',
      per_page: '20',
    },
  },
  {
    name: 'list_merge_requests (global)',
    action: listMergeRequestsAction,
    props: { scope: 'all', search: 'fix' },
    method: 'GET',
    path: '/merge_requests',
    query: { scope: 'all', search: 'fix', page: '1', per_page: '20' },
  },
  {
    name: 'update_merge_request',
    action: updateMergeRequestAction,
    props: {
      ...P,
      mergeRequestIid: 3,
      targetBranch: 'dev',
      clearReviewers: true,
      squash: 'false',
    },
    method: 'PUT',
    path: `${PP}/merge_requests/3`,
    body: { target_branch: 'dev', reviewer_ids: [0], squash: false },
  },
  {
    name: 'merge_merge_request',
    action: mergeMergeRequestAction,
    props: {
      ...P,
      mergeRequestIid: 3,
      sha: 'abc',
      squash: 'true',
      shouldRemoveSourceBranch: 'true',
    },
    method: 'PUT',
    path: `${PP}/merge_requests/3/merge`,
    body: { sha: 'abc', squash: true, should_remove_source_branch: true },
  },
  {
    name: 'delete_merge_request',
    action: deleteMergeRequestAction,
    props: { ...P, mergeRequestIid: 3 },
    method: 'DELETE',
    path: `${PP}/merge_requests/3`,
    reply: null,
    result: { deleted: true, mergeRequestIid: 3 },
  },
  {
    name: 'approve_merge_request',
    action: approveMergeRequestAction,
    props: { ...P, mergeRequestIid: 3, sha: 'abc' },
    method: 'POST',
    path: `${PP}/merge_requests/3/approve`,
    body: { sha: 'abc' },
  },
  {
    name: 'unapprove_merge_request',
    action: unapproveMergeRequestAction,
    props: { ...P, mergeRequestIid: 3 },
    method: 'POST',
    path: `${PP}/merge_requests/3/unapprove`,
  },
  {
    name: 'get_merge_request_approvals',
    action: getMergeRequestApprovalsAction,
    props: { ...P, mergeRequestIid: 3 },
    method: 'GET',
    path: `${PP}/merge_requests/3/approvals`,
  },
  {
    name: 'list_merge_request_notes',
    action: listMergeRequestNotesAction,
    props: { ...P, mergeRequestIid: 3, sort: 'desc' },
    method: 'GET',
    path: `${PP}/merge_requests/3/notes`,
    query: { sort: 'desc', page: '1', per_page: '20' },
  },
  {
    name: 'create_merge_request_draft_note',
    action: createMergeRequestDraftNoteAction,
    props: { ...P, mergeRequestIid: 3, note: 'nit' },
    method: 'POST',
    path: `${PP}/merge_requests/3/draft_notes`,
    body: { note: 'nit' },
  },
  {
    name: 'list_merge_request_discussions',
    action: listMergeRequestDiscussionsAction,
    props: { ...P, mergeRequestIid: 3 },
    method: 'GET',
    path: `${PP}/merge_requests/3/discussions`,
    query: { page: '1', per_page: '20' },
  },
  {
    name: 'list_merge_request_diffs',
    action: listMergeRequestDiffsAction,
    props: { ...P, mergeRequestIid: 3 },
    method: 'GET',
    path: `${PP}/merge_requests/3/diffs`,
    query: { page: '1', per_page: '20' },
  },
  {
    name: 'list_merge_request_diff_versions',
    action: listMergeRequestDiffVersionsAction,
    props: { ...P, mergeRequestIid: 3 },
    method: 'GET',
    path: `${PP}/merge_requests/3/versions`,
    query: { page: '1', per_page: '20' },
  },
  {
    name: 'list_merge_request_commits',
    action: listMergeRequestCommitsAction,
    props: { ...P, mergeRequestIid: 3 },
    method: 'GET',
    path: `${PP}/merge_requests/3/commits`,
    query: { page: '1', per_page: '20' },
  },
  {
    name: 'create_commit',
    action: createCommitAction,
    props: {
      ...P,
      branch: 'main',
      commitMessage: 'msg',
      actions: '[{"action":"create","file_path":"a.md","content":"x"}]',
      startBranch: 'dev',
    },
    method: 'POST',
    path: `${PP}/repository/commits`,
    body: {
      branch: 'main',
      commit_message: 'msg',
      actions: [{ action: 'create', file_path: 'a.md', content: 'x' }],
      start_branch: 'dev',
    },
  },
  {
    name: 'get_commit',
    action: getCommitAction,
    props: { ...P, sha: 'release/1.0' },
    method: 'GET',
    path: `${PP}/repository/commits/release%2F1.0`,
    query: { stats: 'true' },
  },
  {
    name: 'list_commits',
    action: listCommitsAction,
    props: {
      ...P,
      refName: 'main',
      path: 'src',
      since: '2026-10-01T00:00:00Z',
    },
    method: 'GET',
    path: `${PP}/repository/commits`,
    query: {
      ref_name: 'main',
      path: 'src',
      since: '2026-10-01T00:00:00Z',
      page: '1',
      per_page: '20',
    },
  },
  {
    name: 'get_commit_refs',
    action: getCommitRefsAction,
    props: { ...P, sha: 'abc', type: 'tag' },
    method: 'GET',
    path: `${PP}/repository/commits/abc/refs`,
    query: { type: 'tag', page: '1', per_page: '20' },
  },
  {
    name: 'get_commit_sequence',
    action: getCommitSequenceAction,
    props: { ...P, sha: 'abc', firstParent: 'true' },
    method: 'GET',
    path: `${PP}/repository/commits/abc/sequence`,
    query: { first_parent: 'true' },
  },
  {
    name: 'create_commit_comment',
    action: createCommitCommentAction,
    props: {
      ...P,
      sha: 'abc',
      note: 'n',
      path: 'a.ts',
      line: 3,
      lineType: 'new',
    },
    method: 'POST',
    path: `${PP}/repository/commits/abc/comments`,
    body: { note: 'n', path: 'a.ts', line: 3, line_type: 'new' },
  },
  {
    name: 'list_commit_comments',
    action: listCommitCommentsAction,
    props: { ...P, sha: 'abc' },
    method: 'GET',
    path: `${PP}/repository/commits/abc/comments`,
    query: { page: '1', per_page: '20' },
  },
  {
    name: 'create_file',
    action: createFileAction,
    props: {
      ...P,
      filePath: 'docs/x.md',
      branch: 'main',
      content: 'hi',
      commitMessage: 'add',
    },
    method: 'POST',
    path: `${PP}/repository/files/docs%2Fx.md`,
    body: {
      branch: 'main',
      content: 'hi',
      commit_message: 'add',
      encoding: 'text',
    },
  },
  {
    name: 'update_file',
    action: updateFileAction,
    props: {
      ...P,
      filePath: 'docs/x.md',
      branch: 'main',
      content: 'hi2',
      commitMessage: 'edit',
      lastCommitId: 'l1',
    },
    method: 'PUT',
    path: `${PP}/repository/files/docs%2Fx.md`,
    body: {
      branch: 'main',
      content: 'hi2',
      commit_message: 'edit',
      encoding: 'text',
      last_commit_id: 'l1',
    },
  },
  {
    name: 'delete_file',
    action: deleteFileAction,
    props: { ...P, filePath: 'docs/x.md', branch: 'main', commitMessage: 'rm' },
    method: 'DELETE',
    path: `${PP}/repository/files/docs%2Fx.md`,
    body: { branch: 'main', commit_message: 'rm' },
    reply: null,
    result: { deleted: true, file_path: 'docs/x.md', branch: 'main' },
  },
  {
    name: 'list_repository_tree',
    action: listRepositoryTreeAction,
    props: { ...P, path: 'src', ref: 'main', recursive: 'true' },
    method: 'GET',
    path: `${PP}/repository/tree`,
    query: {
      path: 'src',
      ref: 'main',
      recursive: 'true',
      page: '1',
      per_page: '20',
    },
  },
  {
    name: 'create_branch',
    action: createBranchAction,
    props: { ...P, branch: 'feat/y', ref: 'main' },
    method: 'POST',
    path: `${PP}/repository/branches`,
    body: { branch: 'feat/y', ref: 'main' },
  },
  {
    name: 'get_branch',
    action: getBranchAction,
    props: { ...P, branch: 'feat/y' },
    method: 'GET',
    path: `${PP}/repository/branches/feat%2Fy`,
  },
  {
    name: 'list_branches',
    action: listBranchesAction,
    props: { ...P, search: '^feat' },
    method: 'GET',
    path: `${PP}/repository/branches`,
    query: { search: '^feat', page: '1', per_page: '20' },
  },
  {
    name: 'delete_branch',
    action: deleteBranchAction,
    props: { ...P, branch: 'feat/y' },
    method: 'DELETE',
    path: `${PP}/repository/branches/feat%2Fy`,
    reply: null,
    result: { deleted: true, branch: 'feat/y' },
  },
  {
    name: 'protect_branch',
    action: protectBranchAction,
    props: {
      ...P,
      name: 'release/*',
      pushAccessLevel: 0,
      mergeAccessLevel: 40,
    },
    method: 'POST',
    path: `${PP}/protected_branches`,
    body: { name: 'release/*', push_access_level: 0, merge_access_level: 40 },
  },
  {
    name: 'unprotect_branch',
    action: unprotectBranchAction,
    props: { ...P, name: 'release/*' },
    method: 'DELETE',
    path: `${PP}/protected_branches/release%2F*`,
    reply: null,
    result: { unprotected: true, alreadyUnprotected: false, name: 'release/*' },
  },
  {
    name: 'list_tags',
    action: listTagsAction,
    props: { ...P, search: 'v1', orderBy: 'version' },
    method: 'GET',
    path: `${PP}/repository/tags`,
    query: { search: 'v1', order_by: 'version', page: '1', per_page: '20' },
  },
  {
    name: 'get_current_user',
    action: getCurrentUserAction,
    props: {},
    method: 'GET',
    path: '/user',
  },
  {
    name: 'get_user',
    action: getUserAction,
    props: { userId: '15' },
    method: 'GET',
    path: '/users/15',
  },
  {
    name: 'list_users',
    action: listUsersAction,
    props: { username: '@dev' },
    method: 'GET',
    path: '/users',
    query: { username: 'dev', page: '1', per_page: '20' },
  },
  {
    name: 'get_user_status (self)',
    action: getUserStatusAction,
    props: {},
    method: 'GET',
    path: '/user/status',
  },
  {
    name: 'get_user_status (other)',
    action: getUserStatusAction,
    props: { user: '@dev' },
    method: 'GET',
    path: '/users/dev/status',
  },
];

describe('exact outgoing request per atomic', () => {
  it.each(cases)('$name', async (testCase) => {
    const isList = testCase.query !== undefined && 'per_page' in testCase.query;
    const reply =
      testCase.reply === null
        ? { status: 204 }
        : { body: testCase.reply ?? (isList ? [] : { id: 1 }) };
    const seen = stubGitlab([reply]);
    const result = await runAction({
      action: testCase.action,
      propsValue: testCase.props,
    });
    expect(seen).toHaveLength(1);
    expect(seen[0].method).toBe(testCase.method);
    expect(rawPath(seen[0])).toBe(testCase.path);
    expect(seen[0].query).toEqual(testCase.query ?? {});
    expect(seen[0].body).toEqual(testCase.body);
    if (testCase.result !== undefined) {
      expect(result).toEqual(testCase.result);
    }
  });

  it('covers every action registered on the piece except Custom API Call', () => {
    const covered = new Set([
      ...cases.map((c) => c.action.name),
      ...wave2Cases.map((c) => c.action.name),
      'set_user_status',
      'get_file',
    ]);
    const registered = Object.keys(gitlab.actions()).filter(
      (name) => name !== 'custom_api_call'
    );
    expect(registered.filter((name) => !covered.has(name))).toEqual([]);
    expect(registered).toHaveLength(113);
  });
});

describe('metadata', () => {
  const actions = Object.values(gitlab.actions()).filter(
    (action) => action.name !== 'custom_api_call'
  );

  it('every action declares audience, classification and aiMetadata', () => {
    for (const action of actions) {
      expect(action.audience, action.name).toBeDefined();
      expect(action.classification, action.name).toBeDefined();
      expect(action.aiMetadata?.description, action.name).toBeTruthy();
      expect(typeof action.aiMetadata?.idempotent, action.name).toBe('boolean');
    }
  });

  it('only create_issue is human; all new atomics are ai and have an outputSchema', () => {
    expect(
      actions.filter((a) => a.audience === 'human').map((a) => a.name)
    ).toEqual(['create_issue']);
    for (const action of actions) {
      expect(action.outputSchema, action.name).toBeDefined();
    }
  });

  it('destructive verbs are classified DESTRUCTIVE', () => {
    const wave2 = new Set(wave2Cases.map((c) => c.action.name));
    const destructive = actions
      .filter((a) => a.classification === 'DESTRUCTIVE' && !wave2.has(a.name))
      .map((a) => a.name)
      .sort();
    expect(destructive).toEqual(
      [
        'delete_branch',
        'delete_file',
        'delete_issue_note',
        'delete_merge_request',
        'merge_merge_request',
        'reset_issue_spent_time',
        'unprotect_branch',
      ].sort()
    );
  });

  it('aiMetadata names only sibling actions that agents can see', () => {
    const visible = new Set(
      actions.filter((a) => a.audience !== 'human').map((a) => a.displayName)
    );
    const hidden = actions
      .filter((a) => a.audience === 'human')
      .map((a) => a.displayName);
    for (const action of actions.filter((a) => a.audience !== 'human')) {
      for (const name of hidden) {
        expect(
          action.aiMetadata?.description?.includes(`${name} `) &&
            !visible.has(name),
          `${action.name} names ${name}`
        ).toBeFalsy();
      }
    }
    expect(gitlab.minimumSupportedRelease).toBe('0.88.2');
  });
});

describe('rule checks', () => {
  it('update_issue sends clear values and refuses an empty update', async () => {
    const seen = stubGitlab([{ body: {} }]);
    await runAction({
      action: updateIssueAction,
      propsValue: {
        ...P,
        issueIid: 1,
        clearDescription: true,
        clearAssignees: true,
        clearMilestone: true,
        clearDueDate: true,
      },
    });
    expect(seen[0].body).toEqual({
      description: '',
      assignee_ids: [0],
      milestone_id: 0,
      due_date: '',
    });
    await expect(
      runAction({
        action: updateIssueAction,
        propsValue: { ...P, issueIid: 1, clearDescription: false },
      })
    ).rejects.toThrow('Set at least one field');
    expect(seen).toHaveLength(1);
  });

  it('update actions unlock the discussion before a state change', async () => {
    const seen = stubGitlab([{ body: {} }, { body: {} }, { body: {} }]);
    await runAction({
      action: updateIssueAction,
      propsValue: {
        ...P,
        issueIid: 1,
        stateEvent: 'reopen',
        discussionLocked: 'false',
      },
    });
    await runAction({
      action: updateMergeRequestAction,
      propsValue: { ...P, mergeRequestIid: 2, title: 'only a title' },
    });
    expect(seen.map((s) => [s.method, rawPath(s), s.body])).toEqual([
      ['PUT', `${PP}/issues/1`, { discussion_locked: false }],
      [
        'PUT',
        `${PP}/issues/1`,
        { state_event: 'reopen', discussion_locked: false },
      ],
      ['PUT', `${PP}/merge_requests/2`, { title: 'only a title' }],
    ]);
  });

  it('validates IIDs and paging before any request', async () => {
    const seen = stubGitlab([]);
    await expect(
      runAction({ action: getIssueAction, propsValue: { ...P, issueIid: -1 } })
    ).rejects.toThrow('positive whole number');
    await expect(
      runAction({
        action: listIssuesAction,
        propsValue: { ...P, perPage: 500 },
      })
    ).rejects.toThrow('between 1 and 100');
    await expect(
      runAction({
        action: addIssueSpentTimeAction,
        propsValue: { ...P, issueIid: 1, duration: 'soon' },
      })
    ).rejects.toThrow('duration');
    await expect(
      runAction({ action: listUsersAction, propsValue: {} })
    ).rejects.toThrow('Set Search or Username');
    await expect(
      runAction({
        action: createCommitCommentAction,
        propsValue: { ...P, sha: 'a', note: 'n', line: 3 },
      })
    ).rejects.toThrow('together');
    await expect(
      runAction({
        action: createCommitAction,
        propsValue: {
          ...P,
          branch: 'm',
          commitMessage: 'x',
          actions: [{ action: 'nuke', file_path: 'a' }],
        },
      })
    ).rejects.toThrow('action must be one of');
    await expect(
      runAction({
        action: createCommitAction,
        propsValue: {
          ...P,
          branch: 'm',
          commitMessage: 'x',
          actions: [{ action: 'move', file_path: 'a' }],
        },
      })
    ).rejects.toThrow('previous_path');
    await expect(
      runAction({
        action: deleteBranchAction,
        propsValue: { ...P, branch: '  ' },
      })
    ).rejects.toThrow('Branch is required');
    expect(seen).toHaveLength(0);
  });

  it('unprotect_branch treats 404 as already unprotected and rethrows other errors', async () => {
    stubGitlab([
      { status: 404, body: { message: '404 Not found' } },
      { status: 403, body: { message: 'Forbidden' } },
    ]);
    expect(
      await runAction({
        action: unprotectBranchAction,
        propsValue: { ...P, name: 'main' },
      })
    ).toEqual({ unprotected: true, alreadyUnprotected: true, name: 'main' });
    await expect(
      runAction({
        action: unprotectBranchAction,
        propsValue: { ...P, name: 'main' },
      })
    ).rejects.toThrow(/HTTP 403/);
  });

  it('set_user_status reads the current status and keeps omitted fields', async () => {
    const seen = stubGitlab([
      {
        body: {
          emoji: 'coffee',
          message: 'Lunch',
          availability: 'not_set',
          clear_status_at: null,
        },
      },
      { body: {} },
    ]);
    await runAction({
      action: setUserStatusAction,
      propsValue: { availability: 'busy' },
    });
    expect(seen[0]).toMatchObject({ method: 'GET', path: '/user/status' });
    expect(seen[1]).toMatchObject({
      method: 'PUT',
      path: '/user/status',
      body: { emoji: 'coffee', message: 'Lunch', availability: 'busy' },
    });
  });

  it('set_user_status clears only what is asked', async () => {
    const seen = stubGitlab([
      { body: { emoji: 'coffee', message: 'Lunch', availability: 'busy' } },
      { body: {} },
    ]);
    await runAction({
      action: setUserStatusAction,
      propsValue: { clearMessage: true, clearStatusAfter: '3_hours' },
    });
    expect(seen[1].body).toEqual({
      emoji: 'coffee',
      message: '',
      availability: 'busy',
      clear_status_after: '3_hours',
    });
  });

  it('set_user_status clear-all returns the re-read status instead of the empty PUT body', async () => {
    const seen = stubGitlab([
      { status: 200, body: '' },
      { body: { emoji: null, message: null, availability: null } },
    ]);
    const result = await runAction({
      action: setUserStatusAction,
      propsValue: { clearAll: true, message: 'ignored' },
    });
    expect(seen.map((s) => s.method)).toEqual(['PUT', 'GET']);
    expect(seen[0].body).toEqual({
      emoji: '',
      message: '',
      availability: 'not_set',
    });
    expect(result).toEqual({ emoji: null, message: null, availability: null });
  });

  it('create_commit_comment reports whether GitLab anchored the comment to the line', async () => {
    stubGitlab([
      { body: { note: 'n', path: null, line: null } },
      { body: { note: 'n', path: 'a.ts', line: 3 } },
    ]);
    const props = {
      ...P,
      sha: 'a',
      note: 'n',
      path: 'a.ts',
      line: 3,
      lineType: 'new',
    };
    expect(
      await runAction({ action: createCommitCommentAction, propsValue: props })
    ).toMatchObject({ lineAnchored: false });
    expect(
      await runAction({ action: createCommitCommentAction, propsValue: props })
    ).toMatchObject({ lineAnchored: true });
  });

  it('list_merge_requests explains a gitlab.com timeout on a global Scope All search', async () => {
    stubGitlab([{ status: 408, body: { error: 'Request timed out' } }]);
    await expect(
      runAction({
        action: listMergeRequestsAction,
        propsValue: { scope: 'all' },
      })
    ).rejects.toThrow(/Set Project/);
  });

  it('get_file reads metadata with HEAD and content from the raw endpoint', async () => {
    const seen = stubGitlab((entry) =>
      entry.method === 'HEAD'
        ? {
            headers: {
              'x-gitlab-file-name': 'a b.ts',
              'x-gitlab-file-path': 'src/a b.ts',
              'x-gitlab-size': '5',
              'x-gitlab-ref': 'main',
              'x-gitlab-blob-id': 'b',
              'x-gitlab-commit-id': 'c',
              'x-gitlab-last-commit-id': 'l',
              'x-gitlab-content-sha256': 's',
            },
          }
        : { body: 'hello' }
    );
    const result = await runAction({
      action: getFileAction,
      propsValue: { ...P, filePath: 'src/a b.ts', ref: 'main' },
    });
    expect(seen.map((s) => [s.method, rawPath(s), s.query])).toEqual([
      ['HEAD', `${PP}/repository/files/src%2Fa%20b.ts`, { ref: 'main' }],
      ['GET', `${PP}/repository/files/src%2Fa%20b.ts/raw`, { ref: 'main' }],
    ]);
    expect(result).toEqual({
      file_name: 'a b.ts',
      file_path: 'src/a b.ts',
      size: 5,
      ref: 'main',
      blob_id: 'b',
      commit_id: 'c',
      last_commit_id: 'l',
      content_sha256: 's',
      content: 'hello',
      isBinary: false,
      truncated: false,
    });
  });

  it('get_file reports non-ASCII paths and refs exactly', async () => {
    stubGitlab((entry) =>
      entry.method === 'HEAD'
        ? {
            headers: {
              'x-gitlab-file-name': Buffer.from('日本.txt').toString('latin1'),
              'x-gitlab-file-path': Buffer.from('ü/日本.txt').toString('latin1'),
              'x-gitlab-ref': Buffer.from('fix/ü').toString('latin1'),
            },
          }
        : { body: 'x' }
    );
    const result = await runAction({
      action: getFileAction,
      propsValue: { ...P, filePath: 'ü/日本.txt', ref: 'fix/ü' },
    });
    expect(result).toMatchObject({
      file_name: '日本.txt',
      file_path: 'ü/日本.txt',
      ref: 'fix/ü',
    });
  });

  it('file actions keep leading and trailing spaces in the path', async () => {
    const seen = stubGitlab((entry) =>
      entry.method === 'HEAD'
        ? {}
        : entry.method === 'DELETE'
        ? { status: 204 }
        : { body: 'x' }
    );
    const read = await runAction({
      action: getFileAction,
      propsValue: { ...P, filePath: ' report.txt', ref: 'main' },
    });
    expect(read).toMatchObject({
      file_name: ' report.txt',
      file_path: ' report.txt',
    });
    const deleted = await runAction({
      action: deleteFileAction,
      propsValue: {
        ...P,
        filePath: ' report.txt',
        branch: 'main',
        commitMessage: 'rm',
      },
    });
    await runAction({
      action: updateFileAction,
      propsValue: {
        ...P,
        filePath: 'report.txt ',
        branch: 'main',
        content: 'x',
        commitMessage: 'u',
      },
    });
    expect(rawPath(seen[0])).toBe(`${PP}/repository/files/%20report.txt`);
    expect(rawPath(seen[2])).toBe(`${PP}/repository/files/%20report.txt`);
    expect(deleted).toMatchObject({ file_path: ' report.txt' });
    expect(rawPath(seen[3])).toBe(`${PP}/repository/files/report.txt%20`);
    await expect(
      runAction({
        action: createFileAction,
        propsValue: {
          ...P,
          filePath: '   ',
          branch: 'main',
          content: 'x',
          commitMessage: 'c',
        },
      })
    ).rejects.toThrow('File Path is required.');
  });

  it('get_file flags binary content and cuts large text', async () => {
    const binary = Buffer.from([0x89, 0x50, 0x00, 0x01]);
    const big = 'a'.repeat(MAX_FILE_TEXT_BYTES + 10);
    stubGitlab((entry) =>
      entry.method === 'HEAD'
        ? {}
        : { body: entry.path.includes('img') ? binary.toString('latin1') : big }
    );
    expect(decodeFilePrefix({ bytes: binary, complete: true })).toMatchObject({
      content: null,
      isBinary: true,
    });
    const large: { content: string; truncated: boolean } = await runAction({
      action: getFileAction,
      propsValue: { ...P, filePath: 'big.txt', ref: 'main' },
    });
    expect(large.truncated).toBe(true);
    expect(large.content.length).toBe(MAX_FILE_TEXT_BYTES);
  });

  it('get_file stops reading the raw stream once the preview is full', async () => {
    let pulled = 0;
    const chunk = new Uint8Array(64 * 1024).fill(0x61);
    const stream = new ReadableStream<Uint8Array>({
      pull(controller) {
        pulled += chunk.byteLength;
        controller.enqueue(chunk);
      },
    });
    vi.spyOn(gitlabTransport, 'getDispatcher').mockResolvedValue(
      FAKE_DISPATCHER
    );
    vi.stubGlobal(
      'fetch',
      vi.fn(async (_input: string, init: RequestInit) =>
        init.method === 'HEAD'
          ? new Response(null, {
              status: 200,
              headers: { 'x-gitlab-size': '50000000' },
            })
          : new Response(stream, { status: 200 })
      )
    );
    const result: { truncated: boolean; size: number; content: string } =
      await runAction({
        action: getFileAction,
        propsValue: { ...P, filePath: 'huge.txt', ref: 'main' },
      });
    expect(result.truncated).toBe(true);
    expect(result.size).toBe(50_000_000);
    expect(result.content.length).toBe(MAX_FILE_TEXT_BYTES);
    expect(pulled).toBeLessThan(MAX_FILE_TEXT_BYTES + 4 * chunk.byteLength);
  });

  it('decodeFilePrefix keeps strict UTF-8 and only forgives a split character at the cut', () => {
    const euro = Buffer.from('\u20ac');
    const split = Buffer.concat([
      Buffer.alloc(MAX_FILE_TEXT_BYTES - 1, 0x61),
      euro,
    ]);
    const cut = decodeFilePrefix({ bytes: split, complete: false });
    expect(cut).toMatchObject({ isBinary: false, truncated: true });
    expect(cut.content?.length).toBe(MAX_FILE_TEXT_BYTES - 1);
    const invalid = Buffer.concat([
      Buffer.alloc(9000, 0x61),
      Buffer.from([0xff, 0xfe]),
      Buffer.alloc(MAX_FILE_TEXT_BYTES, 0x61),
    ]);
    expect(decodeFilePrefix({ bytes: invalid, complete: false })).toMatchObject(
      { content: null, isBinary: true }
    );
  });

  it('list_merge_request_diffs caps each diff and keeps paging from x-next-page', async () => {
    stubGitlab([
      {
        body: [
          { new_path: 'a', diff: 'x'.repeat(MAX_DIFF_CHARS + 5) },
          { new_path: 'b', diff: 'small' },
        ],
        headers: { 'x-next-page': '2' },
      },
    ]);
    const result: {
      items: { diff: string; diffTruncated: boolean }[];
      nextPage: number;
    } = await runAction({
      action: listMergeRequestDiffsAction,
      propsValue: { ...P, mergeRequestIid: 1 },
    });
    expect(result.items[0].diff.length).toBe(MAX_DIFF_CHARS);
    expect(result.items[0].diffTruncated).toBe(true);
    expect(result.items[1].diffTruncated).toBe(false);
    expect(result.nextPage).toBe(2);
  });

  it('approve, merge and create MR surface the documented failure statuses', async () => {
    stubGitlab([
      { status: 401, body: { message: '401 Unauthorized' } },
      { status: 405, body: { message: '405 Method Not Allowed' } },
      {
        status: 409,
        body: {
          message: [
            'Another open merge request already exists for this source branch',
          ],
        },
      },
    ]);
    await expect(
      runAction({
        action: approveMergeRequestAction,
        propsValue: { ...P, mergeRequestIid: 1 },
      })
    ).rejects.toThrow(/already approved/);
    await expect(
      runAction({
        action: mergeMergeRequestAction,
        propsValue: { ...P, mergeRequestIid: 1 },
      })
    ).rejects.toThrow(/cannot be merged now/);
    await expect(
      runAction({
        action: createMergeRequestAction,
        propsValue: { ...P, sourceBranch: 'a', targetBranch: 'b', title: 't' },
      })
    ).rejects.toThrow(/already exists/);
  });
});
