import { ProjectRole, SeekPage } from '@activepieces/core-utils';
import { isNil } from '@activepieces/shared';
import { t } from 'i18next';
import { useState } from 'react';

import { AnimatedIconButton } from '@/components/custom/animated-icon-button';
import { PageSection } from '@/components/custom/page';
import { PlusIcon } from '@/components/icons/plus';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { platformHooks } from '@/hooks/platform-hooks';

import { PlatformRolesList } from './platform-roles-list';
import { ProjectRoleDialog } from './project-role-dialog';
import { ProjectRolesList } from './project-roles-list';

const PLATFORM_ROLE_COUNT = 3;

export function NewRoleButton({ refetch }: { refetch: () => void }) {
  const { platform } = platformHooks.useCurrentPlatform();

  if (!platform.plan.customRolesEnabled) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <span>
            <AnimatedIconButton icon={PlusIcon} iconSize={20} disabled>
              {t('New role')}
            </AnimatedIconButton>
          </span>
        </TooltipTrigger>
        <TooltipContent side="bottom">
          {t('Contact sales to unlock custom roles')}
        </TooltipContent>
      </Tooltip>
    );
  }

  return (
    <ProjectRoleDialog mode="create" onSave={() => refetch()}>
      <AnimatedIconButton icon={PlusIcon} iconSize={20}>
        {t('New role')}
      </AnimatedIconButton>
    </ProjectRoleDialog>
  );
}

export function RolesCard({
  projectRoles,
  isLoading,
  isError,
  refetch,
}: RolesCardProps) {
  const [activeTab, setActiveTab] = useState<RolesTab>('project');

  const projectRolesCount =
    isLoading || isError ? null : projectRoles?.data.length ?? 0;

  return (
    <PageSection
      title={t('Roles')}
      description={t(
        'Two kinds. A platform role is one per person and decides console access and which projects they see. A project role is chosen per project and decides what they can do inside it.',
      )}
    >
      <Tabs
        value={activeTab}
        onValueChange={(value) => setActiveTab(toRolesTab(value))}
      >
        <TabsList>
          <TabsTrigger value="project">
            {t('Project roles')}
            {!isNil(projectRolesCount) && (
              <span className="tabular-nums text-gray-11">
                {projectRolesCount}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="platform">
            {t('Platform roles')}
            <span className="tabular-nums text-gray-11">
              {PLATFORM_ROLE_COUNT}
            </span>
          </TabsTrigger>
        </TabsList>
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
    </PageSection>
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
