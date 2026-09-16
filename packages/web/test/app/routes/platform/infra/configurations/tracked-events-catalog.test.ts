import {
  isCloudOnlyTelemetryEvent,
  TelemetryEventName,
} from '@activepieces/shared';
import { describe, expect, it, vi } from 'vitest';

vi.mock('i18next', () => ({
  t: (key: string) => key,
}));

import { trackedEventsCatalog } from '@/app/routes/platform/infra/configurations/tracked-events-catalog';

describe('trackedEventsCatalog', () => {
  it('describes every telemetry event', () => {
    const described = Object.keys(trackedEventsCatalog.buildEventLabels());
    const tracked: string[] = Object.values(TelemetryEventName);

    expect(described.sort()).toEqual(tracked.sort());
  });

  it('lists every self-hosted event under exactly one group', () => {
    const selfHosted = Object.entries(trackedEventsCatalog.buildEventLabels())
      .filter(([name]) => !isCloudOnlyTelemetryEvent(name as TelemetryEventName))
      .map(([, event]) => event.label);
    const listed = trackedEventsCatalog
      .buildGroups()
      .flatMap((group) => group.labels);

    expect(listed.sort()).toEqual(selfHosted.sort());
  });

  it('hides the events the server refuses to send off cloud', () => {
    const cloudOnly = Object.entries(trackedEventsCatalog.buildEventLabels())
      .filter(([name]) => isCloudOnlyTelemetryEvent(name as TelemetryEventName))
      .map(([, event]) => event.label);
    const listed = trackedEventsCatalog
      .buildGroups()
      .flatMap((group) => group.labels);

    expect(cloudOnly.length).toBeGreaterThan(0);
    expect(listed).toEqual(expect.not.arrayContaining(cloudOnly));
  });

  it('drops the account groups once every event in them is cloud-only', () => {
    const groupIds = trackedEventsCatalog.buildGroups().map((group) => group.id);

    expect(groupIds).not.toContain('emailCodes');
    expect(groupIds).not.toContain('accounts');
    expect(groupIds).toEqual(['flows', 'mcp']);
  });
});
