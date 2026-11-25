import { randomUUID } from 'node:crypto';
import type { APIRequestContext } from '@playwright/test';
import { e2eApi, E2eSession } from './api';
import { Cleanup, test as base } from './index';

export const test = base.extend<{ alerts: Alerts }>({
  alerts: async ({ request, cleanup }, use) => {
    await use({
      newReceiver: () => `e2e-alert-${randomUUID().slice(0, 8)}@example.com`,
      trackStored: ({ session, receiver }) => trackStored({ request, cleanup, session, receiver }),
      add: async ({ session, receiver }) => {
        const status = await e2eApi.callApiStatus({
          request,
          session,
          method: 'POST',
          path: '/api/v1/alerts',
          data: { projectId: session.projectId, channel: 'EMAIL', receiver },
        });
        if (status !== 200) {
          throw new Error(`Adding the alert email ${receiver} failed with ${status}`);
        }
        return trackStored({ request, cleanup, session, receiver });
      },
    });
  },
});

export { expect } from '@playwright/test';

async function trackStored({ request, cleanup, session, receiver }: AlertParams & { request: APIRequestContext; cleanup: Cleanup }): Promise<string> {
  const page = await e2eApi.callApi<{ data: { id: string; receiver: string }[] }>({
    request,
    session,
    method: 'GET',
    path: '/api/v1/alerts',
    params: { projectId: session.projectId, limit: '100' },
  });
  const alert = page.data.find((item) => item.receiver === receiver);
  if (!alert) {
    throw new Error(`Project ${session.projectId} holds no alert email ${receiver}`);
  }
  cleanup.track({ resource: 'alerts', id: alert.id });
  return alert.id;
}

type AlertParams = { session: E2eSession; receiver: string };

type Alerts = {
  newReceiver: () => string;
  trackStored: (params: AlertParams) => Promise<string>;
  add: (params: AlertParams) => Promise<string>;
};
