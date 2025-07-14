import { api } from '@/lib/api';
import { authenticationSession } from '@/lib/authentication-session';
import {
  CreateFolderRequest,
  Folder,
  FolderDto,
  ListFolderRequest,
  UpdateFolderRequest,
} from '@activepieces/shared';

export const foldersApi = {
  async list(): Promise<FolderDto[]> {
    const request: ListFolderRequest = {
      cursor: undefined,
      limit: 1000000,
      projectId: authenticationSession.getProjectId()!,
    };

    const response = await api.get<any>('/v1/folders', request);
    return response.data || [];
  },
  get(folderId: string) {
    return api.get<Folder>(`/v1/folders/${folderId}`);
  },
  create(req: CreateFolderRequest) {
    return api.post<FolderDto>('/v1/folders', req);
  },
  delete(folderId: string) {
    return api.delete<void>(`/v1/folders/${folderId}`);
  },
  renameFolder(folderId: string, req: UpdateFolderRequest) {
    return api.post<Folder>(`/v1/folders/${folderId}`, req);
  },
};
