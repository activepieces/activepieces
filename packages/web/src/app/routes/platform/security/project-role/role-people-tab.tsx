import { ProjectRole } from '@activepieces/core-utils';
import { ProjectMemberWithUser } from '@activepieces/shared';
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
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (isError) {
    return <DataFetchErrorState entity={t('people')} onRetry={refetch} />;
  }

  const members = data?.data ?? [];

  if (members.length === 0) {
    return (
      <div className="flex h-64 flex-col items-center justify-center gap-2 text-muted-foreground">
        <Users className="size-10" />
        <p className="text-sm font-medium">{t('No users found')}</p>
        <p className="text-xs">{t('Start by assigning users to this role')}</p>
      </div>
    );
  }

  const projectCount = new Set(members.map((member) => member.project.id)).size;

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-baseline justify-between gap-4">
        <p className="text-sm text-muted-foreground">
          {t('hasThisRoleInProjects', { count: projectCount })}
        </p>
        <p className="text-sm text-muted-foreground">
          {t('rolePeopleCount', { count: members.length })}
        </p>
      </div>
      <div className="flex flex-col">
        <div className="flex items-center gap-4 border-b pb-1 text-xss font-medium uppercase tracking-wider text-muted-foreground">
          <span className="flex-1">{t('Name')}</span>
          <span className="w-56 shrink-0">{t('Email')}</span>
          <span className="w-44 shrink-0">{t('Project')}</span>
        </div>
        <ScrollArea className="max-h-72">
          {members.map((member) => (
            <PersonRow key={member.id} member={member} />
          ))}
        </ScrollArea>
      </div>
      <p className="text-xs text-muted-foreground">
        {t(
          "A role is set per project, so the same person can have a different role elsewhere. To change someone's role, open that project.",
        )}
      </p>
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
        <span className="truncate text-sm">{fullName}</span>
      </span>
      <span className="w-56 shrink-0 truncate text-sm text-muted-foreground">
        {member.user.email}
      </span>
      <Link
        to={`/projects/${member.project.id}/settings/team`}
        className="flex w-44 shrink-0 items-center gap-1 text-sm text-primary hover:underline underline-offset-4"
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
