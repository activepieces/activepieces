import { t } from 'i18next';
import { Mail } from 'lucide-react';
import { useMemo } from 'react';

import { Badge } from '@/components/ui/badge';
import {
  Command,
  CommandGroup,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverAnchor,
} from '@/components/ui/popover';
import { UserAvatar } from '@/components/ui/user-avatar';
import { projectMembersHooks } from '@/features/members/lib/project-members-hooks';
import { userInvitationsHooks } from '@/features/members/lib/user-invitations-hooks';
import { platformUserHooks } from '@/hooks/platform-user-hooks';
import { userHooks } from '@/hooks/user-hooks';
import { formatUtils } from '@/lib/utils';
import {
  InvitationStatus,
  PlatformRole,
  UserWithMetaInformation,
} from '@activepieces/shared';

type EmailStatusType =
  | {
      email: string;
      type: 'has-access';
      user: UserWithMetaInformation | undefined;
    }
  | {
      email: string;
      type: 'in-project';
      user: UserWithMetaInformation | undefined;
    }
  | {
      email: string;
      type: 'already-invited';
      user: UserWithMetaInformation | undefined;
    }
  | {
      email: string;
      type: 'external';
      user: undefined;
    };

type UserSuggestionsPopoverProps = {
  children: React.ReactNode;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  inputValue: string;
  currentEmails: string[];
  onSelectUser: (email: string) => void;
  isPlatformPage: boolean;
};

export function UserSuggestionsPopover({
  children,
  open,
  onOpenChange,
  inputValue,
  currentEmails,
  onSelectUser,
  isPlatformPage,
}: UserSuggestionsPopoverProps) {
  const { data: currentUser } = userHooks.useCurrentUser();
  const { data: platformUsersData } = platformUserHooks.useUsers();
  const { projectMembers } = projectMembersHooks.useProjectMembers();
  const { invitations } = userInvitationsHooks.useInvitations();

  const pendingInvitationEmails = useMemo(() => {
    return new Set(
      invitations
        ?.filter((inv) => inv.status === InvitationStatus.PENDING)
        .map((inv) => inv.email.toLowerCase()) || [],
    );
  }, [invitations]);

  const suggestedUsers = useMemo(() => {
    if (isPlatformPage || !platformUsersData?.data) {
      return [];
    }

    const projectMemberEmails = new Set(
      projectMembers?.map((member) => member.user.email.toLowerCase()) || [],
    );
    const currentUserEmail = currentUser?.email.toLowerCase();

    return platformUsersData.data
      .filter((user) => {
        const emailLower = user.email.toLowerCase();

        if (currentUserEmail && emailLower === currentUserEmail) {
          return false;
        }

        // Platform Admins and Operators already have access to all projects, don't suggest them
        const isPlatformAdminOrOperator =
          user.platformRole === PlatformRole.ADMIN ||
          user.platformRole === PlatformRole.OPERATOR;

        if (isPlatformAdminOrOperator) {
          return false;
        }

        if (projectMemberEmails.has(emailLower)) {
          return false;
        }

        if (currentEmails?.some((e) => e.toLowerCase() === emailLower)) {
          return false;
        }

        if (inputValue.trim()) {
          const searchTerm = inputValue.toLowerCase();
          const name = `${user.firstName.toLowerCase()} ${user.lastName.toLowerCase()}`;
          return emailLower.includes(searchTerm) || name.includes(searchTerm);
        }

        return true;
      })
      .slice(0, 10);
  }, [
    isPlatformPage,
    platformUsersData,
    projectMembers,
    currentEmails,
    inputValue,
    currentUser,
  ]);

  const emailStatus = useMemo<EmailStatusType | null>(() => {
    if (isPlatformPage || !inputValue.trim()) {
      return null;
    }

    const trimmedEmail = inputValue.trim().toLowerCase();

    if (!formatUtils.emailRegex.test(trimmedEmail)) {
      return null;
    }

    if (currentEmails?.some((e) => e.toLowerCase() === trimmedEmail)) {
      return null;
    }

    if (
      suggestedUsers.some((user) => user.email.toLowerCase() === trimmedEmail)
    ) {
      return null;
    }

    const platformUser = platformUsersData?.data.find(
      (user) => user.email.toLowerCase() === trimmedEmail,
    );

    const currentUserEmail = currentUser?.email.toLowerCase();
    const isCurrentUser = currentUserEmail && trimmedEmail === currentUserEmail;

    const isPlatformAdminOrOperator =
      platformUser?.platformRole === PlatformRole.ADMIN ||
      platformUser?.platformRole === PlatformRole.OPERATOR;

    if (isCurrentUser || isPlatformAdminOrOperator) {
      return {
        email: trimmedEmail,
        type: 'has-access' as const,
        user: platformUser,
      };
    }

    const isInProject = projectMembers?.some(
      (member) => member.user.email.toLowerCase() === trimmedEmail,
    );
    if (isInProject) {
      return {
        email: trimmedEmail,
        type: 'in-project' as const,
        user: platformUser,
      };
    }

    const pendingInvitation = invitations?.find(
      (inv) =>
        inv.email.toLowerCase() === trimmedEmail &&
        inv.status === InvitationStatus.PENDING,
    );
    if (pendingInvitation) {
      return {
        email: trimmedEmail,
        type: 'already-invited' as const,
        user: platformUser,
      };
    }

    return { email: trimmedEmail, type: 'external' as const, user: undefined };
  }, [
    isPlatformPage,
    inputValue,
    currentEmails,
    suggestedUsers,
    projectMembers,
    invitations,
    platformUsersData,
    currentUser,
  ]);

  const hasSuggestions = suggestedUsers.length > 0 || emailStatus !== null;

  return (
    <Popover open={open && hasSuggestions} onOpenChange={onOpenChange}>
      <PopoverAnchor asChild>{children}</PopoverAnchor>
      <PopoverContent
        className="w-[var(--radix-popover-trigger-width)] p-0 -mt-2"
        align="start"
        sideOffset={-8}
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        <Command>
          <CommandList>
            {suggestedUsers.length > 0 && (
              <CommandGroup heading={t('Suggested')}>
                {suggestedUsers.map((user: UserWithMetaInformation) => {
                  const isInvited = pendingInvitationEmails.has(
                    user.email.toLowerCase(),
                  );
                  return (
                    <CommandItem
                      key={user.id}
                      value={user.email}
                      onSelect={() => onSelectUser(user.email)}
                      className="cursor-pointer"
                    >
                      <div className="flex items-center gap-2 w-full">
                        <UserAvatar
                          name={`${user.firstName} ${user.lastName}`}
                          email={user.email}
                          size={32}
                          disableTooltip={true}
                          imageUrl={user.imageUrl}
                        />
                        <div className="flex flex-col flex-1 min-w-0">
                          <span className="text-sm font-medium truncate">
                            {user.firstName} {user.lastName}
                          </span>
                          <span className="text-xs text-muted-foreground truncate">
                            {user.email}
                          </span>
                        </div>
                        {isInvited ? (
                          <Badge
                            variant="ghost"
                            className="ml-auto shrink-0 text-xs text-muted-foreground bg-muted-foreground/15 rounded-sm"
                          >
                            {t('Invited')}
                          </Badge>
                        ) : (
                          <Badge
                            variant="ghost"
                            className="ml-auto shrink-0 text-xs"
                          >
                            {formatUtils.convertEnumToHumanReadable(
                              user.platformRole,
                            )}
                          </Badge>
                        )}
                      </div>
                    </CommandItem>
                  );
                })}
              </CommandGroup>
            )}

            {emailStatus && (
              <>
                {suggestedUsers.length > 0 && <CommandSeparator />}
                {emailStatus.type === 'external' && (
                  <CommandGroup heading={t('External Email')}>
                    <CommandItem
                      value={emailStatus.email}
                      onSelect={() => onSelectUser(emailStatus.email)}
                      className="cursor-pointer"
                    >
                      <div className="flex items-center gap-2 w-full">
                        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-muted">
                          <Mail className="w-4 h-4 text-muted-foreground" />
                        </div>
                        <div className="flex flex-col flex-1 min-w-0">
                          <span className="text-sm font-medium truncate">
                            {emailStatus.email}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {t('Invite external user')}
                          </span>
                        </div>
                      </div>
                    </CommandItem>
                  </CommandGroup>
                )}

                {emailStatus.type === 'has-access' && (
                  <CommandGroup>
                    <CommandItem disabled className="opacity-60">
                      <div className="flex items-center gap-2 w-full">
                        {emailStatus.user ? (
                          <UserAvatar
                            name={`${emailStatus.user.firstName} ${emailStatus.user.lastName}`}
                            email={emailStatus.user.email}
                            size={32}
                            disableTooltip={true}
                            imageUrl={emailStatus.user.imageUrl}
                          />
                        ) : (
                          <div className="flex items-center justify-center w-8 h-8 rounded-full bg-muted">
                            <Mail className="w-4 h-4 text-muted-foreground" />
                          </div>
                        )}
                        <div className="flex flex-col flex-1 min-w-0">
                          <span className="text-sm font-medium truncate">
                            {emailStatus.user
                              ? `${emailStatus.user.firstName} ${emailStatus.user.lastName}`
                              : emailStatus.email}
                          </span>
                          {emailStatus.user && (
                            <span className="text-xs text-muted-foreground truncate">
                              {emailStatus.user.email}
                            </span>
                          )}
                        </div>
                        <Badge
                          variant="ghost"
                          className="ml-auto shrink-0 text-xs text-blue-600 dark:text-blue-500 bg-blue-600/15 dark:bg-blue-500/15 rounded-sm"
                        >
                          {t('Has Access')}
                        </Badge>
                      </div>
                    </CommandItem>
                  </CommandGroup>
                )}

                {emailStatus.type === 'in-project' && (
                  <CommandGroup>
                    <CommandItem disabled className="opacity-60">
                      <div className="flex items-center gap-2 w-full">
                        {emailStatus.user ? (
                          <UserAvatar
                            name={`${emailStatus.user.firstName} ${emailStatus.user.lastName}`}
                            email={emailStatus.user.email}
                            size={32}
                            disableTooltip={true}
                            imageUrl={emailStatus.user.imageUrl}
                          />
                        ) : (
                          <div className="flex items-center justify-center w-8 h-8 rounded-full bg-muted">
                            <Mail className="w-4 h-4 text-muted-foreground" />
                          </div>
                        )}
                        <div className="flex flex-col flex-1 min-w-0">
                          <span className="text-sm font-medium truncate">
                            {emailStatus.user
                              ? `${emailStatus.user.firstName} ${emailStatus.user.lastName}`
                              : emailStatus.email}
                          </span>
                          {emailStatus.user && (
                            <span className="text-xs text-muted-foreground truncate">
                              {emailStatus.user.email}
                            </span>
                          )}
                        </div>
                        <Badge
                          variant="ghost"
                          className="ml-auto shrink-0 text-xs text-amber-600 dark:text-amber-500 bg-amber-600/15 dark:bg-amber-500/15 rounded-sm"
                        >
                          {t('Member')}
                        </Badge>
                      </div>
                    </CommandItem>
                  </CommandGroup>
                )}

                {emailStatus.type === 'already-invited' && (
                  <CommandGroup>
                    <CommandItem
                      value={emailStatus.email}
                      onSelect={() => onSelectUser(emailStatus.email)}
                      className="cursor-pointer"
                    >
                      <div className="flex items-center gap-2 w-full">
                        {emailStatus.user ? (
                          <UserAvatar
                            name={`${emailStatus.user.firstName} ${emailStatus.user.lastName}`}
                            email={emailStatus.user.email}
                            size={32}
                            disableTooltip={true}
                            imageUrl={emailStatus.user.imageUrl}
                          />
                        ) : (
                          <div className="flex items-center justify-center w-8 h-8 rounded-full bg-muted">
                            <Mail className="w-4 h-4 text-muted-foreground" />
                          </div>
                        )}
                        <div className="flex flex-col flex-1 min-w-0">
                          <span className="text-sm font-medium truncate">
                            {emailStatus.user
                              ? `${emailStatus.user.firstName} ${emailStatus.user.lastName}`
                              : emailStatus.email}
                          </span>
                          {emailStatus.user && (
                            <span className="text-xs text-muted-foreground truncate">
                              {emailStatus.user.email}
                            </span>
                          )}
                        </div>
                        <Badge
                          variant="ghost"
                          className="ml-auto shrink-0 text-xs text-muted-foreground bg-muted-foreground/15 rounded-sm"
                        >
                          {t('Invited')}
                        </Badge>
                      </div>
                    </CommandItem>
                  </CommandGroup>
                )}
              </>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
