/**
 * @vitest-environment jsdom
 */
import { cleanup, render, screen } from '@testing-library/react';
import { MemoryRouter, createMemoryRouter } from 'react-router-dom';
import { afterEach, beforeAll, describe, expect, it } from 'vitest';

import { Markdown } from '@/components/prompt-kit/markdown';
import { routeLocation } from '@/lib/route-location';
import { routesThatRequireProjectId } from '@/lib/route-utils';

afterEach(() => {
  cleanup();
});

describe('Markdown links', () => {
  beforeAll(() => {
    routeLocation.track(
      createMemoryRouter([
        {
          path: `/projects/:projectId${routesThatRequireProjectId.singleTable}`,
          handle: { shell: 'project' },
          element: null,
        },
      ]),
    );
  });

  it('keeps the author text of a formatted link to another site', () => {
    renderMarkdown('[**Pricing docs**](https://example.com/pricing)');

    const link = screen.getByRole('link');
    expect(link.textContent).toBe('Pricing docs');
    expect(link.getAttribute('href')).toBe('https://example.com/pricing');
  });

  it('keeps the author text of a formatted link to an app page', () => {
    renderMarkdown('[*Leads table*](/projects/p1/tables/t1)');

    expect(screen.getByRole('link').textContent).toBe('Leads table');
  });
});

function renderMarkdown(text: string) {
  render(
    <MemoryRouter>
      <Markdown>{text}</Markdown>
    </MemoryRouter>,
  );
}
