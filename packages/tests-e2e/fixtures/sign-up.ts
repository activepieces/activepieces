import { faker } from '@faker-js/faker';
import type { APIRequestContext } from '@playwright/test';
import type { E2eSession } from './api';
import { test as base } from './index';
import { e2eMail } from './mail';

export const test = base.extend<{ invitation: Invitation }>({
  invitation: async ({ request, session, cleanup }, use) => {
    const email = faker.internet.email({ provider: 'example.com' }).toLowerCase();
    const invitation = await invitePlatformMember({ request, session, email });
    cleanup.track({ resource: 'user-invitations', id: invitation.id });
    const link = invitation.link
      ? new URL(invitation.link)
      : await e2eMail.connect({ request }).linkTo({ to: email, path: '/invitation' });
    await use({ email, link });
  },
});

async function invitePlatformMember({ request, session, email }: { request: APIRequestContext; session: E2eSession; email: string }) {
  const response = await request.post('/api/v1/user-invitations', {
    headers: { Authorization: `Bearer ${session.token}` },
    data: { type: 'PLATFORM', email, platformRole: 'MEMBER' },
  });
  if (!response.ok()) {
    throw new Error(`Inviting ${email} failed with ${response.status()}: ${await response.text()}`);
  }
  const invitation: { id: string; link?: string } = await response.json();
  return invitation;
}

export { expect } from '@playwright/test';

type Invitation = { email: string; link: URL };
