import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { addCaseCommentAction } from '../../src/lib/actions/add-case-comment';
import { createCaseAction } from '../../src/lib/actions/create-case';
import { updateCaseAction } from '../../src/lib/actions/update-case';
import { sprinklrCase } from '../../src/lib/common/case';
import { sprinklrTiming } from '../../src/lib/common/client';
import { FakeSprinklr, FAKE_SPRINKLR_CLIENT, startFakeSprinklr } from '../support/fake-sprinklr';
import { pieceRunner, shape } from '../support/piece-runner';

function authFor(fake: FakeSprinklr) {
  return {
    access_token: fake.control.issueToken().accessToken,
    client_id: FAKE_SPRINKLR_CLIENT.apiKey,
    props: { base: fake.baseUrl, callback: 'https://cloud.activepieces.com/redirect' },
  };
}

describe.each(['wrapped', 'bare'] as const)('write actions against the fake Sprinklr (%s responses)', (envelope) => {
  let fake: FakeSprinklr;

  beforeEach(async () => {
    vi.spyOn(sprinklrTiming, 'sleep').mockResolvedValue(undefined);
    fake = await startFakeSprinklr({ envelope });
  });

  afterEach(async () => {
    vi.restoreAllMocks();
    await fake.close();
  });

  it('creates, gets, updates and comments on a case, and never sends PUT', async () => {
    const auth = authFor(fake);
    const created = await pieceRunner.runAction({ action: createCaseAction, auth, propsValue: {
      subject: 'Order arrived damaged',
      description: 'Broken lid',
      channel: 'EMAIL',
      contact: 'jane@example.com',
      contact_name: 'Jane Doe',
      priority: 'High',
      case_type: 'Complaint',
      queue_id: '103197',
      custom_fields: { spr_uc_type: 'Complaint', order_number_cf: 'A-10045' },
      first_comment: 'Opened from a flow.',
    } });
    expect(created).toMatchObject({
      subject: expect.stringMatching(/^#\d+ Email Order arrived damaged$/),
      description: 'Broken lid',
      status: 'New',
      priority: 'High',
      caseType: 'Complaint',
      contact: { channelType: 'EMAIL', channelId: 'jane@example.com', name: 'Jane Doe' },
      workflow: { customProperties: { spr_uc_type: ['Complaint'], order_number_cf: ['A-10045'] }, queues: [{ queueId: '103197' }] },
    });
    const caseNumber = sprinklrCase.normalize(created).caseNumber;
    expect(typeof caseNumber).toBe('number');
    expect(fake.state.comments).toEqual([expect.objectContaining({ entityId: String(caseNumber), text: 'Opened from a flow.' })]);

    const fetched = await sprinklrCase.getByNumber({ auth, caseNumber: String(caseNumber) });
    expect(fetched).toEqual(created);

    const updated = await pieceRunner.runAction({ action: updateCaseAction, auth, propsValue: {
      case_number: String(caseNumber),
      status: 'Closed',
      summary: 'Replacement sent',
      assignee_id: '60000123',
      add_queue_ids: ['5001'],
      remove_queue_ids: ['103197'],
      custom_fields: { spr_uc_type: 'Refund' },
    } });
    expect(updated).toMatchObject({
      caseNumber,
      status: 'Closed',
      summary: 'Replacement sent',
      priority: 'High',
      description: 'Broken lid',
      version: 1,
      workflow: {
        assignment: { assigneeId: '60000123', assigneeType: 'USER' },
        customProperties: { spr_uc_type: ['Refund'], order_number_cf: ['A-10045'] },
        queues: [{ queueId: '5001' }],
      },
    });

    const comment = await pieceRunner.runAction({ action: addCaseCommentAction, auth, propsValue: { case_number: caseNumber, comment: 'Closed by the flow.', is_private: true } });
    expect(comment).toMatchObject({ text: 'Closed by the flow.', entityType: 'CASE', entityId: String(caseNumber), commentingUser: '60000000' });
    expect(typeof shape.record(comment)['id']).toBe('string');
    expect(fake.state.comments.at(-1)).toMatchObject({ isPrivate: true, entityId: String(caseNumber) });

    const methods = fake.state.requests.filter((r) => r.path.startsWith('/api/v3/case')).map((r) => r.method);
    expect(methods).toEqual(['POST', 'GET', 'PATCH', 'GET']);
    expect(fake.state.requests.map((r) => r.method)).not.toContain('PUT');
  });

  it('sends a create once when the fake answers with a server error', async () => {
    const auth = authFor(fake);
    fake.control.failNext(1, '500-html');
    await expect(
      pieceRunner.runAction({ action: createCaseAction, auth, propsValue: { subject: 'S', channel: 'SMS', contact: '+12025550123' } })
    ).rejects.toThrow('may still have gone through');
    expect(fake.state.requests.filter((r) => r.method === 'POST' && r.path.startsWith('/api/v3/case'))).toHaveLength(1);
    expect(fake.state.cases).toHaveLength(0);
  });

  it('reports a missing case on update with the not-found message', async () => {
    const auth = authFor(fake);
    await expect(pieceRunner.runAction({ action: updateCaseAction, auth, propsValue: { case_number: '999', status: 'Closed' } })).rejects.toThrow('Sprinklr found nothing');
  });

  it('comments on a seeded case by its number', async () => {
    const auth = authFor(fake);
    const [seeded] = fake.control.seedCases(1);
    const comment = await pieceRunner.runAction({ action: addCaseCommentAction, auth, propsValue: { case_number: `#${seeded.caseNumber}`, comment: 'Hello' } });
    expect(comment).toMatchObject({ entityId: String(seeded.caseNumber), text: 'Hello', entityType: 'CASE' });
  });
});
