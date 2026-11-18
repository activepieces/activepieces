import { randomUUID } from 'node:crypto';
import { expect } from '@playwright/test';
import type { APIRequestContext } from '@playwright/test';
import { e2eApi, E2E_PREFIX, E2eSession } from './api';
import { test as base } from './index';

export const test = base.extend<{ auditLog: AuditLog }>({
  auditLog: async ({ request, session, cleanup }, use) => {
    await use({
      folderNames: ({ count }) => {
        const word = `audit ${randomUUID().slice(0, 8)}`;
        return { word, names: Array.from({ length: count }, (_, index) => `${E2E_PREFIX}${word} ${index + 1}`) };
      },
      createFolders: ({ names, session: projectSession }) => Promise.all(names.map(async (displayName) => {
        const folder = await e2eApi.callApi<{ id: string }>({
          request,
          session: projectSession,
          method: 'POST',
          path: '/api/v1/folders',
          data: { displayName, projectId: projectSession.projectId },
        });
        cleanup.track({ resource: 'folders', id: folder.id });
        return folder.id;
      })),
      expectFolderEvents: async ({ projectId, names }) => {
        let events: FolderCreatedEvent[] = [];
        await expect.poll(async () => {
          events = await listFolderEvents({ request, session, projectId, names });
          return events.length;
        }, { message: `The audit log did not record ${names.length} folder.created event(s) in project ${projectId}` }).toBe(names.length);
        return events;
      },
      readProjectName: async ({ projectId }) => {
        const project = await e2eApi.callApi<{ displayName: string }>({ request, session, method: 'GET', path: `/api/v1/projects/${projectId}` });
        return project.displayName;
      },
      readStatus: async ({ session: caller, path, params }) => {
        const response = await request.get(path, { headers: { Authorization: `Bearer ${caller.token}` }, params });
        return response.status();
      },
    });
  },
});

export { expect } from '@playwright/test';

async function listFolderEvents({ request, session, projectId, names }: {
  request: APIRequestContext;
  session: E2eSession;
  projectId: string;
  names: string[];
}): Promise<FolderCreatedEvent[]> {
  const page = await e2eApi.callApi<{ data: FolderCreatedEvent[] }>({
    request,
    session,
    method: 'GET',
    path: '/api/v1/audit-events',
    params: { action: 'folder.created', projectId, limit: '100' },
  });
  return page.data.filter((event) => names.includes(event.data.folder.displayName));
}

type FolderCreatedEvent = { userEmail: string; projectDisplayName: string; data: { folder: { displayName: string } } };

type AuditLog = {
  folderNames: (params: { count: number }) => { word: string; names: string[] };
  createFolders: (params: { names: string[]; session: E2eSession }) => Promise<string[]>;
  expectFolderEvents: (params: { projectId: string; names: string[] }) => Promise<FolderCreatedEvent[]>;
  readProjectName: (params: { projectId: string }) => Promise<string>;
  readStatus: (params: { session: E2eSession; path: string; params?: Record<string, string> }) => Promise<number>;
};
