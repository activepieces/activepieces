import { t } from 'i18next';
import { Package } from 'lucide-react';

import { Panel, SettingRow, SettingRows } from '@/components/custom/panel';
import { Button } from '@/components/ui/button';
import { projectCollectionUtils } from '@/features/projects';
import { cn } from '@/lib/utils';

const ReleaseCard = () => {
  const { project } = projectCollectionUtils.useCurrentProject();

  return (
    <Panel flush>
      <SettingRows>
        <SettingRow
          icon={<Package />}
          title={t('Releases')}
          description={t(
            'Enable releases to easily create and manage project releases.',
          )}
        >
          <Button
            variant="outline"
            size="sm"
            onClick={() =>
              projectCollectionUtils.update(project.id, {
                releasesEnabled: !project.releasesEnabled,
              })
            }
            className={cn({
              'text-danger-11': project.releasesEnabled,
            })}
          >
            {project.releasesEnabled ? t('Disable') : t('Enable')}
          </Button>
        </SettingRow>
      </SettingRows>
    </Panel>
  );
};

ReleaseCard.displayName = 'ReleaseCard';
export { ReleaseCard };
