import { DEFAULT_BATCH_SIZE, FlowActionType } from '@activepieces/shared';
import { describe, expect, it } from 'vitest';

import { formUtils } from '@/features/pieces/utils/form-utils';

const schema = formUtils.buildPieceSchema(
  FlowActionType.PROCESS_IN_BATCHES,
  '',
  null,
);

const buildStep = (settings: {
  items: string;
  batchSize: unknown;
  timeoutSeconds?: unknown;
}) => ({
  name: 'step_1',
  displayName: 'Process in Batches',
  type: FlowActionType.PROCESS_IN_BATCHES,
  valid: true,
  lastUpdatedDate: '2026-08-09T00:00:00.000Z',
  settings,
});

const messageFor = (
  result: { error?: { issues: { path: PropertyKey[]; message: string }[] } },
  field: string,
) => result.error?.issues.find((issue) => issue.path.at(-1) === field)?.message;

describe('Process in Batches form schema', () => {
  it('accepts an items expression with a whole batch size', () => {
    const result = schema.safeParse(
      buildStep({
        items: '{{ trigger.items }}',
        batchSize: DEFAULT_BATCH_SIZE,
      }),
    );
    expect(result.success).toBe(true);
  });

  it('rejects an empty items expression', () => {
    const result = schema.safeParse(
      buildStep({ items: '', batchSize: DEFAULT_BATCH_SIZE }),
    );
    expect(result.success).toBe(false);
  });

  it.each([0, -1])('rejects a batch size below 1 (%s)', (batchSize) => {
    const result = schema.safeParse(
      buildStep({ items: '{{ trigger.items }}', batchSize }),
    );
    expect(result.success).toBe(false);
    expect(messageFor(result, 'batchSize')).toBe('batchSizeMustBeAtLeastOne');
  });

  it('accepts a missing timeout and a timeout of at least one hour', () => {
    for (const timeoutSeconds of [undefined, 3600, 7200]) {
      const result = schema.safeParse(
        buildStep({
          items: '{{ trigger.items }}',
          batchSize: DEFAULT_BATCH_SIZE,
          timeoutSeconds,
        }),
      );
      expect(result.success).toBe(true);
    }
  });

  it.each([0, -3600, 1800])(
    'rejects a timeout below one hour (%s)',
    (timeoutSeconds) => {
      const result = schema.safeParse(
        buildStep({
          items: '{{ trigger.items }}',
          batchSize: DEFAULT_BATCH_SIZE,
          timeoutSeconds,
        }),
      );
      expect(result.success).toBe(false);
      expect(messageFor(result, 'timeoutSeconds')).toBe(
        'batchTimeoutMustBeAtLeastOneHour',
      );
    },
  );

  it.each([1.5, '10', undefined])(
    'rejects a non-integer batch size (%s)',
    (batchSize) => {
      const result = schema.safeParse(
        buildStep({ items: '{{ trigger.items }}', batchSize }),
      );
      expect(result.success).toBe(false);
      expect(messageFor(result, 'batchSize')).toBe(
        'batchSizeMustBeAWholeNumber',
      );
    },
  );
});
