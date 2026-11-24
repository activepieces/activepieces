import { httpClient } from '@activepieces/pieces-common';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { firsttouch } from '../src';

const auth = { secret_text: 'ftmcp_test' };

function ok(body: unknown) {
  return { status: 200, headers: {}, body };
}

function failure({ status, body }: { status: number; body: unknown }) {
  return Object.assign(new Error('http'), { response: { status, body, headers: {} } });
}

function mockSeq(...bodies: unknown[]) {
  const spy = vi.spyOn(httpClient, 'sendRequest');
  for (const b of bodies) {
    if (b instanceof Error) spy.mockRejectedValueOnce(b);
    else spy.mockResolvedValueOnce(ok(b));
  }
  return spy;
}

function runAction({ name, propsValue }: { name: string; propsValue: Record<string, unknown> }) {
  const found = firsttouch.actions()[name];
  if (!found) throw new Error(`missing ${name}`);
  return Reflect.apply(found.run, undefined, [{ auth, propsValue }]);
}

function memoryStore() {
  const data = new Map<string, unknown>();
  return {
    put: async (key: string, value: unknown) => {
      data.set(key, value);
      return value;
    },
    get: async (key: string) => (data.has(key) ? data.get(key) : null),
    delete: async (key: string) => {
      data.delete(key);
    },
  };
}

function trigger(name: string) {
  const found = firsttouch.triggers()[name];
  if (!found) throw new Error(`missing ${name}`);
  return found;
}

function requestBody(spy: ReturnType<typeof mockSeq>, index = 0) {
  return spy.mock.calls[index][0].body;
}

function requestUrl(spy: ReturnType<typeof mockSeq>, index = 0) {
  return spy.mock.calls[index][0].url;
}

const connectionsPage = (rows: { member: string; at: string }[]) => ({
  connections: {
    items: rows.map((row) => ({
      owner: { userId: 'u1', name: 'Alex Smith', email: 'alex@example.com' },
      linkedinAccount: { linAccountId: 'lin_1' },
      connection: {
        memberId: row.member,
        publicIdentifier: row.member.toLowerCase(),
        publicProfileUrl: `https://www.linkedin.com/in/${row.member.toLowerCase()}`,
        firstName: 'Jane',
        lastName: 'Doe',
        fullName: 'Jane Doe',
        headline: 'VP Sales',
        connectedAtUtc: row.at,
      },
    })),
  },
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('metadata', () => {
  it('registers 6 actions plus custom api call and 3 triggers', () => {
    expect(Object.keys(firsttouch.actions()).sort()).toEqual(
      [
        'check_connection_status',
        'custom_api_call',
        'enroll_contact_in_flow',
        'send_connection_request',
        'send_inmail',
        'send_message',
        'view_profile',
      ].sort(),
    );
    expect(Object.keys(firsttouch.triggers()).sort()).toEqual(
      ['connection_accepted', 'new_linkedin_reply', 'new_social_engager'].sort(),
    );
  });
  it('every hand-written action has audience, aiMetadata and classification', () => {
    for (const action of Object.values(firsttouch.actions())) {
      if (action.name === 'custom_api_call') continue;
      expect(action.audience, action.name).toBe('both');
      expect(action.aiMetadata?.description, action.name).toBeTruthy();
      expect(typeof action.aiMetadata?.idempotent, action.name).toBe('boolean');
      expect(action.classification, action.name).toBeTruthy();
    }
  });
  it('every trigger is READ with aiMetadata and sample data', () => {
    for (const t of Object.values(firsttouch.triggers())) {
      expect(t.classification, t.name).toBe('READ');
      expect(t.aiMetadata?.description, t.name).toBeTruthy();
      expect(Object.keys(t.sampleData ?? {}).length, t.name).toBeGreaterThan(0);
    }
  });
});

describe('check_connection_status', () => {
  it('normalizes the URL and flattens the result', async () => {
    const spy = mockSeq(connectionsPage([{ member: 'JANE', at: '2026-11-24T12:00:00Z' }]));
    const result = await runAction({
      name: 'check_connection_status',
      propsValue: { linkedin_url: 'linkedin.com/in/jane-doe?utm=x' },
    });
    expect(requestUrl(spy)).toBe('https://gateway.firsttouch.ai/api/public/tools/list_linkedin_team_connections');
    expect(spy.mock.calls[0][0].headers).toMatchObject({ 'X-API-Key': 'ftmcp_test' });
    expect(requestBody(spy)).toMatchObject({
      mode: 'team_members_connected_to_person',
      connectedPersonLinkedInUrl: 'https://www.linkedin.com/in/jane-doe',
    });
    expect(result).toMatchObject({ is_connected: true, connected_teammates: 'Alex Smith', connected_at: '2026-11-24T12:00:00Z' });
  });
  it('rejects company and post URLs with a plain message', async () => {
    await expect(
      runAction({ name: 'check_connection_status', propsValue: { linkedin_url: 'https://www.linkedin.com/company/acme/posts' } }),
    ).rejects.toThrow(/not a LinkedIn profile URL for a person/);
  });
});

describe('enroll_contact_in_flow', () => {
  it('sends full nullable prospect and company objects with custom variables', async () => {
    const spy = mockSeq({ candidateId: 'c1', status: 'awaiting' });
    const result = await runAction({
      name: 'enroll_contact_in_flow',
      propsValue: { flow: 'flow_plan_1', email: 'jane@acme.com', custom_variables: { job_title: 'VP Sales', ' ': 'x' } },
    });
    expect(requestBody(spy)).toEqual({
      flowPlanId: 'flow_plan_1',
      includeWorkspaceRefresh: false,
      manualEnrollment: {
        prospect: { firstName: null, lastName: null, email: 'jane@acme.com', linkedinUrl: null, phone: null },
        company: { domain: null, linkedinUrl: null, linkedinId: null },
        options: { ignoreExclusionCheck: false },
        customVariables: { job_title: 'VP Sales' },
      },
    });
    expect(result).toEqual({ candidate_id: 'c1', status: 'awaiting', enrollments_url: null });
  });
  it('requires a way to identify the contact', async () => {
    await expect(
      runAction({ name: 'enroll_contact_in_flow', propsValue: { flow: 'flow_plan_1', first_name: 'Jane' } }),
    ).rejects.toThrow(/Provide an email/);
  });
});

describe('linkedin steps', () => {
  it('send_message creates a contact sequence with approval on by default', async () => {
    const spy = mockSeq({
      enrollmentId: 'e1',
      taskIds: ['t1'],
      uiLinks: [{ label: 'Open task', url: 'https://app.firsttouch.ai/tasks?task-id=t1', reason: null }],
    });
    const result = await runAction({
      name: 'send_message',
      propsValue: { linkedin_url: 'https://www.linkedin.com/in/jane-doe', first_name: 'Jane', last_name: 'Doe', message: 'Hi Jane' },
    });
    expect(requestUrl(spy)).toMatch(/create_contact_sequence$/);
    expect(requestBody(spy)).toMatchObject({
      action: { type: 'linkedin_message', isHumanApprovalRequired: true, message: 'Hi Jane' },
      contact: { firstName: 'Jane', lastName: 'Doe', linkedInUrl: 'https://www.linkedin.com/in/jane-doe' },
      sourceDescription: 'Send Message from Activepieces',
    });
    expect(result).toEqual({ enrollment_id: 'e1', task_ids: 't1', task_url: 'https://app.firsttouch.ai/tasks?task-id=t1' });
  });
  it('send_inmail maps subject and body', async () => {
    const spy = mockSeq({ enrollmentId: 'e2' });
    await runAction({
      name: 'send_inmail',
      propsValue: {
        linkedin_url: 'https://www.linkedin.com/in/jane-doe',
        first_name: 'Jane',
        last_name: 'Doe',
        subject: 'Quick question',
        body: 'Hello',
        require_approval: false,
      },
    });
    expect(requestBody(spy)).toMatchObject({
      action: { type: 'linkedin_inmail', subject: 'Quick question', prompt: 'Hello', isHumanApprovalRequired: false },
    });
  });
  it('send_connection_request turns already-connected into a plain message', async () => {
    mockSeq(failure({ status: 400, body: { message: "Contact is already connected to sender 'Alex Smith'." } }));
    await expect(
      runAction({
        name: 'send_connection_request',
        propsValue: { linkedin_url: 'https://www.linkedin.com/in/jane-doe', first_name: 'Jane', last_name: 'Doe' },
      }),
    ).rejects.toThrow(/Alex Smith is already connected to this contact/);
  });
  it('requires first and last name', async () => {
    await expect(
      runAction({
        name: 'view_profile',
        propsValue: { linkedin_url: 'https://www.linkedin.com/in/jane-doe', first_name: ' ', last_name: 'Doe' },
      }),
    ).rejects.toThrow(/First Name and Last Name/);
  });
  it('surfaces auth errors clearly', async () => {
    mockSeq(failure({ status: 401, body: { message: 'Unauthorized', traceId: 'abc' } }));
    await expect(
      runAction({
        name: 'view_profile',
        propsValue: { linkedin_url: 'https://www.linkedin.com/in/jane-doe', first_name: 'Jane', last_name: 'Doe' },
      }),
    ).rejects.toThrow(/rejected the API key.*trace abc/);
  });
});

describe('polling triggers', () => {
  it('records existing events on enable, then emits each new or late event once', async () => {
    const t = trigger('connection_accepted');
    const store = memoryStore();
    const context = { auth, propsValue: {}, store, isRepublish: false };
    mockSeq(
      connectionsPage([{ member: 'A', at: '2026-11-24T10:00:00Z' }]),
      connectionsPage([
        { member: 'B', at: '2026-11-24T12:00:00Z' },
        { member: 'A', at: '2026-11-24T10:00:00Z' },
        { member: 'C', at: '2026-11-23T09:00:00Z' },
      ]),
      connectionsPage([
        { member: 'B', at: '2026-11-24T12:00:00Z' },
        { member: 'A', at: '2026-11-24T10:00:00Z' },
        { member: 'C', at: '2026-11-23T09:00:00Z' },
      ]),
    );
    await Reflect.apply(t.onEnable, undefined, [context]);
    const first = await Reflect.apply(t.run, undefined, [context]);
    expect(first.map((row: Record<string, unknown>) => row['public_identifier'])).toEqual(['c', 'b']);
    const second = await Reflect.apply(t.run, undefined, [context]);
    expect(second).toEqual([]);
  });
  it('new_linkedin_reply skips conversations without an inbound message', async () => {
    const t = trigger('new_linkedin_reply');
    const spy = mockSeq({
      conversations: [
        { conversationId: 'c1', lastInboundMessageAtUtc: null, latestMessageAtUtc: '2026-11-24T10:00:00Z' },
        { conversationId: 'c2', lastInboundMessageAtUtc: '2026-11-24T09:00:00Z', latestMessageAtUtc: '2026-11-24T09:00:00Z', tags: ['hot'] },
      ],
    });
    const rows = await Reflect.apply(t.test, undefined, [{ auth, propsValue: { tag: 'hot' }, store: memoryStore() }]);
    expect(requestBody(spy)).toMatchObject({ archived: false, tags: ['hot'], limit: 100 });
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({ conversation_id: 'c2', reply_is_latest_message: true, tags: 'hot' });
  });
  it('new_social_engager passes the signal and maps engager fields', async () => {
    const t = trigger('new_social_engager');
    const spy = mockSeq({
      engagers: {
        items: [
          {
            id: 'lin_engagement_1',
            engagement_type: 'COMMENT',
            engaged_at: '2026-11-24T14:00:00Z',
            first_name: 'Jane',
            profile_url: 'https://www.linkedin.com/in/jane-doe',
            content: 'Great post',
          },
        ],
      },
    });
    const rows = await Reflect.apply(t.test, undefined, [
      { auth, propsValue: { signal: 'signal_1', engagement_type: 'comment' }, store: memoryStore() },
    ]);
    expect(requestBody(spy)).toMatchObject({ signalId: 'signal_1', engagementType: 'comment' });
    expect(rows[0]).toMatchObject({ id: 'lin_engagement_1', comment: 'Great post', linkedin_url: 'https://www.linkedin.com/in/jane-doe' });
  });
});
