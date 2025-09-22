import { Navigate } from 'react-router-dom';

import { isNil } from '@activepieces/shared';

import { authenticationSession } from '../../lib/authentication-session';

export default function ProjectSettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const currentProjectId = authenticationSession.getProjectId();

  if (isNil(currentProjectId)) {
    return <Navigate to="/sign-in" replace />;
  }

  return <div className="w-full">{children}</div>;
}
