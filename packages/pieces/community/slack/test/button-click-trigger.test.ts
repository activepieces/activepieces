import { afterEach, describe, expect, it, vi } from 'vitest';
import { slack } from '../src/index';
import { newButtonClickTrigger } from '../src/lib/triggers/new-button-click';

const PUBLIC_URL = 'https://ap.example.com/';

function interactionRequest(interaction: Record<string, unknown>) {
  return {
    headers: {
      'content-type': 'application/x-www-form-urlencoded',
      'x-slack-request-timestamp': String(Math.floor(Date.now() / 1000)),
    },
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
    container: { type: 'message', message_ts: '1700000000.000100', channel_id: 'C123' },
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
  function runWithBody({ body, propsValue = {} }: { body: unknown; propsValue?: Record<string, unknown> }) {
    return newButtonClickTrigger.run({ propsValue, payload: { ...interactionRequest({}), body } } as never);
  }

  function run({ interaction, propsValue = {} }: { interaction: Record<string, unknown>; propsValue?: Record<string, unknown> }) {
    return runWithBody({ body: interactionRequest(interaction).body, propsValue });
  }

  it('returns the payload without the verification token', async () => {
    const outputs = await run({ interaction: buttonClick() });
    expect(outputs).toHaveLength(1);
    expect(outputs[0]).not.toHaveProperty('token');
    expect(outputs[0]).toMatchObject({ type: 'block_actions', channel: { id: 'C123' } });
  });

  it('ignores button clicks in modals and the App Home tab', async () => {
    expect(await run({ interaction: buttonClick({ container: { type: 'view', view_id: 'V1' }, channel: undefined }) })).toEqual([]);
  });

  it('fires for buttons in message attachments', async () => {
    expect(await run({ interaction: buttonClick({ container: { type: 'message_attachment' } }) })).toHaveLength(1);
  });

  it('keeps the action id filter when an item is not a string', async () => {
    const reject = buttonClick({ actions: [{ type: 'button', action_id: 'deploy_reject' }] });
    expect(await run({ interaction: reject, propsValue: { actionIds: ['deploy_approve', 5] } })).toEqual([]);
    expect(await run({ interaction: buttonClick(), propsValue: { actionIds: ['deploy_approve', 5] } })).toHaveLength(1);
  });

  it('keeps the channel filter when an item is not a string', async () => {
    expect(await run({ interaction: buttonClick(), propsValue: { channels: ['C999', null] } })).toEqual([]);
  });

  it('trims the action id prefix and action ids', async () => {
    expect(await run({ interaction: buttonClick(), propsValue: { actionIdPrefix: 'deploy_ ' } })).toHaveLength(1);
    expect(await run({ interaction: buttonClick(), propsValue: { actionIds: [' deploy_approve '] } })).toHaveLength(1);
  });

  it('accepts a payload whose team is null', async () => {
    expect(await run({ interaction: buttonClick({ team: null, user: { id: 'U123', team_id: 'T123' } }) })).toHaveLength(1);
  });

  it('filters by exact action ids', async () => {
    expect(await run({ interaction: buttonClick(), propsValue: { actionIds: ['deploy_approve'] } })).toHaveLength(1);
    expect(await run({ interaction: buttonClick(), propsValue: { actionIds: ['other'] } })).toEqual([]);
  });

  it('filters by action id prefix', async () => {
    expect(await run({ interaction: buttonClick(), propsValue: { actionIdPrefix: 'deploy_' } })).toHaveLength(1);
    expect(await run({ interaction: buttonClick(), propsValue: { actionIdPrefix: 'rollback_' } })).toEqual([]);
  });

  it('filters by channel', async () => {
    expect(await run({ interaction: buttonClick(), propsValue: { channels: ['C123'] } })).toHaveLength(1);
    expect(await run({ interaction: buttonClick(), propsValue: { channels: ['C999'] } })).toEqual([]);
    expect(await run({ interaction: buttonClick({ channel: undefined }), propsValue: { channels: ['C123'] } })).toEqual([]);
  });

  it('ignores non-button block actions and other interaction types', async () => {
    expect(
      await run({ interaction: buttonClick({ actions: [{ type: 'static_select', action_id: 'deploy_approve' }] }) }),
    ).toEqual([]);
    expect(await run({ interaction: { type: 'view_submission', team: { id: 'T123' } } })).toEqual([]);
  });

  it('ignores a malformed body', async () => {
    expect(
      await runWithBody({ body: 'nope' }),
    ).toEqual([]);
    expect(
      await runWithBody({ body: { payload: '{not json' } }),
    ).toEqual([]);
  });

  it('ignores a payload whose actions do not match the expected shape', async () => {
    expect(await run({ interaction: buttonClick({ actions: [{ type: 'button' }] }) })).toEqual([]);
  });
});

describe('new button click trigger edge cases and scale', () => {
  function runWith({ interaction, propsValue = {} }: { interaction: Record<string, unknown>; propsValue?: Record<string, unknown> }) {
    return newButtonClickTrigger.run({ propsValue, payload: interactionRequest(interaction) } as never);
  }

  it('ignores a click with no container', async () => {
    expect(await runWith({ interaction: buttonClick({ container: undefined }) })).toEqual([]);
  });

  it('ignores a click with no actions', async () => {
    expect(await runWith({ interaction: buttonClick({ actions: [] }) })).toEqual([]);
  });

  it('starts one run when several clicked actions match', async () => {
    const actions = [
      { type: 'button', action_id: 'deploy_approve' },
      { type: 'button', action_id: 'deploy_approve_2' },
    ];
    expect(await runWith({ interaction: buttonClick({ actions }), propsValue: { actionIdPrefix: 'deploy_' } })).toHaveLength(1);
  });

  it('treats a whitespace-only prefix as no prefix filter', async () => {
    expect(await runWith({ interaction: buttonClick(), propsValue: { actionIdPrefix: '   ' } })).toHaveLength(1);
  });

  it('matches unicode action ids exactly', async () => {
    const interaction = buttonClick({ actions: [{ type: 'button', action_id: 'موافقة_✅' }] });
    expect(await runWith({ interaction, propsValue: { actionIds: ['موافقة_✅'] } })).toHaveLength(1);
    expect(await runWith({ interaction, propsValue: { actionIds: ['موافقة'] } })).toEqual([]);
  });

  it('does not match a non-string filter item by its text form', async () => {
    expect(await runWith({ interaction: buttonClick(), propsValue: { actionIds: [{}] } })).toEqual([]);
    const interaction = buttonClick({ actions: [{ type: 'button', action_id: '[object Object]' }] });
    expect(await runWith({ interaction, propsValue: { actionIds: ['deploy_approve', {}] } })).toEqual([]);
  });

  it('handles 1,000 actions, a 10,000-item filter and a 1 MB message quickly', async () => {
    const actions = Array.from({ length: 1000 }, (_, i) => ({ type: 'button', action_id: `btn_${i}` }));
    const actionIds = Array.from({ length: 10000 }, (_, i) => `other_${i}`).concat('btn_999');
    const message = { type: 'message', ts: '1700000000.000100', text: 'x'.repeat(1024 * 1024) };
    const started = performance.now();
    const outputs = await runWith({ interaction: buttonClick({ actions, message }), propsValue: { actionIds } });
    const elapsed = performance.now() - started;
    expect(outputs).toHaveLength(1);
    expect(outputs[0]).toMatchObject({ message: { text: message.text } });
    expect(elapsed).toBeLessThan(1000);
  });
});
