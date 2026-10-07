import { t } from 'i18next';
import { useState } from 'react';

import { ConfirmationDeleteDialog } from '@/components/custom/delete-dialog';
import {
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemTitle,
} from '@/components/ui/item';
import { internalErrorToast } from '@/components/ui/sonner';
import { Switch } from '@/components/ui/switch';
import { PLATFORM_FEATURES, useFeatureGate } from '@/features/billing';
import { newMemberSettingsMutations } from '@/features/platform-admin';
import { platformHooks } from '@/hooks/platform-hooks';
import { AdminControl, adminControl } from '@/lib/admin-control';

export function PersonalProjectsSection() {
  const { platform } = platformHooks.useCurrentPlatform();
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const gate = useFeatureGate({
    locked: !platform.plan.projectRolesEnabled,
    feature: PLATFORM_FEATURES.projectRoles,
  });
  const {
    mutate: updateSettings,
    mutateAsync: updateSettingsAsync,
    isPending,
  } = newMemberSettingsMutations.useUpdateNewMemberSettings();

  const isEnabled = gate.locked || platform.autoCreatePersonalProjects;

  const onCheckedChange = (checked: boolean) => {
    if (checked) {
      updateSettings(
        { autoCreatePersonalProjects: true },
        { onError: () => internalErrorToast() },
      );
      return;
    }
    if (gate.locked) {
      gate.open();
      return;
    }
    setIsConfirmOpen(true);
  };

  return (
    <section className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <h2 className="text-base font-medium">{t('Personal projects')}</h2>
        <p className="max-w-2xl text-sm text-gray-11">
          {t('A private project for every new member.')}
        </p>
      </div>
      <Item variant="outline" size="sm" className="flex-nowrap bg-panel">
        <ItemContent className="min-w-0">
          <ItemTitle>{t('Automatic personal project creation')}</ItemTitle>
          <ItemDescription>
            {t(
              "Turn off if you don't want new members to get a personal project.",
            )}
          </ItemDescription>
        </ItemContent>
        <ItemActions>
          <Switch
            checked={isEnabled}
            disabled={isPending}
            aria-label={t('Automatic personal project creation')}
            onCheckedChange={onCheckedChange}
            {...adminControl(AdminControl.PROJECTS_AUTO_PERSONAL_TOGGLE)}
          />
        </ItemActions>
      </Item>
      <ConfirmationDeleteDialog
        open={isConfirmOpen}
        onOpenChange={setIsConfirmOpen}
        title={t('Turn off personal projects?')}
        message={t(
          "New members won't get a personal project. Existing personal projects won't change.",
        )}
        entityName={t('Personal projects')}
        buttonText={t('Turn off')}
        confirmVariant="default"
        mutationFn={async () => {
          await updateSettingsAsync({ autoCreatePersonalProjects: false });
        }}
        onError={() => {
          setIsConfirmOpen(false);
          internalErrorToast();
        }}
      />
      {gate.dialog}
    </section>
  );
}
