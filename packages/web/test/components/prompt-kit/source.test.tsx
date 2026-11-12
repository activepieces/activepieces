/**
 * @vitest-environment jsdom
 */
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import { Source } from '@/components/prompt-kit/source';

afterEach(() => {
  cleanup();
});

describe('Source', () => {
  it.each(['javascript:alert(1)', 'data:text/html,hi', '//evil.example/x'])(
    'never renders the unsafe href %s as a link',
    (href) => {
      render(<Source href={href} title="Docs" />);

      expect(screen.queryByRole('link')).toBeNull();
      expect(screen.getByText('Docs')).toBeTruthy();
    },
  );

  it('links an external page in a new tab', () => {
    render(<Source href="https://example.com/page" />);

    const link = screen.getByRole('link');
    expect(link.getAttribute('href')).toBe('https://example.com/page');
    expect(link.getAttribute('target')).toBe('_blank');
  });
});
