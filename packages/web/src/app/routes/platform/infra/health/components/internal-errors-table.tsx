import { InternalErrorImpactItem } from '@activepieces/shared';
import { t } from 'i18next';
import { CircleCheck } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

import { Panel } from '@/components/custom/panel';
import {
  Empty,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/components/ui/empty';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { formatUtils } from '@/lib/format-utils';

type InternalErrorsTableProps = {
  internalErrors: InternalErrorImpactItem[] | undefined;
  isLoading: boolean;
};

export function InternalErrorsTable({
  internalErrors,
  isLoading,
}: InternalErrorsTableProps) {
  const navigate = useNavigate();
  const errors = internalErrors ?? [];
  const total = errors.reduce((sum, error) => sum + error.count, 0);

  return (
    <Panel
      flush
      title={t('Internal errors — impact')}
      description={t(
        'Internal errors are failures inside Activepieces itself (engine or worker), not in your flow logic. Grouped by the project and flow they affected.',
      )}
      action={
        total > 0 && (
          <span className="text-sm text-gray-11 tabular-nums">
            {t('{count} errors', { count: total })}
          </span>
        )
      }
    >
      {isLoading ? (
        <div className="p-5">
          <Skeleton className="h-24 w-full" />
        </div>
      ) : errors.length === 0 ? (
        <Empty>
          <EmptyHeader>
            <EmptyMedia variant="icon" className="bg-success-3 text-success-11">
              <CircleCheck />
            </EmptyMedia>
            <EmptyTitle>{t('No internal errors in this period')}</EmptyTitle>
          </EmptyHeader>
        </Empty>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t('Project')}</TableHead>
              <TableHead>{t('Flow')}</TableHead>
              <TableHead className="text-right">{t('Errors')}</TableHead>
              <TableHead className="text-right">{t('Share')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {errors.map((error) => (
              <TableRow
                key={`${error.projectId}-${error.flowId}`}
                className="cursor-pointer"
                onClick={() =>
                  navigate(
                    `/projects/${error.projectId}/runs?flowId=${error.flowId}`,
                  )
                }
              >
                <TableCell className="text-gray-11">
                  {error.projectName}
                </TableCell>
                <TableCell className="font-medium">{error.flowName}</TableCell>
                <TableCell className="text-right tabular-nums">
                  {formatUtils.formatNumber(error.count)}
                </TableCell>
                <TableCell className="text-right tabular-nums text-gray-11">
                  {total === 0
                    ? '—'
                    : `${Math.round((error.count / total) * 100)}%`}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </Panel>
  );
}
