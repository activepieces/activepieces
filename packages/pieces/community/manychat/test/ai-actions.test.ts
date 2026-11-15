import { afterEach, describe, expect, test, vi } from 'vitest';
import { manychatAiActions } from '../src/lib/actions/ai';
import { setSubscriberCustomFieldsAiAction } from '../src/lib/actions/ai/set-subscriber-custom-fields';
import { listTagsAiAction } from '../src/lib/actions/ai/list-tags';
import { listCustomFieldsAiAction } from '../src/lib/actions/ai/list-custom-fields';
import { listFlowsAiAction } from '../src/lib/actions/ai/list-flows';
import { getPageInfoAiAction } from '../src/lib/actions/ai/get-page-info';
import { CUSTOM_FIELDS, SUBSCRIBER, SUBSCRIBER_ID, actionContext, ok, stubManychat } from './helpers';

afterEach(() => vi.restoreAllMocks());

describe('AI atomics metadata', () => {
  test('every AI atomic is ai-only, has metadata and a schema, and no checkbox, dropdown or dynamic props', () => {
    expect(manychatAiActions).toHaveLength(5);
    for (const action of manychatAiActions) {
      expect(action.audience).toBe('ai');
      expect(action.aiMetadata?.description?.length ?? 0).toBeGreaterThan(40);
      expect(typeof action.aiMetadata?.idempotent).toBe('boolean');
      expect(action.outputSchema).toBeDefined();
      for (const prop of Object.values(action.props)) {
        expect(['CHECKBOX', 'DROPDOWN', 'MULTI_SELECT_DROPDOWN', 'DYNAMIC']).not.toContain(Reflect.get(Object(prop), 'type'));
      }
    }
  });
});

describe('Set Subscriber Custom Fields', () => {
  test('resolves fields by ID or name, coerces per type and sends one setCustomFields call', async () => {
    const seen = stubManychat({ replies: [ok({ data: CUSTOM_FIELDS }), ok(), ok({ data: SUBSCRIBER })] });
    const result = await setSubscriberCustomFieldsAiAction.run(
      actionContext({
        propsValue: {
          subscriber_id: SUBSCRIBER_ID,
          fields: [
            { field: '21', value: 'hello' },
            { field: 'AP_NUM', value: '42.5' },
            { field: 'ap_date', value: '2026-11-11' },
            { field: 'ap_dt', value: '2026-11-11T14:30:00+0200' },
            { field: 'ap_bool', value: 'false' },
          ],
        },
      }),
    );
    expect(seen[1].path).toBe('/fb/subscriber/setCustomFields');
    expect(seen[1].body).toEqual({
      subscriber_id: 1234567890123,
      fields: [
        { field_id: 21, field_value: 'hello' },
        { field_id: 22, field_value: 42.5 },
        { field_id: 23, field_value: '2026-11-11' },
        { field_id: 24, field_value: '2026-11-11T14:30:00+02:00' },
        { field_id: 25, field_value: false },
      ],
    });
    expect(Reflect.get(Object(result), 'subscriber')).toEqual(SUBSCRIBER);
    expect(Reflect.get(Object(result), 'updated_fields')).toHaveLength(5);
  });

  test('rejects bad values, unknown fields, array fields, duplicates and more than 20 items before writing', async () => {
    const cases: Array<{ fields: unknown; message: string }> = [
      { fields: [{ field: 'ap_num', value: 'abc' }], message: 'must be a number' },
      { fields: [{ field: 'ap_date', value: '2026-02-30' }], message: 'real date' },
      { fields: [{ field: 'ap_dt', value: '2026-11-11T25:00:00Z' }], message: 'real date and time' },
      { fields: [{ field: 'ap_bool', value: 'maybe' }], message: 'true or false' },
      { fields: [{ field: 'ap_text', value: '  ' }], message: "can't clear a custom field" },
      { fields: [{ field: 'nope', value: 'x' }], message: 'List Custom Fields' },
      { fields: [{ field: 'ap_list', value: 'x' }], message: 'does not let the API set' },
      { fields: [{ field: '21', value: 'a' }, { field: 'ap_text', value: 'b' }], message: 'more than once' },
    ];
    for (const item of cases) {
      vi.restoreAllMocks();
      const seen = stubManychat({ replies: [ok({ data: CUSTOM_FIELDS })] });
      await expect(setSubscriberCustomFieldsAiAction.run(actionContext({ propsValue: { subscriber_id: SUBSCRIBER_ID, fields: item.fields } }))).rejects.toThrow(item.message);
      expect(seen.filter((request) => request.method === 'POST')).toHaveLength(0);
    }
    vi.restoreAllMocks();
    const seen = stubManychat({ replies: [ok({ data: CUSTOM_FIELDS })] });
    const many = Array.from({ length: 21 }, (_, index) => ({ field: 'ap_text', value: String(index) }));
    await expect(setSubscriberCustomFieldsAiAction.run(actionContext({ propsValue: { subscriber_id: SUBSCRIBER_ID, fields: many } }))).rejects.toThrow('at most 20');
    expect(seen).toHaveLength(0);
  });
});

describe('discovery atomics', () => {
  test('List Tags filters by name fragment', async () => {
    stubManychat({ replies: [ok({ data: [{ id: 1, name: 'VIP' }, { id: 2, name: 'lead' }] })] });
    expect(await listTagsAiAction.run(actionContext({ propsValue: { name_contains: 'vi' } }))).toEqual({ tags: [{ id: 1, name: 'VIP' }], count: 1 });
  });

  test('List Custom Fields filters by type and rejects unknown types', async () => {
    stubManychat({ replies: [ok({ data: CUSTOM_FIELDS })] });
    expect(await listCustomFieldsAiAction.run(actionContext({ propsValue: { type: 'date' } }))).toEqual({ custom_fields: [CUSTOM_FIELDS[2]], count: 1 });
    await expect(listCustomFieldsAiAction.run(actionContext({ propsValue: { type: 'string' } }))).rejects.toThrow('must be one of');
  });

  test('List Flows adds the folder path', async () => {
    stubManychat({
      replies: [ok({ data: { flows: [{ ns: 'a', name: 'Welcome', folder_id: 1 }], folders: [{ id: 1, name: 'Sales', parent_id: 0 }] } })],
    });
    expect(await listFlowsAiAction.run(actionContext({ propsValue: {} }))).toEqual({
      flows: [{ ns: 'a', name: 'Welcome', folder_id: 1, folder_name: 'Sales' }],
      folders: [{ id: 1, name: 'Sales', parent_id: 0 }],
      count: 1,
    });
  });

  test('Get Account Info returns the page data', async () => {
    const page = { id: 1234567, name: 'Test', is_pro: true, timezone: 'UTC+02:00' };
    const seen = stubManychat({ replies: [ok({ data: page })] });
    expect(await getPageInfoAiAction.run(actionContext({ propsValue: {} }))).toEqual(page);
    expect(seen[0].path).toBe('/fb/page/getInfo');
  });

  test('Get Account Info passes through the null page fields of a Telegram-only account (live capture) and the schema matches both ways', async () => {
    const telegramOnly = {
      id: null,
      name: 'mybot',
      category: null,
      avatar_link: null,
      username: null,
      about: null,
      description: null,
      is_pro: true,
      timezone: 'Asia/Amman',
    };
    stubManychat({ replies: [ok({ data: telegramOnly })] });
    expect(await getPageInfoAiAction.run(actionContext({ propsValue: {} }))).toEqual(telegramOnly);
    const fields = getPageInfoAiAction.outputSchema?.fields ?? [];
    expect(fields.map((field) => field.key).sort()).toEqual(Object.keys(telegramOnly).sort());
    for (const field of fields.filter((item) => Reflect.get(telegramOnly, item.key) === null)) {
      expect(field.description).toContain('without a Facebook page');
    }
  });
});

describe('QA edge cases', () => {
  test('Set Subscriber Custom Fields rejects malformed field lists before any request', async () => {
    const cases: Array<{ fields: unknown; message: string }> = [
      { fields: '{not json', message: 'valid JSON' },
      { fields: [], message: 'at least one' },
      { fields: [{ field: 'ap_text' }], message: 'needs a value' },
      { fields: ['ap_text'], message: 'must be an object' },
    ];
    for (const item of cases) {
      vi.restoreAllMocks();
      const seen = stubManychat({ replies: [ok({ data: CUSTOM_FIELDS })] });
      await expect(setSubscriberCustomFieldsAiAction.run(actionContext({ propsValue: { subscriber_id: SUBSCRIBER_ID, fields: item.fields } }))).rejects.toThrow(item.message);
      expect(seen).toHaveLength(0);
    }
  });

  test('a case-insensitive name matching two fields is ambiguous, and an out-of-range offset is refused', async () => {
    const fields = [...CUSTOM_FIELDS, { id: 27, name: 'Score', type: 'number', description: '' }, { id: 28, name: 'score', type: 'number', description: '' }];
    const seen = stubManychat({ replies: [ok({ data: fields })] });
    await expect(
      setSubscriberCustomFieldsAiAction.run(actionContext({ propsValue: { subscriber_id: SUBSCRIBER_ID, fields: [{ field: 'SCORE', value: '1' }] } })),
    ).rejects.toThrow('More than one');
    await expect(
      setSubscriberCustomFieldsAiAction.run(actionContext({ propsValue: { subscriber_id: SUBSCRIBER_ID, fields: [{ field: 'ap_dt', value: '2026-11-11T10:00:00+15:00' }] } })),
    ).rejects.toThrow('invalid UTC offset');
    expect(seen.filter((request) => request.method === 'POST')).toHaveLength(0);
  });

  test('Get Account Info fails when the account details are missing', async () => {
    stubManychat({ replies: [ok({ data: null })] });
    await expect(getPageInfoAiAction.run(actionContext({ propsValue: {} }))).rejects.toThrow('no account details');
  });
});
