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
      .filter(
        ([name]) => !isCloudOnlyTelemetryEvent(name as TelemetryEventName),
      )
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

  it('drops a group once every event in it is cloud-only', () => {
    const groupIds = trackedEventsCatalog
      .buildGroups()
      .map((group) => group.id);

    expect(groupIds).not.toContain('emailCodes');
    expect(groupIds).not.toContain('billing');
    expect(groupIds).toEqual(['accounts', 'flows', 'mcp']);
  });

  it('keeps only the self-hosted invitation events in the accounts group', () => {
    const accounts = trackedEventsCatalog
      .buildGroups()
      .find((group) => group.id === 'accounts');

    expect(accounts?.labels.sort()).toEqual(
      ['Invitation accepted', 'Invitation sent'].sort(),
    );
  });
});
