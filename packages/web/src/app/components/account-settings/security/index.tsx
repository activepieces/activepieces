import { t } from 'i18next';
import { useState } from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { authQueries } from '@/features/authentication/hooks/auth-hooks';
import { platformHooks } from '@/hooks/platform-hooks';

import { BackupCodesDialog } from './backup-codes-dialog';
import { DisableTwoFaDialog } from './disable-2fa-dialog';
import { EnableTwoFaDialog } from './enable-2fa-dialog';

function TwoFactorAuthSection() {
  const [enableOpen, setEnableOpen] = useState(false);
  const [disableOpen, setDisableOpen] = useState(false);
  const [backupCodesOpen, setBackupCodesOpen] = useState(false);

  const { platform } = platformHooks.useCurrentPlatform();

  const { data: status } = authQueries.use2faStatus();

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-0.5">
          <p className="text-sm font-medium">
            {t('Two-Factor Authentication')}
          </p>
          <div className="flex items-center gap-2">
            {status?.enabled ? (
              <Badge variant="success">{t('2FA is enabled')}</Badge>
            ) : (
              <Badge variant="outline">{t('2FA is disabled')}</Badge>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {status?.enabled ? (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setBackupCodesOpen(true)}
              >
                {t('Backup Codes')} ({status.backupCodesRemaining})
              </Button>
              {!platform.enforceTotp && (
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => setDisableOpen(true)}
                >
                  {t('Disable 2FA')}
                </Button>
              )}
            </>
          ) : (
            <Button size="sm" onClick={() => setEnableOpen(true)}>
              {t('Enable 2FA')}
            </Button>
          )}
        </div>
      </div>

      <EnableTwoFaDialog open={enableOpen} onOpenChange={setEnableOpen} />
      <DisableTwoFaDialog open={disableOpen} onOpenChange={setDisableOpen} />
      <BackupCodesDialog
        open={backupCodesOpen}
        onOpenChange={setBackupCodesOpen}
        backupCodesRemaining={status?.backupCodesRemaining ?? 0}
      />
    </div>
  );
}

TwoFactorAuthSection.displayName = 'TwoFactorAuthSection';

export { TwoFactorAuthSection };
