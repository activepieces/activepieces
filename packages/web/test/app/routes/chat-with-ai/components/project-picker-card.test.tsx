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
  ApProjectDisplay: ({ title }: { title: string }) => <span>{title}</span>,
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

    fireEvent.click(screen.getByRole('menuitemradio', { name: 'Sales' }));

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

  it('today submits on Enter while an IME is composing (no guard yet; P4b adds one and flips this)', () => {
    const { onResolve } = renderPicker();
    const input = screen.getByPlaceholderText('Type your answer...');

    fireEvent.change(input, { target: { value: 'にほん' } });
    fireEvent.keyDown(input, { key: 'Enter', isComposing: true });

    expect(onResolve).toHaveBeenCalledWith({ projectName: 'にほん' });
  });

  it('today has a header Close button that calls onDismiss (P4b removes the X)', () => {
    const { onDismiss } = renderPicker();

    fireEvent.click(screen.getByRole('button', { name: 'Close' }));

    expect(onDismiss).toHaveBeenCalledTimes(1);
  });

  it('shows the answered state with the project name when not interactive', () => {
    renderPicker({ isInteractive: false, selectedProjectId: 'p-ops' });

    expect(screen.getByText('→ Ops')).toBeTruthy();
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
