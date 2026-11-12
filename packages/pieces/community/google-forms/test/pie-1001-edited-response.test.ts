import { HttpRequest, HttpResponse, httpClient } from '@activepieces/pieces-common';
import { AppConnectionType, Store, TriggerStrategy } from '@activepieces/pieces-framework';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createMockPollingTriggerContext } from '../../../framework/src/lib/test';
import { newResponse as newResponseTrigger } from '../src/lib/triggers/new-form-response';

function createFakeForms() {
  const responses = new Map<string, FormResponse>();
  vi.spyOn(httpClient, 'sendRequest').mockImplementation(async (request: HttpRequest): Promise<HttpResponse> => {
    if (!request.url.endsWith(`/forms/${FORM_ID}/responses`)) {
      throw new Error(`unexpected request ${request.method} ${request.url}`);
    }
    const filter = request.queryParams?.['filter'];
    const after = filter ? Date.parse(filter.replace('timestamp > ', '')) : 0;
    const items = [...responses.values()].filter((r) => Date.parse(r.lastSubmittedTime) > after);
    return { status: 200, headers: {}, body: items.length ? { responses: items } : {} };
  });
  const answer = (value: string) => ({ q1: { questionId: 'q1', textAnswers: { answers: [{ value }] } } });
  return {
    submit(responseId: string, value: string) {
      const now = new Date().toISOString();
      responses.set(responseId, { responseId, createTime: now, lastSubmittedTime: now, answers: answer(value) });
    },
    editAndResubmit(responseId: string, value: string) {
      const existing = responses.get(responseId);
      if (existing === undefined) {
        throw new Error(`unknown response ${responseId}`);
      }
      responses.set(responseId, { ...existing, lastSubmittedTime: new Date().toISOString(), answers: answer(value) });
    },
  };
}

function createStore(): Store {
  const data = new Map<string, string>();
  return {
    put: async <T>(key: string, value: T) => {
      data.set(key, JSON.stringify(value));
      return value;
    },
    get: async <T>(key: string): Promise<T | null> => {
      const raw = data.get(key);
      return raw === undefined ? null : JSON.parse(raw);
    },
    delete: async (key: string) => {
      data.delete(key);
    },
  };
}

function context({ store, runOn }: { store: Store; runOn?: string }): HookContext {
  return {
    ...createMockPollingTriggerContext<typeof newResponseTrigger.props>({
      propsValue: { form_id: FORM_ID, include_team_drives: false, run_on: runOn, info: undefined },
    }),
    auth: AUTH,
    store,
    files: { write: async () => 'file-url', upload: async () => ({ id: 'file-id', url: 'file-url' }) },
  };
}

function asPollingTrigger(candidate: typeof newResponseTrigger) {
  if (candidate.type !== TriggerStrategy.POLLING) {
    throw new Error('New Response must be a polling trigger');
  }
  return candidate;
}

async function poll({ store, runOn }: { store: Store; runOn?: string }): Promise<string[]> {
  const events = await newResponse.run(context({ store, runOn }));
  return events.map((event) => {
    if (typeof event === 'object' && event !== null && 'responseId' in event && typeof event.responseId === 'string') {
      return event.responseId;
    }
    throw new Error('event without responseId');
  });
}

describe('Google Forms New Response', () => {
  let enabledAt: number;
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['Date'] });
    enabledAt = Date.parse('2026-10-02T09:00:00Z');
    vi.setSystemTime(new Date(enabledAt));
  });
  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it.each(['new_only', 'new_and_edited', undefined])('control (run_on=%s): two separate submissions are each delivered once', async (runOn) => {
    const forms = createFakeForms();
    const store = createStore();
    await newResponse.onEnable(context({ store, runOn }));

    vi.setSystemTime(new Date(enabledAt + 60_000));
    forms.submit('resp-alice', 'Alice, 2 seats');
    vi.setSystemTime(new Date(enabledAt + 5 * 60_000));
    const first = await poll({ store, runOn });
    vi.setSystemTime(new Date(enabledAt + 8 * 60_000));
    forms.submit('resp-bob', 'Bob, 1 seat');
    vi.setSystemTime(new Date(enabledAt + 10 * 60_000));
    const second = await poll({ store, runOn });

    expect([...first, ...second]).toEqual(['resp-alice', 'resp-bob']);
  });

  it('run_on=new_only: a respondent editing their submitted response does not create a second "new response"', async () => {
    const forms = createFakeForms();
    const store = createStore();
    await newResponse.onEnable(context({ store, runOn: 'new_only' }));

    vi.setSystemTime(new Date(enabledAt + 60_000));
    forms.submit('resp-alice', 'Alice, 2 seats');
    vi.setSystemTime(new Date(enabledAt + 5 * 60_000));
    const first = await poll({ store, runOn: 'new_only' });

    vi.setSystemTime(new Date(enabledAt + 7 * 60_000));
    forms.editAndResubmit('resp-alice', 'Alice, 3 seats');
    vi.setSystemTime(new Date(enabledAt + 8 * 60_000));
    forms.submit('resp-bob', 'Bob, 1 seat');
    vi.setSystemTime(new Date(enabledAt + 10 * 60_000));
    const second = await poll({ store, runOn: 'new_only' });

    expect([...first, ...second]).toEqual(['resp-alice', 'resp-bob']);
  });

  it.each(['new_and_edited', undefined])('run_on=%s: an edited response runs the flow again, as before this change', async (runOn) => {
    const forms = createFakeForms();
    const store = createStore();
    await newResponse.onEnable(context({ store, runOn }));

    vi.setSystemTime(new Date(enabledAt + 60_000));
    forms.submit('resp-alice', 'Alice, 2 seats');
    vi.setSystemTime(new Date(enabledAt + 5 * 60_000));
    const first = await poll({ store, runOn });

    vi.setSystemTime(new Date(enabledAt + 7 * 60_000));
    forms.editAndResubmit('resp-alice', 'Alice, 3 seats');
    vi.setSystemTime(new Date(enabledAt + 8 * 60_000));
    forms.submit('resp-bob', 'Bob, 1 seat');
    vi.setSystemTime(new Date(enabledAt + 10 * 60_000));
    const second = await poll({ store, runOn });

    expect([...first, ...[...second].sort()]).toEqual(['resp-alice', 'resp-alice', 'resp-bob']);
  });
});

const FORM_ID = 'form-event-registration';

const newResponse = asPollingTrigger(newResponseTrigger);

const AUTH: HookContext['auth'] = {
  type: AppConnectionType.OAUTH2,
  access_token: 'token-123',
  refresh_token: 'refresh-token',
  client_id: 'client-id',
  client_secret: 'client-secret',
  redirect_url: 'https://example.com/redirect',
  token_type: 'Bearer',
  token_url: 'https://oauth2.googleapis.com/token',
  scope: 'email',
  claimed_at: 1759395600,
  expires_in: 3600,
  data: {},
};

type HookContext = Parameters<ReturnType<typeof asPollingTrigger>['run']>[0];

type FormResponse = {
  responseId: string;
  createTime: string;
  lastSubmittedTime: string;
  answers: Record<string, { questionId: string; textAnswers: { answers: { value: string }[] } }>;
};
