import { api } from '@/lib/api';
import {
  CreateManualTaskRequestBody,
  ListManualTasksQueryParams,
  ManualTask,
  ManualTaskWithAssignee,
  SeekPage,
  UpdateManualTaskRequestBody,
} from '@activepieces/shared';

export const manualTaskApi = {
  async get(id: string) {
    return await api.get<ManualTaskWithAssignee>(`/v1/manual-tasks/${id}`);
  },
  async list(request: ListManualTasksQueryParams) {
    return await api.get<SeekPage<ManualTaskWithAssignee>>(
      `/v1/manual-tasks`,
      request,
    );
  },
  async create(requestBody: CreateManualTaskRequestBody) {
    return await api.post<ManualTask>('/v1/manual-tasks', requestBody);
  },
  async update(id: string, requestBody: UpdateManualTaskRequestBody) {
    return await api.post<ManualTask>(`/v1/manual-tasks/${id}`, requestBody);
  },
};
