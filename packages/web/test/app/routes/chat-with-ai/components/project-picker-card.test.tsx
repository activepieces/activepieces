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

describe('ProjectPickerCard (characterization)', () => {
  it('resolves with the project id and name when a suggestion is picked', () => {
    const { onResolve } = renderPicker();

    fireEvent.click(screen.getByRole('radio', { name: /Sales/ }));
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

  it('does not submit on Enter while an IME is composing', () => {
    const { onResolve } = renderPicker();
    const input = screen.getByPlaceholderText('Type your answer...');

    fireEvent.change(input, { target: { value: 'にほん' } });
    fireEvent.keyDown(input, { key: 'Enter', isComposing: true });

    expect(onResolve).not.toHaveBeenCalled();
  });

  it('has no header Close button', () => {
    renderPicker();

    expect(screen.queryByRole('button', { name: 'Close' })).toBeNull();
  });

  it('lists the current project first, preselected and labelled', () => {
    const { onResolve } = renderPicker();
    const radios = screen.getAllByRole('radio');

    expect(radios[0].textContent).toContain('HR');
    expect(radios[0].textContent).toContain('Current project');
    expect(radios[0].getAttribute('aria-checked')).toBe('true');
    fireEvent.click(screen.getByRole('button', { name: 'Continue' }));
    expect(onResolve).toHaveBeenCalledWith({
      projectId: 'p-hr',
      projectName: 'HR',
    });
  });

  it('shows all projects in one list without a Show all step', () => {
    renderPicker();

    expect(screen.getAllByRole('radio')).toHaveLength(4);
    expect(screen.queryByText(/Show all/)).toBeNull();
  });

  it('shows the answered state with the project name when not interactive', () => {
    renderPicker({ isInteractive: false, selectedProjectId: 'p-ops' });

    expect(screen.getByText('· Ops')).toBeTruthy();
    expect(screen.queryByPlaceholderText('Type your answer...')).toBeNull();
  });
});

function renderPicker({
  isInteractive,
  selectedProjectId,
}: {
  isInteractive?: boolean;
  selectedProjectId?: string;
} = {}) {
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
      isInteractive={isInteractive}
      selectedProjectId={selectedProjectId}
    />,
  );
  return { onResolve, onDismiss };
}
