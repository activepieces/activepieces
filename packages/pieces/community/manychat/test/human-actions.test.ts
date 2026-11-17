import { afterEach, describe, expect, test, vi } from 'vitest';
import { manychat } from '../src/index';
import { addTagToUserAction } from '../src/lib/actions/add-tag-to-user';
import { removeTagFromUserAction } from '../src/lib/actions/remove-tag-from-user';
import { createSubscriberAction } from '../src/lib/actions/create-subscriber';
import { findUserByNameAction } from '../src/lib/actions/find-user-by-name';
import { findUserByCustomFieldAction } from '../src/lib/actions/find-user-by-custom-field';
import { sendContentToUserAction } from '../src/lib/actions/send-content-to-user';
import { setCustomFieldAction } from '../src/lib/actions/set-custom-fields';
import { getSubscriberAction } from '../src/lib/actions/get-subscriber';
import { findSubscriberByEmailOrPhoneAction } from '../src/lib/actions/find-subscriber-by-email-or-phone';
import { updateSubscriberAction } from '../src/lib/actions/update-subscriber';
import { sendFlowAction } from '../src/lib/actions/send-flow';
import { createTagAction } from '../src/lib/actions/create-tag';
import { createCustomFieldAction } from '../src/lib/actions/create-custom-field';
import { manychatProps } from '../src/lib/common/props';
import { manychatOutputSchemas } from '../src/lib/common/output-schemas';
import { API_KEY, AUTH, SUBSCRIBER, SUBSCRIBER_ID, actionContext, ok, stubManychat } from './helpers';

afterEach(() => vi.restoreAllMocks());

describe('piece metadata', () => {
  test('existing actions keep their names and prop names', () => {
    const expected: Record<string, string[]> = {
      addTagToUser: ['subscriberId', 'tagId'],
      createSubscriber: ['first_name', 'last_name', 'phone', 'whatsapp_phone', 'email', 'gender', 'has_opt_in_sms', 'has_opt_in_email', 'consent_phrase'],
      findUserByCustomField: ['field', 'value'],
      findUserByName: ['name'],
      removeTagFromUser: ['subscriberId', 'tagId'],
      sendContentToUser: ['subscriber_id', 'platform', 'content_type', 'text_content', 'media_url', 'message_tag'],
      setCustomField: ['subscriber_id', 'field_id', 'field_value'],
    };
    const actions = manychat.actions();
    for (const [name, props] of Object.entries(expected)) {
      expect(Object.keys(actions[name].props)).toEqual(props);
    }
  });

  test('18 actions, 0.86.4 floor, every action has a schema, Set Custom Field is human-only', () => {
    const actions = Object.values(manychat.actions());
    expect(actions).toHaveLength(18);
    expect(manychat.minimumSupportedRelease).toBe('0.86.4');
    for (const action of actions) {
      expect(action.outputSchema).toBeDefined();
      expect(typeof action.aiMetadata?.idempotent).toBe('boolean');
      expect(action.classification).toBeDefined();
    }
    expect(manychat.actions()['setCustomField'].audience).toBe('human');
    const audiences = Object.fromEntries(actions.map((action) => [action.name, action.audience]));
    expect(Object.entries(audiences).filter(([, audience]) => audience === 'ai').map(([name]) => name).sort()).toEqual(
      ['get_page_info', 'list_custom_fields', 'list_flows', 'list_tags', 'set_subscriber_custom_fields'],
    );
  });

  test('every sibling quoted in aiMetadata is a registered display name', () => {
    const actions = Object.values(manychat.actions());
    const names = new Set(actions.map((action) => action.displayName));
    for (const action of actions) {
      const quoted = [...(action.aiMetadata?.description ?? '').matchAll(/"([A-Z][^"]+)"/g)].map((match) => match[1]);
      for (const name of quoted) {
        expect(names.has(name)).toBe(true);
      }
    }
  });
});

describe('Send Content to User', () => {
  test('sends the API key from the connection, not the auth object', async () => {
    const seen = stubManychat({ replies: [ok()] });
    const result = await sendContentToUserAction.run(
      actionContext({ propsValue: { subscriber_id: 1234567890123, content_type: 'text', text_content: 'Hi', platform: 'instagram', message_tag: 'ACCOUNT_UPDATE' } }),
    );
    expect(seen[0].path).toBe('/fb/sending/sendContent');
    expect(seen[0].headers.get('authorization')).toBe(`Bearer ${API_KEY}`);
    expect(seen[0].headers.get('authorization')).not.toContain('object');
    expect(seen[0].body).toEqual({
      subscriber_id: 1234567890123,
      data: { version: 'v2', content: { messages: [{ type: 'text', text: 'Hi' }], actions: [], quick_replies: [], type: 'instagram' } },
      message_tag: 'ACCOUNT_UPDATE',
    });
    expect(result).toEqual({ status: 'success' });
  });

  test('media types need a URL', async () => {
    const seen = stubManychat({ replies: [ok()] });
    await expect(sendContentToUserAction.run(actionContext({ propsValue: { subscriber_id: 1, content_type: 'image' } }))).rejects.toThrow('Media URL');
    expect(seen).toHaveLength(0);
  });
});

describe('tags', () => {
  test('Add Tag posts the tag then returns the refreshed subscriber', async () => {
    const seen = stubManychat({ replies: [ok(), ok({ data: SUBSCRIBER })] });
    const result = await addTagToUserAction.run(actionContext({ propsValue: { subscriberId: 1234567890123, tagId: 11 } }));
    expect(seen[0].path).toBe('/fb/subscriber/addTag');
    expect(seen[0].body).toEqual({ subscriber_id: 1234567890123, tag_id: 11 });
    expect(seen[1].query.get('subscriber_id')).toBe(SUBSCRIBER_ID);
    expect(result).toEqual(SUBSCRIBER);
  });

  test('Remove Tag uses removeTag', async () => {
    const seen = stubManychat({ replies: [ok(), ok({ data: SUBSCRIBER })] });
    await removeTagFromUserAction.run(actionContext({ propsValue: { subscriberId: 1234567890123, tagId: 11 } }));
    expect(seen[0].path).toBe('/fb/subscriber/removeTag');
  });

  test('a vendor status error fails the step instead of returning', async () => {
    stubManychat({ replies: [{ status: 400, body: { status: 'error', message: 'Tag not found' } }] });
    await expect(addTagToUserAction.run(actionContext({ propsValue: { subscriberId: 1, tagId: 999 } }))).rejects.toThrow('Tag not found');
  });

  test('Create Tag returns the tag object', async () => {
    const seen = stubManychat({ replies: [ok({ data: { tag: { id: 12, name: 'vip' } } })] });
    expect(await createTagAction.run(actionContext({ propsValue: { name: ' vip ' } }))).toEqual({ id: 12, name: 'vip' });
    expect(seen[0].body).toEqual({ name: 'vip' });
  });

  test('the tag dropdown shows a reason when loading fails', async () => {
    stubManychat({ replies: [{ status: 401, body: { status: 'error', message: 'Wrong token' } }] });
    const dropdown = manychat.actions()['addTagToUser'].props['tagId'];
    const options: unknown = await Reflect.get(Object(dropdown), 'options')({ auth: AUTH });
    expect(JSON.stringify(options)).toContain('Wrong token');
    expect(JSON.stringify(options)).toContain('"disabled":true');
  });
});

describe('subscribers', () => {
  test('Create Subscriber passes the opt-ins through unchanged and returns the ManyChat body', async () => {
    const seen = stubManychat({ replies: [ok({ data: SUBSCRIBER })] });
    const result = await createSubscriberAction.run(
      actionContext({ propsValue: { first_name: 'Ada', email: 'ada@example.com', phone: '+14155550123', has_opt_in_sms: true, has_opt_in_email: false } }),
    );
    expect(seen[0].body).toEqual({ first_name: 'Ada', phone: '+14155550123', email: 'ada@example.com', has_opt_in_sms: true, has_opt_in_email: false });
    expect(result).toEqual({ status: 'success', data: SUBSCRIBER });
    vi.restoreAllMocks();
    const again = stubManychat({ replies: [ok({ data: SUBSCRIBER })] });
    await createSubscriberAction.run(actionContext({ propsValue: { first_name: 'Ada', email: 'ada@example.com', phone: '+14155550123' } }));
    expect(again[0].body).toEqual({ first_name: 'Ada', phone: '+14155550123', email: 'ada@example.com' });
  });

  test('Create Subscriber leaves the opt-in and consent rules to ManyChat and shows its error', async () => {
    const seen = stubManychat({ replies: [{ status: 400, body: { status: 'error', message: 'Validation error', details: { messages: ['consent_phrase is required'] } } }] });
    await expect(createSubscriberAction.run(actionContext({ propsValue: { first_name: 'Ada', phone: '+1', has_opt_in_sms: true } }))).rejects.toThrow('consent_phrase is required');
    expect(seen).toHaveLength(1);
    expect(seen[0].body).toEqual({ first_name: 'Ada', phone: '+1', has_opt_in_sms: true });
  });

  test('Create Subscriber keeps the at-least-one contact check from main', async () => {
    const seen = stubManychat({ replies: [ok()] });
    await expect(createSubscriberAction.run(actionContext({ propsValue: { first_name: 'Ada' } }))).rejects.toThrow(
      'To create a subscriber you must fill in at least one field: phone or email or whatsapp_phone.',
    );
    expect(seen).toHaveLength(0);
  });

  test('Update Subscriber maps yes/no, sends only given fields and enforces the opt-in rules', async () => {
    const seen = stubManychat({ replies: [ok({ data: SUBSCRIBER })] });
    const result = await updateSubscriberAction.run(
      actionContext({ propsValue: { subscriber_id: SUBSCRIBER_ID, email: 'ada@example.com', has_opt_in_email: 'no', first_name: 'Ada' } }),
    );
    expect(seen[0].path).toBe('/fb/subscriber/updateSubscriber');
    expect(seen[0].body).toEqual({ subscriber_id: 1234567890123, first_name: 'Ada', email: 'ada@example.com', has_opt_in_email: false });
    expect(result).toEqual(SUBSCRIBER);
    await expect(updateSubscriberAction.run(actionContext({ propsValue: { subscriber_id: SUBSCRIBER_ID, phone: '+1' } }))).rejects.toThrow('SMS Opt-in is required');
    await expect(updateSubscriberAction.run(actionContext({ propsValue: { subscriber_id: SUBSCRIBER_ID } }))).rejects.toThrow('at least one field');
    expect(seen).toHaveLength(1);
  });

  test('Update Subscriber re-reads the subscriber when the response has no data', async () => {
    const seen = stubManychat({ replies: [ok(), ok({ data: SUBSCRIBER })] });
    expect(await updateSubscriberAction.run(actionContext({ propsValue: { subscriber_id: SUBSCRIBER_ID, first_name: 'Ada' } }))).toEqual(SUBSCRIBER);
    expect(seen[1].path).toBe('/fb/subscriber/getInfo');
  });

  test('Get Subscriber rejects a non-numeric ID before any request', async () => {
    const seen = stubManychat({ replies: [ok({ data: SUBSCRIBER })] });
    await expect(getSubscriberAction.run(actionContext({ propsValue: { subscriber_id: 'abc' } }))).rejects.toThrow('digits only');
    expect(seen).toHaveLength(0);
    expect(await getSubscriberAction.run(actionContext({ propsValue: { subscriber_id: ` ${SUBSCRIBER_ID} ` } }))).toEqual(SUBSCRIBER);
    expect(seen[0].query.get('subscriber_id')).toBe(SUBSCRIBER_ID);
  });

  test('a subscriber ID beyond the safe integer range is sent as digits, not rounded', async () => {
    const seen = stubManychat({ replies: [ok()] });
    await sendFlowAction.run(actionContext({ propsValue: { subscriber_id: '90071992547409931', flow_ns: 'content2026' } }));
    expect(seen[0].rawBody).toContain('"90071992547409931"');
  });

  test('Find Subscriber by Email or Phone needs exactly one and reports not found', async () => {
    const seen = stubManychat({ replies: [ok({ data: null })] });
    await expect(findSubscriberByEmailOrPhoneAction.run(actionContext({ propsValue: { email: 'a@x.com', phone: '+1' } }))).rejects.toThrow('not both');
    await expect(findSubscriberByEmailOrPhoneAction.run(actionContext({ propsValue: {} }))).rejects.toThrow('Provide either');
    expect(await findSubscriberByEmailOrPhoneAction.run(actionContext({ propsValue: { phone: '+14155550123' } }))).toEqual({ found: false, subscriber: null });
    expect(seen[0].query.get('phone')).toBe('+14155550123');
    expect(seen[0].query.has('email')).toBe(false);
  });

  test('Find User by Name and by Custom Field return found + result', async () => {
    const seen = stubManychat({ replies: [ok({ data: [SUBSCRIBER] }), ok({ data: [] })] });
    expect(await findUserByNameAction.run(actionContext({ propsValue: { name: 'Ada Test' } }))).toEqual({ found: true, result: [SUBSCRIBER] });
    expect(await findUserByCustomFieldAction.run(actionContext({ propsValue: { field: 21, value: 'hello' } }))).toEqual({ found: false, result: [] });
    expect(seen[0].query.get('name')).toBe('Ada Test');
    expect(seen[1].query.get('field_id')).toBe('21');
    expect(seen[1].query.get('field_value')).toBe('hello');
  });
});

describe('custom fields and flows', () => {
  test('Set Custom Field formats a date as YYYY-MM-DD and a datetime with an explicit offset', async () => {
    const seen = stubManychat({ replies: [ok(), ok({ data: SUBSCRIBER })] });
    await setCustomFieldAction.run(actionContext({ propsValue: { subscriber_id: 1, field_id: '23:::date', field_value: { value: '2026-11-11T00:00:00.000Z' } } }));
    expect(seen[0].body).toEqual({ subscriber_id: 1, field_id: 23, field_value: '2026-11-11' });
    vi.restoreAllMocks();
    const again = stubManychat({ replies: [ok(), ok({ data: SUBSCRIBER })] });
    await setCustomFieldAction.run(actionContext({ propsValue: { subscriber_id: 1, field_id: '24:::datetime', field_value: { value: '2026-11-11T14:30:00.000Z' } } }));
    expect(again[0].body).toEqual({ subscriber_id: 1, field_id: 24, field_value: '2026-11-11T14:30:00+00:00' });
  });

  test('Set Custom Field rejects an impossible date before any request', async () => {
    const seen = stubManychat({ replies: [ok()] });
    await expect(setCustomFieldAction.run(actionContext({ propsValue: { subscriber_id: 1, field_id: '23:::date', field_value: { value: '2026-02-30' } } }))).rejects.toThrow(
      'real date',
    );
    expect(seen).toHaveLength(0);
  });

  test('Create Custom Field returns the field', async () => {
    const field = { id: 30, name: 'score', type: 'number', description: 'x' };
    const seen = stubManychat({ replies: [ok({ data: { field } })] });
    expect(await createCustomFieldAction.run(actionContext({ propsValue: { caption: 'score', type: 'number', description: 'x' } }))).toEqual(field);
    expect(seen[0].body).toEqual({ caption: 'score', type: 'number', description: 'x' });
  });

  test('Send Flow posts subscriber and flow namespace', async () => {
    const seen = stubManychat({ replies: [ok()] });
    expect(await sendFlowAction.run(actionContext({ propsValue: { subscriber_id: SUBSCRIBER_ID, flow_ns: 'content20261111' } }))).toEqual({
      status: 'success',
      flow_ns: 'content20261111',
      subscriber_id: SUBSCRIBER_ID,
    });
    expect(seen[0].body).toEqual({ subscriber_id: 1234567890123, flow_ns: 'content20261111' });
  });

  test('the flow dropdown labels flows with their folder path', async () => {
    stubManychat({
      replies: [
        ok({
          data: {
            flows: [{ ns: 'a', name: 'Welcome', folder_id: 2 }, { ns: 'b', name: 'Root flow', folder_id: 0 }],
            folders: [{ id: 1, name: 'Sales', parent_id: 0 }, { id: 2, name: 'Onboarding', parent_id: 1 }],
          },
        }),
      ],
    });
    const options: unknown = await Reflect.get(Object(manychatProps.flowDropdown()), 'options')({ auth: AUTH });
    expect(Reflect.get(Object(options), 'options')).toEqual([
      { label: 'Sales / Onboarding / Welcome', value: 'a' },
      { label: 'Root flow', value: 'b' },
    ]);
  });
});

describe('QA edge cases', () => {
  test('Get Subscriber fails when ManyChat returns success without a subscriber', async () => {
    stubManychat({ replies: [ok({ data: null })] });
    await expect(getSubscriberAction.run(actionContext({ propsValue: { subscriber_id: SUBSCRIBER_ID } }))).rejects.toThrow('no subscriber');
  });

  test('Create Tag fails when the response has no tag', async () => {
    stubManychat({ replies: [ok({ data: {} })] });
    await expect(createTagAction.run(actionContext({ propsValue: { name: 'vip' } }))).rejects.toThrow('no tag details');
  });

  test('Create Subscriber with only WhatsApp leaves unchecked opt-ins out of the body', async () => {
    const seen = stubManychat({ replies: [ok({ data: SUBSCRIBER })] });
    await createSubscriberAction.run(actionContext({ propsValue: { first_name: 'Ada', whatsapp_phone: '+14155550123' } }));
    expect(seen[0].body).toEqual({ first_name: 'Ada', whatsapp_phone: '+14155550123' });
  });

  test('Create Subscriber with a checked SMS opt-in and consent phrase sends true', async () => {
    const seen = stubManychat({ replies: [ok({ data: SUBSCRIBER })] });
    await createSubscriberAction.run(actionContext({ propsValue: { first_name: 'Ada', phone: '+14155550123', has_opt_in_sms: true, consent_phrase: 'I agree' } }));
    expect(seen[0].body).toEqual({ first_name: 'Ada', phone: '+14155550123', has_opt_in_sms: true, consent_phrase: 'I agree' });
  });

  test('Update Subscriber rejects SMS opt-in yes without a consent phrase and an invalid yes/no value', async () => {
    const seen = stubManychat({ replies: [ok({ data: SUBSCRIBER })] });
    await expect(
      updateSubscriberAction.run(actionContext({ propsValue: { subscriber_id: SUBSCRIBER_ID, phone: '+14155550123', has_opt_in_sms: 'yes' } })),
    ).rejects.toThrow('Consent Phrase');
    await expect(updateSubscriberAction.run(actionContext({ propsValue: { subscriber_id: SUBSCRIBER_ID, has_opt_in_email: 'maybe' } }))).rejects.toThrow(
      '"yes" or "no"',
    );
    expect(seen).toHaveLength(0);
  });

  test('a legacy Number subscriber ID beyond 2^53 is refused instead of sent rounded', async () => {
    const seen = stubManychat({ replies: [ok()] });
    await expect(
      sendContentToUserAction.run(actionContext({ propsValue: { subscriber_id: 2 ** 60, content_type: 'text', text_content: 'Hi' } })),
    ).rejects.toThrow('digits only');
    expect(seen).toHaveLength(0);
  });

  test('Send Content rejects whitespace-only text before any request', async () => {
    const seen = stubManychat({ replies: [ok()] });
    await expect(sendContentToUserAction.run(actionContext({ propsValue: { subscriber_id: 1, content_type: 'text', text_content: '   ' } }))).rejects.toThrow(
      'Text content is required',
    );
    expect(seen).toHaveLength(0);
  });

  test('Find Subscriber by Email returns the match', async () => {
    const seen = stubManychat({ replies: [ok({ data: SUBSCRIBER })] });
    expect(await findSubscriberByEmailOrPhoneAction.run(actionContext({ propsValue: { email: 'ada@example.com' } }))).toEqual({ found: true, subscriber: SUBSCRIBER });
    expect(seen[0].query.get('email')).toBe('ada@example.com');
    expect(seen[0].query.has('phone')).toBe(false);
  });

  test('Set Custom Field sends an unchecked boolean as false, not omitted', async () => {
    const seen = stubManychat({ replies: [ok(), ok({ data: SUBSCRIBER })] });
    await setCustomFieldAction.run(actionContext({ propsValue: { subscriber_id: 1, field_id: '25:::boolean', field_value: { value: false } } }));
    expect(seen[0].body).toEqual({ subscriber_id: 1, field_id: 25, field_value: false });
  });

  test('a 429 on a write is not retried and an auth failure stops before the read-back', async () => {
    const seen = stubManychat({ replies: [{ status: 429, body: { status: 'error', message: 'Too many requests' } }] });
    await expect(sendFlowAction.run(actionContext({ propsValue: { subscriber_id: SUBSCRIBER_ID, flow_ns: 'content1' } }))).rejects.toThrow('rate limit');
    expect(seen).toHaveLength(1);
    vi.restoreAllMocks();
    const again = stubManychat({ replies: [{ status: 401, body: { status: 'error', message: 'Wrong token' } }] });
    await expect(addTagToUserAction.run(actionContext({ propsValue: { subscriberId: 1, tagId: 11 } }))).rejects.toThrow('reconnect');
    expect(again).toHaveLength(1);
  });
});

const LIVE_SUBSCRIBER = {
  id: '944498100',
  page_id: '',
  user_refs: [],
  status: 'active',
  first_name: 'Oda',
  last_name: '-',
  name: 'Oda -',
  gender: null,
  profile_pic: null,
  locale: null,
  language: null,
  timezone: 'UTC\u00b100',
  live_chat_url: 'https://app.manychat.com/fb5939775/chat/944498100',
  last_input_text: 'Hi',
  optin_phone: false,
  phone: null,
  optin_email: false,
  email: null,
  subscribed: '2026-11-11T13:15:28+03:00',
  last_interaction: null,
  ig_last_interaction: null,
  last_seen: null,
  ig_last_seen: null,
  is_followup_enabled: true,
  ig_username: null,
  ig_id: null,
  whatsapp_phone: null,
  whatsapp_bsuid: null,
  whatsapp_username: null,
  optin_whatsapp: false,
  custom_fields: [{ id: 15151285, name: 'ap_test_text_1794390542', type: 'text', description: 'AP live test', value: 'ap-ai-text' }],
  tags: [{ id: 11, name: 'ap-test' }],
};

describe('live round 2', () => {
  test('a repeat Remove Tag succeeds when ManyChat refuses because the tag is already gone', async () => {
    const untagged = { ...LIVE_SUBSCRIBER, tags: [] };
    const seen = stubManychat({
      replies: [{ status: 400, body: { status: 'error', message: 'Validation error', details: { messages: ['Can not remove tag from subscriber'] } } }, ok({ data: untagged })],
    });
    expect(await removeTagFromUserAction.run(actionContext({ propsValue: { subscriberId: 944498100, tagId: 11 } }))).toEqual(untagged);
    expect(seen.map((request) => request.path)).toEqual(['/fb/subscriber/removeTag', '/fb/subscriber/getInfo']);
  });

  test('Remove Tag still fails when the 400 leaves the tag on the subscriber', async () => {
    const seen = stubManychat({
      replies: [{ status: 400, body: { status: 'error', message: 'Validation error', details: { messages: ['Can not remove tag from subscriber'] } } }, ok({ data: LIVE_SUBSCRIBER })],
    });
    await expect(removeTagFromUserAction.run(actionContext({ propsValue: { subscriberId: 944498100, tagId: 11 } }))).rejects.toThrow('Can not remove tag');
    expect(seen).toHaveLength(2);
  });

  test('Remove Tag does not re-read on a non-400 failure', async () => {
    const seen = stubManychat({ replies: [{ status: 401, body: { status: 'error', message: 'Wrong token' } }] });
    await expect(removeTagFromUserAction.run(actionContext({ propsValue: { subscriberId: 944498100, tagId: 11 } }))).rejects.toThrow('Wrong token');
    expect(seen).toHaveLength(1);
  });

  test('the subscriber schema matches the live get_subscriber capture both ways', () => {
    const fields = manychatOutputSchemas.subscriber.fields;
    const schemaKeys = fields.map((field) => field.key);
    const captureKeys = Object.keys(LIVE_SUBSCRIBER);
    expect(schemaKeys.filter((key) => !captureKeys.includes(key))).toEqual([]);
    expect(captureKeys.filter((key) => !schemaKeys.includes(key)).sort()).toEqual(['user_refs', 'whatsapp_bsuid']);
    const customFieldKeys = fields.find((field) => field.key === 'custom_fields')?.listItems?.map((field) => field.key).sort();
    expect(customFieldKeys).toEqual(Object.keys(LIVE_SUBSCRIBER.custom_fields[0]).sort());
    const tagKeys = fields.find((field) => field.key === 'tags')?.listItems?.map((field) => field.key).sort();
    expect(tagKeys).toEqual(Object.keys(LIVE_SUBSCRIBER.tags[0]).sort());
  });

  test('Set Custom Field refuses an empty or blank text value before any request', async () => {
    const seen = stubManychat({ replies: [ok()] });
    for (const value of ['', '   ']) {
      await expect(setCustomFieldAction.run(actionContext({ propsValue: { subscriber_id: 1, field_id: '21:::text', field_value: { value } } }))).rejects.toThrow(
        "can't clear a custom field",
      );
    }
    expect(seen).toHaveLength(0);
  });
});

