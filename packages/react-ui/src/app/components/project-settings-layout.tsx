import { t } from 'i18next';
import { Navigate } from 'react-router-dom';

import { isNil } from '@activepieces/shared';

import { authenticationSession } from '../../lib/authentication-session';

interface SettingsLayoutProps {
  children: React.ReactNode;
}

export default function ProjectSettingsLayout({
  children,
}: SettingsLayoutProps) {
  const currentProjectId = authenticationSession.getProjectId();

  if (isNil(currentProjectId)) {
    return <Navigate to="/sign-in" replace />;
  }

  return (
    <div className="w-full md:block">
      <h2 className="text-3xl font-bold tracking-tight">{t('Settings')}</h2>
      <div className="w-full mt-4">{children}</div>
    </div>
  );
}
