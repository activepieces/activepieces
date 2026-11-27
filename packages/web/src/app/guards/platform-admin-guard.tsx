import { Navigate } from 'react-router-dom';

import { useIsPlatformAdmin } from '@/hooks/authorization-hooks';

export const PlatformAdminGuard = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const isPlatformAdmin = useIsPlatformAdmin();
  if (!isPlatformAdmin) {
    return <Navigate to="/" replace />;
  }
  return children;
};
