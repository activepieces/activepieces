import { afterEach, describe, expect, it, vi } from 'vitest';
import { slack } from '../src/index';
import { newButtonClickTrigger } from '../src/lib/triggers/new-button-click';

const PUBLIC_URL = 'https://ap.example.com/';

function interactionRequest(interaction: Record<string, unknown>) {
  return {
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body: { payload: JSON.stringify(interaction) },
    method: 'POST',
    queryParams: {},
  };
}

function parse(interaction: Record<string, unknown>) {
  return slack.events?.parseAndReply({
    payload: interactionRequest(interaction),
    server: { publicUrl: PUBLIC_URL },
  });
}

function buttonClick(overrides: Record<string, unknown> = {}) {
  return {
    type: 'block_actions',
    token: 'verification-token',
    team: { id: 'T123', domain: 'example' },
    user: { id: 'U123' },
    channel: { id: 'C123', name: 'general' },
    actions: [{ type: 'button', action_id: 'deploy_approve', block_id: 'b1', value: 'release-42' }],
    ...overrides,
  };
}

describe('slack parseAndReply block_actions routing', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('routes a regular button click as a block_actions event keyed by team id', () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);

    expect(parse(buttonClick())).toEqual({ event: 'block_actions', identifierValue: 'T123' });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('forwards a resume-url button without also emitting an event', async () => {
    const fetchMock = vi.fn(async () => new Response('{}', { status: 200 }));
    vi.stubGlobal('fetch', fetchMock);

    const result = parse(
      buttonClick({
        actions: [{ type: 'button', action_id: 'a', value: `${PUBLIC_URL}api/v1/flow-runs/x/requests/y` }],
      }),
    );
    await new Promise((resolve) => setTimeout(resolve, 20));

    expect(result).toEqual({ reply: { headers: {}, body: {} } });
    expect(result).not.toHaveProperty('event');
    expect(fetchMock).toHaveBeenCalledOnce();
  });

  it('falls back to the user team id when the payload has no team', () => {
    expect(parse(buttonClick({ team: undefined, user: { id: 'U123', team_id: 'T456' } }))).toEqual({
      event: 'block_actions',
      identifierValue: 'T456',
    });
  });

  it('acks without an event when no team id is present', () => {
    expect(parse(buttonClick({ team: undefined }))).toEqual({ reply: { headers: {}, body: {} } });
  });

  it('still routes modal interactions', () => {
    expect(parse({ type: 'view_submission', team: { id: 'T123' } })).toEqual({
      event: 'view_submission',
      identifierValue: 'T123',
    });
  });
});

describe('new button click trigger run', () => {
  function run(interaction: Record<string, unknown>, propsValue: Record<string, unknown> = {}) {
    return newButtonClickTrigger.run({
      propsValue,
      payload: interactionRequest(interaction),
    } as never);
  }

  it('returns the payload without the verification token', async () => {
    const [output] = (await run(buttonClick())) as Record<string, unknown>[];
    expect(output).not.toHaveProperty('token');
    expect(output).toMatchObject({ type: 'block_actions', channel: { id: 'C123' } });
  });

  it('filters by exact action ids', async () => {
    expect(await run(buttonClick(), { actionIds: ['deploy_approve'] })).toHaveLength(1);
    expect(await run(buttonClick(), { actionIds: ['other'] })).toEqual([]);
  });

  it('filters by action id prefix', async () => {
    expect(await run(buttonClick(), { actionIdPrefix: 'deploy_' })).toHaveLength(1);
    expect(await run(buttonClick(), { actionIdPrefix: 'rollback_' })).toEqual([]);
  });

  it('filters by channel', async () => {
    expect(await run(buttonClick(), { channels: ['C123'] })).toHaveLength(1);
    expect(await run(buttonClick(), { channels: ['C999'] })).toEqual([]);
    expect(await run(buttonClick({ channel: undefined }), { channels: ['C123'] })).toEqual([]);
  });

  it('ignores non-button block actions and other interaction types', async () => {
    expect(
      await run(buttonClick({ actions: [{ type: 'static_select', action_id: 'deploy_approve' }] })),
    ).toEqual([]);
    expect(await run({ type: 'view_submission', team: { id: 'T123' } })).toEqual([]);
  });

  it('ignores a malformed body', async () => {
    expect(
      await newButtonClickTrigger.run({ propsValue: {}, payload: { body: 'nope' } } as never),
    ).toEqual([]);
    expect(
      await newButtonClickTrigger.run({ propsValue: {}, payload: { body: { payload: '{not json' } } } as never),
    ).toEqual([]);
  });

  it('ignores a payload whose actions do not match the expected shape', async () => {
    expect(await run(buttonClick({ actions: [{ type: 'button' }] }))).toEqual([]);
  });
});
