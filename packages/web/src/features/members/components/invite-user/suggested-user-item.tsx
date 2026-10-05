import { t } from 'i18next';

import { UserAvatar } from '@/components/custom/user-avatar';
import { Badge } from '@/components/ui/badge';
import { CommandItem } from '@/components/ui/command';
import { formatUtils } from '@/lib/format-utils';
import { cn } from '@/lib/utils';

import { EmailStatusType } from './types';
import { SuggestedUser } from './use-user-suggestions';

export function SuggestedUserItem(props: SuggestedUserItemProps) {
  if (props.type === 'platform-user') {
    return <PlatformUserItem {...props} />;
  }
  return <EmailStatusSuggestionItem {...props} />;
}

function PlatformUserItem({
  user,
  onSelect,
}: {
  user: SuggestedUser;
  onSelect: (email: string) => void;
}) {
  const isDisabled = user.memberStatus !== 'available';

  const getBadge = () => {
    if (user.memberStatus === 'has-access') {
      return {
        label: t('Has Access'),
        className: 'text-success-11 bg-success-3',
      };
    }
    if (user.memberStatus === 'already-invited') {
      return {
        label: t('Invited'),
        className: 'text-gray-11 bg-gray-3',
      };
    }
    return { label: formatUtils.convertEnumToHumanReadable(user.platformRole) };
  };

  const badge = getBadge();

  return (
    <CommandItem
      key={user.id}
      value={user.email}
      onSelect={() => !isDisabled && onSelect(user.email)}
      disabled={isDisabled}
      className={cn('cursor-pointer', isDisabled && 'opacity-60')}
    >
      <div className="flex w-full items-center gap-2">
        <UserAvatar
          name={`${user.firstName} ${user.lastName}`}
          email={user.email}
          size={32}
          disableTooltip={true}
          imageUrl={user.imageUrl}
        />
        <div className="flex min-w-0 flex-1 flex-col">
          <span className="truncate text-sm font-medium">
            {user.firstName} {user.lastName}
          </span>
          <span className="truncate text-xs text-gray-11">{user.email}</span>
        </div>
        <Badge
          variant="ghost"
          className={cn('ml-auto shrink-0', badge.className)}
        >
          {badge.label}
        </Badge>
      </div>
    </CommandItem>
  );
}

function EmailStatusSuggestionItem({
  emailStatus,
  onSelect,
  isPlatformInvite,
}: {
  emailStatus: EmailStatusType;
  onSelect: (email: string) => void;
  isPlatformInvite?: boolean;
}) {
  const getBadgeAndState = () => {
    switch (emailStatus.type) {
      case 'new-user':
        return {
          label: isPlatformInvite ? t('New User') : t('New Member'),
          className: 'text-accent-11 bg-accent-3 border-accent-7',
          disabled: false,
        };
      case 'has-access':
        return {
          label: t('Has Access'),
          className: 'text-success-11 bg-success-3',
          disabled: true,
        };
      case 'in-project':
        return {
          label: t('Member'),
          className: 'text-warning-11 bg-warning-3',
          disabled: true,
        };
      case 'already-invited':
        return {
          label: t('Invited'),
          className: 'text-gray-11 bg-gray-3',
          disabled: false,
        };
    }
  };

  const { label, className, disabled } = getBadgeAndState();
  const user = emailStatus.user;

  return (
    <CommandItem
      value={emailStatus.email}
      onSelect={() => !disabled && onSelect(emailStatus.email)}
      disabled={disabled}
      className={cn('cursor-pointer', disabled && 'opacity-60')}
    >
      <div className="flex w-full items-center gap-2">
        {user && (
          <UserAvatar
            name={`${user.firstName} ${user.lastName}`}
            email={user.email}
            size={32}
            disableTooltip={true}
            imageUrl={user.imageUrl}
          />
        )}
        <div className="flex min-w-0 flex-1 flex-col">
          <span className="truncate text-sm font-medium">
            {user ? `${user.firstName} ${user.lastName}` : emailStatus.email}
          </span>
          {user && (
            <span className="truncate text-xs text-gray-11">{user.email}</span>
          )}
        </div>
        <Badge variant="ghost" className={cn('ml-auto shrink-0', className)}>
          {label}
        </Badge>
      </div>
    </CommandItem>
  );
}

type SuggestedUserItemProps =
  | {
      type: 'platform-user';
      user: SuggestedUser;
      onSelect: (email: string) => void;
    }
  | {
      type: 'email-status';
      emailStatus: EmailStatusType;
      onSelect: (email: string) => void;
      isPlatformInvite?: boolean;
    };
