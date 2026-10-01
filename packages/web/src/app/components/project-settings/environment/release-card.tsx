import { t } from 'i18next';

import { Panel, SettingRow, SettingRows } from '@/components/custom/panel';
import { Switch } from '@/components/ui/switch';
import { projectCollectionUtils } from '@/features/projects';

const ReleaseCard = () => {
  const { project } = projectCollectionUtils.useCurrentProject();

  return (
    <Panel flush>
      <SettingRows>
        <SettingRow
          title={t('Releases')}
          description={t(
            'Show the Releases tab, where you create releases and roll them back.',
          )}
        >
          <Switch
            aria-label={t('Releases')}
            checked={project.releasesEnabled}
            onCheckedChange={(checked) =>
              projectCollectionUtils.update(project.id, {
                releasesEnabled: checked,
              })
            }
          />
        </SettingRow>
      </SettingRows>
    </Panel>
  );
};

ReleaseCard.displayName = 'ReleaseCard';
export { ReleaseCard };
