// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { chatPanelUtils } from '@/features/workspace/lib/chat-panel-open';
import { useOpenInApp } from '@/features/workspace/lib/use-open-in-app';

vi.mock('i18next', () => ({
  t: (key: string) => key,
}));

afterEach(() => {
  cleanup();
});

describe('useOpenInApp', () => {
  it('lets the link navigate when no chat router is bound', () => {
    renderLink();

    const clicked = fireEvent.click(screen.getByRole('link'));

    expect(clicked).toBe(true);
  });

  it('opens beside the chat when a chat router is bound', () => {
    const navigate = vi.fn();
    const unbind = chatPanelUtils.bindRouter({
      navigate,
      location: () => ({
        pathname: '/projects/p1/automations',
        search: '',
        hash: '',
        state: null,
      }),
      isFullPage: () => false,
    });
    renderLink();

    const clicked = fireEvent.click(screen.getByRole('link'));
    unbind();

    expect(clicked).toBe(false);
    expect(navigate).toHaveBeenCalledWith({
      to: '/projects/p1/agents',
      replace: false,
    });
  });
});

function renderLink() {
  render(
    <MemoryRouter initialEntries={['/projects/p1/automations']}>
      <Routes>
        <Route path="*" element={<AgentsLink />} />
      </Routes>
    </MemoryRouter>,
  );
}

function AgentsLink() {
  const { onLinkClick } = useOpenInApp();
  return (
    <a
      href="/projects/p1/agents"
      onClick={(event) =>
        onLinkClick({ event, route: '/projects/p1/agents', name: 'Agents' })
      }
    >
      Agents
    </a>
  );
}
