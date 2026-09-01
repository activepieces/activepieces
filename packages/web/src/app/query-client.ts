import { ErrorCode, isNil } from '@activepieces/core-utils';
import { MutationCache, QueryCache, QueryClient } from '@tanstack/react-query';
import { t } from 'i18next';
import { toast } from 'sonner';

import { internalErrorToast } from '@/components/ui/sonner';
import { useManagePlanDialogStore } from '@/features/billing';
import { api } from '@/lib/api';

const toastedQueryHashes = new Set<string>();

export const queryClient = new QueryClient({
  queryCache: new QueryCache({
    onError: (error, query) => {
      if (!query.meta?.showErrorToast || !query.isActive()) {
        return;
      }
      console.error('query failed', query.queryHash, error);
      if (toastedQueryHashes.has(query.queryHash)) {
        return;
      }
      toastedQueryHashes.add(query.queryHash);
      toast.error(t('Failed to load data'), {
        id: query.queryHash,
        description: t('Please refresh the page to try again.'),
        duration: 5000,
      });
    },
    onSuccess: (_data, query) => {
      toastedQueryHashes.delete(query.queryHash);
    },
  }),
  mutationCache: new MutationCache({
    onError: (err: Error, _, __, mutation) => {
      if (!isNil(mutation.options.onError)) {
        return;
      }
      if (api.isApError(err, ErrorCode.QUOTA_EXCEEDED)) {
        const { openDialog } = useManagePlanDialogStore.getState();
        openDialog();
      } else {
        internalErrorToast();
      }
    },
  }),
});
