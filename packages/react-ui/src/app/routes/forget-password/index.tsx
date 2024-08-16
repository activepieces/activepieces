import { t } from 'i18next';

import { ResetPasswordForm } from '@/features/authentication/components/reset-password-form';
import { theme } from '@/lib/theme';

const ResetPasswordPage = () => {
  return (
    <div className="flex h-screen flex-col items-center justify-center gap-2">
      <img src={theme.fullLogoUrl} alt={t('logo')} width={205} height={205} />
      <ResetPasswordForm />
    </div>
  );
};

export { ResetPasswordPage };
