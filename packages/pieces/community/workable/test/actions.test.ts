import { addCandidateTags } from '../src/lib/actions/add-candidate-tags';
import { addComment } from '../src/lib/actions/add-comment';
import { createCandidateAi } from '../src/lib/actions/ai/create-candidate-ai';
import { moveCandidateAi } from '../src/lib/actions/ai/move-candidate-ai';
import { copyCandidateToJob } from '../src/lib/actions/copy-candidate-to-job';
import { createCandidate } from '../src/lib/actions/create-candidate';
import { disqualifyCandidate } from '../src/lib/actions/disqualify-candidate';
import { getCandidate } from '../src/lib/actions/get-candidate';
import { getCandidateActivities } from '../src/lib/actions/get-candidate-activities';
import { getJob } from '../src/lib/actions/get-job';
import { getMembers } from '../src/lib/actions/get-members';
import { getStages } from '../src/lib/actions/get-stages';
import { listAccounts } from '../src/lib/actions/list-accounts';
import { listCandidates } from '../src/lib/actions/list-candidates';
import { listDisqualificationReasons } from '../src/lib/actions/list-disqualification-reasons';
import { listJobQuestions } from '../src/lib/actions/list-job-questions';
import { listJobs } from '../src/lib/actions/list-jobs';
import { listRecruiters } from '../src/lib/actions/list-recruiters';
import { moveCandidate } from '../src/lib/actions/move-candidate';
import { rateCandidate } from '../src/lib/actions/rate-candidate';
import { revertDisqualification } from '../src/lib/actions/revert-disqualification';
import { updateCandidate } from '../src/lib/actions/update-candidate';
import { workable, workableCustomApiCall } from '../src/index';
import { accountsReply, BASE, mockHttp, runAction, SUB } from './helpers';

const S = { account_subdomain: SUB };

describe('piece metadata', () => {
  it('has the planned audiences and an outputSchema on every action and trigger', () => {
    const actions = Object.values(workable.actions()).filter((a) => a.name !== 'custom_api_call');
    expect(actions).toHaveLength(22);
    const by = (aud: string) => actions.filter((a) => a.audience === aud).map((a) => a.name).sort();
    expect(by('human')).toEqual(['create_candidate', 'moveCandidate']);
    expect(by('ai')).toEqual(['create_candidate_ai', 'move_candidate_ai']);
    expect(by('both')).toHaveLength(18);
    for (const action of actions) {
      expect(action.outputSchema, action.name).toBeDefined();
      expect(action.aiMetadata?.description, action.name).toBeTruthy();
      expect(action.classification, action.name).toBeDefined();
    }
    for (const trigger of Object.values(workable.triggers())) {
      expect(trigger.outputSchema, trigger.name).toBeDefined();
    }
  });
});

describe('read actions', () => {
  it('getCandidate resolves the subdomain once, encodes the ID and unwraps', async () => {
    const requests = mockHttp([accountsReply, { body: { candidate: { id: 'a b' } } }]);
    expect(await runAction(getCandidate)({ id: 'a b' })).toEqual({ id: 'a b' });
    expect(requests.map((r) => r.url)).toEqual(['https://workable.com/spi/v3/accounts', `${BASE}/candidates/a%20b`]);
  });

  it('getJob sends include_fields only when asked', async () => {
    const requests = mockHttp([{ body: { shortcode: 'J1' } }, { body: { shortcode: 'J1' } }]);
    await runAction(getJob)({ ...S, shortcode: 'J1' });
    await runAction(getJob)({ ...S, shortcode: 'J1', include_description: true });
    expect(requests[0].url).toBe(`${BASE}/jobs/J1`);
    expect(requests[0].queryParams).toEqual({});
    expect(requests[1].queryParams).toEqual({ include_fields: 'description,requirements,benefits' });
  });

  it('getMembers returns a page with cursor', async () => {
    const requests = mockHttp([{ body: { members: [{ id: 'm1' }], paging: { next: `${BASE}/members?since_id=m1&limit=1` } } }]);
    const result = await runAction(getMembers)({ ...S, role: 'admin', limit: 1 });
    expect(requests[0].queryParams).toEqual({ role: 'admin', limit: '1' });
    expect(result).toEqual({ members: [{ id: 'm1' }], count: 1, nextCursor: 'm1', hasMore: true });
  });

  it('getMembers refuses a limit over 100 before any request', async () => {
    const requests = mockHttp([]);
    await expect(runAction(getMembers)({ ...S, limit: 500 })).rejects.toThrow('1 to 100');
    expect(requests).toHaveLength(0);
  });

  it('getStages lists job or account stages', async () => {
    const requests = mockHttp([{ body: { stages: [{ slug: 'applied' }] } }, { body: { stages: [] } }]);
    expect(await runAction(getStages)({ ...S, shortcode: 'J1' })).toEqual({ stages: [{ slug: 'applied' }], count: 1 });
    await runAction(getStages)({ ...S });
    expect(requests.map((r) => r.url)).toEqual([`${BASE}/jobs/J1/stages`, `${BASE}/stages`]);
  });

  it('listCandidates sends filters and cursor', async () => {
    const requests = mockHttp([{ body: { candidates: [{ id: 'c1' }], paging: {} } }]);
    const result = await runAction(listCandidates)({
      ...S,
      email: 'a@example.com',
      shortcode: 'J1',
      stage: 'applied',
      created_after: '2026-10-01',
      cursor: 'c0',
      limit: '20',
    });
    expect(requests[0].url).toBe(`${BASE}/candidates`);
    expect(requests[0].queryParams).toEqual({
      email: 'a@example.com',
      shortcode: 'J1',
      stage: 'applied',
      created_after: '2026-10-01T00:00:00.000Z',
      limit: '20',
      since_id: 'c0',
    });
    expect(result).toEqual({ candidates: [{ id: 'c1' }], count: 1, nextCursor: null, hasMore: false });
  });

  it('listCandidates needs a job for a stage filter', async () => {
    mockHttp([]);
    await expect(runAction(listCandidates)({ ...S, stage: 'applied' })).rejects.toThrow('needs a Job Shortcode');
  });

  it('listJobs filters by state', async () => {
    const requests = mockHttp([{ body: { jobs: [{ shortcode: 'J1' }] } }]);
    expect(await runAction(listJobs)({ ...S, state: 'published' })).toMatchObject({ jobs: [{ shortcode: 'J1' }], hasMore: false });
    expect(requests[0].queryParams).toEqual({ state: 'published', limit: '50' });
  });

  it('listDisqualificationReasons, listRecruiters, listJobQuestions, getCandidateActivities', async () => {
    const requests = mockHttp([
      { body: { disqualification_reasons: [{ id: 'r1', name: 'Too junior' }] } },
      { body: { recruiters: [{ id: 'x' }] } },
      { body: { questions: [{ key: 'q1' }] } },
      { body: { activities: [{ id: 'a1' }] } },
    ]);
    expect(await runAction(listDisqualificationReasons)(S)).toEqual({ reasons: [{ id: 'r1', name: 'Too junior' }], count: 1 });
    expect(await runAction(listRecruiters)({ ...S, shortcode: 'J1' })).toEqual({ recruiters: [{ id: 'x' }], count: 1 });
    expect(await runAction(listJobQuestions)({ ...S, shortcode: 'J1' })).toEqual({ questions: [{ key: 'q1' }], count: 1 });
    expect(await runAction(getCandidateActivities)({ ...S, id: 'c1' })).toEqual({ activities: [{ id: 'a1' }], count: 1 });
    expect(requests.map((r) => r.url)).toEqual([
      `${BASE}/disqualification_reasons`,
      `${BASE}/jobs/J1/recruiters`,
      `${BASE}/jobs/J1/questions`,
      `${BASE}/candidates/c1/activities`,
    ]);
  });

  it('listAccounts returns every account', async () => {
    mockHttp([{ body: { accounts: [{ subdomain: 'a' }, { subdomain: 'b' }] } }]);
    expect(await runAction(listAccounts)({})).toEqual({ accounts: [{ subdomain: 'a' }, { subdomain: 'b' }], count: 2 });
  });
});

describe('write actions', () => {
  it('moveCandidate (human) and move_candidate_ai post the same body and return the ID', async () => {
    const requests = mockHttp([{ status: 202, body: ' ' }, { status: 202, body: ' ' }]);
    const human = await runAction(moveCandidate)({ ...S, id: 'c1', job: 'J1', target_stage: 'interview', member_id: 'm1' });
    const ai = await runAction(moveCandidateAi)({ ...S, id: 'c1', target_stage: 'interview', member_id: 'm1' });
    expect(human).toEqual({ success: true, candidate_id: 'c1', target_stage: 'interview' });
    expect(ai).toEqual(human);
    for (const r of requests) {
      expect(r.method).toBe('POST');
      expect(r.url).toBe(`${BASE}/candidates/c1/move`);
      expect(r.body).toEqual({ member_id: 'm1', target_stage: 'interview' });
    }
  });

  it('rateCandidate validates the grade per scale before any request', async () => {
    const requests = mockHttp([{ status: 201, body: '' }]);
    await expect(runAction(rateCandidate)({ ...S, id: 'c1', member_id: 'm1', comment: 'ok', scale: 'thumbs', grade: 3 })).rejects.toThrow('0 to 2');
    await expect(runAction(rateCandidate)({ ...S, id: 'c1', member_id: 'm1', comment: 'ok', scale: 'stars', grade: 1.5 })).rejects.toThrow('whole number');
    expect(requests).toHaveLength(0);
    const result = await runAction(rateCandidate)({ ...S, id: 'c1', member_id: 'm1', comment: 'ok', scale: 'numbers', grade: '9' });
    expect(result).toEqual({ success: true, candidate_id: 'c1', scale: 'numbers', grade: 9 });
    expect(requests[0].body).toEqual({ member_id: 'm1', comment: 'ok', scale: 'numbers', grade: 9 });
  });

  const candidateProps = {
    firstname: 'Jane',
    lastname: 'Doe',
    email: 'odai+wk1@example.com',
    headline: '',
    skills: ['Go', 'go', 'Rust'],
    tags: [],
  };

  it('create_candidate posts to the job with stage and sourced true', async () => {
    const requests = mockHttp([{ status: 201, body: { status: 'created', candidate: { id: 'c9' } } }]);
    const result = await runAction(createCandidate)({ ...S, job: 'J1', stage: 'applied', ...candidateProps });
    expect(requests[0].url).toBe(`${BASE}/jobs/J1/candidates`);
    expect(requests[0].queryParams).toEqual({ stage: 'applied' });
    expect(requests[0].body).toEqual({
      sourced: true,
      candidate: { firstname: 'Jane', lastname: 'Doe', email: 'odai+wk1@example.com', skills: ['Go', 'go', 'Rust'] },
    });
    expect(result).toEqual({ id: 'c9', talent_pool: false });
  });

  it('create_candidate_ai without a job goes to the talent pool and ignores stage', async () => {
    const requests = mockHttp([{ status: 201, body: { candidate: { id: 'c10' } } }]);
    const result = await runAction(createCandidateAi)({ ...S, stage: 'applied', sourced: false, ...candidateProps });
    expect(requests[0].url).toBe(`${BASE}/talent_pool/candidates`);
    expect(requests[0].queryParams).toEqual({});
    expect(requests[0].body).toMatchObject({ sourced: false });
    expect(result).toEqual({ id: 'c10', talent_pool: true });
  });

  it('create_candidate explains duplicates and checks required fields', async () => {
    mockHttp([{ error: { status: 422, body: { error: 'Validation failed', validation_errors: { email: ['candidate already exists'] } } } }]);
    await expect(runAction(createCandidateAi)({ ...S, job_shortcode: 'J1', ...candidateProps })).rejects.toThrow('Use List Candidates');
    await expect(runAction(createCandidateAi)({ ...S, firstname: 'A', lastname: 'B' })).rejects.toThrow('Email is required');
    await expect(runAction(createCandidateAi)({ ...S, ...candidateProps, resume_url: 'file:///etc/passwd' })).rejects.toThrow('http');
  });

  it('update_candidate sends only given fields, clears on request, refuses empty', async () => {
    const requests = mockHttp([{ body: { candidate: { id: 'c1' } } }]);
    await expect(runAction(updateCandidate)({ ...S, id: 'c1' })).rejects.toThrow('Nothing to update');
    await expect(runAction(updateCandidate)({ ...S, id: 'c1', phone: '1', clear_fields: ['phone'] })).rejects.toThrow('both set and cleared');
    expect(requests).toHaveLength(0);
    const result = await runAction(updateCandidate)({ ...S, id: 'c1', phone: '+1 555', headline: '', clear_fields: ['summary'] });
    expect(requests[0].method).toBe('PATCH');
    expect(requests[0].url).toBe(`${BASE}/candidates/c1`);
    expect(requests[0].body).toEqual({ candidate: { phone: '+1 555', summary: '' } });
    expect(result).toEqual({ id: 'c1' });
  });

  it('add_comment posts body and policy', async () => {
    const requests = mockHttp([{ status: 201, body: '' }]);
    expect(await runAction(addComment)({ ...S, id: 'c1', member_id: 'm1', body: 'Hi', policy: ['simple'] })).toEqual({ success: true, candidate_id: 'c1' });
    expect(requests[0].url).toBe(`${BASE}/candidates/c1/comments`);
    expect(requests[0].body).toEqual({ member_id: 'm1', comment: { body: 'Hi', policy: ['simple'] } });
  });

  it('disqualify checks the note length and revert posts member_id', async () => {
    const requests = mockHttp([{ body: ' ' }, { body: ' ' }]);
    await expect(runAction(disqualifyCandidate)({ ...S, id: 'c1', member_id: 'm1', disqualify_note: 'x'.repeat(257) })).rejects.toThrow('at most 256');
    expect(await runAction(disqualifyCandidate)({ ...S, id: 'c1', member_id: 'm1', disqualify_reason_id: 'r1', withdrew: true })).toEqual({
      success: true,
      candidate_id: 'c1',
      disqualified: true,
    });
    expect(requests[0].body).toEqual({ member_id: 'm1', disqualify_reason_id: 'r1', withdrew: true });
    expect(await runAction(revertDisqualification)({ ...S, id: 'c1', member_id: 'm1' })).toMatchObject({ disqualified: false });
    expect(requests[1].url).toBe(`${BASE}/candidates/c1/revert`);
    expect(requests[1].body).toEqual({ member_id: 'm1' });
  });

  it('add_candidate_tags keeps existing tags and skips the PUT when nothing is new', async () => {
    const requests = mockHttp([
      { body: { candidate: { tags: ['Referral'] } } },
      { status: 202, body: { tags: ['Referral', 'senior'] } },
      { body: { candidate: { tags: ['Referral', 'senior'] } } },
    ]);
    expect(await runAction(addCandidateTags)({ ...S, id: 'c1', tags: ['referral', 'senior'] })).toEqual({
      candidate_id: 'c1',
      tags: ['Referral', 'senior'],
      added: ['senior'],
    });
    expect(requests[1].method).toBe('PUT');
    expect(requests[1].body).toEqual({ tags: ['Referral', 'senior'] });
    expect(await runAction(addCandidateTags)({ ...S, id: 'c1', tags: ['senior'] })).toMatchObject({ added: [] });
    expect(requests).toHaveLength(3);
  });

  it('copy_candidate_to_job posts the target and returns the new candidate', async () => {
    const requests = mockHttp([{ status: 201, body: { candidate: { id: 'c2' } } }]);
    expect(await runAction(copyCandidateToJob)({ ...S, id: 'c1', member_id: 'm1', target_job_shortcode: 'J2', target_stage: 'applied' })).toEqual({
      source_candidate_id: 'c1',
      target_job_shortcode: 'J2',
      candidate: { id: 'c2' },
    });
    expect(requests[0].url).toBe(`${BASE}/candidates/c1/copy`);
    expect(requests[0].body).toEqual({ member_id: 'm1', target_job_shortcode: 'J2', target_stage: 'applied' });
  });

  it('copy_candidate_to_job uses the first stage of the target job when no stage is given', async () => {
    const requests = mockHttp([{ body: { stages: [{ slug: 'sourced' }, { slug: 'applied' }] } }, { status: 201, body: { candidate: { id: 'c2' } } }]);
    await runAction(copyCandidateToJob)({ ...S, id: 'c1', member_id: 'm1', target_job_shortcode: 'J2' });
    expect(requests[0].url).toBe(`${BASE}/jobs/J2/stages`);
    expect(requests[1].body).toEqual({ member_id: 'm1', target_job_shortcode: 'J2', target_stage: 'sourced' });
  });

  it('add_candidate_tags reports the tags Workable actually saved', async () => {
    mockHttp([{ body: { candidate: { tags: [] } } }, { status: 202, body: { tags: ['ap'] } }]);
    expect(await runAction(addCandidateTags)({ ...S, id: 'c1', tags: ['ap-live'] })).toEqual({ candidate_id: 'c1', tags: ['ap'], added: ['ap'] });
  });

  it('create_candidate explains the live duplicate-email message', async () => {
    mockHttp([{ error: { status: 422, body: { validation_errors: { email: ['This email address is already being used by another candidate'] } } } }]);
    await expect(runAction(createCandidateAi)({ ...S, job_shortcode: 'J1', ...candidateProps })).rejects.toThrow('Use List Candidates');
  });

  it('rateCandidate explains a refused second rating', async () => {
    mockHttp([{ error: { status: 422, body: '' } }]);
    await expect(runAction(rateCandidate)({ ...S, id: 'c1', member_id: 'm1', comment: 'ok', scale: 'stars', grade: 3 })).rejects.toThrow('one rating per member');
  });
});

describe('custom API call', () => {
  const base = { method: 'GET', headers: {}, queryParams: {}, body_type: 'none', failsafe: false };

  it('resolves relative paths against the account subdomain', async () => {
    const requests = mockHttp([accountsReply, { body: { jobs: [] } }]);
    await runAction(workableCustomApiCall)({ ...base, url: { url: '/jobs' } });
    expect(requests).toHaveLength(2);
    const sent = requests[1];
    expect(sent.url).toBe(`${BASE}/jobs`);
    expect(sent.headers?.['Authorization']).toBe('Bearer test-token-123');
  });

  it('uses the same runner for test steps as for runs', () => {
    expect(workableCustomApiCall.test).toBe(workableCustomApiCall.run);
  });

  it('refuses to send the token to another host', async () => {
    const requests = mockHttp([]);
    await expect(
      runAction(workableCustomApiCall)({ ...base, account_subdomain: SUB, url: { url: 'https://acme.workable.com.evil.io/spi/v3/jobs' } }),
    ).rejects.toThrow('only sends your token');
    expect(requests).toHaveLength(0);
  });
});
