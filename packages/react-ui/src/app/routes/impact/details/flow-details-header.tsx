import { t } from 'i18next';
import { Download } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { downloadFile } from '@/lib/utils';
import { PlatformAnalyticsReport } from '@activepieces/shared';

type FlowDetailsHeaderProps = {
  report?: PlatformAnalyticsReport;
};

export function FlowDetailsHeader({ report }: FlowDetailsHeaderProps) {
  const handleDownload = () => {
    if (!report || report.flows.length === 0) return;

    const csvHeader =
      'Flow Name,Project Name,Runs,Time Saved Per Run (min),Total Time Saved (min)\n';
    const csvContent = report.flows
      .map((flow) => {
        const runs =
          report.runs.find((run) => run.flowId === flow.flowId)?.runs ?? 0;
        const timeSavedPerRun = flow.timeSavedPerRun ?? 0;
        const minutesSaved = runs * timeSavedPerRun;
        return `"${flow.flowName}","${flow.projectId}",${runs},${timeSavedPerRun},${minutesSaved}`;
      })
      .join('\n');

    downloadFile({
      obj: csvHeader + csvContent,
      fileName: 'flow-analytics',
      extension: 'csv',
    });
  };

  return (
    <div className="flex items-center justify-between">
      <div className="text-lg font-semibold">{t('Details')}</div>
      <Button
        variant="outline"
        size="sm"
        onClick={handleDownload}
        disabled={!report?.flows || report.flows.length === 0}
      >
        <Download className="h-4 w-4 mr-2" />
        {t('Download')}
      </Button>
    </div>
  );
}
