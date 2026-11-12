import { createHash } from 'node:crypto';
import {
  AppConnectionValueForAuthProperty,
  DropdownState,
  Property,
  StaticPropsValue,
  Store,
  TriggerStrategy,
  createTrigger,
  isNil,
} from '@activepieces/pieces-framework';
import { airtableAuth } from '../auth';
import { airtableCommon } from '../common';
import {
  AirtableField,
  AirtableRawRecord,
  AirtableTable,
  ResolvedField,
} from '../common/models';
import { updatedRecordTriggerOutputSchema } from '../output-schemas';

const props = {
  base: airtableCommon.base,
  tableId: airtableCommon.tableId,
  sortFields: Property.Dropdown<string, true, typeof airtableAuth>({
    auth: airtableAuth,
    displayName: 'Trigger Field',
    description:
      'A Last Modified Time field of the table. Add one if none exists.',
    required: true,
    refreshers: ['base', 'tableId'],
    options: async ({ auth, base, tableId }): Promise<DropdownState<string>> => {
      if (!auth) {
        return {
          disabled: true,
          options: [],
          placeholder: 'Connect your Airtable account first',
        };
      }
      if (!base) {
        return {
          disabled: true,
          options: [],
          placeholder: 'Select a base first',
        };
      }
      if (!tableId) {
        return {
          disabled: true,
          options: [],
          placeholder: 'Select a table first',
        };
      }

      try {
        const airtable: AirtableTable = await airtableCommon.fetchTable({
          token: auth.secret_text,
          baseId: base as string,
          tableId: tableId as string,
        });

        const options = airtable.fields
          .filter((field: AirtableField) => field.type === 'lastModifiedTime')
          .map((field: AirtableField) => ({
            label: field.name,
            value: field.id,
          }));

        if (options.length === 0) {
          return {
            disabled: true,
            options: [],
            placeholder: 'This table has no Last Modified Time field',
          };
        }

        return {
          disabled: false,
          options,
        };
      } catch (e) {
        console.debug(e);
        return {
          disabled: true,
          options: [],
          placeholder: "Could not load. Check the token's scopes.",
        };
      }
    },
  }),
  viewId: airtableCommon.views,
};
const STATE_KEY = 'updated_record_state';
const LEGACY_STATE_KEY = 'lastPoll';
const REMEMBERED_FIELD_KEY = 'updated_record_trigger_field';
const TIE_OVERLAP_MS = 1000;
const ONE_SECOND_MS = 1000;
const SAMPLE_SIZE = 5;
const MAX_VERSIONS_AT_ENABLE = 1000;

async function resolveTriggerField({
  auth,
  propsValue,
  store,
  remember,
}: {
  auth: AirtableAuthValue;
  propsValue: UpdatedRecordProps;
  store: Store;
  remember: boolean;
}): Promise<ResolvedField> {
  const saved = propsValue.sortFields;
  const remembered = await store.get<RememberedField>(REMEMBERED_FIELD_KEY);
  const field = await airtableCommon.resolveField({
    token: auth.secret_text,
    baseId: propsValue.base,
    tableId: propsValue.tableId,
    idOrName: saved,
    label: 'Trigger Field',
    rememberedFieldId:
      remembered?.saved === saved ? remembered.fieldId : undefined,
  });
  if (/[{}]/.test(field.name)) {
    throw new Error(
      `Trigger Field "${field.name}" contains "{" or "}", which Airtable formulas cannot reference. Rename the field in Airtable.`
    );
  }
  if (
    remember &&
    !isNil(field.id) &&
    (remembered?.saved !== saved ||
      remembered.fieldId !== field.id ||
      remembered.fieldName !== field.name)
  ) {
    await store.put<RememberedField>(REMEMBERED_FIELD_KEY, {
      saved,
      fieldId: field.id,
      fieldName: field.name,
    });
  }
  return field;
}

async function cachedTriggerField({
  auth,
  propsValue,
  store,
}: {
  auth: AirtableAuthValue;
  propsValue: UpdatedRecordProps;
  store: Store;
}): Promise<ResolvedField> {
  const remembered = await store.get<RememberedField>(REMEMBERED_FIELD_KEY);
  if (
    !isNil(remembered) &&
    remembered.saved === propsValue.sortFields &&
    typeof remembered.fieldName === 'string'
  ) {
    return { id: remembered.fieldId, name: remembered.fieldName };
  }
  return resolveTriggerField({ auth, propsValue, store, remember: true });
}

function isUnknownFieldError(error: unknown): boolean {
  if (typeof error !== 'object' || error === null || !('error' in error)) {
    return false;
  }
  const type = error.error;
  const message =
    'message' in error && typeof error.message === 'string'
      ? error.message
      : '';
  return (
    type === 'UNKNOWN_FIELD_NAME' ||
    (type === 'INVALID_FILTER_BY_FORMULA' && /unknown field/i.test(message))
  );
}

function modifiedAfterFormula({
  fieldName,
  epochMs,
}: {
  fieldName: string;
  epochMs: number;
}): string {
  return `IS_AFTER({${fieldName}},DATETIME_PARSE("${new Date(
    epochMs
  ).toISOString()}","YYYY-MM-DD HH:mm:ss.SSS"))`;
}

function withModifiedTime({
  records,
  fieldName,
}: {
  records: AirtableRawRecord[];
  fieldName: string;
}): ModifiedRecord[] {
  return records
    .map((record) => {
      const value = record.fields[fieldName];
      return {
        record,
        modifiedMs: typeof value === 'string' ? Date.parse(value) : NaN,
      };
    })
    .filter(({ modifiedMs }) => Number.isFinite(modifiedMs));
}

async function initialState({
  auth,
  propsValue,
  fieldName,
}: {
  auth: AirtableAuthValue;
  propsValue: UpdatedRecordProps;
  fieldName: string;
}): Promise<UpdatedRecordState> {
  const start: UpdatedRecordState = {
    checkpoint: airtableCommon.pollStartCursor(),
    seenAtCheckpoint: [],
  };
  const existing = withModifiedTime({
    fieldName,
    records: await airtableCommon.selectRecords({
      token: auth.secret_text,
      baseId: propsValue.base,
      tableId: propsValue.tableId,
      params: {
        filterByFormula: modifiedAfterFormula({
          fieldName,
          epochMs: start.checkpoint,
        }),
      },
    }),
  });
  if (existing.length === 0) {
    return start;
  }
  const state = nextState({ state: start, records: existing, fresh: existing });
  const fieldIds = await fieldIdsByName({ auth, propsValue });
  if (isNil(fieldIds)) {
    return state;
  }
  return {
    ...state,
    versionsAtCheckpoint: versionsAt({
      items: existing,
      at: state.checkpoint,
      limit: MAX_VERSIONS_AT_ENABLE,
      fieldIds,
    }),
  };
}

async function fieldIdsByName({
  auth,
  propsValue,
}: {
  auth: AirtableAuthValue;
  propsValue: UpdatedRecordProps;
}): Promise<FieldIdsByName | null> {
  try {
    const table: AirtableTable | undefined = await airtableCommon.fetchTable({
      token: auth.secret_text,
      baseId: propsValue.base,
      tableId: propsValue.tableId,
    });
    if (isNil(table)) {
      return null;
    }
    return new Map(table.fields.map((field) => [field.name, field.id]));
  } catch {
    return null;
  }
}

function recordVersion({
  record,
  fieldIds,
}: {
  record: AirtableRawRecord;
  fieldIds: FieldIdsByName;
}): string {
  const values = Object.entries(record.fields)
    .map(([name, value]): [string, unknown] => [
      fieldIds.get(name) ?? name,
      value,
    ])
    .sort(([a], [b]) => a.localeCompare(b));
  return createHash('sha256')
    .update(JSON.stringify(values))
    .digest('base64')
    .slice(0, 16);
}

function versionsAt({
  items,
  at,
  fieldIds,
  limit,
}: {
  items: ModifiedRecord[];
  at: number;
  fieldIds: FieldIdsByName;
  limit?: number;
}): Record<string, string> {
  return Object.fromEntries(
    items
      .filter(({ modifiedMs }) => modifiedMs === at)
      .slice(0, limit)
      .map(({ record }) => [record.id, recordVersion({ record, fieldIds })])
  );
}

function refreshVersions({
  versions,
  current,
}: {
  versions: Record<string, string>;
  current: Record<string, string>;
}): Record<string, string> {
  return Object.fromEntries(
    Object.entries(versions).map(([id, version]) => [
      id,
      current[id] ?? version,
    ])
  );
}

function changedSinceEnable({
  state,
  record,
  fieldIds,
}: {
  state: UpdatedRecordState;
  record: AirtableRawRecord;
  fieldIds: FieldIdsByName | null;
}): boolean {
  const version = state.versionsAtCheckpoint?.[record.id];
  return (
    !isNil(version) &&
    !isNil(fieldIds) &&
    version !== recordVersion({ record, fieldIds })
  );
}

async function loadState(store: Store): Promise<UpdatedRecordState | null> {
  const state = await store.get<UpdatedRecordState>(STATE_KEY);
  if (!isNil(state)) {
    return state;
  }
  const legacyCheckpoint = await store.get<number>(LEGACY_STATE_KEY);
  if (isNil(legacyCheckpoint)) {
    return null;
  }
  return { checkpoint: legacyCheckpoint, seenAtCheckpoint: null };
}

async function saveState({
  store,
  state,
}: {
  store: Store;
  state: UpdatedRecordState;
}): Promise<void> {
  await store.put(STATE_KEY, state);
  await store.delete(LEGACY_STATE_KEY);
}

function nextState({
  state,
  records,
  fresh,
  fieldIds = null,
}: {
  state: UpdatedRecordState;
  records: ModifiedRecord[];
  fresh: ModifiedRecord[];
  fieldIds?: FieldIdsByName | null;
}): UpdatedRecordState {
  const checkpoint = fresh.reduce(
    (latest, { modifiedMs }) => Math.max(latest, modifiedMs),
    state.checkpoint
  );
  const idsAt = ({ items, at }: { items: ModifiedRecord[]; at: number }) =>
    items
      .filter(({ modifiedMs }) => modifiedMs === at)
      .map(({ record }) => record.id);
  if (checkpoint !== state.checkpoint) {
    return { checkpoint, seenAtCheckpoint: idsAt({ items: fresh, at: checkpoint }) };
  }
  const previous = state.seenAtCheckpoint ?? idsAt({ items: records, at: checkpoint });
  return {
    checkpoint,
    seenAtCheckpoint: [...new Set([...previous, ...idsAt({ items: fresh, at: checkpoint })])],
    ...(isNil(state.versionsAtCheckpoint) ||
    isNil(fieldIds) ||
    Date.now() >= checkpoint + ONE_SECOND_MS
      ? {}
      : {
          versionsAtCheckpoint: refreshVersions({
            versions: state.versionsAtCheckpoint,
            current: versionsAt({ items: records, at: checkpoint, fieldIds }),
          }),
        }),
  };
}

export const airtableUpdatedRecordTrigger = createTrigger({
  auth: airtableAuth,
  name: 'updated_record',
  classification: 'READ',
  displayName: 'New or Updated Record',
  description:
    'Triggers when a record is created or changed in the selected table.',
  outputSchema: updatedRecordTriggerOutputSchema,
  aiMetadata: {
    description:
      'Fires when a record is created or modified in the selected base and table (optionally scoped to a view), detected via a chosen Last Modified Time field. Represents a row that was newly added or changed since the last poll; the table must have a last-modified timestamp field for this to work.',
  },
  props,
  sampleData: {},
  type: TriggerStrategy.POLLING,
  async test(context) {
    const field = await resolveTriggerField({
      auth: context.auth,
      propsValue: context.propsValue,
      store: context.store,
      remember: false,
    });
    const records = await airtableCommon.selectRecords({
      token: context.auth.secret_text,
      baseId: context.propsValue.base,
      tableId: context.propsValue.tableId,
      params: {
        filterByFormula: `{${field.name}}`,
        sort: [{ field: field.name, direction: 'desc' }],
        maxRecords: SAMPLE_SIZE,
        ...(context.propsValue.viewId ? { view: context.propsValue.viewId } : {}),
      },
    });
    return withModifiedTime({ records, fieldName: field.name })
      .sort((a, b) => b.modifiedMs - a.modifiedMs)
      .slice(0, SAMPLE_SIZE)
      .reverse()
      .map(({ record }) => record);
  },
  async onEnable(context) {
    const field = await resolveTriggerField({
      auth: context.auth,
      propsValue: context.propsValue,
      store: context.store,
      remember: true,
    });
    if (context.isRepublish) {
      const existing = await loadState(context.store);
      if (!isNil(existing)) {
        await saveState({ store: context.store, state: existing });
        return;
      }
    }
    await saveState({
      store: context.store,
      state: await initialState({
        auth: context.auth,
        propsValue: context.propsValue,
        fieldName: field.name,
      }),
    });
  },
  async onDisable() {
    return;
  },
  async run(context) {
    let field = await cachedTriggerField({
      auth: context.auth,
      propsValue: context.propsValue,
      store: context.store,
    });
    const state = await loadState(context.store);
    if (isNil(state)) {
      await saveState({
        store: context.store,
        state: await initialState({
          auth: context.auth,
          propsValue: context.propsValue,
          fieldName: field.name,
        }),
      });
      return [];
    }
    const listChanged = (fieldName: string) =>
      airtableCommon.selectRecords({
        token: context.auth.secret_text,
        baseId: context.propsValue.base,
        tableId: context.propsValue.tableId,
        params: {
          filterByFormula: modifiedAfterFormula({
            fieldName,
            epochMs: state.checkpoint - TIE_OVERLAP_MS,
          }),
          ...(context.propsValue.viewId
            ? { view: context.propsValue.viewId }
            : {}),
        },
      });
    let changed: AirtableRawRecord[];
    try {
      changed = await listChanged(field.name);
    } catch (error) {
      if (!isUnknownFieldError(error)) {
        throw error;
      }
      field = await resolveTriggerField({
        auth: context.auth,
        propsValue: context.propsValue,
        store: context.store,
        remember: true,
      });
      changed = await listChanged(field.name);
    }
    const records = withModifiedTime({
      fieldName: field.name,
      records: changed,
    });
    const fieldIds = isNil(state.versionsAtCheckpoint)
      ? null
      : await fieldIdsByName({
          auth: context.auth,
          propsValue: context.propsValue,
        });
    const seenAtCheckpoint = new Set(state.seenAtCheckpoint ?? []);
    const fresh = records
      .filter(
        ({ record, modifiedMs }) =>
          modifiedMs > state.checkpoint ||
          (modifiedMs === state.checkpoint &&
            !isNil(state.seenAtCheckpoint) &&
            (!seenAtCheckpoint.has(record.id) ||
              changedSinceEnable({ state, record, fieldIds })))
      )
      .sort(
        (a, b) =>
          a.modifiedMs - b.modifiedMs || a.record.id.localeCompare(b.record.id)
      );
    await saveState({
      store: context.store,
      state: nextState({ state, records, fresh, fieldIds }),
    });
    return fresh.map(({ record }) => record);
  },
});

type UpdatedRecordProps = StaticPropsValue<typeof props>;
type AirtableAuthValue = AppConnectionValueForAuthProperty<typeof airtableAuth>;
type RememberedField = { saved: string; fieldId: string; fieldName?: string };
type FieldIdsByName = Map<string, string>;
type ModifiedRecord = { record: AirtableRawRecord; modifiedMs: number };
type UpdatedRecordState = {
  checkpoint: number;
  seenAtCheckpoint: string[] | null;
  versionsAtCheckpoint?: Record<string, string>;
};
