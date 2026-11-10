import { cancelJobAction } from '../src/lib/actions/ci/cancel-job';
import { cancelPipelineAction } from '../src/lib/actions/ci/cancel-pipeline';
import { createPipelineAction } from '../src/lib/actions/ci/create-pipeline';
import { deletePipelineAction } from '../src/lib/actions/ci/delete-pipeline';
import { eraseJobAction } from '../src/lib/actions/ci/erase-job';
import { getJobLogAction } from '../src/lib/actions/ci/get-job-log';
import { getJobAction } from '../src/lib/actions/ci/get-job';
import { getPipelineAction } from '../src/lib/actions/ci/get-pipeline';
import { listPipelineJobsAction } from '../src/lib/actions/ci/list-pipeline-jobs';
import { listPipelinesAction } from '../src/lib/actions/ci/list-pipelines';
import { playManualJobAction } from '../src/lib/actions/ci/play-manual-job';
import { retryPipelineAction } from '../src/lib/actions/ci/retry-pipeline';
import { archiveProjectAction } from '../src/lib/actions/projects/archive-project';
import { createProjectAction } from '../src/lib/actions/projects/create-project';
import { deleteProjectAction } from '../src/lib/actions/projects/delete-project';
import { forkProjectAction } from '../src/lib/actions/projects/fork-project';
import { getProjectLanguagesAction } from '../src/lib/actions/projects/get-project-languages';
import { getProjectMemberAction } from '../src/lib/actions/projects/get-project-member';
import { getProjectAction } from '../src/lib/actions/projects/get-project';
import { importProjectMembersAction } from '../src/lib/actions/projects/import-project-members';
import { listGroupProjectsAction } from '../src/lib/actions/projects/list-group-projects';
import { listProjectGroupsAction } from '../src/lib/actions/projects/list-project-groups';
import { listProjectInvitedGroupsAction } from '../src/lib/actions/projects/list-project-invited-groups';
import { listProjectMembersAction } from '../src/lib/actions/projects/list-project-members';
import { listProjectShareLocationsAction } from '../src/lib/actions/projects/list-project-share-locations';
import { listProjectTransferLocationsAction } from '../src/lib/actions/projects/list-project-transfer-locations';
import { listProjectUsersAction } from '../src/lib/actions/projects/list-project-users';
import { listProjectsAction } from '../src/lib/actions/projects/list-projects';
import { listUserProjectsAction } from '../src/lib/actions/projects/list-user-projects';
import { shareProjectWithGroupAction } from '../src/lib/actions/projects/share-project-with-group';
import { starProjectAction } from '../src/lib/actions/projects/star-project';
import { unarchiveProjectAction } from '../src/lib/actions/projects/unarchive-project';
import { unstarProjectAction } from '../src/lib/actions/projects/unstar-project';
import { createGroupAction } from '../src/lib/actions/groups/create-group';
import { deleteGroupAction } from '../src/lib/actions/groups/delete-group';
import { getGroupMemberAction } from '../src/lib/actions/groups/get-group-member';
import { getGroupAction } from '../src/lib/actions/groups/get-group';
import { listGroupBillableMembersAction } from '../src/lib/actions/groups/list-group-billable-members';
import { listGroupMembersAction } from '../src/lib/actions/groups/list-group-members';
import { listGroupPendingMembersAction } from '../src/lib/actions/groups/list-group-pending-members';
import { listGroupsAction } from '../src/lib/actions/groups/list-groups';
import { updateGroupAction } from '../src/lib/actions/groups/update-group';
import { createLabelAction } from '../src/lib/actions/labels/create-label';
import { createMilestoneAction } from '../src/lib/actions/labels/create-milestone';
import { deleteLabelAction } from '../src/lib/actions/labels/delete-label';
import { deleteMilestoneAction } from '../src/lib/actions/labels/delete-milestone';
import { getLabelAction } from '../src/lib/actions/labels/get-label';
import { getMilestoneAction } from '../src/lib/actions/labels/get-milestone';
import { listLabelsAction } from '../src/lib/actions/labels/list-labels';
import { listMilestonesAction } from '../src/lib/actions/labels/list-milestones';
import { updateLabelAction } from '../src/lib/actions/labels/update-label';
import { updateMilestoneAction } from '../src/lib/actions/labels/update-milestone';
import { createProjectWebhookAction } from '../src/lib/actions/webhooks/create-project-webhook';
import { deleteProjectWebhookAction } from '../src/lib/actions/webhooks/delete-project-webhook';
import { getProjectWebhookAction } from '../src/lib/actions/webhooks/get-project-webhook';
import { listProjectWebhooksAction } from '../src/lib/actions/webhooks/list-project-webhooks';
import { updateProjectWebhookAction } from '../src/lib/actions/webhooks/update-project-webhook';
import { getMergeRequestApprovalStateAction } from '../src/lib/actions/merge-requests/get-merge-request-approval-state';
import { runAction } from './helpers';

export type Wave2Case = {
  name: string;
  action: Parameters<typeof runAction>[0]['action'];
  props: Record<string, unknown>;
  method: string;
  path: string;
  query?: Record<string, unknown>;
  body?: Record<string, unknown>;
  reply?: unknown;
  result?: unknown;
};

const P = { projectId: 'grp/proj' };
const PP = '/projects/grp%2Fproj';
const G = { groupId: 'grp/sub' };
const GP = '/groups/grp%2Fsub';
const PAGE = { page: '1', per_page: '20' };

export const wave2Cases: Wave2Case[] = [
  {
    name: 'create_pipeline',
    action: createPipelineAction,
    props: { ...P, ref: 'feat/x', variables: { DEPLOY_ENV: 'staging', DRY: 1 } },
    method: 'POST',
    path: `${PP}/pipeline`,
    body: { ref: 'feat/x', variables: [{ key: 'DEPLOY_ENV', value: 'staging', variable_type: 'env_var' }, { key: 'DRY', value: '1', variable_type: 'env_var' }] },
  },
  { name: 'get_pipeline', action: getPipelineAction, props: { ...P, pipelineId: 11 }, method: 'GET', path: `${PP}/pipelines/11` },
  {
    name: 'list_pipelines',
    action: listPipelinesAction,
    props: { ...P, status: 'failed', ref: 'main', username: '@dev', updatedAfter: '2026-10-01', orderBy: 'updated_at', sort: 'desc', page: 2, perPage: 5 },
    method: 'GET',
    path: `${PP}/pipelines`,
    query: { status: 'failed', ref: 'main', username: 'dev', updated_after: '2026-10-01', order_by: 'updated_at', sort: 'desc', page: '2', per_page: '5' },
  },
  { name: 'cancel_pipeline', action: cancelPipelineAction, props: { ...P, pipelineId: 11 }, method: 'POST', path: `${PP}/pipelines/11/cancel` },
  { name: 'retry_pipeline', action: retryPipelineAction, props: { ...P, pipelineId: 11 }, method: 'POST', path: `${PP}/pipelines/11/retry` },
  { name: 'delete_pipeline', action: deletePipelineAction, props: { ...P, pipelineId: 11 }, method: 'DELETE', path: `${PP}/pipelines/11`, reply: null, result: { deleted: true, pipelineId: 11 } },
  {
    name: 'list_pipeline_jobs',
    action: listPipelineJobsAction,
    props: { ...P, pipelineId: 11, scope: ['failed', 'manual'], includeRetried: 'true' },
    method: 'GET',
    path: `${PP}/pipelines/11/jobs`,
    query: { 'scope[]': ['failed', 'manual'], include_retried: 'true', ...PAGE },
  },
  { name: 'get_job', action: getJobAction, props: { ...P, jobId: 21 }, method: 'GET', path: `${PP}/jobs/21` },
  {
    name: 'get_job_log',
    action: getJobLogAction,
    props: { ...P, jobId: 21, maxChars: 5 },
    method: 'GET',
    path: `${PP}/jobs/21/trace`,
    reply: 'line one\nERROR',
    result: { jobId: 21, log: 'ERROR', truncated: true, totalLength: 14 },
  },
  { name: 'cancel_job', action: cancelJobAction, props: { ...P, jobId: 21 }, method: 'POST', path: `${PP}/jobs/21/cancel` },
  { name: 'play_manual_job', action: playManualJobAction, props: { ...P, jobId: 21, variables: { TARGET: 'prod' } }, method: 'POST', path: `${PP}/jobs/21/play`, body: { job_variables_attributes: [{ key: 'TARGET', value: 'prod' }] } },
  { name: 'erase_job', action: eraseJobAction, props: { ...P, jobId: 21 }, method: 'POST', path: `${PP}/jobs/21/erase` },
  {
    name: 'create_project',
    action: createProjectAction,
    props: { name: 'Demo', namespaceId: 5, visibility: 'private', initializeWithReadme: true, defaultBranch: 'main' },
    method: 'POST',
    path: '/projects',
    body: { name: 'Demo', namespace_id: 5, visibility: 'private', initialize_with_readme: true, default_branch: 'main' },
  },
  { name: 'get_project', action: getProjectAction, props: P, method: 'GET', path: PP },
  {
    name: 'list_projects',
    action: listProjectsAction,
    props: { search: 'demo', archived: 'false', orderBy: 'name', sort: 'asc' },
    method: 'GET',
    path: '/projects',
    query: { membership: 'true', search: 'demo', archived: 'false', order_by: 'name', sort: 'asc', simple: 'true', ...PAGE },
  },
  {
    name: 'delete_project',
    action: deleteProjectAction,
    props: P,
    method: 'DELETE',
    path: PP,
    reply: { message: '202 Accepted' },
    result: { deletionRequested: true, projectId: 'grp/proj', message: '202 Accepted' },
  },
  { name: 'archive_project', action: archiveProjectAction, props: P, method: 'POST', path: `${PP}/archive` },
  { name: 'unarchive_project', action: unarchiveProjectAction, props: P, method: 'POST', path: `${PP}/unarchive` },
  { name: 'fork_project', action: forkProjectAction, props: { ...P, namespacePath: 'team', path: 'copy' }, method: 'POST', path: `${PP}/fork`, body: { namespace_path: 'team', path: 'copy' } },
  {
    name: 'star_project',
    action: starProjectAction,
    props: P,
    method: 'POST',
    path: `${PP}/star`,
    reply: { id: 9, path_with_namespace: 'grp/proj', star_count: 3, name: 'proj' },
    result: { starred: true, unchanged: false, projectId: 9, path_with_namespace: 'grp/proj', star_count: 3 },
  },
  {
    name: 'unstar_project',
    action: unstarProjectAction,
    props: P,
    method: 'POST',
    path: `${PP}/unstar`,
    reply: { id: 9, path_with_namespace: 'grp/proj', star_count: 2 },
    result: { starred: false, unchanged: false, projectId: 9, path_with_namespace: 'grp/proj', star_count: 2 },
  },
  {
    name: 'get_project_languages',
    action: getProjectLanguagesAction,
    props: P,
    method: 'GET',
    path: `${PP}/languages`,
    reply: { Shell: 10.5, TypeScript: 89.5 },
    result: { languages: [{ language: 'TypeScript', percentage: 89.5 }, { language: 'Shell', percentage: 10.5 }], count: 2 },
  },
  {
    name: 'list_project_groups',
    action: listProjectGroupsAction,
    props: { ...P, search: 'a', withShared: 'true', sharedMinAccessLevel: 30 },
    method: 'GET',
    path: `${PP}/groups`,
    query: { search: 'a', with_shared: 'true', shared_min_access_level: '30', ...PAGE },
  },
  { name: 'list_project_invited_groups', action: listProjectInvitedGroupsAction, props: { ...P, minAccessLevel: 20 }, method: 'GET', path: `${PP}/invited_groups`, query: { min_access_level: '20', ...PAGE } },
  { name: 'list_project_share_locations', action: listProjectShareLocationsAction, props: { ...P, search: 'team' }, method: 'GET', path: `${PP}/share_locations`, query: { search: 'team', ...PAGE } },
  { name: 'list_project_transfer_locations', action: listProjectTransferLocationsAction, props: P, method: 'GET', path: `${PP}/transfer_locations`, query: PAGE },
  {
    name: 'share_project_with_group',
    action: shareProjectWithGroupAction,
    props: { ...P, groupId: 44, groupAccess: 30, expiresAt: '2026-12-31' },
    method: 'POST',
    path: `${PP}/share`,
    body: { group_id: 44, group_access: 30, expires_at: '2026-12-31' },
  },
  { name: 'list_user_projects', action: listUserProjectsAction, props: { userId: 15, visibility: 'public' }, method: 'GET', path: '/users/15/projects', query: { visibility: 'public', simple: 'true', ...PAGE } },
  { name: 'list_group_projects', action: listGroupProjectsAction, props: { ...G, includeSubgroups: 'true' }, method: 'GET', path: `${GP}/projects`, query: { include_subgroups: 'true', simple: 'true', ...PAGE } },
  {
    name: 'import_project_members',
    action: importProjectMembersAction,
    props: { ...P, sourceProjectId: 99 },
    method: 'POST',
    path: `${PP}/import_project_members/99`,
    reply: { status: 'success' },
    result: { status: 'success', sourceProjectId: 99, errors: [] },
  },
  { name: 'list_project_users', action: listProjectUsersAction, props: { ...P, search: 'ann' }, method: 'GET', path: `${PP}/users`, query: { search: 'ann', ...PAGE } },
  { name: 'list_project_members', action: listProjectMembersAction, props: { ...P, query: 'ann' }, method: 'GET', path: `${PP}/members/all`, query: { query: 'ann', ...PAGE } },
  { name: 'get_project_member (direct)', action: getProjectMemberAction, props: { ...P, userId: 15 }, method: 'GET', path: `${PP}/members/15` },
  { name: 'get_project_member (inherited)', action: getProjectMemberAction, props: { ...P, userId: 15, includeInherited: 'true' }, method: 'GET', path: `${PP}/members/all/15` },
  { name: 'create_group', action: createGroupAction, props: { name: 'Team', path: 'team', parentId: 7, visibility: 'private' }, method: 'POST', path: '/groups', body: { name: 'Team', path: 'team', parent_id: 7, visibility: 'private' } },
  { name: 'get_group', action: getGroupAction, props: G, method: 'GET', path: GP, query: { with_projects: 'false' } },
  { name: 'list_groups', action: listGroupsAction, props: { search: 'te', owned: 'true', topLevelOnly: 'false', minAccessLevel: 40 }, method: 'GET', path: '/groups', query: { search: 'te', owned: 'true', top_level_only: 'false', min_access_level: '40', ...PAGE } },
  { name: 'update_group', action: updateGroupAction, props: { ...G, name: 'New', clearDescription: true }, method: 'PUT', path: GP, body: { name: 'New', description: '' } },
  { name: 'delete_group', action: deleteGroupAction, props: G, method: 'DELETE', path: GP, reply: { message: '202 Accepted' }, result: { deletionRequested: true, groupId: 'grp/sub', message: '202 Accepted' } },
  { name: 'get_group_member', action: getGroupMemberAction, props: { ...G, userId: 15 }, method: 'GET', path: `${GP}/members/15` },
  { name: 'list_group_members (direct)', action: listGroupMembersAction, props: G, method: 'GET', path: `${GP}/members`, query: PAGE },
  { name: 'list_group_members (inherited)', action: listGroupMembersAction, props: { ...G, includeInherited: 'true', query: 'ann' }, method: 'GET', path: `${GP}/members/all`, query: { query: 'ann', ...PAGE } },
  { name: 'list_group_billable_members', action: listGroupBillableMembersAction, props: { groupId: 'grp', sort: 'name_asc' }, method: 'GET', path: '/groups/grp/billable_members', query: { sort: 'name_asc', ...PAGE } },
  { name: 'list_group_pending_members', action: listGroupPendingMembersAction, props: { groupId: 'grp' }, method: 'GET', path: '/groups/grp/pending_members', query: PAGE },
  { name: 'create_label', action: createLabelAction, props: { ...P, name: 'bug', color: '#FF0000', priority: 0 }, method: 'POST', path: `${PP}/labels`, body: { name: 'bug', color: '#FF0000', priority: 0 } },
  { name: 'get_label', action: getLabelAction, props: { ...P, labelId: 'needs review' }, method: 'GET', path: `${PP}/labels/needs%20review` },
  { name: 'list_labels', action: listLabelsAction, props: { ...P, search: 'bu', includeAncestorGroups: 'false' }, method: 'GET', path: `${PP}/labels`, query: { search: 'bu', include_ancestor_groups: 'false', ...PAGE } },
  { name: 'update_label', action: updateLabelAction, props: { ...P, labelId: 'bug', newName: 'defect', clearPriority: true }, method: 'PUT', path: `${PP}/labels/bug`, body: { new_name: 'defect', priority: null } },
  { name: 'delete_label', action: deleteLabelAction, props: { ...P, labelId: 'a/b' }, method: 'DELETE', path: `${PP}/labels/a%2Fb`, reply: null, result: { deleted: true, label: 'a/b' } },
  { name: 'create_milestone', action: createMilestoneAction, props: { ...P, title: 'v1', dueDate: '2026-12-01' }, method: 'POST', path: `${PP}/milestones`, body: { title: 'v1', due_date: '2026-12-01' } },
  { name: 'get_milestone', action: getMilestoneAction, props: { ...P, milestoneId: 31 }, method: 'GET', path: `${PP}/milestones/31` },
  { name: 'list_milestones', action: listMilestonesAction, props: { ...P, state: 'active', title: 'v1' }, method: 'GET', path: `${PP}/milestones`, query: { state: 'active', title: 'v1', ...PAGE } },
  { name: 'update_milestone', action: updateMilestoneAction, props: { ...P, milestoneId: 31, stateEvent: 'close', clearDueDate: true }, method: 'PUT', path: `${PP}/milestones/31`, body: { due_date: '', state_event: 'close' } },
  { name: 'delete_milestone', action: deleteMilestoneAction, props: { ...P, milestoneId: 31 }, method: 'DELETE', path: `${PP}/milestones/31`, reply: null, result: { deleted: true, milestoneId: 31 } },
  {
    name: 'create_project_webhook',
    action: createProjectWebhookAction,
    props: { ...P, url: 'https://example.com/hook', pushEvents: 'false', issuesEvents: 'true', pushEventsBranchFilter: 'main' },
    method: 'POST',
    path: `${PP}/hooks`,
    body: { url: 'https://example.com/hook', push_events: false, issues_events: true, push_events_branch_filter: 'main' },
    reply: { id: 3, url: 'https://example.com/hook', token: 'echoed' },
    result: { id: 3, url: 'https://example.com/hook' },
  },
  { name: 'get_project_webhook', action: getProjectWebhookAction, props: { ...P, hookId: 3 }, method: 'GET', path: `${PP}/hooks/3` },
  { name: 'list_project_webhooks', action: listProjectWebhooksAction, props: P, method: 'GET', path: `${PP}/hooks`, query: PAGE },
  {
    name: 'update_project_webhook',
    action: updateProjectWebhookAction,
    props: { ...P, hookId: 3, url: 'https://example.com/new', noteEvents: 'true', clearFields: ['push_events_branch_filter'] },
    method: 'PUT',
    path: `${PP}/hooks/3`,
    body: { url: 'https://example.com/new', note_events: true, push_events_branch_filter: '' },
  },
  { name: 'delete_project_webhook', action: deleteProjectWebhookAction, props: { ...P, hookId: 3 }, method: 'DELETE', path: `${PP}/hooks/3`, reply: null, result: { deleted: true, hookId: 3 } },
  { name: 'get_merge_request_approval_state', action: getMergeRequestApprovalStateAction, props: { ...P, mergeRequestIid: 4 }, method: 'GET', path: `${PP}/merge_requests/4/approval_state` },
];
