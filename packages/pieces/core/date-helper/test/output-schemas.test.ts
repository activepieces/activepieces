/// <reference types="vitest/globals" />

import {
  Action,
  OutputSchemaField,
  createMockActionContext,
} from '@activepieces/pieces-framework';
import { addSubtractDateAction } from '../src/lib/actions/add-subtract-date';
import { dateDifferenceAction } from '../src/lib/actions/date-difference';
import { extractDateParts } from '../src/lib/actions/extract-date-parts';
import { firstDayOfPreviousMonthAction } from '../src/lib/actions/first-day-of-prior-month';
import { formatDateAction } from '../src/lib/actions/format-date';
import { getCurrentDate } from '../src/lib/actions/get-current-date';
import { lastDayOfPreviousMonthAction } from '../src/lib/actions/last-day-of-prior-month';
import { nextDayofWeek } from '../src/lib/actions/next-day-of-week';
import { nextDayofYear } from '../src/lib/actions/next-day-of-year';

/**
 * Props chosen so that every field a schema describes is actually produced —
 * the two multi-select actions request all of their supported units.
 */
const cases: { action: Action; propsValue: Record<string, unknown> }[] = [
  {
    action: formatDateAction,
    propsValue: {
      inputDate: '2024-06-15 10:00:00',
      inputFormat: 'YYYY-MM-DD HH:mm:ss',
      inputTimeZone: 'UTC',
      outputFormat: 'YYYY-MM-DD',
      outputTimeZone: 'UTC',
    },
  },
  {
    action: addSubtractDateAction,
    propsValue: {
      inputDate: '2024-06-15 10:00:00',
      inputDateFormat: 'YYYY-MM-DD HH:mm:ss',
      outputFormat: 'YYYY-MM-DD HH:mm:ss',
      expression: '+ 2 hour',
      timeZone: undefined,
      setTime: undefined,
      useCurrentTime: false,
    },
  },
  {
    action: getCurrentDate,
    propsValue: { timeFormat: 'YYYY-MM-DD HH:mm:ss', timeZone: 'UTC' },
  },
  {
    action: nextDayofWeek,
    propsValue: {
      weekday: 3,
      time: '09:00',
      currentTime: false,
      timeFormat: 'YYYY-MM-DD HH:mm:ss',
      timeZone: 'UTC',
    },
  },
  {
    action: nextDayofYear,
    propsValue: {
      month: 9,
      day: 17,
      time: '09:00',
      currentTime: false,
      timeFormat: 'YYYY-MM-DD HH:mm:ss',
      timeZone: 'UTC',
    },
  },
  {
    action: firstDayOfPreviousMonthAction,
    propsValue: {
      time: '00:00',
      currentTime: false,
      timeFormat: 'YYYY-MM-DD HH:mm:ss',
      timeZone: 'UTC',
    },
  },
  {
    action: lastDayOfPreviousMonthAction,
    propsValue: {
      time: '23:59',
      currentTime: false,
      timeFormat: 'YYYY-MM-DD HH:mm:ss',
      timeZone: 'UTC',
    },
  },
];

/**
 * These two return only the units picked in their multi-select, so a static
 * field list would render phantom "empty" rows for everything unselected.
 * They are intentionally left undescribed — see output-schemas.ts.
 */
const deliberatelyUndescribed: Action[] = [dateDifferenceAction, extractDateParts];

function resolve(root: unknown, path: string): unknown {
  if (path === '') return root;
  return path
    .split('.')
    .reduce<unknown>(
      (acc, segment) =>
        acc === null || acc === undefined
          ? undefined
          : (acc as Record<string, unknown>)[segment],
      root
    );
}

describe('date-helper output schemas', () => {
  test('every action declares an outputSchema', () => {
    for (const { action } of cases) {
      expect(action.outputSchema, `${action.name} has no outputSchema`).toBeDefined();
    }
  });

  test('all 7 schematized actions are covered by this test', () => {
    expect(cases).toHaveLength(7);
    expect(new Set(cases.map((c) => c.action.name)).size).toBe(7);
  });

  test('multi-select actions stay undescribed', () => {
    for (const action of deliberatelyUndescribed) {
      expect(
        action.outputSchema,
        `${action.name} must not declare an outputSchema: its keys depend on the units selected, so unselected units would render as phantom "empty" rows`
      ).toBeUndefined();
    }
  });

  for (const { action, propsValue } of cases) {
    describe(action.name, () => {
      test('every described path resolves against the real output', async () => {
        const output = await action.run(createMockActionContext({ propsValue }));
        const fields = action.outputSchema?.fields as OutputSchemaField[];

        for (const field of fields) {
          const path = field.value ?? field.key;
          expect(
            resolve(output, path),
            `${action.name}: path "${path}" does not resolve`
          ).toBeDefined();
        }
      });

      test('no output key is left undescribed', async () => {
        const output = await action.run(createMockActionContext({ propsValue }));
        const described = new Set(
          (action.outputSchema?.fields ?? []).map((f) => f.value ?? f.key)
        );

        for (const key of Object.keys(output as Record<string, unknown>)) {
          expect(described.has(key), `${action.name}: "${key}" is not described`).toBe(
            true
          );
        }
      });
    });
  }
});
