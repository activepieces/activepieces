import {
  CreateOrRenameFolderRequest,
  Folder,
  FolderDto,
  SeekPage,
} from '@activepieces/shared';

import { api } from '@/lib/api';

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
};
