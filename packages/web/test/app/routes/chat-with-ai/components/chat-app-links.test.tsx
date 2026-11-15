// @vitest-environment jsdom
import { describe, expect, it, vi } from 'vitest';

import { chatAppLinkUtils } from '@/app/routes/chat-with-ai/components/chat-app-links';

vi.mock('i18next', () => ({ t: (key: string) => key }));

describe('chatAppLinkUtils.label', () => {
  it('names a single resource page by its kind', () => {
    expect(chatAppLinkUtils.label('/projects/p1/flows/f1?step=2#x')).toBe(
      'Flow',
    );
    expect(chatAppLinkUtils.label('/projects/p1/tables/t1')).toBe('Table');
  });

  it('names list pages', () => {
    expect(chatAppLinkUtils.label('/projects/p1/runs')).toBe('Runs');
    expect(chatAppLinkUtils.label('/projects/p1/automations')).toBe(
      'Automations',
    );
  });

  it('names platform pages', () => {
    expect(chatAppLinkUtils.label('/platform/users')).toBe('Users');
    expect(chatAppLinkUtils.label('/platform/ai/usage?x=1')).toBe('AI');
  });

  it('never shows a raw path for pages it does not know', () => {
    expect(chatAppLinkUtils.label('/platform/setup?tab=1')).toBe(
      'Platform Admin',
    );
    expect(chatAppLinkUtils.label('/projects/p1/unknown/x')).toBe('Open page');
  });
});
