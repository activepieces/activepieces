import { describe, expect, it } from 'vitest';

import { legacyPathUtils } from '@/app/routes/platform/legacy-path-redirect';

describe('legacyPathUtils.resolve', () => {
  it.each([
    ['/platform/security/sso', '/platform/sso'],
    ['/platform/security/embed', '/platform/embedding'],
    ['/platform/security/project-roles', '/platform/users/roles'],
    ['/platform/setup/connections', '/platform/connections/global'],
    ['/platform/setup/branding', '/platform/general'],
    ['/platform/setup/ai-capabilities', '/platform/ai/capabilities'],
    ['/platform/setup/ai/capabilities', '/platform/ai/capabilities'],
    [
      '/platform/setup/pieces/piece-sets/abc123',
      '/platform/pieces/piece-sets/abc123',
    ],
    ['/platform/setup/billing/success', '/platform/billing/success'],
    [
      '/platform/infrastructure/event-destinations',
      '/platform/audit-log/streaming',
    ],
    ['/platform/infrastructure/workers/groups', '/platform/workers/groups'],
    ['/platform/infrastructure/health/queue', '/platform/health/queue'],
    ['/platform/setup', '/platform/ai'],
    ['/platform/security', '/platform/audit-log'],
    ['/platform/infrastructure', '/platform/workers'],
  ])('%s -> %s', (from, to) => {
    expect(legacyPathUtils.resolve(from)).toBe(to);
  });

  it('drops an unknown sub-path under a retired group folder', () => {
    expect(legacyPathUtils.resolve('/platform/setup/unknown')).toBe(
      '/platform/ai',
    );
    expect(legacyPathUtils.resolve('/platform/security/unknown/x')).toBe(
      '/platform/audit-log',
    );
  });

  it('does not treat a longer sibling segment as a match', () => {
    expect(legacyPathUtils.resolve('/platform/setup/ai-capabilities')).not.toBe(
      '/platform/ai-capabilities',
    );
  });
});
