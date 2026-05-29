import type { UserWithBadges } from '@activepieces/shared';
import { UserProfile } from '@clerk/clerk-react';
import { t } from 'i18next';
import { Sparkles, Settings as SettingsIcon } from 'lucide-react';

import { UserBadges } from '@/components/custom/user-badges';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { userHooks } from '@/hooks/user-hooks';
import { otom8ClerkAppearance } from '@/lib/otom8-clerk-appearance';

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
      <DialogContent className="max-w-4xl w-full h-[85vh] p-0 overflow-hidden bg-[#111111] border-white/8">
        <UserProfile
          appearance={{
            ...otom8ClerkAppearance,
            elements: {
              ...otom8ClerkAppearance.elements,
              rootBox: { width: '100%', height: '100%' },
              cardBox: {
                width: '100%',
                height: '100%',
                boxShadow: 'none',
                border: 'none',
                borderRadius: 0,
                backgroundColor: '#111111',
              },
            },
          }}
          routing="hash"
        >
          <UserProfile.Page
            label={t('Preferences')}
            labelIcon={<SettingsIcon className="w-4 h-4" />}
            url="preferences"
          >
            <div className="space-y-6 p-1">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <ThemeToggle />
                <LanguageToggle />
              </div>
            </div>
          </UserProfile.Page>
          <UserProfile.Page
            label={t('Badges')}
            labelIcon={<Sparkles className="w-4 h-4" />}
            url="badges"
          >
            <div className="p-1">
              <UserBadges user={user as UserWithBadges | null} />
            </div>
          </UserProfile.Page>
        </UserProfile>
      </DialogContent>
    </Dialog>
  );
}

export default AccountSettingsDialog;
