import { t } from 'i18next';
import { CreditCard } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';

import {
  DataTable,
  LIMIT_QUERY_PARAM,
  CURSOR_QUERY_PARAM,
} from '@/components/ui/data-table';
import { billingQueries } from '@/features/billing/lib/billing-hooks';
import { ListAICreditsUsageRequest } from '@activepieces/common-ai';

import { aiCreditUsageTableColumns } from './columns';

export function AiCreditsUsageTable() {
  const [searchParams] = useSearchParams();

  const cursor = searchParams.get(CURSOR_QUERY_PARAM);
  const limit = searchParams.get(LIMIT_QUERY_PARAM)
    ? parseInt(searchParams.get(LIMIT_QUERY_PARAM)!)
    : 10;

  const params: ListAICreditsUsageRequest = {
    cursor: cursor ?? undefined,
    limit,
  };

  const { data, isLoading } = billingQueries.useAiCreditsUsage(params);

  return (
    <div className="flex-col w-full">
      <DataTable
        emptyStateTextTitle={t('No AI credits have been used yet')}
        emptyStateTextDescription={t(
          'Use Agents and Universal AI pieces to start using AI credits.',
        )}
        emptyStateIcon={<CreditCard className="size-14" />}
        page={data as any}
        isLoading={isLoading}
        columns={aiCreditUsageTableColumns as any}
      />
    </div>
  );
}
