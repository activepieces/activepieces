import { api } from '@/lib/api';
import {
  CreateRecordsRequest,
  DeleteRecordsRequest,
  ListRecordsRequest,
  ApRecord,
  SeekPage,
  UpdateRecordRequest,
} from '@activepieces/shared';

export const recordsApi = {
  list(request: ListRecordsRequest): Promise<SeekPage<ApRecord>> {
    return api.post<SeekPage<ApRecord>>('/v1/records/list', request);
  },

  create(request: CreateRecordsRequest): Promise<ApRecord[]> {
    return api.post<ApRecord[]>('/v1/records', request);
  },

  getById(id: string): Promise<ApRecord> {
    return api.get<ApRecord>(`/v1/records/${id}`);
  },

  update(id: string, request: UpdateRecordRequest): Promise<ApRecord> {
    return api.post<ApRecord>(`/v1/records/${id}`, request);
  },

  delete(request: DeleteRecordsRequest): Promise<void> {
    return api.delete<void>(`/v1/records/`, undefined, request);
  },
  async importCsv(request: {
    file: File;
    skipFirstRow: boolean;
    tableId: string;
  }): Promise<number> {
    const formData = new FormData();
    const buffer = await request.file.arrayBuffer();
    formData.append('file', new Blob([buffer]));
    formData.append('skipFirstRow', request.skipFirstRow.toString());
    formData.append('tableId', request.tableId);
    return api.post<number>(`/v1/records/import`, formData, undefined, {
      'Content-Type': 'multipart/form-data',
    });
  },
};
