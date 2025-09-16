import { DialogTitle } from '@radix-ui/react-dialog';
import { t } from 'i18next';
import { Mail, Settings, User as UserIcon } from 'lucide-react';

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
      <DialogContent className="max-w-2xl w-full max-h-[90vh] h-fit pb-4 flex flex-col">
        <DialogHeader>
          <DialogTitle className="font-semibold">
            {t('Account Settings')}
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="flex-1">
          <div className="space-y-6">
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <UserIcon className="w-4 h-4" />
                <h3 className="text-base font-semibold">{t('Profile')}</h3>
              </div>
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <UserAvatar
                    name={
                      (user?.firstName ?? '') + ' ' + (user?.lastName ?? '')
                    }
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
              </div>
            </div>

            <Separator />

            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Settings className="w-4 h-4" />
                <h3 className="text-base font-semibold">{t('Appearance')}</h3>
              </div>
              <p className="text-sm text-muted-foreground">
                {t('Customize how the interface looks and feels.')}
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <ThemeToggle />
                <LanguageToggle />
              </div>
            </div>
          </div>
        </ScrollArea>
        <DialogFooter />
      </DialogContent>
    </Dialog>
  );
}

export default AccountSettingsDialog;
