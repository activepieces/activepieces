import { describe, expect, it } from 'vitest';
import { taskCompletedTrigger } from '../src/lib/triggers/task-completed';
import { taskFailedTrigger } from '../src/lib/triggers/task-failed';
import * as signatureTriggers from '../src/lib/triggers/signature-events';
import * as samples from '../src/lib/triggers/sample-payloads';
import { fakeContext, loose, record } from './helpers';
import { claimDelivery } from '../src/lib/triggers/common';

const SECRET = 'abcdefghijklmnop1234';

function ctx({ body, secret = SECRET, given = SECRET, tools }: { body: unknown; secret?: string; given?: string; tools?: string[] }) {
  const fake = fakeContext({ webhook_secret: secret, tools });
  return { ...fake, context: { ...fake.context, payload: { body, headers: {}, queryParams: given === '' ? {} : { ap_secret: given } } } };
}

const triggers: Array<[string, { run: (c: never) => Promise<unknown[]>; outputSchema?: unknown; aiMetadata?: unknown }, unknown]> = [
  ['task_completed', taskCompletedTrigger, samples.taskCompletedSample],
  ['task_failed', taskFailedTrigger, samples.taskFailedSample],
  ['signature_created', signatureTriggers.signatureCreatedTrigger, samples.signatureCreatedSample],
  ['signature_sent', signatureTriggers.signatureSentTrigger, samples.signatureSentSample],
  ['signature_completed', signatureTriggers.signatureCompletedTrigger, samples.signatureCompletedSample],
  ['signature_declined', signatureTriggers.signatureDeclinedTrigger, samples.signatureDeclinedSample],
  ['signature_expired', signatureTriggers.signatureExpiredTrigger, samples.signatureExpiredSample],
  ['signature_voided', signatureTriggers.signatureVoidedTrigger, samples.signatureVoidedSample],
  ['signer_viewed', signatureTriggers.signerViewedTrigger, samples.signerViewedSample],
  ['signer_signed', signatureTriggers.signerSignedTrigger, samples.signerSignedSample],
  ['signer_declined', signatureTriggers.signerDeclinedTrigger, samples.signerDeclinedSample],
];

describe.each(triggers)('%s', (_name, trigger, sample) => {
  it('has outputSchema and aiMetadata', () => {
    expect(trigger.outputSchema).toBeDefined();
    expect(trigger.aiMetadata).toBeDefined();
  });
  it('fires once with the right secret and dedupes a retry', async () => {
    const { context } = ctx({ body: sample });
    const first = await trigger.run(loose(context));
    expect(first).toHaveLength(1);
    expect(first[0]).toMatchObject({ event: record(sample)['event'], _dedupe_key: expect.stringMatching(/^iloveapi:/) });
    expect(await trigger.run(loose(context))).toHaveLength(0);
  });
  it('ignores a missing or wrong secret', async () => {
    expect(await trigger.run(loose(ctx({ body: sample, given: '' }).context))).toHaveLength(0);
    expect(await trigger.run(loose(ctx({ body: sample, given: 'wrong-secret-0000000' }).context))).toHaveLength(0);
  });
  it('ignores another event', async () => {
    expect(await trigger.run(loose(ctx({ body: { event: 'other.event', data: {} } }).context))).toHaveLength(0);
  });
});

describe('task triggers', () => {
  it('apply the tool filter', async () => {
    expect(await taskCompletedTrigger.run(loose(ctx({ body: samples.taskCompletedSample, tools: ['merge'] }).context))).toHaveLength(0);
    expect(await taskCompletedTrigger.run(loose(ctx({ body: samples.taskCompletedSample, tools: ['compress'] }).context))).toHaveLength(1);
  });
  it('refuse a short secret', async () => {
    await expect(taskCompletedTrigger.run(loose(ctx({ body: samples.taskCompletedSample, secret: 'short' }).context))).rejects.toThrow(/at least 16/);
  });
  it('keep dedupe state on disable so a retry after republish is still dropped', async () => {
    const { context, store } = ctx({ body: samples.taskCompletedSample });
    await taskCompletedTrigger.run(loose(context));
    expect(store.size).toBe(1);
    await taskCompletedTrigger.onDisable(loose(context));
    expect(store.size).toBe(1);
    expect(await taskCompletedTrigger.run(loose(context))).toHaveLength(0);
  });
});

describe('claimDelivery', () => {
  it('lets only the write that survived claim a delivery when two arrive together', async () => {
    const data = new Map<string, unknown>();
    let pending: Array<() => void> = [];
    const store = {
      get: async (key: string) => data.get(key) ?? null,
      put: async (key: string, value: unknown) => {
        await new Promise<void>((resolve) => pending.push(resolve));
        data.set(key, value);
        return value;
      },
      delete: async (key: string) => {
        data.delete(key);
      },
    };
    const first = claimDelivery({ store: loose(store), key: 'a' });
    const second = claimDelivery({ store: loose(store), key: 'b' });
    await new Promise((resolve) => setImmediate(resolve));
    const release = pending;
    pending = [];
    release.forEach((resolve) => resolve());
    const results = await Promise.all([first, second]);
    expect(results.filter(Boolean)).toHaveLength(1);
  });
});
