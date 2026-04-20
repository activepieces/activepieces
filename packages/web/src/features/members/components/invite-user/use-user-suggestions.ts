import {
  InvitationStatus,
  PlatformRole,
  UserWithMetaInformation,
} from '@activepieces/shared';
import { useMemo } from 'react';

import { projectMembersHooks } from '@/features/members/hooks/project-members-hooks';
import { userInvitationsHooks } from '@/features/members/hooks/user-invitations-hooks';
import { platformUserHooks } from '@/features/platform-admin/hooks/platform-user-hooks';
import { platformHooks } from '@/hooks/platform-hooks';
import { userHooks } from '@/hooks/user-hooks';

import { EmailStatusType } from './types';

export type SuggestedUser = UserWithMetaInformation & {
  memberStatus: 'available' | 'has-access' | 'already-invited';
};

type UseUserSuggestionsParams = {
  inputValue: string;
  currentEmails: string[];
  isPlatformPage: boolean;
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
  isPlatformPage,
}: UseUserSuggestionsParams) {
  const { data: currentUser } = userHooks.useCurrentUser();
  const { data: platformUsersData } = platformUserHooks.useUsers();
  const { projectMembers } = projectMembersHooks.useProjectMembers();
  const { invitations } = userInvitationsHooks.useInvitations();
  const { platform } = platformHooks.useCurrentPlatform();
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
    if (
      isPlatformPage ||
      !platformUsersData?.data ||
      platform.plan.embeddingEnabled
    )
      return [];

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
    isPlatformPage,
    platformUsersData,
    projectMemberEmails,
    pendingInvitationEmails,
    currentEmails,
    searchTerm,
    currentUserEmail,
    platform.plan.embeddingEnabled,
  ]);

  const emailStatus = useMemo<EmailStatusType | null>(() => {
    if (isPlatformPage || !platformUsersData?.data || !searchTerm) return null;

    const email = searchTerm.toLowerCase();

    // Skip if already in current selection or shown in suggestions
    if (emailSetHas(currentEmails, email)) return null;
    if (suggestedUsers.some((u) => u.email.toLowerCase() === email))
      return null;

    const platformUser = platformUsersData?.data.find(
      (u) => u.email.toLowerCase() === email,
    );

    const isCurrentUser = email === currentUserEmail;
    const isPlatformAdminOrOperator =
      platformUser &&
      (platformUser.platformRole === PlatformRole.ADMIN ||
        platformUser.platformRole === PlatformRole.OPERATOR);
    const isPlatformUser = isPlatformPage && platformUser;
    if (isCurrentUser || isPlatformAdminOrOperator || isPlatformUser) {
      return { email, type: 'has-access', user: platformUser };
    }

    if (!isPlatformPage && projectMemberEmails.has(email)) {
      return { email, type: 'in-project', user: platformUser };
    }

    if (pendingInvitationEmails.has(email)) {
      return { email, type: 'already-invited', user: platformUser };
    }

    return { email, type: 'new-user', user: undefined };
  }, [
    isPlatformPage,
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
