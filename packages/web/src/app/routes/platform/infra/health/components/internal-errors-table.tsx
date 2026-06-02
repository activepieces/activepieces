import { InternalErrorImpactItem } from '@activepieces/shared';
import { t } from 'i18next';
import { CircleCheck } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center justify-between text-base font-medium">
          <span>{t('Internal errors — impact')}</span>
          {total > 0 && (
            <span className="text-sm font-normal text-muted-foreground">
              {t('{count} errors', { count: total })}
            </span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <Skeleton className="h-24 w-full" />
        ) : errors.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 py-8 text-muted-foreground">
            <CircleCheck className="size-8 text-emerald-500" />
            <p className="text-sm">{t('No internal errors in this period')}</p>
          </div>
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
                  <TableCell className="text-muted-foreground">
                    {error.projectName}
                  </TableCell>
                  <TableCell className="font-medium">
                    {error.flowName}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {formatUtils.formatNumber(error.count)}
                  </TableCell>
                  <TableCell className="text-right tabular-nums text-muted-foreground">
                    {total === 0
                      ? '—'
                      : `${Math.round((error.count / total) * 100)}%`}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
