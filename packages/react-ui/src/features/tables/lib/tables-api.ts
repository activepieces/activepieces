import { api } from '@/lib/api';
import {
  CreateTableRequest,
  ExportTableResponse,
  ListTablesRequest,
  SeekPage,
  Table,
  TableTemplate,
  UpdateTableRequest,
} from '@activepieces/shared';

export const tablesApi = {
  async list(request: ListTablesRequest): Promise<SeekPage<Table>> {
    return await api.get<SeekPage<Table>>('/v1/tables', request);
  },

  create(request: CreateTableRequest): Promise<Table> {
    return api.post<Table>('/v1/tables', request);
  },

  getById(id: string): Promise<Table> {
    return api.get<Table>(`/v1/tables/${id}`);
  },

  delete(id: string): Promise<void> {
    return api.delete<void>(`/v1/tables/${id}`);
  },

  export(id: string): Promise<ExportTableResponse> {
    return api.get<ExportTableResponse>(`/v1/tables/${id}/export`);
  },

  getTemplate(id: string): Promise<TableTemplate> {
    return api.get<TableTemplate>(`/v1/tables/${id}/template`);
  },

  update(id: string, request: UpdateTableRequest): Promise<Table> {
    return api.post<Table>(`/v1/tables/${id}`, request);
  },

  clear(id: string): Promise<void> {
    return api.post<void>(`/v1/tables/${id}/clear`);
  },
};
