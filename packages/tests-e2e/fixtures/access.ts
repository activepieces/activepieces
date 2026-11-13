import { randomUUID } from 'node:crypto';
import { e2eApi, E2E_PREFIX, E2eSession } from './api';
import { test as base } from './index';

export const test = base.extend<AccessFixtures>({
  secondProject: async ({ request, session, cleanup }, use) => {
    const project = await e2eApi.callApi<{ id: string }>({
      request,
      session,
      method: 'POST',
      path: '/api/v1/projects',
      data: { displayName: `${E2E_PREFIX}project ${randomUUID().slice(0, 8)}` },
    }).catch(explainFreePlan);
    cleanup.track({ resource: 'projects', id: project.id });
    await use({ id: project.id, session: { token: session.token, projectId: project.id } });
  },

  viewer: async ({ request, session, secondProject, mailbox, cleanup }, use) => {
    const email = `e2e-viewer-${randomUUID().slice(0, 8)}@example.com`;
    const invitation = await e2eApi.callApi<{ id: string }>({
      request,
      session,
      method: 'POST',
      path: '/api/v1/user-invitations',
      data: { type: 'PROJECT', email, projectId: secondProject.id, projectRole: 'Viewer' },
    }).catch(explainFreePlan);
    cleanup.track({ resource: 'user-invitations', id: invitation.id });
    await e2eApi.acceptInvitation({ request, link: await mailbox.linkTo({ to: email, path: '/invitation' }) });
    const { userId } = await e2eApi.signUp({ request, email, password: VIEWER_PASSWORD });
    cleanup.track({ resource: 'users', id: userId });
    const signIn = await e2eApi.signIn({ request, email, password: VIEWER_PASSWORD });
    if (!signIn.ok()) {
      throw new Error(`Signing in the viewer failed with ${signIn.status()}: ${await signIn.text()}`);
    }
    const { token }: { token: string } = await signIn.json();
    await use({ userId, email, session: { token, projectId: secondProject.id } });
  },
});

export { expect } from '@playwright/test';

function explainFreePlan(error: unknown): never {
  if (error instanceof Error && error.message.includes(' failed with 402:')) {
    throw new Error(`${error.message}\nThe platform is on the free plan. Set E2E_LICENSE_KEY, so global setup activates an EE license with team projects and project roles.`);
  }
  throw error;
}

const VIEWER_PASSWORD = 'E2e-Viewer-Pass-1!';

type AccessFixtures = {
  secondProject: { id: string; session: E2eSession };
  viewer: { userId: string; email: string; session: E2eSession };
};
