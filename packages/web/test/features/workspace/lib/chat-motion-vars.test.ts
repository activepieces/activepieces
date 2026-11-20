// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';

import { chatLayoutUtils, MOTION } from '@/features/workspace/lib/chat-layout';

describe('chat motion tokens', () => {
  it('writes the CSS motion variables from the one TS source', () => {
    const root = document.createElement('div');

    chatLayoutUtils.applyMotionVars({ root });

    expect(root.style.getPropertyValue('--ease-ap-out')).toBe(
      MOTION.easeOutCss,
    );
    expect(root.style.getPropertyValue('--ease-ap-drawer')).toBe(
      MOTION.easeDrawerCss,
    );
    expect(root.style.getPropertyValue('--dur-base')).toBe('160ms');
    expect(root.style.getPropertyValue('--dur-sheet')).toBe('260ms');
  });

  it('leaves the app-wide --ease-out alone', () => {
    const root = document.createElement('div');

    chatLayoutUtils.applyMotionVars({ root });

    expect(root.style.getPropertyValue('--ease-out')).toBe('');
  });
});
