import { useMatch } from 'react-router-dom';

import { authenticationSession } from '@/lib/authentication-session';

export function useSessionProjectId(): string | null {
  return (
    useMatch('/projects/:projectId/*')?.params.projectId ??
    authenticationSession.getProjectId()
  );
}
