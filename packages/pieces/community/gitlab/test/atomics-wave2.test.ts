import { afterEach, describe, expect, it, vi } from 'vitest';
import { gitlab } from '../src';
import { createPipelineAction } from '../src/lib/actions/ci/create-pipeline';
import { getPipelineAction } from '../src/lib/actions/ci/get-pipeline';
import { getJobLogAction } from '../src/lib/actions/ci/get-job-log';
import { listPipelineJobsAction } from '../src/lib/actions/ci/list-pipeline-jobs';
import { createProjectAction } from '../src/lib/actions/projects/create-project';
import { listProjectsAction } from '../src/lib/actions/projects/list-projects';
import { archiveProjectAction } from '../src/lib/actions/projects/archive-project';
import { forkProjectAction } from '../src/lib/actions/projects/fork-project';
import { starProjectAction } from '../src/lib/actions/projects/star-project';
import { unstarProjectAction } from '../src/lib/actions/projects/unstar-project';
import { importProjectMembersAction } from '../src/lib/actions/projects/import-project-members';
import { shareProjectWithGroupAction } from '../src/lib/actions/projects/share-project-with-group';
import { updateGroupAction } from '../src/lib/actions/groups/update-group';
import { createLabelAction } from '../src/lib/actions/labels/create-label';
import { updateLabelAction } from '../src/lib/actions/labels/update-label';
import { createMilestoneAction } from '../src/lib/actions/labels/create-milestone';
import { updateMilestoneAction } from '../src/lib/actions/labels/update-milestone';
import { createProjectWebhookAction } from '../src/lib/actions/webhooks/create-project-webhook';
import { updateProjectWebhookAction } from '../src/lib/actions/webhooks/update-project-webhook';
import { listProjectWebhooksAction } from '../src/lib/actions/webhooks/list-project-webhooks';
import { getMergeRequestApprovalStateAction } from '../src/lib/actions/merge-requests/get-merge-request-approval-state';
import { rawPath, runAction, stubGitlab } from './helpers';
import { wave2Cases } from './wave2-cases';

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

const P = { projectId: 'grp/proj' };

describe('wave 2: exact outgoing request per atomic', () => {
  it.each(wave2Cases)('$name', async (testCase) => {
    const isList = testCase.query !== undefined && 'per_page' in testCase.query;
    const reply = testCase.reply === null ? { status: 204 } : { body: testCase.reply ?? (isList ? [] : { id: 1 }) };
    const seen = stubGitlab([reply]);
    const result = await runAction({ action: testCase.action, propsValue: testCase.props });
    expect(seen).toHaveLength(1);
    expect(seen[0].method).toBe(testCase.method);
    expect(rawPath(seen[0])).toBe(testCase.path);
    expect(seen[0].query).toEqual(testCase.query ?? {});
    expect(seen[0].body).toEqual(testCase.body);
    if (testCase.result !== undefined) {
      expect(result).toEqual(testCase.result);
    }
  });

  it('registers all 58 wave-2 actions', () => {
    const names = new Set(wave2Cases.map((c) => c.action.name));
    expect(names.size).toBe(58);
    const registered = Object.keys(gitlab.actions());
    expect([...names].filter((name) => !registered.includes(name))).toEqual([]);
  });
});

describe('wave 2: metadata', () => {
  const names = new Set(wave2Cases.map((c) => c.action.name));
  const actions = Object.values(gitlab.actions()).filter((a) => names.has(a.name));

  it('every wave-2 action is ai with aiMetadata and an outputSchema', () => {
    for (const action of actions) {
      expect(action.audience, action.name).toBe('ai');
      expect(action.aiMetadata?.description, action.name).toBeTruthy();
      expect(typeof action.aiMetadata?.idempotent, action.name).toBe('boolean');
      expect(action.outputSchema, action.name).toBeDefined();
    }
  });

  it('classifies delete, cancel, archive and erase as DESTRUCTIVE and unarchive / unstar as WRITE', () => {
    const destructive = actions.filter((a) => a.classification === 'DESTRUCTIVE').map((a) => a.name).sort();
    expect(destructive).toEqual(
      ['archive_project', 'cancel_job', 'cancel_pipeline', 'delete_group', 'delete_label', 'delete_milestone', 'delete_pipeline', 'delete_project', 'delete_project_webhook', 'erase_job'].sort()
    );
    const byName = Object.fromEntries(actions.map((a) => [a.name, a]));
    expect(byName['unarchive_project'].classification).toBe('WRITE');
    expect(byName['unstar_project'].classification).toBe('WRITE');
    expect(byName['list_projects'].classification).toBe('SEARCH');
    expect(byName['get_project'].classification).toBe('READ');
  });

  it('aiMetadata only names actions that agents can see', () => {
    const all = Object.values(gitlab.actions());
    const hidden = all.filter((a) => a.audience === 'human').map((a) => a.displayName);
    for (const action of actions) {
      for (const name of hidden) {
        expect(action.aiMetadata?.description?.includes(name), `${action.name} names ${name}`).toBe(false);
      }
    }
  });
});

describe('wave 2: rule checks', () => {
  it('validates inputs before any request', async () => {
    const seen = stubGitlab([]);
    await expect(runAction({ action: getPipelineAction, propsValue: { ...P, pipelineId: -1 } })).rejects.toThrow('positive whole number');
    await expect(runAction({ action: createPipelineAction, propsValue: { ...P, ref: 'main', variables: { 'BAD-NAME': 'x' } } })).rejects.toThrow('letters, digits');
    await expect(runAction({ action: createPipelineAction, propsValue: { ...P, ref: ' ' } })).rejects.toThrow('Branch or Tag is required');
    await expect(runAction({ action: getJobLogAction, propsValue: { ...P, jobId: 1, maxChars: 200000 } })).rejects.toThrow('at most');
    await expect(runAction({ action: listPipelineJobsAction, propsValue: { ...P, pipelineId: 1, scope: ['exploded'] } })).rejects.toThrow('Unknown job status');
    await expect(runAction({ action: createProjectAction, propsValue: {} })).rejects.toThrow('Name or a Path');
    await expect(runAction({ action: listProjectsAction, propsValue: { membership: 'false' } })).rejects.toThrow('Member Only');
    await expect(runAction({ action: forkProjectAction, propsValue: { ...P, namespaceId: 3, namespacePath: 'x' } })).rejects.toThrow('not both');
    await expect(runAction({ action: shareProjectWithGroupAction, propsValue: { ...P, groupId: 4, groupAccess: 25 } })).rejects.toThrow('Access Level must be one of');
    await expect(runAction({ action: updateGroupAction, propsValue: { groupId: 'g', clearDescription: false } })).rejects.toThrow('Set at least one field');
    await expect(runAction({ action: createLabelAction, propsValue: { ...P, name: 'x', color: 'red; drop' } })).rejects.toThrow('hex color');
    await expect(runAction({ action: updateLabelAction, propsValue: { ...P, labelId: 'x' } })).rejects.toThrow('Set at least one field');
    await expect(runAction({ action: createMilestoneAction, propsValue: { ...P, title: 'v', dueDate: 'next week' } })).rejects.toThrow('YYYY-MM-DD');
    await expect(runAction({ action: updateMilestoneAction, propsValue: { ...P, milestoneId: 1 } })).rejects.toThrow('Set at least one field');
    await expect(runAction({ action: createProjectWebhookAction, propsValue: { ...P, url: 'ftp://x.example' } })).rejects.toThrow('http');
    await expect(runAction({ action: updateProjectWebhookAction, propsValue: { ...P, hookId: 1 } })).rejects.toThrow('URL');
    await expect(runAction({ action: updateProjectWebhookAction, propsValue: { ...P, hookId: 1, url: 'https://x.example', description: 'd', clearFields: ['description'] } })).rejects.toThrow('both set and cleared');
    await expect(runAction({ action: updateProjectWebhookAction, propsValue: { ...P, hookId: 1, url: 'https://x.example', clearFields: ['token'] } })).rejects.toThrow('Unknown field');
    expect(seen).toHaveLength(0);
  });

  it('list_projects can drop membership only with a search or owned filter', async () => {
    const seen = stubGitlab([{ body: [] }]);
    await runAction({ action: listProjectsAction, propsValue: { membership: 'false', search: 'kube' } });
    expect(seen[0].query).toEqual({ search: 'kube', simple: 'true', page: '1', per_page: '20' });
  });

  it('star and unstar treat 304 as unchanged, read the project, and rethrow other errors', async () => {
    const seen = stubGitlab([
      { status: 304 },
      { body: { id: 9, path_with_namespace: 'grp/proj', star_count: 1 } },
      { status: 304 },
      { body: { id: 9, path_with_namespace: 'grp/proj', star_count: 1 } },
      { status: 403, body: { message: 'Forbidden' } },
    ]);
    expect(await runAction({ action: starProjectAction, propsValue: P })).toEqual({ starred: true, unchanged: true, projectId: 9, path_with_namespace: 'grp/proj', star_count: 1 });
    expect(await runAction({ action: unstarProjectAction, propsValue: P })).toMatchObject({ starred: false, unchanged: true });
    expect(seen.map((s) => s.method)).toEqual(['POST', 'GET', 'POST', 'GET']);
    await expect(runAction({ action: starProjectAction, propsValue: P })).rejects.toThrow(/HTTP 403/);
  });

  it('import_project_members surfaces per-user errors instead of failing', async () => {
    stubGitlab([
      { status: 422, body: { status: 'error', message: { ann: 'Access level should be greater than or equal to Developer inherited membership' } } },
      { status: 422, body: { message: 'other' } },
    ]);
    expect(await runAction({ action: importProjectMembersAction, propsValue: { ...P, sourceProjectId: 12 } })).toEqual({
      status: 'error',
      sourceProjectId: 12,
      errors: [{ user: 'ann', message: 'Access level should be greater than or equal to Developer inherited membership' }],
    });
    await expect(runAction({ action: importProjectMembersAction, propsValue: { ...P, sourceProjectId: 12 } })).rejects.toThrow(/HTTP 422/);
  });

  it('archive_project treats already archived as success and rethrows other 400s', async () => {
    const seen = stubGitlab([
      { status: 400, body: { message: 'Project is already archived.' } },
      { body: { id: 9, archived: true } },
      { status: 400, body: { message: 'Something else' } },
    ]);
    expect(await runAction({ action: archiveProjectAction, propsValue: P })).toEqual({ id: 9, archived: true });
    expect(seen.map((s) => s.method)).toEqual(['POST', 'GET']);
    await expect(runAction({ action: archiveProjectAction, propsValue: P })).rejects.toThrow(/HTTP 400/);
  });

  it('import_project_members refuses a path as the source before any request', async () => {
    const seen = stubGitlab([]);
    await expect(runAction({ action: importProjectMembersAction, propsValue: { ...P, sourceProjectId: 'grp/other' } })).rejects.toThrow('positive whole number');
    expect(seen).toHaveLength(0);
  });

  it('get_job_log removes terminal color codes and carriage returns', async () => {
    stubGitlab([{ body: '\u001b[32;1mJob succeeded\u001b[0;m\r\n' }]);
    expect(await runAction({ action: getJobLogAction, propsValue: { ...P, jobId: 2 } })).toEqual({ jobId: 2, log: 'Job succeeded\n', truncated: false, totalLength: 14 });
  });

  it('get_job_log drops section markers and keeps the last carriage-return rewrite', async () => {
    stubGitlab([{ body: 'section_start:1700000000:step_script[collapsed=true]\r\u001b[0KRun\nprogress 10%\rprogress 100%\nsection_end:1700000001:step_script\r\u001b[0K\n' }]);
    expect(await runAction({ action: getJobLogAction, propsValue: { ...P, jobId: 2 } })).toMatchObject({ log: 'Run\nprogress 100%\n\n' });
  });

  it('get_job_log keeps a line that ends in repeated carriage returns', async () => {
    stubGitlab([{ body: 'ERROR: build failed\r\r\nnext\r\r' }]);
    expect(await runAction({ action: getJobLogAction, propsValue: { ...P, jobId: 2 } })).toMatchObject({ log: 'ERROR: build failed\nnext' });
  });

  it('get_job_log returns a short log whole', async () => {
    stubGitlab([{ body: 'all good' }]);
    expect(await runAction({ action: getJobLogAction, propsValue: { ...P, jobId: 2 } })).toEqual({ jobId: 2, log: 'all good', truncated: false, totalLength: 8 });
  });

  it('update_project_webhook sends only the given URL, never reads it back, and strips tokens', async () => {
    const seen = stubGitlab([{ body: { id: 3, url: 'https://keep.example/h', token: 'x' } }]);
    const result = await runAction({ action: updateProjectWebhookAction, propsValue: { ...P, hookId: 3, url: 'https://keep.example/h', pipelineEvents: 'false', clearFields: ['description'] } });
    expect(seen.map((s) => s.method)).toEqual(['PUT']);
    expect(seen[0].body).toEqual({ url: 'https://keep.example/h', pipeline_events: false, description: '' });
    expect(result).toEqual({ id: 3, url: 'https://keep.example/h' });
  });

  it('webhook actions take no secret token input', () => {
    expect(Object.keys(createProjectWebhookAction.props)).not.toContain('token');
    expect(Object.keys(updateProjectWebhookAction.props)).not.toContain('token');
  });

  it('list_project_webhooks strips tokens and keeps paging', async () => {
    stubGitlab([{ body: [{ id: 1, url: 'https://a.example', token: 't' }], headers: { 'x-next-page': '2' } }]);
    const result = await runAction({ action: listProjectWebhooksAction, propsValue: P });
    expect(result).toHaveProperty('items', [{ id: 1, url: 'https://a.example' }]);
    expect(result).toHaveProperty('nextPage', 2);
  });

  it('approval_state explains the Premium requirement on 403', async () => {
    stubGitlab([{ status: 403, body: { message: '403 Forbidden' } }]);
    await expect(runAction({ action: getMergeRequestApprovalStateAction, propsValue: { ...P, mergeRequestIid: 1 } })).rejects.toThrow(/Premium/);
  });
});
