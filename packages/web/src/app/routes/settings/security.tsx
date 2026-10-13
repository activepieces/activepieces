import { t } from 'i18next';
import { KeyRound, LogOut, ShieldCheck } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';

export function SecuritySettingsPage() {
  return (
    <div className="flex flex-col gap-6">
      <div className="rounded-lg border p-5">
        <div className="flex items-start gap-3">
          <KeyRound className="mt-0.5 h-5 w-5 text-gray-11" />
          <div className="flex-1">
            <h3 className="text-sm font-medium">{t('Password')}</h3>
            <p className="mt-1 text-sm text-gray-11">
              {t(
                'Change the password you use to sign in to Synkra Flow.',
              )}
            </p>
          </div>
          <Button variant="outline" size="sm" asChild>
            <Link to="/change-password">{t('Change password')}</Link>
          </Button>
        </div>
      </div>

      <div className="rounded-lg border p-5">
        <div className="flex items-start gap-3">
          <ShieldCheck className="mt-0.5 h-5 w-5 text-gray-11" />
          <div className="flex-1">
            <h3 className="text-sm font-medium">
              {t('Two-factor authentication')}
            </h3>
            <p className="mt-1 text-sm text-gray-11">
              {t(
                'Two-factor authentication is not yet available. This will be enabled in a future update.',
              )}
            </p>
          </div>
          <Button variant="outline" size="sm" disabled>
            {t('Coming soon')}
          </Button>
        </div>
      </div>

      <Separator />

      <div className="rounded-lg border border-red-6 p-5">
        <div className="flex items-start gap-3">
          <LogOut className="mt-0.5 h-5 w-5 text-red-10" />
          <div className="flex-1">
            <h3 className="text-sm font-medium text-red-10">
              {t('Sign out everywhere')}
            </h3>
            <p className="mt-1 text-sm text-gray-11">
              {t(
                'This will end all active sessions on every device. You will need to sign in again.',
              )}
            </p>
          </div>
          <Button variant="outline" size="sm" disabled>
            {t('Coming soon')}
          </Button>
        </div>
      </div>
    </div>
  );
}
