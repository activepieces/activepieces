import { useQueryClient } from '@tanstack/react-query';
import { t } from 'i18next';

import { ChangePasswordForm } from '@/features/authentication/components/change-password';
import { flagsHooks } from '@/hooks/flags-hooks';

const ChangePasswordPage = () => {
  const queryClient = useQueryClient();
  const branding = flagsHooks.useWebsiteBranding(queryClient);

  return (
    <div className="flex h-screen flex-col items-center justify-center gap-2">
      <div className="h-[60px]">
        <img
          className="h-full"
          src={branding.logos.fullLogoUrl}
          alt={t('logo')}
        />
      </div>
      <ChangePasswordForm />
    </div>
  );
};

export { ChangePasswordPage };
