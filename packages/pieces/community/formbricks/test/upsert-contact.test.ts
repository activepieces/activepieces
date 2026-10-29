import { describe, expect, it, vi } from 'vitest';

const formbricksData = vi.fn();

vi.mock('../src/lib/common/client', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../src/lib/common/client')>();
  return { ...actual, formbricksData: (...args: unknown[]) => formbricksData(...args) };
});

import { formbricksApi } from '../src/lib/common/api';
import { FormbricksAuthValue } from '../src/lib/common/client';

const auth: FormbricksAuthValue = { apiKey: 'k', appUrl: 'https://app.formbricks.com' };

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
    expect(bodies[0]).toMatchObject({
      contacts: [
        {
          attributes: [
            { attributeKey: { key: 'email', name: 'Email' }, value: 'a@b.co' },
            { attributeKey: { key: 'company_size', name: 'Company Size' }, value: '10' },
            { attributeKey: { key: 'plan', name: 'plan' }, value: 'pro' },
          ],
        },
      ],
    });
  });
});
