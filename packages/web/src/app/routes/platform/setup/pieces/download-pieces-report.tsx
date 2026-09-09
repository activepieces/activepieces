import { useMutation } from '@tanstack/react-query';
import { t } from 'i18next';
import { Download } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { api } from '@/lib/api';

const DownloadPiecesReportButton = () => {
  const { mutate, isPending } = useMutation({
    mutationFn: async () => {
      const blob = await api.get<Blob>(
        '/v1/platform/pieces-report.csv',
        undefined,
        {
          responseType: 'blob',
        },
      );
      const filename = `pieces-report-${new Date()
        .toISOString()
        .slice(0, 10)}.csv`;
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = filename;
      anchor.click();
      URL.revokeObjectURL(url);
    },
    onError: () => {
      toast.error(t('Failed to download pieces report'));
    },
  });

  return (
    <Button
      variant={'outline'}
      onClick={() => mutate()}
      loading={isPending}
      size={'sm'}
    >
      <Download className="w-4 h-4 mr-2" />
      {t('Download Report')}
    </Button>
  );
};

DownloadPiecesReportButton.displayName = 'DownloadPiecesReportButton';
export { DownloadPiecesReportButton };
