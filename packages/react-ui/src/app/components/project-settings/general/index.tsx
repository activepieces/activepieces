import { t } from 'i18next';
import { ChevronDown } from 'lucide-react';
import { useState } from 'react';
import { UseFormReturn } from 'react-hook-form';

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
import { platformHooks } from '@/hooks/platform-hooks';
import { projectCollectionUtils } from '@/hooks/project-collection';
import { userHooks } from '@/hooks/user-hooks';
import { cn } from '@/lib/utils';
import {
  ColorName,
  PlatformRole,
  PROJECT_COLOR_PALETTE,
  ProjectIcon,
  ProjectType,
} from '@activepieces/shared';

export type FormValues = {
  projectName: string;
  icon: ProjectIcon;
  externalId?: string;
};

type GeneralSettingsProps = {
  form: UseFormReturn<FormValues>;
  isSaving: boolean;
};

export const GeneralSettings = ({ form, isSaving }: GeneralSettingsProps) => {
  const { platform } = platformHooks.useCurrentPlatform();
  const platformRole = userHooks.getCurrentUserPlatformRole();
  const [colorPickerOpen, setColorPickerOpen] = useState(false);
  const { project } = projectCollectionUtils.useCurrentProject();
  const showGeneralSettings = project.type === ProjectType.TEAM;
  const showExternalIdSettings =
    platform.plan.embeddingEnabled && platformRole === PlatformRole.ADMIN;
  const colorOptions = Object.values(ColorName);

  return (
    <Form {...form}>
      <div className="space-y-6">
        {showGeneralSettings && (
          <div>
            <Label htmlFor="projectName" className="text-sm font-medium">
              {t('Project Name')}
            </Label>
            <div className="flex mt-2">
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
                            className="h-10 px-3 rounded-r-none border-r flex items-center gap-1"
                            disabled={isSaving}
                          >
                            <div
                              className="h-3 w-3 rounded-none shrink-0"
                              style={{
                                backgroundColor:
                                  PROJECT_COLOR_PALETTE[currentColor].color,
                              }}
                            />
                            <ChevronDown className="h-3 w-3" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-3" align="start">
                          <div className="grid grid-cols-6 gap-2">
                            {colorOptions.map((colorName) => (
                              <Button
                                key={colorName}
                                type="button"
                                variant="ghost"
                                size="icon"
                                className={cn(
                                  'h-8 w-8 rounded-sm transition-all hover:scale-110 p-0',
                                  currentColor === colorName &&
                                    'ring-2 ring-offset-2 ring-foreground',
                                )}
                                style={{
                                  backgroundColor:
                                    PROJECT_COLOR_PALETTE[colorName].color,
                                }}
                                onClick={() => {
                                  field.onChange({ color: colorName });
                                  setColorPickerOpen(false);
                                }}
                                disabled={isSaving}
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
                      className="h-10 rounded-l-none border-l-0"
                      disabled={isSaving}
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
                <Label htmlFor="externalId" className="text-sm font-medium">
                  {t('External ID')}
                </Label>

                <Input
                  {...field}
                  id="externalId"
                  placeholder={t('org-3412321')}
                  className="h-10 font-mono"
                  disabled={isSaving}
                />
                <FormDescription className="text-xs text-muted-foreground">
                  {t('Used to identify the project based on your SaaS ID')}
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
