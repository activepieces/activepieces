import { DialogTitle } from '@radix-ui/react-dialog';
import { t } from 'i18next';
import { Mail } from 'lucide-react';

import { UserBadges } from '@/components/custom/user-badges';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { UserAvatar } from '@/components/ui/user-avatar';
import { userHooks } from '@/hooks/user-hooks';
import { UserWithBadges } from '@activepieces/shared';

import { DeleteAccount } from './delete-account';
import LanguageToggle from './language-toggle';
import ThemeToggle from './theme-toggle';
export interface AccountSettingsDialogProps {
  open: boolean;
  onClose: () => void;
}

export function AccountSettingsDialog({
  open,
  onClose,
}: AccountSettingsDialogProps) {
  const { data: user } = userHooks.useCurrentUser();
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl w-full max-h-[90vh] pb-4 flex flex-col px-5">
        <DialogHeader>
          <DialogTitle className="font-semibold">
            {t('Account Settings')}
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="flex-1" viewPortClassName="px-1">
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <UserAvatar
                name={(user?.firstName ?? '') + ' ' + (user?.lastName ?? '')}
                email={user?.email ?? ''}
                size={40}
                disableTooltip
              />
              <div>
                <div className="text-sm font-semibold">
                  {user?.firstName} {user?.lastName}
                </div>
                <div className="text-xs text-muted-foreground flex items-center gap-1">
                  <Mail className="w-3.5 h-3.5" />
                  {user?.email}
                </div>
              </div>
            </div>

            <UserBadges user={user as UserWithBadges | null} />

            <Separator />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <ThemeToggle />
              <LanguageToggle />
            </div>
            <DeleteAccount />
          </div>
        </ScrollArea>
        <DialogFooter />
      </DialogContent>
    </Dialog>
  );
}

export default AccountSettingsDialog;
