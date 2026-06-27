import {
  CreateFieldRequest,
  Field,
  PopulatedRecord,
  Table,
  UpdateTableRequest,
} from '@activepieces/shared';

import { PromiseQueue } from '@/lib/promise-queue';

import { fieldsApi } from '../../api/fields-api';
import { recordsApi } from '../../api/records-api';
import { tablesApi } from '../../api/tables-api';

import { ClientRecordData } from './ap-tables-client-state';

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

  function addPromiseToQueue(promise: () => Promise<void>) {
    queue.add(async () => {
      updateSavingStatus(true);
      await promise();
      updateSavingStatus(queue.size() === 1);
    });
  }
  return {
    deleteField: (fieldIndex: number) => {
      addPromiseToQueue(async () => {
        const fieldId = clonedFields[fieldIndex].id;
        await fieldsApi.delete(clonedFields[fieldIndex].id);
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

        if (createdRecords.length > 0) {
          clonedRecords.push(...createdRecords);
        }

        updateSavingStatus(queue.size() === 1);
      });
    },
    updateRecord: (
      recordIndex: number,
      record: Pick<ClientRecordData, 'values'>,
    ) => {
      addPromiseToQueue(async () => {
        clonedRecords[recordIndex] = await recordsApi.update(
          clonedRecords[recordIndex].id,
          {
            tableId: clonedTable.id,
            cells: record.values.map((c) => ({
              fieldId: clonedFields[c.fieldIndex].id,
              value: String(c.value),
            })),
          },
        );
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
      });
    },
    update: async (request: UpdateTableRequest) => {
      addPromiseToQueue(async () => {
        const updatedTable = await tablesApi.update(clonedTable.id, request);
        clonedTable.status = updatedTable.status;
      });
    },
    setRecords: (records: PopulatedRecord[]) => {
      clonedRecords = JSON.parse(JSON.stringify(records));
    },
    // Server-originated deltas (e.g. the chat agent editing the table): keep the
    // mirror in sync WITHOUT enqueuing an API write, so a later user edit resolves
    // the correct record id by index. Mutates in place to keep exposed refs valid.
    applyServerRecord: (record: PopulatedRecord) => {
      const index = clonedRecords.findIndex((r) => r.id === record.id);
      if (index === -1) {
        clonedRecords.push(record);
      } else {
        clonedRecords[index] = record;
      }
    },
    removeServerRecord: (recordId: string) => {
      const index = clonedRecords.findIndex((r) => r.id === recordId);
      if (index !== -1) {
        clonedRecords.splice(index, 1);
      }
    },
    applyServerField: (field: Field) => {
      const index = clonedFields.findIndex((f) => f.id === field.id);
      if (index === -1) {
        clonedFields.push(field);
      } else {
        clonedFields[index] = field;
      }
    },
    removeServerField: (fieldId: string) => {
      const index = clonedFields.findIndex((f) => f.id === fieldId);
      if (index !== -1) {
        clonedFields.splice(index, 1);
      }
      clonedRecords = clonedRecords.map((record) => ({
        ...record,
        cells: Object.fromEntries(
          Object.entries(record.cells).filter(([key]) => key !== fieldId),
        ),
      }));
    },
    fields: clonedFields,
    records: clonedRecords,
  };
};
