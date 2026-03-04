import { ProjectMemberWithUser, ProjectRole } from '@activepieces/shared';
import { useQuery } from '@tanstack/react-query';
import { t } from 'i18next';
import { Loader2, Users } from 'lucide-react';
import { Link } from 'react-router-dom';

import {
  Item,
  ItemContent,
  ItemDescription,
  ItemTitle,
} from '@/components/custom/item';
import { UserAvatar } from '@/components/custom/user-avatar';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { VirtualizedScrollArea } from '@/components/ui/virtualized-scroll-area';
import { projectRoleApi } from '@/features/platform-admin';

export const ProjectRoleUsersSheet = ({
  projectRole,
  isOpen,
  onOpenChange,
}: ProjectRoleUsersSheetProps) => {
  const { data, isLoading } = useQuery({
    queryKey: ['users-with-project-roles', projectRole?.id],
    queryFn: () => {
      return projectRoleApi.listProjectMembers(projectRole!.id, {
        cursor: undefined,
        limit: 10,
      });
    },
    enabled: isOpen && projectRole !== null,
  });

  const users = data?.data ?? [];

  return (
    <Sheet open={isOpen} onOpenChange={onOpenChange}>
      <SheetContent className="w-[600px] sm:max-w-[600px] flex flex-col p-0">
        <SheetHeader className="px-6 py-4 border-b shrink-0">
          <SheetTitle className="text-base">
            {projectRole?.name} {t('Role')} {t('Users')}
          </SheetTitle>
          <SheetDescription>
            {t('View the users assigned to this role')}
          </SheetDescription>
        </SheetHeader>
        <div className="flex-1 overflow-hidden">
          {isLoading ? (
            <div className="flex items-center justify-center h-full">
              <Loader2 className="size-8 animate-spin text-muted-foreground" />
            </div>
          ) : users.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full gap-2 text-muted-foreground">
              <Users className="size-14" />
              <p className="text-sm font-medium">{t('No users found')}</p>
              <p className="text-xs">
                {t('Start by assigning users to this role')}
              </p>
            </div>
          ) : (
            <VirtualizedScrollArea
              items={users}
              estimateSize={() => 64}
              getItemKey={(index) => users[index].id}
              renderItem={(member) => renderUserItem(member)}
            />
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
};

function renderUserItem(member: ProjectMemberWithUser) {
  const { user, project } = member;
  const fullName = `${user.firstName} ${user.lastName}`.trim();

  return (
    <Item size="sm">
      <UserAvatar
        name={fullName}
        email={user.email}
        imageUrl={user.imageUrl}
        size={36}
        disableTooltip
      />
      <ItemContent>
        <ItemTitle>{fullName}</ItemTitle>
        <ItemDescription>
          {user.email}
          {' · '}
          <Link to={`/projects/${project.id}/settings/team`}>
            {project.displayName}
          </Link>
        </ItemDescription>
      </ItemContent>
    </Item>
  );
}

type ProjectRoleUsersSheetProps = {
  projectRole: ProjectRole | null;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
};
