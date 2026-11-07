import { createMockActionContext, InputPropertyMap } from '@activepieces/pieces-framework';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { mailchimp } from '../src';

const addNoteToSubscriber = findAction({ name: 'add_note_to_subscriber' });
const removeSubscriberFromTag = findAction({ name: 'remove_subscriber_from_tag' });

const AUTH = { access_token: 'TKN', data: {}, props: {} };

function findAction({ name }: { name: string }): { run: unknown } {
  const action = mailchimp.actions()[name];
  if (action === undefined) {
    throw new Error(`mailchimp has no action ${name}`);
  }
  return action;
}

function stubMailchimp({ errorBody }: { errorBody: string }): void {
  vi.stubGlobal(
    'fetch',
    vi.fn(async (input: string | URL | Request) => {
      const url = input instanceof Request ? input.url : String(input);
      if (url.includes('login.mailchimp.com/oauth2/metadata')) {
        return new Response(JSON.stringify({ dc: 'us1' }), {
          status: 200,
          headers: { 'content-type': 'application/json' },
        });
      }
      return new Response(errorBody, { status: 400, statusText: 'Bad Request' });
    })
  );
}

function runAction({
  action,
  propsValue,
}: {
  action: { run: unknown };
  propsValue: Record<string, unknown>;
}): Promise<unknown> {
  const base = createMockActionContext<InputPropertyMap>({ propsValue: {} });
  const runFn = action.run;
  if (typeof runFn !== 'function') {
    throw new Error('action has no run');
  }
  return Promise.resolve(Reflect.apply(runFn, action, [{ ...base, propsValue, auth: AUTH }]));
}

beforeEach(() => {
  vi.spyOn(console, 'error').mockImplementation(() => undefined);
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

const cases = [
  {
    name: 'add note to subscriber',
    action: addNoteToSubscriber,
    propsValue: { list_id: 'L1', email: 'jane@example.com', note: 'Hello' },
    prefix: 'Failed to add note to subscriber: ',
  },
  {
    name: 'remove subscriber from tag',
    action: removeSubscriberFromTag,
    propsValue: { list_id: 'L1', email: 'jane@example.com', tag_name: 'Customers' },
    prefix: 'Failed to remove subscriber from tag: ',
  },
];

describe.each(cases)('$name error path', ({ action, propsValue, prefix }) => {
  test('keeps the JSON detail and prefixes it once', async () => {
    stubMailchimp({ errorBody: JSON.stringify({ title: 'Resource Not Found', detail: 'The member does not exist.' }) });
    await expect(runAction({ action, propsValue })).rejects.toThrow(
      new Error(`${prefix}The member does not exist.`)
    );
  });

  test('keeps a plain-text body as the detail', async () => {
    stubMailchimp({ errorBody: 'Upstream gateway error' });
    await expect(runAction({ action, propsValue })).rejects.toThrow(
      new Error(`${prefix}Upstream gateway error`)
    );
  });

  test('falls back to the HTTP status for an empty body', async () => {
    stubMailchimp({ errorBody: '' });
    await expect(runAction({ action, propsValue })).rejects.toThrow(
      new Error(`${prefix}HTTP 400: Bad Request`)
    );
  });
});
