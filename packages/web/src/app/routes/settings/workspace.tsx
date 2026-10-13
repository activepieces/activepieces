import { Permission } from '@activepieces/core-utils';
import { ApFlagId, PlatformRole, ProjectType } from '@activepieces/shared';
import { t } from 'i18next';
import { Bell, GitBranch, Puzzle, Users } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { AlertsSettings } from '@/app/components/project-settings/alerts';
import { EnvironmentSettings } from '@/app/components/project-settings/environment';
import { MembersSettings } from '@/app/components/project-settings/members';
import { PiecesSettings } from '@/app/components/project-settings/pieces';
import { projectCollectionUtils } from '@/features/projects';
import { useAuthorization } from '@/hooks/authorization-hooks';
import { flagsHooks } from '@/hooks/flags-hooks';
import { platformHooks } from '@/hooks/platform-hooks';
import { userHooks } from '@/hooks/user-hooks';
import { authenticationSession } from '@/lib/authentication-session';
import { cn } from '@/lib/utils';

type TabId = 'members' | 'alerts' | 'pieces' | 'environment';

const TABS: {
  id: TabId;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}[] = [
  { id: 'members', label: 'Members', icon: Users },
  { id: 'alerts', label: 'Alert Emails', icon: Bell },
  { id: 'pieces', label: 'Integrations', icon: Puzzle },
  { id: 'environment', label: 'Environment', icon: GitBranch },
];

export function WorkspaceSettingsPage() {
  const params = useParams<{ section?: string }>();
  const navigate = useNavigate();
  const { checkAccess } = useAuthorization();
  const { project } = projectCollectionUtils.useCurrentProject();
  const { data: showAlerts } = flagsHooks.useFlag(ApFlagId.SHOW_ALERTS);
  const { data: showProjectMembers } = flagsHooks.useFlag(
    ApFlagId.SHOW_PROJECT_MEMBERS,
  );
  const { platform } = platformHooks.useCurrentPlatform();
  const platformRole = userHooks.getCurrentUserPlatformRole();

  const active: TabId = useMemo(() => {
    const id = (params.section ?? '') as TabId;
    return TABS.some((x) => x.id === id) ? id : (TABS[0]?.id ?? 'members');
  }, [params.section]);

  const projectId = authenticationSession.getProjectId();
  const base = projectId
    ? `/projects/${projectId}/settings/workspace`
    : '/settings/workspace';

  const form = useForm<FormValues>({
    defaultValues: projectSettingsFormDefaults(project),
    disabled: checkAccess(Permission.WRITE_PROJECT) === false,
  });

  useEffect(() => {
    form.reset(projectSettingsFormDefaults(project));
  }, [project.id]);

  const visibleTabs = TABS.filter((tab) => {
    if (tab.id === 'members')
      return (
        project.type === ProjectType.TEAM &&
        checkAccess(Permission.READ_PROJECT_MEMBER) &&
        !!showProjectMembers
      );
    if (tab.id === 'alerts')
      return checkAccess(Permission.READ_ALERT) && !!showAlerts;
    if (tab.id === 'environment')
      return checkAccess(Permission.READ_PROJECT_RELEASE);
    return true;
  });

  const handleSave = async (values: FormValues) => {
    const activeFlowsLimitChanged =
      (values.activeFlowsLimit ?? null) !==
      (project.plan?.activeFlowsLimit ?? null);
    const tx = projectCollectionUtils.update(project.id, {
      displayName: values.projectName,
      externalId: values.externalId,
      icon: values.icon,
      maxConcurrentJobs: values.maxConcurrentJobs,
      sensitive: values.sensitive,
      plan: activeFlowsLimitChanged
        ? {
            ...project.plan,
            activeFlowsLimit: values.activeFlowsLimit ?? null,
          }
        : undefined,
    });
    const { error } = await tryCatch(() => tx.isPersisted.promise);
    if (!isNil(error)) {
      toast.error(api.extractServerErrorMessage(error, INTERNAL_ERROR_MESSAGE));
      return;
    }
    toast.success(t('Your changes have been saved.'), { duration: 3000 });
    form.reset(values);
  };

  const currentIconColor = form.watch('icon')?.color ?? project.icon.color;
  const hasUnsavedChanges = active === 'general' && form.formState.isDirty;

  const renderContent = () => {
    switch (active) {
      case 'members':
        return <MembersSettings />;
      case 'alerts':
        return <AlertsSettings />;
      case 'pieces':
        return <PiecesSettings />;
      case 'environment':
        return <EnvironmentSettings />;
      default:
        return null;
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-3">
        <ProjectAvatar
          displayName={project.displayName}
          projectType={project.type}
          iconColor={currentIconColor}
          size="md"
          showBackground={true}
        />
        <div>
          <h2 className="text-lg font-semibold">
            {form.watch('projectName') ?? project.displayName}
          </h2>
          <p className="text-sm text-gray-11">
            {t('Workspace settings')}
          </p>
        </div>
      </div>

      <div className="flex flex-wrap gap-1 border-b">
        {visibleTabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = tab.id === active;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => navigate(`${base}/${tab.id}`)}
              className={cn(
                'flex items-center gap-2 border-b-2 -mb-px px-3 py-2 text-sm transition-colors',
                isActive
                  ? 'border-primary font-medium text-gray-12'
                  : 'border-transparent text-gray-11 hover:text-gray-12',
              )}
            >
              <Icon className="h-4 w-4" />
              {t(tab.label)}
            </button>
          );
        })}
      </div>

      <div className="min-w-0">{renderContent()}</div>

    </div>
  );
}
