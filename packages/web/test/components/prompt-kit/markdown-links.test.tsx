/**
 * @vitest-environment jsdom
 */
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import {
  MemoryRouter,
  createMemoryRouter,
  useLocation,
} from 'react-router-dom';
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';

import { ChatAppLinks } from '@/app/routes/chat-with-ai/components/chat-app-links';
import { Markdown } from '@/components/prompt-kit/markdown';
import { chatPanelUtils } from '@/features/workspace/lib/chat-panel-open';
import { routeLocation } from '@/lib/route-location';
import { routesThatRequireProjectId } from '@/lib/route-utils';

const embedding = vi.hoisted(() => ({ isEmbedded: false }));

vi.mock('@/components/providers/embed-provider', () => ({
  useEmbedding: () => ({ embedState: embedding }),
}));

afterEach(() => {
  embedding.isEmbedded = false;
  cleanup();
  vi.restoreAllMocks();
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

  it('opens an app page beside the chat on a plain click', () => {
    const openBeside = vi
      .spyOn(chatPanelUtils, 'openBeside')
      .mockReturnValue(true);
    renderChatMarkdown('[Leads table](/projects/p1/tables/t1)');

    const followed = fireEvent.click(screen.getByRole('link'));

    expect(openBeside).toHaveBeenCalledWith({
      route: '/projects/p1/tables/t1',
      push: true,
      name: 'Leads table',
    });
    expect(followed).toBe(false);
  });

  it('keeps the normal link for a modified click', () => {
    const openBeside = vi.spyOn(chatPanelUtils, 'openBeside');
    renderChatMarkdown('[Leads table](/projects/p1/tables/t1)');

    fireEvent.click(screen.getByRole('link'), { metaKey: true });

    expect(openBeside).not.toHaveBeenCalled();
  });

  it('navigates in the app when the chat cannot open the page beside it', () => {
    vi.spyOn(chatPanelUtils, 'openBeside').mockReturnValue(false);
    renderChatMarkdown('[Leads table](/projects/p1/tables/t1)');

    fireEvent.click(screen.getByRole('link'));

    expect(screen.getByTestId('location').textContent).toBe(
      '/projects/p1/tables/t1',
    );
  });

  it('shows an app page link as plain text when embedded', () => {
    embedding.isEmbedded = true;
    const openBeside = vi.spyOn(chatPanelUtils, 'openBeside');
    renderChatMarkdown('[Leads table](/projects/p1/tables/t1)');

    expect(screen.queryAllByRole('link')).toHaveLength(0);
    fireEvent.click(screen.getByText('Leads table'));

    expect(openBeside).not.toHaveBeenCalled();
    expect(screen.getByTestId('location').textContent).toBe('/');
  });
});

function renderChatMarkdown(text: string) {
  render(
    <MemoryRouter>
      <ChatAppLinks>
        <Markdown>{text}</Markdown>
      </ChatAppLinks>
      <LocationProbe />
    </MemoryRouter>,
  );
}

function renderMarkdown(text: string) {
  render(
    <MemoryRouter>
      <Markdown>{text}</Markdown>
    </MemoryRouter>,
  );
}

function LocationProbe() {
  return <output data-testid="location">{useLocation().pathname}</output>;
}
