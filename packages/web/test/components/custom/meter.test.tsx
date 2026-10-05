/**
 * @vitest-environment jsdom
 */
/* eslint-disable jest-dom/prefer-in-document, jest-dom/prefer-to-have-class -- @testing-library/jest-dom is not a dependency of packages/web */
import { render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('i18next', () => ({ t: (key: string) => key }));

import { Meter } from '@/components/custom/stats';

afterEach(() => {
  document.body.innerHTML = '';
});

describe('Meter', () => {
  it('reads as over the limit when the limit is zero and something is used', () => {
    render(<Meter value={5} max={0} label="5 team projects" limit="of 0" />);

    expect(screen.getByText('5 team projects').className).toContain(
      'text-danger-11',
    );
  });

  it('stays calm at zero of zero', () => {
    render(<Meter value={0} max={0} label="0 team projects" limit="of 0" />);

    expect(screen.getByText('0 team projects').className).not.toContain(
      'text-danger-11',
    );
  });
});
