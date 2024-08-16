import { t } from 'i18next';
import { AuthFormTemplate } from '@/features/authentication/components/auth-form-template';
import { theme } from '@/lib/theme';

const SignUpPage: React.FC = () => {
  return (
    <div className="flex h-screen flex-col items-center justify-center gap-2">
      <img src={theme.fullLogoUrl} alt={t('logo')} width={205} height={205} />
      <AuthFormTemplate form={'signup'} /> 
    </div>
  );
};

SignUpPage.displayName = 'SignUpPage';

export { SignUpPage };