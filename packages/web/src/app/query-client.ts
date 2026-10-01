import { ApErrorParams, ErrorCode, isNil } from '@activepieces/core-utils';
import { MutationCache, QueryCache, QueryClient } from '@tanstack/react-query';
import { StatusCodes } from 'http-status-codes';

import { internalErrorToast } from '@/components/ui/sonner';
import { useManagePlanDialogStore } from '@/features/billing';
import { api } from '@/lib/api';
import { errorReporting } from '@/lib/error-reporting';

function isHandledSessionExpiry(error: unknown): boolean {
  if (!api.isError(error)) {
    return false;
  }
  if (error.response?.status !== StatusCodes.UNAUTHORIZED) {
    return false;
  }
  const code = (error.response?.data as ApErrorParams | undefined)?.code;
  return (
    code === ErrorCode.SESSION_EXPIRED ||
    code === ErrorCode.INVALID_BEARER_TOKEN
  );
}

function reportQueryFailure(error: unknown, queryHash: string): void {
  if (isHandledSessionExpiry(error)) {
    return;
  }
  const status = api.isError(error) ? error.response?.status : undefined;
  errorReporting.report({
    error,
    source: 'query',
    dedupeKey: queryHash,
    extra: {
      query_hash: queryHash,
      http_status: status,
      request_url: api.isError(error) ? error.config?.url : undefined,
    },
  });
}

export const queryClient = new QueryClient({
  queryCache: new QueryCache({
    onError: (error, query) => {
      reportQueryFailure(error, query.queryHash);
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
