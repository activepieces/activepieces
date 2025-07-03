import { api } from '@/lib/api';
import {
  CreateRecordsRequest,
  DeleteRecordsRequest,
  ListRecordsRequest,
  PopulatedRecord,
  SeekPage,
  UpdateRecordRequest,
} from '@activepieces/shared';

import { FieldsMapping } from './utils';

export const recordsApi = {
  list(request: ListRecordsRequest): Promise<SeekPage<PopulatedRecord>> {
    return api.get<SeekPage<PopulatedRecord>>('/v1/records', request);
  },

  create(request: CreateRecordsRequest): Promise<PopulatedRecord[]> {
    return api.post<PopulatedRecord[]>('/v1/records', request);
  },

  getById(id: string): Promise<PopulatedRecord> {
    return api.get<PopulatedRecord>(`/v1/records/${id}`);
  },

  update(id: string, request: UpdateRecordRequest): Promise<PopulatedRecord> {
    return api.post<PopulatedRecord>(`/v1/records/${id}`, request);
  },

  delete(request: DeleteRecordsRequest): Promise<void> {
    return api.delete<void>(`/v1/records/`, undefined, request);
  },

  async importCsv({
    csvRecords,
    tableId,
    fieldsMapping,
    maxRecordsLimit,
  }: {
    csvRecords: string[][];
    tableId: string;
    fieldsMapping: FieldsMapping;
    maxRecordsLimit: number;
  }) {
    const records: CreateRecordsRequest['records'] = csvRecords.map(
      (recordCells) => {
        return recordCells
          .map((value, index) => {
            const fieldMapping = fieldsMapping[index];
            if (!fieldMapping) {
              return null;
            }
            return {
              value: value,
              fieldId: fieldMapping,
            };
          })
          .filter((cell) => cell !== null);
      },
    );
    return await recordsApi.create({
      tableId,
      records: records.slice(0, maxRecordsLimit),
    });
  },
};
