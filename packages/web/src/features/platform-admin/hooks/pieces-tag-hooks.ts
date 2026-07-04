import { Tag } from '@activepieces/shared';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { t } from 'i18next';
import { toast } from 'sonner';

import { piecesTagsApi } from '../api/pieces-tags';

export const piecesTagKeys = {
  all: ['tags'] as const,
};

export const piecesTagQueries = {
  useTags: () =>
    useQuery({
      queryKey: piecesTagKeys.all,
      queryFn: async () => {
        const response = await piecesTagsApi.list({ limit: 100 });
        return response.data;
      },
    }),
};

export const piecesTagMutations = {
  useDeleteTag: ({ onSuccess }: { onSuccess: () => void }) => {
    const queryClient = useQueryClient();
    return useMutation({
      mutationFn: (id: string) => piecesTagsApi.delete(id),
      onSuccess: () => {
        toast.success(t('Tag deleted'));
        queryClient.invalidateQueries({ queryKey: piecesTagKeys.all });
        queryClient.invalidateQueries({ queryKey: ['pieces'] });
        onSuccess();
      },
    });
  },
  useApplyTags: ({ onSuccess }: { onSuccess: () => void }) => {
    return useMutation({
      mutationFn: async ({ piecesName, tags }: ApplyTagsParams) => {
        await piecesTagsApi.tagPieces({ piecesName, tags });
      },
      onSuccess: () => {
        toast(t('Tags applied.'), {});
        onSuccess();
      },
    });
  },
  useCreateTag: ({
    onTagCreated,
    setIsOpen,
  }: {
    onTagCreated: (tag: Tag) => void;
    setIsOpen: (open: boolean) => void;
  }) => {
    return useMutation({
      mutationFn: (name: string) => piecesTagsApi.upsert({ name }),
      onSuccess: (data) => {
        toast.success(t('Tag created'), {
          description: t(`Tag "${data.name}" has been created successfully.`),
        });
        onTagCreated(data);
        setIsOpen(false);
      },
    });
  },
};

type ApplyTagsParams = {
  piecesName: string[];
  tags: string[];
};
