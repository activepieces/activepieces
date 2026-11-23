import { describe, expect, it } from 'vitest';

import { chatLayoutUtils } from '@/features/workspace/lib/chat-layout';

describe('chatLayoutUtils.overlaysPage', () => {
  it('overlays when the page beside a minimum-width dock would fall under the comfort width', () => {
    expect(chatLayoutUtils.overlaysPage({ cardWidth: 838 })).toBe(true);
  });

  it('sits beside the page when a comfortable page still fits', () => {
    expect(chatLayoutUtils.overlaysPage({ cardWidth: 1218 })).toBe(false);
  });

  it('sits beside the page exactly at the comfort width', () => {
    expect(chatLayoutUtils.overlaysPage({ cardWidth: 1080 })).toBe(false);
  });
});
