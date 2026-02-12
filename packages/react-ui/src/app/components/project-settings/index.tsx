import { t } from 'i18next';
import { Bell, GitBranch, Puzzle, Settings, Users } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';

import { McpSvg } from '@/assets/img/custom/mcp';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { LoadingSpinner } from '@/components/ui/spinner';
import { useAuthorization } from '@/hooks/authorization-hooks';
import { flagsHooks } from '@/hooks/flags-hooks';
import { platformHooks } from '@/hooks/platform-hooks';
import { projectHooks } from '@/hooks/project-hooks';
import { userHooks } from '@/hooks/user-hooks';
import { cn } from '@/lib/utils';
import {
  ApFlagId,
  isNil,
  Permission,
  PlatformRole,
  ProjectType,
} from '@activepieces/shared';

import { ApProjectDisplay } from '../ap-project-display';
import { ProjectAvatar } from '../project-avatar';

import { AlertsSettings } from './alerts';
import { EnvironmentSettings } from './environment';
import { GeneralSettings, FormValues } from './general';
import { useGeneralSettingsMutation } from './general/hook';
import { McpServerSettings } from './mcp-server';
import { MembersSettings } from './members';
import { PiecesSettings } from './pieces';

type TabId =
  | 'general'
  | 'members'
  | 'alerts'
  | 'pieces'
  | 'environment'
  | 'mcp';

interface ProjectSettingsDialogProps {
  open: boolean;
  onClose: () => void;
  initialTab?: TabId;
  initialValues?: {
    projectName?: string;
    externalId?: string;
  };
}

export function ProjectSettingsDialog({
  open,
  onClose,
  initialTab = 'general',
  initialValues,
}: ProjectSettingsDialogProps) {
  const [activeTab, setActiveTab] = useState<TabId>(initialTab);
  const { checkAccess } = useAuthorization();
  const { project } = projectHooks.useCurrentProject();
  const previousOpenRef = useRef(open);

  const { data: showAlerts } = flagsHooks.useFlag(ApFlagId.SHOW_ALERTS);
  const { data: showProjectMembers } = flagsHooks.useFlag(
    ApFlagId.SHOW_PROJECT_MEMBERS,
  );
  const { platform } = platformHooks.useCurrentPlatform();
  const platformRole = userHooks.getCurrentUserPlatformRole();

  const form = useForm<FormValues>({
    defaultValues: {
      projectName: initialValues?.projectName,
      icon: project.icon,
      externalId: initialValues?.externalId,
    },
    disabled: checkAccess(Permission.WRITE_PROJECT) === false,
  });

  const projectMutation = useGeneralSettingsMutation(project.id, form);

  const handleSave = (values: FormValues) => {
    projectMutation.mutate({
      displayName: values.projectName,
      icon: values.icon,
      externalId: values.externalId,
    }, {
      onSuccess: () => {
        // Close dialog first
        onClose();
        // Then refresh page after short delay
        setTimeout(() => {
          window.location.reload();
        }, 300);
      }
    });
  };

  useEffect(() => {
    const dialogJustOpened = open && !previousOpenRef.current;
    if (dialogJustOpened && !isNil(project)) {
      form.reset({
        ...initialValues,
        icon: project.icon,
      });
      setActiveTab(initialTab);
    }
    previousOpenRef.current = open;
  }, [open, project]);

  const hasGeneralSettings =
    project.type === ProjectType.TEAM ||
    (platform.plan.embeddingEnabled && platformRole === PlatformRole.ADMIN);

  const tabs = [
    {
      id: 'general' as TabId,
      label: t('General'),
      icon: <Settings className="w-4 h-4" />,
      disabled: !hasGeneralSettings,
    },
    {
      id: 'members' as TabId,
      label: t('Members'),
      icon: <Users className="w-4 h-4" />,
      disabled:
        project.type !== ProjectType.TEAM ||
        !checkAccess(Permission.READ_PROJECT_MEMBER) ||
        !showProjectMembers,
    },
    {
      id: 'alerts' as TabId,
      label: t('Alerts'),
      icon: <Bell className="w-4 h-4" />,
      disabled:
        project.type !== ProjectType.TEAM ||
        !checkAccess(Permission.READ_ALERT) ||
        !showAlerts,
    },
    {
      id: 'pieces' as TabId,
      label: t('Pieces'),
      icon: <Puzzle className="w-4 h-4" />,
      disabled: false,
    },
    {
      id: 'environment' as TabId,
      label: t('Environment'),
      icon: <GitBranch className="w-4 h-4" />,
      disabled: true || !checkAccess(Permission.READ_PROJECT_RELEASE),
    },
    {
      id: 'mcp' as TabId,
      label: t('MCP Server'),
      icon: <McpSvg className="w-4 h-4" />,
      disabled: false,
    },
  ].filter((tab) => !tab.disabled);

  const renderTabContent = () => {
    switch (activeTab) {
      case 'general':
        return (
          <GeneralSettings form={form} isSaving={projectMutation.isPending} />
        );
      case 'members':
        return <MembersSettings />;
      case 'alerts':
        return null;
      case 'pieces':
        return <PiecesSettings />;
      case 'environment':
        return <EnvironmentSettings />;
      case 'mcp':
        return <McpServerSettings />;
      default:
        return null;
    }
  };

  const renderTabHeader = () => {
    return (
      <span className="text-lg font-bold">
        {tabs.find((tab) => tab.id === activeTab)?.label}
      </span>
    );
  };
  
  const renderDialogFooter = () => {
    if (activeTab !== 'general') return null;

    return (
      <div className="border-t bg-background rounded-br-md">
        <div className="flex items-center justify-end gap-3 px-6 py-4">
          <Button
            variant="outline"
            size="sm"
            onClick={onClose}
            disabled={projectMutation.isPending}
          >
            {t('Close')}
          </Button>
          <Button
            disabled={projectMutation.isPending}
            size="sm"
            onClick={form.handleSubmit(handleSave)}
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
    );
  };

  // Get current icon color from form state for real-time preview
  const currentIconColor = form.watch('icon.color') || project.icon.color;
  const currentProjectName = form.watch('projectName') || project.displayName;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl w-full max-h-[95vh] rounded-sm flex flex-col p-0">
        <div className="flex h-[700px]">
          <div className="w-[238px]">
            <nav className="bg-sidebar space-y-1 bg-muted rounded-sm rounded-r-none h-full flex flex-col rounded-l-md">
              <ApProjectDisplay
                title={currentProjectName}
                icon={form.watch('icon') || project.icon}
                containerClassName="px-3 my-4"
                titleClassName="text-md font-bold"
                maxLengthToNotShowTooltip={18}
                projectType={project.type}
              />
              <div className="flex flex-col px-2 gap-1">
                {tabs.map((tab) => (
                  <div
                    key={tab.id}
                    className={cn(
                      'flex items-center gap-2 rounded-sm px-2 py-1.5 text-sm font-medium transition-all cursor-pointer hover:bg-sidebar-accent',
                      {
                        'bg-sidebar-accent': activeTab === tab.id,
                      },
                    )}
                    onClick={() => setActiveTab(tab.id)}
                  >
                    {tab.icon}
                    {tab.label}
                  </div>
                ))}
              </div>
            </nav>
          </div>
          <div className="flex-1 min-w-0 flex flex-col">
            <div className="flex-1 min-h-0 overflow-hidden">
              <ScrollArea className="h-full">
                {activeTab === 'general' && (
                  <ProjectAvatar
                    displayName={currentProjectName}
                    projectType={project.type}
                    iconColor={currentIconColor}
                    size="md"
                    showBackground={true}
                  />
                )}
                <div className="flex flex-col gap-3 px-10 pt-4">
                  {renderTabHeader()}
                  {renderTabContent()}
                </div>
              </ScrollArea>
            </div>
            {renderDialogFooter()}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}