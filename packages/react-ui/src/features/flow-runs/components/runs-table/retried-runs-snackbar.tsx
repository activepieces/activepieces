import { InfoCircledIcon } from '@radix-ui/react-icons';
import { t } from 'i18next';
import { Eye } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';

import { Button } from '@/components/ui/button';
import { LIMIT_QUERY_PARAM } from '@/components/ui/data-table';
import { authenticationSession } from '@/lib/authentication-session';

export const RUN_IDS_QUERY_PARAM = 'runIds';

export const RetriedRunsSnackbar = ({
  retriedRunsIds,
  clearRetriedRuns,
}: {
  retriedRunsIds: string[];
  clearRetriedRuns: () => void;
}) => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const runIdsInQueryParms = searchParams.getAll(RUN_IDS_QUERY_PARAM);
  if (retriedRunsIds.length === 0 && runIdsInQueryParms.length === 0) {
    return null;
  }

  return (
    <div className="fixed bottom-5 p-4 left-1/2 transform -translate-x-1/2  w-[480px]  animate-slide-in-from-bottom  bg-background shadow-lg border rounded-lg z-[9999]">
      {runIdsInQueryParms.length > 0 && (
        <div className="flex items-center justify-between animate-fade">
          <div className="flex items-center gap-2">
            <Eye className="size-5" />
            {t('Viewing retried runs')} ({runIdsInQueryParms.length})
          </div>

          <Button
            variant={'outline'}
            size="sm"
            onClick={() => {
              navigate(authenticationSession.appendProjectRoutePrefix(`/runs`));
              clearRetriedRuns();
            }}
          >
            {t('View All Runs')}
          </Button>
        </div>
      )}

      {runIdsInQueryParms.length === 0 && (
        <div className="flex items-center justify-between animate-fade">
          <div className="flex items-center gap-2">
            <InfoCircledIcon className="size-5" />
            {t('runsRetriedNote', {
              runsCount: retriedRunsIds.length,
            })}
          </div>

          <Button
            variant={'outline'}
            size="sm"
            onClick={() => {
              navigate(authenticationSession.appendProjectRoutePrefix(`/runs`));
              setSearchParams({
                [RUN_IDS_QUERY_PARAM]: retriedRunsIds,
                [LIMIT_QUERY_PARAM]: retriedRunsIds.length.toString(),
              });
            }}
          >
            {t('View')}
          </Button>
        </div>
      )}
    </div>
  );
};
