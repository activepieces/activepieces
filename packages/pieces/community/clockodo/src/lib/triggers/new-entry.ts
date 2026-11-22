import { TriggerStrategy, createTrigger } from '@activepieces/pieces-framework';
import { makeClient, newestFirst, pollNewById } from '../common';
import { ClockodoClient } from '../common/client';
import { clockodoRequests } from '../common/requests';
import { clockodoOutputSchemas } from '../common/output-schemas';
import { Entry } from '../common/models/entry';
import { clockodoAuth } from '../auth';

const DAY_MS = 24 * 60 * 60 * 1000;
const LOOKBACK_DAYS = 90;
const LOOKAHEAD_DAYS = 30;
const STORE_KEY = 'clockodo_new_entry_last_id';

async function fetchWindow(client: ClockodoClient): Promise<Entry[]> {
  const now = Date.now();
  return client.listAllEntries({
    time_since: clockodoRequests.toClockodoDateTime({
      value: new Date(now - LOOKBACK_DAYS * DAY_MS).toISOString(),
      field: 'time_since',
    }),
    time_until: clockodoRequests.toClockodoDateTime({
      value: new Date(now + LOOKAHEAD_DAYS * DAY_MS).toISOString(),
      field: 'time_until',
    }),
  });
}

export default createTrigger({
  auth: clockodoAuth,
  name: 'new_entry',
  classification: 'READ',
  displayName: 'New Entry',
  description:
    'Triggers when a new time entry is created (entries dated within the last 90 days or the next 30 days)',
  aiMetadata: {
    description:
      'Fires once for each new time entry created in Clockodo, including back-dated entries whose start time is within the last 90 days and running clock entries. Emits the entry record with its customer, project, service, user, start/end time and billing flag.',
  },
  type: TriggerStrategy.POLLING,
  props: {},
  outputSchema: clockodoOutputSchemas.entry,
  sampleData: {
    id: 158722301,
    type: 1,
    customers_id: 2194711,
    projects_id: 1786523,
    services_id: 803245,
    users_id: 349802,
    billable: 1,
    texts_id: 5521093,
    text: 'Sprint planning',
    time_since: '2026-11-20T09:00:00Z',
    time_until: '2026-11-20T10:30:00Z',
    time_insert: '2026-11-20T10:31:12Z',
    time_last_change: '2026-11-20T10:31:12Z',
    duration: 5400,
    hourly_rate: 85,
    customers_name: 'Acme GmbH',
    projects_name: 'Website relaunch',
    services_name: 'Consulting',
    users_name: 'Jane Doe',
  },
  onEnable: async (context) => {
    const items = await fetchWindow(makeClient(context.auth.props));
    await context.store.delete(STORE_KEY);
    await pollNewById({ store: context.store, storeKey: STORE_KEY, items });
  },
  onDisable: async (context) => {
    await context.store.delete(STORE_KEY);
  },
  run: async (context) => {
    const items = await fetchWindow(makeClient(context.auth.props));
    return pollNewById({ store: context.store, storeKey: STORE_KEY, items });
  },
  test: async (context) => {
    const items = await fetchWindow(makeClient(context.auth.props));
    return newestFirst({ items, limit: 5 });
  },
});
