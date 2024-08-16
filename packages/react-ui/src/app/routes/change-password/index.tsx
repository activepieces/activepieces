import { ChangePasswordForm } from '@/features/authentication/components/change-password';
import { theme } from '@/lib/theme';
import { t } from 'i18next';

const ChangePasswordPage = () => {
  return (
    <div className="flex h-screen flex-col items-center justify-center gap-2">
      <img src={theme.fullLogoUrl} alt={t('logo')} width={205} height={205} />
      <ChangePasswordForm />
    </div>
  );
};

export { ChangePasswordPage };