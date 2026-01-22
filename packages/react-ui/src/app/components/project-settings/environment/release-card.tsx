import { t } from 'i18next';
import { Package } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { projectCollectionUtils } from '@/hooks/project-collection';
import { cn } from '@/lib/utils';

const ReleaseCard = () => {
  const { project } = projectCollectionUtils.useCurrentProject();

  return (
    <Card className="w-full px-4 py-4">
      <div className="flex w-full gap-2 justify-center items-center">
        <div className="flex flex-col gap-2 text-center mr-2">
          <Package className="size-8" />
        </div>
        <div className="flex grow flex-col">
          <div className="text-lg">{t('Releases')}</div>
          <div className="text-sm text-muted-foreground">
            {t('Enable releases to easily create and manage project releases.')}
          </div>
        </div>
        <div className="flex flex-row justify-center items-center gap-1">
          <Button
            variant={'basic'}
            onClick={() =>
              projectCollectionUtils.update(project.id, {
                releasesEnabled: !project.releasesEnabled,
              })
            }
            className={cn('', {
              'text-destructive': project.releasesEnabled,
            })}
          >
            {project.releasesEnabled ? t('Disable') : t('Enable')}
          </Button>
        </div>
      </div>
    </Card>
  );
};

ReleaseCard.displayName = 'ReleaseCard';
export { ReleaseCard };
