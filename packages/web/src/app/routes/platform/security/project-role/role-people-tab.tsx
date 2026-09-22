import { ProjectRole } from '@activepieces/core-utils';
import { isNil, ProjectMemberWithUser } from '@activepieces/shared';
import { t } from 'i18next';
import { ArrowUpRight, Loader2, Users } from 'lucide-react';
import { Link } from 'react-router-dom';

import { DataFetchErrorState } from '@/components/custom/data-fetch-error-state';
import { UserAvatar } from '@/components/custom/user-avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { projectRoleQueries } from '@/features/platform-admin';

export function RolePeopleTab({ projectRole }: RolePeopleTabProps) {
  const { data, isLoading, isError, refetch } =
    projectRoleQueries.useProjectRoleMembers(projectRole.id, true);

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex h-full items-center justify-center px-6">
        <DataFetchErrorState entity={t('people')} onRetry={refetch} />
      </div>
    );
  }

  const members = data?.data ?? [];

  if (members.length === 0) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-2 px-6 text-muted-foreground">
        <Users className="size-10" />
        <p className="text-sm font-medium">{t('No users found')}</p>
        <p className="text-xs">{t('Start by assigning users to this role')}</p>
      </div>
    );
  }

  const isComplete = isNil(data?.next);
  const projectCount = new Set(members.map((member) => member.project.id)).size;
  const peopleCount = projectRole.userCount ?? members.length;

  return (
    <div className="flex h-full flex-col">
      <div className="flex shrink-0 flex-wrap items-baseline justify-between gap-x-4 gap-y-1 px-6 pt-4 pb-3">
        <p className="text-sm text-muted-foreground">
          {isComplete
            ? t('hasThisRoleInProjects', { count: projectCount })
            : t('showingFirstPeople', { count: members.length })}
        </p>
        <p className="text-sm tabular-nums text-muted-foreground">
          {t('rolePeopleCount', { count: peopleCount })}
        </p>
      </div>
      <div className="flex shrink-0 items-center gap-4 border-b px-6 pb-2 text-xss font-medium uppercase tracking-wider text-muted-foreground">
        <span className="flex-1">{t('Name')}</span>
        <span className="hidden w-56 shrink-0 sm:block">{t('Email')}</span>
        <span className="w-32 shrink-0 sm:w-44">{t('Project')}</span>
      </div>
      <ScrollArea className="min-h-0 flex-1">
        <div className="px-6">
          {members.map((member) => (
            <PersonRow key={member.id} member={member} />
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}

function PersonRow({ member }: { member: ProjectMemberWithUser }) {
  const fullName = `${member.user.firstName} ${member.user.lastName}`.trim();
  return (
    <div className="flex items-center gap-4 border-b border-border/60 py-2 last:border-b-0">
      <span className="flex min-w-0 flex-1 items-center gap-2">
        <UserAvatar
          name={fullName}
          email={member.user.email}
          imageUrl={member.user.imageUrl}
          size={24}
          disableTooltip
        />
        <span className="min-w-0 truncate text-sm">{fullName}</span>
      </span>
      <span className="hidden w-56 shrink-0 truncate text-sm text-muted-foreground sm:block">
        {member.user.email}
      </span>
      <Link
        to={`/projects/${member.project.id}/settings/team`}
        className="flex w-32 shrink-0 items-center gap-1 text-sm text-primary underline-offset-4 hover:underline sm:w-44"
      >
        <span className="truncate">{member.project.displayName}</span>
        <ArrowUpRight className="size-3.5 shrink-0" />
      </Link>
    </div>
  );
}

type RolePeopleTabProps = {
  projectRole: ProjectRole;
};
