import { afterEach, describe, expect, it, vi } from 'vitest';
import { slack } from '../src/index';

const PUBLIC_URL = 'https://ap.example.com/';

describe('slack button click forward', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('does not leave an unhandled rejection when forwarding the click fails', async () => {
    const rejections: unknown[] = [];
    const onRejection = (reason: unknown) => {
      rejections.push(reason);
    };
    process.on('unhandledRejection', onRejection);
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const fetchMock = vi.fn(async () => new Response('{"message":"not found"}', { status: 404 }));
    vi.stubGlobal('fetch', fetchMock);

    const interaction = {
      type: 'block_actions',
      actions: [{ type: 'button', value: `${PUBLIC_URL}api/v1/flow-runs/x/requests/y` }],
    };
    const result = slack.events?.parseAndReply({
      payload: {
        headers: { 'content-type': 'application/x-www-form-urlencoded' },
        body: { payload: JSON.stringify(interaction) },
        method: 'POST',
        queryParams: {},
      },
      server: { publicUrl: PUBLIC_URL },
    });
    await new Promise((resolve) => setTimeout(resolve, 50));
    process.off('unhandledRejection', onRejection);

    expect(fetchMock).toHaveBeenCalledOnce();
    expect(result).toBeDefined();
    expect(rejections).toEqual([]);
  });
});
