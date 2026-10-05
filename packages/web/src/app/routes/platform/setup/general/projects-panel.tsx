import { PlatformWithoutSensitiveData } from '@activepieces/shared';
import { t } from 'i18next';

import { platformApi } from '@/api/platforms-api';
import { Panel, SettingRow, SettingRows } from '@/components/custom/panel';
import { Switch } from '@/components/ui/switch';
import { platformHooks } from '@/hooks/platform-hooks';
import { useOptimisticMutation } from '@/hooks/use-optimistic-mutation';
import { AdminControl, adminControl } from '@/lib/admin-control';

export function ProjectsPanel() {
  const { platform } = platformHooks.useCurrentPlatform();
  const { mutate: save } = useOptimisticMutation<
    boolean,
    PlatformWithoutSensitiveData
  >({
    mutationFn: (autoCreatePersonalProjects) =>
      platformApi.update({ autoCreatePersonalProjects }, platform.id),
    queryKey: ['platform', platform.id],
    apply: ({ current, vars }) => ({
      ...current,
      autoCreatePersonalProjects: vars,
    }),
    scope: `platform-${platform.id}-personal-projects`,
    errorTitle: t("Couldn't save changes"),
    success: ({ vars }) =>
      vars
        ? t('New users now get a personal project')
        : t('New users no longer get a personal project'),
    undo: ({ vars }) => !vars,
  });

  return (
    <Panel title={t('Projects')} flush>
      <SettingRows>
        <SettingRow
          title={
            <label htmlFor="autoCreatePersonalProjects">
              {t('Personal project for everyone')}
            </label>
          }
          description={t(
            'Give every new user a personal project when they sign up. Turn off if you add people to team projects yourself, for example through SSO.',
          )}
        >
          <Switch
            id="autoCreatePersonalProjects"
            checked={platform.autoCreatePersonalProjects}
            onCheckedChange={(checked) => save(checked)}
            {...adminControl(AdminControl.PROJECTS_AUTO_PERSONAL_TOGGLE)}
          />
        </SettingRow>
      </SettingRows>
    </Panel>
  );
}
