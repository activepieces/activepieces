import {
  ChatAutonomyMode,
  chatConsentPolicy,
  PlatformRole,
} from '@activepieces/shared';
import { t } from 'i18next';
import {
  ShieldAlert,
  ShieldCheck,
  ShieldHalf,
  TriangleAlert,
} from 'lucide-react';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { platformHooks } from '@/hooks/platform-hooks';
import { userHooks } from '@/hooks/user-hooks';
import { cn } from '@/lib/utils';

export function ChatAutonomySelector({
  autonomyMode,
  onAutonomyChange,
}: {
  autonomyMode: ChatAutonomyMode;
  onAutonomyChange: (mode: ChatAutonomyMode) => void;
}) {
  const [warningOpen, setWarningOpen] = useState(false);
  const { platform } = platformHooks.useCurrentPlatform();
  const platformRole = userHooks.getCurrentUserPlatformRole();
  const allowedFor = chatConsentPolicy.effectiveFullAccessAllowedFor({
    settings: platform.chatConsentPolicy,
  });
  const fullAccessAllowed =
    allowedFor === 'everyone' ||
    (allowedFor === 'admins_only' && platformRole === PlatformRole.ADMIN);
  const fullAccessBlockedReason =
    allowedFor === 'admins_only'
      ? t('Limited to workspace admins.')
      : t('Turned off by your workspace admin.');
  const fullAccess = autonomyMode === 'full_access';
  const auto = autonomyMode === 'auto';

  const handleModeChange = (value: string) => {
    if (value === 'full_access') {
      setWarningOpen(true);
      return;
    }
    if (value === 'auto') {
      onAutonomyChange('auto');
      return;
    }
    onAutonomyChange('ask_first');
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className={cn(
              'gap-1.5 text-xs',
              fullAccess
                ? 'text-warning-700 hover:text-warning-800 dark:text-warning-300'
                : 'text-muted-foreground',
            )}
            type="button"
          >
            {fullAccess ? (
              <ShieldAlert className="size-3.5" />
            ) : auto ? (
              <ShieldHalf className="size-3.5" />
            ) : (
              <ShieldCheck className="size-3.5" />
            )}
            {fullAccess ? t('Full access') : auto ? t('Auto') : t('Asks first')}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-80">
          <DropdownMenuRadioGroup
            value={autonomyMode}
            onValueChange={handleModeChange}
          >
            <DropdownMenuRadioItem
              value="ask_first"
              className="items-start gap-2 py-2"
            >
              <div className="flex flex-col gap-0.5">
                <span className="flex items-center gap-1.5 text-sm font-medium">
                  <ShieldCheck className="size-4 shrink-0" />
                  {t('Asks first')}
                </span>
                <span className="text-xs text-muted-foreground">
                  {t(ASK_FIRST_SUMMARY)}
                </span>
              </div>
            </DropdownMenuRadioItem>
            <DropdownMenuRadioItem
              value="auto"
              disabled={!fullAccessAllowed}
              className="items-start gap-2 py-2"
            >
              <div className="flex flex-col gap-0.5">
                <span className="flex items-center gap-1.5 text-sm font-medium">
                  <ShieldHalf className="size-4 shrink-0" />
                  {t('Auto')}
                </span>
                <span className="text-xs text-muted-foreground">
                  {fullAccessAllowed
                    ? t(AUTO_SUMMARY)
                    : fullAccessBlockedReason}
                </span>
              </div>
            </DropdownMenuRadioItem>
            <DropdownMenuRadioItem
              value="full_access"
              disabled={!fullAccessAllowed}
              className="items-start gap-2 py-2"
            >
              <div className="flex flex-col gap-0.5">
                <span className="flex items-center gap-1.5 text-sm font-medium">
                  <ShieldAlert className="size-4 shrink-0 text-warning-700 dark:text-warning-300" />
                  {t('Full access')}
                </span>
                <span className="text-xs text-muted-foreground">
                  {fullAccessAllowed
                    ? t(FULL_ACCESS_SUMMARY)
                    : fullAccessBlockedReason}
                </span>
              </div>
            </DropdownMenuRadioItem>
          </DropdownMenuRadioGroup>
        </DropdownMenuContent>
      </DropdownMenu>
      <Dialog open={warningOpen} onOpenChange={setWarningOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <TriangleAlert className="size-5 text-warning-700 dark:text-warning-300" />
              {t('Give the assistant full access?')}
            </DialogTitle>
            <DialogDescription className="space-y-2">
              <span className="block">
                {t(
                  'In this conversation, the assistant will send real messages and change data in your connected apps without asking you first.',
                )}
              </span>
              <span className="block">{t(FULL_ACCESS_CARVE_OUT)}</span>
              <span className="block">
                {t('It stays on for this chat until you switch it back.')}
              </span>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              type="button"
              onClick={() => setWarningOpen(false)}
            >
              {t('Keep asking me')}
            </Button>
            <Button
              type="button"
              className="bg-warning-700 text-white hover:bg-warning-800 dark:bg-warning-700 dark:hover:bg-warning-600"
              onClick={() => {
                setWarningOpen(false);
                onAutonomyChange('full_access');
              }}
            >
              {t('Give full access')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

const ASK_FIRST_SUMMARY = 'Asks before real actions.';
const AUTO_SUMMARY = 'Runs routine actions, asks when it matters.';
const FULL_ACCESS_SUMMARY = 'Runs without asking.';
const FULL_ACCESS_CARVE_OUT =
  'It will still ask before deleting data, moving money, or running anything it cannot identify.';
