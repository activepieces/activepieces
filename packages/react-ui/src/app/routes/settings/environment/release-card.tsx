import { t } from 'i18next';
import { Package } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/use-toast';
import { INTERNAL_ERROR_TOAST } from '@/components/ui/use-toast';
import { useMutation } from '@tanstack/react-query';
import { projectHooks } from '@/hooks/project-hooks';
import { projectApi } from '@/lib/project-api';

const ReleaseCard = () => {
  const { project, refetch } = projectHooks.useCurrentProject()

  const { mutate } = useMutation({
    mutationFn: () => {
      return projectApi.update(project.id, {
        releasesEnabled: !project.releasesEnabled,
      })
    },
    onSuccess: () => {
      refetch()
      toast({
        title: t('Releases Enabled'),
        description: t('You have successfully enabled releases'),
        duration: 3000,
      });
    },
    onError: () => {
      toast(INTERNAL_ERROR_TOAST);
    },
  });
  
  return (
    <Card className="w-full px-4 py-4">
      <div className="flex w-full gap-2 justify-center items-center">
        <div className="flex flex-col gap-2 text-center mr-2">
            <Package className="size-8" />
        </div>
        <div className="flex flex-grow flex-col">
          <div className="text-lg">{t('Releases')}</div>
          <div className="text-sm text-muted-foreground">
            {t('Enable releases to easily create and manage project releases.')}
          </div>
        </div>
        <div className="flex flex-row justify-center items-center gap-1">
            <Button variant={'basic'} onClick={() => mutate()}>{project.releasesEnabled ? t('Disable') : t('Enable')}</Button>
        </div>
      </div>
    </Card>
  );
};

ReleaseCard.displayName = 'GitSyncCard';
export { ReleaseCard };
