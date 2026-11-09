/**
 * @vitest-environment jsdom
 */
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { ChangesSummary } from '@/app/routes/chat-with-ai/components/changes-summary';
import { Change } from '@/features/chat/lib/resources/change-summary';
import { chatPanelUtils } from '@/features/workspace/lib/chat-panel-open';

vi.mock('i18next', () => ({
  t: (key: string, values?: Record<string, unknown>) =>
    key
      .replace(
        '{count, plural, one {# thing} other {# things}}',
        `${String(values?.count)} things`
      )
      .replace('{name}', String(values?.name)),
}));
vi.mock('@/features/workspace/lib/chat-panel-open', () => ({
  chatPanelUtils: { openBeside: vi.fn() },
}));
vi.mock('@/lib/authentication-session', () => ({
  authenticationSession: {
    getProjectId: () => 'p1',
    appendProjectRoutePrefix: (path: string) => `/projects/p1${path}`,
  },
}));

afterEach(() => {
  cleanup();
  vi.mocked(chatPanelUtils.openBeside).mockClear();
});

describe('ChangesSummary', () => {
  it('lists each changed resource under one heading', () => {
    renderSummary([LEADS, REPORT]);
    const list = screen.getByRole('list', { name: 'Changed 2 things:' });
    expect(list.children).toHaveLength(2);
    expect(screen.getByRole('link', { name: 'Leads table' })).toBeTruthy();
    expect(
      screen.getByRole('link', { name: 'Daily report flow New' })
    ).toBeTruthy();
  });

  it('opens a resource beside the chat on a plain click', () => {
    renderSummary([LEADS]);
    fireEvent.click(screen.getByRole('link', { name: 'Leads table' }));
    expect(chatPanelUtils.openBeside).toHaveBeenCalledWith({
      route: '/projects/p1/tables/t1',
      push: true,
      name: 'Leads table',
    });
  });

  it('shows a deleted resource without a link', () => {
    renderSummary([{ ...LEADS, kind: 'deleted' }]);
    expect(screen.queryByRole('link')).toBeNull();
    expect(screen.getByText('Deleted')).toBeTruthy();
  });

  it('renders nothing when the reply changed nothing', () => {
    const { container } = renderSummary([]);
    expect(container.innerHTML).toBe('');
  });
});

function renderSummary(changes: Change[]) {
  return render(
    <MemoryRouter>
      <ChangesSummary changes={changes} />
    </MemoryRouter>
  );
}

const LEADS: Change = {
  key: 'table:t1',
  ref: { kind: 'table', id: 't1', projectId: 'p1', name: 'Leads' },
  kind: 'updated',
};

const REPORT: Change = {
  key: 'flow:f1',
  ref: { kind: 'flow', id: 'f1', projectId: 'p1', name: 'Daily report' },
  kind: 'created',
};
