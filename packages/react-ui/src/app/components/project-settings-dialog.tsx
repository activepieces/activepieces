import { BellIcon, EyeNoneIcon, EyeOpenIcon } from '@radix-ui/react-icons';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { t } from 'i18next';
import {
  Check,
  ChevronsUpDown,
  Moon,
  Sun,
  Monitor,
  Bell,
  Settings,
  Users,
  Palette,
  Trash,
  Globe,
} from 'lucide-react';
import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
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
import { Dialog, DialogContent } from '@/components/ui/dialog';
import {
  Form,
  FormField,
  FormItem,
  FormMessage,
  FormDescription,
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
import { Separator } from '@/components/ui/separator';
import { LoadingSpinner } from '@/components/ui/spinner';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { INTERNAL_ERROR_TOAST, useToast } from '@/components/ui/use-toast';
import {
  alertQueries,
  alertMutations,
} from '@/features/alerts/lib/alert-hooks';
import { InvitationCard } from '@/features/team/component/invitation-card';
import { ProjectMemberCard } from '@/features/team/component/project-member-card';
import { projectMembersHooks } from '@/features/team/lib/project-members-hooks';
import { userInvitationsHooks } from '@/features/team/lib/user-invitations-hooks';
import { useAuthorization } from '@/hooks/authorization-hooks';
import { platformHooks } from '@/hooks/platform-hooks';
import { projectHooks } from '@/hooks/project-hooks';
import { userHooks } from '@/hooks/user-hooks';
import { api } from '@/lib/api';
import { authenticationSession } from '@/lib/authentication-session';
import { projectApi } from '@/lib/project-api';
import { localesMap, cn } from '@/lib/utils';
import { ProjectMemberWithUser, Alert } from '@activepieces/ee-shared';
import {
  ApFlagId,
  Permission,
  PlatformRole,
  ProjectWithLimits,
  ApErrorParams,
  ErrorCode,
  NotificationStatus,
} from '@activepieces/shared';

import { flagsHooks } from '../../hooks/flags-hooks';
import { AddAlertEmailDialog } from '../routes/settings/alerts/add-alert-email-dialog';

type TabId = 'general' | 'team' | 'alerts';

interface ProjectSettingsDialogProps {
  open: boolean;
  onClose: () => void;
  projectId?: string;
  initialValues?: {
    projectName?: string;
    tasks?: string;
    aiCredits?: string;
    externalId?: string;
  };
}

type FormValues = {
  projectName: string;
  tasks: string;
  aiCredits: string;
  externalId?: string;
};

const AlertOption = ({
  title,
  description,
  onClick,
  icon,
  isActive,
  disabled,
}: {
  title: string;
  description: string;
  onClick: () => void;
  icon: React.ReactNode;
  isActive: boolean;
  disabled: boolean;
}) => (
  <Button
    variant="ghost"
    onClick={onClick}
    disabled={disabled}
    className={cn(
      'flex items-start gap-3 p-4 h-auto justify-start w-full rounded-lg border transition-all hover:shadow-sm',
      isActive
        ? 'bg-primary/10 border-primary text-primary shadow-sm'
        : 'border-border hover:border-primary/30 hover:bg-muted/30',
    )}
  >
    <div className="shrink-0 p-1.5 rounded-md bg-background">{icon}</div>
    <div className="text-left">
      <div className="font-medium text-sm mb-1">{title}</div>
      <div className="text-xs text-muted-foreground leading-relaxed">
        {description}
      </div>
    </div>
    {isActive && <Check className="w-4 h-4 ml-auto mt-1 text-primary" />}
  </Button>
);

export const ThemeToggle = () => {
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

const GeneralSettings = ({
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
    <div className="space-y-6">
      <Card>
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
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            {t('Project Configuration')}
          </CardTitle>
          <CardDescription className="text-sm">
            {t('Manage your project settings and limits.')}
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

              {platform.plan.manageProjectsEnabled && (
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
    </div>
  );
};

const TeamSettings = () => {
  const {
    projectMembers,
    isLoading: projectMembersIsPending,
    refetch: refetchProjectMembers,
  } = projectMembersHooks.useProjectMembers();
  const { invitations, isLoading: invitationsIsPending } =
    userInvitationsHooks.useInvitations();

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Users className="w-4 h-4 text-green-600" />
            {t('Project Members')}
          </CardTitle>
          <CardDescription className="text-sm">
            {t('Invite your team members to collaborate.')}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="min-h-[100px]">
            {projectMembersIsPending && (
              <div className="flex justify-center py-8">
                <LoadingSpinner className="w-6 h-6" />
              </div>
            )}
            {projectMembers && projectMembers.length === 0 && (
              <div className="text-center text-muted-foreground py-8 text-sm">
                {t('No members are added to this project.')}
              </div>
            )}
            <div className="space-y-3">
              {Array.isArray(projectMembers) &&
                projectMembers.map((member: ProjectMemberWithUser) => (
                  <div
                    key={member.id}
                    className="p-3 border rounded-lg hover:shadow-sm transition-shadow"
                  >
                    <ProjectMemberCard
                      member={member}
                      onUpdate={refetchProjectMembers}
                    />
                  </div>
                ))}
            </div>
          </div>

          <Separator className="my-6" />

          <div>
            <h4 className="text-sm font-medium mb-4 flex items-center gap-2">
              <Bell className="w-4 h-4 text-orange-500" />
              {t('Pending Invitations')}
            </h4>
            <div className="min-h-[100px]">
              {invitationsIsPending && (
                <div className="flex justify-center py-8">
                  <LoadingSpinner className="w-6 h-6" />
                </div>
              )}
              {invitations && invitations.length === 0 && (
                <div className="text-center text-muted-foreground py-8 text-sm">
                  {t('No pending invitation.')}
                </div>
              )}
              <div className="space-y-3">
                {Array.isArray(invitations) &&
                  invitations.map((invitation) => (
                    <div
                      key={invitation.id}
                      className="p-3 border rounded-lg hover:shadow-sm transition-shadow"
                    >
                      <InvitationCard invitation={invitation} />
                    </div>
                  ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

const AlertsSettings = () => {
  const { project, updateCurrentProject } = projectHooks.useCurrentProject();
  const { checkAccess } = useAuthorization();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const {
    data: alertsData,
    isLoading: alertsLoading,
    isError: alertsError,
  } = alertQueries.useAlertsEmailList();
  const { mutate: deleteAlert } = alertMutations.useDeleteAlert();

  const notificationMutation = useMutation<
    ProjectWithLimits,
    Error,
    {
      notifyStatus: NotificationStatus;
    }
  >({
    mutationFn: (request) => {
      updateCurrentProject(queryClient, request);
      return projectApi.update(authenticationSession.getProjectId()!, request);
    },
    onSuccess: () => {
      toast({
        title: t('Success'),
        description: t('Your changes have been saved.'),
        duration: 3000,
      });
    },
  });

  const onChangeStatus = (status: NotificationStatus) => {
    notificationMutation.mutate({
      notifyStatus: status,
    });
  };

  const writeAlertPermission =
    checkAccess(Permission.WRITE_ALERT) &&
    checkAccess(Permission.WRITE_PROJECT);

  return (
    <div className="space-y-6">
      <ScrollArea className="h-[600px]">
        <div className="space-y-6 pr-3">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <Bell className="w-4 h-4 text-orange-600" />
                {t('Alert Frequency')}
              </CardTitle>
              <CardDescription className="text-sm">
                {t('Choose what you want to be notified about.')}
              </CardDescription>
              {writeAlertPermission === false && (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-md">
                  <p className="text-xs text-amber-700">
                    <span className="font-medium">⚠️ Limited Access:</span>{' '}
                    {t(
                      'Project and alert permissions are required to change this setting.',
                    )}
                  </p>
                </div>
              )}
            </CardHeader>
            <CardContent className="space-y-3">
              <AlertOption
                title={t('Every Failed Run')}
                description={t('Get an email alert when a flow fails.')}
                onClick={() => onChangeStatus(NotificationStatus.ALWAYS)}
                icon={<BellIcon className="w-4 h-4" />}
                isActive={project?.notifyStatus === NotificationStatus.ALWAYS}
                disabled={writeAlertPermission === false}
              />
              <AlertOption
                title={t('First Seen')}
                description={t(
                  'Get an email alert when a new issue is created.',
                )}
                onClick={() => onChangeStatus(NotificationStatus.NEW_ISSUE)}
                icon={<EyeOpenIcon className="w-4 h-4" />}
                isActive={
                  project?.notifyStatus === NotificationStatus.NEW_ISSUE
                }
                disabled={writeAlertPermission === false}
              />
              <AlertOption
                title={t('Never')}
                description={t('Turn off email notifications.')}
                onClick={() => onChangeStatus(NotificationStatus.NEVER)}
                icon={<EyeNoneIcon className="w-4 h-4" />}
                isActive={project?.notifyStatus === NotificationStatus.NEVER}
                disabled={writeAlertPermission === false}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <Bell className="w-4 h-4 text-red-600" />
                {t('Alert Emails')}
              </CardTitle>
              <CardDescription className="text-sm">
                {t('Add email addresses to receive alerts.')}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="min-h-[100px]">
                {alertsLoading && (
                  <div className="flex items-center justify-center py-8">
                    <LoadingSpinner className="w-6 h-6" />
                  </div>
                )}
                {alertsError && (
                  <div className="text-center text-destructive py-8 text-sm">
                    {t('Error, please try again.')}
                  </div>
                )}
                {alertsData && alertsData.length === 0 && (
                  <div className="text-center text-muted-foreground py-8 text-sm">
                    {t('No emails added yet.')}
                  </div>
                )}
                <div className="space-y-2">
                  {Array.isArray(alertsData) &&
                    alertsData.map((alert: Alert) => (
                      <div
                        className="flex items-center justify-between p-3 border rounded-lg hover:shadow-sm transition-all"
                        key={alert.id}
                      >
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-red-100 rounded-md flex items-center justify-center">
                            <Bell className="w-4 h-4 text-red-600" />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-900">
                              {alert.receiver}
                            </p>
                          </div>
                        </div>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0 hover:bg-red-50"
                              onClick={() => deleteAlert(alert)}
                              disabled={writeAlertPermission === false}
                            >
                              <Trash className="w-4 h-4 text-red-500" />
                            </Button>
                          </TooltipTrigger>
                          {writeAlertPermission === false && (
                            <TooltipContent side="bottom">
                              {t('Only project admins can do this')}
                            </TooltipContent>
                          )}
                        </Tooltip>
                      </div>
                    ))}
                </div>
              </div>
              <AddAlertEmailDialog />
            </CardContent>
          </Card>
        </div>
      </ScrollArea>
    </div>
  );
};

export function ProjectSettingsDialog({
  open,
  onClose,
  projectId,
  initialValues,
}: ProjectSettingsDialogProps) {
  const [activeTab, setActiveTab] = useState<TabId>('general');
  const { checkAccess } = useAuthorization();

  const form = useForm<FormValues>({
    defaultValues: {
      projectName: initialValues?.projectName,
      tasks: initialValues?.tasks || '',
      aiCredits: initialValues?.aiCredits || '',
      externalId: initialValues?.externalId,
    },
    disabled: checkAccess(Permission.WRITE_PROJECT) === false,
  });

  useEffect(() => {
    if (open) {
      form.reset(initialValues);
    }
  }, [open]);

  const tabs = [
    {
      id: 'general' as TabId,
      label: t('General'),
      icon: <Settings className="w-4 h-4" />,
      disabled: false,
    },
    {
      id: 'team' as TabId,
      label: t('Team'),
      icon: <Users className="w-4 h-4" />,
      disabled: !checkAccess(Permission.READ_PROJECT_MEMBER),
    },
    {
      id: 'alerts' as TabId,
      label: t('Alerts'),
      icon: <Bell className="w-4 h-4" />,
      disabled: !checkAccess(Permission.READ_ALERT),
    },
  ].filter((tab) => !tab.disabled);

  const renderTabContent = () => {
    switch (activeTab) {
      case 'general':
        return (
          <GeneralSettings
            form={form}
            projectId={projectId}
            initialValues={initialValues}
          />
        );
      case 'team':
        return <TeamSettings />;
      case 'alerts':
        return <AlertsSettings />;
      default:
        return null;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl w-full max-h-[90vh] h-[650px] pt-12 pb-4">
        <div className="flex h-full">
          <div className="w-56 pr-4">
            <nav className="space-y-1">
              {tabs.map((tab) => (
                <Button
                  variant="ghost"
                  key={tab.id}
                  className={cn(
                    'w-full justify-start gap-2 text-left h-9 text-sm font-medium rounded-lg transition-all',
                    {
                      'bg-primary/10 text-primary hover:bg-primary/15':
                        activeTab === tab.id,
                      'hover:bg-muted/50': activeTab !== tab.id,
                    },
                  )}
                  onClick={() => setActiveTab(tab.id)}
                >
                  {tab.icon}
                  {tab.label}
                </Button>
              ))}
            </nav>
          </div>

          <div className="flex-1 overflow-y-auto">{renderTabContent()}</div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
