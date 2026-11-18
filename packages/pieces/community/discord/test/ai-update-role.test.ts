import { describe, expect, it, vi, beforeEach } from 'vitest';
import { httpClient } from '@activepieces/pieces-common';
import { discordUpdateRole } from '../src/lib/actions/ai-update-role';

vi.mock('@activepieces/pieces-common', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@activepieces/pieces-common')>();
  return {
    ...actual,
    httpClient: { sendRequest: vi.fn() },
  };
});

const sendRequest = vi.mocked(httpClient.sendRequest);

async function runWith(props: Record<string, unknown>) {
  const ctx = {
    auth: { secret_text: 'token' },
    propsValue: { guild_id: '1', role_id: '2', ...props },
  };
  await Reflect.apply(discordUpdateRole.run, discordUpdateRole, [ctx]);
  const request = sendRequest.mock.calls[0][0];
  return request.body;
}

describe('discord_update_role tri-state fields', () => {
  beforeEach(() => {
    sendRequest.mockReset();
    sendRequest.mockResolvedValue({ status: 200, headers: {}, body: { id: '2', name: 'r' } });
  });

  it.each([
    ['yes', true],
    ['no', false],
    ['true', true],
    ['false', false],
    [' TRUE ', true],
    [true, true],
    [false, false],
  ])('sends %s as %s', async (input, expected) => {
    const body = await runWith({ hoist: input, mentionable: input });
    expect(body).toEqual({ hoist: expected, mentionable: expected });
  });

  it.each([['unchanged'], [undefined], [null], ['']])('omits fields for %s', async (input) => {
    const body = await runWith({ hoist: input, mentionable: input });
    expect(body).toEqual({});
  });

  it('rename sends neither hoist nor mentionable', async () => {
    const body = await runWith({ name: 'New name' });
    expect(body).toEqual({ name: 'New name' });
  });
});
