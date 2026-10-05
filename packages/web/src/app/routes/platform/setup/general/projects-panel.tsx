import { useMutation, useQueryClient } from '@tanstack/react-query';
import { t } from 'i18next';
import { toast } from 'sonner';

import { platformApi } from '@/api/platforms-api';
import { Panel, SettingRow, SettingRows } from '@/components/custom/panel';
import { Switch } from '@/components/ui/switch';
import { platformHooks } from '@/hooks/platform-hooks';

export function ProjectsPanel() {
  const queryClient = useQueryClient();
  const { platform, setCurrentPlatform } = platformHooks.useCurrentPlatform();
  const { mutate: save, isPending } = useMutation({
    mutationFn: (autoCreatePersonalProjects: boolean) =>
      platformApi.update({ autoCreatePersonalProjects }, platform.id),
    onSuccess: (updated) => setCurrentPlatform(queryClient, updated),
    onError: () => toast.error(t('Failed to save changes. Please try again.')),
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
            disabled={isPending}
            onCheckedChange={(checked) => save(checked)}
          />
        </SettingRow>
      </SettingRows>
    </Panel>
  );
}
