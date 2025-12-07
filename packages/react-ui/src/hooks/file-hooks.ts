import { useMutation, useQuery } from '@tanstack/react-query';
import { t } from 'i18next';
import { useEffect } from 'react';
import { toast } from 'sonner';

import { fileApi } from '@/lib/file-api';
import { fileUtils } from '@/lib/file-utils';
import { File, UploadFileRequestBody } from '@activepieces/shared';

export const fileHooks = {
  useUploadFile: () => {
    return useMutation({
      mutationFn: (params: UploadFileRequestBody) => {
        const formData = new FormData();
        formData.append('fileType', params.fileType);
        formData.append('file', params.file as Blob);
        return fileApi.uploadFile(formData);
      },
      onError: (error) => {
        toast.error(error.message ?? t('Failed to upload file'));
      },
    });
  },

  useGetFile: (fileId: string) => {
    return useQuery({
      queryKey: ['file', fileId],
      queryFn: () => fileApi.getFile(fileId),
      enabled: false,
    });
  },

  useOnLoadDbFile: (
    fileUrl: string | undefined,
    callback: (file: File) => void,
  ) => {
    const { getIdFromUrl, isDbFile } = fileUtils;
    const { refetch: fetchFile } = fileHooks.useGetFile(
      getIdFromUrl(fileUrl ?? ''),
    );

    useEffect(() => {
      if (fileUrl && isDbFile(fileUrl)) {
        fetchFile().then((response) => {
          const data = response.data;
          if (data) callback(data);
          else if (response.error) {
            toast.error(response.error.message ?? t('Failed to fetch file'));
          }
        });
      }
    }, [fileUrl]);
  },
};
