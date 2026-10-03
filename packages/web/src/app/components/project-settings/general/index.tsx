import {
  ApFlagId,
  ColorName,
  PICKABLE_COLOR_NAMES,
  PlatformRole,
  PROJECT_COLOR_PALETTE,
  PROJECT_COLOR_SWATCH,
  ProjectIcon,
  ProjectType,
} from '@activepieces/shared';
import { t } from 'i18next';
import { ChevronDown } from 'lucide-react';
import { useState } from 'react';
import { UseFormReturn } from 'react-hook-form';

import { ClearableInput } from '@/components/custom/clearable-input';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormDescription,
  FormField,
  FormItem,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Switch } from '@/components/ui/switch';
import { projectCollectionUtils } from '@/features/projects';
import { flagsHooks } from '@/hooks/flags-hooks';
import { platformHooks } from '@/hooks/platform-hooks';
import { userHooks } from '@/hooks/user-hooks';
import { cn } from '@/lib/utils';

export type FormValues = {
  projectName: string;
  icon: ProjectIcon;
  externalId?: string;
  maxConcurrentJobs?: number | null;
  activeFlowsLimit?: number | null;
  sensitive?: boolean;
};

type GeneralSettingsProps = {
  form: UseFormReturn<FormValues>;
};

export const GeneralSettings = ({ form }: GeneralSettingsProps) => {
  const { platform } = platformHooks.useCurrentPlatform();
  const platformRole = userHooks.getCurrentUserPlatformRole();
  const [colorPickerOpen, setColorPickerOpen] = useState(false);
  const { project } = projectCollectionUtils.useCurrentProject();
  const { data: isRateLimiterEnabled } = flagsHooks.useFlag<boolean>(
    ApFlagId.PROJECT_RATE_LIMITER_ENABLED,
  );
  const { data: defaultConcurrentJobsLimit } = flagsHooks.useFlag<number>(
    ApFlagId.DEFAULT_CONCURRENT_JOBS_LIMIT,
  );
  const showGeneralSettings = project.type === ProjectType.TEAM;
  const showExternalIdSettings =
    platform.plan.embeddingEnabled && platformRole === PlatformRole.ADMIN;
  const colorOptions = PICKABLE_COLOR_NAMES;

  return (
    <Form {...form}>
      <div className="flex flex-col gap-4">
        {showGeneralSettings && (
          <div className="flex flex-col gap-2">
            <Label htmlFor="projectName">{t('Project Name')}</Label>
            <div className="flex">
              <FormField
                name="icon"
                render={({ field }) => {
                  const currentColor: ColorName = field.value.color;
                  return (
                    <FormItem>
                      <Popover
                        open={colorPickerOpen}
                        onOpenChange={setColorPickerOpen}
                      >
                        <PopoverTrigger asChild>
                          <Button
                            type="button"
                            variant="outline"
                            className="gap-1 rounded-r-none"
                            disabled={form.formState.disabled}
                          >
                            <div
                              className="size-3 shrink-0 rounded-md"
                              style={{
                                backgroundColor:
                                  PROJECT_COLOR_PALETTE[currentColor].color,
                              }}
                            />
                            <ChevronDown className="size-3.5 text-gray-11" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto" align="start">
                          <div className="grid grid-cols-6 gap-2">
                            {colorOptions.map((colorName) => (
                              <Button
                                key={colorName}
                                type="button"
                                variant="ghost"
                                size="icon-sm"
                                className={cn(
                                  'transition-all hover:scale-110',
                                  PROJECT_COLOR_SWATCH[currentColor] ===
                                    PROJECT_COLOR_SWATCH[colorName] &&
                                    'ring-2 ring-offset-2 ring-offset-panel ring-gray-12',
                                )}
                                style={{
                                  backgroundColor:
                                    PROJECT_COLOR_PALETTE[colorName].color,
                                }}
                                onClick={() => {
                                  field.onChange({ color: colorName });
                                  setColorPickerOpen(false);
                                }}
                                disabled={form.formState.disabled}
                              />
                            ))}
                          </div>
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  );
                }}
              />
              <FormField
                name="projectName"
                render={({ field }) => (
                  <FormItem className="flex-1">
                    <Input
                      {...field}
                      id="projectName"
                      placeholder={t('Project Name')}
                      className="rounded-l-none border-l-0"
                      disabled={form.formState.disabled}
                    />
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>
        )}
        {showExternalIdSettings && (
          <FormField
            name="externalId"
            render={({ field }) => (
              <FormItem>
                <Label htmlFor="externalId">{t('External ID')}</Label>

                <Input
                  {...field}
                  id="externalId"
                  placeholder={t('org-3412321')}
                  className="font-mono"
                  disabled={form.formState.disabled}
                />
                <FormDescription>
                  {t('Used to identify the project based on your SaaS ID')}
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        )}
        {platform.plan.environmentsEnabled && (
          <FormField
            name="sensitive"
            render={({ field }) => (
              <FormItem className="flex-row items-center justify-between gap-4 rounded-xl border px-3 py-2.5">
                <div className="flex flex-col gap-1">
                  <Label htmlFor="sensitive">{t('Sensitive Project')}</Label>
                  <FormDescription>
                    {t(
                      'When enabled, publishing flows in this project requires approval.',
                    )}
                  </FormDescription>
                </div>
                <Switch
                  id="sensitive"
                  checked={!!field.value}
                  onCheckedChange={field.onChange}
                  disabled={form.formState.disabled}
                />
                <FormMessage />
              </FormItem>
            )}
          />
        )}
        {!platform.plan.workerGroupsEnabled &&
          platformRole === PlatformRole.ADMIN && (
            <FormField
              name="maxConcurrentJobs"
              render={({ field }) => (
                <FormItem>
                  <Label htmlFor="maxConcurrentJobs">
                    {t('Max Concurrent Jobs')}
                  </Label>
                  <ClearableInput
                    {...field}
                    id="maxConcurrentJobs"
                    type="number"
                    min={1}
                    placeholder={
                      defaultConcurrentJobsLimit
                        ? t('Default ({value})', {
                            value: defaultConcurrentJobsLimit,
                          })
                        : t('Default')
                    }
                    value={field.value ?? ''}
                    onChange={(e) =>
                      field.onChange(
                        e.target.value ? Number(e.target.value) : null,
                      )
                    }
                    onClear={() => field.onChange(null)}
                    disabled={form.formState.disabled || !isRateLimiterEnabled}
                  />
                  <FormDescription>
                    {isRateLimiterEnabled === false
                      ? t(
                          'The rate limiting feature is disabled. Enable the PROJECT_RATE_LIMITER_ENABLED environment variable to use this feature.',
                        )
                      : t(
                          'Maximum number of flows that can run at the same time for this project',
                        )}
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}
        {platform.plan.billedTeamProjectsLimit !== 0 &&
          platformRole === PlatformRole.ADMIN && (
            <FormField
              name="activeFlowsLimit"
              render={({ field }) => (
                <FormItem>
                  <Label htmlFor="activeFlowsLimit">
                    {t('Active Flows Limit')}
                  </Label>
                  <ClearableInput
                    {...field}
                    id="activeFlowsLimit"
                    type="number"
                    min={1}
                    placeholder={t('Unlimited')}
                    value={field.value ?? ''}
                    onChange={(e) =>
                      field.onChange(
                        e.target.value ? Number(e.target.value) : null,
                      )
                    }
                    onClear={() => field.onChange(null)}
                    disabled={form.formState.disabled}
                  />
                  <FormDescription>
                    {t(
                      'Maximum number of enabled flows in this project. Leave empty for no limit.',
                    )}
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}
      </div>
    </Form>
  );
};
