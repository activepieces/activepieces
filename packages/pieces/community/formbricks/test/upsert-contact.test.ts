import { describe, expect, it, vi } from 'vitest';

const formbricksData = vi.fn();

vi.mock('../src/lib/common/client', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../src/lib/common/client')>();
  return { ...actual, formbricksData: (...args: unknown[]) => formbricksData(...args) };
});

import { formbricksApi } from '../src/lib/common/api';

const auth = { apiKey: 'k', appUrl: 'https://app.formbricks.com' } as never;

describe('upsertContact', () => {
  it('keeps the stored display name of an existing attribute key', async () => {
    const bodies: unknown[] = [];
    formbricksData.mockImplementation(async ({ path, body }: { path: string; body?: unknown }) => {
      if (path === '/api/v1/management/contact-attribute-keys') {
        return [
          { id: 'k1', key: 'email', name: 'Email', workspaceId: 'ws' },
          { id: 'k2', key: 'company_size', name: 'Company Size', workspaceId: 'ws' },
        ];
      }
      if (path === '/api/v2/management/contacts/bulk') {
        bodies.push(body);
        return { status: 'success', message: 'ok' };
      }
      return [];
    });
    await formbricksApi.upsertContact({ auth, workspaceId: 'ws', email: 'a@b.co', attributes: { company_size: '10', plan: 'pro' } });
    const sent = bodies[0] as { contacts: { attributes: { attributeKey: { key: string; name: string } }[] }[] };
    const names = Object.fromEntries(sent.contacts[0].attributes.map((a) => [a.attributeKey.key, a.attributeKey.name]));
    expect(names).toEqual({ email: 'Email', company_size: 'Company Size', plan: 'plan' });
  });
});
