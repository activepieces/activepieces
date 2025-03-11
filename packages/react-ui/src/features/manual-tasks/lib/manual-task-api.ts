import { api } from '@/lib/api';
import {
  CreateManualTaskRequestBody,
  ManualTask,
  UpdateManualTaskRequestBody,
  ListManualTasksQueryParams,
  ManualTaskWithAssignee,
} from '@activepieces/ee-shared';
import { SeekPage } from '@activepieces/shared';

export const manualTaskApi = {
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
