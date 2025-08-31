import { BellIcon, EyeNoneIcon, EyeOpenIcon } from '@radix-ui/react-icons';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { t } from 'i18next';
import { Bell, Settings, Users, Palette, Trash } from 'lucide-react';
import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
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
import { cn } from '@/lib/utils';
import { ProjectMemberWithUser, Alert } from '@activepieces/ee-shared';
import {
  Permission,
  PlatformRole,
  ProjectWithLimits,
  ApErrorParams,
  ErrorCode,
  NotificationStatus,
} from '@activepieces/shared';

import { AddAlertEmailDialog } from '../routes/settings/alerts/add-alert-email-dialog';

import { AppearanceSettings } from './appearance-settings';

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

// Alert Option Component
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
      'flex items-start gap-4 p-4 h-auto justify-start w-full rounded-lg border transition-colors',
      isActive
        ? 'bg-primary/5 border-primary text-primary'
        : 'border-border hover:bg-muted/50',
    )}
  >
    <div className="shrink-0">{icon}</div>
    <div className="text-left">
      <div className="font-medium">{title}</div>
      <div className="text-sm text-muted-foreground">{description}</div>
    </div>
  </Button>
);

export function ProjectSettingsDialog({
  open,
  onClose,
  projectId,
  initialValues,
}: ProjectSettingsDialogProps) {
  const [activeTab, setActiveTab] = useState<TabId>('team');
  const { checkAccess } = useAuthorization();
  const { platform } = platformHooks.useCurrentPlatform();
  const platformRole = userHooks.getCurrentUserPlatformRole();
  const queryClient = useQueryClient();
  const { project, updateCurrentProject } = projectHooks.useCurrentProject();
  const { toast } = useToast();

  // Team hooks
  const {
    projectMembers,
    isLoading: projectMembersIsPending,
    refetch: refetchProjectMembers,
  } = projectMembersHooks.useProjectMembers();
  const { invitations, isLoading: invitationsIsPending } =
    userInvitationsHooks.useInvitations();

  // Alerts hooks
  const {
    data: alertsData,
    isLoading: alertsLoading,
    isError: alertsError,
  } = alertQueries.useAlertsEmailList();
  const { mutate: deleteAlert } = alertMutations.useDeleteAlert();

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
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                <Palette className="w-5 h-5" />
                {t('Appearance')}
              </h3>
              <Card>
                <CardContent className="pt-6">
                  <AppearanceSettings />
                </CardContent>
              </Card>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                <Settings className="w-5 h-5" />
                {t('Project Settings')}
              </h3>
              <Card>
                <CardContent className="pt-6">
                  <Form {...form}>
                    <div className="space-y-4">
                      <FormField
                        name="projectName"
                        render={({ field }) => (
                          <FormItem>
                            <Label htmlFor="projectName">
                              {t('Project Name')}
                            </Label>
                            <Input
                              {...field}
                              id="projectName"
                              placeholder={t('Project Name')}
                              className="rounded-sm"
                            />
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {platform.plan.manageProjectsEnabled && (
                        <>
                          <FormField
                            name="tasks"
                            render={({ field }) => (
                              <FormItem>
                                <Label htmlFor="tasks">{t('Tasks')}</Label>
                                <div className="relative">
                                  <Input
                                    {...field}
                                    type="number"
                                    id="tasks"
                                    placeholder={t('Tasks')}
                                    className="rounded-sm pr-16"
                                  />
                                  {!field.disabled && (
                                    <Button
                                      variant="link"
                                      type="button"
                                      tabIndex={-1}
                                      className="absolute right-1 top-1/2 -translate-y-1/2 text-xs px-2 py-1 h-7"
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
                                <Label htmlFor="aiCredits">
                                  {t('AI Credits')}
                                </Label>
                                <div className="relative">
                                  <Input
                                    {...field}
                                    type="number"
                                    id="aiCredits"
                                    placeholder={t('AI Credits')}
                                    className="rounded-sm pr-16"
                                  />
                                  {!field.disabled && (
                                    <Button
                                      variant="link"
                                      type="button"
                                      tabIndex={-1}
                                      className="absolute right-1 top-1/2 -translate-y-1/2 text-xs px-2 py-1 h-7"
                                      onClick={() =>
                                        form.setValue('aiCredits', '')
                                      }
                                    >
                                      {t('Clear')}
                                    </Button>
                                  )}
                                </div>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </>
                      )}

                      {platform.plan.embeddingEnabled &&
                        platformRole === PlatformRole.ADMIN && (
                          <FormField
                            name="externalId"
                            render={({ field }) => (
                              <FormItem>
                                <Label htmlFor="externalId">
                                  {t('External ID')}
                                </Label>
                                <FormDescription>
                                  {t(
                                    'Used to identify the project based on your SaaS ID',
                                  )}
                                </FormDescription>
                                <Input
                                  {...field}
                                  id="externalId"
                                  placeholder={t('org-3412321')}
                                  className="rounded-sm"
                                />
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        )}

                      <div className="pt-4">
                        <Button
                          disabled={projectMutation.isPending}
                          onClick={form.handleSubmit((values) =>
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
          </div>
        );

      case 'team':
        return (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  {t('Project Members')}
                </CardTitle>
                <CardDescription>
                  {t('Invite your team members to collaborate.')}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex min-h-[35px] flex-col gap-4">
                  {projectMembersIsPending && (
                    <div className="flex justify-center">
                      <LoadingSpinner />
                    </div>
                  )}
                  {projectMembers && projectMembers.length === 0 && (
                    <div className="text-center text-muted-foreground">
                      {t('No members are added to this project.')}
                    </div>
                  )}
                  {Array.isArray(projectMembers) &&
                    projectMembers.map((member: ProjectMemberWithUser) => (
                      <div key={member.id} className="flex items-center">
                        <ProjectMemberCard
                          member={member}
                          onUpdate={refetchProjectMembers}
                        />
                      </div>
                    ))}
                </div>

                <Separator />

                <div>
                  <h4 className="text-lg font-medium mb-4">
                    {t('Pending Invitations')}
                  </h4>
                  <div className="flex min-h-[35px] flex-col gap-4">
                    {invitationsIsPending && (
                      <div className="flex justify-center">
                        <LoadingSpinner />
                      </div>
                    )}
                    {invitations && invitations.length === 0 && (
                      <div className="text-center text-muted-foreground">
                        {t('No pending invitation.')}
                      </div>
                    )}
                    {Array.isArray(invitations) &&
                      invitations.map((invitation) => (
                        <InvitationCard
                          key={invitation.id}
                          invitation={invitation}
                        />
                      ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        );

      case 'alerts':
        return (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bell className="w-5 h-5" />
                  {t('Alert Frequency')}
                </CardTitle>
                <CardDescription>
                  {t('Choose what you want to be notified about.')}
                </CardDescription>
                {writeAlertPermission === false && (
                  <p className="text-sm">
                    <span className="text-destructive">*</span>{' '}
                    {t(
                      'Project and alert permissions are required to change this setting.',
                    )}
                  </p>
                )}
              </CardHeader>
              <CardContent className="space-y-3">
                <AlertOption
                  title={t('Every Failed Run')}
                  description={t('Get an email alert when a flow fails.')}
                  onClick={() => onChangeStatus(NotificationStatus.ALWAYS)}
                  icon={<BellIcon className="size-5" />}
                  isActive={project?.notifyStatus === NotificationStatus.ALWAYS}
                  disabled={writeAlertPermission === false}
                />
                <AlertOption
                  title={t('First Seen')}
                  description={t(
                    'Get an email alert when a new issue created.',
                  )}
                  onClick={() => onChangeStatus(NotificationStatus.NEW_ISSUE)}
                  icon={<EyeOpenIcon className="size-5" />}
                  isActive={
                    project?.notifyStatus === NotificationStatus.NEW_ISSUE
                  }
                  disabled={writeAlertPermission === false}
                />
                <AlertOption
                  title={t('Never')}
                  description={t('Turn off email notifications.')}
                  onClick={() => onChangeStatus(NotificationStatus.NEVER)}
                  icon={<EyeNoneIcon className="size-5" />}
                  isActive={project?.notifyStatus === NotificationStatus.NEVER}
                  disabled={writeAlertPermission === false}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>{t('Alert Emails')}</CardTitle>
                <CardDescription>
                  {t('Add email addresses to receive alerts.')}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="min-h-[35px]">
                  {alertsLoading && (
                    <div className="flex items-center justify-center">
                      <LoadingSpinner />
                    </div>
                  )}
                  {alertsError && (
                    <div className="text-center text-destructive">
                      {t('Error, please try again.')}
                    </div>
                  )}
                  {alertsData && alertsData.length === 0 && (
                    <div className="text-center text-muted-foreground">
                      {t('No emails added yet.')}
                    </div>
                  )}
                  {Array.isArray(alertsData) &&
                    alertsData.map((alert: Alert) => (
                      <div
                        className="flex items-center justify-between py-2 border-b last:border-b-0"
                        key={alert.id}
                      >
                        <div className="flex items-center space-x-4">
                          <div>
                            <p className="text-sm font-medium leading-none">
                              {alert.receiver}
                            </p>
                          </div>
                        </div>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => deleteAlert(alert)}
                              disabled={writeAlertPermission === false}
                            >
                              <Trash className="size-4 text-destructive" />
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
                <AddAlertEmailDialog />
              </CardContent>
            </Card>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl w-full max-h-[90vh] h-[600px] overflow-hidden">
        <div className="flex h-full">
          <div className="w-48">
            <nav className="space-y-2">
              {tabs.map((tab) => (
                <Button
                  variant="ghost"
                  key={tab.id}
                  className={cn('w-full justify-start gap-2 text-left', {
                    'bg-primary/10': activeTab === tab.id,
                  })}
                  onClick={() => setActiveTab(tab.id)}
                >
                  {tab.icon}
                  {tab.label}
                </Button>
              ))}
            </nav>
          </div>

          <div className="flex-1 pl-8">{renderTabContent()}</div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
