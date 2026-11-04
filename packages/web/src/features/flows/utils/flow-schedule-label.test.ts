import {
  FlowTriggerType,
  PopulatedFlow,
  ScheduleOptions,
  TriggerSourceScheduleType,
} from '@activepieces/shared';
import i18next from 'i18next';
import ICU from 'i18next-icu';
import { beforeAll, describe, expect, it } from 'vitest';

import { flowScheduleLabel } from './flow-schedule-label';

const flowWith = (schedule: ScheduleOptions | null, pieceName: string) =>
  ({
    version: { trigger: { type: FlowTriggerType.PIECE } },
    triggerSource: { schedule, pieceName },
  } as unknown as PopulatedFlow);

const cron = (cronExpression: string, timezone: string): ScheduleOptions => ({
  type: TriggerSourceScheduleType.CRON_EXPRESSION,
  cronExpression,
  timezone,
});

const SCHEDULE = '@activepieces/piece-schedule';
// Winter date, so Cairo is UTC+2 and nothing depends on daylight saving.
const now = new Date('2026-01-15T12:00:00Z');

describe('flowScheduleLabel', () => {
  beforeAll(async () => {
    await i18next.use(ICU).init({ lng: 'en', resources: {} });
  });

  it.each([
    // Polling runs only on new data; a Schedule interval always runs.
    [
      flowWith(
        { type: TriggerSourceScheduleType.INTERVAL, intervalMs: 300_000 },
        '@activepieces/piece-hubspot',
      ),
      'Africa/Cairo',
      ['Every 5 min', 'if new data'],
    ],
    // Older Every X Minutes flows store a */N cron instead of an interval.
    [
      flowWith(cron('*/15 * * * *', 'UTC'), SCHEDULE),
      'Africa/Cairo',
      ['Every 15 min', 'always'],
    ],
    [
      flowWith(cron('0 8 * * *', 'Africa/Cairo'), SCHEDULE),
      'Africa/Cairo',
      ['Daily', 'at 8:00 AM'],
    ],
    // Viewer in another zone: the time names its zone so it isn't read as local.
    [
      flowWith(cron('0 8 * * *', 'UTC'), SCHEDULE),
      'Africa/Cairo',
      ['Daily', 'at 8:00 AM UTC'],
    ],
    [
      flowWith(cron('0 9 * * 1-5', 'Africa/Cairo'), SCHEDULE),
      'Africa/Cairo',
      ['Weekdays', 'at 9:00 AM'],
    ],
    [
      flowWith(cron('0 9 * * 7', 'Africa/Cairo'), SCHEDULE),
      'Africa/Cairo',
      ['Weekly', 'Sun at 9:00 AM'],
    ],
    [
      flowWith(cron('0 9 31 * *', 'Africa/Cairo'), SCHEDULE),
      'Africa/Cairo',
      ['Monthly', '31st at 9:00 AM'],
    ],
    // A manual flow has a trigger source but only runs from the Run Flow button.
    [
      flowWith(null, '@activepieces/piece-manual-trigger'),
      'Africa/Cairo',
      ['Manual', 'run by hand'],
    ],
    [
      flowWith(cron('0 9,17 * * 1-5', 'Africa/Cairo'), SCHEDULE),
      'Africa/Cairo',
      ['Scheduled', 'custom times'],
    ],
  ])('labels %#', (flow, viewerTimeZone, [title, detail]) => {
    const label = flowScheduleLabel(flow, {
      locale: 'en-US',
      viewerTimeZone,
      now,
    });
    expect([label?.title, label?.detail]).toEqual([title, detail]);
  });

  it('converts the run time to the viewer’s zone in the tooltip', () => {
    const label = flowScheduleLabel(
      flowWith(cron('0 8 * * *', 'UTC'), SCHEDULE),
      {
        locale: 'en-US',
        viewerTimeZone: 'Africa/Cairo',
        now,
      },
    );
    expect(label?.tooltip).toBe(
      'Runs every day at 8:00 AM UTC (10:00 AM your time).',
    );
  });

  // Mon–Fri 22:00 UTC is Tue–Sat in Tokyo, so a "your time" would name the wrong days.
  it('gives no viewer-time conversion for weekday schedules in another zone', () => {
    const label = flowScheduleLabel(
      flowWith(cron('0 22 * * 1-5', 'UTC'), SCHEDULE),
      { locale: 'en-US', viewerTimeZone: 'Asia/Tokyo', now },
    );
    expect(label?.tooltip).toBe('Runs Monday to Friday at 10:00 PM UTC.');
  });

  // Untranslated keys fall back to English; ICU ordinals in German printed "1th".
  it('does not print English ordinal suffixes in other languages', () => {
    const label = flowScheduleLabel(
      flowWith(cron('0 9 1 * *', 'UTC'), SCHEDULE),
      { locale: 'de', viewerTimeZone: 'UTC', now },
    );
    expect(label?.detail).toBe('1 at 9:00');
  });

  // The list carries the draft version; an edited draft must not hide a live trigger.
  it('describes the live trigger even when the draft trigger is empty', () => {
    const flow = {
      version: { trigger: { type: FlowTriggerType.EMPTY } },
      triggerSource: {
        schedule: null,
        pieceName: '@activepieces/piece-stripe',
      },
    } as unknown as PopulatedFlow;
    expect(flowScheduleLabel(flow, { locale: 'en-US', now })?.title).toBe(
      'Instant',
    );
  });
});
