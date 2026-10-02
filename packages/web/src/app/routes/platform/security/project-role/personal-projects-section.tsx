import { ErrorCode } from '@activepieces/core-utils';
import { t } from 'i18next';
import { Info } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

import { ConfirmationDeleteDialog } from '@/components/custom/delete-dialog';
import {
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemTitle,
} from '@/components/ui/item';
import { Switch } from '@/components/ui/switch';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { newMemberSettingsMutations } from '@/features/platform-admin';
import { platformHooks } from '@/hooks/platform-hooks';
import { api } from '@/lib/api';

export function PersonalProjectsSection() {
  const { platform, refetch: refetchPlatform } =
    platformHooks.useCurrentPlatform();
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [isRefused, setIsRefused] = useState(false);
  const {
    mutate: updateSettings,
    mutateAsync: updateSettingsAsync,
    isPending,
  } = newMemberSettingsMutations.useUpdateNewMemberSettings();

  const { personalProjectsActive, activeDefaultProjectIds } =
    platformHooks.useNewMemberSettings();
  const isEnabled = personalProjectsActive;
  const canTurnOff =
    platform.plan.projectRolesEnabled && activeDefaultProjectIds.length > 0;
  const isLocked = isEnabled && !canTurnOff;

  const handleRefusal = (error: Error) => {
    if (api.isApError(error, ErrorCode.DEFAULT_PROJECT_REQUIRED)) {
      setIsRefused(true);
      refetchPlatform().catch(() => undefined);
      return;
    }
    toast.error(t('Failed to save changes. Please try again.'));
  };

  const onCheckedChange = (checked: boolean) => {
    setIsRefused(false);
    if (!checked) {
      setIsConfirmOpen(true);
      return;
    }
    updateSettings(
      { autoCreatePersonalProjects: true },
      { onError: handleRefusal },
    );
  };

  return (
    <section className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <h2 className="text-base font-medium">{t('Personal projects')}</h2>
        <p className="max-w-2xl text-sm text-muted-foreground">
          {t('A private project for every new member.')}
        </p>
      </div>
      <div className="flex flex-col gap-3">
        <Item
          variant="outline"
          size="sm"
          className="flex-nowrap bg-background dark:bg-muted/50"
        >
          <ItemContent className="min-w-0">
            <ItemTitle>{t('Automatic personal project creation')}</ItemTitle>
            <ItemDescription>
              {t(
                "Turn off if you don't want new members to get a personal project. They'll join only the default projects.",
              )}
            </ItemDescription>
          </ItemContent>
          <ItemActions>
            <Tooltip>
              <TooltipTrigger asChild disabled={!isLocked}>
                <div>
                  <Switch
                    checked={isEnabled}
                    disabled={isLocked || isPending}
                    aria-label={t('Automatic personal project creation')}
                    onCheckedChange={onCheckedChange}
                  />
                </div>
              </TooltipTrigger>
              {isLocked && (
                <TooltipContent side="top">
                  {t('Add a default project first')}
                </TooltipContent>
              )}
            </Tooltip>
          </ItemActions>
        </Item>
        {(isLocked || isRefused) && platform.plan.projectRolesEnabled && (
          <p className="flex items-start gap-1.5 text-xs text-muted-foreground">
            <Info className="mt-px size-3.5 shrink-0" />
            {t(
              "Personal projects stay on until there's a default project for new members to join.",
            )}
          </p>
        )}
      </div>
      <ConfirmationDeleteDialog
        open={isConfirmOpen}
        onOpenChange={setIsConfirmOpen}
        title={t('Turn off personal projects?')}
        message={t(
          "New members will join only the default projects. Existing personal projects won't change.",
        )}
        entityName={t('Personal projects')}
        buttonText={t('Turn off')}
        confirmVariant="default"
        mutationFn={async () => {
          await updateSettingsAsync({ autoCreatePersonalProjects: false });
        }}
        onError={(error) => {
          setIsConfirmOpen(false);
          handleRefusal(error);
        }}
      />
    </section>
  );
}
