/// <reference types="vitest/globals" />

const { sendRequest } = vi.hoisted(() => ({ sendRequest: vi.fn() }));

vi.mock('@activepieces/pieces-common', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@activepieces/pieces-common')>();
  return {
    ...actual,
    httpClient: {
      sendRequest: (...args: unknown[]) => sendRequest(...args),
    },
  };
});

import { HttpError, HttpMethod } from '@activepieces/pieces-common';
import { askQuestion } from '../src/lib/actions/ask-question';
import { decideWithProfile } from '../src/lib/actions/decide-with-profile';
import { reportOutcome } from '../src/lib/actions/report-outcome';
import { hesperanApi } from '../src/lib/common/client';
import { hesperanProps } from '../src/lib/common/props';

const auth = { secret_text: 'hsp_' + 'a'.repeat(40) };

type Runnable = { run: (ctx: unknown) => Promise<unknown> };

function run(action: unknown, propsValue: unknown) {
  return (action as Runnable).run({ auth, propsValue });
}

const lastRequest = () => sendRequest.mock.calls.at(-1)?.[0];

function reply(body: unknown, headers: Record<string, string> = {}) {
  sendRequest.mockResolvedValueOnce({ status: 200, headers, body });
}

function fail(status: number, body: unknown) {
  sendRequest.mockRejectedValueOnce(new HttpError({}, { status, responseBody: body }));
}

const decision = {
  decision_id: '0f6c2a4e-5b1d-4c1e-9a7f-2d3b8e6f1a90',
  profile: 'ticket-routing',
  decision: 'billing',
  confidence: 0.9931,
  action: 'auto',
  threshold: 0.962,
  target_precision: 0.99,
  calibration_version: 1,
  probabilities: { billing: 0.9931, shipping: 0.0069 },
  raw_probabilities: { billing: 0.9412, shipping: 0.0588 },
};

beforeEach(() => sendRequest.mockReset());

describe('decide with profile', () => {
  test('posts the state to the profile with the bearer key', async () => {
    reply(decision);
    await run(decideWithProfile, { profile: 'ticket-routing', state: 'I was charged twice.' });
    const req = lastRequest();
    expect(req.method).toBe(HttpMethod.POST);
    expect(req.url).toBe('https://api.hesperan.com/v1/decide/ticket-routing');
    expect(req.headers.Authorization).toBe(`Bearer ${auth.secret_text}`);
    expect(req.body).toEqual({ state: 'I was charged twice.' });
    expect(req.headers['Idempotency-Key']).toBeUndefined();
  });

  test('sends the idempotency key and reports a replay', async () => {
    reply(decision, { 'idempotent-replayed': 'true' });
    const out = await run(decideWithProfile, {
      profile: 'ticket-routing',
      state: 'I was charged twice.',
      idempotency_key: 'ticket-4812',
    });
    expect(lastRequest().headers['Idempotency-Key']).toBe('ticket-4812');
    expect(out).toMatchObject({ decision: 'billing', action: 'auto', automate: true, replayed: true });
  });

  test('parses JSON state when asked to', async () => {
    reply({ ...decision, action: 'review' });
    const out = await run(decideWithProfile, {
      profile: 'ticket-routing',
      state: '{"message": "Still waiting", "order": {"status": "delivered"}}',
      send_as_json: true,
    });
    expect(lastRequest().body).toEqual({ state: { message: 'Still waiting', order: { status: 'delivered' } } });
    expect(out).toMatchObject({ automate: false, replayed: false });
  });

  test('rejects invalid input before calling the API', async () => {
    await expect(run(decideWithProfile, { profile: 'Ticket Routing', state: 'x' })).rejects.toThrow(/slug/);
    await expect(
      run(decideWithProfile, { profile: 'ticket-routing', state: 'x', idempotency_key: 'has space' })
    ).rejects.toThrow(/Idempotency Key/);
    await expect(run(decideWithProfile, { profile: 'ticket-routing', state: 'not json', send_as_json: true })).rejects.toThrow(
      /could not be parsed/
    );
    expect(sendRequest).not.toHaveBeenCalled();
  });

  test('explains that the API is not live yet', async () => {
    fail(503, { error: 'the Hesperan API opens soon — no model is connected yet; nothing was charged' });
    await expect(run(decideWithProfile, { profile: 'ticket-routing', state: 'x' })).rejects.toThrow(
      /not live yet.*Retrying will not help/
    );
  });

  test('explains a missing calibration and billing errors', async () => {
    fail(409, { error: 'profile has no calibration yet' });
    await expect(run(decideWithProfile, { profile: 'ticket-routing', state: 'x' })).rejects.toThrow(
      /profile has no calibration yet/
    );
    fail(402, { error: 'your 1M free tokens this month are used up and your balance does not cover the rest — top up your balance (pay as you go, $0.25 per 1M input tokens) or subscribe to Pro' });
    await expect(run(decideWithProfile, { profile: 'ticket-routing', state: 'x' })).rejects.toThrow(
      /Nothing was charged\. Top up your balance or subscribe to Pro/
    );
  });
});

describe('ask a question', () => {
  test('builds a choice question and flattens the answer', async () => {
    reply({
      model: 'hesperan-1',
      answers: { answer: { type: 'choice', choice: 'negative', probabilities: { positive: 0.04, negative: 0.96 } } },
      usage: { input_tokens: 42 },
      timing_ms: 10,
    });
    const out = await run(askQuestion, {
      state: 'Never again.',
      question_type: 'choice',
      instructions: 'What is the tone?',
      criteria: {
        options: [
          { key: 'positive', meaning: 'praises the product' },
          { key: 'negative', meaning: '' },
        ],
      },
    });
    expect(lastRequest().url).toBe('https://api.hesperan.com/v1/systemone');
    expect(lastRequest().body).toEqual({
      state: 'Never again.',
      questions: {
        answer: {
          type: 'choice',
          instructions: 'What is the tone?',
          criteria: { positive: 'praises the product', negative: '' },
        },
      },
    });
    expect(out).toEqual({
      question_type: 'choice',
      answer: 'negative',
      probability: 0.96,
      probabilities: { positive: 0.04, negative: 0.96 },
      model: 'hesperan-1',
      input_tokens: 42,
    });
  });

  test('builds a yes/no question and leaves out empty criteria', async () => {
    reply({ model: 'hesperan-1', answers: { answer: { type: 'noul', noul: 0.97 } }, usage: { input_tokens: 9 }, timing_ms: 1 });
    const out = await run(askQuestion, {
      state: 'Verify your password here',
      question_type: 'noul',
      instructions: 'This email is a phishing attempt.',
      criteria: { yes_means: '', no_means: 'it is a legitimate message' },
    });
    expect(lastRequest().body.questions.answer).toEqual({
      type: 'noul',
      instructions: 'This email is a phishing attempt.',
      criteria: { false: 'it is a legitimate message' },
    });
    expect(out).toMatchObject({ question_type: 'yes_no', answer: 'yes', probability_yes: 0.97, probability_no: 0.03 });

    reply({ model: 'hesperan-1', answers: { answer: { type: 'noul', noul: 0.2 } }, usage: { input_tokens: 9 }, timing_ms: 1 });
    await run(askQuestion, { state: 'x', question_type: 'noul', instructions: 'A statement.', criteria: {} });
    expect(lastRequest().body.questions.answer).toEqual({ type: 'noul', instructions: 'A statement.' });
  });

  test('builds a score question', async () => {
    reply({
      model: 'hesperan-1',
      answers: { answer: { type: 'score', score: 2.64, probabilities: { '0': 0.01, '1': 0.06, '2': 0.21, '3': 0.72 } } },
      usage: { input_tokens: 30 },
      timing_ms: 1,
    });
    const out = await run(askQuestion, {
      state: { alert: 'disk full' },
      question_type: 'score',
      instructions: 'How urgent is this?',
      criteria: { levels: ['no action', 'this week', 'today', 'now'] },
    });
    expect(lastRequest().body.state).toEqual({ alert: 'disk full' });
    expect(lastRequest().body.questions.answer.criteria).toEqual(['no action', 'this week', 'today', 'now']);
    expect(out).toMatchObject({ question_type: 'score', score: 2.64, most_likely_level: '3' });
  });

  test('rejects incomplete questions before calling the API', async () => {
    const base = { state: 'x', instructions: 'Which?' };
    await expect(run(askQuestion, { ...base, question_type: 'choice', criteria: { options: [{ key: 'a' }] } })).rejects.toThrow(
      /at least two options/
    );
    await expect(
      run(askQuestion, { ...base, question_type: 'choice', criteria: { options: [{ key: 'a' }, { key: 'a' }] } })
    ).rejects.toThrow(/unique/);
    await expect(
      run(askQuestion, { ...base, question_type: 'choice', criteria: { options: [{ key: 'a b' }, { key: 'c' }] } })
    ).rejects.toThrow(/spaces/);
    await expect(run(askQuestion, { ...base, question_type: 'score', criteria: { levels: ['only'] } })).rejects.toThrow(
      /two levels/
    );
    expect(sendRequest).not.toHaveBeenCalled();
  });
});

const profiles = {
  profiles: [
    {
      slug: 'refund-check',
      name: 'Refund check',
      type: 'noul',
      options: ['true', 'false'],
      calibrated: false,
      calibration_status: 'running',
      calibration_version: 0,
      target_precision: 0.99,
    },
    {
      slug: 'ticket-routing',
      name: 'Ticket routing',
      type: 'choice',
      options: ['billing', 'shipping', 'technical'],
      calibrated: true,
      calibration_status: 'succeeded',
      calibration_version: 2,
      target_precision: 0.99,
    },
  ],
};

type Dropdown = { options: (props: Record<string, unknown>, ctx: unknown) => Promise<{ disabled?: boolean; placeholder?: string; options: { label: string; value: string }[] }> };

function dropdown(action: unknown, prop: string): Dropdown {
  return (action as { props: Record<string, Dropdown> }).props[prop];
}

describe('profile dropdowns', () => {
  test('list the profiles from the free GET /v1/profiles and mark uncalibrated ones', async () => {
    reply(profiles);
    const state = await dropdown(decideWithProfile, 'profile').options({ auth }, {});
    expect(lastRequest().method).toBe(HttpMethod.GET);
    expect(lastRequest().url).toBe('https://api.hesperan.com/v1/profiles');
    expect(lastRequest().headers.Authorization).toBe(`Bearer ${auth.secret_text}`);
    expect(state.options.map(({ label, value }) => ({ label, value }))).toEqual([
      { label: 'Refund check (refund-check) - not calibrated yet', value: 'refund-check' },
      { label: 'Ticket routing (ticket-routing)', value: 'ticket-routing' },
    ]);
  });

  test('ask to connect first, explain an empty account and a failed lookup', async () => {
    const profile = dropdown(decideWithProfile, 'profile');
    expect(await profile.options({}, {})).toMatchObject({ disabled: true, placeholder: /Connect/ });
    expect(sendRequest).not.toHaveBeenCalled();
    reply({ profiles: [] });
    expect(await profile.options({ auth }, {})).toMatchObject({ disabled: true, placeholder: /No decision profiles/ });
    fail(401, { error: 'unauthorized' });
    expect(await profile.options({ auth }, {})).toMatchObject({ disabled: true, placeholder: /unknown or revoked/ });
  });

  test("report outcome lists the chosen profile's answers", async () => {
    const actual = dropdown(reportOutcome, 'actual');
    expect(await actual.options({ auth }, {})).toMatchObject({ disabled: true, placeholder: /profile first/ });
    expect(sendRequest).not.toHaveBeenCalled();
    reply(profiles);
    expect((await actual.options({ auth, profile: 'ticket-routing' }, {})).options.map((o) => o.value)).toEqual([
      'billing',
      'shipping',
      'technical',
    ]);
    reply(profiles);
    expect((await actual.options({ auth, profile: 'refund-check' }, {})).options).toEqual([
      { label: 'Yes (true)', value: 'true' },
      { label: 'No (false)', value: 'false' },
    ]);
    reply(profiles);
    expect(await actual.options({ auth, profile: 'gone' }, {})).toMatchObject({ disabled: true, placeholder: /gone/ });
  });

  test('score profiles list their levels', () => {
    const [level] = hesperanProps.answerOptions({ ...profiles.profiles[1], type: 'score', options: ['0', '1', '2'] });
    expect(level).toEqual({ label: 'Level 0', value: '0' });
  });
});

describe('report outcome', () => {
  test('posts the decision id and the correct answer', async () => {
    reply({ ok: true, duplicate: true });
    const out = await run(reportOutcome, { decision_id: ' 0f6c ', actual: 'billing' });
    expect(lastRequest().url).toBe('https://api.hesperan.com/v1/outcomes');
    expect(lastRequest().body).toEqual({ decision_id: '0f6c', actual: 'billing' });
    expect(out).toEqual({ ok: true, duplicate: true, decision_id: '0f6c', actual: 'billing' });
  });
});

describe('key validation', () => {
  test('a known key is checked with the free GET /v1/me', async () => {
    reply({ ok: true, plan: 'free', model_status: 'unavailable' });
    expect(await hesperanApi.validateKey({ apiKey: ` ${auth.secret_text} ` })).toEqual({ valid: true });
    expect(lastRequest().method).toBe(HttpMethod.GET);
    expect(lastRequest().url).toBe('https://api.hesperan.com/v1/me');
    expect(lastRequest().headers.Authorization).toBe(`Bearer ${auth.secret_text}`);
    expect(lastRequest().body).toBeUndefined();
  });

  test('another status is not taken as a valid key', async () => {
    fail(500, { error: 'internal error' });
    expect(await hesperanApi.validateKey({ apiKey: auth.secret_text })).toMatchObject({ valid: false, error: /HTTP 500/ });
  });

  test('an unknown key is refused', async () => {
    fail(401, { error: 'unauthorized' });
    expect(await hesperanApi.validateKey({ apiKey: auth.secret_text })).toMatchObject({ valid: false });
  });

  test('a key without the hsp_ prefix is refused without a request', async () => {
    expect(await hesperanApi.validateKey({ apiKey: 'sk-123' })).toMatchObject({ valid: false });
    expect(sendRequest).not.toHaveBeenCalled();
  });
});
