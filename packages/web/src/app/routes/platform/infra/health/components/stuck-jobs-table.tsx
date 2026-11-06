import { StuckJob } from '@activepieces/shared';
import { t } from 'i18next';
import { CircleCheck, TriangleAlert } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

import { SettingsPanel } from '@/app/components/admin';
import { Badge } from '@/components/ui/badge';
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
    <SettingsPanel
      title={t('Stuck jobs')}
      action={
        jobs.length > 0 ? (
          <Badge variant="destructive" className="gap-1">
            <TriangleAlert className="size-3" />
            {t('{count} stuck', { count: jobs.length })}
          </Badge>
        ) : undefined
      }
    >
      {isLoading ? (
        <Skeleton className="h-24 w-full" />
      ) : jobs.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-2 py-8 text-gray-11">
          <CircleCheck className="size-8 text-success-11" />
          <p className="text-sm">{t('No stuck jobs')}</p>
        </div>
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
    </SettingsPanel>
  );
}
