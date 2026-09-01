import {
  PopulatedFlowApprovalRequest,
  FlowApprovalRequestState,
} from '@activepieces/shared';
import { useQueryClient } from '@tanstack/react-query';
import { ColumnDef } from '@tanstack/react-table';
import { t } from 'i18next';
import { CircleCheck, CircleX, Eye, ShieldAlert } from 'lucide-react';
import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

import {
  CURSOR_QUERY_PARAM,
  DataTable,
  LIMIT_QUERY_PARAM,
  RowDataWithActions,
} from '@/components/custom/data-table';
import { FormattedDate } from '@/components/custom/formatted-date';
import { StatusIconWithText } from '@/components/custom/status-icon-with-text';
import { Button } from '@/components/ui/button';
import { flowApprovalsHooks } from '@/features/flow-approvals';
import { authenticationSession } from '@/lib/authentication-session';

const stateVariant = (
  state: FlowApprovalRequestState,
): {
  variant: 'default' | 'success' | 'error';
  Icon: typeof ShieldAlert;
  text: string;
} => {
  switch (state) {
    case FlowApprovalRequestState.PENDING:
      return { variant: 'default', Icon: ShieldAlert, text: t('Pending') };
    case FlowApprovalRequestState.APPROVED:
      return { variant: 'success', Icon: CircleCheck, text: t('Approved') };
    case FlowApprovalRequestState.REJECTED:
      return { variant: 'error', Icon: CircleX, text: t('Rejected') };
  }
};

export function ApprovalsPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const cursor = searchParams.get(CURSOR_QUERY_PARAM) ?? undefined;
  const limit = searchParams.get(LIMIT_QUERY_PARAM)
    ? parseInt(searchParams.get(LIMIT_QUERY_PARAM)!)
    : 10;

  useEffect(() => {
    queryClient.invalidateQueries({
      queryKey: ['flow-approval-requests', 'badge'],
    });
  }, [queryClient]);

  const { data, isLoading } = flowApprovalsHooks.useListApprovals({
    cursor,
    limit,
    state: FlowApprovalRequestState.PENDING,
  });

  const onReview = (row: PopulatedFlowApprovalRequest) =>
    navigate(
      authenticationSession.appendProjectRoutePrefix(
        `/flows/${row.flowId}?versionId=${row.flowVersionId}`,
      ),
    );

  const columns: ColumnDef<
    RowDataWithActions<PopulatedFlowApprovalRequest>,
    unknown
  >[] = [
    {
      accessorKey: 'flow',
      header: () => <span>{t('Flow')}</span>,
      cell: ({ row }) => (
        <span className="font-medium">
          {row.original.flowVersion?.displayName ?? (
            <span className="text-muted-foreground">{row.original.flowId}</span>
          )}
        </span>
      ),
    },
    {
      accessorKey: 'state',
      header: () => <span>{t('State')}</span>,
      cell: ({ row }) => {
        const { variant, Icon, text } = stateVariant(row.original.state);
        return <StatusIconWithText icon={Icon} text={text} variant={variant} />;
      },
    },
    {
      accessorKey: 'submittedAt',
      header: () => <span>{t('Submitted')}</span>,
      cell: ({ row }) => (
        <span className="text-muted-foreground">
          <FormattedDate
            date={new Date(row.original.submittedAt)}
            includeTime
          />
        </span>
      ),
    },
    {
      accessorKey: 'actions',
      header: () => null,
      cell: ({ row }) => (
        <div className="text-right">
          <Button
            size="sm"
            variant="outline"
            onClick={() => onReview(row.original)}
          >
            <Eye className="size-4 me-1" />
            {t('Review')}
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="flex flex-col w-full p-6 gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold tracking-tight">
          {t('Pending approvals')}
        </h1>
        <p className="text-sm text-muted-foreground">
          {t('Flows awaiting approval to publish.')}
        </p>
      </div>
      <DataTable
        columns={columns}
        page={data}
        isLoading={isLoading}
        onRowClick={(row) => onReview(row)}
        emptyStateTextTitle={t('No pending approvals')}
        emptyStateTextDescription={t(
          'When users request approval for sensitive flows, they will appear here.',
        )}
        emptyStateIcon={
          <ShieldAlert className="size-12 text-muted-foreground" />
        }
      />
    </div>
  );
}

export default ApprovalsPage;
