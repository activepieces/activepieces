import { TriggerStrategy, createTrigger } from '@activepieces/pieces-framework';
import { currentYear, makeClient, newestFirst, pollNewById } from '../common';
import { ClockodoClient } from '../common/client';
import { clockodoOutputSchemas } from '../common/output-schemas';
import { Absence } from '../common/models/absence';
import { clockodoAuth } from '../auth';

const STORE_KEY = 'clockodo_new_absence_last_id';

async function fetchAbsences(client: ClockodoClient): Promise<Absence[]> {
  const year = currentYear();
  const byId = new Map<number, Absence>();
  for (const y of [year - 1, year, year + 1]) {
    const absences = await client.listAbsences({ year: y });
    for (const absence of absences) {
      byId.set(absence.id, absence);
    }
  }
  return [...byId.values()];
}

export default createTrigger({
  auth: clockodoAuth,
  name: 'new_absence_enquiry',
  classification: 'READ',
  displayName: 'New Absence Enquiry',
  description: 'Triggers when a new absence is created in Clockodo (any status)',
  aiMetadata: {
    description:
      'Fires once for each new absence (vacation, sick day or other time off) of any status (requested or already approved) created in Clockodo whose dates fall in the previous, current or next calendar year, so requests across the year boundary are included. Emits the absence record with its type, status, date range and user.',
  },
  type: TriggerStrategy.POLLING,
  props: {},
  outputSchema: clockodoOutputSchemas.absence,
  sampleData: {
    id: 4410923,
    users_id: 349802,
    date_since: '2026-12-28',
    date_until: '2027-01-02',
    status: 0,
    type: 1,
    note: 'Family trip',
    count_days: 4,
    half_day: false,
    count_hours: null,
    sick_note: false,
    date_enquired: '2026-11-20',
    date_approved: null,
    approved_by: null,
  },
  onEnable: async (context) => {
    const items = await fetchAbsences(makeClient(context.auth.props));
    await context.store.delete(STORE_KEY);
    await pollNewById({ store: context.store, storeKey: STORE_KEY, items });
  },
  onDisable: async (context) => {
    await context.store.delete(STORE_KEY);
  },
  run: async (context) => {
    const items = await fetchAbsences(makeClient(context.auth.props));
    return pollNewById({ store: context.store, storeKey: STORE_KEY, items });
  },
  test: async (context) => {
    const items = await fetchAbsences(makeClient(context.auth.props));
    return newestFirst({ items, limit: 5 });
  },
});
