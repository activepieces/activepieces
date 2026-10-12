import { tryCatch } from '@activepieces/core-utils';
import { t } from 'i18next';
import { useState } from 'react';
import { toast } from 'sonner';

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
import {
  newMemberSettingsMutations,
  newMemberSettingsQueries,
} from '@/features/platform-admin';
import { platformHooks } from '@/hooks/platform-hooks';
import { AdminControl, adminControl } from '@/lib/admin-control';

import {
  TurnOffPersonalProjectsDialog,
  TurnOnPersonalProjectsDialog,
} from './personal-projects-dialogs';

export function PersonalProjectsSection() {
  const { platform, refetch: refetchPlatform } =
    platformHooks.useCurrentPlatform();
  const [openDialog, setOpenDialog] = useState<'turn-on' | 'turn-off' | null>(
    null,
  );
  const gate = useFeatureGate({
    locked: !platform.plan.projectRolesEnabled,
    feature: PLATFORM_FEATURES.projectRoles,
  });
  const { mutateAsync: updateSettings, isPending: isUpdating } =
    newMemberSettingsMutations.useUpdateNewMemberSettings();
  const { mutateAsync: createMissing, isPending: isCreatingMissing } =
    newMemberSettingsMutations.useCreateMissingPersonalProjects();
  const { data: summary, refetch: refetchSummary } =
    newMemberSettingsQueries.usePersonalProjectsSummary({
      enabled: !gate.locked,
    });
  const [isCheckingMembers, setIsCheckingMembers] = useState(false);
  const [membersToOffer, setMembersToOffer] = useState(0);
  const isPending = isUpdating || isCreatingMissing || isCheckingMembers;

  const isEnabled = gate.locked || platform.autoCreatePersonalProjects;

  const onCheckedChange = async (checked: boolean) => {
    if (gate.locked) {
      gate.open();
      return;
    }
    if (!checked) {
      refetchSummary();
      setOpenDialog('turn-off');
      return;
    }
    setIsCheckingMembers(true);
    const fresh = await refetchSummary();
    setIsCheckingMembers(false);
    const membersWithoutPersonalProject = fresh.isError
      ? 0
      : fresh.data?.membersWithoutPersonalProject ?? 0;
    if (membersWithoutPersonalProject === 0) {
      await turnOn({ createForExistingMembers: false });
      return;
    }
    setMembersToOffer(membersWithoutPersonalProject);
    setOpenDialog('turn-on');
  };

  const turnOn = async ({
    createForExistingMembers,
  }: {
    createForExistingMembers: boolean;
  }) => {
    const { error } = await tryCatch(async () => {
      if (createForExistingMembers) {
        await createMissing();
        await refetchPlatform();
        return;
      }
      await updateSettings({ autoCreatePersonalProjects: true });
    });
    setOpenDialog(null);
    if (error) {
      internalErrorToast();
      return;
    }
    if (createForExistingMembers) {
      toast.success(t('Creating personal projects for members without one.'));
    }
  };

  const turnOff = async () => {
    const { error } = await tryCatch(() =>
      updateSettings({ autoCreatePersonalProjects: false }),
    );
    setOpenDialog(null);
    if (error) {
      internalErrorToast();
    }
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
      {openDialog === 'turn-on' && (
        <TurnOnPersonalProjectsDialog
          onClose={() => setOpenDialog(null)}
          membersWithoutPersonalProject={membersToOffer}
          isPending={isPending}
          onConfirm={turnOn}
        />
      )}
      <TurnOffPersonalProjectsDialog
        open={openDialog === 'turn-off'}
        onOpenChange={(open) => setOpenDialog(open ? 'turn-off' : null)}
        personalProjectCount={summary?.personalProjectCount ?? 0}
        isPending={isPending}
        onConfirm={turnOff}
      />
      {gate.dialog}
    </section>
  );
}
