import { describe, expect, it } from 'vitest';

import { processInBatchesUtils } from '@/app/builder/step-settings/process-in-batches-utils';

const outputSampleData = {
  step_1: { rows: [1, 2, 3] },
  step_2: ['a', 'b'],
  step_3: { count: 4 },
};

describe('resolveItemsCount', () => {
  it('resolves a mention carrying the output channel segment', () => {
    expect(
      processInBatchesUtils.resolveItemsCount({
        items: "{{step_1['output']['rows']}}",
        outputSampleData,
      }),
    ).toBe(3);
  });

  it('resolves a mention without the output channel segment', () => {
    expect(
      processInBatchesUtils.resolveItemsCount({
        items: '{{step_2}}',
        outputSampleData,
      }),
    ).toBe(2);
  });

  it('unwraps a formula-wrapped mention', () => {
    expect(
      processInBatchesUtils.resolveItemsCount({
        items: "ap-formula-v1::{{{step_1['output']['rows']}}}::ap-formula-v1",
        outputSampleData,
      }),
    ).toBe(3);
  });

  it('returns null when the resolved value is not an array', () => {
    expect(
      processInBatchesUtils.resolveItemsCount({
        items: "{{step_3['output']['count']}}",
        outputSampleData,
      }),
    ).toBeNull();
  });

  it('returns null for mixed text, unknown steps and empty input', () => {
    expect(
      processInBatchesUtils.resolveItemsCount({
        items: 'rows: {{step_2}}',
        outputSampleData,
      }),
    ).toBeNull();
    expect(
      processInBatchesUtils.resolveItemsCount({
        items: '{{step_9}}',
        outputSampleData,
      }),
    ).toBeNull();
    expect(
      processInBatchesUtils.resolveItemsCount({
        items: undefined,
        outputSampleData,
      }),
    ).toBeNull();
  });
});

describe('timeout conversion', () => {
  it('round-trips whole hours through seconds', () => {
    expect(processInBatchesUtils.hoursToSeconds(1)).toBe(3600);
    expect(processInBatchesUtils.secondsToHours(3600)).toBe(1);
    expect(processInBatchesUtils.secondsToHours(720 * 3600)).toBe(720);
  });

  it('treats an empty or unparseable input as no timeout', () => {
    expect(processInBatchesUtils.hoursToSeconds(undefined)).toBeUndefined();
    expect(processInBatchesUtils.hoursToSeconds(Number.NaN)).toBeUndefined();
    expect(processInBatchesUtils.secondsToHours(undefined)).toBeUndefined();
  });

  it('rounds a sub-hour stored value to the nearest hour for display', () => {
    expect(processInBatchesUtils.secondsToHours(5400)).toBe(2);
    expect(processInBatchesUtils.hoursToSeconds(2.6)).toBe(3 * 3600);
  });
});
