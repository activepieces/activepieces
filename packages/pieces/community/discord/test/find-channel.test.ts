import { describe, expect, it, vi, beforeEach } from 'vitest';
import { httpClient } from '@activepieces/pieces-common';
import { discordFindChannel } from '../src/lib/actions/find-channel';
import { discordFindChannelAi } from '../src/lib/actions/ai-find-channel';

vi.mock('@activepieces/pieces-common', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@activepieces/pieces-common')>();
  return { ...actual, httpClient: { sendRequest: vi.fn() } };
});

const sendRequest = vi.mocked(httpClient.sendRequest);

const ctx = (name: string) => ({ auth: { secret_text: 'token' }, propsValue: { guild_id: '1', name } });
const runHuman = (name: string) => Reflect.apply(discordFindChannel.run, discordFindChannel, [ctx(name)]);
const runAi = (name: string) => Reflect.apply(discordFindChannelAi.run, discordFindChannelAi, [ctx(name)]);

describe('find channel (View Channel visibility)', () => {
  beforeEach(() => {
    sendRequest.mockReset();
    sendRequest.mockResolvedValue({
      status: 200,
      headers: {},
      body: [{ id: '10', name: 'general' }],
    });
  });

  it('human: returns the channel id and no message when found', async () => {
    expect(await runHuman('general')).toEqual({
      success: true,
      channel_id: '10',
      message: null,
    });
  });

  it('human: explains View Channel when not found', async () => {
    const out = await runHuman('secret');
    expect(out.success).toBe(false);
    expect(out.channel_id).toBeUndefined();
    expect(out.message).toContain('"secret"');
    expect(out.message).toContain('View Channel');
  });

  it('ai: returns found=true with name when found', async () => {
    expect(await runAi('general')).toEqual({
      found: true,
      channel_id: '10',
      name: 'general',
      message: null,
    });
  });

  it('ai: found=false with View Channel hint when not found', async () => {
    const out = await runAi('secret');
    expect(out.found).toBe(false);
    expect(out.message).toContain('View Channel');
  });
});
