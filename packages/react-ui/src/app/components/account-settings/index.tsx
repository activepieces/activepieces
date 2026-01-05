import { DialogTitle } from '@radix-ui/react-dialog';
import { t } from 'i18next';
import { Lock, Mail } from 'lucide-react';
import { BADGES, UserWithBadges } from '@activepieces/shared';

import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { UserAvatar } from '@/components/ui/user-avatar';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { userHooks } from '@/hooks/user-hooks';

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

            <Separator />

            <div className="space-y-3">
              <h5 className="text-xs text-foreground tracking-wide">
                {t('Badges')}
              </h5>
              <div className="flex items-center gap-2 flex-wrap">
                {Object.entries(BADGES).map(([badgeName, badge]) => {
                  const userWithBadges = user as UserWithBadges | null;
                  const isUnlocked = userWithBadges?.badges?.some(
                    (userBadge: { name: string; created: string }) => userBadge.name === badgeName
                  ) ?? false;
                  
                  return (
                    <Tooltip key={badgeName}>
                      <TooltipTrigger asChild>
                        <div className="cursor-pointer relative">
                          <img
                            src={badge.imageUrl}
                            alt={badge.title}
                            className={`h-12 w-12 object-cover rounded ${!isUnlocked ? 'opacity-50 grayscale' : ''}`}
                          />
                          {!isUnlocked && (
                            <div className="absolute inset-0 flex items-center justify-center rounded">
                              <Lock className="h-5 w-5 text-muted-foreground" />
                            </div>
                          )}
                        </div>
                      </TooltipTrigger>
                      <TooltipContent className="text-left">
                        <div className="flex flex-col">
                          <p className="font-semibold">{badge.title}</p>
                          <p className="text-xs">{badge.description}</p>
                          {!isUnlocked && (
                            <p className="text-xs text-muted-foreground mt-1">
                              {t('Locked')}
                            </p>
                          )}
                        </div>
                      </TooltipContent>
                    </Tooltip>
                  );
                })}
              </div>
            </div>
            
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
