import { t } from 'i18next';

import { Command, CommandGroup, CommandList } from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverAnchor,
} from '@/components/ui/popover';

import { SuggestedUserItem } from './suggested-user-item';
import { useUserSuggestions } from './use-user-suggestions';

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
  const { suggestedUsers, emailStatus, hasSuggestions } = useUserSuggestions({
    inputValue,
    currentEmails,
    isPlatformPage,
  });

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
            <CommandGroup heading={t('Suggestions')}>
              {suggestedUsers.map((user) => (
                <SuggestedUserItem
                  key={user.id}
                  type="platform-user"
                  user={user}
                  onSelect={onSelectUser}
                />
              ))}
              {emailStatus && (
                <SuggestedUserItem
                  type="email-status"
                  emailStatus={emailStatus}
                  onSelect={onSelectUser}
                />
              )}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
