import {
  AppConnectionValueForAuthProperty,
  StaticPropsValue,
  Store,
  TriggerStrategy,
  createTrigger,
  isNil,
} from '@activepieces/pieces-framework';
import { airtableAuth } from '../auth';
import { airtableCommon } from '../common';
import { AirtableRawRecord } from '../common/models';
import { newRecordTriggerOutputSchema } from '../output-schemas';

const props = {
  base: airtableCommon.base,
  tableId: airtableCommon.tableId,
  viewId: airtableCommon.views,
};

const STATE_KEY = 'new_record_state';
const LEGACY_STATE_KEY = 'lastPoll';
const NO_VIEW_OVERLAP_MS = 10 * 60 * 1000;
const MAX_SEEN_IN_VIEW = 1000;
const SAMPLE_SIZE = 5;
const SAMPLE_WINDOWS_DAYS = [1, 7, 30, 365];
const DAY_MS = 24 * 60 * 60 * 1000;

function createdAfterFormula(epochMs: number): string {
  return `IS_AFTER(CREATED_TIME(),DATETIME_PARSE("${new Date(
    epochMs
  ).toISOString()}","YYYY-MM-DD HH:mm:ss.SSS"))`;
}

async function listCreatedAfter({
  auth,
  propsValue,
  createdAfter,
}: {
  auth: AirtableAuthValue;
  propsValue: NewRecordProps;
  createdAfter: number | null;
}): Promise<{ record: AirtableRawRecord; createdMs: number }[]> {
  const records = await airtableCommon.selectRecords({
    token: auth.secret_text,
    baseId: propsValue.base,
    tableId: propsValue.tableId,
    params: {
      ...(isNil(createdAfter)
        ? {}
        : { filterByFormula: createdAfterFormula(createdAfter) }),
      ...(propsValue.viewId ? { view: propsValue.viewId } : {}),
    },
  });
  return records
    .map((record) => ({ record, createdMs: Date.parse(record.createdTime) }))
    .filter(({ createdMs }) => Number.isFinite(createdMs));
}

async function loadState(store: Store): Promise<NewRecordState | null> {
  const state = await store.get<NewRecordState>(STATE_KEY);
  if (!isNil(state)) {
    return state;
  }
  const legacyCheckpoint = await store.get<number>(LEGACY_STATE_KEY);
  if (isNil(legacyCheckpoint)) {
    return null;
  }
  return { floor: legacyCheckpoint, seen: [] };
}

async function saveState({
  store,
  state,
}: {
  store: Store;
  state: NewRecordState;
}): Promise<void> {
  await store.put(STATE_KEY, state);
  await store.delete(LEGACY_STATE_KEY);
}

function nextState({
  state,
  emitted,
  hasView,
}: {
  state: NewRecordState;
  emitted: SeenRecord[];
  hasView: boolean;
}): NewRecordState {
  const seen = [...state.seen, ...emitted].sort((a, b) => a[1] - b[1]);
  if (!hasView) {
    const newest = seen.reduce(
      (latest, [, createdMs]) => Math.max(latest, createdMs),
      state.floor
    );
    const floor = Math.max(
      state.floor,
      Math.min(newest, Date.now()) - NO_VIEW_OVERLAP_MS
    );
    return { floor, seen: seen.filter(([, createdMs]) => createdMs > floor) };
  }
  let floor = state.floor;
  const overflow = Math.max(0, seen.length - MAX_SEEN_IN_VIEW);
  if (overflow > 0) {
    floor = Math.max(floor, seen[overflow - 1][1]);
  }
  return { floor, seen: seen.filter(([, createdMs]) => createdMs > floor) };
}

export const airtableNewRecordTrigger = createTrigger({
  auth: airtableAuth,
  name: 'new_record',
  classification: 'READ',
  displayName: 'New Record',
  description: 'Triggers when a new record is added to the selected table.',
  outputSchema: newRecordTriggerOutputSchema,
  aiMetadata: {
    description:
      "Fires once for each record created after the trigger was turned on in the selected base and table. With a view selected, a record fires when it first appears in that view, even if it was created earlier (after the trigger was turned on) and only matched the view's filter later. Represents a newly added row.",
  },
  props,
  sampleData: {},
  type: TriggerStrategy.POLLING,
  async test(context) {
    const now = Date.now();
    for (const days of [...SAMPLE_WINDOWS_DAYS, null]) {
      const records = await listCreatedAfter({
        auth: context.auth,
        propsValue: context.propsValue,
        createdAfter: isNil(days) ? null : now - days * DAY_MS,
      });
      if (records.length >= SAMPLE_SIZE || isNil(days)) {
        return records
          .sort((a, b) => b.createdMs - a.createdMs)
          .slice(0, SAMPLE_SIZE)
          .reverse()
          .map(({ record }) => record);
      }
    }
    return [];
  },
  async onEnable(context) {
    if (context.isRepublish) {
      const existing = await loadState(context.store);
      if (!isNil(existing)) {
        await saveState({ store: context.store, state: existing });
        return;
      }
    }
    await saveState({
      store: context.store,
      state: { floor: airtableCommon.pollStartCursor(), seen: [] },
    });
  },
  async onDisable() {
    return;
  },
  async run(context) {
    const state = await loadState(context.store);
    if (isNil(state)) {
      await saveState({
        store: context.store,
        state: { floor: airtableCommon.pollStartCursor(), seen: [] },
      });
      return [];
    }
    const records = await listCreatedAfter({
      auth: context.auth,
      propsValue: context.propsValue,
      createdAfter: state.floor,
    });
    const seenIds = new Set(state.seen.map(([id]) => id));
    const fresh = records
      .filter(
        ({ record, createdMs }) =>
          createdMs > state.floor && !seenIds.has(record.id)
      )
      .sort(
        (a, b) =>
          a.createdMs - b.createdMs || a.record.id.localeCompare(b.record.id)
      );
    await saveState({
      store: context.store,
      state: nextState({
        state,
        emitted: fresh.map(({ record, createdMs }) => [record.id, createdMs]),
        hasView: Boolean(context.propsValue.viewId),
      }),
    });
    return fresh.map(({ record }) => record);
  },
});

type NewRecordProps = StaticPropsValue<typeof props>;
type AirtableAuthValue = AppConnectionValueForAuthProperty<typeof airtableAuth>;
type SeenRecord = [string, number];
type NewRecordState = { floor: number; seen: SeenRecord[] };
