import {
  InvitationStatus,
  PlatformRole,
  SeekPage,
  UserWithMetaInformation,
} from '@activepieces/shared';
import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';

import { platformUserApi } from '@/api/platform-user-api';
import { projectMembersHooks } from '@/features/members/hooks/project-members-hooks';
import { userInvitationsHooks } from '@/features/members/hooks/user-invitations-hooks';
import { platformUserKeys } from '@/features/platform-admin/hooks/platform-user-hooks';
import { userHooks } from '@/hooks/user-hooks';

import { EmailStatusType } from './types';

export type SuggestedUser = UserWithMetaInformation & {
  memberStatus: 'available' | 'has-access' | 'already-invited';
};

type UseUserSuggestionsParams = {
  inputValue: string;
  currentEmails: string[];
};

const isPlatformAdminOrOperator = (user: { platformRole: PlatformRole }) =>
  user.platformRole === PlatformRole.ADMIN ||
  user.platformRole === PlatformRole.OPERATOR;

const emailSetHas = (emails: string[] | undefined, email: string) =>
  emails?.some((e) => e.toLowerCase() === email) ?? false;

const matchesSearch = (user: UserWithMetaInformation, searchTerm: string) => {
  if (!searchTerm) return true;
  const term = searchTerm.toLowerCase();
  const fullName = `${user.firstName} ${user.lastName}`.toLowerCase();
  return user.email.toLowerCase().includes(term) || fullName.includes(term);
};

export function useUserSuggestions({
  inputValue,
  currentEmails,
}: UseUserSuggestionsParams) {
  const { data: currentUser } = userHooks.useCurrentUser();
  const isAdmin = currentUser ? isPlatformAdminOrOperator(currentUser) : false;
  const { data: platformUsersData } = useQuery<
    SeekPage<UserWithMetaInformation>
  >({
    queryKey: platformUserKeys.users,
    queryFn: () => platformUserApi.list({ limit: 2000 }),
    enabled: isAdmin,
  });
  const { projectMembers } = projectMembersHooks.useProjectMembers();
  const { invitations } = userInvitationsHooks.useInvitations();

  const currentUserEmail = currentUser?.email.toLowerCase();
  const searchTerm = inputValue.trim();

  const pendingInvitationEmails = useMemo(
    () =>
      new Set(
        invitations
          ?.filter((inv) => inv.status === InvitationStatus.PENDING)
          .map((inv) => inv.email.toLowerCase()) ?? [],
      ),
    [invitations],
  );

  const projectMemberEmails = useMemo(
    () => new Set(projectMembers?.map((m) => m.user.email.toLowerCase()) ?? []),
    [projectMembers],
  );

  const suggestedUsers = useMemo<SuggestedUser[]>(() => {
    if (!platformUsersData?.data) return [];

    const filtered = platformUsersData.data
      .filter((user) => {
        const email = user.email.toLowerCase();
        return (
          email !== currentUserEmail &&
          !isPlatformAdminOrOperator(user) &&
          !emailSetHas(currentEmails, email) &&
          matchesSearch(user, searchTerm)
        );
      })
      .map((user) => {
        const email = user.email.toLowerCase();
        let memberStatus: SuggestedUser['memberStatus'] = 'available';
        if (projectMemberEmails.has(email)) {
          memberStatus = 'has-access';
        } else if (pendingInvitationEmails.has(email)) {
          memberStatus = 'already-invited';
        }
        return { ...user, memberStatus };
      });

    // Sort: available users first, then disabled users at the end
    filtered.sort((a, b) => {
      const aDisabled = a.memberStatus !== 'available';
      const bDisabled = b.memberStatus !== 'available';
      return Number(aDisabled) - Number(bDisabled);
    });

    return filtered.slice(0, 10);
  }, [
    platformUsersData,
    projectMemberEmails,
    pendingInvitationEmails,
    currentEmails,
    searchTerm,
    currentUserEmail,
  ]);

  const emailStatus = useMemo<EmailStatusType | null>(() => {
    if (!searchTerm) return null;

    const email = searchTerm.toLowerCase();

    // Skip if already in current selection or shown in suggestions
    if (emailSetHas(currentEmails, email)) return null;
    if (suggestedUsers.some((u) => u.email.toLowerCase() === email))
      return null;

    const platformUser = platformUsersData?.data.find(
      (u) => u.email.toLowerCase() === email,
    );

    // User has access (current user or admin/operator)
    if (
      email === currentUserEmail ||
      (platformUser && isPlatformAdminOrOperator(platformUser))
    ) {
      return { email, type: 'has-access', user: platformUser };
    }

    // Already a project member
    if (projectMemberEmails.has(email)) {
      return { email, type: 'in-project', user: platformUser };
    }

    // Has pending invitation
    if (pendingInvitationEmails.has(email)) {
      return { email, type: 'already-invited', user: platformUser };
    }

    return { email, type: 'new-user', user: undefined };
  }, [
    searchTerm,
    currentEmails,
    suggestedUsers,
    projectMemberEmails,
    pendingInvitationEmails,
    platformUsersData,
    currentUserEmail,
  ]);

  const selectableItems = useMemo<string[]>(() => {
    const items: string[] = [];
    for (const user of suggestedUsers) {
      if (user.memberStatus === 'available') {
        items.push(user.email);
      }
    }
    if (
      emailStatus &&
      (emailStatus.type === 'new-user' ||
        emailStatus.type === 'already-invited')
    ) {
      items.push(emailStatus.email);
    }
    return items;
  }, [suggestedUsers, emailStatus]);

  const platformUserEmails = useMemo(
    () =>
      new Set(platformUsersData?.data.map((u) => u.email.toLowerCase()) ?? []),
    [platformUsersData],
  );

  return {
    suggestedUsers,
    emailStatus,
    hasSuggestions: suggestedUsers.length > 0 || emailStatus !== null,
    selectableItems,
    platformUserEmails,
  };
}
