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
    return api.post<SeekPage<PopulatedRecord>>('/v1/records/list', request);
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
    csv,
    tableId,
    fieldsMapping,
    maxRecordsLimit,
  }: {
    csv: string;
    tableId: string;
    fieldsMapping: FieldsMapping;
    maxRecordsLimit: number;
  }) {
    const csvData = csv.split('\n');
    const csvRecords = csvData.slice(1).map((row) => row.split(','));
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
