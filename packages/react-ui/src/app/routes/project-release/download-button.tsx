import { useMutation } from '@tanstack/react-query';
import { DownloadIcon } from 'lucide-react';
import { t } from 'i18next';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { INTERNAL_ERROR_TOAST, useToast } from '@/components/ui/use-toast';
import { projectReleaseApi } from '@/features/project-version/lib/project-release-api';
import { ProjectRelease } from '@activepieces/shared';

export const DownloadButton = ({ release }: { release: ProjectRelease }) => {
  const { toast } = useToast();
  const { mutate: downloadProjectRelease, isPending: isDownloading } = useMutation({
    mutationFn: async ({ releaseId }: { releaseId: string }) => {
      return await projectReleaseApi.export(releaseId);
    },
    onSuccess: (data) => {
      const blob = new Blob([JSON.stringify(data)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${release.name || 'release'}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    },
    onError: () => {
      toast(INTERNAL_ERROR_TOAST);
    },
  });

  return (
    <div className="flex items-center justify-center">
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            loading={isDownloading}
            variant="ghost"
            className="size-8 p-0"
            onClick={() => downloadProjectRelease({ releaseId: release.id })}
          >
            <DownloadIcon className="size-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent side="bottom">{t('Download')}</TooltipContent>
      </Tooltip>
    </div>
  );
}; 