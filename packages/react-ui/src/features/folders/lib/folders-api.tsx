import { api } from '@/lib/api';
import {
  CreateOrRenameFolderRequest,
  Folder,
  FolderDto,
  SeekPage,
} from '@activepieces/shared';

export const foldersApi = {
  async list(): Promise<FolderDto[]> {
    const params: Record<string, string | number> = {
      limit: 1000000,
    };
    const response = await api.get<SeekPage<FolderDto>>('/v1/folders', {
      params: params,
    });
    return response.data.sort((a, b) =>
      a.displayName.localeCompare(b.displayName),
    );
  },
  get(folderId: string) {
    return api.get<Folder>(`/v1/folders/${folderId}`);
  },
  create(req: CreateOrRenameFolderRequest) {
    return api.post<FolderDto>('/v1/folders', req);
  },
  delete(folderId: string) {
    return api.delete<void>(`/v1/folders/${folderId}`);
  },
  renameFolder(folderId: string, req: CreateOrRenameFolderRequest) {
    return api.post<Folder>(`/v1/folders/${folderId}`, {
      displayName: req.displayName,
    });
  },
};
