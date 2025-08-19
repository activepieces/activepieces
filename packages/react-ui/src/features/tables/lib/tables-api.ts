import { api } from '@/lib/api';
import {
  AgentRun,
  AutomateTableRequest,
  CreateTableRequest,
  ExportTableResponse,
  ListTablesRequest,
  SeekPage,
  Table,
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
  automate(id: string, request: AutomateTableRequest): Promise<AgentRun[]> {
    return api.post<AgentRun[]>(`/v1/tables/${id}/automate`, request);
  },
  update(id: string, request: UpdateTableRequest): Promise<Table> {
    return api.post<Table>(`/v1/tables/${id}`, request);
  },
};
