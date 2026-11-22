import { e2eApi } from './api';
import { test as base } from './access';

export const test = base.extend<{ teamProjects: TeamProjects }>({
  teamProjects: async ({ request, session, cleanup }, use) => {
    await use({
      create: async ({ displayName }) => {
        const project = await e2eApi.callApi<{ id: string; displayName: string }>({
          request,
          session,
          method: 'POST',
          path: '/api/v1/projects',
          data: { displayName },
        });
        cleanup.track({ resource: 'projects', id: project.id });
        return { id: project.id, displayName: project.displayName };
      },
      track: ({ id }) => cleanup.track({ resource: 'projects', id }),
    });
  },
});

export { expect } from '@playwright/test';

type TeamProjects = {
  create: (params: { displayName: string }) => Promise<{ id: string; displayName: string }>;
  track: (params: { id: string }) => void;
};
