/**
 * @vitest-environment jsdom
 */
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { ProjectPickerCard } from '@/app/routes/chat-with-ai/components/project-picker-card';

const projects = vi.hoisted(() => [
  { id: 'p-marketing', displayName: 'Marketing', type: 'TEAM', ownerId: 'u1' },
  { id: 'p-sales', displayName: 'Sales', type: 'TEAM', ownerId: 'u1' },
  { id: 'p-ops', displayName: 'Ops', type: 'TEAM', ownerId: 'u1' },
  { id: 'p-hr', displayName: 'HR', type: 'TEAM', ownerId: 'u1' },
]);

vi.mock('i18next', () => ({
  t: (key: string, params?: Record<string, string>) =>
    key.replace(/\{(\w+)\}/g, (match, name: string) => params?.[name] ?? match),
}));
vi.mock('@/features/projects', () => ({
  projectCollectionUtils: { useAll: () => ({ data: projects }) },
  getProjectName: (project: { displayName: string }) => project.displayName,
  ApProjectDisplay: () => null,
}));
vi.mock('@/lib/authentication-session', () => ({
  authenticationSession: { getProjectId: () => 'p-hr' },
}));
vi.mock('@/hooks/user-hooks', () => ({
  userHooks: { useCurrentUser: () => ({ data: { id: 'u1' } }) },
}));

afterEach(() => {
  cleanup();
});

describe('ProjectPickerCard', () => {
  it('resolves with the project id and name when a suggestion is picked', () => {
    const { onResolve } = renderPicker();

    fireEvent.click(screen.getByRole('option', { name: /Sales/ }));
    fireEvent.click(screen.getByRole('button', { name: 'Continue' }));

    expect(onResolve).toHaveBeenCalledTimes(1);
    expect(onResolve).toHaveBeenCalledWith({
      projectId: 'p-sales',
      projectName: 'Sales',
    });
  });

  it('resolves with only the typed name when the user writes their own', () => {
    const { onResolve } = renderPicker();
    const input = screen.getByPlaceholderText('Type your answer...');

    fireEvent.change(input, { target: { value: '  New project  ' } });
    fireEvent.keyDown(input, { key: 'Enter' });

    expect(onResolve).toHaveBeenCalledTimes(1);
    expect(onResolve).toHaveBeenCalledWith({ projectName: 'New project' });
  });

  it('calls onDismiss on Skip', () => {
    const { onResolve, onDismiss } = renderPicker();

    fireEvent.click(screen.getByRole('button', { name: 'Skip' }));

    expect(onDismiss).toHaveBeenCalledTimes(1);
    expect(onResolve).not.toHaveBeenCalled();
  });

  it('resolves with the first suggestion when nothing is picked', () => {
    const { onResolve } = renderPicker();

    fireEvent.click(screen.getByRole('button', { name: 'Continue' }));
    expect(onResolve).toHaveBeenCalledWith({
      projectId: 'p-marketing',
      projectName: 'Marketing',
    });
  });
});

function renderPicker() {
  const onResolve = vi.fn();
  const onDismiss = vi.fn();
  render(
    <ProjectPickerCard
      picker={{
        suggestedProjects: [
          { id: 'p-marketing', name: 'Marketing' },
          { id: 'p-sales', name: 'Sales' },
        ],
      }}
      onResolve={onResolve}
      onDismiss={onDismiss}
    />,
  );
  return { onResolve, onDismiss };
}
