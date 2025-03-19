import { api } from '@/lib/api';
import {
  CreateManualTaskCommentRequestBody,
  ManualTaskComment,
  ListManualTaskCommentsQueryParams,
  ManualTaskCommentWithUser,
} from '@activepieces/ee-shared';
import { SeekPage } from '@activepieces/shared';

export const manualTaskCommentApi = {
  async list(taskId: string, request: ListManualTaskCommentsQueryParams) {
    return await api.get<SeekPage<ManualTaskCommentWithUser>>(
      `/v1/manual-tasks/${taskId}/comments`,
      request,
    );
  },
  async create(
    taskId: string,
    requestBody: CreateManualTaskCommentRequestBody,
  ) {
    return await api.post<ManualTaskComment>(
      `/v1/manual-tasks/${taskId}/comments`,
      requestBody,
    );
  },
};
