import { api } from '@/lib/api';
import {
  CreateOrRenameFolderRequest,
  Folder,
  FolderDto,
  SeekPage,
} from '@activepieces/shared';

export const foldersApi = {
  list() {
    const params: Record<string, string | number> = {
      limit: 1000000,
    };
    return api.get<SeekPage<FolderDto>>('/v1/folders', {
      params: params,
    });
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
  renameFolder(
    req: {
      folderId: string;
    } & CreateOrRenameFolderRequest,
  ) {
    return api.post<Folder>(`/v1/folders/${req.folderId}`, {
      displayName: req.displayName,
    });
  },
};
