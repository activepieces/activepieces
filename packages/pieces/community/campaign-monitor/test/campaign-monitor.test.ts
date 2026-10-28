import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { httpClient } from '@activepieces/pieces-common';
import {
  buildCustomFieldsPayload,
  isSubscriberNotFoundError,
  jsonCustomFieldsToRecord,
} from '../src/lib/common/client';
import { newCampaignSentTrigger } from '../src/lib/triggers/new-campaign-sent';

const STORE_KEY = 'seen_sent_campaigns';

describe('buildCustomFieldsPayload', () => {
  it('drops blanks, expands arrays and formats date fields', () => {
    const payload = buildCustomFieldsPayload({
      fields: {
        '[Company]': 'Acme',
        '[Empty]': '',
        '[Missing]': null,
        '[Tags]': ['a', '', 'b'],
        '[Birthday]': '2026-10-20T09:30:00Z',
        '[Note]': '2026-10-20T09:30:00Z',
        '[Age]': 30,
      },
      dateKeys: new Set(['[Birthday]']),
    });
    expect(payload).toEqual([
      { Key: '[Company]', Value: 'Acme' },
      { Key: '[Tags]', Value: 'a' },
      { Key: '[Tags]', Value: 'b' },
      { Key: '[Birthday]', Value: '2026/10/20' },
      { Key: '[Note]', Value: '2026-10-20T09:30:00Z' },
      { Key: '[Age]', Value: 30 },
    ]);
  });

  it('returns an empty list for undefined fields', () => {
    expect(buildCustomFieldsPayload({ fields: undefined, dateKeys: new Set() })).toEqual([]);
  });
});

describe('jsonCustomFieldsToRecord', () => {
  it('returns an empty record for empty input', () => {
    expect(jsonCustomFieldsToRecord(undefined)).toEqual({});
    expect(jsonCustomFieldsToRecord(null)).toEqual({});
    expect(jsonCustomFieldsToRecord('')).toEqual({});
  });

  it('parses a JSON string and normalises keys to the bracket form', () => {
    expect(
      jsonCustomFieldsToRecord('{"Company":"Acme","[Age]":30," Favourite Colour ":"red","":1}')
    ).toEqual({ '[Company]': 'Acme', '[Age]': 30, '[FavouriteColour]': 'red' });
  });

  it('accepts an object directly', () => {
    expect(jsonCustomFieldsToRecord({ Company: 'Acme' })).toEqual({ '[Company]': 'Acme' });
  });

  it('rejects arrays and scalars', () => {
    expect(() => jsonCustomFieldsToRecord('[1,2]')).toThrow('Custom Fields must be a JSON object');
    expect(() => jsonCustomFieldsToRecord('5')).toThrow('Custom Fields must be a JSON object');
  });
});

describe('isSubscriberNotFoundError', () => {
  it('matches 404 and the 400 code 203 response', () => {
    expect(isSubscriberNotFoundError({ response: { status: 404, body: {} } })).toBe(true);
    expect(isSubscriberNotFoundError({ response: { status: 400, body: { Code: 203 } } })).toBe(true);
    expect(isSubscriberNotFoundError({ response: { status: 400, body: { Code: '203' } } })).toBe(true);
  });

  it('does not match real failures', () => {
    expect(isSubscriberNotFoundError({ response: { status: 401, body: { Code: 50 } } })).toBe(false);
    expect(isSubscriberNotFoundError({ response: { status: 400, body: { Code: 1 } } })).toBe(false);
    expect(isSubscriberNotFoundError({ response: { status: 500 } })).toBe(false);
    expect(isSubscriberNotFoundError(new Error('network down'))).toBe(false);
    expect(isSubscriberNotFoundError(null)).toBe(false);
    expect(isSubscriberNotFoundError({ response: null })).toBe(false);
  });
});

describe('New Campaign Sent trigger', () => {
  let campaigns: Array<{ CampaignID: string; Name: string; SentDate: string }>;
  let requestedPages: number[];

  beforeEach(() => {
    campaigns = makeCampaigns({ from: 1, to: 3 });
    requestedPages = [];
    vi.spyOn(httpClient, 'sendRequest').mockImplementation(async ({ url }) => {
      const page = Number(new URL(url).searchParams.get('page'));
      const pageSize = Number(new URL(url).searchParams.get('pagesize'));
      requestedPages.push(page);
      const newestFirst = [...campaigns].reverse();
      return {
        status: 200,
        headers: {},
        body: {
          Results: newestFirst.slice((page - 1) * pageSize, page * pageSize),
          NumberOfPages: Math.max(1, Math.ceil(newestFirst.length / pageSize)),
        },
      };
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('emits nothing for campaigns that existed when the flow was enabled', async () => {
    const context = createContext();
    await newCampaignSentTrigger.onEnable(context);
    expect(await newCampaignSentTrigger.run(context)).toEqual([]);
  });

  it('emits each new campaign once, oldest first', async () => {
    const context = createContext();
    await newCampaignSentTrigger.onEnable(context);
    campaigns.push(...makeCampaigns({ from: 4, to: 5 }));

    const first = await newCampaignSentTrigger.run(context);
    const second = await newCampaignSentTrigger.run(context);

    expect(first.map((campaign) => campaign.CampaignID)).toEqual(['c4', 'c5']);
    expect(second).toEqual([]);
  });

  it('reads past the first page until it reaches a seen campaign', async () => {
    const context = createContext();
    await newCampaignSentTrigger.onEnable(context);
    campaigns.push(...makeCampaigns({ from: 4, to: 153 }));
    requestedPages = [];

    const emitted = await newCampaignSentTrigger.run(context);

    expect(emitted.length).toBe(150);
    expect(new Set(emitted.map((campaign) => campaign.CampaignID)).size).toBe(150);
    expect(requestedPages).toEqual([1, 2]);
  });

  it('keeps the seen list on republish so campaigns sent meanwhile still fire', async () => {
    const context = createContext();
    await newCampaignSentTrigger.onEnable(context);
    campaigns.push(...makeCampaigns({ from: 4, to: 4 }));

    await newCampaignSentTrigger.onDisable(context);
    await newCampaignSentTrigger.onEnable({ ...context, isRepublish: true });
    const emitted = await newCampaignSentTrigger.run(context);

    expect(emitted.map((campaign) => campaign.CampaignID)).toEqual(['c4']);
  });

  it('re-seeds on republish when nothing is stored yet', async () => {
    const context = createContext();
    await newCampaignSentTrigger.onEnable({ ...context, isRepublish: true });
    expect(await context.store.get(STORE_KEY)).toEqual(['c3', 'c2', 'c1']);
  });
});

function makeCampaigns({ from, to }: { from: number; to: number }) {
  const result = [];
  for (let id = from; id <= to; id++) {
    result.push({ CampaignID: `c${id}`, Name: `Campaign ${id}`, SentDate: '2026-10-20 09:30:00' });
  }
  return result;
}

function createContext() {
  const data = new Map<string, unknown>();
  return {
    auth: { secret_text: 'key', type: 'SECRET_TEXT' },
    propsValue: { clientId: 'client-1' },
    isRepublish: false,
    store: {
      async get(key: string) {
        return data.get(key) ?? null;
      },
      async put(key: string, value: unknown) {
        data.set(key, value);
        return value;
      },
      async delete(key: string) {
        data.delete(key);
      },
    },
  };
}
