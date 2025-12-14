import { t } from 'i18next';
import { Download } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { downloadFile } from '@/lib/utils';
import { AnalyticsFlowReportItem } from '@activepieces/shared';

type FlowDetailsHeaderProps = {
  flowsDetails?: AnalyticsFlowReportItem[];
};

export function FlowDetailsHeader({ flowsDetails }: FlowDetailsHeaderProps) {
  const handleDownload = () => {
    if (!flowsDetails || flowsDetails.length === 0) return;

    const csvHeader =
      'Flow Name,Project Name,Runs,Time Saved Per Run (min),Total Time Saved (min)\n';
    const csvContent = flowsDetails
      .map((flow) => {
        const timeSavedPerRun =
          flow.runs > 0
            ? flow.timeSavedPerRun.value ??
              Math.round(flow.minutesSaved / flow.runs)
            : flow.timeSavedPerRun.value ?? 0;
        return `"${flow.flowName}","${flow.projectName}",${flow.runs},${timeSavedPerRun},${flow.minutesSaved}`;
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
        disabled={!flowsDetails || flowsDetails.length === 0}
      >
        <Download className="h-4 w-4 mr-2" />
        {t('Download')}
      </Button>
    </div>
  );
}
