import { AuthLanding } from '@/features/authentication';

const CreatePlatformPage = () => {
  return <AuthLanding initialMode="signin" />;
};

CreatePlatformPage.displayName = 'CreatePlatformPage';

export { CreatePlatformPage };
