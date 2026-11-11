import { randomUUID } from 'node:crypto';
import type { APIRequestContext } from '@playwright/test';
import { e2eApi, E2E_PREFIX, E2eSession } from './api';
import { test as base } from './index';

export const test = base.extend<AccessFixtures>({
  secondProject: async ({ request, session, cleanup }, use) => {
    const project = await postJson<{ id: string }>({
      request,
      session,
      path: '/api/v1/projects',
      data: { displayName: `${E2E_PREFIX}project ${randomUUID().slice(0, 8)}` },
    });
    cleanup.track({ resource: 'projects', id: project.id });
    await use({ id: project.id, session: { token: session.token, projectId: project.id } });
  },

  viewer: async ({ request, session, secondProject, mailbox, cleanup }, use) => {
    const email = `e2e-viewer-${randomUUID().slice(0, 8)}@example.com`;
    await postJson({
      request,
      session,
      path: '/api/v1/user-invitations',
      data: { type: 'PROJECT', email, projectId: secondProject.id, projectRole: 'Viewer' },
    });
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

async function postJson<T>({ request, session, path, data }: { request: APIRequestContext; session: E2eSession; path: string; data: unknown }): Promise<T> {
  const response = await request.post(path, { headers: { Authorization: `Bearer ${session.token}` }, data });
  if (!response.ok()) {
    throw new Error(`POST ${path} failed with ${response.status()}: ${await response.text()}`);
  }
  return response.json();
}

const VIEWER_PASSWORD = 'E2e-Viewer-Pass-1!';

type AccessFixtures = {
  secondProject: { id: string; session: E2eSession };
  viewer: { userId: string; email: string; session: E2eSession };
};
