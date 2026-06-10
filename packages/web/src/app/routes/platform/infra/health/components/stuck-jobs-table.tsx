import { StuckJob } from '@activepieces/shared';
import { t } from 'i18next';
import { CircleCheck, TriangleAlert } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

import { Badge } from '@/components/ui/badge';
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

type StuckJobsTableProps = {
  stuckJobs: StuckJob[] | undefined;
  isLoading: boolean;
};

export function StuckJobsTable({ stuckJobs, isLoading }: StuckJobsTableProps) {
  const navigate = useNavigate();
  const jobs = stuckJobs ?? [];

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base font-medium">
          {t('Stuck jobs')}
          {jobs.length > 0 && (
            <Badge variant="destructive" className="gap-1">
              <TriangleAlert className="size-3" />
              {t('{count} stuck', { count: jobs.length })}
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <Skeleton className="h-24 w-full" />
        ) : jobs.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 py-8 text-muted-foreground">
            <CircleCheck className="size-8 text-emerald-500" />
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
                  <TableCell className="text-muted-foreground">
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
      </CardContent>
    </Card>
  );
}
