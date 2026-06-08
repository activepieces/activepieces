import { isNil } from '@activepieces/shared';
import { MutationCache, QueryCache, QueryClient } from '@tanstack/react-query';
import { t } from 'i18next';

import { useApErrorDialogStore } from '@/components/custom/ap-error-dialog/ap-error-dialog-store';
import { internalErrorToast } from '@/components/ui/sonner';
import { api } from '@/lib/api';

export const queryClient = new QueryClient({
  queryCache: new QueryCache({
    onError: (error, query) => {
      if (query.meta?.showErrorDialog) {
        const { openDialog } = useApErrorDialogStore.getState();
        openDialog({
          title: t('Failed to load data'),
          description: t(
            'Something went wrong while loading your data. Your data is safe — please try again by refreshing the page.',
          ),
          error: {
            queryKey: query.queryKey,
            details: api.isError(error) ? error.response?.data : String(error),
          },
        });
      }
    },
  }),
  mutationCache: new MutationCache({
    onError: (err: Error, _, __, mutation) => {
      if (isNil(mutation.options.onError)) {
        internalErrorToast();
      }
    },
  }),
});
