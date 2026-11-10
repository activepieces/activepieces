/// <reference types="vitest/globals" />

import { ghostAddMemberLabel } from '../src/lib/actions/ai/add-member-label';
import { ghostDeleteMember } from '../src/lib/actions/ai/delete-member';
import { ghostGetMemberByEmail } from '../src/lib/actions/ai/get-member-by-email';
import { ghostGetMemberStats } from '../src/lib/actions/ai/get-member-stats';
import { ghostGetSettings } from '../src/lib/actions/ai/get-settings';
import { ghostSubscribeMemberToNewsletters } from '../src/lib/actions/ai/subscribe-member-to-newsletters';
import { ghostUnsubscribeMemberFromNewsletters } from '../src/lib/actions/ai/unsubscribe-member-from-newsletters';
import { ghostUpdateMember } from '../src/lib/actions/ai/update-member';
import { ghostUpdateTier } from '../src/lib/actions/ai/update-tier';
import { ADMIN_URL, FIXTURE_KEY_SECRET, mockGhost, runAction } from './helpers';

const MEMBER = { id: 'm1', email: 'a@example.com', newsletters: [{ id: 'n1' }], labels: [] };

afterEach(() => {
  vi.restoreAllMocks();
});

describe('member lookups', () => {
  test('get member by email quotes the email so a plus sign stays literal', async () => {
    const requests = mockGhost({ replies: [{ body: { members: [MEMBER] } }] });
    const result = await runAction({ action: ghostGetMemberByEmail, propsValue: { email: ' jane+news@example.com ' } });
    expect(requests[0].queryParams).toEqual({ filter: "email:'jane+news@example.com'", limit: '1' });
    expect(result).toEqual({ found: true, member: MEMBER });
  });

  test('get member by email escapes a quote inside the email', async () => {
    const requests = mockGhost({ replies: [{ body: { members: [] } }] });
    const result = await runAction({ action: ghostGetMemberByEmail, propsValue: { email: "o'neil@example.com" } });
    expect(requests[0].queryParams?.['filter']).toBe("email:'o\\'neil@example.com'");
    expect(result).toEqual({ found: false, member: null });
  });

  test('member stats reads the top-level total and the latest daily row', async () => {
    mockGhost({
      replies: [
        {
          body: {
            total: 12,
            data: [
              { date: '2026-09-27', free: 9, paid: 1, comped: 0 },
              { date: '2026-09-28', free: 10, paid: 2, comped: 0 },
            ],
          },
        },
      ],
    });
    const result = await runAction({ action: ghostGetMemberStats, propsValue: {} });
    expect(result).toMatchObject({ total: 12, free: 10, paid: 2, as_of: '2026-09-28' });
  });

  test('get settings never returns secret settings', async () => {
    mockGhost({
      replies: [
        {
          body: {
            settings: [
              { key: 'title', value: 'Blog' },
              { key: 'stripe_secret_key', value: 'sk_live_x' },
              { key: 'mailgun_api_key', value: 'key-x' },
              { key: 'members_private_key', value: 'pk' },
            ],
          },
        },
      ],
    });
    const result = JSON.stringify(await runAction({ action: ghostGetSettings, propsValue: {} }));
    expect(result).toContain('Blog');
    expect(result).not.toMatch(/sk_live_x|key-x|"pk"/);
  });
});

describe('member writes', () => {
  test('add label uses the bulk endpoint filtered to the one member', async () => {
    const requests = mockGhost({
      replies: [
        { body: { members: [MEMBER] } },
        { body: { bulk: { meta: { stats: { successful: 1, unsuccessful: 0 } } } } },
        { body: { members: [{ ...MEMBER, labels: [{ id: 'l1' }] }] } },
      ],
    });
    await runAction({ action: ghostAddMemberLabel, propsValue: { member_id: 'm1', label_id: 'l1' } });
    expect(requests[1].method).toBe('PUT');
    expect(requests[1].url).toBe(`${ADMIN_URL}/members/bulk`);
    expect(requests[1].queryParams).toEqual({ filter: "id:'m1'" });
    expect(requests[1].body).toEqual({ bulk: { action: 'addLabel', meta: { label: { id: 'l1' } } } });
  });

  test('a label change Ghost reports as unsuccessful fails the step', async () => {
    const requests = mockGhost({
      replies: [
        { body: { members: [MEMBER] } },
        { body: { bulk: { meta: { stats: { successful: 0, unsuccessful: 1 }, errors: [{ message: 'Label not found' }] } } } },
      ],
    });
    await expect(runAction({ action: ghostAddMemberLabel, propsValue: { member_id: 'm1', label_id: 'nope' } })).rejects.toThrow(
      'Ghost could not update the member label'
    );
    expect(requests).toHaveLength(2);
  });

  test('unsubscribe removes each newsletter with its own bulk call and never rewrites the list', async () => {
    const requests = mockGhost({
      replies: [
        { body: { members: [MEMBER] } },
        { body: { bulk: { meta: { stats: { successful: 1, unsuccessful: 0 } } } } },
        { body: { bulk: { meta: { stats: { successful: 1, unsuccessful: 0 } } } } },
        { body: { members: [{ ...MEMBER, newsletters: [] }] } },
      ],
    });
    await runAction({
      action: ghostUnsubscribeMemberFromNewsletters,
      propsValue: { member_id: 'm1', newsletter_ids: ['n1', 'n2', 'n1'] },
    });
    const bulk = requests.filter((request) => request.url.endsWith('/members/bulk'));
    expect(bulk.map((request) => request.body)).toEqual([
      { bulk: { action: 'unsubscribe', newsletter: 'n1' } },
      { bulk: { action: 'unsubscribe', newsletter: 'n2' } },
    ]);
    expect(requests.some((request) => request.method === 'PUT' && request.url.endsWith('/members/m1'))).toBe(false);
  });

  test('an unsubscribe Ghost reports as unsuccessful fails the step', async () => {
    const requests = mockGhost({
      replies: [
        { body: { members: [MEMBER] } },
        { body: { bulk: { action: 'unsubscribe', meta: { stats: { successful: 0, unsuccessful: 1 }, errors: [{ message: 'Newsletter not found' }] } } } },
      ],
    });
    await expect(
      runAction({ action: ghostUnsubscribeMemberFromNewsletters, propsValue: { member_id: 'm1', newsletter_ids: ['nope'] } })
    ).rejects.toThrow('Ghost could not remove the newsletter subscription');
    expect(requests).toHaveLength(2);
  });

  test('subscribe keeps the existing newsletters and adds the new ones', async () => {
    const requests = mockGhost({ replies: [{ body: { members: [MEMBER] } }, { body: { members: [MEMBER] } }] });
    await runAction({ action: ghostSubscribeMemberToNewsletters, propsValue: { member_id: 'm1', newsletter_ids: ['n2', 'n1'] } });
    expect(requests[1].body).toEqual({ members: [{ newsletters: [{ id: 'n1' }, { id: 'n2' }] }] });
  });

  test('update member leaves omitted lists alone, clears an empty list and blanks cleared text', async () => {
    const requests = mockGhost({ replies: [{ body: { members: [MEMBER] } }] });
    await runAction({ action: ghostUpdateMember, propsValue: { member_id: 'm1', labels: [], clear_fields: ['note'] } });
    expect(requests[0].body).toEqual({ members: [{ note: '', labels: [] }] });
  });

  test('delete member only cancels Stripe subscriptions when asked', async () => {
    const requests = mockGhost({ replies: [{ status: 204, body: '' }, { status: 204, body: '' }] });
    await runAction({ action: ghostDeleteMember, propsValue: { member_id: 'm1' } });
    await runAction({ action: ghostDeleteMember, propsValue: { member_id: 'm1', cancel_stripe_subscriptions: true } });
    expect(requests.map((request) => request.queryParams)).toEqual([{}, { cancel: 'true' }]);
  });

  test('update tier sends an empty Benefits list to clear benefits and null for a cleared description', async () => {
    const requests = mockGhost({ replies: [{ body: { tiers: [{ id: 't1' }] } }] });
    await runAction({ action: ghostUpdateTier, propsValue: { tier_id: 't1', benefits: [], clear_fields: ['description'] } });
    expect(requests[0].body).toEqual({ tiers: [{ benefits: [], description: null }] });
  });
});

describe('errors', () => {
  test('an API error names the status and never carries the key or token', async () => {
    mockGhost({ replies: [{ error: { status: 404, body: { errors: [{ message: 'Member not found.' }] } } }] });
    const error = await runAction({ action: ghostUpdateMember, propsValue: { member_id: 'gone', name: 'X' } }).catch(
      (caught: unknown) => caught
    );
    expect(error).toBeInstanceOf(Error);
    const text = error instanceof Error ? error.message : '';
    expect(text).toContain('Ghost could not find the requested resource (404)');
    expect(text).not.toContain(FIXTURE_KEY_SECRET);
    expect(text).not.toMatch(/Ghost eyJ/);
  });
});
