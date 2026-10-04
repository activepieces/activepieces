/**
 * @vitest-environment jsdom
 */
import { describe, expect, it } from 'vitest';

import { brandSeed } from '@/lib/brand-seed';

describe('brandSeed', () => {
  it('keeps a preview on the page when the saved branding is applied again, until it is cleared', () => {
    brandSeed.apply({
      primaryColor: '#6e41e2',
      statusColors: { danger: '#b91c1c' },
    });
    expect(variable({ name: '--accent-9' })).toBe('#6e41e2');
    expect(variable({ name: '--danger-seed' })).toBe('#b91c1c');

    brandSeed.setPreview({
      primaryColor: '#0ea5e9',
      statusColors: { warning: '#eab308' },
    });
    brandSeed.apply({
      primaryColor: '#16a34a',
      statusColors: { danger: '#991b1b' },
    });
    expect(variable({ name: '--accent-9' })).toBe('#0ea5e9');
    expect(variable({ name: '--warning-seed' })).toBe('#eab308');
    expect(variable({ name: '--danger-seed' })).toBe('');

    brandSeed.clearPreview();
    expect(variable({ name: '--accent-9' })).toBe('#16a34a');
    expect(variable({ name: '--danger-seed' })).toBe('#991b1b');
    expect(variable({ name: '--warning-seed' })).toBe('');
  });
});

function variable({ name }: { name: string }): string {
  return document.documentElement.style.getPropertyValue(name);
}
