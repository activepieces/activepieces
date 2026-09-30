import { StuckJob } from '@activepieces/shared';
import { t } from 'i18next';
import { CircleCheck, TriangleAlert } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

import { Panel } from '@/components/custom/panel';
import { Badge } from '@/components/ui/badge';
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

type StuckJobsTableProps = {
  stuckJobs: StuckJob[] | undefined;
  isLoading: boolean;
};

export function StuckJobsTable({ stuckJobs, isLoading }: StuckJobsTableProps) {
  const navigate = useNavigate();
  const jobs = stuckJobs ?? [];

  return (
    <Panel
      flush
      title={t('Stuck jobs')}
      action={
        jobs.length > 0 && (
          <Badge variant="destructive">
            <TriangleAlert />
            {t('{count} stuck', { count: jobs.length })}
          </Badge>
        )
      }
    >
      {isLoading ? (
        <div className="p-5">
          <Skeleton className="h-24 w-full" />
        </div>
      ) : jobs.length === 0 ? (
        <Empty>
          <EmptyHeader>
            <EmptyMedia variant="icon" className="bg-success-3 text-success-11">
              <CircleCheck />
            </EmptyMedia>
            <EmptyTitle>{t('No stuck jobs')}</EmptyTitle>
          </EmptyHeader>
        </Empty>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t('Flow')}</TableHead>
              <TableHead>{t('Project')}</TableHead>
              <TableHead>{t('Status')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {jobs.map((job) => (
              <TableRow
                key={job.flowRunId}
                className="cursor-pointer"
                onClick={() =>
                  navigate(`/projects/${job.projectId}/runs/${job.flowRunId}`)
                }
              >
                <TableCell className="font-medium">{job.flowName}</TableCell>
                <TableCell className="text-gray-11">
                  {job.projectName}
                </TableCell>
                <TableCell>
                  <Badge variant="outline">
                    {formatUtils.convertEnumToHumanReadable(job.status)}
                  </Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </Panel>
  );
}
