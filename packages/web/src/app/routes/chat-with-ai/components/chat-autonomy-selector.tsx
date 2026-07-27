import { ChatAutonomyMode } from '@activepieces/shared';
import { t } from 'i18next';
import { Shield, ShieldCheck, Zap } from 'lucide-react';
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
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { platformHooks } from '@/hooks/platform-hooks';

export function ChatAutonomySelector({
  autonomyMode,
  onAutonomyChange,
}: {
  autonomyMode: ChatAutonomyMode;
  onAutonomyChange: (mode: ChatAutonomyMode) => void;
}) {
  const [warningOpen, setWarningOpen] = useState(false);
  const { platform } = platformHooks.useCurrentPlatform();
  const fullAccessAllowed =
    platform.chatConsentPolicy?.fullAccessEnabled !== false;
  const fullAccess = autonomyMode === 'full_access';

  return (
    <>
      <DropdownMenu>
        <Tooltip>
          <TooltipTrigger asChild>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="gap-1.5 text-xs text-muted-foreground"
                type="button"
              >
                {fullAccess ? (
                  <Zap className="size-3.5 text-amber-500" />
                ) : (
                  <ShieldCheck className="size-3.5" />
                )}
                {fullAccess ? t('Full access') : t('Asks first')}
              </Button>
            </DropdownMenuTrigger>
          </TooltipTrigger>
          <TooltipContent side="top">
            {fullAccess
              ? t('Sends and app changes run without asking in this chat')
              : t('Real-world actions ask you before they run')}
          </TooltipContent>
        </Tooltip>
        <DropdownMenuContent align="end" className="w-72">
          <DropdownMenuItem
            onClick={() => onAutonomyChange('ask_first')}
            className="items-start gap-2 py-2"
          >
            <ShieldCheck className="size-4 mt-0.5 shrink-0" />
            <div>
              <p className="text-sm font-medium">{t('Asks first')}</p>
              <p className="text-xs text-muted-foreground">
                {t(
                  'Anything that sends, changes a connected app, deletes, or spends money asks you before it runs.',
                )}
              </p>
            </div>
          </DropdownMenuItem>
          <DropdownMenuItem
            disabled={!fullAccessAllowed}
            onClick={() => setWarningOpen(true)}
            className="items-start gap-2 py-2"
          >
            <Zap className="size-4 mt-0.5 shrink-0 text-amber-500" />
            <div>
              <p className="text-sm font-medium">{t('Full access')}</p>
              <p className="text-xs text-muted-foreground">
                {fullAccessAllowed
                  ? t(
                      'Sends and app changes run without asking. Deleting data and moving money still ask.',
                    )
                  : t('Turned off by your workspace admin.')}
              </p>
            </div>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <Dialog open={warningOpen} onOpenChange={setWarningOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Shield className="size-5 text-amber-500" />
              {t('Give the assistant full access?')}
            </DialogTitle>
            <DialogDescription className="space-y-2">
              <span className="block">
                {t(
                  'In this conversation, the assistant will send real messages and change data in your connected apps without asking you first.',
                )}
              </span>
              <span className="block">
                {t(
                  'It will still ask before deleting data, moving money, or running anything it cannot identify.',
                )}
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
