import {
  FlowOperationStatus,
  FlowStatus,
  FlowTriggerType,
  FlowVersionState,
  PopulatedFlow,
  ScheduleOptions,
  TriggerSourceScheduleType,
} from '@activepieces/shared';
import i18next from 'i18next';
import ICU from 'i18next-icu';
import { beforeAll, describe, expect, it } from 'vitest';

import { flowScheduleLabelUtils } from '@/features/flows/utils/flow-schedule-label';

const SCHEDULE = '@activepieces/piece-schedule';
const winter = new Date('2026-01-15T12:00:00Z');

describe('flowScheduleLabelUtils.describe', () => {
  beforeAll(async () => {
    await i18next.use(ICU).init({ lng: 'en', resources: {} });
  });

  it.each([
    [
      'polling on the server interval',
      interval(300_000),
      'piece-hubspot',
      'On changes',
      'every 5 min',
    ],
    [
      'an Every X Minutes schedule',
      interval(900_000),
      SCHEDULE,
      'On schedule',
      'every 15 min',
    ],
    [
      'a legacy */N cron',
      cron('*/15 * * * *'),
      SCHEDULE,
      'On schedule',
      'every 15 min',
    ],
    [
      'the Cron Expression default 0/5',
      cron('0/5 * * * *'),
      SCHEDULE,
      'On schedule',
      'every 5 min',
    ],
    [
      'a */N cron with uneven gaps',
      cron('*/45 * * * *'),
      SCHEDULE,
      'On schedule',
      'custom times',
    ],
    [
      'Sunday written as 7',
      cron('0 9 * * 7', 'Africa/Cairo'),
      SCHEDULE,
      'On schedule',
      'Sun at 9 AM',
    ],
    [
      'a day that some months lack',
      cron('0 9 31 * *', 'Africa/Cairo'),
      SCHEDULE,
      'On schedule',
      '31st at 9 AM',
    ],
    ['a webhook-style trigger', null, 'piece-stripe', 'On event', 'instantly'],
    [
      'the manual trigger',
      null,
      'piece-manual-trigger',
      'Manual',
      'via Run Flow',
    ],
  ])('labels %s', (_case, schedule, piece, title, detail) => {
    const label = flowScheduleLabelUtils.describe({
      flow: flowWith({ schedule, pieceName: pieceName(piece) }),
      locale: 'en-US',
      viewerTimeZone: 'Africa/Cairo',
      now: winter,
    });
    expect([label?.title, label?.detail]).toEqual([title, detail]);
  });

  it.each([
    [
      'converts to the viewer’s time',
      winter,
      'UTC',
      'Africa/Cairo',
      'Runs every day at 8 AM UTC (10 AM your time).',
    ],
    [
      'uses the next run’s offsets across a clock change',
      new Date('2026-03-07T15:00:00Z'),
      'America/New_York',
      'Europe/Berlin',
      'Runs every day at 9 AM EDT (2 PM your time).',
    ],
  ])('%s', (_case, now, scheduleZone, viewerTimeZone, tooltip) => {
    const hour = scheduleZone === 'UTC' ? 8 : 9;
    const label = flowScheduleLabelUtils.describe({
      flow: flowWith({
        schedule: cron(`0 ${hour} * * *`, scheduleZone),
        pieceName: SCHEDULE,
      }),
      locale: 'en-US',
      viewerTimeZone,
      now,
    });
    expect(label?.tooltip).toBe(tooltip);
  });

  it('gives no viewer time for weekdays, which can shift across zones', () => {
    const label = flowScheduleLabelUtils.describe({
      flow: flowWith({ schedule: cron('0 22 * * 1-5'), pieceName: SCHEDULE }),
      locale: 'en-US',
      viewerTimeZone: 'Asia/Tokyo',
      now: winter,
    });
    expect(label?.tooltip).toBe('Runs Monday to Friday at 10 PM UTC.');
  });

  it('names the schedule zone for hourly crons outside UTC', () => {
    const label = flowScheduleLabelUtils.describe({
      flow: flowWith({
        schedule: cron('0 * * * *', 'Asia/Kolkata'),
        pieceName: SCHEDULE,
      }),
      locale: 'en-US',
      viewerTimeZone: 'UTC',
      now: winter,
    });
    expect(label?.tooltip).toBe('Runs every hour on the hour (Kolkata time).');
  });

  it('prints no English ordinal suffix in other languages', () => {
    const label = flowScheduleLabelUtils.describe({
      flow: flowWith({ schedule: cron('0 9 2 * *'), pieceName: SCHEDULE }),
      locale: 'de',
      viewerTimeZone: 'UTC',
      now: winter,
    });
    expect(label?.detail).not.toMatch(/2nd/);
  });

  it('shows nothing when the live trigger is unknown, whatever the draft says', () => {
    const label = flowScheduleLabelUtils.describe({
      flow: flowWith({
        schedule: null,
        pieceName: SCHEDULE,
        withoutTriggerSource: true,
      }),
      locale: 'en-US',
    });
    expect(label).toBeNull();
  });
});

function interval(intervalMs: number): ScheduleOptions {
  return { type: TriggerSourceScheduleType.INTERVAL, intervalMs };
}

function cron(cronExpression: string, timezone = 'UTC'): ScheduleOptions {
  return {
    type: TriggerSourceScheduleType.CRON_EXPRESSION,
    cronExpression,
    timezone,
  };
}

function pieceName(piece: string): string {
  return piece.startsWith('@') ? piece : `@activepieces/${piece}`;
}

function flowWith({
  schedule,
  pieceName,
  withoutTriggerSource = false,
}: {
  schedule: ScheduleOptions | null;
  pieceName: string;
  withoutTriggerSource?: boolean;
}): PopulatedFlow {
  return {
    id: 'flow-1',
    created: '2026-01-01T00:00:00.000Z',
    updated: '2026-01-01T00:00:00.000Z',
    projectId: 'project-1',
    externalId: 'flow-1',
    ownerId: null,
    folderId: null,
    status: FlowStatus.ENABLED,
    publishedVersionId: 'version-1',
    metadata: null,
    operationStatus: FlowOperationStatus.NONE,
    timeSavedPerRun: null,
    templateId: null,
    createdBy: null,
    triggerSource: withoutTriggerSource ? undefined : { schedule, pieceName },
    version: {
      id: 'version-1',
      created: '2026-01-01T00:00:00.000Z',
      updated: '2026-01-01T00:00:00.000Z',
      flowId: 'flow-1',
      displayName: 'Daily report',
      trigger: {
        name: 'trigger',
        valid: true,
        displayName: 'Every Day',
        type: FlowTriggerType.EMPTY,
        settings: {},
        lastUpdatedDate: '2026-01-01T00:00:00.000Z',
      },
      updatedBy: null,
      valid: true,
      schemaVersion: null,
      agentIds: [],
      state: FlowVersionState.LOCKED,
      connectionIds: [],
      backupFiles: null,
      notes: [],
    },
  };
}
