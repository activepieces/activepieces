import { AppConnectionType } from '@activepieces/pieces-framework';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const SIMULATED_SLACK_LATENCY_MS = 120;

let concurrentNow = 0;
let concurrentPeak = 0;

vi.mock('@slack/web-api', () => ({
  WebClient: class {
    chat = {
      postMessage: async (args: { channel?: unknown }) => {
        concurrentNow += 1;
        concurrentPeak = Math.max(concurrentPeak, concurrentNow);
        await new Promise((resolve) => setTimeout(resolve, SIMULATED_SLACK_LATENCY_MS));
        concurrentNow -= 1;
        return { ok: true, channel: `D-${String(args.channel)}`, ts: '1.1' };
      },
    };
    conversations = { open: async () => ({ ok: true, channel: { id: 'D0' } }) };
    files = { uploadV2: async () => ({ ok: true }) };
  },
}));

const { slackSendMessageToMultipleUsersAction } = await import(
  '../src/lib/actions/send-message-to-multiple-users'
);
const { slackBulkDm } = await import('../src/lib/common/bulk-dm');

function userIdsFor(count: number): string[] {
  return Array.from({ length: count }, (_unused, index) =>
    `U${String(index).padStart(8, '0')}`,
  );
}

async function timeRun({ count, concurrency }: { count: number; concurrency: number }) {
  concurrentNow = 0;
  concurrentPeak = 0;

  const started = Date.now();
  const output = await slackSendMessageToMultipleUsersAction.run({
    auth: { type: AppConnectionType.CUSTOM_AUTH, props: { botToken: 'xoxb-test' } },
    propsValue: {
      mode: 'same_message',
      recipients: { userIds: userIdsFor(count), text: 'standup in 5' },
      concurrency,
    },
  } as never);

  return { elapsedMs: Date.now() - started, peak: concurrentPeak, sent: output.sent.length };
}

beforeEach(() => {
  concurrentNow = 0;
  concurrentPeak = 0;
});

describe(`bounded parallelism at a simulated ${SIMULATED_SLACK_LATENCY_MS}ms per DM`, () => {
  it('reports the loop baseline against the default and maximum limits', async () => {
    const count = slackBulkDm.maxRecipientsForLimit({ limit: 1 });

    const serial = await timeRun({ count, concurrency: 1 });
    const atFive = await timeRun({ count, concurrency: 5 });
    const atTwenty = await timeRun({ count, concurrency: 20 });

    const rows = [
      ['limit 1 (loop equivalent)', serial],
      ['limit 5 (default)', atFive],
      ['limit 20 (maximum)', atTwenty],
    ] as const;

    const lines = rows.map(
      ([label, result]) =>
        `${label.padEnd(26)} ${String(result.elapsedMs).padStart(5)}ms  peak in flight ${String(result.peak).padStart(2)}  speedup ${(serial.elapsedMs / result.elapsedMs).toFixed(1)}x`,
    );

    process.stdout.write(
      `\n  ${count} recipients, ${SIMULATED_SLACK_LATENCY_MS}ms simulated latency\n  ${lines.join('\n  ')}\n\n`,
    );

    expect(serial.sent).toBe(count);
    expect(atFive.sent).toBe(count);
    expect(atTwenty.sent).toBe(count);

    expect(serial.peak).toBe(1);
    expect(atFive.peak).toBe(5);
    expect(atTwenty.peak).toBe(Math.min(20, count));
  });

  it('never finishes faster than the theoretical floor of ceil(count / limit) rounds', async () => {
    const count = 20;
    const concurrency = 5;
    const theoreticalFloorMs = Math.ceil(count / concurrency) * SIMULATED_SLACK_LATENCY_MS;

    const result = await timeRun({ count, concurrency });

    process.stdout.write(
      `\n  theoretical floor ${theoreticalFloorMs}ms, measured ${result.elapsedMs}ms (overhead ${result.elapsedMs - theoreticalFloorMs}ms)\n\n`,
    );

    expect(result.peak).toBe(concurrency);
    expect(result.sent).toBe(count);
    expect(result.elapsedMs).toBeGreaterThanOrEqual(theoreticalFloorMs);
  });
});
