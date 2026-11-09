import { isNil, tryCatch } from '@activepieces/core-utils';
import {
  CreateFieldRequest,
  Field,
  PopulatedRecord,
  Table,
  UpdateTableRequest,
} from '@activepieces/shared';

import { errorReporting } from '@/lib/error-reporting';
import { PromiseQueue } from '@/lib/promise-queue';

import { fieldsApi } from '../../api/fields-api';
import { recordsApi } from '../../api/records-api';
import { tablesApi } from '../../api/tables-api';

import { ClientRecordData } from './ap-tables-client-state';
import { tableSyncClock } from './table-sync-clock';

export const createServerState = (
  _table: Table,
  _fields: Field[],
  _records: PopulatedRecord[],
  updateSavingStatus: (isSaving: boolean) => void,
) => {
  const queue = new PromiseQueue();

  const clonedTable: Table = JSON.parse(JSON.stringify(_table));
  const clonedFields: Field[] = JSON.parse(JSON.stringify(_fields));
  let clonedRecords: PopulatedRecord[] = JSON.parse(JSON.stringify(_records));
  const knownAt = new Map<string, number>();
  const rowIds = new Map<string, string>();
  const deletedIds = new Set<string>();

  function markDeleted(ids: string[]) {
    ids.forEach((id) => deletedIds.add(id));
  }

  function markKnown({ ids, at }: { ids: string[]; at: number }) {
    ids.forEach((id) => knownAt.set(id, Math.max(knownAt.get(id) ?? 0, at)));
  }

  function markSaved(ids: string[]) {
    markKnown({ ids, at: tableSyncClock.tick() });
  }

  function addPromiseToQueue(promise: () => Promise<void>) {
    queue.add(async () => {
      updateSavingStatus(true);
      const { error } = await tryCatch(promise);
      if (!isNil(error)) {
        errorReporting.report({ error, source: 'table-save' });
        throw error;
      }
      updateSavingStatus(queue.size() === 1);
    });
  }
  return {
    deleteField: (fieldIndex: number) => {
      addPromiseToQueue(async () => {
        const fieldId = clonedFields[fieldIndex].id;
        await fieldsApi.delete(clonedFields[fieldIndex].id);
        markSaved([fieldId]);
        clonedFields.splice(fieldIndex, 1);
        clonedRecords = clonedRecords.map((record) => {
          return {
            ...record,
            cells: Object.fromEntries(
              Object.entries(record.cells).filter(([key]) => key !== fieldId),
            ),
          };
        });
      });
    },
    createField: (field: CreateFieldRequest) => {
      addPromiseToQueue(async () => {
        const serverField = await fieldsApi.create({ ...field });
        markSaved([serverField.id]);
        clonedFields.push(serverField);
      });
    },
    createRecord: (record: ClientRecordData) => {
      addPromiseToQueue(async () => {
        const createdRecords = await recordsApi.create({
          tableId: clonedTable.id,
          records: [
            record.values.map((value) => ({
              fieldId: clonedFields[value.fieldIndex].id,
              value: String(value.value),
            })),
          ],
        });

        markSaved(createdRecords.map((created) => created.id));
        createdRecords.forEach((created) =>
          rowIds.set(created.id, record.uuid),
        );
        clonedRecords.push(...createdRecords);

        updateSavingStatus(queue.size() === 1);
      });
    },
    updateRecord: (
      recordIndex: number,
      record: Pick<ClientRecordData, 'values'>,
    ) => {
      addPromiseToQueue(async () => {
        const recordId = clonedRecords[recordIndex].id;
        clonedRecords[recordIndex] = await recordsApi.update(recordId, {
          tableId: clonedTable.id,
          cells: record.values.map((c) => ({
            fieldId: clonedFields[c.fieldIndex].id,
            value: String(c.value),
          })),
        });
        markSaved([recordId]);
      });
    },
    deleteRecords: (recordIndices: string[]) => {
      addPromiseToQueue(async () => {
        const recordIds = recordIndices.map(
          (index) => clonedRecords[parseInt(index)].id,
        );
        await recordsApi.delete({
          tableId: clonedTable.id,
          ids: recordIds,
        });
        markSaved(recordIds);
        markDeleted(recordIds);

        // Sort indices in descending order to avoid shifting issues when splicing
        const sortedIndices = recordIndices
          .map((index) => parseInt(index))
          .sort((a, b) => b - a);

        // Remove each record individually
        for (const index of sortedIndices) {
          clonedRecords.splice(index, 1);
        }
      });
    },
    renameField: (fieldIndex: number, newName: string) => {
      addPromiseToQueue(async () => {
        clonedFields[fieldIndex].name = newName;
        await fieldsApi.update(clonedFields[fieldIndex].id, {
          name: newName,
        });
        markSaved([clonedFields[fieldIndex].id]);
      });
    },
    reorderField: (fieldIndex: number, targetIndex: number) => {
      addPromiseToQueue(async () => {
        const [movedField] = clonedFields.splice(fieldIndex, 1);
        clonedFields.splice(targetIndex, 0, movedField);
        await fieldsApi.reorder({
          tableId: clonedTable.id,
          fieldIds: clonedFields.map((field) => field.id),
        });
        markSaved([movedField.id]);
      });
    },
    update: async (request: UpdateTableRequest) => {
      addPromiseToQueue(async () => {
        const updatedTable = await tablesApi.update(clonedTable.id, request);
        markSaved([clonedTable.id]);
        clonedTable.status = updatedTable.status;
      });
    },
    idle: () => queue.idle(),
    changedSince: ({ id, since }: { id: string; since: number }) =>
      (knownAt.get(id) ?? 0) > since,
    markKnown,
    markDeleted,
    isDeleted: (recordId: string) => deletedIds.has(recordId),
    link: ({ recordId, rowId }: { recordId: string; rowId: string }) => {
      rowIds.set(recordId, rowId);
    },
    rowIdOf: (recordId: string) => rowIds.get(recordId),
    replaceTable: (table: Table) => {
      clonedTable.status = table.status;
    },
    replaceFields: (fields: Field[]) => {
      clonedFields.splice(0, clonedFields.length, ...fields);
    },
    setRecords: (records: PopulatedRecord[]) => {
      clonedRecords = [...records];
    },
    fields: clonedFields,
    get records() {
      return clonedRecords;
    },
  };
};
