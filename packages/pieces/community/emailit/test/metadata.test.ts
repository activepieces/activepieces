import { describe, expect, test } from 'vitest';
import { emailit } from '../src';
import { emailitDropdowns } from '../src/lib/common/dropdowns';
import { replies, stubFetch } from './helpers';

const actions = Object.values(emailit.actions());
const nonCustom = actions.filter((action) => action.name !== 'custom_api_call');
const HUMAN = ['send_email', 'add_subscriber', 'update_subscriber', 'remove_subscriber', 'create_or_update_contact', 'get_domain', 'verify_domain'];
const AI = ['send_email_ai', 'add_subscriber_by_id', 'update_subscriber_by_id', 'remove_subscriber_by_id', 'create_or_update_contact_by_id', 'get_domain_by_id', 'verify_domain_by_id'];

function propTypes(action: { props: Record<string, unknown> }): unknown[] {
  return Object.values(action.props).map((prop) => (prop !== null && typeof prop === 'object' ? Reflect.get(prop, 'type') : undefined));
}

async function loadOptions({ prop, auth }: { prop: unknown; auth: unknown }): Promise<unknown> {
  const options = prop !== null && typeof prop === 'object' ? Reflect.get(prop, 'options') : undefined;
  if (typeof options !== 'function') throw new Error('not a dropdown');
  return Reflect.apply(options, prop, [{ auth }, {}]);
}

describe('piece metadata', () => {
  test('27 actions plus Custom API Call, no triggers, 0.88.2', () => {
    expect(nonCustom).toHaveLength(27);
    expect(actions.map((action) => action.name)).toContain('custom_api_call');
    expect(actions.map((action) => action.name)).not.toContain('trigger_automation');
    expect(Object.keys(emailit.triggers())).toEqual([]);
    expect(emailit.minimumSupportedRelease).toBe('0.88.2');
  });
  test.each(nonCustom.map((action) => [action.name, action]))('%s has audience, classification, aiMetadata and outputSchema', (_name, action) => {
    expect(['both', 'ai', 'human']).toContain(action.audience);
    expect(['READ', 'SEARCH', 'WRITE', 'DESTRUCTIVE']).toContain(action.classification);
    expect(action.aiMetadata?.description?.length ?? 0).toBeGreaterThan(80);
    expect(typeof action.aiMetadata?.idempotent).toBe('boolean');
    expect(action.outputSchema?.fields.length).toBeGreaterThan(0);
  });
  test('7 human, 7 AI twins, 13 both', () => {
    expect(nonCustom.filter((action) => action.audience === 'human').map((action) => action.name).sort()).toEqual([...HUMAN].sort());
    expect(nonCustom.filter((action) => action.audience === 'ai').map((action) => action.name).sort()).toEqual([...AI].sort());
    expect(nonCustom.filter((action) => action.audience === 'both')).toHaveLength(13);
  });
  test('AI-visible actions have no dynamic dropdowns; human selector actions do', () => {
    for (const action of nonCustom.filter((item) => item.audience !== 'human')) {
      expect(propTypes(action)).not.toContain('DROPDOWN');
      expect(propTypes(action)).not.toContain('MULTI_SELECT_DROPDOWN');
    }
    for (const action of nonCustom.filter((item) => item.audience === 'human' && item.name !== 'send_email')) {
      expect(propTypes(action).some((type) => type === 'DROPDOWN' || type === 'MULTI_SELECT_DROPDOWN')).toBe(true);
    }
  });
  test('send_email keeps its prop names and required set', () => {
    const send = emailit.actions()['send_email'];
    for (const name of ['to', 'from_name', 'from_email', 'cc', 'bcc', 'reply_to', 'subject', 'content_type', 'content', 'headers']) {
      expect(send.props).toHaveProperty(name);
    }
    const required = Object.entries(send.props).filter(([, prop]) => Reflect.get(prop, 'required') === true).map(([name]) => name).sort();
    expect(required).toEqual(['content_type', 'from_email', 'to']);
  });
});

describe('dropdowns', () => {
  test('audience dropdown pages to the end and labels unnamed audiences', async () => {
    const seen = stubFetch(replies([
      { body: { data: [{ id: 'aud_1', name: '', subscribers_count: 2 }], next_page_url: '/v2/audiences?page=2' } },
      { body: { data: [{ id: 'aud_2', name: 'News' }], next_page_url: null } },
    ]));
    const state = await loadOptions({ prop: emailitDropdowns.audience(), auth: { secret_text: 'k' } });
    expect(state).toMatchObject({ disabled: false, options: [{ label: '(unnamed audience) (2 subscribers)', value: 'aud_1' }, { label: 'News', value: 'aud_2' }] });
    expect(seen.map((request) => request.url.searchParams.get('page'))).toEqual(['1', '2']);
  });
  test('domain dropdown is disabled with the reason on error and without auth', async () => {
    stubFetch(replies([{ status: 403, body: { message: 'Permission denied: read' } }]));
    expect(await loadOptions({ prop: emailitDropdowns.domain(), auth: { secret_text: 'k' } })).toMatchObject({ disabled: true, placeholder: expect.stringContaining('Sending Only') });
    expect(await loadOptions({ prop: emailitDropdowns.domain(), auth: undefined })).toMatchObject({ disabled: true });
  });
});
