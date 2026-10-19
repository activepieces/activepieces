import { ProjectRole, SeekPage } from '@activepieces/core-utils';
import { isNil } from '@activepieces/shared';
import { t } from 'i18next';
import { useState } from 'react';

import { AnimatedIconButton } from '@/components/custom/animated-icon-button';
import { PlusIcon } from '@/components/icons/plus';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { platformHooks } from '@/hooks/platform-hooks';
import { AdminControl, adminControl } from '@/lib/admin-control';

import { PlatformRolesList } from './platform-roles-list';
import { ProjectRoleDialog } from './project-role-dialog';
import { ProjectRolesList } from './project-roles-list';

const PLATFORM_ROLE_COUNT = 3;

export function RolesCard({
  projectRoles,
  isLoading,
  isError,
  refetch,
}: RolesCardProps) {
  const { platform } = platformHooks.useCurrentPlatform();
  const [activeTab, setActiveTab] = useState<RolesTab>('project');

  const projectRolesCount =
    isLoading || isError ? null : projectRoles?.data.length ?? 0;
  const platformRolesCount = PLATFORM_ROLE_COUNT;

  const newRoleButton = !platform.plan.customRolesEnabled ? (
    <Tooltip>
      <TooltipTrigger>
        <AnimatedIconButton icon={PlusIcon} iconSize={16} disabled>
          {t('New role')}
        </AnimatedIconButton>
      </TooltipTrigger>
      <TooltipContent side="bottom">
        {t('Contact sales to unlock custom roles')}
      </TooltipContent>
    </Tooltip>
  ) : (
    <ProjectRoleDialog mode="create" onSave={() => refetch()}>
      <AnimatedIconButton
        icon={PlusIcon}
        iconSize={16}
        {...adminControl(AdminControl.ROLES_NEW_OPEN)}
      >
        {t('New role')}
      </AnimatedIconButton>
    </ProjectRoleDialog>
  );

  return (
    <Tabs
      value={activeTab}
      onValueChange={(value) => setActiveTab(toRolesTab(value))}
    >
      <div className="flex flex-wrap items-center justify-between gap-4">
        <TabsList>
          <TabsTrigger value="project" className="gap-2">
            {t('Project roles')}
            {!isNil(projectRolesCount) && (
              <span className="text-gray-11">{projectRolesCount}</span>
            )}
          </TabsTrigger>
          <TabsTrigger value="platform" className="gap-2">
            {t('Platform roles')}
            <span className="text-gray-11">{platformRolesCount}</span>
          </TabsTrigger>
        </TabsList>
        {activeTab === 'project' && newRoleButton}
      </div>
      <TabsContent value="project">
        <ProjectRolesList
          projectRoles={projectRoles}
          isLoading={isLoading}
          isError={isError}
          refetch={refetch}
        />
      </TabsContent>
      <TabsContent value="platform">
        <PlatformRolesList />
      </TabsContent>
    </Tabs>
  );
}

function toRolesTab(value: string): RolesTab {
  return value === 'platform' ? 'platform' : 'project';
}

type RolesTab = 'project' | 'platform';

type RolesCardProps = {
  projectRoles: SeekPage<ProjectRole> | undefined;
  isLoading: boolean;
  isError: boolean;
  refetch: () => void;
};
