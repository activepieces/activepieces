import { useMutation, useQueryClient } from '@tanstack/react-query';
import { t } from 'i18next';
import {
  Check,
  ChevronsUpDown,
  Globe,
  Monitor,
  Moon,
  Palette,
  Sun,
} from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';

import { useTheme } from '@/components/theme-provider';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
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
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { LoadingSpinner } from '@/components/ui/spinner';
import { INTERNAL_ERROR_TOAST, useToast } from '@/components/ui/use-toast';
import { flagsHooks } from '@/hooks/flags-hooks';
import { platformHooks } from '@/hooks/platform-hooks';
import { projectHooks } from '@/hooks/project-hooks';
import { userHooks } from '@/hooks/user-hooks';
import { api } from '@/lib/api';
import { projectApi } from '@/lib/project-api';
import { cn, localesMap } from '@/lib/utils';
import {
  ApErrorParams,
  ApFlagId,
  ErrorCode,
  PlatformRole,
  ProjectWithLimits,
} from '@activepieces/shared';

const ThemeToggle = () => {
  const { theme, setTheme } = useTheme();

  return (
    <div className="space-y-2">
      <Label className="text-sm font-medium flex items-center gap-2">
        <Palette className="w-4 h-4" />
        {t('Theme')}
      </Label>
      <Select value={theme} onValueChange={setTheme}>
        <SelectTrigger className="h-9">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="light" className="text-sm py-2">
            <div className="flex items-center gap-2">
              <Sun className="w-4 h-4" />
              Light
            </div>
          </SelectItem>
          <SelectItem value="dark" className="text-sm py-2">
            <div className="flex items-center gap-2">
              <Moon className="w-4 h-4" />
              Dark
            </div>
          </SelectItem>
          <SelectItem value="system" className="text-sm py-2">
            <div className="flex items-center gap-2">
              <Monitor className="w-4 h-4" />
              System
            </div>
          </SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
};

export function LanguageSwitcher() {
  const { i18n } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const { data: showCommunity } = flagsHooks.useFlag<boolean>(
    ApFlagId.SHOW_COMMUNITY,
  );
  const [selectedLanguage, setSelectedLanguage] = useState<string | undefined>(
    i18n.language ?? 'en',
  );

  const { mutate, isPending } = useMutation({
    mutationFn: (value: string) => {
      setSelectedLanguage(value);
      return i18n.changeLanguage(value);
    },
    onSuccess: () => {
      setIsOpen(false);
    },
  });

  return (
    <div className="space-y-2">
      <Label className="text-sm font-medium flex items-center gap-2">
        <Globe className="w-4 h-4" />
        {t('Language')}
      </Label>
      <Popover modal={true} open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            className={cn(
              'w-full justify-between h-9',
              !selectedLanguage && 'text-muted-foreground',
            )}
            disabled={isPending}
          >
            {isPending ? (
              <LoadingSpinner className="w-4 h-4" />
            ) : selectedLanguage ? (
              localesMap[selectedLanguage as keyof typeof localesMap]
            ) : (
              t('Select language')
            )}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-full p-0" align="start">
          <Command>
            <CommandInput
              placeholder={i18n.t('Search language...')}
              className="h-9 text-sm"
            />
            <CommandList>
              <ScrollArea className="h-[200px] w-[300px]">
                <CommandEmpty className="py-4 text-center text-sm">
                  {i18n.t('No language found.')}
                </CommandEmpty>
                <CommandGroup>
                  {Object.entries(localesMap).map(([value, label]) => (
                    <CommandItem
                      value={value}
                      key={value}
                      onSelect={(value) => mutate(value)}
                      className="flex items-center justify-between py-2 text-sm"
                    >
                      <div className="flex items-center gap-2">
                        <Globe className="w-4 h-4" />
                        {label}
                      </div>
                      <Check
                        className={cn(
                          'h-4 w-4',
                          value === selectedLanguage
                            ? 'opacity-100'
                            : 'opacity-0',
                        )}
                      />
                    </CommandItem>
                  ))}
                </CommandGroup>
              </ScrollArea>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
      {showCommunity && (
        <div className="pt-1">
          <Link
            className="text-xs text-primary hover:underline font-medium"
            rel="noopener noreferrer"
            target="_blank"
            to="https://www.activepieces.com/docs/about/i18n"
          >
            {t('Help translate Activepieces →')}
          </Link>
        </div>
      )}
    </div>
  );
}

export const GeneralSettings = ({
  form,
  projectId,
}: {
  form: any;
  projectId?: string;
  initialValues?: any;
}) => {
  const { platform } = platformHooks.useCurrentPlatform();
  const platformRole = userHooks.getCurrentUserPlatformRole();
  const queryClient = useQueryClient();
  const { updateCurrentProject } = projectHooks.useCurrentProject();
  const { toast } = useToast();

  const projectMutation = useMutation<
    ProjectWithLimits,
    Error,
    {
      displayName: string;
      externalId?: string;
      plan: { tasks: number | undefined; aiCredits?: number | undefined };
    }
  >({
    mutationFn: (request) => {
      updateCurrentProject(queryClient, request);
      return projectApi.update(projectId!, {
        ...request,
        externalId:
          request.externalId?.trim() !== '' ? request.externalId : undefined,
      });
    },
    onSuccess: () => {
      toast({
        title: t('Success'),
        description: t('Your changes have been saved.'),
        duration: 3000,
      });
      queryClient.invalidateQueries({
        queryKey: ['current-project'],
      });
    },
    onError: (error) => {
      if (api.isError(error)) {
        const apError = error.response?.data as ApErrorParams;
        switch (apError.code) {
          case ErrorCode.PROJECT_EXTERNAL_ID_ALREADY_EXISTS: {
            form.setError('root.serverError', {
              message: t('The external ID is already taken.'),
            });
            break;
          }
          default: {
            toast(INTERNAL_ERROR_TOAST);
            break;
          }
        }
      }
    },
  });

  return (
    <>
      {/*<Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            {t('Appearance')}
          </CardTitle>
          <CardDescription className="text-sm">
            {t('Customize how the interface looks and feels.')}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <ThemeToggle />
            <LanguageSwitcher />
          </div>
        </CardContent>
      </Card>*/}

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            {t('Project Configuration')}
          </CardTitle>
          <CardDescription className="text-sm">
            {/*{t('Manage your project settings and limits.')}*/}
            {t('Manage your project settings.')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <div className="space-y-4">
              <FormField
                name="projectName"
                render={({ field }) => (
                  <FormItem>
                    <Label
                      htmlFor="projectName"
                      className="text-sm font-medium"
                    >
                      {t('Project Name')}
                    </Label>
                    <Input
                      {...field}
                      id="projectName"
                      placeholder={t('Project Name')}
                      className="h-9"
                    />
                    <FormMessage />
                  </FormItem>
                )}
              />

              {false && platform.plan.manageProjectsEnabled && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    name="tasks"
                    render={({ field }) => (
                      <FormItem>
                        <Label htmlFor="tasks" className="text-sm font-medium">
                          {t('Tasks')}
                        </Label>
                        <div className="relative">
                          <Input
                            {...field}
                            type="number"
                            id="tasks"
                            placeholder={t('Tasks')}
                            className="h-9 pr-16"
                          />
                          {!field.disabled && (
                            <Button
                              variant="ghost"
                              type="button"
                              tabIndex={-1}
                              size="sm"
                              className="absolute right-1 top-1/2 -translate-y-1/2 h-7 px-2 text-xs"
                              onClick={() => form.setValue('tasks', '')}
                            >
                              {t('Clear')}
                            </Button>
                          )}
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    name="aiCredits"
                    render={({ field }) => (
                      <FormItem>
                        <Label
                          htmlFor="aiCredits"
                          className="text-sm font-medium"
                        >
                          {t('AI Credits')}
                        </Label>
                        <div className="relative">
                          <Input
                            {...field}
                            type="number"
                            id="aiCredits"
                            placeholder={t('AI Credits')}
                            className="h-9 pr-16"
                          />
                          {!field.disabled && (
                            <Button
                              variant="ghost"
                              type="button"
                              tabIndex={-1}
                              size="sm"
                              className="absolute right-1 top-1/2 -translate-y-1/2 h-7 px-2 text-xs"
                              onClick={() => form.setValue('aiCredits', '')}
                            >
                              {t('Clear')}
                            </Button>
                          )}
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              )}

              {platform.plan.embeddingEnabled &&
                platformRole === PlatformRole.ADMIN && (
                  <FormField
                    name="externalId"
                    render={({ field }) => (
                      <FormItem>
                        <Label
                          htmlFor="externalId"
                          className="text-sm font-medium"
                        >
                          {t('External ID')}
                        </Label>
                        <FormDescription className="text-xs">
                          {t(
                            'Used to identify the project based on your SaaS ID',
                          )}
                        </FormDescription>
                        <Input
                          {...field}
                          id="externalId"
                          placeholder={t('org-3412321')}
                          className="h-9 font-mono"
                        />
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}

              <div className="pt-2 flex justify-end">
                <Button
                  disabled={projectMutation.isPending}
                  size="sm"
                  onClick={form.handleSubmit((values: any) =>
                    projectMutation.mutate({
                      displayName: values.projectName,
                      externalId: values.externalId,
                      plan: {
                        tasks: values.tasks
                          ? parseInt(values.tasks)
                          : undefined,
                        aiCredits: values.aiCredits
                          ? parseInt(values.aiCredits)
                          : undefined,
                      },
                    }),
                  )}
                >
                  {projectMutation.isPending ? (
                    <>
                      <LoadingSpinner className="w-4 h-4 mr-2" />
                      {t('Saving...')}
                    </>
                  ) : (
                    t('Save Changes')
                  )}
                </Button>
              </div>
            </div>
          </Form>
        </CardContent>
      </Card>
    </>
  );
};
