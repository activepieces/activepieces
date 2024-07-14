import { projectApi } from '@/features/projects/lib/project-api';
import { AuthenticationResponse } from '@activepieces/shared';

export const authenticationSession = {
  saveResponse(response: AuthenticationResponse) {
    localStorage.setItem('token', response.token);
    localStorage.setItem('currentUser', JSON.stringify(response));
    localStorage.setItem('projectId', response.projectId);
  },
  getToken(): string | null {
    return localStorage.getItem('token') ?? null;
  },
  getProjectId(): string {
    const currentProjectId = localStorage.getItem('projectId')!;
    return currentProjectId;
  },
  async switchToSession(projectId: string) {
    const result = await projectApi.getTokenForProject(projectId);
    localStorage.setItem('token', result.token);
    localStorage.setItem('projectId', projectId);
  },
  isLoggedIn(): boolean {
    return !!this.getToken();
  },
  LogOut() {
    localStorage.removeItem('token');
    localStorage.removeItem('currentUser');
    localStorage.removeItem('projectId');
    window.location.href = '/sign-in';
  },
};
