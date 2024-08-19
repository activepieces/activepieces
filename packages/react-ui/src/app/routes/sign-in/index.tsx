import { useQueryClient } from '@tanstack/react-query';
import { t } from 'i18next';

import { AuthFormTemplate } from '@/features/authentication/components/auth-form-template';
import { flagsHooks } from '@/hooks/flags-hooks';

const SignInPage: React.FC = () => {
  const queryClient = useQueryClient();
  const branding = flagsHooks.useWebsiteBranding(queryClient);

  return (
    <div className="flex h-screen flex-col items-center justify-center gap-2">
      <img
        src={branding.logos.fullLogoUrl}
        alt={t('logo')}
        width={205}
        height={205}
      />
      <AuthFormTemplate form={'signin'} />
    </div>
  );
};

SignInPage.displayName = 'SignInPage';

export { SignInPage };
