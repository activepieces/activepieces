import { api } from '@/lib/api';
import {
  CreateRecordsRequest,
  DeleteRecordsRequest,
  ImportCsvRequestBody,
  ListRecordsRequest,
  PopulatedRecord,
  SeekPage,
  UpdateRecordRequest,
} from '@activepieces/shared';

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
  async importCsv(request: {file: File, skipFirstRow: boolean, tableId: string}): Promise<number> {
    const formData = new FormData();
    const buffer = await (
     request.file
   ).arrayBuffer();
    formData.append('file', new Blob([buffer]));
    formData.append('skipFirstRow', request.skipFirstRow.toString());
    formData.append('tableId', request.tableId);
    return api.post<number>(`/v1/records/import`, formData, undefined, {
     'Content-Type': 'multipart/form-data',
   });
   }
};
