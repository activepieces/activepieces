import { ErrorCode, isNil } from '@activepieces/core-utils';
import { MutationCache, QueryCache, QueryClient } from '@tanstack/react-query';

import { showQueryErrorToast } from '@/components/custom/query-error-toast';
import { internalErrorToast } from '@/components/ui/sonner';
import { useManagePlanDialogStore } from '@/features/billing';
import { api } from '@/lib/api';

const toastedQueries = new WeakSet<object>();

export const queryClient = new QueryClient({
  queryCache: new QueryCache({
    onError: (error, query) => {
      if (!query.meta?.showErrorToast || !query.isActive()) {
        return;
      }
      console.error('query failed', query.queryHash, error);
      if (toastedQueries.has(query)) {
        return;
      }
      toastedQueries.add(query);
      showQueryErrorToast({ queryKey: query.queryKey, error });
    },
    onSuccess: (_data, query) => {
      toastedQueries.delete(query);
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
