import { TelemetryEventName } from '@activepieces/shared';
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

  it('lists every described event under exactly one group', () => {
    const events = Object.values(trackedEventsCatalog.buildEventLabels());
    const listed = trackedEventsCatalog
      .buildGroups()
      .flatMap((group) => group.labels);

    expect(listed.sort()).toEqual(events.map((event) => event.label).sort());
  });
});
