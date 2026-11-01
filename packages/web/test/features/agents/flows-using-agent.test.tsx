/**
 * @vitest-environment jsdom
 */
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';

import { FlowsUsingAgent } from '@/features/agents/delete-agent-dialog';

vi.mock('i18next', () => ({ t: (key: string) => key }));

describe('FlowsUsingAgent', () => {
  it('links each flow in the agent’s own project', () => {
    renderUsage({
      total: 2,
      names: ['Lead triage', 'Weekly report'],
      flows: [
        { id: 'flow-1', displayName: 'Lead triage' },
        { id: 'flow-2', displayName: 'Weekly report' },
      ],
    });

    expect(
      screen.getByRole('link', { name: 'Lead triage' }).getAttribute('href'),
    ).toBe('/projects/agent-project/flows/flow-1');
    expect(
      screen.getByRole('link', { name: 'Weekly report' }).getAttribute('href'),
    ).toBe('/projects/agent-project/flows/flow-2');
  });

  it('shows only the count to someone who cannot read flows', () => {
    renderUsage({ total: 3, names: [], flows: [] });

    expect(screen.queryAllByRole('link')).toHaveLength(0);
    expect(screen.getByText('agentStillUsedUnnamed')).toBeTruthy();
  });
});

function renderUsage(usage: {
  total: number;
  names: string[];
  flows: { id: string; displayName: string }[];
}) {
  return render(
    <MemoryRouter initialEntries={['/projects/current-project/agents']}>
      <FlowsUsingAgent usage={usage} projectId="agent-project" />
    </MemoryRouter>,
  );
}
