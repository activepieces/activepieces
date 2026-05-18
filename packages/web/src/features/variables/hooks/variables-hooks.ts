import { ListVariablesRequestQuery } from '@activepieces/shared';
import { useMutation, useQuery } from '@tanstack/react-query';
import { t } from 'i18next';
import { useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import { toast } from 'sonner';

import {
  CURSOR_QUERY_PARAM,
  LIMIT_QUERY_PARAM,
} from '@/components/custom/data-table';
import { internalErrorToast } from '@/components/ui/sonner';

import { variablesApi } from '../api/variables';

type UseVariablesProps = {
  request: ListVariablesRequestQuery;
  extraKeys: unknown[];
  enabled?: boolean;
  showErrorDialog?: boolean;
};

export const variablesQueries = {
  useVariables: ({
    request,
    extraKeys,
    enabled,
    showErrorDialog,
  }: UseVariablesProps) => {
    return useQuery({
      queryKey: ['variables', ...extraKeys],
      meta: showErrorDialog
        ? { showErrorDialog: true, loadSubsetOptions: {} }
        : undefined,
      queryFn: () => variablesApi.list(request),
      enabled,
    });
  },

  useListSearchParams: () => {
    const { search } = useLocation();
    return useMemo(() => {
      const sp = new URLSearchParams(search);
      const limitParam = sp.get(LIMIT_QUERY_PARAM);
      return {
        cursor: sp.get(CURSOR_QUERY_PARAM) ?? undefined,
        limit: limitParam ? parseInt(limitParam) : 10,
        name: sp.get('name') ?? undefined,
        ownerEmails: sp.getAll('owner'),
      };
    }, [search]);
  },

  useVariableOwners: (projectId: string) => {
    return useQuery({
      queryKey: ['variable-owners', projectId],
      queryFn: async () => {
        const page = await variablesApi.getOwners({ projectId });
        return page.data;
      },
      enabled: !!projectId,
    });
  },
};

export const variablesMutations = {
  useBulkDeleteVariables: (refetch: () => void) =>
    useMutation({
      mutationFn: async (ids: string[]) => {
        await Promise.all(ids.map((id) => variablesApi.delete(id)));
      },
      onSuccess: () => {
        refetch();
        toast.success(t('Variables deleted'));
      },
      onError: () => {
        internalErrorToast();
      },
    }),
};
