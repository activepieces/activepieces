import { File } from '@activepieces/shared';

import { api } from './api';

export const fileApi = {
  uploadFile: (formData: FormData) => {
    return api.post<File>(
      '/v1/files/upload',
      formData,
      {},
      {
        'Content-Type': 'multipart/form-data',
      },
    );
  },
  getFile: (fileId: string) => {
    return api.get<File>(`/v1/files/${fileId}`);
  },
};
